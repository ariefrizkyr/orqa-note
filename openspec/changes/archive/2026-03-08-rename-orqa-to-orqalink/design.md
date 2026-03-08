## Context

Bookmark files currently use the `.orqa` extension. This is a straightforward rename to `.orqlnk` across all references in the codebase. The change is purely cosmetic — no logic, data model, or architecture changes.

## Goals / Non-Goals

**Goals:**
- Replace all `.orqa` file extension references with `.orqlnk` in application code
- Update specs and documentation to reflect the new extension

**Non-Goals:**
- Auto-migration of existing `.orqa` files in user workspaces
- Backward compatibility (supporting both extensions simultaneously)
- Changing the bookmark JSON schema or behavior

## Decisions

### Decision: No backward compatibility layer
**Choice**: Only support `.orqlnk`, drop `.orqa` recognition entirely.
**Rationale**: The app is pre-release (v0.1.0) with no public users. Adding dual-extension support adds complexity for no benefit.
**Alternative considered**: Supporting both extensions with a deprecation warning — unnecessary at this stage.

### Decision: No auto-migration
**Choice**: Users must rename existing `.orqa` files manually.
**Rationale**: Pre-release with minimal user base. A migration script adds scope for a simple rename.

## Risks / Trade-offs

- [Risk] Developer's own workspace has `.orqa` files that stop working → Manually rename a few files, low effort
