## Context

Orqa Note is an Electron 33 desktop app built with electron-builder 25, distributed as a signed and notarized macOS DMG. The app has a clear main/preload/renderer separation with namespaced IPC channels. There is currently no update mechanism — users must manually discover and download new versions.

The app uses `{ role: 'appMenu' }` for the macOS application menu, which provides the standard About/Hide/Quit items but doesn't allow custom entries like "Check for Updates...".

## Goals / Non-Goals

**Goals:**
- Users are notified of new versions without leaving the app
- Users can manually check for updates via the app menu
- Updates are downloaded in-background and installed on next restart
- The update flow is non-intrusive (toast notification, not a modal dialog)

**Non-Goals:**
- Windows/Linux auto-update (macOS only for now)
- Delta/differential updates
- Silent auto-install without user consent
- Update channels (beta/stable)
- In-app changelog display

## Decisions

### 1. Use `electron-updater` with GitHub Releases

**Choice:** `electron-updater` (part of electron-builder ecosystem)
**Over:** Custom update check against a manifest endpoint, or Sparkle framework

**Rationale:** electron-updater integrates directly with the existing electron-builder setup, supports GitHub Releases natively, handles code signature verification, and manages the full download-and-replace lifecycle. No additional server infrastructure needed.

### 2. Set `autoDownload: false`, user-initiated download

**Choice:** Notify first, download only when user clicks "Download"
**Over:** Auto-download in background

**Rationale:** Respects user bandwidth and agency. The toast shows "New version available" with a Download button. After download completes, a second toast offers "Restart Now" or "Later".

### 3. Custom app menu replacing `{ role: 'appMenu' }`

**Choice:** Build the Orqa app submenu manually to insert "Check for Updates..."
**Over:** Keeping `{ role: 'appMenu' }` (which doesn't allow custom items)

**Rationale:** The standard appMenu role auto-generates menu items but doesn't allow inserting custom entries. We need to manually construct the submenu with: About → Check for Updates → separator → Services → separator → Hide/HideOthers/Unhide → separator → Quit. This preserves the native macOS feel while adding the update check option.

### 4. Add ZIP target alongside DMG

**Choice:** Build both `dmg` and `zip` targets for macOS
**Over:** ZIP only

**Rationale:** electron-updater on macOS requires a ZIP artifact to extract the updated app. DMG is kept for the manual download experience. Both are uploaded to GitHub Releases.

### 5. Update state communicated via IPC events

**Choice:** Main process sends update status events to all windows via `updater:status` channel; renderer sends commands via `updater:check`, `updater:download`, `updater:install` invoke channels.
**Over:** Shared state via file or electron-store

**Rationale:** Follows the existing IPC pattern used by `fsWatch` (events pushed to renderer). Keeps main process as the single source of truth for update state.

### 6. Toast component in renderer (not native notification)

**Choice:** In-app toast component at bottom-right of the window
**Over:** macOS native Notification Center

**Rationale:** In-app toast provides richer UX (progress bar, action buttons) and doesn't require notification permissions. It stays visible within the app context where the user can act on it immediately.

## Risks / Trade-offs

- **[Risk] GitHub API rate limits for unauthenticated requests** → electron-updater uses the GitHub Releases API. For public repos this is fine. For private repos, a `GH_TOKEN` would be needed at build time. Mitigation: keep the repo public, or set token in CI.
- **[Risk] Update check fails silently on network issues** → Mitigation: Manual "Check for Updates" will show an error toast. Background checks fail silently (acceptable — user isn't expecting a result).
- **[Trade-off] Custom app menu maintenance** → We lose automatic menu generation from `{ role: 'appMenu' }` and must maintain the submenu items manually. This is a small cost for the customization benefit.
- **[Trade-off] ZIP increases release artifact size** → Both DMG and ZIP are published. ZIP is ~same size as DMG. Acceptable for the auto-update capability.
