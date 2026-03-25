## ADDED Requirements

### Requirement: Eagerly reload expanded descendants on directory re-expand
When a directory is expanded via toggle and descendant paths exist in `expandedPaths`, the system SHALL fire `readDir` for all descendant paths in parallel and update their children in the store, sorted top-down by depth, so that arrow indicators and rendered children remain in sync.

#### Scenario: Re-expand parent with nested expanded children
- **WHEN** user collapses folder A (which had expanded children B and C) and then re-expands A
- **THEN** system loads children for A, B, and C in parallel, and all three folders render with ▼ arrows and their children visible

#### Scenario: Re-expand parent with no nested expanded children
- **WHEN** user collapses folder A (no subfolders were expanded) and re-expands A
- **THEN** system loads only A's children (no extra readDir calls) and A renders with ▼ arrow

#### Scenario: Top-down update ordering
- **WHEN** parallel readDir calls complete for paths at varying depths (e.g., A, A/B, A/B/C)
- **THEN** store updates are applied in order of ascending depth so that each updateNodeChildren can locate its parent in the tree

### Requirement: Generation counter prevents stale overwrites
The system SHALL use a generation counter that increments on every toggle call. After async readDir results return, the system SHALL discard results if the generation has changed since the toggle was initiated.

#### Scenario: Rapid expand-collapse-expand discards stale results
- **WHEN** user expands A, immediately collapses A, then expands A again before the first expand's readDir completes
- **THEN** the first expand's results are discarded and only the third expand's results are applied to the store

#### Scenario: Normal expand applies results
- **WHEN** user expands A and no other toggle occurs before readDir completes
- **THEN** the results are applied normally to the store

### Requirement: FS watcher reloads expanded subdirectories after refresh
When the FS watcher re-reads a directory and returns fresh child nodes, the system SHALL check if any returned directory nodes have paths in `expandedPaths`. If so, the system SHALL fire `readDir` for those directories in parallel and update their children in the store.

#### Scenario: Delete file in nested folder preserves parent expand state
- **WHEN** user deletes a file inside expanded folder C (nested under expanded B, under expanded A) and the FS watcher re-reads C's parent directory
- **THEN** any expanded sibling or child directories within the re-read result have their children reloaded, and all arrows remain consistent with rendered children

#### Scenario: FS watcher refresh with no expanded subdirectories
- **WHEN** the FS watcher re-reads a directory and none of the returned child directories are in `expandedPaths`
- **THEN** no additional readDir calls are made (zero overhead)
