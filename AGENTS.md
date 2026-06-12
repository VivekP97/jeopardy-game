# AGENTS.md — Jeopardy Game

Instructions for AI coding agents working in this repository.

## Project overview

Browser-based **Jeopardy-style party game** for 3–5 players. A human host reads questions aloud and judges answers. The app manages the board, buzzer flow, scoring, board editing, and save/resume.

| | |
|---|---|
| **Stack** | React 19, TypeScript 6, Vite 8 |
| **Package manager** | npm |
| **Persistence** | JSON files under `public/data/` via dev-server API (Phase 2+) |
| **Reference project** | Sibling `wheel-of-fortune-game` — reuse **patterns only**, not gameplay code |

Full game rules, JSON schemas, and acceptance criteria: [`docs/01-create-game/spec.md`](docs/01-create-game/spec.md).

## Commands

Run from the repository root:

```bash
npm install          # First-time setup
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Typecheck + production bundle — run after every phase
npm run lint         # ESLint
npm run preview      # Preview production build
```

**Do not run** `npm create vite@latest` — the scaffold already exists (Phase 0 is manual).

## How to work here

This project is built **one phase at a time**. Before writing code:

1. Read [`docs/01-create-game/spec.md`](docs/01-create-game/spec.md) fully.
2. Find the next unchecked phase in [`docs/01-create-game/progress.md`](docs/01-create-game/progress.md).
3. Create a **feature branch** for that phase — **never commit directly on `master`**.
4. Implement **only that phase** per [`docs/01-create-game/implementation-plan.md`](docs/01-create-game/implementation-plan.md).
5. Commit work on the feature branch in **reasonable chunks** as you go (no permission needed on feature branches).
6. Run phase validation (`npm run build` at minimum).
7. Update `progress.md` with checkmarks and a dated milestone note.
8. Stop unless the user requests the next phase.

See [`docs/agent/workflow.md`](docs/agent/workflow.md) for detailed workflow rules.

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
- **Dev file API** in `vite.config.ts` mirrors `wheel-of-fortune-game` (`GET/PUT /api/board`, `/api/saved-game`).

Details: [`docs/agent/architecture.md`](docs/agent/architecture.md).

## Coding standards (summary)

- Functional React components and hooks only; no class components.
- Strict TypeScript — no `any`; satisfy `noUnusedLocals` / `noUnusedParameters`.
- Use `type` imports where required (`verbatimModuleSyntax` is enabled).
- Prefer named exports for utilities; default export for page-level components is fine.
- Match existing file naming: `PascalCase.tsx` for components, `camelCase.ts` for modules.
- Keep CSS in `App.css` or colocated imports; Jeopardy blue/gold palette encouraged.
- Minimize scope — implement what the current phase requires, nothing ahead.

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

- Create a feature branch before starting each phase; commit on that branch without asking.
- Split phase work into logical commits as you go (not one giant commit at the end).
- Follow the phased plan and update `progress.md` when a phase completes.
- Run `npm run build` before finishing a task.
- Copy Vite JSON middleware and save/load patterns from `wheel-of-fortune-game`.
- Handle invalid JSON and corrupt saves with friendly UI errors.

**Do not**

- Work or commit directly on **`master`** — always use a feature branch.
- Skip phases or implement future features (Daily Double, sounds, timers, tests) unless explicitly requested.
- Add backend/database dependencies — v1 is static + dev-server file API only.
- Import React into `src/game/` or put game rules in components.
- Push to remote unless the user explicitly asks.
- Modify `package-lock.json` unless dependencies changed.
- Run destructive git commands (`reset --hard`, force push) without explicit user request.

## Validation checklist

Before marking a phase complete:

- [ ] `npm run build` passes with no TypeScript errors
- [ ] `npm run lint` passes (required from Phase 7 onward; run when ESLint is configured)
- [ ] Manual smoke test steps from the implementation plan pass
- [ ] `docs/01-create-game/progress.md` updated

## Supplementary docs

| File | Contents |
|------|----------|
| [`docs/agent/workflow.md`](docs/agent/workflow.md) | Phased development, progress tracking, when to stop |
| [`docs/agent/architecture.md`](docs/agent/architecture.md) | Module layout, engine/UI boundary, data flow |
| [`docs/agent/coding-standards.md`](docs/agent/coding-standards.md) | TypeScript, React, CSS, and file conventions |
| [`docs/agent/game-domain.md`](docs/agent/game-domain.md) | Gameplay rules, state machine, JSON schemas |
| [`docs/01-create-game/`](docs/01-create-game/) | Spec, implementation plan, progress checklist |
