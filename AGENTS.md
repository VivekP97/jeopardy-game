# AGENTS.md — Jeopardy Game

Instructions for AI coding agents working in this repository.

## Project overview

Browser-based **Jeopardy-style party game** for 3–5 players. A human host reads questions aloud and judges answers. The app manages the board, buzzer flow, scoring, board editing, and save/resume.

| | |
|---|---|
| **Stack** | React 19, TypeScript 6, Vite 8, Material UI (MUI) |
| **Package manager** | npm |
| **Persistence** | JSON files under `public/data/` via dev-server API |

**Agent onboarding:** [`docs/agent/codebase-map.md`](docs/agent/codebase-map.md) — screen flow, components, where to edit. Game rules: [`docs/agent/game-domain.md`](docs/agent/game-domain.md). Original build spec (historical): [`docs/01-create-game/spec.md`](docs/01-create-game/spec.md).

## Commands

Run from the repository root:

```bash
npm install          # First-time setup
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Typecheck + production bundle
npm run lint         # ESLint
npm run preview      # Preview production build
npm test             # Vitest (watch mode)
npm run test:run     # Vitest single run (CI)
npm run test:coverage # Vitest with coverage thresholds
```

**Do not run** `npm create vite@latest` — the scaffold already exists (Phase 0 is manual).

## How to work here

Before writing code:

1. Read [`docs/agent/codebase-map.md`](docs/agent/codebase-map.md) for structure and edit locations.
2. Read [`docs/agent/game-domain.md`](docs/agent/game-domain.md) if changing gameplay or buzz/scoring rules.
3. Create a **feature branch** for the task — **never commit directly on `master`**.
4. Run `npm run build` (and `npm run test:run` when touching engine, data, or tested UI).
5. Keep changes scoped to what was requested.

See [`docs/agent/workflow.md`](docs/agent/workflow.md) for branch/commit conventions. The phased build history in [`docs/01-create-game/`](docs/01-create-game/) is reference only unless the user asks to continue that plan.

## Git and commits

- **Never commit on `master`.** Before writing code, create a feature branch (e.g. `phase-2-data-layer`). If you are on `master`, switch to or create a branch first.
- **Commit on feature branches without asking.** Split work into reasonable chunks as you go; user permission is not required for feature-branch commits.
- **Do not push or merge to `master`** unless the user explicitly asks.

## Architecture (non-negotiable)

```
src/
  types/game.ts       # Shared types
  data/               # Fetch, validate, persist JSON (no React)
  game/               # Pure game engine — NO React imports
  components/         # React UI only
  App.tsx             # Navigation + orchestration
public/data/
  board.json          # Default 6×5 board
  saved-game.json     # Save slot
```

- **Game logic** lives in `src/game/engine.ts` as pure, immutable functions.
- **UI components** call engine functions; they do not embed scoring or buzz rules.
- **Data layer** validates JSON on load/save; never trust raw fetch results.
- **Dev file API** in `vite.config.ts` — `GET/PUT /api/board`, `GET/PUT /api/saved-game` (see [`docs/agent/architecture.md`](docs/agent/architecture.md)).
- **`PlayGameView`** holds `GameState` during play; **`App.tsx`** is navigation only.

Details: [`docs/agent/architecture.md`](docs/agent/architecture.md) and [`docs/agent/codebase-map.md`](docs/agent/codebase-map.md).

## Coding standards (summary)

- Functional React components and hooks only; no class components.
- Strict TypeScript — no `any`; satisfy `noUnusedLocals` / `noUnusedParameters`.
- Use `type` imports where required (`verbatimModuleSyntax` is enabled).
- Prefer named exports for utilities; default export for page-level components is fine.
- Match existing file naming: `PascalCase.tsx` for components, `camelCase.ts` for modules.
- Build UI with **Material UI** — use MUI components and a themed Jeopardy palette (`src/theme.ts`); avoid raw HTML styling.
- Minimize scope — implement what was requested, nothing extra.

Full conventions: [`docs/agent/coding-standards.md`](docs/agent/coding-standards.md).

## Game rules agents must not get wrong

These differ from TV Jeopardy and are easy to invert:

| Rule | Behavior |
|------|----------|
| Board display | Shows **questions**; players give **answers** |
| Incorrect answer | **No score penalty** — score never decreases |
| After incorrect | Reopen buzzers for **steal**; each player gets **one attempt per clue** |
| All players miss | Clue marked answered; **same selector** picks next clue |
| Correct answer | Add clue value; that player becomes next selector |
| Board size | 6 categories × 5 clues; values $200–$1000 by row |

Details: [`docs/agent/game-domain.md`](docs/agent/game-domain.md).

## Boundaries

**Do**

- Create a feature branch before starting work; commit on that branch when the user asks.
- Run `npm run build` before finishing a task.
- Run `npm run test:run` when changing game logic, data validation, or tested UI flows.
- Follow save/load and validation patterns in [`docs/agent/architecture.md`](docs/agent/architecture.md).
- Handle invalid JSON and corrupt saves with friendly UI errors.

**Do not**

- Work or commit directly on **`master`** — always use a feature branch.
- Implement out-of-scope features (Daily Double, sounds, answer timer) unless explicitly requested.
- Add backend/database dependencies — v1 is static + dev-server file API only.
- Import React into `src/game/` or put game rules in components.
- Push to remote unless the user explicitly asks.
- Modify `package-lock.json` unless dependencies changed.
- Run destructive git commands (`reset --hard`, force push) without explicit user request.

## Validation checklist

Before finishing a task:

- [ ] `npm run test:run` passes (when engine, data, or tested UI changed)
- [ ] `npm run build` passes with no TypeScript errors
- [ ] `npm run lint` passes when ESLint is configured

## Supplementary docs

| File | Contents |
|------|----------|
| [`docs/agent/codebase-map.md`](docs/agent/codebase-map.md) | **Start here** — screen flow, components, edit locations |
| [`docs/agent/workflow.md`](docs/agent/workflow.md) | Feature branches, commits, validation |
| [`docs/agent/architecture.md`](docs/agent/architecture.md) | Module layout, engine/UI boundary, data flow |
| [`docs/agent/coding-standards.md`](docs/agent/coding-standards.md) | TypeScript, React, Material UI, and file conventions |
| [`docs/agent/game-domain.md`](docs/agent/game-domain.md) | Gameplay rules, buzz/steal logic, JSON schemas |
| [`docs/01-create-game/`](docs/01-create-game/) | Historical spec, implementation plan, progress checklist |
