const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let CONFIG_FILE = '';
let currentConfig = {
  rootPath: path.resolve(__dirname, '..'), // 默认上一层目录
  apiType: 'gemini',
  apiKey: '',
  apiBaseUrl: '',
  apiModel: ''
};

function initConfig() {
  try {
    const userDataPath = app.getPath('userData');
    CONFIG_FILE = path.join(userDataPath, 'config.json');
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      currentConfig = Object.assign({}, currentConfig, JSON.parse(data));
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
      contextIsolation: true,
      webSecurity: false
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

// IPC Handler: 递归扫描工作区内的所有音频文件
ipcMain.handle('get-all-audios', async () => {
  const audios = [];
  
  function scan(dirPath) {
    if (!fs.existsSync(dirPath)) return;
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith('~$') || item.name.startsWith('.') || item.name === 'node_modules' || item.name === '.git' || item.name === 'Flies CSS' || item.name === 'app' || item.name === 'Manner') continue;
        const fullPath = path.join(dirPath, item.name);
        if (item.isDirectory()) {
          scan(fullPath);
        } else {
          const ext = path.extname(item.name).toLowerCase();
          if (['.mp3', '.ogg', '.wav', '.m4a', '.aac', '.flac'].includes(ext)) {
            audios.push({
              name: item.name,
              fullPath: fullPath,
              relativePath: path.relative(currentConfig.rootPath, fullPath)
            });
          }
        }
      }
    } catch (e) {
      console.warn('忽略读取失败的文件夹:', dirPath, e.message);
    }
  }

  try {
    scan(currentConfig.rootPath);
    return { success: true, audios };
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

// IPC Handler: 保存 API 配置
ipcMain.handle('save-api-settings', (event, { apiType, apiKey, apiBaseUrl, apiModel }) => {
  currentConfig.apiType = apiType;
  currentConfig.apiKey = apiKey;
  currentConfig.apiBaseUrl = apiBaseUrl;
  currentConfig.apiModel = apiModel;
  saveConfig();
  return { success: true, config: currentConfig };
});

// IPC Handler: 语音转文字转录 (使用 Gemini 1.5 Flash 或 OpenAI Whisper)
ipcMain.handle('transcribe-audio', async (event, filePath) => {
  try {
    if (!currentConfig.apiKey) {
      return { success: false, error: '请先在工作区“设置”中配置您的 API Key。' };
    }
    if (!fs.existsSync(filePath)) {
      return { success: false, error: '音频文件在磁盘上不存在。' };
    }

    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'audio/mp3';
    if (ext === '.ogg') mimeType = 'audio/ogg';
    if (ext === '.wav') mimeType = 'audio/wav';

    if (currentConfig.apiType === 'gemini') {
      const base64Data = fs.readFileSync(filePath).toString('base64');
      const baseUrl = currentConfig.apiBaseUrl || 'https://generativelanguage.googleapis.com';
      const modelName = currentConfig.apiModel || 'gemini-1.5-flash';
      const url = `${baseUrl}/v1beta/models/${modelName}:generateContent?key=${currentConfig.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              },
              {
                text: "请对这个音频文件进行精准的中文/英文文本转录。请智能区分发言段落（如果有多人对话），直接输出纯转录文本，不要带任何标题、Markdown标题、总结或废话。"
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Gemini API 错误 (HTTP ${response.status}): ${errorText}` };
      }

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return { success: false, error: 'Gemini API 返回了空内容，请检查音频文件。' };
      }
      return { success: true, text };

    } else if (currentConfig.apiType === 'openai-whisper') {
      const baseUrl = currentConfig.apiBaseUrl || 'https://api.openai.com/v1';
      const url = `${baseUrl}/audio/transcriptions`;

      const formData = new FormData();
      const fileBuffer = fs.readFileSync(filePath);
      const fileBlob = new Blob([fileBuffer], { type: mimeType });
      formData.append('file', fileBlob, path.basename(filePath));
      const modelName = currentConfig.apiModel || 'whisper-1';
      formData.append('model', modelName);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentConfig.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `OpenAI API 错误 (HTTP ${response.status}): ${errorText}` };
      }

      const json = await response.json();
      return { success: true, text: json.text };
    }

    return { success: false, error: '未知的 API 类型配置' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 获取或初始化 Notes 文件夹和便签列表
ipcMain.handle('list-notes', async () => {
  try {
    const notesDir = path.join(currentConfig.rootPath, 'Notes');
    if (!fs.existsSync(notesDir)) {
      fs.mkdirSync(notesDir, { recursive: true });
    }
    
    const items = fs.readdirSync(notesDir, { withFileTypes: true });
    const notes = [];
    for (const item of items) {
      if (item.isFile() && item.name.toLowerCase().endsWith('.md')) {
        const fullPath = path.join(notesDir, item.name);
        const stats = fs.statSync(fullPath);
        notes.push({
          name: item.name,
          fullPath: fullPath,
          mtime: stats.mtime.toLocaleString()
        });
      }
    }
    // 按修改时间倒序排列
    notes.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    return { success: true, notes, notesDir };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 读取便签内容
ipcMain.handle('read-note', async (event, noteName) => {
  try {
    const notePath = path.join(currentConfig.rootPath, 'Notes', noteName);
    if (!fs.existsSync(notePath)) {
      return { success: false, error: '便签文件不存在' };
    }
    const content = fs.readFileSync(notePath, 'utf8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 保存便签内容
ipcMain.handle('save-note', async (event, noteName, content) => {
  try {
    const notesDir = path.join(currentConfig.rootPath, 'Notes');
    if (!fs.existsSync(notesDir)) {
      fs.mkdirSync(notesDir, { recursive: true });
    }
    
    let safeName = noteName;
    if (!safeName.toLowerCase().endsWith('.md')) {
      safeName += '.md';
    }
    
    const notePath = path.join(notesDir, safeName);
    fs.writeFileSync(notePath, content, 'utf8');
    return { success: true, noteName: safeName };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 删除便签
ipcMain.handle('delete-note', async (event, noteName) => {
  try {
    const notePath = path.join(currentConfig.rootPath, 'Notes', noteName);
    if (fs.existsSync(notePath)) {
      fs.unlinkSync(notePath);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 读取通用 Markdown 文件内容 (不复制到 Notes 文件夹)
ipcMain.handle('read-markdown-file', async (event, fullPath) => {
  try {
    if (!fs.existsSync(fullPath)) {
      return { success: false, error: '目标 Markdown 文件不存在' };
    }
    const content = fs.readFileSync(fullPath, 'utf8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 批量移动分类项目
ipcMain.handle('batch-move', async (event, sourceFullPaths, destFolderFullPath) => {
  try {
    if (!fs.existsSync(destFolderFullPath)) {
      return { success: false, error: '目标目录不存在' };
    }
    for (const src of sourceFullPaths) {
      if (!fs.existsSync(src)) continue;
      const name = path.basename(src);
      let target = path.join(destFolderFullPath, name);
      
      let count = 1;
      while (fs.existsSync(target)) {
        const parsed = path.parse(name);
        target = path.join(destFolderFullPath, `${parsed.name} (${count})${parsed.ext}`);
        count++;
      }
      fs.renameSync(src, target);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 批量删除项目
ipcMain.handle('batch-delete', async (event, targetFullPaths) => {
  try {
    for (const target of targetFullPaths) {
      if (!fs.existsSync(target)) continue;
      const stat = fs.statSync(target);
      if (stat.isDirectory()) {
        fs.rmSync(target, { recursive: true, force: true });
      } else {
        fs.unlinkSync(target);
      }
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});


