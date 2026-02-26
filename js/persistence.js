/* =============================================================
   persistence.js — localStorage read/write and save-status UI
   ============================================================= */
import { state } from './state.js';

const saveStatusEl = document.getElementById('save-status');
let _statusTimer = null;

export function persist() {
    localStorage.setItem('app-items', JSON.stringify(state.items));
    localStorage.setItem('app-current-item', state.currentItemId);
    localStorage.setItem('app-images', JSON.stringify(state.imageStore));
}

export function updateSaveStatus(text, cls = '') {
    clearTimeout(_statusTimer);
    saveStatusEl.className = 'save-status' + (cls ? ' ' + cls : '');
    saveStatusEl.textContent = text;
}

export async function autoSave() {
    persist();

    // Electron specific autosave to fs
    if (window.electronAPI) {
        const { getActiveItem } = await import('./files.js');
        const item = getActiveItem();
        if (item && item.type === 'file' && item.fsPath && item.content !== undefined) {
            await window.electronAPI.writeFile(item.fsPath, item.content);
        }
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    updateSaveStatus(`Saved at ${time}`);
}

export function triggerManualSave() {
    updateSaveStatus('Saving…', 'syncing');
    persist();
    setTimeout(() => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        updateSaveStatus('Saved', 'just-saved');
        _statusTimer = setTimeout(() => updateSaveStatus(`Saved at ${time}`), 2000);
    }, 300);
}
