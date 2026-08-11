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
      
      // 加载侧边栏快速通道
      await loadSidebarQuickLinks();
      
      // 扫描并渲染当前目录
      await navigateTo(currentSubPath);
    }
  } catch (err) {
    showToast('加载配置失败: ' + err, true);
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
    html += `
      <div class="card-item">
        <i class="fa-regular ${iconClass} card-icon file"></i>
        <div class="card-name text-ellipsis" title="${file.name}">${file.name}</div>
        <div class="card-meta">${formatSize(file.size)} | ${file.mtime.split(' ')[0]}</div>
        <div class="card-actions">
          <button class="card-btn" onclick="openItem('${file.fullPath.replace(/\\/g, '\\\\')}')" title="打开文件">
            <i class="fa-solid fa-eye"></i>
          </button>
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


// --- 初始化启动 ---
document.addEventListener('DOMContentLoaded', () => {
  loadConfigAndScan();
});
