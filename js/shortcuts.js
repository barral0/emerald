/* =============================================================
   shortcuts.js — Keyboard shortcuts and help modal
   ============================================================= */
import { triggerManualSave } from './persistence.js';
import { downloadNote } from './files.js';
import { closeImageModal } from './images.js';
import { closeThemeModal } from './theme.js';
import { closeAppMenu, hideEditorContextMenu, hideContextMenu, editorActions } from './menus.js';
import { clearSelection } from './render.js';

const editor = document.getElementById('editor');
const helpModalOverlay = document.getElementById('help-modal-overlay');
const helpModalClose = document.getElementById('help-modal-close');

// ── Help modal ────────────────────────────────────────────────
export function openHelp() { helpModalOverlay.hidden = false; }
export function closeHelp() { helpModalOverlay.hidden = true; }

helpModalClose.addEventListener('click', closeHelp);
helpModalOverlay.addEventListener('click', e => {
    if (e.target === helpModalOverlay) closeHelp();
});

// ── Editor formatting shortcuts ───────────────────────────────
editor.addEventListener('keydown', e => {
    if (!e.ctrlKey && !e.metaKey) return;
    if (e.key === 'b') { e.preventDefault(); editorActions.bold(); }
    if (e.key === 'i') { e.preventDefault(); editorActions.italic(); }
    if (e.key === '`') { e.preventDefault(); editorActions.code(); }
    if (e.key.toLowerCase() === 'm') { e.preventDefault(); editorActions.frontmatter(); }
});

// ── Global shortcuts ──────────────────────────────────────────
window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); triggerManualSave(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); downloadNote(); }
    if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        window.toggleSidebar?.();
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        const activeTag = document.activeElement.tagName;
        if (!['INPUT', 'TEXTAREA'].includes(activeTag)) {
            e.preventDefault();
            const preview = document.getElementById('preview');
            if (preview && preview.innerText.trim().length > 0) {
                const range = document.createRange();
                range.selectNodeContents(preview);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }

    if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        openHelp();
    }
    if (e.key === 'Escape') {
        closeHelp();
        closeThemeModal();
        closeImageModal();
        closeAppMenu();
        hideEditorContextMenu();
        hideContextMenu();
        clearSelection();
    }
});
