/* =============================================================
   menus.js — File context menu, editor context menu, app menu
   ============================================================= */
import { state } from './state.js';
import { insertAtCursor, openImageModal, closeImageModal } from './images.js';
import { deleteCurrentItem } from './files.js';
import { loadActiveItem, renderSidebar } from './render.js';
import { openThemeModal, closeThemeModal, theme } from './theme.js';
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
const updateCheckBtn = document.getElementById('update-check-btn');
const updaterStatus = document.getElementById('updater-status');

function openAboutModal() { if (aboutModal) aboutModal.hidden = false; }
function closeAboutModal() { if (aboutModal) aboutModal.hidden = true; }

if (aboutCloseBtn) aboutCloseBtn.addEventListener('click', closeAboutModal);

// Auto Updater Listeners
if (updateCheckBtn && window.electronAPI && window.electronAPI.checkForUpdates) {
    updateCheckBtn.addEventListener('click', async () => {
        updateCheckBtn.disabled = true;
        updateCheckBtn.textContent = t('update.checking');
        await window.electronAPI.checkForUpdates();
        setTimeout(() => {
            if (updateCheckBtn.textContent === t('update.checking')) {
                updateCheckBtn.textContent = t('update.up_to_date');
                updateCheckBtn.disabled = false;
            }
        }, 5000);
    });

    window.electronAPI.onUpdateAvailable(() => {
        if (updaterStatus) {
            updaterStatus.style.display = 'block';
            updaterStatus.style.color = 'var(--accent)';
            updaterStatus.textContent = t('update.bg_download');
        }
        if (updateCheckBtn) {
            updateCheckBtn.textContent = t('update.downloading');
        }
    });

    window.electronAPI.onUpdateDownloaded(() => {
        if (updaterStatus) {
            updaterStatus.style.display = 'block';
            updaterStatus.style.color = '#10b981';
            updaterStatus.textContent = t('update.ready');
        }
        if (updateCheckBtn) {
            updateCheckBtn.disabled = false;
            updateCheckBtn.classList.add('primary');
            updateCheckBtn.classList.remove('secondary');
            updateCheckBtn.textContent = t('update.install');
            updateCheckBtn.onclick = () => window.electronAPI.installUpdate();
        }
    });
}
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
    const targetId = state.contextTargetId;
    hideContextMenu();
    if (window.startInlineRename) {
        window.startInlineRename(targetId);
    }
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

// ── AI Helper ──────────────────────────────────────────────────
async function callLLM(systemPrompt, noSelectionMsgs) {
    if (!theme.aiKey) {
        alert(t('theme.ai_key') + " is required.");
        openThemeModal();
        return;
    }

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    let selectedText = editor.value.slice(start, end);

    if (!selectedText.trim()) {
        alert("Please select some text first.");
        return;
    }

    editor.disabled = true;
    editor.style.opacity = '0.5';

    try {
        let resultText = '';

        if (theme.aiProvider === 'gemini') {
            const modelName = theme.aiModel || 'gemini-2.5-flash';
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${theme.aiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: selectedText }] }],
                    generationConfig: { temperature: 0.3 }
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            resultText = data.candidates[0].content.parts[0].text;
        } else {
            const modelName = theme.aiModel || 'gpt-4o-mini';
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${theme.aiKey}`
                },
                body: JSON.stringify({
                    model: modelName,
                    temperature: 0.3,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: selectedText }
                    ]
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            resultText = data.choices[0].message.content;
        }

        editor.disabled = false;
        editor.style.opacity = '1';
        editor.focus();
        editor.selectionStart = start;
        editor.selectionEnd = end;
        document.execCommand('insertText', false, resultText);

    } catch (e) {
        alert(`LLM Error: ${e.message}`);
        editor.disabled = false;
        editor.style.opacity = '1';
    }
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
    spellcheck: () => callLLM("You are an expert copyeditor. Fix any spelling and grammar mistakes in the following text. Do not change the original formatting, markdown tags, or meaning. Reply ONLY with the fixed text, without quotes or conversational filler."),
    summarize: () => callLLM("You are a helpful assistant. Provide a brief, concise summary of the following text. Preserve any formatting if it helps. Reply ONLY with the summary."),
    image: () => imageInput.click(),
    frontmatter: () => {
        if (editor.value.trim().startsWith('---') || editor.value.trim().startsWith('+++')) return;
        const title = noteTitleInput.value || t('header.untitled');
        const date = new Date().toISOString();
        const fm = `---\ntitle: "${title}"\ndate: ${date}\ndraft: true\n---\n\n`;
        const origStart = editor.selectionStart;
        const origEnd = editor.selectionEnd;
        editor.selectionStart = 0;
        editor.selectionEnd = 0;
        editor.focus();
        document.execCommand('insertText', false, fm);
        editor.selectionStart = origStart > 0 ? origStart + fm.length : fm.length;
        editor.selectionEnd = origEnd > 0 ? origEnd + fm.length : fm.length;
    },
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
