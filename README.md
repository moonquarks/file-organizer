# File Organizer (备赛资源管理器)
（这个README也是哈基米写，补药压力窝QWQ）
A modern, high-aesthetics desktop File Explorer/Manager replacement built with Electron, HTML5, CSS3, and JavaScript (ES6+). Designed to replace boring default operating system file explorers with an interactive custom workspace.

这是一个基于 Electron 开发的现代化、高颜值桌面文件管理器，旨在为特定备赛或工作目录提供深度定制的文件整理与探索体验。

---

## ✨ Features (功能特性)

*   **Dynamic Directory Browsing (动态路径浏览)**: Double-click to navigate and enter folders directly in-app with path breadcrumbs. (支持在应用内双击进入子文件夹浏览，支持面包屑导航路径跳跃)
*   **Manual File Relocation (手动移动分类)**: Move scattered files to any root-level directory in one click. (支持一键将散落文件手动移动或分类到根目录的任意子文件夹下)
*   **Custom Directory Creation (自定义目录创建)**: Add new folders directly from the interface. (支持在当前路径下直接新建文件夹)
*   **Quick Navigation Sidebar (侧边栏导航)**: Instant access to root directories and home paths. (侧边栏实时抓取根目录文件夹，提供一键直达快速通道)
*   **Visual File Icons (彩色文件类型图标)**: Automatically color-maps popular document extensions (.docx, .pptx, .xlsx, .pdf, .md, archives, images, media, etc.) for high scannability. (为 Word、Excel、PPT、PDF、Markdown、压缩包等常见后缀自动匹配精致的品牌色图标)
*   **Workspace Customization (扫描路径自定义)**: Scan any local folder by updating the workspace settings. (支持在设置中输入任意本地绝对路径进行扫描与接管)
*   **Settings Persistence (配置持久化)**: Automatically saves your configured root path and API credentials in persistent user data storage. (关机或重启后，自动记住你上次设置的工作区路径及 API 配置，无需重复输入)
*   **Premium Audio Player (备赛音频播放器)**: Multi-format player supporting `.mp3`, `.ogg`, `.wav`, `.m4a`, `.aac`, `.flac` with playlist scanner. (内置支持主流格式的音频播放器，支持备赛音频文件扫描与无缝播放)
*   **Speech-to-Text Transcription (语音转文字卡片)**: Transcribe English and Chinese speech recordings on the fly with local cache support. (集成中英文语音转文字组件，边听边看，转换文本自动本地缓存)
*   **LLM API Settings (AI 大模型设置)**: Seamlessly input customized API keys, base URLs, and model IDs (e.g. Gemini 3.5 Flash) directly in the UI. (支持配置任意 OpenAI 格式兼容的 API 密钥、接口地址及模型名称，如最新的 gemini-3.5-flash)
*   **Workspace Quick Notes (快捷便签)**: Automatic `/Notes` workspace folder creator, visual split-screen Markdown editor, and live renderer. (在工作区自动维护 `Notes/` 文件夹，内置支持简易 Markdown 实时解析与双向预览)
*   **In-app Markdown Reader (Markdown 阅读器)**: Double-clicking any standalone `.md` file inside the explorer opens an interactive viewer modal without polluting the notes workspace directory. (双击工作区内任意 `.md` 文件即可直接在应用内阅读渲染结果，不会另存或复制到 Notes 文件夹)
*   **Multi-Select Batch Actions (项目多选与批量操作)**: Checkbox indicators allow users to batch classify (move) or batch delete selected files/folders in one go. (支持点击项目左上角进行多选，悬浮批量操作栏支持一键批量分类或批量删除)
*   **Real-time Audio Recorder & Sim-Trans (录音同传工作台)**: A dedicated sidebar panel containing a real-time voice recorder with dual-channel output, dynamic wave visualizer, local recordings list, and 5-second slice translation (Chinese/English aligning). The resulting translation logs can be exported directly to the Notes workspace as a formatted Markdown table note. (新开的侧边栏模块，内置双声道录音、波形示波器、本地录音管理及 5 秒分段同传对齐翻译，可一键将翻译内容以精美表格格式直接导出为 Markdown 便签)
*   **Mermaid Diagram Rendering (Mermaid 流程图渲染支持)**: Deep integration of the Mermaid.js layout engine, supporting automatic rendering of flowcharts, sequence diagrams, and class diagrams in both notes preview and standalone file readers. (深度集成 Mermaid 流程图引擎，可在便签预览和文件阅读器中自动将 mermaid 语法糖渲染为可视化矢量图表)

---

## 🤖 AIGC Disclosure & Attribution (AIGC 说明与归属)

> [!IMPORTANT]
> **This project was entirely designed, implemented, and packaged by Gemini/Antigravity (an AI coding assistant developed by Google DeepMind) based on prompts and iterative feedback from the user. The repository owner (user) did not author any code or styling for this project.**
> 
> **本项目的全部代码、界面设计、资源引用及打包配置文件，均由 Google DeepMind 开发的 AI 编程助手 Gemini/Antigravity 根据用户的反馈与指示自动生成。项目仓库所有人（用户）本人未编写本项目的任何一行代码。**

---

## 🚀 Setup & Run (开发与运行)

### Prerequisites (前期准备)

Make sure you have Node.js installed on your machine. (确保你的电脑上安装了 Node.js)

### Development Mode (启动开发环境)

1. Clone the repository and navigate to the project directory:
   ```bash
   cd file-organizer
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the application:
   ```bash
   npm start
   ```

### Build Installer (打包生成安装包)

To compile and package the Nullsoft Setup Installer (`FileOrganizerSetup.exe`):
```bash
npm run dist
```

---

## 📄 License (开源协议)

This project is licensed under the ISC License. (本项目使用 ISC 协议开源)

