/* =============================================================
   main.js — Entry point: wires all modules together and boots
   ============================================================= */
import { state } from './state.js';
import { generateId } from './utils.js';
import { persist, autoSave, triggerManualSave } from './persistence.js';
import { renderSidebar, loadActiveItem, updatePreview } from './render.js';
import { getActiveItem, getActiveNote, createNote, createFolder, moveItem, getUniqueTitle } from './files.js';
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
const openLocalFolderBtn = document.getElementById('open-local-folder-btn');
const fileInput = document.getElementById('file-input');
const imageInput = document.getElementById('image-input');
const editorPane = document.querySelector('.editor-pane');
const homeScreen = document.getElementById('home-screen');
const appLayout = document.getElementById('app-layout');
const homeOpenBtn = document.getElementById('home-open-btn');
const homeCreateBtn = document.getElementById('home-create-btn');
const homeCloseAppBtn = document.getElementById('home-close-app-btn');

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
noteTitleInput.addEventListener('change', async () => {
    const item = getActiveItem();
    if (!item) return;

    let oldTitle = item.title;
    let title = noteTitleInput.value.trim() || t('header.untitled');
    if (item.type === 'file' && !title.toLowerCase().endsWith('.md')) title += '.md';

    // Prevent duplicates in same folder
    title = getUniqueTitle(title, item.parentId, item.type === 'file', item.id);

    // Electron: Rename on disk if it's a local file
    if (window.electronAPI && item.fsPath && oldTitle !== title) {
        try {
            const parentDir = item.fsPath.substring(0, item.fsPath.lastIndexOf(window.electronAPI.sep || (item.fsPath.includes('/') ? '/' : '\\')));
            const newFsPath = await window.electronAPI.joinPath(parentDir, title);
            await window.electronAPI.renameItem(item.fsPath, newFsPath);
            item.fsPath = newFsPath;
        } catch (err) {
            console.error('Failed to rename local file:', err);
            // Fallback: keep old title in UI if disk rename failed? 
            // For now we allow UI update anyway but log the error.
        }
    }

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

// ── Home Screen — Language + About ────────────────────────────
const homeLangSelect = document.getElementById('home-lang-select');
const homeAboutInlineBtn = document.getElementById('home-about-inline-btn');

if (homeLangSelect) {
    homeLangSelect.value = localStorage.getItem('app-lang') || 'en';
    homeLangSelect.addEventListener('change', async () => {
        const { setLang } = await import('./i18n.js');
        setLang(homeLangSelect.value);
        const ls = document.getElementById('lang-select');
        if (ls) ls.value = homeLangSelect.value;
    });
}

if (homeAboutInlineBtn) {
    homeAboutInlineBtn.addEventListener('click', () => {
        const overlay = document.getElementById('about-modal-overlay');
        if (overlay) overlay.hidden = false;
    });
}

// ── Recent Workspaces ─────────────────────────────────────────
let recentWorkspaces = JSON.parse(localStorage.getItem('app-recent-workspaces') || '[]');

function updateRecentUI() {
    const section = document.getElementById('home-recent-section');
    const list = document.getElementById('home-recent-list');
    if (!section || !list) return;
    if (recentWorkspaces.length === 0) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    list.innerHTML = '';
    recentWorkspaces.forEach(ws => {
        const li = document.createElement('li');
        li.className = 'home-recent-item';
        li.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>' +
            '<span class="home-recent-name">' + ws.name + '</span>' +
            '<span class="home-recent-path">' + ws.path + '</span>';
        li.addEventListener('click', () => window.__openDirectoryFlow?.(ws.path));
        list.appendChild(li);
    });
}

// ── Electron (Desktop) Integration ────────────────────────────
if (window.electronAPI) {
    // Show the small sidebar button as well
    openLocalFolderBtn.style.display = 'flex';
    openLocalFolderBtn.title = t('sidebar.open_folder');

    const openDirectoryFlow = async (path = null) => {
        const dirPath = path || await window.electronAPI.openDirectory();
        if (dirPath) {
            const items = await window.electronAPI.readDirectory(dirPath);
            if (items) {
                state.items = items;
                const rootName = dirPath.split(/[/\\]/).pop() || dirPath;
                state.items.push({
                    id: 'fs-root',
                    type: 'folder',
                    parentId: null,
                    title: rootName,
                    isOpen: true,
                    fsPath: dirPath
                });

                // Save to recents
                recentWorkspaces = recentWorkspaces.filter(ws => ws.path !== dirPath);
                recentWorkspaces.unshift({ name: rootName, path: dirPath });
                if (recentWorkspaces.length > 6) recentWorkspaces.pop();
                localStorage.setItem('app-recent-workspaces', JSON.stringify(recentWorkspaces));
                updateRecentUI();

                // Attach orphans to root
                state.items.forEach(i => {
                    if (i.id !== 'fs-root' && (typeof i.parentId === 'undefined' || i.parentId === null)) {
                        i.parentId = 'fs-root';
                    }
                });

                state.currentItemId = state.items.find(i => i.type === 'file')?.id;

                // Hide home, show app
                homeScreen.style.display = 'none';
                appLayout.style.display = 'flex';

                renderSidebar();
                await loadActiveItem();
            }
        }
    };

    openLocalFolderBtn.addEventListener('click', () => openDirectoryFlow());
    homeOpenBtn?.addEventListener('click', () => openDirectoryFlow());

    homeCloseAppBtn?.addEventListener('click', () => {
        if (window.electronAPI) window.electronAPI.closeWindow();
    });

    homeCreateBtn?.addEventListener('click', async () => {
        const parentPath = await window.electronAPI.openDirectory();
        if (parentPath) {
            const folderName = prompt(t('sidebar.new_folder'), 'My Notes');
            if (folderName) {
                const newPath = await window.electronAPI.joinPath(parentPath, folderName);
                await window.electronAPI.mkdir(newPath);
                await openDirectoryFlow(newPath);
            }
        }
    });
    window.__openDirectoryFlow = openDirectoryFlow;

    // ── Bind Window Controls ──
    const winControls = document.getElementById('window-controls');
    const closeFolderMenu = document.getElementById('menu-close-folder');
    if (closeFolderMenu) closeFolderMenu.style.display = 'flex';

    document.addEventListener('close-workspace', () => {
        state.items = []; // Clear current items
        state.currentItemId = null;
        homeScreen.style.display = 'flex';
        appLayout.style.display = 'none';
        persist(); // Clear from local storage persistence
        renderSidebar();
    });

    if (winControls) {
        winControls.style.display = 'flex';
        document.getElementById('win-min')?.addEventListener('click', () => window.electronAPI.minimizeWindow());
        document.getElementById('win-max')?.addEventListener('click', () => window.electronAPI.maximizeWindow());
        document.getElementById('win-close')?.addEventListener('click', () => window.electronAPI.closeWindow());
    }

    // Hide web-only features
    const liteToggle = document.getElementById('lite-mode-home-toggle')?.closest('.theme-row');
    if (liteToggle) liteToggle.style.display = 'none';

} else {
    // ── Web (Browser) Integration ────────────────────────────────

    // Hide Desktop-only features
    if (homeCreateBtn) homeCreateBtn.style.display = 'none';
    if (homeCloseAppBtn) homeCloseAppBtn.style.display = 'none';
}

const hasFSRoot = state.items.some(i => i.id === 'fs-root');
if (!hasFSRoot) {
    homeScreen.style.display = 'flex';
    appLayout.style.display = 'none';
} else {
    homeScreen.style.display = 'none';
    appLayout.style.display = 'flex';
}

// ── Boot ──────────────────────────────────────────────────────
updateRecentUI();
applyTranslations();
applyTheme();
renderSidebar();
loadActiveItem();

// Side-effect imports — modules that wire their own events
import './menus.js';
import './shortcuts.js';
