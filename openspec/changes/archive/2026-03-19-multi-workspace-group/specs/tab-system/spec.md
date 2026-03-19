## MODIFIED Requirements

### Requirement: Tab persistence
Open tabs and their order SHALL be persisted to `userData/workspaces/<folder-hash>/workspace-state.json` and restored on workspace activation (either on app launch or workspace switch within a group). Sidebar width is NOT included in per-workspace state — it is persisted globally.

#### Scenario: App restart with tabs
- **WHEN** user closes the app with 3 tabs open and relaunches
- **THEN** system restores all 3 tabs in the same order with the same active tab

#### Scenario: Persisted file missing
- **WHEN** a persisted tab references a file that no longer exists on disk
- **THEN** system shows a "File not found" state in that tab with option to close

#### Scenario: Debounced persistence
- **WHEN** user opens or closes tabs rapidly
- **THEN** system debounces save operations at 1-second intervals to avoid excessive disk writes

#### Scenario: Backward compatibility with tabs.json
- **WHEN** `workspace-state.json` does not exist but `tabs.json` does
- **THEN** system reads tab state from `tabs.json` as a fallback

#### Scenario: Workspace switch preserves tabs
- **WHEN** user switches from workspace A to workspace B within a group
- **THEN** workspace A's tabs are saved, workspace B's tabs are restored, and no tabs are lost
