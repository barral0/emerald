## 2024-05-24 - [CRITICAL] Fix path traversal in file handlers
**Vulnerability:** Electron IPC file system handlers in main.js did not validate paths passed from the renderer process.
**Learning:** The renderer process could arbitrarily read, write, or delete files outside of user-approved workspace directories by passing absolute paths or relative paths (`../../`) via IPC handlers.
**Prevention:** Enforce an `isSafePath` security check in all file system IPC handlers on the main process side. Maintain a Set of `allowedWorkspaces` strictly set via native dialogs and securely persisted in `allowed-workspaces.json` in the app's `userData` directory, completely preventing the renderer from bypassing scope.
