/* =============================================================
   dialogs.js — Custom UI dialogs (Delete confirmation, etc.)
   ============================================================= */
import { t } from './i18n.js';

const deleteModal = document.getElementById('delete-modal');
const deleteModalBody = document.getElementById('delete-modal-body');
const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
const deleteCancelBtn = document.getElementById('delete-cancel-btn');

let deleteResolver = null;

/**
 * Shows a custom themed delete confirmation dialog.
 * @param {string} message The message to display
 * @returns {Promise<boolean>} Resolves with true if confirmed, false otherwise
 */
export function confirmDelete(message) {
    return new Promise(resolve => {
        deleteModalBody.textContent = message;
        deleteModal.hidden = false;
        deleteResolver = resolve;
    });
}

const handleResolution = (value) => {
    if (deleteResolver) {
        deleteResolver(value);
        deleteResolver = null;
        deleteModal.hidden = true;
    }
};

// Event Listeners
deleteConfirmBtn?.addEventListener('click', () => handleResolution(true));
deleteCancelBtn?.addEventListener('click', () => handleResolution(false));
deleteModal?.addEventListener('click', e => {
    if (e.target === deleteModal) handleResolution(false);
});

export function showCustomAlert(message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-alert-overlay');
        const textEl = document.getElementById('custom-alert-text');
        const btn = document.getElementById('custom-alert-btn');
        const titleEl = overlay.querySelector('.modal-title');

        if (titleEl) titleEl.textContent = t('dialog.notice') || 'Notice';
        textEl.textContent = message;
        overlay.hidden = false;

        const onClick = () => {
            overlay.hidden = true;
            btn.removeEventListener('click', onClick);
            resolve();
        };
        btn.addEventListener('click', onClick);
    });
}

export function showCustomPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-prompt-overlay');
        const textEl = document.getElementById('custom-prompt-text');
        const inputEl = document.getElementById('custom-prompt-input');
        const okBtn = document.getElementById('custom-prompt-ok');
        const cancelBtn = document.getElementById('custom-prompt-cancel');
        const titleEl = overlay.querySelector('.modal-title');

        if (titleEl) titleEl.textContent = t('dialog.input') || 'Input Requested';
        textEl.textContent = message;
        inputEl.value = defaultValue;
        overlay.hidden = false;
        inputEl.focus();
        inputEl.select();

        const cleanup = () => {
            overlay.hidden = true;
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            inputEl.removeEventListener('keydown', onKey);
        };

        const onOk = () => { cleanup(); resolve(inputEl.value); };
        const onCancel = () => { cleanup(); resolve(null); };
        const onKey = (e) => {
            if (e.key === 'Enter') onOk();
            if (e.key === 'Escape') onCancel();
        };

        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        inputEl.addEventListener('keydown', onKey);
    });
}
