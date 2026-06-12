# Implementation Progress

Last updated: _not started_

## How to use

After completing a phase from [implementation-plan.md](./implementation-plan.md), check off its items below and add a dated note under **Milestone notes**.

---

## Phase 0 — Manual scaffold (user)

- [ ] Vite React-TS scaffold present in this repository
- [ ] `npm install` completed
- [ ] `npm run dev` runs successfully

---

## Phase 1 — Scaffold and app shell

- [ ] Sidebar navigation: Play Game, Manage Game
- [ ] Placeholder views switch correctly
- [ ] `npm run build` passes

---

## Phase 2 — Data layer and dev file API

- [ ] `vite.config.ts` JSON API for `/api/board` and `/api/saved-game`
- [ ] Types in `src/types/game.ts`
- [ ] `loadBoard.ts` with validation
- [ ] Seed `public/data/board.json` (6×5 sample)
- [ ] Seed `public/data/saved-game.json`
- [ ] Play view loads board
- [ ] `npm run build` passes

---

## Phase 3 — Game engine

- [ ] `createGame`, `selectClue`, `openBuzz`, `buzz`, `judgeAnswer`
- [ ] Scoring: correct adds value; incorrect enables steal (no penalties)
- [ ] Selector / buzz / attempt rules
- [ ] `isGameComplete` and winner helpers
- [ ] `npm run build` passes

---

## Phase 4 — Play UI

- [ ] Setup form (3–5 players, names)
- [ ] Jeopardy board grid
- [ ] Clue panel (question, reveal, judge)
- [ ] Buzz panel
- [ ] Scoreboard
- [ ] Game complete / winner screen
- [ ] Full manual playthrough works
- [ ] `npm run build` passes

---

## Phase 5 — Manage Game

- [ ] Board editor UI
- [ ] Validation on save
- [ ] Persist to `public/data/board.json`
- [ ] `npm run build` passes

---

## Phase 6 — Save and resume

- [ ] `savedGame.ts` parse/save/load
- [ ] Save & menu during play
- [ ] Continue saved game on menu
- [ ] Resume restores in-progress clue/buzz state
- [ ] `npm run build` passes

---

## Phase 7 — Polish and docs

- [ ] Responsive board layout
- [ ] Error/empty states
- [ ] Root `README.md`
- [ ] All progress items above checked
- [ ] `npm run build` and `npm run lint` pass

---

## Milestone notes

_Add dated notes here as phases complete._

<!-- Example:
### 2026-06-11 — Phase 1 complete
- App shell with sidebar; build passes.
-->

## Deferred / future

- [ ] Daily Double
- [ ] Sound effects
- [ ] Automated unit tests
- [ ] Answer timer
