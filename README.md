# File Organizer (备赛资源管理器)

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
*   **Settings Persistence (配置持久化)**: Automatically saves your configured root path in persistent user data storage. (关机或重启后，自动记住你上次设置的工作区路径，无需重复输入)

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
