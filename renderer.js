let currentSubPath = ''; // 相对当前根路径的相对路径，'' 代表根目录
let currentWorkspaceConfig = {};
let currentPathData = { folders: [], files: [] };

// DOM 元素
const explorerView = document.getElementById('explorer-view');
const settingsView = document.getElementById('settings-view');
const navSettingsBtn = document.getElementById('nav-settings-btn');
const rootPathDisplay = document.getElementById('root-path-display');

const explorerGrid = document.getElementById('explorer-grid');
const breadcrumbsContainer = document.getElementById('breadcrumbs-container');
const btnBack = document.getElementById('btn-back');
const searchInput = document.getElementById('search-input');
const btnNewFolder = document.getElementById('btn-new-folder');

// Settings page elements
const inputRootPath = document.getElementById('input-root-path');
const btnSavePath = document.getElementById('btn-save-path');
const settingsError = document.getElementById('settings-error');

// Sidebar quick links
const sidebarQuickLinks = document.getElementById('sidebar-quick-links');

// Audio Player Elements
const audioView = document.getElementById('audio-view');
const navAudioBtn = document.getElementById('nav-audio-btn');
const playlistContainer = document.getElementById('playlist-container');
const htmlAudioPlayer = document.getElementById('html-audio-player');
const playerTrackName = document.getElementById('player-track-name');
const playerTrackPath = document.getElementById('player-track-path');
const playerBtnPrev = document.getElementById('player-btn-prev');
const playerBtnPlay = document.getElementById('player-btn-play');
const playerBtnNext = document.getElementById('player-btn-next');
const playerTimeCurrent = document.getElementById('player-time-current');
const playerTimeDuration = document.getElementById('player-time-duration');
const playerProgress = document.getElementById('player-progress');
const playerVolume = document.getElementById('player-volume');
const playerDisk = document.getElementById('player-disk');
const volumeIcon = document.getElementById('volume-icon');

// Modals elements
const newFolderModal = document.getElementById('new-folder-modal');
const inputFolderName = document.getElementById('input-folder-name');
const folderError = document.getElementById('folder-error');
const btnConfirmFolder = document.getElementById('btn-confirm-folder');

const renameModal = document.getElementById('rename-modal');
const inputRenameName = document.getElementById('input-rename-name');
const renameError = document.getElementById('rename-error');
const btnConfirmRename = document.getElementById('btn-confirm-rename');

const moveFileModal = document.getElementById('move-file-modal');
const moveFileNameDisplay = document.getElementById('move-file-name');
const moveFoldersList = document.getElementById('move-folders-list');

// Toast
const toast = document.getElementById('toast');

// Transcription & API Settings Elements
const transcribeApiStatus = document.getElementById('transcribe-api-status');
const transcriptionTextContainer = document.getElementById('transcription-text-container');
const btnTranscribe = document.getElementById('btn-transcribe');

const selectApiType = document.getElementById('select-api-type');
const inputApiKey = document.getElementById('input-api-key');
const inputApiUrl = document.getElementById('input-api-url');
const btnSaveApiSettings = document.getElementById('btn-save-api-settings');
const apiSettingsError = document.getElementById('api-settings-error');

// --- 通用/视图切换功能 ---
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.style.backgroundColor = isError ? 'var(--danger)' : 'var(--success)';
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function switchView(viewName) {
  document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  if (viewName === 'explorer') {
    explorerView.classList.add('active');
  } else if (viewName === 'settings') {
    settingsView.classList.add('active');
    navSettingsBtn.classList.add('active');
  } else if (viewName === 'audio') {
    audioView.classList.add('active');
    navAudioBtn.classList.add('active');
    loadAudioPlaylist();
  }
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  // 清理错误提示和输入框
  if (modalId === 'new-folder-modal') {
    inputFolderName.value = '';
    folderError.textContent = '';
  } else if (modalId === 'rename-modal') {
    inputRenameName.value = '';
    renameError.textContent = '';
  }
}
window.closeModal = closeModal; // 暴露给 HTML 行内 onclick

// --- 工作区配置与加载 ---
async function loadConfigAndScan() {
  try {
    const res = await window.api.getConfig();
    if (res.success) {
      currentWorkspaceConfig = res.config;
      rootPathDisplay.textContent = currentWorkspaceConfig.rootPath;
      inputRootPath.value = currentWorkspaceConfig.rootPath;
      
      // 加载 API 接口配置
      selectApiType.value = currentWorkspaceConfig.apiType || 'gemini';
      inputApiKey.value = currentWorkspaceConfig.apiKey || '';
      inputApiUrl.value = currentWorkspaceConfig.apiBaseUrl || '';
      updateTranscribeApiStatusUI();
      
      // 加载侧边栏快速通道
      await loadSidebarQuickLinks();
      
      // 扫描并渲染当前目录
      await navigateTo(currentSubPath);
    }
  } catch (err) {
    showToast('加载配置失败: ' + err, true);
  }
}

function updateTranscribeApiStatusUI() {
  if (currentWorkspaceConfig.apiKey) {
    const typeName = currentWorkspaceConfig.apiType === 'gemini' ? 'Gemini' : 'Whisper';
    transcribeApiStatus.textContent = `API 已配置: ${typeName}`;
    transcribeApiStatus.classList.add('active');
  } else {
    transcribeApiStatus.textContent = '未配置 API';
    transcribeApiStatus.classList.remove('active');
  }
}

async function loadSidebarQuickLinks() {
  try {
    const res = await window.api.getRootFolders();
    if (res.success) {
      sidebarQuickLinks.innerHTML = res.folders.map(folder => `
        <button class="nav-item ${currentSubPath === folder.name ? 'active' : ''}" 
                onclick="navigateToFolder('${folder.name.replace(/\\/g, '\\\\')}')">
          <i class="fa-solid fa-folder"></i> <span class="text-ellipsis" title="${folder.name}">${folder.name}</span>
        </button>
      `).join('') + `
        <button class="nav-item ${currentSubPath === '' ? 'active' : ''}" onclick="navigateToFolder('')">
          <i class="fa-solid fa-house"></i> 根目录
        </button>
      `;
    }
  } catch (err) {
    console.error('侧边栏加载错误:', err);
  }
}

window.navigateToFolder = async (folderName) => {
  switchView('explorer');
  await navigateTo(folderName);
};
window.navigateTo = navigateTo;

// 保存工作根路径
btnSavePath.addEventListener('click', async () => {
  const newPath = inputRootPath.value.trim();
  if (!newPath) {
    settingsError.textContent = '路径不能为空';
    return;
  }
  
  btnSavePath.disabled = true;
  settingsError.textContent = '';
  try {
    const res = await window.api.updateRootPath(newPath);
    if (res.success) {
      showToast('工作区根路径更新成功并已保存！');
      currentSubPath = ''; // 重置为根目录
      await loadConfigAndScan();
      switchView('explorer');
    } else {
      settingsError.textContent = res.error;
    }
  } catch (err) {
    settingsError.textContent = '保存失败: ' + err;
  } finally {
    btnSavePath.disabled = false;
  }
});

navSettingsBtn.addEventListener('click', () => {
  switchView('settings');
});

// --- 文件资源管理器核心逻辑 ---

async function navigateTo(subPath) {
  currentSubPath = subPath;
  await loadSidebarQuickLinks();
  
  try {
    const res = await window.api.listDir(currentSubPath);
    if (res.success) {
      currentPathData = { folders: res.folders, files: res.files };
      renderExplorerGrid();
      renderBreadcrumbs(res.currentPath);
      btnBack.disabled = currentSubPath === '';
    } else {
      showToast('无法加载目录: ' + res.error, true);
      if (currentSubPath !== '') {
        navigateTo('');
      }
    }
  } catch (err) {
    showToast('读取资源库错误: ' + err, true);
  }
}

function renderBreadcrumbs(subPath) {
  if (subPath === '') {
    breadcrumbsContainer.innerHTML = '<span class="breadcrumb-item active">根目录</span>';
    return;
  }
  
  const parts = subPath.split(/[\\/]/);
  let html = `<span class="breadcrumb-item" onclick="navigateTo('')">根目录</span>`;
  
  let accumulatedPath = '';
  parts.forEach((part, index) => {
    if (!part) return;
    accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
    
    html += ` <span class="breadcrumb-separator">/</span> `;
    if (index === parts.length - 1) {
      html += `<span class="breadcrumb-item active">${part}</span>`;
    } else {
      html += `<span class="breadcrumb-item" onclick="navigateTo('${accumulatedPath.replace(/\\/g, '\\\\')}')">${part}</span>`;
    }
  });
  
  breadcrumbsContainer.innerHTML = html;
}

btnBack.addEventListener('click', () => {
  if (currentSubPath === '') return;
  const parts = currentSubPath.split(/[\\/]/);
  parts.pop();
  navigateTo(parts.join('/'));
});

// 获取文件后缀对应的图标及颜色样式
function getFileIconClass(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  if (['doc', 'docx'].includes(ext)) return 'fa-file-word file-word';
  if (['xls', 'xlsx'].includes(ext)) return 'fa-file-excel file-excel';
  if (['ppt', 'pptx'].includes(ext)) return 'fa-file-powerpoint file-powerpoint';
  if (ext === 'pdf') return 'fa-file-pdf file-pdf';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'fa-file-zipper file-zip';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return 'fa-file-image file-image';
  if (ext === 'txt') return 'fa-file-lines file-txt';
  if (ext === 'md') return 'fa-brands fa-markdown file-md';
  if (['mp3', 'wav', 'flac'].includes(ext)) return 'fa-file-audio file-audio';
  if (['mp4', 'mkv', 'avi'].includes(ext)) return 'fa-file-video file-video';
  return 'fa-file file-txt';
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function renderExplorerGrid() {
  const searchQuery = searchInput.value.trim().toLowerCase();
  
  const filteredFolders = currentPathData.folders.filter(f => f.name.toLowerCase().includes(searchQuery));
  const filteredFiles = currentPathData.files.filter(f => f.name.toLowerCase().includes(searchQuery));
  
  if (filteredFolders.length === 0 && filteredFiles.length === 0) {
    explorerGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-regular fa-folder-open"></i>
        <h3>空空如也</h3>
        <p>${searchQuery ? '未找到符合搜索条件的项目' : '当前文件夹内没有任何内容，你可以新建文件夹或移动文件到此目录'}</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  // 1. 渲染文件夹
  filteredFolders.forEach(folder => {
    html += `
      <div class="card-item" ondblclick="navigateTo('${folder.path.replace(/\\/g, '\\\\')}')">
        <i class="fa-solid fa-folder card-icon folder"></i>
        <div class="card-name text-ellipsis" title="${folder.name}">${folder.name}</div>
        <div class="card-meta">文件夹</div>
        <div class="card-actions">
          <button class="card-btn" onclick="navigateTo('${folder.path.replace(/\\/g, '\\\\')}')" title="进入文件夹">
            <i class="fa-solid fa-folder-open"></i>
          </button>
          <button class="card-btn btn-move" onclick="openRenameModal('${folder.name.replace(/'/g, "\\'")}', '${folder.fullPath.replace(/\\/g, '\\\\')}')" title="重命名">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="card-btn btn-delete" onclick="deleteItem('${folder.fullPath.replace(/\\/g, '\\\\')}')" title="删除文件夹">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  });
  
  // 2. 渲染文件
  filteredFiles.forEach(file => {
    const iconClass = getFileIconClass(file.name);
    const ext = file.name.split('.').pop().toLowerCase();
    const isAudio = ['mp3', 'ogg', 'wav'].includes(ext);
    html += `
      <div class="card-item">
        <i class="fa-regular ${iconClass} card-icon file"></i>
        <div class="card-name text-ellipsis" title="${file.name}">${file.name}</div>
        <div class="card-meta">${formatSize(file.size)} | ${file.mtime.split(' ')[0]}</div>
        <div class="card-actions">
          ${isAudio ? `
            <button class="card-btn" onclick="playAudioFromFile('${file.name.replace(/'/g, "\\'")}', '${file.fullPath.replace(/\\/g, '\\\\')}')" title="播放音频">
              <i class="fa-solid fa-play"></i>
            </button>
          ` : `
            <button class="card-btn" onclick="openItem('${file.fullPath.replace(/\\/g, '\\\\')}')" title="打开文件">
              <i class="fa-solid fa-eye"></i>
            </button>
          `}
          <button class="card-btn btn-move" onclick="openMoveModal('${file.name.replace(/'/g, "\\'")}', '${file.fullPath.replace(/\\/g, '\\\\')}')" title="移动文件">
            <i class="fa-solid fa-arrows-up-down-left-right"></i>
          </button>
          <button class="card-btn" onclick="openRenameModal('${file.name.replace(/'/g, "\\'")}', '${file.fullPath.replace(/\\/g, '\\\\')}')" title="重命名">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="card-btn btn-delete" onclick="deleteItem('${file.fullPath.replace(/\\/g, '\\\\')}')" title="删除文件">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  });
  
  explorerGrid.innerHTML = html;
}

searchInput.addEventListener('input', renderExplorerGrid);

window.openItem = async (fullPath) => {
  const res = await window.api.openItem(fullPath);
  if (!res.success) {
    showToast('打开失败: ' + res.error, true);
  }
};

window.deleteItem = async (fullPath) => {
  const isDir = currentPathData.folders.some(f => f.fullPath === fullPath);
  const typeText = isDir ? '文件夹' : '文件';
  
  if (confirm(`确定要彻底删除该${typeText}吗？该操作不可撤销！`)) {
    try {
      const res = await window.api.deleteItem(fullPath);
      if (res.success) {
        showToast('项目已成功删除！');
        await navigateTo(currentSubPath);
      } else {
        showToast('删除失败: ' + res.error, true);
      }
    } catch (err) {
      showToast('删除异常: ' + err, true);
    }
  }
};

// --- 新建文件夹功能 ---
btnNewFolder.addEventListener('click', () => {
  openModal('new-folder-modal');
  inputFolderName.focus();
});

btnConfirmFolder.addEventListener('click', async () => {
  const folderName = inputFolderName.value.trim();
  if (!folderName) {
    folderError.textContent = '名字不能为空';
    return;
  }
  if (/[\\/:*?"<>|]/.test(folderName)) {
    folderError.textContent = '文件夹名称不能包含特殊字符 \\ / : * ? " < > |';
    return;
  }
  
  btnConfirmFolder.disabled = true;
  try {
    const res = await window.api.createFolder(currentSubPath, folderName);
    if (res.success) {
      showToast(`文件夹 "${folderName}" 创建成功`);
      closeModal('new-folder-modal');
      await navigateTo(currentSubPath);
    } else {
      folderError.textContent = res.error;
    }
  } catch (err) {
    folderError.textContent = '创建失败: ' + err;
  } finally {
    btnConfirmFolder.disabled = false;
  }
});

inputFolderName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    btnConfirmFolder.click();
  }
});

// --- 重命名功能 ---
let itemPendingToRenameFullPath = '';

window.openRenameModal = (oldName, fullPath) => {
  itemPendingToRenameFullPath = fullPath;
  inputRenameName.value = oldName;
  renameError.textContent = '';
  openModal('rename-modal');
  setTimeout(() => inputRenameName.select(), 50); // 自动聚焦并选中旧名字
};

btnConfirmRename.addEventListener('click', async () => {
  const newName = inputRenameName.value.trim();
  if (!newName) {
    renameError.textContent = '名称不能为空';
    return;
  }
  if (/[\\/:*?"<>|]/.test(newName)) {
    renameError.textContent = '名称不能包含特殊字符 \\ / : * ? " < > |';
    return;
  }
  
  btnConfirmRename.disabled = true;
  try {
    const res = await window.api.renameItem(itemPendingToRenameFullPath, newName);
    if (res.success) {
      showToast('重命名成功！');
      closeModal('rename-modal');
      await navigateTo(currentSubPath);
    } else {
      renameError.textContent = res.error;
    }
  } catch (err) {
    renameError.textContent = '重命名失败: ' + err;
  } finally {
    btnConfirmRename.disabled = false;
  }
});

inputRenameName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    btnConfirmRename.click();
  }
});


// --- 手动“移动到”分类功能 ---
let filePendingToMoveFullPath = '';

window.openMoveModal = async (fileName, fileFullPath) => {
  filePendingToMoveFullPath = fileFullPath;
  moveFileNameDisplay.textContent = `移动文件: ${fileName}`;
  
  try {
    const res = await window.api.getRootFolders();
    if (res.success) {
      if (res.folders.length === 0) {
        moveFoldersList.innerHTML = `<p style="padding: 12px; color: var(--text-muted); text-align: center;">根目录下还没有文件夹，请先创建一个文件夹！</p>`;
      } else {
        moveFoldersList.innerHTML = res.folders.map(folder => `
          <div class="folder-select-item" onclick="confirmMove('${folder.fullPath.replace(/\\/g, '\\\\')}')">
            <i class="fa-solid fa-folder"></i>
            <span>${folder.name}</span>
          </div>
        `).join('');
      }
      openModal('move-file-modal');
    }
  } catch (err) {
    showToast('获取分类目标列表失败: ' + err, true);
  }
};

window.confirmMove = async (destFolderFullPath) => {
  closeModal('move-file-modal');
  try {
    const res = await window.api.moveItem(filePendingToMoveFullPath, destFolderFullPath);
    if (res.success) {
      showToast('文件已成功移动分类！');
      await navigateTo(currentSubPath);
    } else {
      showToast('移动失败: ' + res.error, true);
    }
  } catch (err) {
    showToast('移动异常: ' + err, true);
  }
};


// navAudioBtn 点击事件
navAudioBtn.addEventListener('click', () => {
  switchView('audio');
});

// --- 音频播放器逻辑 ---
let audioPlaylist = [];
let audioCurrentIndex = -1;
let transcriptionCache = {}; // 文件绝对路径 -> 转写文本 缓存映射

// 保存 API 配置
btnSaveApiSettings.addEventListener('click', async () => {
  const apiType = selectApiType.value;
  const apiKey = inputApiKey.value.trim();
  const apiBaseUrl = inputApiUrl.value.trim();

  if (!apiKey) {
    apiSettingsError.textContent = 'API Key 不能为空';
    return;
  }

  btnSaveApiSettings.disabled = true;
  apiSettingsError.textContent = '';
  try {
    const res = await window.api.saveApiSettings({ apiType, apiKey, apiBaseUrl });
    if (res.success) {
      showToast('API 接口配置保存成功！');
      currentWorkspaceConfig = res.config;
      updateTranscribeApiStatusUI();
    } else {
      apiSettingsError.textContent = res.error;
    }
  } catch (err) {
    apiSettingsError.textContent = '保存配置失败: ' + err;
  } finally {
    btnSaveApiSettings.disabled = false;
  }
});

// 一键语音转文字转录
btnTranscribe.addEventListener('click', async () => {
  if (audioPlaylist.length === 0 || audioCurrentIndex === -1) {
    showToast('请先选择并播放一个音频文件', true);
    return;
  }

  const track = audioPlaylist[audioCurrentIndex];

  // 检查是否已有缓存
  if (transcriptionCache[track.fullPath]) {
    showToast('已加载缓存转写内容');
    return;
  }

  if (!currentWorkspaceConfig.apiKey) {
    showToast('请先前往“工作区路径”设置中配置 API Key！', true);
    switchView('settings');
    return;
  }

  btnTranscribe.disabled = true;
  transcriptionTextContainer.innerHTML = `
    <div class="transcription-empty">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 3rem; margin-bottom: 12px; color: var(--primary);"></i>
      <p>正在提交音频数据到云端进行高精度文本转写...</p>
      <p style="font-size: 0.8rem; opacity: 0.7; margin-top: 4px;">由于文件可能较大，转录约需要 15 - 45 秒，请稍后</p>
    </div>
  `;

  try {
    const res = await window.api.transcribeAudio(track.fullPath);
    if (res.success) {
      showToast('音频转文字成功！');
      transcriptionCache[track.fullPath] = res.text;
      transcriptionTextContainer.textContent = res.text;
    } else {
      showToast('转写失败: ' + res.error, true);
      transcriptionTextContainer.innerHTML = `
        <div class="transcription-empty" style="color: var(--danger);">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; margin-bottom: 12px;"></i>
          <p>转录失败</p>
          <p style="font-size: 0.8rem; margin-top: 4px;">${res.error}</p>
        </div>
      `;
    }
  } catch (err) {
    showToast('转写发生错误: ' + err, true);
    transcriptionTextContainer.innerHTML = `
      <div class="transcription-empty" style="color: var(--danger);">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; margin-bottom: 12px;"></i>
        <p>转写失败: ${err}</p>
      </div>
    `;
  } finally {
    btnTranscribe.disabled = false;
  }
});

function formatAudioTime(seconds) {
  if (isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function loadAudioPlaylist() {
  try {
    const res = await window.api.getAllAudios();
    if (res.success) {
      audioPlaylist = res.audios;
      renderPlaylistUI();
    } else {
      showToast('获取播放列表失败: ' + res.error, true);
    }
  } catch (err) {
    showToast('加载播放列表出错: ' + err, true);
  }
}

function renderPlaylistUI() {
  if (audioPlaylist.length === 0) {
    playlistContainer.innerHTML = `<p style="padding: 16px; color: var(--text-muted); text-align: center;">工作区目录中未找到任何 mp3 / ogg 音频文件</p>`;
    return;
  }

  playlistContainer.innerHTML = audioPlaylist.map((track, index) => {
    const isActive = index === audioCurrentIndex;
    return `
      <div class="playlist-item ${isActive ? 'active' : ''}" onclick="playTrack(${index})">
        <div class="playlist-item-left">
          <i class="${isActive ? 'fa-solid fa-volume-high' : 'fa-solid fa-music'}"></i>
          <span class="playlist-item-title text-ellipsis" title="${track.name}">${track.name}</span>
        </div>
      </div>
    `;
  }).join('');
}

window.playTrack = function(index) {
  if (index < 0 || index >= audioPlaylist.length) return;
  
  audioCurrentIndex = index;
  const track = audioPlaylist[index];
  
  playerTrackName.textContent = track.name;
  playerTrackPath.textContent = track.relativePath;
  
  // 加载转录文本的缓存
  if (transcriptionCache[track.fullPath]) {
    transcriptionTextContainer.textContent = transcriptionCache[track.fullPath];
  } else {
    transcriptionTextContainer.innerHTML = `
      <div class="transcription-empty" id="transcription-empty-placeholder">
        <i class="fa-solid fa-quote-right" style="font-size: 3rem; margin-bottom: 12px; opacity: 0.3;"></i>
        <p>播放音频时，点击下方按钮开始进行中英文录音转写</p>
      </div>
    `;
  }
  
  const fileUrl = `file:///${track.fullPath.replace(/\\/g, '/')}`;
  htmlAudioPlayer.src = encodeURI(fileUrl);
  
  htmlAudioPlayer.play().catch(err => {
    showToast('播放音频失败: ' + err.message, true);
  });
  
  playerBtnPlay.innerHTML = '<i class="fa-solid fa-pause"></i>';
  playerDisk.classList.add('playing');
  renderPlaylistUI();
};

window.playAudioFromFile = async (name, fullPath) => {
  switchView('audio');
  
  const res = await window.api.getAllAudios();
  if (res.success) {
    audioPlaylist = res.audios;
    
    const idx = audioPlaylist.findIndex(t => t.fullPath === fullPath);
    if (idx !== -1) {
      playTrack(idx);
    } else {
      const track = {
        name,
        fullPath,
        relativePath: name
      };
      audioPlaylist.push(track);
      renderPlaylistUI();
      playTrack(audioPlaylist.length - 1);
    }
  }
};

playerBtnPlay.addEventListener('click', () => {
  if (audioPlaylist.length === 0) return;
  if (audioCurrentIndex === -1) {
    playTrack(0);
    return;
  }
  
  if (htmlAudioPlayer.paused) {
    htmlAudioPlayer.play();
    playerBtnPlay.innerHTML = '<i class="fa-solid fa-pause"></i>';
    playerDisk.classList.add('playing');
  } else {
    htmlAudioPlayer.pause();
    playerBtnPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
    playerDisk.classList.remove('playing');
  }
});

playerBtnNext.addEventListener('click', () => {
  if (audioPlaylist.length === 0) return;
  let nextIdx = audioCurrentIndex + 1;
  if (nextIdx >= audioPlaylist.length) nextIdx = 0;
  playTrack(nextIdx);
});

playerBtnPrev.addEventListener('click', () => {
  if (audioPlaylist.length === 0) return;
  let prevIdx = audioCurrentIndex - 1;
  if (prevIdx < 0) prevIdx = audioPlaylist.length - 1;
  playTrack(prevIdx);
});

htmlAudioPlayer.addEventListener('ended', () => {
  playerBtnNext.click();
});

playerVolume.addEventListener('input', (e) => {
  const val = e.target.value;
  htmlAudioPlayer.volume = val / 100;
  
  if (val == 0) {
    volumeIcon.className = 'fa-solid fa-volume-xmark';
  } else if (val < 40) {
    volumeIcon.className = 'fa-solid fa-volume-low';
  } else {
    volumeIcon.className = 'fa-solid fa-volume-high';
  }
});

htmlAudioPlayer.addEventListener('timeupdate', () => {
  const current = htmlAudioPlayer.currentTime;
  const duration = htmlAudioPlayer.duration || 0;
  
  playerTimeCurrent.textContent = formatAudioTime(current);
  playerTimeDuration.textContent = formatAudioTime(duration);
  
  if (duration > 0) {
    playerProgress.value = (current / duration) * 100;
  }
});

playerProgress.addEventListener('input', (e) => {
  const val = e.target.value;
  const duration = htmlAudioPlayer.duration || 0;
  if (duration > 0) {
    htmlAudioPlayer.currentTime = (val / 100) * duration;
  }
});

// --- 初始化启动 ---
document.addEventListener('DOMContentLoaded', () => {
  loadConfigAndScan();
});
