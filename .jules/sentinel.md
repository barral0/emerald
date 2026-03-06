## 2024-05-24 - [Path Traversal in IPC File System Handlers]
**Vulnerability:** File system handlers in the Electron main process (e.g., fs:readFile, fs:writeFile) accept absolute paths from the renderer without verifying if they fall within an authorized workspace, allowing a compromised renderer to read/write arbitrary system files.
**Learning:** Directly trusting paths provided by the renderer process via IPC creates a critical path traversal vulnerability.
**Prevention:** Maintain a secure list of authorized paths (e.g., safeRoots / allowedWorkspaces) in the main process, populated only via native dialogs. Validate all incoming IPC file paths against this list using a robust `isSafePath` check before any fs operation.
