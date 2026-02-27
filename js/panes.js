/* =============================================================
   panes.js — Editor/Preview resize + toggle
   ============================================================= */

const editorContainer = document.querySelector('.editor-container');
const editorPane = document.querySelector('.editor-pane');
const previewPane = document.querySelector('.preview-pane');
const dividerEl = document.getElementById('divider');
const previewToggleBtn = document.getElementById('preview-toggle-btn');

// Modes: 'split' | 'editor' | 'preview'
const MODES = ['split', 'editor', 'preview'];
let currentMode = localStorage.getItem('preview-mode') || 'split';

// SVG icons for each mode
const ICONS = {
    split: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><rect x="2" y="3" width="20" height="18" rx="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>`,
    editor: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><rect x="2" y="3" width="20" height="18" rx="2"></rect><line x1="16" y1="7" x2="8" y2="7"></line><line x1="16" y1="12" x2="8" y2="12"></line><line x1="14" y1="17" x2="8" y2="17"></line></svg>`,
    preview: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><rect x="2" y="3" width="20" height="18" rx="2"></rect><path d="M2 9h20"></path></svg>`,
};

const TITLES = {
    split: 'Split view — click for editor only',
    editor: 'Editor only — click for preview only',
    preview: 'Preview only — click for split view',
};

function applyMode(mode) {
    if (!editorContainer) return;
    editorContainer.classList.remove('preview-hidden', 'editor-hidden');

    if (mode === 'editor') {
        editorContainer.classList.add('preview-hidden');
    } else if (mode === 'preview') {
        editorContainer.classList.add('editor-hidden');
    }

    if (previewToggleBtn) {
        previewToggleBtn.innerHTML = ICONS[mode];
        previewToggleBtn.title = TITLES[mode];
        previewToggleBtn.style.color = mode !== 'split' ? 'var(--accent)' : '';
    }

    currentMode = mode;
    localStorage.setItem('preview-mode', mode);
}

window.cyclePreviewMode = function () {
    const idx = MODES.indexOf(currentMode);
    const next = MODES[(idx + 1) % MODES.length];
    applyMode(next);
};

// ── Drag-to-resize divider ────────────────────────────────────
if (dividerEl && editorPane && previewPane) {
    // Restore saved split ratio
    const savedRatio = parseFloat(localStorage.getItem('pane-split') || '0.5');
    setSplitRatio(savedRatio);

    let dragging = false;
    let startX = 0;
    let startEditorW = 0;
    let totalW = 0;

    dividerEl.addEventListener('mousedown', e => {
        if (editorContainer.classList.contains('preview-hidden') ||
            editorContainer.classList.contains('editor-hidden')) return;
        e.preventDefault();
        dragging = true;
        startX = e.clientX;
        startEditorW = editorPane.getBoundingClientRect().width;
        totalW = editorContainer.getBoundingClientRect().width - dividerEl.offsetWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const delta = e.clientX - startX;
        let newRatio = (startEditorW + delta) / totalW;
        newRatio = Math.min(0.85, Math.max(0.15, newRatio));
        setSplitRatio(newRatio);
    });

    document.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        const ratio = parseFloat(editorPane.style.flex) || 0.5;
        localStorage.setItem('pane-split', ratio);
    });
}

function setSplitRatio(ratio) {
    if (!editorPane || !previewPane) return;
    editorPane.style.flex = `${ratio} 1 0`;
    previewPane.style.flex = `${1 - ratio} 1 0`;
}

// Boot: restore mode
applyMode(currentMode);
