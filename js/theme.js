/* =============================================================
   theme.js — Theme system: apply, persist, modal controls
   ============================================================= */

const themeModalOverlay = document.getElementById('theme-modal-overlay');
const themeModalClose = document.getElementById('theme-modal-close');
const modeToggle = document.getElementById('mode-toggle');
const accentSwatches = document.getElementById('accent-swatches');
const accentCustom = document.getElementById('accent-custom');
const editorFontSelect = document.getElementById('editor-font-select');
const editorFontSizeEl = document.getElementById('editor-font-size');
const editorLineHeightEl = document.getElementById('editor-line-height');
const fontSizeVal = document.getElementById('font-size-val');
const lineHeightVal = document.getElementById('line-height-val');
const themeResetBtn = document.getElementById('theme-reset-btn');
const langSelect = document.getElementById('lang-select');
const animBgSelect = document.getElementById('anim-bg-select');
const liteModeToggle = document.getElementById('lite-mode-toggle');

import { setLang, getLang } from './i18n.js';

const THEME_DEFAULTS = {
    mode: 'dark',
    accent: '142,65%,48%',
    editorFont: "'Fira Code', monospace",
    fontSize: 15,
    lineHeight: 1.75,
    animBg: 'aurora',
    liteMode: false,
};

export let theme = { ...THEME_DEFAULTS, ...JSON.parse(localStorage.getItem('app-theme') || '{}') };

// ── Apply ────────────────────────────────────────────────────
export function applyTheme(t = theme) {
    const root = document.documentElement;
    root.dataset.theme = t.mode;
    root.style.setProperty('--accent', `hsl(${t.accent})`);
    root.style.setProperty('--accent-glow', `hsla(${t.accent}, 0.2)`);
    root.style.setProperty('--font-mono', t.editorFont);
    const editor = document.getElementById('editor');
    if (editor) {
        editor.style.fontSize = t.fontSize + 'px';
        editor.style.lineHeight = t.lineHeight;
    }

    document.body.className = t.animBg && t.animBg !== 'default' ? `bg-${t.animBg}` : '';

    // Lite Mode
    if (t.liteMode) {
        root.classList.add('lite');
        document.body.classList.add('lite');
    } else {
        root.classList.remove('lite');
        document.body.classList.remove('lite');
    }
}

export function saveTheme() {
    localStorage.setItem('app-theme', JSON.stringify(theme));
}

// ── Sync UI controls to current theme ────────────────────────
function syncThemeUI() {
    modeToggle.querySelectorAll('.mode-btn').forEach(btn =>
        btn.classList.toggle('active', btn.dataset.mode === theme.mode));
    accentSwatches.querySelectorAll('.swatch[data-hsl]').forEach(s =>
        s.classList.toggle('active', s.dataset.hsl === theme.accent));
    editorFontSelect.value = theme.editorFont;
    editorFontSizeEl.value = theme.fontSize;
    editorLineHeightEl.value = theme.lineHeight;
    fontSizeVal.textContent = theme.fontSize + 'px';
    lineHeightVal.textContent = parseFloat(theme.lineHeight).toFixed(2);
    if (langSelect) langSelect.value = getLang();
    if (animBgSelect) animBgSelect.value = theme.animBg || 'aurora';
    if (liteModeToggle) liteModeToggle.checked = theme.liteMode || false;
    try { accentCustom.value = hslToHex(theme.accent); } catch { }
}

// ── Modal ────────────────────────────────────────────────────
export function openThemeModal() { themeModalOverlay.hidden = false; syncThemeUI(); }
export function closeThemeModal() { themeModalOverlay.hidden = true; }

themeModalClose.addEventListener('click', closeThemeModal);
themeModalOverlay.addEventListener('click', e => {
    if (e.target === themeModalOverlay) closeThemeModal();
});

// ── Controls ─────────────────────────────────────────────────
modeToggle.addEventListener('click', e => {
    const btn = e.target.closest('.mode-btn');
    if (!btn) return;
    theme.mode = btn.dataset.mode;
    applyTheme(); saveTheme(); syncThemeUI();
});

accentSwatches.addEventListener('click', e => {
    const sw = e.target.closest('.swatch[data-hsl]');
    if (!sw) return;
    theme.accent = sw.dataset.hsl;
    applyTheme(); saveTheme(); syncThemeUI();
});

accentCustom.addEventListener('input', e => {
    const hex = e.target.value;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0, s = 0, l = (max + min) / 2;
    if (d) {
        s = d / (1 - Math.abs(2 * l - 1));
        if (max === r) h = ((g - b) / d + 6) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h = Math.round(h * 60);
    }
    s = Math.round(s * 100); l = Math.round(l * 100);
    theme.accent = `${h},${s}%,${l}%`;
    accentSwatches.querySelectorAll('.swatch[data-hsl]').forEach(sw => sw.classList.remove('active'));
    applyTheme(); saveTheme();
});

editorFontSelect.addEventListener('change', () => {
    theme.editorFont = editorFontSelect.value;
    applyTheme(); saveTheme();
});

editorFontSizeEl.addEventListener('input', () => {
    theme.fontSize = parseInt(editorFontSizeEl.value, 10);
    fontSizeVal.textContent = theme.fontSize + 'px';
    applyTheme(); saveTheme();
});

editorLineHeightEl.addEventListener('input', () => {
    theme.lineHeight = parseFloat(editorLineHeightEl.value);
    lineHeightVal.textContent = theme.lineHeight.toFixed(2);
    applyTheme(); saveTheme();
});

themeResetBtn.addEventListener('click', () => {
    theme = { ...THEME_DEFAULTS };
    applyTheme(); saveTheme(); syncThemeUI();
});

if (animBgSelect) {
    animBgSelect.addEventListener('change', () => {
        theme.animBg = animBgSelect.value;
        applyTheme(); saveTheme();
    });
}

if (langSelect) {
    langSelect.addEventListener('change', () => {
        setLang(langSelect.value);
    });
}

if (liteModeToggle) {
    liteModeToggle.addEventListener('change', () => {
        theme.liteMode = liteModeToggle.checked;
        applyTheme();
        saveTheme();
    });
}

// ── Utility — HSL → Hex ──────────────────────────────────────
function hslToHex(hsl) {
    const [h, s, l] = hsl.split(',').map(v => parseFloat(v));
    const a = s / 100, ll = l / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const c = a * Math.min(ll, 1 - ll);
        return ll - c * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}
