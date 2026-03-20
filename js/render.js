/* =============================================================
   render.js — Sidebar and preview rendering + multi-selection
   ============================================================= */
import { state } from './state.js';
import { escapeHtml, formatDate, sortItems } from './utils.js';
import { persist, autoSave } from './persistence.js';
import { getActiveItem, getActiveNote, moveItem, renameItem } from './files.js';
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
    let md = editor.value;

    // --- Hugo Support ---
    // Format YAML front-matter as a code block
    md = md.replace(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/, '```yaml\n$1\n```\n');
    // Format TOML front-matter as a code block
    md = md.replace(/^\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+(\r?\n|$)/, '```toml\n$1\n```\n');
    // Escape Hugo shortcodes so DOMPurify doesn't strip them as unknown HTML tags
    md = md.replace(/\{\{([<%])([\s\S]*?)([>%])\}\}/g, (match) => {
        return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    });
    // --------------------

    const resolved = resolveImageRefs(md);
    const clean = DOMPurify.sanitize(marked.parse(resolved));
    preview.innerHTML = clean;

    const wordCount = md.trim() ? (md.trim().match(/\S+/g) || []).length : 0;
    wordCountEl.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
}

// ── Load active item into editor ─────────────────────────────
const editorPane = document.querySelector('.editor-pane');
const previewPane = document.querySelector('.preview-pane');

function showFolderPlaceholder(item) {
    editor.style.display = 'none';
    preview.style.display = 'none';
    // Show a subtle folder placeholder in the preview pane
    let ph = document.getElementById('folder-placeholder');
    if (!ph) {
        ph = document.createElement('div');
        ph.id = 'folder-placeholder';
        ph.className = 'folder-placeholder';
        previewPane?.appendChild(ph);
    }
    ph.style.display = 'flex';
    ph.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.25;">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
        </svg>
        <p style="opacity:0.35; font-size:0.85rem; margin-top:12px;">${item.title}</p>`;
}

function hideFolderPlaceholder() {
    const ph = document.getElementById('folder-placeholder');
    if (ph) ph.style.display = 'none';
    editor.style.display = 'block';
    preview.style.display = 'block';
}

export async function loadActiveItem() {
    const item = getActiveItem();
    if (!item) return;

    // ── Folder: lock title input, show placeholder ────────────
    if (item.type === 'folder') {
        noteTitleInput.value = item.title;
        noteTitleInput.readOnly = true;
        noteTitleInput.style.opacity = '0.45';
        noteTitleInput.style.cursor = 'default';
        showFolderPlaceholder(item);
        return;
    }

    // ── File/Image: normal editable title ────────────────────
    noteTitleInput.readOnly = false;
    noteTitleInput.style.opacity = '';
    noteTitleInput.style.cursor = '';
    hideFolderPlaceholder();

    let displayTitle = item.title;
    if (item.type === 'file' && displayTitle.toLowerCase().endsWith('.md')) {
        displayTitle = displayTitle.slice(0, -3);
    }
    noteTitleInput.value = displayTitle;

    // Trigger smooth linear animation on note load
    editor.style.animation = 'none';
    preview.style.animation = 'none';
    void editor.offsetWidth; // force reflow
    void preview.offsetWidth;
    editor.style.animation = 'smoothFade 0.25s linear';
    preview.style.animation = 'smoothFade 0.25s linear';

    if (item.type === 'file') {
        if (window.electronAPI && item.fsPath && typeof item.content === 'undefined') {
            item.content = await window.electronAPI.readFile(item.fsPath) || '';
        }
        editor.style.display = 'block';
        preview.style.display = 'block';
        editor.value = item.content ?? '';
        updatePreview();
    } else if (item.type === 'image') {
        const imgSrc = item.fsPath ? `file://${item.fsPath.replace(/\\/g, '/')}` : '';
        editor.style.display = 'none';
        preview.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><img src="${imgSrc}" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;"></div>`;
    }

    if (!window.electronAPI) persist();
}


// ── Multi-select helpers ──────────────────────────────────────
let _lastClickedId = null;   // for Shift+Click range

function getFlatOrderedIds() {
    // Returns all visible item IDs in sidebar DOM order
    return [...fileListEl.querySelectorAll('[data-id]')].map(el => el.dataset.id);
}

function selectRange(fromId, toId) {
    const ordered = getFlatOrderedIds();
    const a = ordered.indexOf(fromId);
    const b = ordered.indexOf(toId);
    if (a === -1 || b === -1) return;
    const [start, end] = a < b ? [a, b] : [b, a];
    for (let i = start; i <= end; i++) {
        state.selectedIds.add(ordered[i]);
    }
}

function handleItemClick(e, itemId) {
    if (e.ctrlKey || e.metaKey) {
        // Ctrl+Click: toggle this item in selection
        if (state.selectedIds.has(itemId)) {
            state.selectedIds.delete(itemId);
        } else {
            state.selectedIds.add(itemId);
        }
        _lastClickedId = itemId;
    } else if (e.shiftKey && _lastClickedId) {
        // Shift+Click: range select
        state.selectedIds.add(_lastClickedId);
        selectRange(_lastClickedId, itemId);
    } else {
        // Normal click: clear multi-selection
        state.selectedIds.clear();
        _lastClickedId = itemId;
    }
    updateSelectionBar();
    updateSelectionStyles();
}

function updateSelectionStyles() {
    fileListEl.querySelectorAll('[data-id]').forEach(el => {
        el.classList.toggle('multi-selected', state.selectedIds.has(el.dataset.id));
    });
}

// ── Selection bar ─────────────────────────────────────────────
let selBar = null;

function ensureSelBar() {
    if (selBar) return selBar;
    selBar = document.getElementById('multi-select-bar');
    if (!selBar) {
        selBar = document.createElement('div');
        selBar.id = 'multi-select-bar';
        selBar.className = 'multi-select-bar';
        selBar.innerHTML = `
            <span class="msel-count" id="msel-count"></span>
            <button class="msel-btn danger" id="msel-delete-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Excluir
            </button>
            <button class="msel-btn ghost" id="msel-clear-btn" aria-label="Limpar seleção">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>`;
        document.getElementById('app-sidebar').appendChild(selBar);

        document.getElementById('msel-delete-btn').addEventListener('click', deleteSelected);
        document.getElementById('msel-clear-btn').addEventListener('click', clearSelection);
    }
    return selBar;
}

export function clearSelection() {
    state.selectedIds.clear();
    _lastClickedId = null;
    updateSelectionBar();
    updateSelectionStyles();
}

function updateSelectionBar() {
    const bar = ensureSelBar();
    const count = state.selectedIds.size;
    if (count > 1) {
        bar.classList.add('visible');
        document.getElementById('msel-count').textContent = `${count} selecionados`;
    } else {
        bar.classList.remove('visible');
    }
}

async function deleteSelected() {
    const { confirmDelete } = await import('./dialogs.js');
    const { t } = await import('./i18n.js');
    const ids = [...state.selectedIds].filter(id => id !== 'fs-root');
    if (ids.length === 0) return;

    const confirmed = await confirmDelete(`Excluir ${ids.length} item(s) selecionado(s)?`);
    if (!confirmed) return;

    for (const id of ids) {
        const item = state.items.find(i => i.id === id);
        if (!item) continue;
        if (window.electronAPI && item.fsPath) {
            await window.electronAPI.deleteItem(item.fsPath);
        }
        if (item.type === 'folder') {
            // collect all descendants and remove
            const toDelete = new Set([id]);
            const walk = pid => state.items.filter(i => i.parentId === pid).forEach(c => {
                toDelete.add(c.id);
                if (c.type === 'folder') walk(c.id);
            });
            walk(id);
            state.items = state.items.filter(i => !toDelete.has(i.id));
        } else {
            state.items = state.items.filter(i => i.id !== id);
        }
    }

    state.selectedIds.clear();
    const next = state.items.find(i => i.type === 'file');
    state.currentItemId = next?.id ?? null;
    await loadActiveItem();
    renderSidebar();
    autoSave();
}

// ── Tags engine ───────────────────────────────────────────────
const TAG_REGEX = /(?:^|\s)#([a-zA-Z0-9_\u00C0-\u024F\-]+)/g;

function extractTags(content) {
    const tags = new Set();
    if (!content) return tags;
    let m;
    TAG_REGEX.lastIndex = 0;
    while ((m = TAG_REGEX.exec(content)) !== null) {
        // Ignore common markdown heading patterns like `# Title`
        // Those won't match since the regex requires the tag to start after whitespace or start-of-string
        tags.add(m[1].toLowerCase());
    }
    return tags;
}

function buildTagsIndex() {
    const index = {};
    for (const item of state.items) {
        if (item.type !== 'file') continue;
        const tags = extractTags(item.content);
        for (const tag of tags) {
            if (!index[tag]) index[tag] = [];
            index[tag].push(item.id);
        }
    }
    state.tagsIndex = index;
}

const sidebarTagsEl = document.getElementById('sidebar-tags');
const sidebarTagsListEl = document.getElementById('sidebar-tags-list');
const tagFilterBadge = document.getElementById('tag-filter-badge');
const tagFilterLabel = document.getElementById('tag-filter-label');
const tagFilterClear = document.getElementById('tag-filter-clear');

tagFilterClear?.addEventListener('click', () => {
    state.activeTagFilter = null;
    renderSidebar();
});

function renderTagsCloud() {
    const tags = Object.keys(state.tagsIndex).sort();

    if (tags.length === 0) {
        sidebarTagsEl.style.display = 'none';
        return;
    }

    sidebarTagsEl.style.display = 'block';
    sidebarTagsListEl.innerHTML = '';

    for (const tag of tags) {
        const count = state.tagsIndex[tag].length;
        const pill = document.createElement('span');
        pill.className = 'tag-pill' + (state.activeTagFilter === tag ? ' active' : '');
        pill.innerHTML = `#${tag} <span class="tag-count">${count}</span>`;
        pill.addEventListener('click', () => {
            if (state.activeTagFilter === tag) {
                state.activeTagFilter = null;
            } else {
                state.activeTagFilter = tag;
            }
            renderSidebar();
        });
        sidebarTagsListEl.appendChild(pill);
    }

    // Update filter badge
    if (state.activeTagFilter) {
        tagFilterBadge.style.display = 'flex';
        tagFilterLabel.textContent = `#${state.activeTagFilter}`;
    } else {
        tagFilterBadge.style.display = 'none';
    }
}

// Collect all descendant file IDs from a folder
function getDescendantFileIds(folderId) {
    const ids = new Set();
    for (const item of state.items) {
        if (item.parentId === folderId) {
            if (item.type === 'file') ids.add(item.id);
            else if (item.type === 'folder') {
                for (const childId of getDescendantFileIds(item.id)) ids.add(childId);
            }
        }
    }
    return ids;
}

// ── Build sidebar tree ────────────────────────────────────────
export function renderSidebar() {
    fileListEl.innerHTML = '';

    // Rebuild tags index
    buildTagsIndex();
    renderTagsCloud();

    // Determine which file IDs match the active tag filter
    let matchingFileIds = null;
    if (state.activeTagFilter && state.tagsIndex[state.activeTagFilter]) {
        matchingFileIds = new Set(state.tagsIndex[state.activeTagFilter]);
    }

    const fsRoot = state.items.find(i => i.id === 'fs-root');

    if (fsRoot) {
        sortItems(state.items.filter(i => i.parentId === 'fs-root'))
            .forEach(item => {
                const node = createTreeNode(item, matchingFileIds);
                if (node) fileListEl.appendChild(node);
            });
    } else {
        sortItems(state.items.filter(i => i.parentId === null))
            .forEach(item => {
                const node = createTreeNode(item, matchingFileIds);
                if (node) fileListEl.appendChild(node);
            });
    }

    updateSelectionBar();
    updateSelectionStyles();
}

function createTreeNode(item, matchingFileIds) {
    // If filter active, skip non-matching files
    if (matchingFileIds) {
        if (item.type === 'file' && !matchingFileIds.has(item.id)) return null;
        if (item.type === 'image' && !matchingFileIds.has(item.id)) return null;
        if (item.type === 'folder') {
            // Only show folder if it has at least one matching descendant
            const descendants = getDescendantFileIds(item.id);
            const hasMatch = [...descendants].some(id => matchingFileIds.has(id));
            if (!hasMatch) return null;
        }
    }
    const li = document.createElement('li');
    li.className = 'tree-node';
    li.appendChild(item.type === 'folder' ? buildFolderEl(item, matchingFileIds) : buildFileEl(item));
    return li;
}

function buildFolderEl(item, matchingFileIds) {
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
        handleItemClick(e, item.id);
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            if (state.currentItemId === item.id) {
                item.isOpen = !item.isOpen;
            } else {
                state.currentItemId = item.id;
                item.isOpen = true;
            }
            autoSave();
            loadActiveItem(); // triggers folder placeholder + read-only title
        }
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
        .forEach(child => {
            const node = createTreeNode(child, matchingFileIds);
            if (node) childrenUl.appendChild(node);
        });

    wrapper.appendChild(row);
    wrapper.appendChild(childrenUl);
    return wrapper;
}

function buildFileEl(item) {
    const div = document.createElement('div');
    const typeClass = item.type === 'image' ? 'image-item' : 'file-item';
    div.className = `${typeClass}` + (item.id === state.currentItemId ? ' active' : '');
    div.dataset.id = item.id;
    div.draggable = true;

    // Visual queue for image files vs text files
    const iconSvg = item.type === 'image'
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.6;margin-right:2px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.6;margin-right:2px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;

    let displayTitle = item.title;
    if (item.type === 'file' && displayTitle.toLowerCase().endsWith('.md')) {
        displayTitle = displayTitle.slice(0, -3);
    }

    div.innerHTML = `
        <div style="display:flex;align-items:center;width:100%;">
            ${iconSvg}
            <div class="file-item-title" style="margin-left:4px;">${escapeHtml(displayTitle)}</div>
        </div>
        <div class="file-item-date">${formatDate(item.lastModified)}</div>`;

    div.addEventListener('click', e => {
        e.stopPropagation();
        handleItemClick(e, item.id);
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            state.currentItemId = item.id;
            loadActiveItem();
        }
        renderSidebar();
    });

    div.addEventListener('contextmenu', e => showContextMenu(e, item.id));

    div.addEventListener('dragstart', e => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', item.id);
        div.classList.add('dragging');
    });
    div.addEventListener('dragend', () => div.classList.remove('dragging'));

    // Support double click inline rename? Or just via F2/context-menu.

    return div;
}

// ── Inline Rename ────────────────────────────────────────────
window.startInlineRename = function (itemId) {
    const item = state.items.find(i => i.id === itemId);
    if (!item || item.id === 'fs-root') return;

    const row = document.querySelector(`[data-id="${itemId}"]`);
    if (!row) return;

    const titleSpan = row.querySelector(item.type === 'folder' ? '.folder-item-title' : '.file-item-title');
    if (!titleSpan) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'inline-rename-input';
    // Remove .md extension for display during editing
    let displayVal = item.title;
    if (item.type === 'file' && displayVal.toLowerCase().endsWith('.md')) {
        displayVal = displayVal.slice(0, -3);
    }
    input.value = displayVal;

    // Minimal reset to match span visually
    input.style.width = '100%';
    input.style.background = 'transparent';
    input.style.color = 'inherit';
    input.style.border = '1px solid var(--accent)';
    input.style.borderRadius = '3px';
    input.style.outline = 'none';
    input.style.fontFamily = 'inherit';
    input.style.fontSize = 'inherit';
    input.style.padding = '0 2px';
    input.style.marginLeft = '4px';

    // Stop drag and click ops
    input.addEventListener('click', e => e.stopPropagation());
    input.addEventListener('mousedown', e => e.stopPropagation());

    const finishRename = async () => {
        if (input.dataset.done) return;
        input.dataset.done = '1';
        let newTitle = input.value.trim();
        if (!newTitle) newTitle = item.title;
        else if (item.type === 'file' && !newTitle.toLowerCase().endsWith('.md')) newTitle += '.md';

        await renameItem(itemId, newTitle);
        // renameItem calls renderSidebar() which removes the input naturally
    };

    input.addEventListener('blur', finishRename);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            input.dataset.done = '1';
            renderSidebar();
        }
    });

    titleSpan.replaceWith(input);
    input.focus();
    input.select();
};
