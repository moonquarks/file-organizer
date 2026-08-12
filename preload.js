const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateRootPath: (newPath) => ipcRenderer.invoke('update-root-path', newPath),
  listDir: (targetPath) => ipcRenderer.invoke('list-dir', targetPath),
  getRootFolders: () => ipcRenderer.invoke('get-root-folders'),
  createFolder: (targetPath, folderName) => ipcRenderer.invoke('create-folder', targetPath, folderName),
  moveItem: (sourceFullPath, destFolderFullPath) => ipcRenderer.invoke('move-item', sourceFullPath, destFolderFullPath),
  renameItem: (itemFullPath, newName) => ipcRenderer.invoke('rename-item', itemFullPath, newName),
  getAllAudios: () => ipcRenderer.invoke('get-all-audios'),
  saveApiSettings: (settings) => ipcRenderer.invoke('save-api-settings', settings),
  transcribeAudio: (filePath) => ipcRenderer.invoke('transcribe-audio', filePath),
  listNotes: () => ipcRenderer.invoke('list-notes'),
  readNote: (noteName) => ipcRenderer.invoke('read-note', noteName),
  saveNote: (noteName, content) => ipcRenderer.invoke('save-note', noteName, content),
  deleteNote: (noteName) => ipcRenderer.invoke('delete-note', noteName),
  readMarkdownFile: (fullPath) => ipcRenderer.invoke('read-markdown-file', fullPath),
  batchMove: (sourceFullPaths, destFolderFullPath) => ipcRenderer.invoke('batch-move', sourceFullPaths, destFolderFullPath),
  batchDelete: (targetFullPaths) => ipcRenderer.invoke('batch-delete', targetFullPaths),
  deleteItem: (targetFullPath) => ipcRenderer.invoke('delete-item', targetFullPath),
  openItem: (targetFullPath) => ipcRenderer.invoke('open-item', targetFullPath)
});
