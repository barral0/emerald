## 2024-05-24 - [Path Traversal in Electron IPC]
**Vulnerability:** Path traversal vulnerability found in the Electron IPC file system handlers. Functions like `fs:readFile`, `fs:writeFile`, and `fs:delete` were accepting arbitrary paths from the renderer process without validation.
**Learning:** This exposes the entire local filesystem to the renderer process, meaning an XSS vulnerability in the renderer could be escalated to RCE or arbitrary file read/write.
**Prevention:** Implement an `isSafePath` check that ensures the resolved path starts with the user-selected workspace directory.
