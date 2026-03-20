## 2024-05-24 - Optimize renderSidebar
**Learning:** O(N^2) complexity in recursive tree rendering can easily become a bottleneck for large datasets (e.g. 10k items).
**Action:** Always pre-compute a children map (O(N)) to allow O(1) lookups during tree traversal, reducing overall rendering complexity to O(N).
## 2024-05-24 - Optimize unique title generation for large folders
**Learning:** Found an O(N*M) performance issue in `getUniqueTitle` in `js/files.js` when calculating unique names for new files or renames, because it iterated over `state.items` using `some()` for every potential title variation.
**Action:** Implemented an O(N+M) solution using a `Set` to collect all existing titles for O(1) lookups during the string generation loop. This drastically improved performance from ~3.3s to ~13ms for large item collections (20k+).
## 2025-03-06 - Debouncing Heavy Operations on Text Input
**Learning:** Frequent heavy I/O (`autoSave` in Electron mode writes to disk via IPC) and DOM rebuilds (`renderSidebar` creates the tree from scratch) were tied directly to the `editor.addEventListener('input')` event. This blocks the main thread on every keystroke, causing severe input lag.
**Action:** Always debounce operations like `autoSave` and `renderSidebar` (e.g., using `debounce` with 300ms delay) when they are triggered by high-frequency events like text input, while keeping critical UI updates like `updatePreview` synchronous for instant visual feedback.
