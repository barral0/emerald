/* =============================================================
   files.js — File and folder CRUD operations
   ============================================================= */
import { state } from './state.js';
import { generateId } from './utils.js';
import { persist, autoSave } from './persistence.js';
import { renderSidebar, loadActiveItem } from './render.js';
import { t } from './i18n.js';

const noteTitleInput = document.getElementById('note-title');

// ── Accessors ────────────────────────────────────────────────
export const getItem = id => state.items.find(i => i.id === id);
export const getActiveItem = () => getItem(state.currentItemId) || state.items.find(i => i.type === 'file');
export const getActiveNote = () => {
    const item = getActiveItem();
    return item?.type === 'file' ? item : state.items.find(i => i.type === 'file');
};

// ── Create ───────────────────────────────────────────────────
export function createNote(parentId = null) {
    const note = {
        id: generateId(), type: 'file', parentId,
        title: t('header.untitled') + '.md', content: '', lastModified: Date.now(),
    };
    state.items.push(note);
    state.currentItemId = note.id;
    loadActiveItem();
    renderSidebar();
    noteTitleInput.focus();
    noteTitleInput.select();
}

export function createFolder() {
    const folder = {
        id: generateId(), type: 'folder', parentId: null,
        title: t('sidebar.new_folder'), isOpen: true, lastModified: Date.now(),
    };
    state.items.push(folder);
    state.currentItemId = folder.id;
    autoSave();
    renderSidebar();
    noteTitleInput.value = folder.title;
    noteTitleInput.focus();
    noteTitleInput.select();
}

// ── Delete ───────────────────────────────────────────────────
export function deleteCurrentItem() {
    const item = getActiveItem();
    if (!item) return;

    const isFolder = item.type === 'folder';
    const msg = isFolder
        ? t('msg.delete_folder', item.title)
        : t('msg.delete_note', item.title);

    if (!confirm(msg)) return;

    if (isFolder) {
        const toDelete = collectDescendants(item.id);
        state.items = state.items.filter(i => !toDelete.has(i.id));
    } else {
        if (state.items.filter(i => i.type === 'file').length <= 1) {
            alert(t('msg.cannot_delete_last'));
            return;
        }
        state.items = state.items.filter(i => i.id !== item.id);
    }

    const nextFile = state.items.find(i => i.type === 'file');
    state.currentItemId = nextFile?.id ?? null;
    loadActiveItem();
    renderSidebar();
    autoSave();
}

function collectDescendants(folderId) {
    const ids = new Set([folderId]);
    const walk = pid => state.items.filter(i => i.parentId === pid).forEach(child => {
        ids.add(child.id);
        if (child.type === 'folder') walk(child.id);
    });
    walk(folderId);
    return ids;
}

// ── Move ─────────────────────────────────────────────────────
export function moveItem(itemId, targetParentId) {
    const item = getItem(itemId);
    if (!item) return;
    if (item.type === 'folder' && isDescendantOf(targetParentId, itemId)) return;
    item.parentId = targetParentId;
    item.lastModified = Date.now();
    autoSave();
    renderSidebar();
}

function isDescendantOf(potentialChildId, ancestorId) {
    if (!potentialChildId) return false;
    if (potentialChildId === ancestorId) return true;
    const parent = getItem(potentialChildId);
    return parent ? isDescendantOf(parent.parentId, ancestorId) : false;
}

// ── Download ─────────────────────────────────────────────────
export function downloadNote() {
    const note = getActiveNote();
    if (!note) return;
    const blob = new Blob([note.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: note.title });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
}
