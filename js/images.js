/* =============================================================
   images.js — Image insertion, resizing, and modal logic
   ============================================================= */
import { state } from './state.js';
import { generateId } from './utils.js';
import { persist } from './persistence.js';

const editor = document.getElementById('editor');
const imageModalOverlay = document.getElementById('image-modal-overlay');
const modalImgPreview = document.getElementById('modal-img-preview');
const modalImgAlt = document.getElementById('modal-img-alt');
const modalImgWidth = document.getElementById('modal-img-width');
const modalImgQuality = document.getElementById('modal-img-quality');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalInsertBtn = document.getElementById('modal-insert-btn');

let _pendingImageFile = null;

// ── Insert at cursor ─────────────────────────────────────────
export function insertAtCursor(text) {
    editor.focus();
    if (!document.execCommand('insertText', false, text)) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.setRangeText(text, start, end, 'end');
    }
    editor.dispatchEvent(new Event('input'));
}

// ── Modal open/close ─────────────────────────────────────────
export function openImageModal(file) {
    if (!file || !file.type.startsWith('image/')) return;
    _pendingImageFile = file;
    const objectUrl = URL.createObjectURL(file);
    modalImgPreview.src = objectUrl;
    modalImgPreview.onload = () => URL.revokeObjectURL(objectUrl);
    modalImgAlt.value = file.name.replace(/\.[^.]+$/, '');
    modalImgWidth.value = '';
    imageModalOverlay.hidden = false;
    modalImgAlt.focus();
}

export function closeImageModal() {
    imageModalOverlay.hidden = true;
    _pendingImageFile = null;
    modalImgPreview.src = '';
}

// ── Commit insert ─────────────────────────────────────────────
export async function commitImageInsert() {
    if (!_pendingImageFile) return;
    const maxEdge = parseInt(modalImgQuality.value, 10);
    const alt = modalImgAlt.value.trim() || 'image';
    const dispWidth = modalImgWidth.value.trim();

    const dataUrl = await resizeImage(_pendingImageFile, maxEdge);
    const imgId = generateId();
    state.imageStore[imgId] = dataUrl;
    persist();

    const sizeHint = dispWidth ? ` =${dispWidth}x` : '';
    insertAtCursor(`![${alt}](img://${imgId}${sizeHint})`);
    closeImageModal();
}

// ── Canvas resize ─────────────────────────────────────────────
function resizeImage(file, maxEdge) {
    return new Promise(resolve => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            let { width, height } = img;
            const canvas = document.createElement('canvas');
            if (width <= maxEdge && height <= maxEdge) {
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0);
            } else {
                const scale = maxEdge / Math.max(width, height);
                canvas.width = Math.round(width * scale);
                canvas.height = Math.round(height * scale);
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.src = url;
    });
}

// ── Wire up modal events ──────────────────────────────────────
modalCancelBtn.addEventListener('click', closeImageModal);
modalInsertBtn.addEventListener('click', commitImageInsert);
imageModalOverlay.addEventListener('click', e => {
    if (e.target === imageModalOverlay) closeImageModal();
});
