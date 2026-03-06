## 1. Setup

- [x] 1.1 Install `prosemirror-search` dependency in `packages/editor`
- [x] 1.2 Verify `prosemirror-search` imports work through Milkdown's ProseMirror re-exports

## 2. ProseMirror Search Plugin

- [x] 2.1 Create `packages/editor/src/editor/find-plugin.ts` — wrap `prosemirror-search` into a Milkdown-compatible plugin using `$prose`
- [x] 2.2 Configure the plugin with decoration styles for active and inactive match highlights
- [x] 2.3 Add keymap bindings: Cmd+F (open find), Cmd+H (open find+replace), Escape (close)
- [ ] 2.4 Register the plugin in OrqaEditor's `.use()` chain

## 3. FindBar React Component

- [x] 3.1 Create `packages/editor/src/editor/FindBar.tsx` — floating overlay UI with search input, match counter, prev/next buttons, case toggle, regex toggle, close button
- [x] 3.2 Add replace row with replace input, Replace button, and Replace All button (expandable/collapsible)
- [x] 3.3 Style the FindBar to match the app's dark theme (positioned top-right, no layout displacement)

## 4. Plugin–React Integration

- [x] 4.1 Wire FindBar inputs to dispatch ProseMirror search transactions (query, case sensitivity, regex flags)
- [x] 4.2 Wire prev/next buttons to `findNext`/`findPrev` commands from `prosemirror-search`
- [x] 4.3 Wire Replace/Replace All buttons to `replaceNext`/`replaceAll` commands
- [x] 4.4 Read match count and active match index from plugin state to display in FindBar
- [x] 4.5 Handle Escape to close FindBar, clear decorations, and return focus to editor
- [x] 4.6 Handle Enter/Shift+Enter in search input for next/prev navigation

## 5. Editor Handle Extension

- [ ] 5.1 Add `openFind()` method to `OrqaEditorHandle` interface and implementation
- [ ] 5.2 Export updated types from `packages/editor/src/index.ts`

## 6. Testing & Polish

- [ ] 6.1 Test find/replace across formatted text (bold, italic, links, code) — verify marks are preserved on replace
- [ ] 6.2 Test regex mode including invalid regex patterns (no crash)
- [ ] 6.3 Test Cmd+F doesn't conflict with Monaco when code editor is active
- [ ] 6.4 Test large document performance (search responsiveness)
- [ ] 6.5 Verify Escape properly cleans up decorations and state
