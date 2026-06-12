# Jeopardy Game — Agent Build Guide

This folder contains the phased plan for building a browser-based Jeopardy-style party game. The plan is designed for an AI agent to implement **one phase at a time**, validating each phase before moving on.

## Reference project

Use the sibling **`wheel-of-fortune-game`** project as the architectural reference for:

- React + TypeScript + Vite layout
- `public/data/` JSON storage
- Dev-server file API in `vite.config.ts` (GET/PUT middleware for JSON files)
- Left-sidebar navigation (**Play Game**, **Manage Game**)
- Save & continue via `public/data/saved-game.json`
- Pure game logic in `src/game/` separate from UI components

Do **not** copy Wheel of Fortune gameplay code. Reuse patterns and file structure only.

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

## Project location

Create the app in a **`jeopardy-game`** folder alongside `wheel-of-fortune-game`:

```
Wheel of Fortune/
  wheel-of-fortune-game/
  jeopardy-game/          ← new app lives here
    docs/01-create-game/    ← this planning folder
    public/data/
    src/
    ...
```

## Phase 0 — Manual scaffold (user runs this)

`npm create vite@latest` is **interactive** and often fails when run by agents. **The user should run these commands once** before Phase 1:

```bash
cd "c:\Users\Vivek\Documents\Coding Projects\Wheel of Fortune"
npm create vite@latest jeopardy-game -- --template react-ts
cd jeopardy-game
npm install
npm run dev
```

Confirm the dev server starts (usually `http://localhost:5173`), then tell the agent to begin **Phase 1**.

### Non-interactive alternatives

If the command above prompts anyway, use:

```bash
npm create vite@latest . -- --template react-ts
```

…from an empty `jeopardy-game` directory the user creates manually.

## Quick validation commands (all phases)

```bash
npm run build    # Typecheck + production bundle
npm run dev      # Local play with file persistence API (after Phase 2+)
npm run lint     # ESLint (after scaffold)
```

## Out of scope for initial build

See **spec.md** — Daily Double, Double Jeopardy, Final Jeopardy, sound effects, and automated tests are deferred unless a later phase explicitly adds them.
