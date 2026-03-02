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
const aiProviderSelect = document.getElementById('ai-provider-select');
const aiModelSelect = document.getElementById('ai-model-select');
const aiKeyInput = document.getElementById('ai-key-input');
const settingsTabs = document.querySelectorAll('.settings-tab');
const settingsTabContents = document.querySelectorAll('.settings-tab-content');
const customBgColorsRow = document.getElementById('custom-bg-colors-row');
const customBgColor1 = document.getElementById('custom-bg-color-1');
const customBgColor2 = document.getElementById('custom-bg-color-2');
const customBgColor3 = document.getElementById('custom-bg-color-3');

import { setLang, getLang } from './i18n.js';

const THEME_DEFAULTS = {
    mode: 'dark',
    accent: '142,65%,48%',
    editorFont: "'Fira Code', monospace",
    fontSize: 15,
    lineHeight: 1.75,
    animBg: 'aurora',
    liteMode: false,
    aiProvider: 'openai',
    aiModel: 'gpt-4o-mini',
    aiKey: '',
    customBgColors: ['#4c1d95', '#0e7490', '#be185d'],
};

export function hexToRGBList(hex) {
    if (!hex) return '0, 0, 0';
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}

const AI_MODELS = {
    openai: [
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'o1-mini', label: 'o1 Mini' },
        { value: 'o3-mini', label: 'o3 Mini' }
    ],
    gemini: [
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
        { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' }
    ]
};

function updateModelOptions() {
    if (!aiModelSelect) return;
    const provider = theme.aiProvider || 'openai';
    const models = AI_MODELS[provider] || AI_MODELS['openai'];

    aiModelSelect.innerHTML = '';
    models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.value;
        opt.textContent = m.label;
        aiModelSelect.appendChild(opt);
    });

    if (!models.find(m => m.value === theme.aiModel)) {
        theme.aiModel = models[0].value;
        saveTheme();
    }
    aiModelSelect.value = theme.aiModel;
}

// ── Tabs ─────────────────────────────────────────────────────
settingsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        settingsTabs.forEach(t => t.classList.remove('active'));
        settingsTabContents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.add('active');
    });
});

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

    if (t.customBgColors && t.customBgColors.length >= 3) {
        root.style.setProperty('--bg-custom-1', hexToRGBList(t.customBgColors[0]));
        root.style.setProperty('--bg-custom-2', hexToRGBList(t.customBgColors[1]));
        root.style.setProperty('--bg-custom-3', hexToRGBList(t.customBgColors[2]));
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
    if (animBgSelect) {
        animBgSelect.value = theme.animBg || 'aurora';
        if (customBgColorsRow) {
            customBgColorsRow.style.display = theme.animBg === 'custom' ? 'flex' : 'none';
        }
    }
    if (customBgColor1 && theme.customBgColors) customBgColor1.value = theme.customBgColors[0];
    if (customBgColor2 && theme.customBgColors) customBgColor2.value = theme.customBgColors[1];
    if (customBgColor3 && theme.customBgColors) customBgColor3.value = theme.customBgColors[2];
    if (liteModeToggle) liteModeToggle.checked = theme.liteMode || false;
    if (aiProviderSelect) aiProviderSelect.value = theme.aiProvider || 'openai';
    updateModelOptions();
    if (aiKeyInput) {
        aiKeyInput.value = theme.aiKey || '';
        const isGemini = theme.aiProvider === 'gemini';
        const lbl = aiKeyInput.parentElement.querySelector('label');
        if (lbl) {
            lbl.textContent = isGemini ? 'Google Gemini API Key (Local)' : t('theme.ai_key');
        }
        aiKeyInput.placeholder = isGemini ? 'AIza...' : t('theme.ai_key_placeholder');
    }
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
        if (customBgColorsRow) {
            customBgColorsRow.style.display = theme.animBg === 'custom' ? 'flex' : 'none';
        }
        applyTheme(); saveTheme();
    });
}

[customBgColor1, customBgColor2, customBgColor3].forEach((input, index) => {
    if (input) {
        input.addEventListener('input', (e) => {
            if (!theme.customBgColors) theme.customBgColors = ['#4c1d95', '#0e7490', '#be185d'];
            theme.customBgColors[index] = e.target.value;
            applyTheme(); saveTheme();
        });
    }
});

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

if (aiProviderSelect) {
    aiProviderSelect.addEventListener('change', () => {
        theme.aiProvider = aiProviderSelect.value;
        updateModelOptions();
        saveTheme();
        syncThemeUI();
    });
}

if (aiModelSelect) {
    aiModelSelect.addEventListener('change', () => {
        theme.aiModel = aiModelSelect.value;
        saveTheme();
    });
}

if (aiKeyInput) {
    aiKeyInput.addEventListener('input', () => {
        theme.aiKey = aiKeyInput.value.trim();
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
