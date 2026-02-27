/* =============================================================
   state.js — Shared application state
   ============================================================= */

const DEFAULT_CONTENT = `# Welcome to Emerald! 💎

*(Português abaixo | Español abajo)*

Emerald is a minimalist, self-hosted Markdown editor designed for speed and simplicity. 

- **No accounts, no cloud:** Everything is stored directly in your browser's local storage.
- **Fast and Distraction-free:** The editor instantly renders your markdown with a live preview.
- **Customizable:** Click the \`⋮\` menu to change themes, fonts, and accent colors.
- **Image Support:** Paste (\`Ctrl+V\`) or drag & drop images straight into the editor. Try it!

To get started, explore the other sample notes in the sidebar, or click the **New Note** icon to create your own! 

---

# Bem-vindo(a) ao Emerald! 💎

O Emerald é um editor Markdown minimalista e self-hosted (hospedado por você), focado em velocidade e simplicidade.

- **Sem contas, sem nuvem:** Tudo fica salvo diretamente no armazenamento local do seu navegador (localStorage).
- **Rápido e sem distrações:** O editor renderiza seu Markdown instantaneamente com pré-visualização em tempo real.
- **Personalizável:** Clique no menu \`⋮\` para mudar temas, fontes e cores de destaque.
- **Suporte a Imagens:** Cole (\`Ctrl+V\`) ou arraste e solte imagens direto no editor. Experimente!

Para começar, explore as outras notas de exemplo na barra lateral, ou clique no ícone **Nova Nota** para criar a sua!

---

# ¡Te damos la bienvenida a Emerald! 💎

Emerald es un editor Markdown minimalista y "self-hosted" (autoalojado), diseñado para ser rápido y sencillo.

- **Sin cuentas ni la nube:** Todo se guarda de forma segura directamente en el almacenamiento local de tu navegador.
- **Rápido y sin distracciones:** El editor muestra tu código Markdown al instante con vista previa en vivo.
- **Personalizable:** Haz clic en el menú \`⋮\` para cambiar temas, colores y tipos de letra.
- **Soporte para Imágenes:** Pega (\`Ctrl+V\`) o arrastra y suelta imágenes directamente en el editor. ¡Pruébalo!

Para empezar, explora las demás notas de muestra en la barra lateral o haz clic en el icono de **Nueva Nota** para crear tu primera nota.
`;

const DEFAULT_ITEMS = [
    { id: 'folder-default', type: 'folder', parentId: null, title: 'Notes', isOpen: true, lastModified: Date.now() },
    { id: 'note-default', type: 'file', parentId: null, title: 'Welcome.md', content: DEFAULT_CONTENT, lastModified: Date.now() },
];

// ── Items ────────────────────────────────────────────────────
let _items = JSON.parse(localStorage.getItem('app-items')) || DEFAULT_ITEMS;

// Legacy migration — old 'app-notes' key
const _oldNotes = JSON.parse(localStorage.getItem('app-notes'));
if (_oldNotes && !localStorage.getItem('app-items')) {
    _items = _oldNotes.map(n => ({ ...n, type: 'file', parentId: null }));
}

export const state = {
    get items() { return _items; },
    set items(v) { _items = v; },

    currentItemId: localStorage.getItem('app-current-item') || _items.find(i => i.type === 'file')?.id,
    contextTargetId: null,
    imageStore: JSON.parse(localStorage.getItem('app-images')) || {},
    selectedIds: new Set(),   // multi-selection
};
