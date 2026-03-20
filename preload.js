const { contextBridge, ipcRenderer } = require('electron');

// Expose these IPC functions to the renderer process as `window.electronAPI`
contextBridge.exposeInMainWorld('electronAPI', {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    readDirectory: (dirPath) => ipcRenderer.invoke('fs:readDirectory', dirPath),
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    mkdir: (dirPath) => ipcRenderer.invoke('fs:mkdir', dirPath),
    deleteItem: (itemPath) => ipcRenderer.invoke('fs:delete', itemPath),
    renameItem: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    joinPath: (...parts) => ipcRenderer.invoke('fs:joinPath', ...parts),
    sep: (process.platform === 'win32' ? '\\' : '/'),

    // Window Controls
    minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
    maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
    closeWindow: () => ipcRenderer.invoke('window:close'),

    // Auto Updater
    onUpdateAvailable: (callback) => ipcRenderer.on('updater:available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('updater:downloaded', callback),
    onUpdateError: (callback) => ipcRenderer.on('updater:error', callback),
    installUpdate: () => ipcRenderer.invoke('updater:install'),
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),

    // App Scale
    setZoomFactor: (factor) => {
        const { webFrame } = require('electron');
        webFrame.setZoomFactor(factor);
    }
});
