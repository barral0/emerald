# Elefant — Minimalist Markdown Editor

> A lightweight, self-hosted markdown editor with live preview, folder organisation, image support, and full theme customisation. No accounts. No cloud. Your notes stay on your device.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Try_Elefant-%2325010065?style=for-the-badge)](https://barral0.github.io/elefant/)

![Elefant Screenshot](images/screenshot.png)

---

## ✨ Features

| Feature | Details |
|---|---|
| **Live preview** | Side-by-side markdown rendering as you type |
| **Folder organiser** | Nest notes into folders, drag & drop to reorganise |
| **Image support** | Paste, drag & drop, or insert images — auto-resized before storage |
| **Theme editor** | Dark / light mode, 7 accent colours + custom picker, font & size controls |
| **Right-click menu** | Bold, italic, code, link, image — without leaving the keyboard |
| **Keyboard shortcuts** | `Ctrl+S` save · `Ctrl+D` download · `Ctrl+B/I/`` formatting · `?` help |
| **Local storage** | Everything is stored in the browser — nothing leaves your machine |
| **Zero dependencies** | Vanilla HTML, CSS, and ES modules — no framework, no build step |

---

## 🚀 Self-hosting with Docker

### Quick start

```bash
docker compose up -d
```

Open **http://localhost:8095** in your browser.

### Docker Compose

```yaml
services:
  elefant:
    image: elefant:latest
    build: .
    container_name: elefant
    restart: unless-stopped
    ports:
      - "8095:8095"
```

### Build manually

```bash
docker build -t elefant:latest .
docker run -d --name elefant -p 8095:8095 elefant:latest
```

### Change the port

Edit `docker-compose.yml` and `nginx.conf` — replace `8095` with your preferred port.

---

## 📁 Project Structure

```
elefant/
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
├── nginx.conf              ← nginx site config
├── Dockerfile
├── docker-compose.yml
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
    reverse_proxy elefant:8095
}
```

---

## 📝 Importing Sample Notes

The `notes/` folder contains ready-made sample notes. Import any of them via the **⋮ menu → Open File**.

---

## 📄 License

MIT — see [LICENSE](LICENSE).
