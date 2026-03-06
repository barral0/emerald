## 2023-10-27 - [XSS] Missing HTML Escaping in UI Rendering
**Vulnerability:** Several places in the application (`js/main.js` and `js/render.js`) injected user-controlled data (workspace paths, folder titles, image sources) directly into DOM elements via `innerHTML` without sanitization.
**Learning:** Even internal app state elements (like recent workspaces or local filesystem representations) must be treated as untrusted input when rendering via `innerHTML`.
**Prevention:** Always import and apply `escapeHtml` from `js/utils.js` when constructing HTML strings with dynamic data, or prefer using `document.createElement` and `textContent`.
