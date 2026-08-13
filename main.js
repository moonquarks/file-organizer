const { app, BrowserWindow, ipcMain, shell, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');

// 必须在 app.ready 之前调用，且只能调用一次！注册特权协议以正确支持盘符、反斜杠和媒体串流
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app-file',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true
    }
  }
]);

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
    frame: false, // 设为无边框窗口，适配自定义标题栏 UI
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
  
  // 自动通过麦克风等媒体权限申请，防止沙箱拦截
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      return callback(true);
    }
    callback(false);
  });
  
  let forceClose = false;
  win.on('close', (e) => {
    if (forceClose) return;
    e.preventDefault();
    win.webContents.send('app-close-request');
  });

  // 窗口控制 IPC 通道监听
  ipcMain.on('window-minimize', () => {
    win.minimize();
  });
  ipcMain.on('window-maximize', () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });
  ipcMain.on('window-close', () => {
    forceClose = true;
    win.close();
  });
  
  win.once('ready-to-show', () => {
    win.show();
  });
}

app.whenReady().then(() => {
  initConfig(); // 载入持久化配置
  
  // 注册安全协议拦截器，将 app-file:// 协议转存并流式传回给 HTML5 audio
  protocol.handle('app-file', (request) => {
    try {
      const url = new URL(request.url);
      let localPath = '';
      // 如果主机名存在且长度为 1，说明 Windows 盘符（如 c 或 d）被 Chromium 错误解析为主机名了
      if (url.hostname && url.hostname.length === 1) {
        localPath = url.hostname + ':' + url.pathname;
      } else {
        localPath = url.pathname;
        if (process.platform === 'win32' && localPath.startsWith('/')) {
          localPath = localPath.substring(1);
        }
      }
      
      const filePath = decodeURIComponent(localPath);
      
      if (!fs.existsSync(filePath)) {
        return new Response('Not Found', { status: 404 });
      }
      
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      // 根据扩展名自动识别 content-type
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'audio/mpeg';
      if (ext === '.wav') contentType = 'audio/wav';
      else if (ext === '.ogg') contentType = 'audio/ogg';
      else if (ext === '.m4a') contentType = 'audio/x-m4a';
      else if (ext === '.flac') contentType = 'audio/flac';
      
      // 处理 Range 分片请求，返回 206 状态，以完美计算音频时长和支持播放快进
      const range = request.headers.get('range');
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : undefined;
        const endByte = end !== undefined ? end : fileSize - 1;
        const chunkSize = (endByte - start) + 1;
        
        const stream = fs.createReadStream(filePath, { start, end: endByte });
        
        return new Response(stream, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${endByte}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Content-Type': contentType
          }
        });
      }
      
      // 如果没有 Range header (默认直接请求，如元数据拉取)
      const stream = fs.createReadStream(filePath);
      return new Response(stream, {
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes'
        }
      });
      
    } catch (e) {
      try {
        const logFile = path.join(app.getPath('userData'), 'debug_protocol.log');
        fs.appendFileSync(logFile, `[Handler Fatal] ${new Date().toISOString()} | URL: ${request.url} | Message: ${e.message}\n`);
      } catch (errLog) {}
      throw e;
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.exit(0); // 所有窗口关闭时，彻底强制杀死主应用进程
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
ipcMain.handle('save-api-settings', (event, { apiType, apiKey, apiBaseUrl, apiModel, apiStream }) => {
  currentConfig.apiType = apiType;
  currentConfig.apiKey = apiKey;
  currentConfig.apiBaseUrl = apiBaseUrl;
  currentConfig.apiModel = apiModel;
  currentConfig.apiStream = apiStream;
  saveConfig();
  return { success: true, config: currentConfig };
});

// IPC Handler: 语音转文字转录 (使用 Gemini 1.5 Flash 或 OpenAI Whisper)
let transcribeAbortController = null;

ipcMain.handle('abort-transcription', () => {
  if (transcribeAbortController) {
    transcribeAbortController.abort();
    transcribeAbortController = null;
  }
  return { success: true };
});

ipcMain.handle('transcribe-audio', async (event, filePath) => {
  if (transcribeAbortController) {
    try {
      transcribeAbortController.abort();
    } catch(e) {}
  }
  transcribeAbortController = new AbortController();
  const signal = transcribeAbortController.signal;

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
      const url = `${baseUrl}/v1/models/${modelName}:generateContent?key=${currentConfig.apiKey}`;

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
        }),
        signal: signal
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

    } else if (currentConfig.apiType === 'openai-whisper' || currentConfig.apiType === 'deepseek') {
      const isDeepSeek = currentConfig.apiType === 'deepseek';
      const baseUrl = currentConfig.apiBaseUrl || (isDeepSeek ? 'https://api.deepseek.com' : 'https://api.openai.com/v1');
      
      let url = baseUrl;
      if (!url.endsWith('/v1') && !url.endsWith('/v1/')) {
        url = url.endsWith('/') ? `${url}v1` : `${url}/v1`;
      }
      url = `${url}/audio/transcriptions`;

      const formData = new FormData();
      const fileBuffer = fs.readFileSync(filePath);
      const fileBlob = new Blob([fileBuffer], { type: mimeType });
      formData.append('file', fileBlob, path.basename(filePath));
      formData.append('model', 'whisper-1');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentConfig.apiKey}`
        },
        body: formData,
        signal: signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (isDeepSeek && (response.status === 404 || response.status === 405)) {
          return { success: false, error: '官方 DeepSeek 接口不支持音频转录。如果是中转代理接口，请检查代理地址是否配置正确；如果是官方 API，请切换为 Gemini。' };
        }
        return { success: false, error: `音频转录 API 错误 (HTTP ${response.status}): ${errorText}` };
      }

      const json = await response.json();
      return { success: true, text: json.text };
    }

    return { success: false, error: '未知的 API 类型配置' };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'TRANSCRIPTION_ABORTED' };
    }
    return { success: false, error: err.message };
  } finally {
    if (transcribeAbortController && transcribeAbortController.signal === signal) {
      transcribeAbortController = null;
    }
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

// IPC Handler: 保存录音文件
ipcMain.handle('save-record-file', async (event, filename, buffer) => {
  try {
    const recordDir = path.join(currentConfig.rootPath, 'Record');
    if (!fs.existsSync(recordDir)) {
      fs.mkdirSync(recordDir, { recursive: true });
    }
    const filePath = path.join(recordDir, filename);
    
    // 如果文件名是 mp3，则将传入的 PCM WAV 二进制缓冲数据自动转换为标准 MP3
    if (filename.endsWith('.mp3')) {
      const wavBuffer = Buffer.from(buffer);
      if (wavBuffer.length >= 44) {
        const numChannels = wavBuffer.readUInt16LE(22);
        const sampleRate = wavBuffer.readUInt32LE(24);
        const bitsPerSample = wavBuffer.readUInt16LE(34);
        
        if (numChannels === 2 && bitsPerSample === 16) {
          const dataSub = wavBuffer.subarray(44);
          const numSamples = Math.floor(dataSub.length / 4); // 4字节对应一个采样点 (2声道 * 2字节)
          
          const leftChannel = new Int16Array(numSamples);
          const rightChannel = new Int16Array(numSamples);
          
          // 1. 异步切片提取双声道数据 (0% ~ 20%)
          const extractChunkSize = 100000;
          for (let i = 0; i < numSamples; i += extractChunkSize) {
            const end = Math.min(i + extractChunkSize, numSamples);
            for (let j = i; j < end; j++) {
              leftChannel[j] = dataSub.readInt16LE(j * 4);
              rightChannel[j] = dataSub.readInt16LE(j * 4 + 2);
            }
            // 释放控制权，防止主线程卡死
            await new Promise(resolve => setTimeout(resolve, 0));
            const percent = Math.floor((i / numSamples) * 20);
            event.sender.send('save-record-progress', { percent });
          }
          
          const lamejs = await import('@breezystack/lamejs');
          const mp3encoder = new lamejs.Mp3Encoder(2, sampleRate, 128); // 双声道，128kbps 立体声
          const mp3Chunks = [];
          
          // 2. 异步切片编码 MP3 帧 (20% ~ 98%)
          const sampleBlockSize = 1152;
          const encodeYieldBlocks = 50; // 每 50 个 block 释放一次主线程
          let blockCount = 0;
          
          for (let i = 0; i < numSamples; i += sampleBlockSize) {
            const leftChunk = leftChannel.subarray(i, i + sampleBlockSize);
            const rightChunk = rightChannel.subarray(i, i + sampleBlockSize);
            const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) {
              mp3Chunks.push(Buffer.from(mp3buf));
            }
            
            blockCount++;
            if (blockCount % encodeYieldBlocks === 0) {
              await new Promise(resolve => setTimeout(resolve, 0));
              const percent = 20 + Math.floor((i / numSamples) * 78);
              event.sender.send('save-record-progress', { percent });
            }
          }
          
          const endBuf = mp3encoder.flush();
          if (endBuf.length > 0) {
            mp3Chunks.push(Buffer.from(endBuf));
          }
          
          event.sender.send('save-record-progress', { percent: 100 });
          
          const mp3Buffer = Buffer.concat(mp3Chunks);
          fs.writeFileSync(filePath, mp3Buffer);
          return { success: true, filePath };
        }
      }
    }
    
    // 降级回退：普通写入
    fs.writeFileSync(filePath, Buffer.from(buffer));
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 读取录音文件列表
ipcMain.handle('list-record-files', async () => {
  try {
    const recordDir = path.join(currentConfig.rootPath, 'Record');
    if (!fs.existsSync(recordDir)) {
      return { success: true, files: [] };
    }
    const items = fs.readdirSync(recordDir, { withFileTypes: true });
    const files = [];
    for (const item of items) {
      if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (['.webm', '.wav', '.mp3', '.ogg', '.m4a'].includes(ext)) {
          const fullPath = path.join(recordDir, item.name);
          const stats = fs.statSync(fullPath);
          files.push({
            name: item.name,
            fullPath: fullPath,
            size: stats.size,
            mtime: stats.mtime.toLocaleString()
          });
        }
      }
    }
    files.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    return { success: true, files };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 实时同声传译音频片段 (支持自定义时长和流式打字机输出)
ipcMain.handle('interpret-audio-slice', async (event, base64Data, targetLang, recentHistory = [], taskId) => {
  try {
    if (!currentConfig.apiKey) {
      return { success: false, error: '未配置 API Key，请前往设置配置。' };
    }
    
    const isDeepSeek = currentConfig.apiType === 'deepseek';
    const isGemini = currentConfig.apiType === 'gemini';
    const isWhisper = currentConfig.apiType === 'openai-whisper';

    // 格式化最近两次的翻译结果做上下文
    let contextStr = '';
    if (recentHistory && recentHistory.length > 0) {
      contextStr = "\n\nHere is the recent translation context for reference:\n" + 
        recentHistory.map(h => `${h.original} ||| ${h.translation}`).join('\n') + "\n";
    }
    
    if (isGemini) {
      const baseUrl = currentConfig.apiBaseUrl || 'https://generativelanguage.googleapis.com';
      const modelName = currentConfig.apiModel || 'gemini-1.5-flash';
      
      const isStream = currentConfig.apiStream !== false;
      const method = isStream ? 'streamGenerateContent' : 'generateContent';
      const url = `${baseUrl}/v1/models/${modelName}:${method}?key=${currentConfig.apiKey}`;
      
      const promptText = `You are a professional simultaneous interpreter for Model United Nations debates.
Please interpret the spoken audio chunk.
If targetLang is 'zh-to-en', translate Chinese speech into English.
If targetLang is 'en-to-zh', translate English speech into Chinese.
Please first transcribe the original spoken speech in its original language, and then translate it.
Format your output strictly as:
[Original Transcription] ||| [Translation]

Example 1:
大家好，我是联合国代表。 ||| Hello everyone, I am the delegate of the United Nations.

Example 2:
We must address this issue immediately. ||| 我们必须立刻解决这个问题。
${contextStr}
The current translation configuration is: ${targetLang === 'zh-to-en' ? 'Chinese to English' : 'English to Chinese'}.
Directly output the result in the above format, do not include any markdown bolding, prefixes, explanations, or headings.`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/webm',
                  data: base64Data
                }
              },
              {
                text: promptText
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `API 错误 (HTTP ${response.status}): ${errText}` };
      }

      if (!isStream) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          return { success: false, error: 'API 返回内容为空' };
        }
        return { success: true, text };
      }

      // 流式解析 Gemini 的 JSON 数组响应块
      let buffer = '';
      let fullText = '';
      const decoder = new TextDecoder();
      for await (const chunk of response.body) {
        buffer += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
        
        if (buffer.startsWith('[')) {
          buffer = buffer.slice(1);
        }
        
        let braceCount = 0;
        let startIdx = -1;
        for (let i = 0; i < buffer.length; i++) {
          if (buffer[i] === '{') {
            if (braceCount === 0) startIdx = i;
            braceCount++;
          } else if (buffer[i] === '}') {
            braceCount--;
            if (braceCount === 0 && startIdx !== -1) {
              const jsonStr = buffer.slice(startIdx, i + 1);
              try {
                const json = JSON.parse(jsonStr);
                const chunkText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (chunkText) {
                  fullText += chunkText;
                  event.sender.send('interpret-slice-chunk', { taskId, chunk: chunkText });
                }
              } catch (e) {
                // 忽略非完整 JSON 块解析异常
              }
              buffer = buffer.slice(i + 1);
              i = -1;
              startIdx = -1;
            }
          }
        }
      }
      return { success: true, text: fullText };
      
    } else if (isDeepSeek || isWhisper) {
      // 步骤 1：使用 Whisper 进行分片语音转文字
      const stream = require('stream');
      const buffer = Buffer.from(base64Data, 'base64');
      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);
      
      const whisperBaseUrl = currentConfig.apiBaseUrl || (isDeepSeek ? 'https://api.deepseek.com' : 'https://api.openai.com/v1');
      let whisperUrl = whisperBaseUrl;
      if (!whisperUrl.endsWith('/v1') && !whisperUrl.endsWith('/v1/')) {
        whisperUrl = whisperUrl.endsWith('/') ? `${whisperUrl}v1` : `${whisperUrl}/v1`;
      }
      whisperUrl = `${whisperUrl}/audio/transcriptions`;
      
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', bufferStream, {
        filename: 'slice.webm',
        contentType: 'audio/webm'
      });
      form.append('model', 'whisper-1');
      
      let transcriptionText = '';
      try {
        const whisperResponse = await fetch(whisperUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentConfig.apiKey}`,
            ...form.getHeaders()
          },
          body: form
        });
        
        if (!whisperResponse.ok) {
          const errBody = await whisperResponse.text();
          if (isDeepSeek && (whisperResponse.status === 404 || whisperResponse.status === 405)) {
            return { 
              success: false, 
              error: '官方 DeepSeek 接口不支持音频输入。如果您使用的是代理密钥，请检查设置中的代理地址；如果使用的是官方 DeepSeek 密钥，请在设置中将“接口类型”切换为 Gemini 以启用同传音频功能。'
            };
          }
          return { success: false, error: `语音转录失败 (HTTP ${whisperResponse.status}): ${errBody}` };
        }
        
        const whisperJson = await whisperResponse.json();
        transcriptionText = whisperJson.text || '';
      } catch (err) {
        return { success: false, error: '语音转录过程发生网络异常: ' + err.message };
      }
      
      if (!transcriptionText.trim()) {
        return { success: true, text: '（静音或未检测到发言） ||| （翻译未生成）' };
      }
      
      // 步骤 2：使用 DeepSeek/OpenAI 进行文本翻译 (支持流式传输)
      const chatBaseUrl = currentConfig.apiBaseUrl || (isDeepSeek ? 'https://api.deepseek.com' : 'https://api.openai.com/v1');
      const chatUrl = chatBaseUrl.endsWith('/v1') || chatBaseUrl.endsWith('/v1/')
        ? (chatBaseUrl.endsWith('/') ? `${chatBaseUrl}chat/completions` : `${chatBaseUrl}/chat/completions`)
        : (chatBaseUrl.endsWith('/') ? `${chatBaseUrl}v1/chat/completions` : `${chatBaseUrl}/v1/chat/completions`);
      
      const modelName = currentConfig.apiModel || (isDeepSeek ? 'deepseek-chat' : 'gpt-4o-mini');
      const promptText = `You are a professional simultaneous interpreter for Model United Nations debates.
Please translate the following transcribed spoken text.
If targetLang is 'zh-to-en', translate Chinese text into English.
If targetLang is 'en-to-zh', translate English text into Chinese.
Please first output the original transcription, and then translate it.
Format your output strictly as:
[Original Transcription] ||| [Translation]

Example 1:
大家好，我是联合国代表。 ||| Hello everyone, I am the delegate of the United Nations.

Example 2:
We must address this issue immediately. ||| 我们必须立刻解决这个问题。
${contextStr}
Transcribed speech to translate:
${transcriptionText}

The current translation configuration is: ${targetLang === 'zh-to-en' ? 'Chinese to English' : 'English to Chinese'}.
Directly output the result in the above format, do not include any markdown bolding, prefixes, explanations, or headings.`;

      const isStream = currentConfig.apiStream !== false;
      const chatResponse = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentConfig.apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: promptText }],
          temperature: 0.3,
          stream: isStream // 动态启用 SSE 流式输出
        })
      });

      if (!chatResponse.ok) {
        const errText = await chatResponse.text();
        return { success: false, error: `同传翻译 API 错误 (HTTP ${chatResponse.status}): ${errText}` };
      }

      if (!isStream) {
        const chatJson = await chatResponse.json();
        const textResult = chatJson.choices?.[0]?.message?.content;
        if (!textResult) {
          return { success: false, error: '同传翻译返回内容为空' };
        }
        return { success: true, text: textResult.trim() };
      }

      // 流式解析 OpenAI/DeepSeek SSE data: 格式
      let sseBuffer = '';
      let fullText = '';
      const decoder = new TextDecoder();
      for await (const chunk of chatResponse.body) {
        const text = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
        sseBuffer += text;
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop(); // 保留不完整的一行
        
        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data: ')) {
            const dataStr = cleanLine.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const json = JSON.parse(dataStr);
              const chunkText = json.choices?.[0]?.delta?.content || '';
              if (chunkText) {
                fullText += chunkText;
                event.sender.send('interpret-slice-chunk', { taskId, chunk: chunkText });
              }
            } catch (e) {
              // 忽略碎片块解析错误
            }
          }
        }
      }
      return { success: true, text: fullText };
    } else {
      return { success: false, error: '暂不支持的 API 类别' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Handler: 纯文本翻译功能
ipcMain.handle('translate-text', async (event, text, targetLang) => {
  try {
    if (!currentConfig.apiKey) {
      return { success: false, error: '未配置 API Key，请前往“工作区路径”设置。' };
    }
    
    const isDeepSeek = currentConfig.apiType === 'deepseek';
    const isGemini = currentConfig.apiType === 'gemini';
    const isWhisper = currentConfig.apiType === 'openai-whisper';
    const isStream = currentConfig.apiStream !== false;
    
    const promptText = `You are a professional translator.
Please translate the following text into ${targetLang === 'to-en' ? 'English' : 'Chinese'}.
Translate exactly what is provided. Keep the tone natural and appropriate for Model United Nations debates or academic contexts if relevant.
Do not output any introductory or explanatory text. Direct output the translated result only.

Text to translate:
${text}`;

    if (isGemini) {
      const baseUrl = currentConfig.apiBaseUrl || 'https://generativelanguage.googleapis.com';
      const modelName = currentConfig.apiModel || 'gemini-1.5-flash';
      const method = isStream ? 'streamGenerateContent' : 'generateContent';
      const url = `${baseUrl}/v1/models/${modelName}:${method}?key=${currentConfig.apiKey}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时防卡死
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptText
            }]
          }]
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `API 错误 (HTTP ${response.status}): ${errText}` };
      }

      if (!isStream) {
        const json = await response.json();
        const translatedText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!translatedText) {
          return { success: false, error: 'API 接口返回了空翻译结果。' };
        }
        return { success: true, text: translatedText.trim() };
      }

      // 流式解析
      let buffer = '';
      let fullText = '';
      const decoder = new TextDecoder();
      for await (const chunk of response.body) {
        buffer += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
        
        if (buffer.startsWith('[')) {
          buffer = buffer.slice(1);
        }
        
        let braceCount = 0;
        let startIdx = -1;
        for (let i = 0; i < buffer.length; i++) {
          if (buffer[i] === '{') {
            if (braceCount === 0) startIdx = i;
            braceCount++;
          } else if (buffer[i] === '}') {
            braceCount--;
            if (braceCount === 0 && startIdx !== -1) {
              const jsonStr = buffer.slice(startIdx, i + 1);
              try {
                const json = JSON.parse(jsonStr);
                const chunkText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (chunkText) {
                  fullText += chunkText;
                  event.sender.send('translate-text-chunk', { chunk: chunkText });
                }
              } catch (e) {
                // 忽略非完整 JSON
              }
              buffer = buffer.slice(i + 1);
              i = -1;
              startIdx = -1;
            }
          }
        }
      }
      return { success: true, text: fullText.trim() };

    } else if (isDeepSeek || isWhisper) {
      const baseUrl = currentConfig.apiBaseUrl || (isDeepSeek ? 'https://api.deepseek.com' : 'https://api.openai.com/v1');
      const modelName = currentConfig.apiModel || (isDeepSeek ? 'deepseek-chat' : 'gpt-4o-mini');
      
      let url = baseUrl;
      if (!url.endsWith('/v1') && !url.endsWith('/v1/')) {
        url = url.endsWith('/') ? `${url}v1` : `${url}/v1`;
      }
      url = `${url}/chat/completions`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时防卡死

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentConfig.apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'user', content: promptText }],
          temperature: 0.3,
          stream: isStream
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        return { success: false, error: `API 错误 (HTTP ${response.status}): ${errText}` };
      }

      if (!isStream) {
        const json = await response.json();
        const translatedText = json.choices?.[0]?.message?.content;
        if (!translatedText) {
          return { success: false, error: 'API 接口返回了空翻译结果。' };
        }
        return { success: true, text: translatedText.trim() };
      }

      // 流式解析
      let sseBuffer = '';
      let fullText = '';
      const decoder = new TextDecoder();
      for await (const chunk of response.body) {
        const text = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
        sseBuffer += text;
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop();
        
        for (const line of lines) {
          const cleanLine = line.trim();
          if (cleanLine.startsWith('data: ')) {
            const dataStr = cleanLine.slice(6);
            if (dataStr === '[DONE]') continue;
            try {
              const json = JSON.parse(dataStr);
              const chunkText = json.choices?.[0]?.delta?.content || '';
              if (chunkText) {
                fullText += chunkText;
                event.sender.send('translate-text-chunk', { chunk: chunkText });
              }
            } catch (e) {
              // 忽略
            }
          }
        }
      }
      return { success: true, text: fullText.trim() };

    } else {
      return { success: false, error: '暂不支持的 API 类型' };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
});


