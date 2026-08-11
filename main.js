const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let CONFIG_FILE = '';
let currentConfig = {
  rootPath: path.resolve(__dirname, '..') // 默认上一层目录
};

function initConfig() {
  try {
    const userDataPath = app.getPath('userData');
    CONFIG_FILE = path.join(userDataPath, 'config.json');
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      currentConfig = JSON.parse(data);
    } else {
      saveConfig();
    }
  } catch (e) {
    console.error('初始化配置文件失败，使用默认值:', e);
  }
}

function saveConfig() {
  if (!CONFIG_FILE) return;
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentConfig, null, 2), 'utf8');
  } catch (e) {
    console.error('保存配置文件失败:', e);
  }
}

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 950,
    minHeight: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false,
    backgroundColor: '#0f172a'
  });

  win.loadFile('index.html');
  
  win.once('ready-to-show', () => {
    win.show();
  });
}

app.whenReady().then(() => {
  initConfig(); // 载入持久化配置
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler: 获取配置
ipcMain.handle('get-config', () => {
  return { success: true, config: currentConfig };
});

// IPC Handler: 更新工作区根目录
ipcMain.handle('update-root-path', (event, newPath) => {
  try {
    const resolvedPath = path.resolve(newPath);
    if (!fs.existsSync(resolvedPath)) {
      return { success: false, error: '该目录在本地磁盘上不存在' };
    }
    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      return { success: false, error: '该路径不是一个有效的文件夹目录' };
    }
    
    currentConfig.rootPath = resolvedPath;
    saveConfig();
    return { success: true, config: currentConfig };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 获取目录内容
ipcMain.handle('list-dir', async (event, subPath = '') => {
  const targetDirFullPath = path.resolve(currentConfig.rootPath, subPath);
  
  if (!targetDirFullPath.startsWith(currentConfig.rootPath)) {
    return { success: false, error: '无权访问工作根目录外的路径' };
  }

  if (!fs.existsSync(targetDirFullPath)) {
    return { success: false, error: '目录不存在' };
  }

  try {
    const items = fs.readdirSync(targetDirFullPath, { withFileTypes: true });
    const folders = [];
    const files = [];

    for (const item of items) {
      if (item.name.startsWith('~$') || item.name === 'node_modules' || item.name === '.git') continue;
      
      const itemFullPath = path.join(targetDirFullPath, item.name);
      const relativePath = path.relative(currentConfig.rootPath, itemFullPath);

      let size = 0;
      let mtime = '';
      try {
        const itemStats = fs.statSync(itemFullPath);
        size = itemStats.size;
        mtime = itemStats.mtime.toLocaleString();
      } catch (e) {}

      const itemInfo = {
        name: item.name,
        path: relativePath,
        fullPath: itemFullPath,
        size: size,
        mtime: mtime
      };

      if (item.isDirectory()) {
        folders.push(itemInfo);
      } else {
        files.push(itemInfo);
      }
    }

    return {
      success: true,
      currentPath: subPath,
      fullCurrentPath: targetDirFullPath,
      folders,
      files
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 获取根目录下的所有子文件夹
ipcMain.handle('get-root-folders', async () => {
  try {
    const items = fs.readdirSync(currentConfig.rootPath, { withFileTypes: true });
    const folders = [];
    
    for (const item of items) {
      if (item.isDirectory() && item.name !== 'node_modules' && item.name !== '.git' && item.name !== 'Flies CSS' && item.name !== 'app') {
        folders.push({
          name: item.name,
          fullPath: path.join(currentConfig.rootPath, item.name)
        });
      }
    }
    return { success: true, folders };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 新建文件夹
ipcMain.handle('create-folder', async (event, targetSubPath, folderName) => {
  try {
    const targetDirFullPath = path.resolve(currentConfig.rootPath, targetSubPath, folderName);
    if (!targetDirFullPath.startsWith(currentConfig.rootPath)) {
      return { success: false, error: '越权创建目录' };
    }
    if (fs.existsSync(targetDirFullPath)) {
      return { success: false, error: '同名文件夹已存在' };
    }
    fs.mkdirSync(targetDirFullPath, { recursive: true });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 移动/分类文件
ipcMain.handle('move-item', async (event, sourceFullPath, destFolderFullPath) => {
  try {
    if (!fs.existsSync(sourceFullPath)) {
      return { success: false, error: '源文件不存在' };
    }
    if (!fs.existsSync(destFolderFullPath)) {
      return { success: false, error: '目标文件夹不存在' };
    }

    const fileName = path.basename(sourceFullPath);
    let targetFullPath = path.join(destFolderFullPath, fileName);

    let count = 1;
    while (fs.existsSync(targetFullPath)) {
      const parsed = path.parse(fileName);
      targetFullPath = path.join(destFolderFullPath, `${parsed.name} (${count})${parsed.ext}`);
      count++;
    }

    fs.renameSync(sourceFullPath, targetFullPath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 重命名文件或文件夹
ipcMain.handle('rename-item', async (event, sourceFullPath, newName) => {
  try {
    if (!fs.existsSync(sourceFullPath)) {
      return { success: false, error: '源文件或文件夹不存在' };
    }
    if (!sourceFullPath.startsWith(currentConfig.rootPath)) {
      return { success: false, error: '无权修改该路径下的项目' };
    }
    
    const dir = path.dirname(sourceFullPath);
    const targetFullPath = path.join(dir, newName);
    
    if (fs.existsSync(targetFullPath)) {
      return { success: false, error: '同名文件或文件夹已存在' };
    }
    
    fs.renameSync(sourceFullPath, targetFullPath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 删除文件或文件夹
ipcMain.handle('delete-item', async (event, targetFullPath) => {
  try {
    if (!targetFullPath.startsWith(currentConfig.rootPath)) {
      return { success: false, error: '无权操作工作根目录外的文件' };
    }
    if (!fs.existsSync(targetFullPath)) {
      return { success: false, error: '目标文件/文件夹不存在' };
    }
    
    const stat = fs.statSync(targetFullPath);
    if (stat.isDirectory()) {
      fs.rmSync(targetFullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetFullPath);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 打开文件/文件夹
ipcMain.handle('open-item', async (event, targetFullPath) => {
  try {
    if (!fs.existsSync(targetFullPath)) {
      return { success: false, error: '目标路径不存在' };
    }
    await shell.openPath(targetFullPath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
