## 1. Build Configuration & Dependencies

- [x] 1.1 Add `electron-updater` dependency to `apps/desktop/package.json`
- [x] 1.2 Add `zip` target alongside `dmg` in `electron-builder.yml` mac targets
- [x] 1.3 Add `publish` provider config (github) to `electron-builder.yml`

## 2. Main Process Auto-Updater Service

- [x] 2.1 Create `src/main/services/auto-updater.ts` — initialize `autoUpdater` with `autoDownload: false`, set up event listeners for `update-available`, `update-not-available`, `download-progress`, `update-downloaded`, and `error`
- [x] 2.2 Broadcast update status events to all windows via `updater:status` IPC channel
- [x] 2.3 Add delayed background check (10s after app ready)

## 3. IPC Handlers for Updater

- [x] 3.1 Create `src/main/ipc/updater-handlers.ts` — register `updater:check`, `updater:download`, `updater:install` IPC handles
- [x] 3.2 Register updater handlers in `src/main/index.ts`

## 4. App Menu — Check for Updates

- [x] 4.1 Replace `{ role: 'appMenu' }` with a custom app submenu in `src/main/services/app-menu.ts` that includes About, Check for Updates..., separator, Preferences, Services, Hide/Show/Quit
- [x] 4.2 Wire "Check for Updates..." click to trigger the auto-updater check

## 5. Preload Bridge

- [x] 5.1 Add `updater` namespace to preload context bridge with `check()`, `download()`, `install()`, and `onStatus(callback)` methods
- [x] 5.2 Add `UpdateStatus` type and `updater` property to `ElectronAPI` in `src/shared/types.ts`

## 6. Renderer — Update Toast UI

- [x] 6.1 Create Zustand update store (`src/renderer/stores/update-store.ts`) to track update status, version, progress, and toast visibility
- [x] 6.2 Create `UpdateToast` component (`src/renderer/components/update/UpdateToast.tsx`) — bottom-right positioned toast with states: available (Download/Later), downloading (progress bar), downloaded (Restart Now/Later), up-to-date (auto-dismiss), error (auto-dismiss)
- [x] 6.3 Wire `UpdateToast` to listen for `updater:status` events via the preload bridge and update the store
- [x] 6.4 Add `UpdateToast` to App.tsx layout (rendered in both workspace and welcome views)
