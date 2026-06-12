# Jeopardy Game — Agent Build Guide

This folder contains the phased plan for building a browser-based Jeopardy-style party game. The plan is designed for an AI agent to implement **one phase at a time**, validating each phase before moving on.

## Reference patterns

This app follows the same general architecture as other local party-game web apps built with React + Vite:

- React + TypeScript + Vite layout
- **Material UI** for components, layout, and theming
- `public/data/` JSON storage
- Dev-server file API in `vite.config.ts` (GET/PUT middleware for JSON files)
- Left-sidebar navigation (**Play Game**, **Manage Game**)
- Save & continue via `public/data/saved-game.json`
- Pure game logic in `src/game/` separate from UI components

See [`docs/agent/architecture.md`](../agent/architecture.md) for how these pieces fit together in **this repository**. Do not copy gameplay from other projects — reuse file-structure and persistence patterns only.

## Documents in this folder

| File | Purpose |
|------|---------|
| [spec.md](./spec.md) | Game rules, scope, JSON schemas, acceptance criteria |
| [implementation-plan.md](./implementation-plan.md) | Module layout and phased build order |
| [progress.md](./progress.md) | Checklist — update after each phase |

## How an agent should work

1. Read **spec.md** fully before writing code.
2. Open **implementation-plan.md** and find the **next unchecked phase** in [progress.md](./progress.md).
3. Implement **only that phase**. Do not skip ahead.
4. Run validation for the phase (see plan).
5. Mark the phase complete in **progress.md** with date and brief notes.
6. Stop and wait for the user to request the next phase (unless the user asked for multiple phases).

## Repository layout

All paths in these docs are relative to **this repository root**:

```
docs/
  01-create-game/       # This planning folder
  agent/                # Agent guidance (AGENTS.md supplements)
public/
  data/                 # Persisted JSON (Phase 2+)
src/                    # Application source
vite.config.ts
package.json
AGENTS.md
```

Run `npm install`, `npm run dev`, and `npm run build` from the repository root.

## Phase 0 — Scaffold (complete)

The Vite React-TS scaffold should already exist in this repo. Before Phase 1, confirm:

```bash
npm install
npm run dev
```

The dev server should start (usually `http://localhost:5173`). If setting up a fresh clone, run the commands above from the repository root — do not scaffold into a parent folder or a nested subfolder.

### If the repo has no source yet

Only if this repository is empty, scaffold in place from the root:

```bash
npm create vite@latest . -- --template react-ts
npm install
npm run dev
```

`npm create vite@latest` is interactive and may fail when run by agents; prefer a human running it once if needed.

## Quick validation commands (all phases)

```bash
npm run build    # Typecheck + production bundle
npm run dev      # Local play with file persistence API (after Phase 2+)
npm run lint     # ESLint (after scaffold)
```

## Out of scope for initial build

See **spec.md** — Daily Double, Double Jeopardy, Final Jeopardy, sound effects, and automated tests are deferred unless a later phase explicitly adds them.
