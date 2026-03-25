## 1. Parallel descendant reload in handleToggle

- [x] 1.1 Add module-scoped generation counter variable in `FileTree.tsx`
- [x] 1.2 In `handleToggle`, when expanding: collect all descendant paths from `expandedPaths` using `startsWith(path + '/')`, fire `readDir` for `[path, ...descendants]` via `Promise.all`, sort results by depth, and apply `updateNodeChildren` top-down
- [x] 1.3 Add generation counter check after `Promise.all` resolves — discard results if generation has changed

## 2. FS watcher descendant reload

- [x] 2.1 In `use-fs-events.ts`, after `updateNodeChildren(parentDir, nodes)`, filter returned nodes to find directories whose paths are in `expandedPaths`
- [x] 2.2 Fire `readDir` for those expanded child directories in parallel via `Promise.all` and apply `updateNodeChildren` for each result

## 3. Manual testing

- [x] 3.1 Manual test: expand A → B → C, collapse A, re-expand A — verify B and C show ▼ with children visible
- [x] 3.2 Manual test: delete a file in a deeply nested expanded folder — verify no unexpected collapse and arrows remain correct
- [x] 3.3 Manual test: rapid expand-collapse-expand on a folder — verify no stale data or visual glitches
