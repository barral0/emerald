/* =============================================================
   main.js — Entry point: wires all modules together and boots
   ============================================================= */
import { state } from './state.js';
import { generateId } from './utils.js';
import { persist, autoSave, triggerManualSave } from './persistence.js';
import { renderSidebar, loadActiveItem, updatePreview } from './render.js';
import { getActiveItem, getActiveNote, createNote, createFolder, moveItem } from './files.js';
import { openImageModal } from './images.js';
import { applyTheme } from './theme.js';
import { applyTranslations, t } from './i18n.js';

// ── DOM references ───────────────────────────────────────────
const editor = document.getElementById('editor');
const noteTitleInput = document.getElementById('note-title');
const fileListEl = document.getElementById('file-list');
const saveBtn = document.getElementById('save-note-btn');
const newNoteBtn = document.getElementById('new-note-btn');
const newFolderBtn = document.getElementById('new-folder-btn');
const fileInput = document.getElementById('file-input');
const imageInput = document.getElementById('image-input');
const editorPane = document.querySelector('.editor-pane');

// ── Marked.js ────────────────────────────────────────────────
marked.use({ breaks: true, gfm: true });

// ── Sidebar action buttons ────────────────────────────────────
newNoteBtn.addEventListener('click', () => {
    const active = getActiveItem();
    const parentId = active?.type === 'folder' ? active.id : null;
    createNote(parentId);
});

newFolderBtn.addEventListener('click', createFolder);
saveBtn.addEventListener('click', triggerManualSave);

// ── Title rename ─────────────────────────────────────────────
noteTitleInput.addEventListener('change', () => {
    const item = getActiveItem();
    if (!item) return;
    let title = noteTitleInput.value.trim() || t('header.untitled');
    if (item.type === 'file' && !title.toLowerCase().endsWith('.md')) title += '.md';
    item.title = title;
    item.lastModified = Date.now();
    noteTitleInput.value = title;
    autoSave();
    renderSidebar();
});

// ── Editor input — live preview & autosave ───────────────────
editor.addEventListener('input', () => {
    const note = getActiveNote();
    if (!note) return;
    note.content = editor.value;
    note.lastModified = Date.now();
    updatePreview();
    autoSave();
    renderSidebar();
});

// ── File import (.md) ─────────────────────────────────────────
fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        const active = getActiveItem();
        const parentId = active?.type === 'folder' ? active.id : null;
        const note = {
            id: generateId(), type: 'file', parentId,
            title: file.name, content: ev.target.result, lastModified: Date.now(),
        };
        state.items.push(note);
        state.currentItemId = note.id;
        loadActiveItem();
        renderSidebar();
    };
    reader.readAsText(file);
    fileInput.value = '';
});

// ── Root drop zone ────────────────────────────────────────────
fileListEl.addEventListener('dragover', e => e.preventDefault());
fileListEl.addEventListener('drop', e => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) moveItem(id, null);
});

// ── Image paste ───────────────────────────────────────────────
editor.addEventListener('paste', e => {
    const imgItem = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'));
    if (imgItem) { e.preventDefault(); openImageModal(imgItem.getAsFile()); }
});

// ── Image drag onto editor pane ───────────────────────────────
editorPane.addEventListener('dragenter', e => {
    if ([...e.dataTransfer.items].some(i => i.type.startsWith('image/')))
        editorPane.classList.add('drag-over');
});
editorPane.addEventListener('dragover', e => {
    if ([...e.dataTransfer.items].some(i => i.type.startsWith('image/'))) e.preventDefault();
});
editorPane.addEventListener('dragleave', e => {
    if (!editorPane.contains(e.relatedTarget)) editorPane.classList.remove('drag-over');
});
editorPane.addEventListener('drop', e => {
    editorPane.classList.remove('drag-over');
    const file = [...e.dataTransfer.files].find(f => f.type.startsWith('image/'));
    if (file) { e.preventDefault(); openImageModal(file); }
});

// ── Image input (from app-menu or editor context menu) ────────
imageInput.addEventListener('change', e => {
    openImageModal(e.target.files[0]);
    imageInput.value = '';
});

// ── Boot ──────────────────────────────────────────────────────
applyTranslations();
applyTheme();
renderSidebar();
loadActiveItem();

// Side-effect imports — modules that wire their own events
import './menus.js';
import './shortcuts.js';
