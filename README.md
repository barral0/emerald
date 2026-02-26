# Emerald — Minimalist Markdown Editor

> A beautiful minimalist markdown editor with a modern glassmorphic interface. Available as a standalone **Native Desktop App** (Electron) or a self-hosted web app. Features live preview, deep local folder system synchronization, image visualization, and extensive theme customization. No accounts. No cloud. Your notes stay fully secure on your own machine.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Try_Emerald-%2325010065?style=for-the-badge)](https://barral0.github.io/emerald/)

![Emerald Screenshot](images/screenshot.png)

---

## ✨ Features

| Feature | Details |
|---|---|
| **Native Desktop App** | Fully featured local storage access using Electron |
| **Local Folder Sync** | Automatically loads and synchronizes directories and images direct from your OS |
| **Glassmorphic UI** | Premium Apple-style frosted glass interface with smooth micro-animations |
| **Live preview** | Side-by-side markdown rendering as you type |
| **Folder organiser** | Nest notes into folders, drag & drop to reorganise |
| **Image support** | Displays local `.png/jpg/webp/svg` inline, plus clipboard paste & drag-and-drop |
| **Theme editor** | Dark / light mode, 7 accent colours + custom picker, font & size controls |
| **Right-click menu** | Bold, italic, code, link, image — without leaving the keyboard |
| **Keyboard shortcuts** | `Ctrl+S` save · `Ctrl+D` download · `Ctrl+B/I/`` formatting · `?` help |
| **Auto-Saving** | Your workflow is securely flushed instantly to disk or browser memory |
| **Zero dependencies** | Vanilla HTML, CSS, and ES modules — no framework, no build step |

---

## 💻 Desktop App (Windows)

Emerald is packaged natively for Windows, allowing seamless local filesystem integration and standalone usage. 

**Download the Pre-Built App:**
1. Navigate to the **[Actions](https://github.com/barral0/emerald/actions)** tab.
2. Select the latest **Build Desktop (Windows)** workflow.
3. Download the built `Emerald-Windows` `.exe` or `.zip` artifact!

**Build from Source:**

```bash
npm install
npm run start # Start local sandbox
npm run dist -- -w # Compile Windows build
```

---

## 🚀 Self-hosting Web App natively with Docker

### Quick start

```bash
docker compose -f docker/docker-compose.yml up -d
```

Open **http://localhost:8095** in your browser.

### Docker Compose

```yaml
services:
  emerald:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    image: emerald:latest
    container_name: emerald
    restart: unless-stopped
    ports:
      - "8095:8095"
```

### Build manually

```bash
docker build -t emerald:latest -f docker/Dockerfile .
docker run -d --name emerald -p 8095:8095 emerald:latest
```

### Change the port

Edit `docker/docker-compose.yml` and `docker/nginx.conf` — replace `8095` with your preferred port.

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
│   ├── theme.js            ← Theme system and controls
│   ├── menus.js            ← All context and app menus
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
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `?` | Open shortcuts help |
| `Esc` | Close any open modal or menu |
| Right-click in editor | Formatting context menu |

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

## 🐳 Deployment Notes

- The app is served entirely as **static files** via nginx
- nginx is configured with gzip compression, security headers, and 1-day cache for CSS/JS
- The container exposes port `8095` — map it to whatever external port you prefer
- For HTTPS, place a reverse proxy (Caddy, Traefik, nginx) in front

### Reverse proxy example (Caddy)

```
your-domain.com {
    reverse_proxy emerald:8095
}
```

---

## 📝 Importing Sample Notes

The `notes/` folder contains ready-made sample notes. Import any of them via the **⋮ menu → Open File**.

---

## 📄 License

MIT — see [LICENSE](LICENSE).
