# VideoInsight

VideoInsight is a cross-platform desktop application built with React, HeroUI, and Electron that extracts insights from YouTube and Bilibili videos using AI. The app downloads videos, extracts audio, converts speech to text using Whisper, and generates summaries using large language models (LLMs).

## Features

- **Multi-platform Video Support**: YouTube and Bilibili video processing
- **Automated Pipeline**: Video download → Audio extraction → Speech-to-text → AI summarization
- **Local AI Processing**: Uses local Whisper for speech recognition and Ollama for LLM inference
- **Cloud AI Support**: Fallback to OpenAI GPT and Claude APIs
- **Modern UI**: Built with HeroUI components and Tailwind CSS
- **Task Management**: Track processing progress and manage task history
- **Export Options**: Save summaries and transcripts as Markdown or plain text
- **Cross-platform**: Available for Windows, macOS, and Linux

## Prerequisites

Before running VideoInsight, you need to install the following dependencies:

### Required Dependencies

1. **yt-dlp** - For video downloading
   ```bash
   # Install via pip
   pip install yt-dlp
   
   # Or via package manager
   brew install yt-dlp  # macOS
   sudo apt install yt-dlp  # Ubuntu/Debian
   ```

2. **FFmpeg** - For audio extraction
   ```bash
   # macOS
   brew install ffmpeg
   
   # Ubuntu/Debian
   sudo apt update && sudo apt install ffmpeg
   
   # Windows (via Chocolatey)
   choco install ffmpeg
   ```

3. **Whisper** - For speech-to-text
   ```bash
   pip install openai-whisper
   ```

### Optional Dependencies

4. **Ollama** - For local LLM processing (recommended)
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Pull models
   ollama pull llama3
   ollama pull qwen
   ```

## Installation

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd videoinsight
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build Electron main process**
   ```bash
   npm run build:electron
   ```

4. **Start development server**
   ```bash
   npm run electron:dev
   ```

### Production Build

1. **Build the application**
   ```bash
   npm run build
   npm run build:electron
   ```

2. **Package for distribution**
   ```bash
   # Build for current platform
   npm run electron:pack
   
   # Build for all platforms
   npm run electron:dist
   ```

## Usage

### Basic Workflow

1. **Launch VideoInsight**
2. **Add a Video URL**
   - Paste a YouTube or Bilibili URL in the input field
   - Or drag and drop a URL into the drag area
   - The app will automatically detect the platform

3. **Process Video**
   - Click "Process Video" to start the pipeline
   - Monitor progress through the status indicators

4. **View Results**
   - Access summaries and transcripts from the task list
   - Export results as Markdown or plain text files

### Settings Configuration

Navigate to the Settings tab to configure:

- **LLM Model**: Choose between local Ollama models or cloud APIs
- **Whisper Model**: Select speech recognition model (tiny to large)
- **API Keys**: Configure OpenAI or Claude API credentials
- **Theme**: Choose light, dark, or system theme
- **Export Format**: Set default export format (MD/TXT)

## Architecture

### Technology Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: HeroUI + Tailwind CSS
- **Desktop Framework**: Electron 28+
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS + HeroUI theme

### Project Structure

```
videoinsight/
├── electron/                 # Electron main process
│   ├── main.ts              # Main process entry point
│   ├── preload.ts           # Preload script for IPC
│   └── tsconfig.json        # TypeScript config for Electron
├── src/                     # React application source
│   ├── components/          # React components
│   │   ├── URLInput.tsx     # URL input and validation
│   │   ├── TaskList.tsx     # Task management interface
│   │   └── Settings.tsx     # Settings configuration
│   ├── store/               # State management
│   │   └── appStore.ts      # Zustand store
│   ├── types/               # TypeScript definitions
│   │   └── electron.d.ts    # Electron API types
│   ├── App.tsx              # Main app component
│   └── main.tsx             # React entry point
├── dist/                    # Built React app
├── dist-electron/           # Built Electron process
└── package.json             # Project configuration
```

### IPC Communication

The app uses Electron's IPC (Inter-Process Communication) for secure communication between the renderer (React) and main process:

- **Video Download**: `downloadVideo(url)`
- **Audio Extraction**: `extractAudio(videoPath)`
- **Speech Recognition**: `speechToText(audioPath)`
- **LLM Summarization**: `llmSummarize(text, model)`

## API Integration

### Local Models (Recommended)

- **Whisper**: Local speech-to-text processing
- **Ollama**: Local LLM inference (Llama3, Qwen, Mistral)

### Cloud APIs

- **OpenAI**: GPT-4, GPT-3.5 Turbo
- **Anthropic**: Claude models

## Development

### Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build React app for production
- `npm run electron:dev` - Start Electron in development mode
- `npm run build:electron` - Build Electron TypeScript files
- `npm run electron:pack` - Package app for current platform
- `npm run electron:dist` - Build distribution packages

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **yt-dlp not found**
   - Ensure yt-dlp is installed and available in PATH
   - Try: `which yt-dlp` (macOS/Linux) or `where yt-dlp` (Windows)

2. **FFmpeg not found**
   - Install FFmpeg and verify: `ffmpeg -version`

3. **Whisper not working**
   - Install via pip: `pip install openai-whisper`
   - Check installation: `whisper --help`

4. **Ollama models not loading**
   - Install Ollama: Follow instructions at https://ollama.ai
   - Pull models: `ollama pull llama3`

### Logs and Debugging

- Application logs are stored in the system log directory
- Enable debug mode by setting `NODE_ENV=development`
- Check browser console for renderer process errors

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) for video downloading
- [FFmpeg](https://ffmpeg.org/) for audio processing
- [OpenAI Whisper](https://github.com/openai/whisper) for speech recognition
- [Ollama](https://ollama.ai/) for local LLM inference
- [HeroUI](https://heroui.com/) for the component library
- [Electron](https://www.electronjs.org/) for cross-platform desktop support