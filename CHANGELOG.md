# Changelog

All notable changes to Emerald are documented here.

## [Unreleased]

## [1.0.3] — 2026-03-20

### Added
- **Global AI Kill-Switch:** Added setting to entirely disable AI integration, hiding related menus and UI clutter.
- **Interface Scale:** Native application zoom control (70% - 150%) available under Settings ✨.
- **Create Workspace Modal:** Custom native Emerald application modal for inserting new target workspaces, deprecating basic browser `prompt()` behavior.
- Translation expansions covering UI scale, workspace creation menus and AI features mapping on all languages.

### Changed
- Centralized the language dropdown to **Settings → General**, stripping it away from the Header and Home layout.
- Build system enforcing Node.js **24** execution on manual triggers (`workflow_dispatch`).
- Electron Builder `artifactName` properly injecting consistent `.exe` formatting bypassing 404 URL issues during GitHub auto-updates.

### Fixed
- **Context Menus Clipping:** Dynamic menus boundary logic recalculation prevents elements from rendering off-screen.
- **HTML Injection rendering:** Raw HTML inside editor fields is properly serialized resolving unclosed tags formatting destruction on preview wrappers.
- **Lite Mode readability:** Transparent/glassmorphism overrides replaced strictly with flat solid colors correcting interface bleed-through visibility in Lite Mode.
- Infinite overlapping `Untitled.md` naming conflict when generating files on base directories.
- `Ctrl + A` text selection binding incorrectly bleeding onto App Toolbar and UI Sidebars elements.
- Live-preview structural wrapper constraints blocking vertical text scrollbars.
- Graceful error catch handlers on auto-updater ping requests.

## [1.0.2] — 2026-03-20

### Added
- **Complete Application Overhaul:** Migrated identity and branding from `Elefant` to `Emerald` throughout the codebase.
- In-App automatic Github release updates via `electron-updater` mapping integrated deeply into the About modal functionality.
- Multilingual Internationalization engine (`i18n.js`) fully embedded driving all dynamic text nodes towards **en**, **pt**, and **es**.

### Fixed
- Overlap (z-index) configurations destroying click-through interfaces around active Menus and Transparent UI Modals.
- Missing configuration files inside pre-packaged bundles (`latest.yml`).
- Incorrect semver mapping resolving properly on "About the application" boxes inside HTML elements.

## [1.0.1] — 2026-03-02

### Added
- Groundwork modules supporting OpenAI API parsing alongside Google Gemini natively onto the Electron JS layer.
- Settings structure interface elements providing the foundational UI fields to expand into custom AI parameter manipulation.
- Code blocks preparation mapping towards LLM stream responses visualization in the browser view.

## [1.0.0] — 2026-02-26

### Added
- Markdown editor with live side-by-side preview.
- Folder organiser with drag & drop functionality mapping towards local user file system operations.
- Right-click context menus inside file tree and editor pane.
- Application Menu grouping primary tasks effectively.
- Deep image manipulation inserting tools: via Paste event mapping, File picker interactions, drag & drop elements.
- Visual custom modal to set resolution sizes on uploaded images limiting physical storage weight footprints.
- Syntax highlighting parser and Custom URI (`img://`) protocol fetching memory-efficient binary mapping across the editor.
- Visual Themes parameters (Accent variants, Custom color hex, Animated liquid patterns).
- Typography structural settings mapping editor fields directly (Fonts / Line / Size overrides).
- Keyboard shortcuts binding natively mapping towards specific task closures (`ESC`, `Save`, `Bold`, etc).
- Modular native vanilla architecture driven internally (`ES modules` / `Vars tokens` architecture).
