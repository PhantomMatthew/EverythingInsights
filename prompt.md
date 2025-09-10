开发这样一个跨平台本地应用（React + HeroUI + Electron）的需求：

🔧 **技术栈**：
- 前端框架：React 18+
- UI组件库：HeroUI（或 Hero Design System，假设为现代化、美观、响应式组件库）
- 桌面框架：Electron 28+（支持 Windows、macOS、Linux）
- 构建工具：Vite + Electron-Builder（推荐）
- 状态管理：Zustand
- 音频提取：ffmpeg.wasm 或 node-ffmpeg（Electron Node.js 环境调用本地 ffmpeg）
- 语音转文字（STT）：Whisper.cpp（本地运行）
- LLM摘要分析：本地 Ollama（如 Llama3、Qwen）或调用 OpenAI GPT / Claude API
- 存储：SQLite（用于缓存历史记录）
- 网络请求：Axios / fetch
- 日志与错误追踪：electron-log + Sentry（可选）


📌 **核心功能需求**：

1. **URL输入与验证**：
   - 用户输入 B站 或 YouTube 视频 URL
   - 自动识别平台，验证格式有效性
   - 支持粘贴、拖拽、历史记录

2. **视频下载与音频抽取**：
   - 调用 yt-dlp
   - 使用 ffmpeg 提取音频（mp3/wav）
   - 显示进度条与状态（下载中、提取中）

3. **语音转文字（Speech-to-Text）**：
   - 调用 Whisper 模型（本地）
   - 显示转录文本预览
   - 支持取消、重试

4. **LLM智能摘要分析**：
   - 将转录文本送入 LLM（如：“请为以下视频内容生成一段200字内的摘要，并列出3个关键点”）
   - 支持选择不同模型（GPT-4, Claude, 本地Llama3等）
   - 显示分析结果，支持复制、导出（TXT/MD）

5. **用户界面（HeroUI）**：
   - 现代化、简洁、深色/浅色主题切换
   - 拖拽上传区域、卡片式任务管理
   - 任务历史列表（带搜索、删除、重新分析）
   - 设置页：API密钥管理、模型选择、缓存清理、语言偏好

6. **跨平台支持**：
   - 使用 Electron-builder 打包为 .exe (Windows), .dmg/.zip (macOS), .AppImage/.deb (Linux)
   - 适配各平台窗口行为、菜单栏、文件路径
   - 支持系统托盘（可选后台运行）

7. **性能与体验优化**：
   - 任务队列管理（避免同时处理多个大任务）
   - 本地缓存转录结果与摘要，避免重复计算
   - 错误处理与用户友好提示（网络失败、格式错误、磁盘空间不足等）
   - 支持离线模式（仅限本地模型）

---

🚀 **开发要求**：

> 使用 React + HeroUI + Electron 构建一个名为 “VideoInsight” 的跨平台本地应用。应用需支持用户输入 B站 或 YouTube 视频链接，自动下载视频、提取音频、调用 Whisper 转文字、再通过 LLM 生成内容摘要。请按以下步骤设计架构：
>
> 1. 使用 Vite 创建 React 项目，集成 HeroUI 组件库，设计美观响应式界面。
> 2. 集成 Electron，配置主进程（main.js）和渲染进程（preload.js），确保 Node.js 模块可在渲染进程安全调用。
> 3. 实现 URL 输入组件，支持平台识别与格式校验。
> 4. 在主进程中封装 yt-dlp + ffmpeg 子进程调用，实现视频下载与音频提取，通过 IPC 与前端通信进度。
> 5. 集成 Whisper（优先本地 whisper.cpp，fallback 到 API），实现语音转文字。
> 6. 接入 LLM（优先 Ollama 本地模型，支持 OpenAI API），发送提示词如：“请为以下内容生成摘要：{text}”。
> 7. 设计任务历史数据库（使用 Dexie.js 或 better-sqlite3），支持增删查与搜索。
> 8. 使用 electron-builder 配置多平台打包，包含图标、版本、自动更新（可选）。
> 9. 添加错误边界、加载状态、用户提示（Toast/Snackbar），提升用户体验。
> 10. 编写 README.md，包含安装、开发、打包说明。
>
> 请输出项目结构、关键代码片段（如 IPC 通信、ffmpeg 调用、LLM 请求）、打包配置示例，以及 UI 设计草图描述（HeroUI 组件使用建议）。

