/* =============================================================
   files.js — File and folder CRUD operations
   ============================================================= */
import { state } from './state.js';
import { generateId } from './utils.js';
import { persist, autoSave } from './persistence.js';
import { renderSidebar, loadActiveItem } from './render.js';
import { confirmDelete } from './dialogs.js';
import { t } from './i18n.js';

const noteTitleInput = document.getElementById('note-title');

// ── Accessors ────────────────────────────────────────────────
export const getItem = id => state.items.find(i => i.id === id);
export const getActiveItem = () => getItem(state.currentItemId) || state.items.find(i => i.type === 'file');
export const getActiveNote = () => {
    const item = getActiveItem();
    return item?.type === 'file' ? item : state.items.find(i => i.type === 'file');
};

export function getUniqueTitle(baseTitle, parentId, isFile = true, excludeId = null) {
    let title = baseTitle;
    let counter = 1;
    const extension = isFile ? '.md' : '';
    const nameOnly = isFile && title.toLowerCase().endsWith('.md') ? title.slice(0, -3) : title;

    while (state.items.some(i => i.parentId === parentId && i.title === title && i.id !== excludeId)) {
        title = `${nameOnly} ${counter}${extension}`;
        counter++;
    }
    return title;
}

// ── Create ───────────────────────────────────────────────────
export async function createNote(parentId = null) {
    const title = getUniqueTitle(t('header.untitled') + '.md', parentId, true);
    const note = {
        id: generateId(), type: 'file', parentId,
        title, content: '', lastModified: Date.now(),
    };

    if (window.electronAPI) {
        if (!note.parentId && state.items.some(i => i.id === 'fs-root')) {
            note.parentId = 'fs-root';
        }

        const parent = state.items.find(i => i.id === note.parentId);
        if (parent && parent.fsPath) {
            note.fsPath = await window.electronAPI.joinPath(parent.fsPath, note.title);
            await window.electronAPI.writeFile(note.fsPath, note.content);
        }
    }

    state.items.push(note);
    state.currentItemId = note.id;
    await loadActiveItem();
    renderSidebar();
    noteTitleInput.focus();
    noteTitleInput.select();
}

export async function createFolder() {
    // Determine parent context: if root exists, use it as default
    const root = state.items.find(i => i.id === 'fs-root');
    const parentId = root ? 'fs-root' : null;

    const title = getUniqueTitle(t('sidebar.new_folder'), parentId, false);
    const folder = {
        id: generateId(), type: 'folder', parentId,
        title, isOpen: true, lastModified: Date.now(),
    };

    if (window.electronAPI) {
        const root = state.items.find(i => i.id === 'fs-root');
        if (root && root.fsPath) {
            folder.fsPath = await window.electronAPI.joinPath(root.fsPath, folder.title);
            await window.electronAPI.mkdir(folder.fsPath);
        }
    }

    state.items.push(folder);
    state.currentItemId = folder.id;
    autoSave();
    renderSidebar();
    noteTitleInput.value = folder.title;
    noteTitleInput.focus();
    noteTitleInput.select();
}

// ── Delete ───────────────────────────────────────────────────
export async function deleteCurrentItem() {
    const item = getActiveItem();
    if (!item) return;

    const isFolder = item.type === 'folder';
    const msg = isFolder
        ? t('msg.delete_folder', item.title)
        : t('msg.delete_note', item.title);

    const confirmed = await confirmDelete(msg);
    if (!confirmed) return;

    if (window.electronAPI && item.fsPath) {
        if (item.id === 'fs-root') return; // protect root
        await window.electronAPI.deleteItem(item.fsPath);
    }

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
    await loadActiveItem();
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
export async function moveItem(itemId, targetParentId) {
    const item = getItem(itemId);
    if (!item) return;
    if (item.type === 'folder' && isDescendantOf(targetParentId, itemId)) return;

    const uniqueTitle = getUniqueTitle(item.title, targetParentId, item.type === 'file', item.id);
    item.title = uniqueTitle;

    if (window.electronAPI && item.fsPath) {
        const targetParent = getItem(targetParentId);
        if (targetParent && targetParent.fsPath) {
            const newFsPath = await window.electronAPI.joinPath(targetParent.fsPath, uniqueTitle);
            await window.electronAPI.renameItem(item.fsPath, newFsPath);
            item.fsPath = newFsPath;
        }
    }

    item.parentId = targetParentId;
    item.lastModified = Date.now();
    autoSave();
    renderSidebar();
}

// ── Rename ───────────────────────────────────────────────────
export async function renameItem(itemId, newTitle) {
    const item = getItem(itemId);
    if (!item || item.id === 'fs-root') return;

    let title = newTitle.trim() || t('header.untitled');
    if (item.type === 'file' && !title.toLowerCase().endsWith('.md')) title += '.md';
    if (item.title === title) return;

    title = getUniqueTitle(title, item.parentId, item.type === 'file', item.id);

    if (window.electronAPI && item.fsPath && item.title !== title) {
        try {
            const parentDir = item.fsPath.substring(0, item.fsPath.lastIndexOf(window.electronAPI.sep || (item.fsPath.includes('/') ? '/' : '\\')));
            const newFsPath = await window.electronAPI.joinPath(parentDir, title);
            await window.electronAPI.renameItem(item.fsPath, newFsPath);
            item.fsPath = newFsPath;
        } catch (err) {
            console.error('Failed to rename local object:', err);
        }
    }

    item.title = title;
    item.lastModified = Date.now();
    autoSave();

    // update header title if it's the active item
    if (state.currentItemId === itemId && window.noteTitleInput) {
        window.noteTitleInput.value = title;
    }
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
