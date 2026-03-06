## 2024-03-03 - [Renderer Process Debouncing]
**Learning:** Heavy operations like I/O write calls (autoSave) and full DOM rebuilds (renderSidebar) were tightly coupled to the editor's `input` event, firing synchronously on every keystroke. This causes severe main-thread blocking during rapid typing.
**Action:** Always decouple instant UI feedback (like markdown `updatePreview`) from heavy state persistence and tree rendering by using a `debounce` utility when handling high-frequency events like text input.
