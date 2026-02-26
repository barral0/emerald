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
