/* =============================================================
   menus.js — File context menu, editor context menu, app menu
   ============================================================= */
import { state } from './state.js';
import { insertAtCursor, openImageModal, closeImageModal } from './images.js';
import { deleteCurrentItem, downloadNote, getActiveItem } from './files.js';
import { loadActiveItem, renderSidebar } from './render.js';
import { openThemeModal, closeThemeModal } from './theme.js';
import { openHelp, closeHelp } from './shortcuts.js';
import { t } from './i18n.js';

const noteTitleInput = document.getElementById('note-title');
const contextMenu = document.getElementById('context-menu');
const cmRenameBtn = document.getElementById('cm-rename');
const cmDeleteBtn = document.getElementById('cm-delete');
const editorContextMenu = document.getElementById('editor-context-menu');
const appMenuBtn = document.getElementById('app-menu-btn');
const appMenu = document.getElementById('app-menu');
const imageInput = document.getElementById('image-input');
const fileInput = document.getElementById('file-input');
const editor = document.getElementById('editor');

// ── About Modal ───────────────────────────────────────────────
const aboutModal = document.getElementById('about-modal-overlay');
const aboutCloseBtn = document.getElementById('about-close-btn');

function openAboutModal() { if (aboutModal) aboutModal.hidden = false; }
function closeAboutModal() { if (aboutModal) aboutModal.hidden = true; }

if (aboutCloseBtn) aboutCloseBtn.addEventListener('click', closeAboutModal);
if (aboutModal) aboutModal.addEventListener('click', e => { if (e.target === aboutModal) closeAboutModal(); });

// ── File-browser context menu ────────────────────────────────
export function showContextMenu(e, itemId) {
    e.preventDefault();
    e.stopPropagation();
    state.contextTargetId = itemId;
    contextMenu.hidden = false;
    const mw = contextMenu.offsetWidth;
    const mh = contextMenu.offsetHeight;
    let x = e.clientX, y = e.clientY;
    if (x + mw > window.innerWidth) x -= mw;
    if (y + mh > window.innerHeight) y -= mh;
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
}

export function hideContextMenu() {
    contextMenu.hidden = true;
    state.contextTargetId = null;
}

cmRenameBtn.addEventListener('click', () => {
    if (!state.contextTargetId) return;
    state.currentItemId = state.contextTargetId;
    loadActiveItem();
    renderSidebar();
    hideContextMenu();
    noteTitleInput.focus();
    noteTitleInput.select();
});

cmDeleteBtn.addEventListener('click', () => {
    if (!state.contextTargetId) return;
    state.currentItemId = state.contextTargetId;
    renderSidebar();
    deleteCurrentItem();
    hideContextMenu();
});

// ── Editor context menu ───────────────────────────────────────
export function showEditorContextMenu(e) {
    e.preventDefault();
    editorContextMenu.hidden = false;
    const mw = editorContextMenu.offsetWidth;
    const mh = editorContextMenu.offsetHeight;
    let x = e.clientX, y = e.clientY;
    if (x + mw > window.innerWidth) x -= mw;
    if (y + mh > window.innerHeight) y -= mh;
    editorContextMenu.style.left = x + 'px';
    editorContextMenu.style.top = y + 'px';
}

export function hideEditorContextMenu() {
    editorContextMenu.hidden = true;
}

function wrapSelection(prefix, suffix = prefix, placeholder = '') {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const sel = editor.value.slice(start, end) || placeholder;
    insertAtCursor(prefix + sel + suffix);
}

const editorActions = {
    undo: () => document.execCommand('undo'),
    redo: () => document.execCommand('redo'),
    cut: () => document.execCommand('cut'),
    copy: () => document.execCommand('copy'),
    paste: () => navigator.clipboard.readText().then(text => insertAtCursor(text)).catch(() => document.execCommand('paste')),
    bold: () => wrapSelection('**', '**', t('editor.bold')),
    italic: () => wrapSelection('*', '*', t('editor.italic')),
    code: () => {
        const sel = editor.value.slice(editor.selectionStart, editor.selectionEnd);
        sel.includes('\n') ? wrapSelection('```\n', '\n```', 'code') : wrapSelection('`', '`', t('editor.code').toLowerCase());
    },
    link: () => {
        const sel = editor.value.slice(editor.selectionStart, editor.selectionEnd);
        const url = prompt(t('msg.prompt_url'), 'https://');
        if (url) insertAtCursor(`[${sel || t('editor.link').toLowerCase()}](${url})`);
    },
    image: () => imageInput.click(),
};

export { editorActions };

editor.addEventListener('contextmenu', e => showEditorContextMenu(e));

editorContextMenu.addEventListener('click', e => {
    const li = e.target.closest('li[data-action]');
    if (!li) return;
    hideEditorContextMenu();
    editor.focus();
    const action = editorActions[li.dataset.action];
    if (action) action();
});

// ── App menu (three-dot) ──────────────────────────────────────
export function openAppMenu() {
    const rect = appMenuBtn.getBoundingClientRect();
    appMenu.style.top = (rect.bottom + 8) + 'px';
    appMenu.style.left = (rect.right - 210) + 'px'; // 210px is menu width

    appMenu.hidden = false;
    appMenuBtn.setAttribute('aria-expanded', 'true');
}

export function closeAppMenu() {
    appMenu.hidden = true;
    appMenuBtn.setAttribute('aria-expanded', 'false');
}

appMenuBtn.addEventListener('click', e => {
    e.stopPropagation();
    appMenu.hidden ? openAppMenu() : closeAppMenu();
});

appMenu.addEventListener('click', e => {
    const li = e.target.closest('li[data-menu]');
    if (!li) return;
    closeAppMenu();
    switch (li.dataset.menu) {
        case 'theme': openThemeModal(); break;
        case 'image': imageInput.click(); break;
        case 'download': downloadNote(); break;
        case 'open': fileInput.click(); break;
        case 'help': openHelp(); break;
        case 'about': openAboutModal(); break;
        case 'delete': deleteCurrentItem(); break;
        case 'close-folder': document.dispatchEvent(new CustomEvent('close-workspace')); break;
    }
});

// ── Global click — dismiss all menus ─────────────────────────
document.addEventListener('click', e => {
    hideContextMenu();
    if (!editorContextMenu.hidden && !e.target.closest('#editor-context-menu')) hideEditorContextMenu();
    if (!appMenu.hidden && !e.target.closest('.app-menu-wrap')) closeAppMenu();
});

document.addEventListener('contextmenu', e => {
    if (!e.target.closest('.file-item, .folder-item')) hideContextMenu();
});
