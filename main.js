const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Emerald',
        icon: path.join(__dirname, 'assets/icons/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: '#1e1e24',
        autoHideMenuBar: true,
        frame: false, // frameless window to unite controls
    });

    // Remove the default toolbar menu completely
    mainWindow.setMenu(null);

    // We serve exactly the same index.html
    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    loadAllowedWorkspaces();
    createWindow();

    // Check for updates seamlessly
    autoUpdater.checkForUpdatesAndNotify();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Update event listeners
autoUpdater.on('update-available', () => {
    if (mainWindow) mainWindow.webContents.send('updater:available');
});
autoUpdater.on('update-downloaded', () => {
    if (mainWindow) mainWindow.webContents.send('updater:downloaded');
});

ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall();
});
ipcMain.handle('updater:check', () => {
    autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});


// ── Secure Workspace Management ────────────────────────────────

let allowedWorkspaces = [];

function loadAllowedWorkspaces() {
    try {
        const userDataPath = app.getPath('userData');
        const workspacesFile = path.join(userDataPath, 'allowed-workspaces.json');
        if (fs.existsSync(workspacesFile)) {
            allowedWorkspaces = JSON.parse(fs.readFileSync(workspacesFile, 'utf8'));
        }
    } catch (err) {
        console.error('Failed to load allowed workspaces:', err);
    }
}

function saveAllowedWorkspace(newPath) {
    if (!allowedWorkspaces.includes(newPath)) {
        allowedWorkspaces.push(newPath);
        try {
            const userDataPath = app.getPath('userData');
            const workspacesFile = path.join(userDataPath, 'allowed-workspaces.json');
            fs.writeFileSync(workspacesFile, JSON.stringify(allowedWorkspaces), 'utf8');
        } catch (err) {
            console.error('Failed to save allowed workspaces:', err);
        }
    }
}

function isSafePath(targetPath) {
    if (!targetPath) return false;
    const resolvedPath = path.resolve(targetPath);
    return allowedWorkspaces.some(allowedPath => {
        const resolvedAllowed = path.resolve(allowedPath);
        return resolvedPath === resolvedAllowed || resolvedPath.startsWith(resolvedAllowed + path.sep);
    });
}

// ── IPC Listeners for Window Controls ──────────────────────────

ipcMain.handle('window:minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.handle('window:close', () => {
    if (mainWindow) mainWindow.close();
});

// ── IPC Listeners for Local FS ─────────────────────────────────

// Utility path join
ipcMain.handle('fs:joinPath', (_, ...parts) => path.join(...parts));

// 1. Open Directory Picker dialog
ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    if (canceled || filePaths.length === 0) return null;
    const selectedPath = filePaths[0];
    saveAllowedWorkspace(selectedPath);
    return selectedPath;
});

// 2. Read all files in a directory (recursive) looking for .md files
ipcMain.handle('fs:readDirectory', async (_, dirPath) => {
    if (!isSafePath(dirPath)) {
        console.error('Path traversal blocked (fs:readDirectory):', dirPath);
        return null;
    }
    const items = [];

    async function scan(currentPath, parentId = null) {
        const entries = await fsPromises.readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            // Ignore hidden files / node_modules
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

            const fullPath = path.join(currentPath, entry.name);
            const id = Buffer.from(fullPath).toString('base64'); // use path as stable ID

            if (entry.isDirectory()) {
                items.push({
                    id,
                    type: 'folder',
                    parentId,
                    title: entry.name,
                    isOpen: false,
                    fsPath: fullPath,
                });
                await scan(fullPath, id);
            } else if (entry.isFile()) {
                const lowerName = entry.name.toLowerCase();
                const isMarkdown = lowerName.endsWith('.md');
                const isImage = /\.(png|jpe?g|gif|webp|svg)$/.test(lowerName);

                if (isMarkdown || isImage) {
                    const stats = await fsPromises.stat(fullPath);
                    items.push({
                        id,
                        type: isMarkdown ? 'file' : 'image', // custom 'image' type for sidebar
                        parentId,
                        title: entry.name,
                        lastModified: stats.mtimeMs,
                        fsPath: fullPath,
                        // Content is loaded lazily to save memory
                    });
                }
            }
        }
    }

    try {
        await scan(dirPath);
        return items;
    } catch (err) {
        console.error('Failed to read directory:', err);
        return null;
    }
});

// 3. Read a specific file's content
ipcMain.handle('fs:readFile', async (_, filePath) => {
    if (!isSafePath(filePath)) {
        console.error('Path traversal blocked (fs:readFile):', filePath);
        return null;
    }
    try {
        return await fsPromises.readFile(filePath, 'utf8');
    } catch (err) {
        console.error('Failed to read file:', err);
        return null;
    }
});

// 4. Save file to disk
ipcMain.handle('fs:writeFile', async (_, filePath, content) => {
    if (!isSafePath(filePath)) {
        console.error('Path traversal blocked (fs:writeFile):', filePath);
        return false;
    }
    try {
        await fsPromises.writeFile(filePath, content, 'utf8');
        return true;
    } catch (err) {
        console.error('Failed to write file:', err);
        return false;
    }
});

// 5. Create new folder
ipcMain.handle('fs:mkdir', async (_, dirPath) => {
    if (!isSafePath(dirPath)) {
        console.error('Path traversal blocked (fs:mkdir):', dirPath);
        return false;
    }
    try {
        await fsPromises.mkdir(dirPath, { recursive: true });
        return true;
    } catch (err) {
        console.error('Failed to create folder:', err);
        return false;
    }
});

// 6. Delete file or folder
ipcMain.handle('fs:delete', async (_, itemPath) => {
    if (!isSafePath(itemPath)) {
        console.error('Path traversal blocked (fs:delete):', itemPath);
        return false;
    }
    try {
        if (!fs.existsSync(itemPath)) return true; // Already gone? Success.
        const stat = await fsPromises.stat(itemPath);
        if (stat.isDirectory()) {
            await fsPromises.rm(itemPath, { recursive: true, force: true });
        } else {
            await fsPromises.unlink(itemPath);
        }
        return true;
    } catch (err) {
        console.error('Failed to delete item:', err);
        return false;
    }
});

// 7. Rename file or folder
ipcMain.handle('fs:rename', async (_, oldPath, newPath) => {
    if (!isSafePath(oldPath) || !isSafePath(newPath)) {
        console.error('Path traversal blocked (fs:rename):', oldPath, newPath);
        return false;
    }
    try {
        await fsPromises.rename(oldPath, newPath);
        return true;
    } catch (err) {
        console.error('Failed to rename item:', err);
        return false;
    }
});
