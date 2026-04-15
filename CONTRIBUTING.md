# Contributing to Orqa Note

Thanks for your interest in contributing! Orqa Note is a small open-source project and contributions — bug reports, fixes, features, docs — are all welcome.

## Ground Rules

- Be respectful. Treat other contributors as collaborators, not adversaries.
- This is a side project maintained on best-effort. Reviews may take a few days.
- By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- macOS, Linux, or Windows (macOS is the primary dev target — see `pnpm build:mac`)

### Setup

```bash
git clone https://github.com/ariefrizkyr/orqa-note.git
cd orqa-note
pnpm install
pnpm dev
```

This launches the Electron app in dev mode with hot reload.

## Project Structure

Orqa Note is a pnpm monorepo. The main app lives at `apps/desktop`. See [AGENTS.md](./AGENTS.md) for a detailed architecture walkthrough (Electron process boundaries, IPC patterns, renderer state, etc.).

## Making Changes

### 1. Open an issue first (for non-trivial work)

Before sinking time into a large feature or refactor, open an issue to discuss the approach. This saves both of us from rework. Small bug fixes and typos can skip straight to a PR.

### 2. Branch from `main`

```bash
git checkout -b fix/short-description
# or feat/short-description, chore/short-description, docs/short-description
```

### 3. Write your change

- Follow existing code style — the repo uses TypeScript strict mode with no unused locals/params.
- Keep changes focused. Don't bundle unrelated cleanup into a feature PR.
- Add or update types in `apps/desktop/src/shared/types.ts` when changing IPC surface.
- If you're adding a new IPC channel, follow the `domain:action` naming convention.

### 4. Verify locally

```bash
pnpm typecheck    # must pass
pnpm build        # must succeed
pnpm dev          # smoke-test the UI change
```

For UI changes, actually use the feature in the running app — type checks verify code correctness, not feature correctness.

### 5. Commit

Use [Conventional Commits](https://www.conventionalcommits.org/) style:

- `feat: add PDF page thumbnails sidebar`
- `fix: prevent tab persistence race on workspace switch`
- `chore: bump electron to 33.2.0`
- `docs: clarify webview sandboxing in AGENTS.md`

Keep the subject ≤ 72 characters. Use the body to explain the **why**, not the what.

### 6. Open a pull request

- Target `main`.
- Describe the problem, the fix, and how you verified it.
- Include screenshots or short screen recordings for UI changes.
- Link the related issue (`Closes #123`).

## What Makes a Good PR

- ✅ Small and focused — one concern per PR.
- ✅ Passes `pnpm typecheck` and `pnpm build`.
- ✅ Includes reasoning for non-obvious decisions.
- ❌ Avoid drive-by refactors, dependency bumps, or reformatting unrelated files.
- ❌ No generated/build artifacts committed.

## Reporting Bugs

Open a GitHub issue with:

- Orqa Note version (see the About dialog or `package.json`).
- Operating system and version.
- Steps to reproduce.
- Expected vs. actual behavior.
- Relevant logs — on macOS, Electron logs to `~/Library/Logs/Orqa Note/`.

## Security Issues

**Do not** open a public issue for security vulnerabilities. See [SECURITY.md](./SECURITY.md) for how to report them privately.

## Questions

For general questions, open a [GitHub Discussion](https://github.com/ariefrizkyr/orqa-note/discussions) or issue. There is no Slack/Discord yet.

Thanks again for contributing! 🙌
