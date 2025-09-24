# Repository Guidelines

## Project Structure & Module Organization
- `src/` React + TypeScript UI: `components/`, `store/` (Zustand), `types/`, assets, `App.tsx`, `main.tsx`.
- `electron/` Main process: `main.ts` (IPC, pipeline), `preload.ts` (safe bridges), `database.ts` (better-sqlite3). Emits to `dist-electron/`.
- `public/` static assets; `dist/` Vite build output.
- Key config: `vite.config.ts`, `eslint.config.js`, `tailwind.config.js`, `tsconfig*.json`.

## Build, Test, and Development Commands
- `npm install` install deps (native modules are rebuilt via postinstall).
- `npm run electron:dev` start Vite on :5173 and launch Electron for live dev.
- `npm run build` build renderer (Vite) -> `dist/`.
- `npm run build:electron` compile Electron TS -> `dist-electron/`.
- `npm run electron:pack` package for current OS; `npm run electron:dist` create installers.
- `npm run lint` run ESLint.
Tips: If native module mismatch occurs, run `npm run rebuild`.

## Coding Style & Naming Conventions
- TypeScript strict mode; 2-space indent; prefer small, typed props/state.
- ESLint: `@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh` (run `npm run lint`).
- Components: PascalCase files in `src/components/` (e.g., `TaskList.tsx`).
- Variables/functions: camelCase; types/interfaces: PascalCase; IPC channel ids: kebab-case strings.
- Do not use Node APIs in the renderer; go through `preload.ts` + IPC.

## Testing Guidelines
- No test suite yet. If adding tests, prefer Vitest + React Testing Library.
- Name files `*.test.ts(x)` near sources (e.g., `src/components/TaskList.test.tsx`).
- Keep fast, deterministic unit tests; add e2e later (Playwright) if needed.

## Commit & Pull Request Guidelines
- Current history is informal; use imperative present tense. New work: follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- PRs must include: clear description, linked issues, screenshots/GIFs for UI, platform(s) tested, any config changes, and steps to run (`npm run electron:dev`). Ensure `npm run lint` and `npm run build` pass.

## Security & Configuration Tips
- External tools required at runtime: `yt-dlp`, `ffmpeg`, `whisper`; optional: `ollama` for local LLMs (`node diagnose-ollama.js`).
- Secrets: set API keys in Settings (OpenAI/Claude); do not commit them.
- Electron is hardened (`contextIsolation: true`, `nodeIntegration: false`). Keep it that way.
- Data paths: DB at `~/.videoinsight/tasks.db`; temp files under OS temp dir.