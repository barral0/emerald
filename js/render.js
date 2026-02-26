/* =============================================================
   render.js — Sidebar and preview rendering
   ============================================================= */
import { state } from './state.js';
import { escapeHtml, formatDate, sortItems } from './utils.js';
import { persist, autoSave } from './persistence.js';
import { getActiveItem, getActiveNote, moveItem } from './files.js';
import { showContextMenu } from './menus.js';

/* marked.js and DOMPurify are loaded globally via <script> tags */

const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const wordCountEl = document.getElementById('word-count');
const fileListEl = document.getElementById('file-list');
const noteTitleInput = document.getElementById('note-title');

// ── Image reference resolver ─────────────────────────────────
function resolveImageRefs(md) {
    return md.replace(/!\[([^\]]*)\]\(img:\/\/([^)\s]+)(?:\s*=(\d+)x)?\)/g, (_, alt, imgId, w) => {
        const src = state.imageStore[imgId];
        if (!src) return `![${alt} (image not found)]()`;
        const sizeAttr = w ? ` width="${w}"` : '';
        return `<img src="${src}" alt="${alt}"${sizeAttr} style="max-width:100%">`;
    });
}

// ── Preview and word count ────────────────────────────────────
export function updatePreview() {
    const md = editor.value;
    const resolved = resolveImageRefs(md);
    const clean = DOMPurify.sanitize(marked.parse(resolved));
    preview.innerHTML = clean;

    const wordCount = md.trim() ? (md.trim().match(/\S+/g) || []).length : 0;
    wordCountEl.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
}

// ── Load active item into editor ─────────────────────────────
export async function loadActiveItem() {
    const item = getActiveItem();
    if (!item) return;
    noteTitleInput.value = item.title;
    if (item.type === 'file') {
        if (window.electronAPI && item.fsPath && typeof item.content === 'undefined') {
            item.content = await window.electronAPI.readFile(item.fsPath) || '';
        }

        // Trigger smooth linear animation on note load
        editor.style.animation = 'none';
        preview.style.animation = 'none';
        void editor.offsetWidth; // force reflow
        void preview.offsetWidth;
        editor.style.animation = 'smoothFade 0.25s linear';
        preview.style.animation = 'smoothFade 0.25s linear';

        editor.value = item.content ?? '';
        updatePreview();
    }
    if (!window.electronAPI) persist();
}

// ── Build sidebar tree ────────────────────────────────────────
export function renderSidebar() {
    fileListEl.innerHTML = '';
    sortItems(state.items.filter(i => i.parentId === null))
        .forEach(item => fileListEl.appendChild(createTreeNode(item)));
}

function createTreeNode(item) {
    const li = document.createElement('li');
    li.className = 'tree-node';
    li.appendChild(item.type === 'folder' ? buildFolderEl(item) : buildFileEl(item));
    return li;
}

function buildFolderEl(item) {
    const wrapper = document.createDocumentFragment();

    const row = document.createElement('div');
    row.className = ['folder-item', item.isOpen ? 'open' : '', item.id === state.currentItemId ? 'active' : ''].join(' ').trim();
    row.dataset.id = item.id;
    row.draggable = true;

    row.innerHTML = `
        <span class="folder-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </span>
        <span class="folder-item-title">${escapeHtml(item.title)}</span>`;

    row.addEventListener('click', e => {
        e.stopPropagation();
        if (state.currentItemId === item.id) {
            item.isOpen = !item.isOpen;
        } else {
            state.currentItemId = item.id;
            item.isOpen = true;
        }
        noteTitleInput.value = item.title;
        autoSave();
        renderSidebar();
    });

    row.addEventListener('contextmenu', e => showContextMenu(e, item.id));

    row.addEventListener('dragstart', e => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', item.id);
        row.classList.add('dragging');
    });
    row.addEventListener('dragend', () => row.classList.remove('dragging'));
    row.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); row.classList.add('drop-target'); });
    row.addEventListener('dragleave', () => row.classList.remove('drop-target'));
    row.addEventListener('drop', e => {
        e.preventDefault(); e.stopPropagation();
        row.classList.remove('drop-target');
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== item.id) moveItem(draggedId, item.id);
    });

    const childrenUl = document.createElement('ul');
    childrenUl.className = 'folder-children' + (item.isOpen ? ' open' : '');
    sortItems(state.items.filter(c => c.parentId === item.id))
        .forEach(child => childrenUl.appendChild(createTreeNode(child)));

    wrapper.appendChild(row);
    wrapper.appendChild(childrenUl);
    return wrapper;
}

function buildFileEl(item) {
    const div = document.createElement('div');
    div.className = 'file-item' + (item.id === state.currentItemId ? ' active' : '');
    div.dataset.id = item.id;
    div.draggable = true;

    div.innerHTML = `
        <div class="file-item-title">${escapeHtml(item.title)}</div>
        <div class="file-item-date">${formatDate(item.lastModified)}</div>`;

    div.addEventListener('click', e => {
        e.stopPropagation();
        state.currentItemId = item.id;
        loadActiveItem();
        renderSidebar();
    });

    div.addEventListener('contextmenu', e => showContextMenu(e, item.id));

    div.addEventListener('dragstart', e => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', item.id);
        div.classList.add('dragging');
    });
    div.addEventListener('dragend', () => div.classList.remove('dragging'));

    return div;
}
