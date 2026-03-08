## Why

The `.orqa` extension is used exclusively for bookmark files but doesn't describe its purpose. Renaming to `.orqlnk` makes the file type self-explanatory (it's a link) while keeping brand identity. This also frees up `.orqa` for potential future use as a generic Orqa document format.

## What Changes

- **BREAKING**: Rename bookmark file extension from `.orqa` to `.orqlnk`
- Update all file creation paths to produce `.orqlnk` files
- Update file type detection, icons, and routing logic
- Update sidebar bookmark metadata loading to match `.orqlnk`
- Existing `.orqa` files in user workspaces will no longer be recognized as bookmarks

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `bookmark-files`: File extension changes from `.orqa` to `.orqlnk` across all requirements (file format, sidebar display, creation, and toolbar)

## Impact

- **Renderer components**: `FileTree.tsx`, `Tab.tsx`, `ContentArea.tsx`, `Sidebar.tsx`, `NewTabScreen.tsx`, `file-utils.ts`
- **Specs**: `openspec/specs/bookmark-files/spec.md` needs updated extension references
- **Docs**: `README.md` references to `.orqa`
- **No API or dependency changes**
- **User impact**: Existing `.orqa` bookmark files in workspaces will need to be renamed manually or via a migration
