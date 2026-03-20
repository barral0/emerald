# Emerald — Minimalist Markdown Editor

> A beautiful minimalist markdown editor with a modern glassmorphic interface. Available as a standalone **Native Desktop App** (Electron) or a self-hosted web app. Features live preview, deep local folder system synchronization, image visualization, and extensive theme customization. No accounts. No cloud. Your notes stay fully secure on your own machine.

---

## 🚀 What's New in v1.0.6
* **Robust File Management:** Fixed a critical bug where files would become hidden when dragged from a subfolder directly into the root workspace in Electron mode.
* **Tag System (#hashtags):** Fully native hashtag support with a clickable sidebar cloud and tree filtering.
* **Multi-Tab Editor:** Seamlessly switch between multiple open notes with persistent tab support.
* **Refined Assets:** Official Emerald icon integrated throughout the application.

---

## ✨ Features

| Feature | Details |
|---|---|
| **🤖 AI Assistant** | Built-in smart writing features (Grammar Fix & Text Summarization) connecting natively to **Google Gemini** & **OpenAI** |
| **⚡ Hugo Support** | Deep integration with Hugo Static Site Generator, featuring `Ctrl+M` hotkey for YAML Front-Matter generation and specific shortcode rendering |
| **Native Desktop App** | Fully featured local storage access using Electron for Windows, macOS, and Linux |
| **Local Folder Sync** | Automatically loads and synchronizes directories and images direct from your OS |
| **Glassmorphic UI** | Premium Apple-style frosted glass interface with smooth micro-animations |
| **Live preview** | Side-by-side markdown rendering as you type |
| **Folder organiser** | Nest notes into folders, drag & drop to reorganise |
| **Image support** | Displays local `.png/jpg/webp/svg` inline, plus clipboard paste & drag-and-drop |
| **Theme editor** | Dark / light mode, 7 accent colours + custom picker, font & size controls |
| **Animated Wallpapers** | 5 built-in dynamic liquid radial gradients (Aurora, Cyberpunk, Ocean, Sunset) and a fully **Custom Colors Mixer** |
| **Right-click menu** | Bold, italic, code, link, image — without leaving the keyboard |
| **Keyboard shortcuts** | `Ctrl+S` save · `Ctrl+D` download · `Ctrl+B/I/`` formatting · `?` help |
| **Auto-Saving** | Your workflow is securely flushed instantly to disk or browser memory |
| **Multilingual** | Available natively in English, Portuguese, and Spanish |
| **Zero dependencies** | Vanilla HTML, CSS, and ES modules — no framework, no build step |

---

## 💻 Desktop App (Windows, macOS, Linux)

Emerald is packaged natively for all major desktop Operating Systems using Electron, allowing seamless local filesystem integration and standalone usage. 

**Download the Pre-Built App:**
1. Navigate to the **[Releases](https://github.com/barral0/emerald/releases)** page or **[Actions](https://github.com/barral0/emerald/actions)** tab.
2. Select the latest build for your system (Windows `.exe`, macOS `.dmg` / `.app`, Linux `.AppImage`).
3. Download and Run!

**Build from Source:**

```bash
npm install
npm run start # Start local sandbox

# Compile builds
npm run dist -- -w      # Windows
npm run dist -- --mac   # macOS
npm run dist -- --linux # Linux
```

---

## 📁 Project Structure

```text
emerald/
├── main.js                 ← Electron main backend process connecting the filesystem
├── preload.js              ← Secure Electron IPC bridge
├── package.json            ← Node and Electron-builder build configs
├── index.html              ← App entry point
├── css/
│   ├── tokens.css          ← Design tokens (CSS variables)
│   ├── layout.css          ← App shell, sidebar, editor layout
│   └── components.css      ← UI components, modals, menus
├── js/
│   ├── main.js             ← Entry point — boots app, wires events
│   ├── state.js            ← Shared application state
│   ├── utils.js            ← Pure utility functions
│   ├── persistence.js      ← localStorage read/write
│   ├── files.js            ← Note/folder CRUD
│   ├── render.js           ← Sidebar + preview rendering
│   ├── images.js           ← Image insertion, resizing, modal
│   ├── theme.js            ← Theme system, UI syncing, and configs
│   ├── menus.js            ← All context and app menus + AI Google/OpenAI Callers
│   ├── i18n.js             ← Internationalization dictionaries
│   └── shortcuts.js        ← Keyboard shortcuts + help modal
├── notes/                  ← Sample notes (import via Open File)
│   ├── Welcome.md
│   ├── Getting-Started.md
│   ├── Markdown-Cheatsheet.md
│   └── Keyboard-Shortcuts.md
├── images/                 ← Image assets
│   └── README.md
├── docker/                 ← Docker web app specific files
│   ├── nginx.conf          ← nginx site config
│   ├── Dockerfile
│   └── docker-compose.yml
└── .dockerignore
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + S` | Save |
| `Ctrl + D` | Download as `.md` |
| `Ctrl + B` | Bold |
| `Ctrl + I` | Italic |
| `Ctrl + \`` | Code / Code block |
| `Ctrl + M` | Generate Hugo Front-Matter |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `?` | Open shortcuts help |
| `Esc` | Close any open modal or menu |
| Right-click in editor | Formatting, Insert Image, Grammar Fix, Summarize Text |

---

## 🗄️ Data & Privacy

All data is stored in your browser's **localStorage**:

| Key | Contents |
|---|---|
| `app-items` | Notes and folder structure (JSON) |
| `app-images` | Image data URLs |
| `app-theme` | Your theme preferences |
| `app-current-item` | Last active note ID |

No data is sent to any server. Clearing browser data will erase your notes — use **Download File** (`Ctrl+D`) to export important notes.

---

## 📝 Importing Sample Notes

The `notes/` folder contains ready-made sample notes. Import any of them via the **⋮ menu → Open File**.

---

## 📄 License

MIT — see [LICENSE](LICENSE).
