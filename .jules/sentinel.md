## 2024-05-18 - [Fix Path Traversal in IPC Handlers]
**Vulnerability:** Path Traversal vulnerability through unprotected IPC file system handlers (e.g. fs:readFile, fs:writeFile) allowing an attacker to read/write arbitrary files outside the allowed workspace.
**Learning:** In Electron apps, when exposing file system APIs to the renderer process (even with contextIsolation), paths provided by the renderer must be strictly validated against an allowed set of directories (e.g. selected via native dialogs) to prevent directory traversal attacks (using '../' or absolute paths).
**Prevention:** Implement an `isSafePath` validation function that checks if the resolved target path starts with an allowed workspace directory. Apply this validation to all IPC file system endpoints.
