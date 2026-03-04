## ADDED Requirements

### Requirement: WebContentsView for bookmark tabs
Bookmark tabs (`.orqa` files) SHALL render using Electron `WebContentsView` instances in the main process. Each bookmark gets its own WebContentsView created on first open and cached in memory.

#### Scenario: Open bookmark tab
- **WHEN** user clicks a `.orqa` bookmark file in the sidebar
- **THEN** system creates a WebContentsView loading the bookmark URL, positioned over the content area

#### Scenario: Switch between bookmark tabs
- **WHEN** user switches from one bookmark tab to another
- **THEN** system hides the current WebContentsView and shows the target one (no reload)

#### Scenario: Switch from bookmark to file tab
- **WHEN** user switches from a bookmark tab to a file tab
- **THEN** system hides the active WebContentsView, revealing the React-rendered content area

#### Scenario: Close bookmark tab
- **WHEN** user closes a bookmark tab
- **THEN** system destroys the associated WebContentsView and frees memory

### Requirement: Session persistence
WebContentsView sessions SHALL persist across app restarts using Electron session partitions (`persist:orqa-<workspace-hash>`), so users remain logged into Google/Figma without re-authenticating.

#### Scenario: Login persists across restart
- **WHEN** user logs into Google Sheets in a bookmark tab, closes the app, and relaunches
- **THEN** the bookmark tab restores with the user still logged in

#### Scenario: Workspace isolation
- **WHEN** user has two workspaces each with Google Docs bookmarks
- **THEN** each workspace uses a separate session partition so logins are independent

### Requirement: WebContentsView security
All WebContentsView instances SHALL have `nodeIntegration` disabled and `contextIsolation` enabled. No preload scripts shall be injected into bookmark webviews.

#### Scenario: Security configuration
- **WHEN** system creates a WebContentsView for a bookmark
- **THEN** the view has `nodeIntegration: false`, `contextIsolation: true`, and no custom preload script

### Requirement: WebContentsView resize handling
WebContentsView bounds SHALL update when the app window is resized or the sidebar width changes, keeping the view aligned with the content area.

#### Scenario: Window resize
- **WHEN** user resizes the application window
- **THEN** the active WebContentsView bounds update to match the new content area dimensions

#### Scenario: Sidebar resize
- **WHEN** user drags the sidebar resize handle
- **THEN** the active WebContentsView bounds update to account for the new sidebar width
