let currentSubPath = ''; // 相对当前根路径的相对路径，'' 代表根目录
let currentWorkspaceConfig = {};
let currentPathData = { folders: [], files: [] };

// DOM 元素
const explorerView = document.getElementById('explorer-view');
const navExplorerBtn = document.getElementById('nav-explorer-btn');
const settingsView = document.getElementById('settings-view');
const navSettingsBtn = document.getElementById('nav-settings-btn');
const rootPathDisplay = document.getElementById('root-path-display');

// Record & Interpretation View DOM references
const recordView = document.getElementById('record-view');
const navRecordBtn = document.getElementById('nav-record-btn');
const recordTimer = document.getElementById('record-timer');
const recordVisualizer = document.getElementById('record-visualizer');
const btnRecordStart = document.getElementById('btn-record-start');
const btnRecordStop = document.getElementById('btn-record-stop');
const recordStatusText = document.getElementById('record-status-text');
const recordingsContainer = document.getElementById('recordings-container');
const recordingsCountBadge = document.getElementById('recordings-count-badge');
const checkboxEnableInterpret = document.getElementById('checkbox-enable-interpret');
const selectInterpretLang = document.getElementById('select-interpret-lang');
const interpretLogContainer = document.getElementById('interpret-log-container');
const interpretEmptyPlaceholder = document.getElementById('interpret-empty-placeholder');
const btnSaveInterpret = document.getElementById('btn-save-interpret');

// Text Translation Elements
const tabInterpretBtn = document.getElementById('tab-interpret-btn');
const tabTextTranslateBtn = document.getElementById('tab-text-translate-btn');
const interpretSubView = document.getElementById('interpret-sub-view');
const textTranslateSubView = document.getElementById('text-translate-sub-view');
const textareaTranslateSrc = document.getElementById('textarea-translate-src');
const selectTextTranslateLang = document.getElementById('select-text-translate-lang');
const btnTextTranslate = document.getElementById('btn-text-translate');
const divTranslateResult = document.getElementById('div-translate-result');
const btnCopyTranslate = document.getElementById('btn-copy-translate');
const btnExportTranslate = document.getElementById('btn-export-translate');
const btnFullscreenTranslate = document.getElementById('btn-fullscreen-translate');
const translateResultWrapper = document.getElementById('translate-result-wrapper');

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
const inputApiModel = document.getElementById('input-api-model');
const checkboxApiStream = document.getElementById('checkbox-api-stream');
const btnSaveApiSettings = document.getElementById('btn-save-api-settings');
const apiSettingsError = document.getElementById('api-settings-error');

// 音频硬件设备选择 DOM 声明
const selectAudioInput = document.getElementById('select-audio-input');
const selectAudioOutput = document.getElementById('select-audio-output');
const selectInterpretDuration = document.getElementById('select-interpret-duration');
const btnSaveDeviceSettings = document.getElementById('btn-save-device-settings');

// Notes Elements
const notesView = document.getElementById('notes-view');
const navNotesBtn = document.getElementById('nav-notes-btn');
const notesListContainer = document.getElementById('notes-list-container');
const btnNewNote = document.getElementById('btn-new-note');
const noteTitleInput = document.getElementById('note-title-input');
const btnEditNote = document.getElementById('btn-edit-note');
const btnSaveNote = document.getElementById('btn-save-note');
const btnDeleteNote = document.getElementById('btn-delete-note');
const btnFullscreenNote = document.getElementById('btn-fullscreen-note');
const noteContentArea = document.querySelector('.note-content-area');
const notePreviewPane = document.getElementById('note-preview-pane');
const noteEditArea = document.getElementById('note-edit-area');

// Batch Elements
const batchActionBar = document.getElementById('batch-action-bar');
const batchSelectCount = document.getElementById('batch-select-count');
const btnBatchMove = document.getElementById('btn-batch-move');
const btnBatchDelete = document.getElementById('btn-batch-delete');
const btnBatchClear = document.getElementById('btn-batch-clear');

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
  // 切换视图时强制退出可能的全屏状态
  if (noteContentArea) {
    noteContentArea.classList.remove('fullscreen-active');
    btnFullscreenNote.innerHTML = '<i class="fa-solid fa-expand"></i> 全屏';
  }
  if (translateResultWrapper) {
    translateResultWrapper.classList.remove('fullscreen-active');
    btnFullscreenTranslate.innerHTML = '<i class="fa-solid fa-expand"></i> 全屏';
  }

  document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  if (viewName === 'explorer') {
    explorerView.classList.add('active');
    navExplorerBtn.classList.add('active');
    updateBatchBarUI(); // 仅在资源管理器视图中恢复显示选中状态
  } else {
    // 切换到其他视图时，必须强制隐藏多选批量操作栏，避免遮挡底部保存等重要按钮
    batchActionBar.classList.remove('active');
    
    if (viewName === 'settings') {
      settingsView.classList.add('active');
      navSettingsBtn.classList.add('active');
      populateMediaDevices(); // 进入设置界面时自动刷新输入输出音频设备列表
    } else if (viewName === 'audio') {
      audioView.classList.add('active');
      navAudioBtn.classList.add('active');
      loadAudioPlaylist();
    } else if (viewName === 'notes') {
      notesView.classList.add('active');
      navNotesBtn.classList.add('active');
      loadNotesList();
    } else if (viewName === 'record') {
      recordView.classList.add('active');
      navRecordBtn.classList.add('active');
      loadRecordingsList();
    }
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
      inputApiModel.value = currentWorkspaceConfig.apiModel || '';
      checkboxApiStream.checked = currentWorkspaceConfig.apiStream !== false; // 默认启用
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
    const modelName = currentWorkspaceConfig.apiModel || (currentWorkspaceConfig.apiType === 'gemini' ? 'gemini-1.5-flash' : 'whisper-1');
    transcribeApiStatus.textContent = `API 已配置: ${modelName}`;
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
  selectedPaths = []; // 每次切换目录清空选择状态
  updateBatchBarUI();
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
  if (['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'].includes(ext)) return 'fa-file-audio file-audio';
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
    const isChecked = selectedPaths.includes(folder.fullPath);
    html += `
      <div class="card-item" ondblclick="navigateTo('${folder.path.replace(/\\/g, '\\\\')}')">
        <input type="checkbox" class="card-checkbox" ${isChecked ? 'checked' : ''} onclick="toggleSelectItem(event, '${folder.fullPath.replace(/\\/g, '\\\\')}')">
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
    const isAudio = ['mp3', 'ogg', 'wav', 'm4a', 'aac', 'flac'].includes(ext);
    const isChecked = selectedPaths.includes(file.fullPath);
    html += `
      <div class="card-item" ondblclick="openItem('${file.fullPath.replace(/\\/g, '\\\\')}')">
        <input type="checkbox" class="card-checkbox" ${isChecked ? 'checked' : ''} onclick="toggleSelectItem(event, '${file.fullPath.replace(/\\/g, '\\\\')}')">
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
  const ext = fullPath.split('.').pop().toLowerCase();
  if (ext === 'md') {
    // 在应用内以弹窗打开 Markdown 阅读器，且不写入 Notes 目录
    const res = await window.api.readMarkdownFile(fullPath);
    if (res.success) {
      const fileName = fullPath.split(/[\\/]/).pop();
      document.getElementById('md-reader-title').textContent = fileName;
      document.getElementById('md-reader-content').innerHTML = renderMarkdown(res.content) || '<p style="color:var(--text-muted); font-style:italic;">该 Markdown 文件无内容</p>';
      openModal('md-reader-modal');
      triggerMermaidRender(); // 触发流程图渲染
    } else {
      showToast('读取 Markdown 失败: ' + res.error, true);
    }
  } else {
    const res = await window.api.openItem(fullPath);
    if (!res.success) {
      showToast('打开失败: ' + res.error, true);
    }
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
  isBatchMoveOperation = false; // 普通移动模式
  
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
    if (isBatchMoveOperation) {
      const res = await window.api.batchMove(selectedPaths, destFolderFullPath);
      if (res.success) {
        showToast('所选文件已批量移动分类！');
        selectedPaths = [];
        updateBatchBarUI();
        await navigateTo(currentSubPath);
      } else {
        showToast('批量移动失败: ' + res.error, true);
      }
    } else {
      const res = await window.api.moveItem(filePendingToMoveFullPath, destFolderFullPath);
      if (res.success) {
        showToast('文件已成功移动分类！');
        await navigateTo(currentSubPath);
      } else {
        showToast('移动失败: ' + res.error, true);
      }
    }
  } catch (err) {
    showToast('移动异常: ' + err, true);
  } finally {
    isBatchMoveOperation = false;
  }
};


// navAudioBtn 点击事件
navAudioBtn.addEventListener('click', () => {
  switchView('audio');
});

// navNotesBtn 点击事件
navNotesBtn.addEventListener('click', () => {
  switchView('notes');
});

// navExplorerBtn 点击事件
navExplorerBtn.addEventListener('click', () => {
  switchView('explorer');
});

// navRecordBtn 点击事件
navRecordBtn.addEventListener('click', () => {
  switchView('record');
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
  const apiModel = inputApiModel.value.trim();
  const apiStream = checkboxApiStream.checked;

  if (!apiKey) {
    apiSettingsError.textContent = 'API Key 不能为空';
    return;
  }

  btnSaveApiSettings.disabled = true;
  apiSettingsError.textContent = '';
  try {
    const res = await window.api.saveApiSettings({ apiType, apiKey, apiBaseUrl, apiModel, apiStream });
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
      if (res.error === 'TRANSCRIPTION_ABORTED') {
        // 如果是中途取消/切换文件，我们静默忽略，不进行任何 UI 报错渲染
        console.log('Transcription aborted.');
        return;
      }
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
  if (isNaN(seconds) || seconds === Infinity) return '00:00';
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
      showToast(`音频扫描完成，共找到 ${audioPlaylist.length} 个音频文件`);
    } else {
      showToast('获取播放列表失败: ' + res.error, true);
    }
  } catch (err) {
    showToast('加载播放列表出错: ' + err, true);
  }
}

function renderPlaylistUI() {
  const badge = document.getElementById('playlist-count-badge');
  if (badge) {
    badge.textContent = audioPlaylist.length;
    badge.style.display = audioPlaylist.length > 0 ? 'inline-block' : 'none';
  }

  if (audioPlaylist.length === 0) {
    playlistContainer.innerHTML = `
      <div style="padding: 24px 16px; color: var(--text-muted); text-align: center; font-size: 0.85rem; line-height: 1.6;">
        <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.3;"></i>
        <p>在当前工作区目录：</p>
        <code style="word-break: break-all; color: var(--primary); background: rgba(0,0,0,0.25); padding: 4px 8px; border-radius: 4px; display: block; margin: 6px 0;">${currentWorkspaceConfig.rootPath || '未配置'}</code>
        <p>下未扫描到任何支持的音频文件 (.mp3, .ogg, .wav, .m4a, .aac, .flac)</p>
      </div>
    `;
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
  
  // 切换音频时，立即中断正在进行中的语音转文字 API 请求，并重置转写按钮状态
  window.api.abortTranscription().catch(() => {});
  btnTranscribe.disabled = false;
  
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
  
  const fileUrl = `app-file:///${track.fullPath.replace(/\\/g, '/')}`;
  htmlAudioPlayer.src = fileUrl;
  
  // 应用保存的输出扬声器设备ID
  const savedSpeakerId = localStorage.getItem('selectedSpeakerId') || '';
  if (savedSpeakerId && typeof htmlAudioPlayer.setSinkId === 'function') {
    htmlAudioPlayer.setSinkId(savedSpeakerId).catch(err => {
      console.warn('设置扬声器设备失败:', err);
    });
  }
  
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
  if (window.mermaid) {
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose'
    });
  }
});


// --- 快捷便签逻辑 ---
let notesList = [];
let currentNoteName = '';
let isEditingNote = false;

// 简易 Markdown 渲染引擎
function renderMarkdown(md) {
  if (!md) return '';
  
  // 转义 HTML 特殊字符防止 XSS 攻击
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // 1. 预处理代码块 (以防其内部的 MD 符号被渲染)
  const codeBlocks = [];
  html = html.replace(/\`\`\`([\s\S]*?)\`\`\`/g, (match, code) => {
    codeBlocks.push(code);
    return `<!--CODEBLOCK_${codeBlocks.length - 1}-->`;
  });
  
  // 预处理行内代码
  const inlineCodes = [];
  html = html.replace(/\`(.*?)\`/g, (match, code) => {
    inlineCodes.push(code);
    return `<!--INLINECODE_${inlineCodes.length - 1}-->`;
  });

  // 2. 渲染水平线 (---, ***)
  html = html.replace(/^\s*([-*_])\1{2,}\s*$/gm, '<hr>');

  // 3. 渲染标题 (h1, h2, h3)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 4. 渲染引用块
  html = html.replace(/^\>\s+(.*$)/gim, '<blockquote>$1</blockquote>');

  // 5. 渲染删除线 ~~text~~
  html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // 6. 渲染加粗与斜体
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // 7. 渲染图片 ![alt](url)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; border-radius:6px; margin:8px 0;">');

  // 8. 渲染链接 [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="#" onclick="window.api.openItem(\'$2\'); return false;" style="color:var(--primary); text-decoration:underline;">$1</a>');

  // 9. 渲染表格 (Tables)
  const lines = html.split('\n');
  let inTable = false;
  let tableHTML = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // 判断是否是分隔行: | --- | --- |
      const isSeparator = cells.every(c => /^:-*|-*:-*|-*:$/.test(c));
      if (isSeparator) {
        lines[i] = '';
        continue;
      }
      
      if (!inTable) {
        inTable = true;
        tableHTML = '<table><thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
      } else {
        tableHTML += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
      }
      lines[i] = '';
    } else {
      if (inTable) {
        inTable = false;
        tableHTML += '</tbody></table>';
        lines[i] = tableHTML + '\n' + lines[i];
      }
    }
  }
  if (inTable) {
    tableHTML += '</tbody></table>';
    lines.push(tableHTML);
  }
  
  html = lines.join('\n');

  // 10. 渲染任务列表与常规列表
  // 任务列表: - [ ] 或 - [x]
  html = html.replace(/^\s*-\s+\[ \] (.*$)/gim, '<ul><li><input type="checkbox" disabled style="margin-right:8px; vertical-align: middle;">$1</li></ul>');
  html = html.replace(/^\s*-\s+\[[xX]\] (.*$)/gim, '<ul><li><input type="checkbox" checked disabled style="margin-right:8px; vertical-align: middle;">$1</li></ul>');
  
  // 无序列表
  html = html.replace(/^\s*-\s+(.*$)/gim, '<ul><li>$1</li></ul>');
  html = html.replace(/^\s*\*\s+(.*$)/gim, '<ul><li>$1</li></ul>');
  
  // 有序列表
  html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<ol><li>$1</li></ol>');

  // 合并连续的列表
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  html = html.replace(/<\/ol>\s*<ol>/g, '');

  // 11. 划分换行段落 (过滤已有的块级 HTML 标签)
  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<') && (
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<div') ||
      trimmed.startsWith('<p') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('<ol') ||
      trimmed.startsWith('<li') ||
      trimmed.startsWith('<table') ||
      trimmed.startsWith('<thead') ||
      trimmed.startsWith('<tbody') ||
      trimmed.startsWith('<tr') ||
      trimmed.startsWith('<td') ||
      trimmed.startsWith('<th') ||
      trimmed.startsWith('<blockquote') ||
      trimmed.startsWith('<hr') ||
      trimmed.startsWith('<pre') ||
      trimmed.startsWith('<!--')
    )) {
      return line;
    }
    return `<p>${line}</p>`;
  }).join('\n');

  // 12. 恢复代码块和行内代码
  codeBlocks.forEach((code, idx) => {
    const trimmedCode = code.trim();
    if (trimmedCode.startsWith('mermaid\n') || trimmedCode.startsWith('mermaid\r\n') || trimmedCode.startsWith('mermaid')) {
      const lines = trimmedCode.split('\n');
      if (lines[0].trim() === 'mermaid') {
        lines.shift();
      } else if (lines[0].trim().startsWith('mermaid')) {
        lines[0] = lines[0].substring(7);
      }
      const mermaidContent = lines.join('\n');
      html = html.replace(`<!--CODEBLOCK_${idx}-->`, `<div class="mermaid" style="background: rgba(0,0,0,0.1); border-radius: 8px; padding: 12px; margin: 12px 0; display: flex; justify-content: center; width: 100%; box-sizing: border-box; overflow-x: auto;">${mermaidContent}</div>`);
    } else {
      html = html.replace(`<!--CODEBLOCK_${idx}-->`, `<pre><code>${code}</code></pre>`);
    }
  });
  
  inlineCodes.forEach((code, idx) => {
    html = html.replace(`<!--INLINECODE_${idx}-->`, `<code>${code}</code>`);
  });

  return html;
}

// 加载便签列表
async function loadNotesList() {
  try {
    const res = await window.api.listNotes();
    if (res.success) {
      notesList = res.notes;
      renderNotesListUI();
    } else {
      showToast('获取便签列表失败: ' + res.error, true);
    }
  } catch (err) {
    showToast('加载便签列表异常: ' + err, true);
  }
}

// 渲染左侧便签列表 UI
function renderNotesListUI() {
  if (notesList.length === 0) {
    notesListContainer.innerHTML = `<p style="padding: 12px; color: var(--text-muted); text-align: center; font-size: 0.85rem;">Notes 目录暂无便签，点击上方按钮新建一个吧！</p>`;
    return;
  }
  
  notesListContainer.innerHTML = notesList.map(note => {
    const isActive = note.name === currentNoteName;
    // 移除 .md 后缀展示
    const displayName = note.name.slice(0, -3);
    return `
      <div class="note-item ${isActive ? 'active' : ''}" onclick="selectNote('${note.name.replace(/'/g, "\\'")}')">
        <span class="note-item-title">${displayName}</span>
        <span class="note-item-time">${note.mtime.split(' ')[0]}</span>
      </div>
    `;
  }).join('');
}

// 选择并读取某个便签
window.selectNote = async function(noteName) {
  currentNoteName = noteName;
  isEditingNote = false;
  
  noteTitleInput.value = noteName.slice(0, -3); // 移除 .md 后缀
  noteTitleInput.readOnly = true;
  
  // 切换按钮状态
  btnEditNote.style.display = 'inline-flex';
  btnDeleteNote.style.display = 'inline-flex';
  btnFullscreenNote.style.display = 'inline-flex';
  btnSaveNote.style.display = 'none';
  
  // 切换面板展示
  notePreviewPane.style.display = 'block';
  noteEditArea.style.display = 'none';
  
  renderNotesListUI();
  
  notePreviewPane.innerHTML = `
    <div class="notes-empty-state">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--primary);"></i>
      <p>正在读取便签内容...</p>
    </div>
  `;
  
  try {
    const res = await window.api.readNote(noteName);
    if (res.success) {
      noteEditArea.value = res.content;
      notePreviewPane.innerHTML = renderMarkdown(res.content) || `<p style="color: var(--text-muted); font-style: italic;">便签内容为空</p>`;
      triggerMermaidRender(); // 触发流程图渲染
    } else {
      showToast('读取便签失败: ' + res.error, true);
    }
  } catch (err) {
    showToast('读取异常: ' + err, true);
  }
};

// 进入编辑模式
btnEditNote.addEventListener('click', () => {
  if (!currentNoteName) return;
  
  isEditingNote = true;
  noteTitleInput.readOnly = false; // 允许修改便签标题
  
  // 隐藏预览，显示编辑框
  notePreviewPane.style.display = 'none';
  noteEditArea.style.display = 'block';
  
  btnEditNote.style.display = 'none';
  btnSaveNote.style.display = 'inline-flex';
  
  noteEditArea.focus();
});

// 保存并渲染便签
btnSaveNote.addEventListener('click', async () => {
  let title = noteTitleInput.value.trim();
  const content = noteEditArea.value;
  
  if (!title) {
    showToast('便签标题不能为空！', true);
    return;
  }
  
  // 过滤掉文件名不支持的字符
  title = title.replace(/[\\/:*?"<>|]/g, '');
  
  btnSaveNote.disabled = true;
  try {
    // 如果标题改变了（且不是新建的第一次命名），则需要删除旧的便签文件
    const newFileName = title + '.md';
    const isRename = currentNoteName && currentNoteName !== newFileName;
    
    const res = await window.api.saveNote(newFileName, content);
    if (res.success) {
      showToast('便签已成功保存！');
      
      if (isRename) {
        await window.api.deleteNote(currentNoteName);
      }
      
      currentNoteName = res.noteName;
      isEditingNote = false;
      
      // 切回预览模式
      noteTitleInput.readOnly = true;
      notePreviewPane.innerHTML = renderMarkdown(content) || `<p style="color: var(--text-muted); font-style: italic;">便签内容为空</p>`;
      notePreviewPane.style.display = 'block';
      noteEditArea.style.display = 'none';
      triggerMermaidRender(); // 触发流程图渲染
      
      btnEditNote.style.display = 'inline-flex';
      btnSaveNote.style.display = 'none';
      
      await loadNotesList();
    } else {
      showToast('保存失败: ' + res.error, true);
    }
  } catch (err) {
    showToast('保存异常: ' + err, true);
  } finally {
    btnSaveNote.disabled = false;
  }
});

// 删除便签
btnDeleteNote.addEventListener('click', async () => {
  if (!currentNoteName) return;
  
  const displayName = currentNoteName.slice(0, -3);
  const confirmDelete = confirm(`确认要彻底删除便签 "${displayName}" 吗？`);
  if (!confirmDelete) return;
  
  try {
    const res = await window.api.deleteNote(currentNoteName);
    if (res.success) {
      showToast('便签已删除');
      currentNoteName = '';
      noteTitleInput.value = '';
      noteTitleInput.readOnly = true;
      noteEditArea.value = '';
      
      // 恢复空状态
      notePreviewPane.innerHTML = `
        <div class="notes-empty-state">
          <i class="fa-solid fa-note-sticky" style="font-size: 3.5rem; margin-bottom: 16px; opacity: 0.25;"></i>
          <p>请在左侧选择便签，或者新建一个便签</p>
        </div>
      `;
      
      btnEditNote.style.display = 'none';
      btnSaveNote.style.display = 'none';
      btnDeleteNote.style.display = 'none';
      btnFullscreenNote.style.display = 'none';
      
      await loadNotesList();
    } else {
      showToast('删除失败: ' + res.error, true);
    }
  } catch (err) {
    showToast('删除异常: ' + err, true);
  }
});

// 新建便签
btnNewNote.addEventListener('click', () => {
  // 默认名：新建便签.md。检测重名
  let defaultTitle = '新建便签';
  let count = 1;
  let newFileName = defaultTitle + '.md';
  
  while (notesList.some(n => n.name.toLowerCase() === newFileName.toLowerCase())) {
    newFileName = `${defaultTitle} (${count}).md`;
    count++;
  }
  
  currentNoteName = newFileName;
  isEditingNote = true;
  
  noteTitleInput.value = currentNoteName.slice(0, -3);
  noteTitleInput.readOnly = false; // 新建的直接可编辑标题
  noteEditArea.value = '';
  
  // 切到编辑状态
  notePreviewPane.style.display = 'none';
  noteEditArea.style.display = 'block';
  
  btnEditNote.style.display = 'none';
  btnSaveNote.style.display = 'inline-flex';
  btnDeleteNote.style.display = 'inline-flex';
  btnFullscreenNote.style.display = 'inline-flex';
  
  noteEditArea.focus();
});


// --- 多选及批量操作逻辑 ---
let selectedPaths = [];
let isBatchMoveOperation = false;

window.toggleSelectItem = function(event, path) {
  event.stopPropagation(); // 阻止冒泡，避免触发双击
  const idx = selectedPaths.indexOf(path);
  if (idx === -1) {
    selectedPaths.push(path);
  } else {
    selectedPaths.splice(idx, 1);
  }
  updateBatchBarUI();
};

function updateBatchBarUI() {
  if (selectedPaths.length > 0) {
    batchSelectCount.textContent = selectedPaths.length;
    batchActionBar.classList.add('active');
  } else {
    batchActionBar.classList.remove('active');
  }
}

// 取消选择按钮
btnBatchClear.addEventListener('click', () => {
  selectedPaths = [];
  updateBatchBarUI();
  document.querySelectorAll('.card-checkbox').forEach(cb => cb.checked = false);
});

// 批量分类移动
btnBatchMove.addEventListener('click', async () => {
  if (selectedPaths.length === 0) return;
  isBatchMoveOperation = true;
  moveFileNameDisplay.textContent = `准备批量分类移动选中的 ${selectedPaths.length} 个项目`;
  
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
});

// 批量删除
btnBatchDelete.addEventListener('click', async () => {
  if (selectedPaths.length === 0) return;
  
  const confirmDel = confirm(`注意：你确定要彻底删除选中的 ${selectedPaths.length} 个文件/文件夹吗？此操作不可撤销！`);
  if (!confirmDel) return;
  
  btnBatchDelete.disabled = true;
  try {
    const res = await window.api.batchDelete(selectedPaths);
    if (res.success) {
      showToast('批量删除成功！');
      selectedPaths = [];
      updateBatchBarUI();
      await navigateTo(currentSubPath);
    } else {
      showToast('批量删除失败: ' + res.error, true);
    }
  } catch (err) {
    showToast('删除发生异常: ' + err, true);
  } finally {
    btnBatchDelete.disabled = false;
  }
});

// 异步渲染 Mermaid 图表函数
function triggerMermaidRender() {
  if (window.mermaid) {
    setTimeout(() => {
      try {
        window.mermaid.run();
      } catch (e) {
        try {
          window.mermaid.init();
        } catch (err) {
          console.warn('Mermaid 渲染失败:', err);
        }
      }
    }, 100);
  }
}

// --- 录音与实时同传核心引擎 ---
let isRecording = false;
let recordStartTime = null;
let recordTimerInterval = null;
let mediaStream = null;
let mainAudioRecorder = null;
let mainRecordedChunks = [];

// 同传分片变量
let sliceAudioRecorder = null;
let sliceAudioChunks = [];
let sliceTimer = null;
let interpretationHistory = []; // { time: string, original: string, translation: string }

// 录音波形可视化
let audioCtx = null;
let analyserNode = null;
let canvasCtx = null;
let drawVisual = null;

function setupVisualizer(stream, sharedCtx = null) {
  if (!recordVisualizer) return;
  canvasCtx = recordVisualizer.getContext('2d');
  
  audioCtx = sharedCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const source = audioCtx.createMediaStreamSource(stream);
  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 256;
  source.connect(analyserNode);
  
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  canvasCtx.clearRect(0, 0, recordVisualizer.width, recordVisualizer.height);
  
  function draw() {
    if (!isRecording) return;
    drawVisual = requestAnimationFrame(draw);
    analyserNode.getByteFrequencyData(dataArray);
    
    canvasCtx.fillStyle = '#0f172a'; // 深色面板底色
    canvasCtx.fillRect(0, 0, recordVisualizer.width, recordVisualizer.height);
    
    const barWidth = (recordVisualizer.width / bufferLength) * 1.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 2.5;
      // 渐变蓝色
      canvasCtx.fillStyle = `rgb(${dataArray[i] + 80}, 99, 235)`;
      canvasCtx.fillRect(x, recordVisualizer.height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }
  }
  
  draw();
}

function updateRecordTimer() {
  const elapsed = Math.floor((Date.now() - recordStartTime) / 1000);
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  recordTimer.textContent = `${m}:${s}`;
}

// WAV 编码缓存与节点变量
let wavAudioChunks = [];
let audioContext = null;
let scriptProcessorNode = null;
let microphoneSource = null;

async function startRecording() {
  try {
    try {
      const savedMicId = localStorage.getItem('selectedMicrophoneId');
      const constraints = savedMicId ? { audio: { deviceId: { exact: savedMicId } } } : { audio: true };
      mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      console.warn('使用选定麦克风失败，降级使用默认麦克风:', e);
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    
    isRecording = true;
    recordStartTime = Date.now();
    recordTimer.textContent = '00:00';
    recordTimerInterval = setInterval(updateRecordTimer, 1000);
    
    // UI状态切换
    btnRecordStart.disabled = true;
    btnRecordStart.style.background = '#475569';
    btnRecordStart.style.boxShadow = 'none';
    btnRecordStop.disabled = false;
    btnRecordStop.style.background = 'var(--danger)';
    recordStatusText.innerHTML = '<span style="color:var(--danger); font-weight:bold;"><i class="fa-solid fa-circle fa-beat" style="margin-right:6px;"></i> 正在录音并对齐中...</span>';
    
    // 主录音器：PCM 原始流采集
    wavAudioChunks = [];
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // 启动示波器（共享已激活的 AudioContext，防驱动独占）
    setupVisualizer(mediaStream, audioContext);
    
    microphoneSource = audioContext.createMediaStreamSource(mediaStream);
    // 建立 4096 字节缓冲区，双输入、双输出声道
    scriptProcessorNode = audioContext.createScriptProcessor(4096, 2, 2);
    
    scriptProcessorNode.onaudioprocess = (e) => {
      if (!isRecording) return;
      const left = e.inputBuffer.getChannelData(0);
      const right = e.inputBuffer.getChannelData(1);
      // 深拷贝音频分片，避免对象回收导致的音频片段丢失
      wavAudioChunks.push({
        left: new Float32Array(left),
        right: new Float32Array(right)
      });
    };
    
    microphoneSource.connect(scriptProcessorNode);
    scriptProcessorNode.connect(audioContext.destination);
    
    // 同声传译分片开启 (保持使用 WebM 格式传递给 AI，因为 Gemini API 支持 webm 且切片较小)
    if (checkboxEnableInterpret.checked) {
      interpretationHistory = [];
      interpretLogContainer.innerHTML = '';
      interpretEmptyPlaceholder.style.display = 'none';
      btnSaveInterpret.disabled = true;
      startInterpretationSlices(mediaStream);
    } else {
      interpretEmptyPlaceholder.style.display = 'flex';
      interpretLogContainer.innerHTML = '';
      btnSaveInterpret.disabled = true;
    }
  } catch (err) {
    showToast('麦克风权限获取失败: ' + err.message, true);
    isRecording = false;
    btnRecordStart.disabled = false;
    btnRecordStart.style.background = 'var(--danger)';
    btnRecordStop.disabled = true;
    btnRecordStop.style.background = '#475569';
    recordStatusText.textContent = '录音机故障: ' + err.message;
  }
}

async function stopRecording() {
  if (!isRecording) return;
  
  isRecording = false;
  clearInterval(recordTimerInterval);
  clearTimeout(sliceTimer);
  
  btnRecordStart.disabled = false;
  btnRecordStart.style.background = 'var(--danger)';
  btnRecordStart.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.35)';
  btnRecordStop.disabled = true;
  btnRecordStop.style.background = '#475569';
  recordStatusText.textContent = '录音已停止，文件正在保存...';
  
  // 断开 Web Audio 节点与监听
  if (scriptProcessorNode) {
    scriptProcessorNode.disconnect();
    scriptProcessorNode.onaudioprocess = null;
    scriptProcessorNode = null;
  }
  if (microphoneSource) {
    microphoneSource.disconnect();
    microphoneSource = null;
  }
  
  // 终止分片同传
  if (sliceAudioRecorder && sliceAudioRecorder.state === 'recording') {
    sliceAudioRecorder.stop();
  }
  
  // 释放麦克风硬件资源
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }

  // 延迟 50ms 执行，给 Electron UI 留出渲染停止录音按钮状态和提示文字的空档，防止界面卡死
  setTimeout(async () => {
    if (wavAudioChunks.length > 0) {
      try {
        const sampleRate = audioContext ? audioContext.sampleRate : 44100;
        const wavBlob = exportWAV(wavAudioChunks, sampleRate);
        const arrayBuffer = await wavBlob.arrayBuffer();
        const now = new Date();
        const filename = `Record_${formatDateForFile(now)}.mp3`;
        
        const res = await window.api.saveRecordFile(filename, new Uint8Array(arrayBuffer));
        if (res.success) {
          showToast('录音已保存为 MP3 压缩格式！');
          loadRecordingsList();
        } else {
          showToast('保存录音失败: ' + res.error, true);
        }
      } catch (e) {
        showToast('WAV 编码失败: ' + e.message, true);
      }
    }

    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
      audioContext = null;
    }
    
    // 恢复状态提示文字
    recordStatusText.textContent = '录音设备就绪，点击红色麦克风开始录音';
  }, 50);
}

function startInterpretationSlices(stream) {
  sliceAudioChunks = [];
  sliceAudioRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  sliceAudioRecorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) {
      sliceAudioChunks.push(e.data);
    }
  };
  
  const getSliceDurationMs = () => {
    const savedSec = parseInt(localStorage.getItem('selectedInterpretDuration') || '10', 10);
    return savedSec * 1000;
  };

  sliceAudioRecorder.onstop = async () => {
    if (sliceAudioChunks.length > 0) {
      const blob = new Blob(sliceAudioChunks, { type: 'audio/webm' });
      sliceAudioChunks = [];
      processSlice(blob, Date.now() - recordStartTime);
    }
    if (isRecording && checkboxEnableInterpret.checked) {
      sliceAudioRecorder.start();
      sliceTimer = setTimeout(() => {
        if (sliceAudioRecorder.state === 'recording') {
          sliceAudioRecorder.stop();
        }
      }, getSliceDurationMs());
    }
  };
  
  sliceAudioRecorder.start();
  sliceTimer = setTimeout(() => {
    if (sliceAudioRecorder.state === 'recording') {
      sliceAudioRecorder.stop();
    }
  }, getSliceDurationMs());
}

const sliceAccumulatedTexts = {};

window.api.onInterpretSliceChunk((data) => {
  const { taskId, chunk } = data;
  const tempElement = document.getElementById(taskId);
  if (tempElement) {
    if (!sliceAccumulatedTexts[taskId]) {
      sliceAccumulatedTexts[taskId] = '';
    }
    sliceAccumulatedTexts[taskId] += chunk;
    
    const parts = sliceAccumulatedTexts[taskId].split('|||');
    const original = parts[0]?.trim() || '';
    const translation = parts[1]?.trim() || '';
    const timeStr = tempElement.dataset.timeStr || '--:--';
    
    let originalHtml = '';
    let translationHtml = '';
    
    if (parts.length > 1) {
      // 已经包含分割线，说明正在翻译或已经翻译完成
      originalHtml = original;
      translationHtml = translation ? `${translation}<span class="typing-cursor"></span>` : '<i class="fa-solid fa-spinner fa-spin"></i> 正在翻译...';
    } else {
      // 尚未检测到分割线，说明仍在录音原文听写中
      originalHtml = original ? `${original}<span class="typing-cursor"></span>` : '<i class="fa-solid fa-spinner fa-spin"></i> 正在识别原文...';
      translationHtml = '<i class="fa-solid fa-spinner fa-spin"></i> 正在翻译...';
    }
    
    tempElement.innerHTML = `
      <div style="font-size:0.75rem; color:var(--primary); font-weight:bold; margin-bottom:4px;">[${timeStr}]</div>
      <div style="display:flex; flex-direction:column; gap:4px;">
        <p style="font-size:0.85rem; color:var(--text-main); margin:0;">${originalHtml}</p>
        <p style="font-size:0.85rem; color:var(--success); font-weight:500; margin:0;">${translationHtml}</p>
      </div>
    `;
    interpretLogContainer.scrollTop = interpretLogContainer.scrollHeight;
  }
});

async function processSlice(blob, relativeTimeMs) {
  const arrayBuffer = await blob.arrayBuffer();
  const base64Data = arrayBufferToBase64(arrayBuffer);
  
  const tempId = 'interpret-temp-' + Date.now();
  const sliceDurationSec = parseInt(localStorage.getItem('selectedInterpretDuration') || '10', 10);
  const seconds = Math.floor(relativeTimeMs / 1000) - sliceDurationSec;
  const formatSec = seconds < 0 ? 0 : seconds;
  const m = String(Math.floor(formatSec / 60)).padStart(2, '0');
  const s = String(formatSec % 60).padStart(2, '0');
  const timeStr = `${m}:${s}`;
  
  const tempBubble = document.createElement('div');
  tempBubble.id = tempId;
  tempBubble.dataset.timeStr = timeStr; // 存放时间戳供流式渲染使用
  tempBubble.style.padding = '8px 12px';
  tempBubble.style.borderLeft = '3px solid var(--primary)';
  tempBubble.style.background = 'rgba(255,255,255,0.02)';
  tempBubble.style.borderRadius = '4px';
  tempBubble.style.textAlign = 'left';
  tempBubble.style.margin = '4px 0';
  tempBubble.innerHTML = `<span style="font-size:0.75rem; color:var(--primary); font-weight:bold;">[${timeStr}]</span> <span style="font-size:0.85rem; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> 正在识别和翻译同传...</span>`;
  interpretLogContainer.appendChild(tempBubble);
  interpretLogContainer.scrollTop = interpretLogContainer.scrollHeight;
  
  const targetLang = selectInterpretLang.value;
  try {
    const recentHistory = interpretationHistory.slice(-2);
    const res = await window.api.interpretAudioSlice(base64Data, targetLang, recentHistory, tempId);
    const tempElement = document.getElementById(tempId);
    if (res.success) {
      const textResult = res.text.trim();
      const parts = textResult.split('|||');
      const original = parts[0]?.trim() || '（无语音或未能识别）';
      const translation = parts[1]?.trim() || '（翻译未生成）';
      
      interpretationHistory.push({ time: timeStr, original, translation });
      
      if (tempElement) {
        tempElement.style.padding = '12px';
        tempElement.style.borderLeft = '3px solid var(--primary)';
        tempElement.style.background = 'rgba(255,255,255,0.03)';
        tempElement.style.borderRadius = '6px';
        tempElement.style.margin = '4px 0';
        tempElement.innerHTML = `
          <div style="font-size:0.75rem; color:var(--primary); font-weight:bold; margin-bottom:4px;">[${timeStr}]</div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <p style="font-size:0.85rem; color:var(--text-main); margin:0;">${original}</p>
            <p style="font-size:0.85rem; color:var(--success); font-weight:500; margin:0;">${translation}</p>
          </div>
        `;
      }
      btnSaveInterpret.disabled = false;
    } else {
      if (tempElement) {
        tempElement.innerHTML = `<span style="font-size:0.75rem; color:var(--danger);">[${timeStr}]</span> <span style="font-size:0.85rem; color:var(--danger);">同传服务错误: ${res.error}</span>`;
      }
    }
  } catch (err) {
    const tempElement = document.getElementById(tempId);
    if (tempElement) {
      tempElement.innerHTML = `<span style="font-size:0.75rem; color:var(--danger);">[${timeStr}]</span> <span style="font-size:0.85rem; color:var(--danger);">网络连接异常: ${err.message}</span>`;
    }
  }
  interpretLogContainer.scrollTop = interpretLogContainer.scrollHeight;
}

let localRecordings = [];

async function loadRecordingsList() {
  try {
    const res = await window.api.listRecordFiles();
    if (res.success) {
      localRecordings = res.files;
      renderRecordingsListUI();
    } else {
      showToast('获取录音列表失败: ' + res.error, true);
    }
  } catch (err) {
    showToast('加载录音列表出错: ' + err, true);
  }
}

function renderRecordingsListUI() {
  if (recordingsCountBadge) {
    recordingsCountBadge.textContent = localRecordings.length;
    recordingsCountBadge.style.display = localRecordings.length > 0 ? 'inline-block' : 'none';
  }

  if (localRecordings.length === 0) {
    recordingsContainer.innerHTML = `
      <div style="padding: 24px 16px; color: var(--text-muted); text-align: center; font-size: 0.85rem; line-height: 1.5;">
        <i class="fa-solid fa-microphone-slash" style="font-size: 2rem; margin-bottom: 8px; opacity: 0.3;"></i>
        <p>Record 目录中暂无音频</p>
      </div>
    `;
    return;
  }

  recordingsContainer.innerHTML = localRecordings.map((file, index) => {
    return `
      <div class="playlist-item" style="padding: 10px 12px; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
        <div class="playlist-item-left" style="display:flex; align-items:center; gap:8px; overflow: hidden; flex: 1; margin-right: 8px;">
          <i class="fa-solid fa-microphone" style="color: var(--primary);"></i>
          <span class="playlist-item-title text-ellipsis" title="${file.name}" style="font-size:0.85rem; color: var(--text-main); font-weight: 500;">${file.name}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-shrink: 0;">
          <span style="font-size:0.75rem; color:var(--text-muted);">${formatSize(file.size)}</span>
          <button class="card-btn" onclick="playRecordFile('${file.name.replace(/'/g, "\\'")}', '${file.fullPath.replace(/\\/g, '\\\\')}')" title="播放" style="padding:6px 10px; border-radius: 6px;"><i class="fa-solid fa-play" style="font-size:0.75rem;"></i></button>
          <button class="card-btn btn-delete" onclick="deleteRecordFile('${file.name.replace(/'/g, "\\'")}', '${file.fullPath.replace(/\\/g, '\\\\')}')" title="删除" style="padding:6px 10px; border-radius: 6px;"><i class="fa-solid fa-trash" style="font-size:0.75rem;"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

window.playRecordFile = (name, fullPath) => {
  window.playAudioFromFile(name, fullPath);
};

window.deleteRecordFile = async (name, fullPath) => {
  const confirmDel = confirm(`您确定要彻底删除录音文件 "${name}" 吗？`);
  if (!confirmDel) return;
  try {
    const res = await window.api.deleteItem(fullPath);
    if (res.success) {
      showToast('录音删除成功！');
      loadRecordingsList();
    } else {
      showToast('删除失败: ' + res.error, true);
    }
  } catch (err) {
    showToast('删除异常: ' + err, true);
  }
};

// Event Listeners
btnRecordStart.addEventListener('click', startRecording);
btnRecordStop.addEventListener('click', stopRecording);

btnSaveInterpret.addEventListener('click', async () => {
  if (interpretationHistory.length === 0) return;
  
  // 自动生成默认标题，自动规避重名，规避不稳定的 Electron window.prompt 弹窗
  const defaultTitle = `Interpret_${formatDateForFile(new Date())}`;
  await loadNotesList();
  let count = 1;
  let filename = defaultTitle + '.md';
  while (notesList.some(n => n.name.toLowerCase() === filename.toLowerCase())) {
    filename = `${defaultTitle}_${count}.md`;
    count++;
  }
  
  let mdContent = `# 同声传译转录文档 (${selectInterpretLang.value === 'zh-to-en' ? '中译英' : '英译中'})\n`;
  mdContent += `* 导出时间：${new Date().toLocaleString()}\n\n`;
  mdContent += `| 时间轴 | 发言原文 | 翻译对齐 |\n`;
  mdContent += `| :--- | :--- | :--- |\n`;
  
  interpretationHistory.forEach(item => {
    mdContent += `| ${item.time} | ${item.original.replace(/\|/g, '\\|')} | ${item.translation.replace(/\|/g, '\\|')} |\n`;
  });
  
  try {
    const res = await window.api.saveNote(filename, mdContent);
    if (res.success) {
      showToast(`已成功导出至便签：${filename}`);
      await loadNotesList(); // 立即重新加载便签列表，保持左侧列表实时同步！
    } else {
      showToast('导出便签失败: ' + res.error, true);
    }
  } catch (err) {
    showToast('导出异常: ' + err, true);
  }
});

// Helper utilities
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function formatDateForFile(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}_${hh}${mm}${ss}`;
}

// 选项卡切换逻辑 (同声传译 / 文本翻译)
function switchTranslateTab(tabName) {
  if (tabName === 'interpret') {
    tabInterpretBtn.classList.add('active');
    tabInterpretBtn.style.color = 'var(--primary)';
    tabInterpretBtn.style.borderBottom = '2px solid var(--primary)';
    
    tabTextTranslateBtn.classList.remove('active');
    tabTextTranslateBtn.style.color = 'var(--text-muted)';
    tabTextTranslateBtn.style.borderBottom = 'none';
    
    interpretSubView.style.display = 'flex';
    textTranslateSubView.style.display = 'none';
  } else {
    tabTextTranslateBtn.classList.add('active');
    tabTextTranslateBtn.style.color = 'var(--primary)';
    tabTextTranslateBtn.style.borderBottom = '2px solid var(--primary)';
    
    tabInterpretBtn.classList.remove('active');
    tabInterpretBtn.style.color = 'var(--text-muted)';
    tabInterpretBtn.style.borderBottom = 'none';
    
    interpretSubView.style.display = 'none';
    textTranslateSubView.style.display = 'flex';
  }
}

tabInterpretBtn.addEventListener('click', () => switchTranslateTab('interpret'));
tabTextTranslateBtn.addEventListener('click', () => switchTranslateTab('text-translate'));

// 文本翻译交互逻辑
btnTextTranslate.addEventListener('click', async () => {
  const srcText = textareaTranslateSrc.value.trim();
  if (!srcText) {
    showToast('请输入要翻译的文本！', true);
    return;
  }
  
  btnTextTranslate.disabled = true;
  btnTextTranslate.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 正在翻译...';
  divTranslateResult.innerHTML = '<span style="color: var(--text-muted); font-style: italic;"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i> API 正在分析翻译中...</span>';
  btnCopyTranslate.disabled = true;
  btnExportTranslate.disabled = true;
  
  try {
    const targetLang = selectTextTranslateLang.value;
    const res = await window.api.translateText(srcText, targetLang);
    if (res.success) {
      divTranslateResult.textContent = res.text;
      btnCopyTranslate.disabled = false;
      btnExportTranslate.disabled = false;
    } else {
      divTranslateResult.innerHTML = `<span style="color: var(--danger);">翻译失败: ${res.error}</span>`;
    }
  } catch (err) {
    divTranslateResult.innerHTML = `<span style="color: var(--danger);">网络或系统故障: ${err.message}</span>`;
  } finally {
    btnTextTranslate.disabled = false;
    btnTextTranslate.innerHTML = '<i class="fa-solid fa-language"></i> 立即翻译';
  }
});

btnCopyTranslate.addEventListener('click', () => {
  const resultText = divTranslateResult.textContent.trim();
  if (!resultText) return;
  navigator.clipboard.writeText(resultText);
  showToast('翻译结果已成功复制到剪贴板！');
});

btnExportTranslate.addEventListener('click', async () => {
  const resultText = divTranslateResult.textContent.trim();
  const srcText = textareaTranslateSrc.value.trim();
  if (!resultText || !srcText) return;
  
  // 自动生成默认标题，自动规避重名，规避不稳定的 Electron window.prompt 弹窗
  const defaultTitle = `Translation_${formatDateForFile(new Date())}`;
  await loadNotesList();
  let count = 1;
  let filename = defaultTitle + '.md';
  while (notesList.some(n => n.name.toLowerCase() === filename.toLowerCase())) {
    filename = `${defaultTitle}_${count}.md`;
    count++;
  }
  
  let mdContent = `# 文本翻译文档\n`;
  mdContent += `* 导出时间：${new Date().toLocaleString()}\n`;
  mdContent += `* 翻译方向：${selectTextTranslateLang.value === 'to-en' ? '中译英' : '英译中'}\n\n`;
  mdContent += `### 原文\n${srcText}\n\n`;
  mdContent += `### 译文\n${resultText}\n`;
  
  try {
    const res = await window.api.saveNote(filename, mdContent);
    if (res.success) {
      showToast(`已成功导出至便签：${filename}`);
      await loadNotesList(); // 立即重新加载便签列表，保持左侧列表实时同步！
    } else {
      showToast('导出便签失败: ' + res.error, true);
    }
  } catch (err) {
    showToast('导出异常: ' + err, true);
  }
});

// WAV 编码辅助工具函数
function exportWAV(buffers, sampleRate) {
  let leftLen = 0;
  buffers.forEach(b => leftLen += b.left.length);
  
  const leftChannel = new Float32Array(leftLen);
  const rightChannel = new Float32Array(leftLen);
  
  let offset = 0;
  buffers.forEach(b => {
    leftChannel.set(b.left, offset);
    rightChannel.set(b.right, offset);
    offset += b.left.length;
  });
  
  const buffer = new ArrayBuffer(44 + leftLen * 2 * 2);
  const view = new DataView(buffer);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + leftLen * 2 * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM = 1) */
  view.setUint16(20, 1, true);
  /* channel count (2 = stereo) */
  view.setUint16(22, 2, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 4, true);
  /* bits per sample (16 bits) */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, leftLen * 2 * 2, true);
  
  // 写入交织双声道 PCM 采样点
  let index = 44;
  for (let i = 0; i < leftLen; i++) {
    // 左声道
    let s = Math.max(-1, Math.min(1, leftChannel[i]));
    view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    // 右声道
    s = Math.max(-1, Math.min(1, rightChannel[i]));
    view.setInt16(index + 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    index += 4;
  }
  
  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// 绑定自定义窗口标题栏的控制按钮点击事件
document.getElementById('titlebar-minimize-btn').addEventListener('click', () => {
  window.api.minimizeWindow();
});
document.getElementById('titlebar-maximize-btn').addEventListener('click', () => {
  window.api.maximizeWindow();
});
document.getElementById('titlebar-close-btn').addEventListener('click', () => {
  window.api.closeWindow();
});

// 获取并填充麦克风和扬声器硬件设备列表
async function populateMediaDevices() {
  try {
    // 尝试激活授权以获取真实设备标签 Label，但即使失败也绝不阻塞后续列表枚举
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stream) {
        stream.getTracks().forEach(track => track.stop()); // 立即释放占用，保持通道干净
      }
    } catch (e) {
      console.warn('获取麦克风标签权限被拦截或设备被独占占满:', e.message);
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    
    // 初始化清空下拉菜单并恢复默认选项
    selectAudioInput.innerHTML = '<option value="">默认系统麦克风</option>';
    selectAudioOutput.innerHTML = '<option value="">默认系统扬声器</option>';
    
    const savedMic = localStorage.getItem('selectedMicrophoneId') || '';
    const savedSpeaker = localStorage.getItem('selectedSpeakerId') || '';
    const savedDuration = localStorage.getItem('selectedInterpretDuration') || '10';
    
    // 回显保存的时长配置
    selectInterpretDuration.value = savedDuration;
    
    devices.forEach(device => {
      if (device.kind === 'audioinput') {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `麦克风 (${device.deviceId.slice(0, 5)}...)`;
        if (device.deviceId === savedMic) option.selected = true;
        selectAudioInput.appendChild(option);
      } else if (device.kind === 'audiooutput') {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `扬声器 (${device.deviceId.slice(0, 5)}...)`;
        if (device.deviceId === savedSpeaker) option.selected = true;
        selectAudioOutput.appendChild(option);
      }
    });
  } catch (err) {
    console.error('获取媒体设备硬件列表失败:', err);
  }
}

// 绑定保存音频与同传配置事件
btnSaveDeviceSettings.addEventListener('click', () => {
  const micId = selectAudioInput.value;
  const speakerId = selectAudioOutput.value;
  const duration = selectInterpretDuration.value;
  
  localStorage.setItem('selectedMicrophoneId', micId);
  localStorage.setItem('selectedSpeakerId', speakerId);
  localStorage.setItem('selectedInterpretDuration', duration);
  
  // 立即将所选的扬声器应用到主音频播放器上！
  if (typeof htmlAudioPlayer.setSinkId === 'function') {
    htmlAudioPlayer.setSinkId(speakerId).catch(err => {
      console.warn('切换音频输出设备失败:', err);
    });
  }
  
  showToast('音频及同传配置保存成功！');
});

// --- 全屏阅读/编辑切换监听 ---
btnFullscreenNote.addEventListener('click', () => {
  const isFullscreen = noteContentArea.classList.toggle('fullscreen-active');
  if (isFullscreen) {
    btnFullscreenNote.innerHTML = '<i class="fa-solid fa-compress"></i> 退出全屏';
  } else {
    btnFullscreenNote.innerHTML = '<i class="fa-solid fa-expand"></i> 全屏';
  }
});

btnFullscreenTranslate.addEventListener('click', () => {
  const isFullscreen = translateResultWrapper.classList.toggle('fullscreen-active');
  if (isFullscreen) {
    btnFullscreenTranslate.innerHTML = '<i class="fa-solid fa-compress"></i> 退出全屏';
  } else {
    btnFullscreenTranslate.innerHTML = '<i class="fa-solid fa-expand"></i> 全屏';
  }
});
