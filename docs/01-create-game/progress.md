# Implementation Progress

Last updated: 2026-06-11

## How to use

After completing a phase from [implementation-plan.md](./implementation-plan.md), check off its items below and add a dated note under **Milestone notes**.

---

## Phase 0 — Manual scaffold (user)

- [x] Vite React-TS scaffold present in this repository
- [x] `npm install` completed
- [x] `npm run dev` runs successfully

---

## Phase 1 — Scaffold and app shell

- [x] Material UI installed (`@mui/material`, Emotion peers)
- [x] `src/theme.ts` with Jeopardy-inspired palette; `ThemeProvider` + `CssBaseline` in `main.tsx`
- [x] Sidebar navigation: Play Game, Manage Game (MUI layout)
- [x] Placeholder views switch correctly
- [x] `npm run build` passes

---

## Phase 2 — Data layer and dev file API

- [x] `vite.config.ts` JSON API for `/api/board` and `/api/saved-game`
- [x] Types in `src/types/game.ts`
- [x] `loadBoard.ts` with validation
- [x] Seed `public/data/board.json` (6×5 sample)
- [x] Seed `public/data/saved-game.json`
- [x] Play view loads board
- [x] `npm run build` passes

---

## Phase 3 — Game engine

- [x] `createGame`, `selectClue`, `openBuzz`, `buzz`, `judgeAnswer`
- [x] Scoring: correct adds value; incorrect enables steal (no penalties)
- [x] Selector / buzz / attempt rules
- [x] `isGameComplete` and winner helpers
- [x] `npm run build` passes

---

## Phase 4 — Play UI

- [x] Setup form (3–5 players, names)
- [x] Jeopardy board grid
- [x] Clue panel (question, reveal, judge)
- [x] Buzz panel
- [x] Scoreboard
- [x] Game complete / winner screen
- [x] Play UI built with Material UI components
- [x] Full manual playthrough works
- [x] `npm run build` passes

---

## Phase 5 — Manage Game

- [x] Board editor UI
- [x] Validation on save
- [x] Persist to `public/data/board.json`
- [x] `npm run build` passes

---

## Phase 6 — Save and resume

- [x] `savedGame.ts` parse/save/load
- [x] Save & menu during play
- [x] Continue saved game on menu
- [x] Resume restores in-progress clue/buzz state
- [x] `npm run build` passes

---

## Phase 7 — Polish and docs

- [ ] Responsive board layout (MUI breakpoints)
- [ ] Polished, cohesive MUI theme across all views
- [ ] Error/empty states
- [ ] Root `README.md`
- [ ] All progress items above checked
- [ ] `npm run build` and `npm run lint` pass

---

## Milestone notes

_Add dated notes here as phases complete._

### 2026-06-11 — Phase 6 complete
- `savedGame.ts`: validate, load/save via `/api/saved-game`, `gameStateToSavedPayload` / `savedPayloadToGameState`.
- Play UI: **Save & menu** during play; setup menu **Continue saved game** (with `savedAt`) and **Abandon save**; `resumeGameFromSave` restores full in-progress state.

### 2026-06-11 — Phase 5 complete
- `ManageGameView` board editor: category titles, clue questions/answers, fixed row values.
- `saveBoard.ts` validates and persists via `PUT /api/board`; Play view reloads board on save.

### 2026-06-11 — Phase 4 complete
- Play UI components: `GameSetupForm`, `JeopardyBoard`, `CluePanel`, `BuzzPanel`, `Scoreboard`, `GameComplete`.
- `PlayGameView` orchestrates setup → play → complete; wires engine transitions (select clue, open buzz, buzz, judge).

### 2026-06-11 — Phase 3 complete
- Pure game engine in `src/game/engine.ts` (createGame, selectClue, openBuzz, buzz, judgeAnswer).
- Board helpers in `src/game/board.ts` (remaining clues, isGameComplete, getWinnerIndices); immutable state, no React.

### 2026-06-11 — Phase 2 complete
- Dev-server JSON API for board and saved-game files; typed validation in `loadBoard.ts`.
- Seeded 6×5 sample board; Play Game view loads and displays categories or a friendly error.

### 2026-06-11 — Phase 1 complete
- Material UI installed with Jeopardy-themed palette in `src/theme.ts`.
- App shell with permanent sidebar (Play Game / Manage Game) and placeholder views; build passes.

## Deferred / future

- [ ] Daily Double
- [ ] Sound effects
- [ ] Automated unit tests
- [ ] Answer timer
