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
import { showCustomPrompt } from './dialogs.js';
import { openAboutModal } from './menus.js';

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
const homeAboutBtn = document.getElementById('home-about-btn');

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

imageInput.addEventListener('change', e => {
    openImageModal(e.target.files[0]);
    imageInput.value = '';
});

// ── Recent Workspaces ─────────────────────────────────────────
let recentWorkspaces = JSON.parse(localStorage.getItem('app-recent-workspaces') || '[]');
const updateRecentWorkspacesUI = () => {
    const recentEl = document.getElementById('home-recent');
    const listEl = document.getElementById('recent-workspaces-list');
    if (!recentEl || !listEl) return;

    if (recentWorkspaces.length > 0) {
        recentEl.style.display = 'block';
        listEl.innerHTML = '';
        recentWorkspaces.forEach(ws => {
            const li = document.createElement('li');
            li.style.cssText = 'padding: 8px 12px; background: var(--bg-pane-hover); border-radius: 6px; cursor: pointer; color: var(--text-primary); font-size: 0.85rem; display: flex; align-items: center; justify-content: space-between; gap: 12px; transition: background var(--transition);';
            li.innerHTML = `<span style="font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ws.name}</span><span style="font-size: 0.72rem; color: var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ws.path}</span>`;
            li.addEventListener('mouseover', () => li.style.background = 'var(--bg-pane)');
            li.addEventListener('mouseout', () => li.style.background = 'var(--bg-pane-hover)');
            // Need to pass openDirectoryFlow somehow; since it's defined later we resolve lazily
            li.addEventListener('click', () => { window.__openDirectoryFlow?.(ws.path); });
            listEl.appendChild(li);
        });
    } else {
        recentEl.style.display = 'none';
    }
};

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

                recentWorkspaces = recentWorkspaces.filter(ws => ws.path !== dirPath);
                recentWorkspaces.unshift({ name: rootName, path: dirPath });
                if (recentWorkspaces.length > 5) recentWorkspaces.pop();
                localStorage.setItem('app-recent-workspaces', JSON.stringify(recentWorkspaces));
                updateRecentWorkspacesUI();

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
    window.__openDirectoryFlow = openDirectoryFlow;

    openLocalFolderBtn.addEventListener('click', () => openDirectoryFlow());
    homeOpenBtn?.addEventListener('click', () => openDirectoryFlow());
    homeAboutBtn?.addEventListener('click', () => openAboutModal());

    homeCloseAppBtn?.addEventListener('click', () => {
        if (window.electronAPI) window.electronAPI.closeWindow();
    });

    homeCreateBtn?.addEventListener('click', async () => {
        const parentPath = await window.electronAPI.openDirectory();
        if (parentPath) {
            const folderName = await showCustomPrompt(t('sidebar.new_folder'), 'My Notes');
            if (folderName) {
                const newPath = await window.electronAPI.joinPath(parentPath, folderName);
                await window.electronAPI.mkdir(newPath);
                await openDirectoryFlow(newPath);
            }
        }
    });

    // Check if we should show Home Screen or App
    const hasFSRoot = state.items.some(i => i.id === 'fs-root');
    if (!hasFSRoot) {
        homeScreen.style.display = 'flex';
        appLayout.style.display = 'none';
    } else {
        homeScreen.style.display = 'none';
        appLayout.style.display = 'flex';
    }

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
}

// ── Boot ──────────────────────────────────────────────────────
updateRecentWorkspacesUI();
applyTranslations();
applyTheme();
renderSidebar();
loadActiveItem();

// Side-effect imports — modules that wire their own events
import './menus.js';
import './shortcuts.js';
