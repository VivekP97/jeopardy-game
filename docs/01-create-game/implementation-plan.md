# Implementation Plan

## Stack

- Vite + React + TypeScript
- Pure game engine in `src/game/engine.ts` (no React imports)
- JSON under `public/data/`
- Dev-only file API in `vite.config.ts` (mirror `wheel-of-fortune-game`)

## Target module layout

```
jeopardy-game/
  public/data/
    board.json              # Default 6×5 board
    saved-game.json         # Save slot
  src/
    types/
      game.ts               # Player, Clue, Category, Board, GameState, BuzzState
    data/
      loadBoard.ts          # Fetch + validate board.json
      saveBoard.ts          # PUT board via /api/board
      savedGame.ts          # Save/load/validate saved-game.json
    game/
      engine.ts             # createGame, selectClue, openBuzz, buzz, judgeAnswer, etc.
      board.ts              # Selectors: remaining clues, isGameComplete, etc.
    components/
      GameSetupForm.tsx     # Player count + names
      JeopardyBoard.tsx     # 6×5 grid
      CluePanel.tsx         # Question, answer reveal, judge buttons
      BuzzPanel.tsx         # Per-player buzz buttons
      Scoreboard.tsx        # Player scores + current selector highlight
      GameComplete.tsx      # Final standings
      ManageGameView.tsx    # Board editor
    App.tsx                 # Navigation + orchestration
    App.css
  vite.config.ts            # /api/board, /api/saved-game middleware
  docs/01-create-game/      # This planning folder
```

## Phases

Each phase should end with `npm run build` passing (where applicable) and manual smoke test steps listed below.

---

### Phase 1 — Scaffold and app shell

**Prerequisite:** User ran Phase 0 scaffold commands from [README.md](./README.md).

**Tasks**

1. Confirm `jeopardy-game` Vite React-TS project runs (`npm run dev`).
2. Add base layout in `App.tsx`:
   - Sidebar: **Play Game**, **Manage Game**
   - Placeholder content for each view
3. Add minimal `App.css` (Jeopardy-like blue/gold palette optional but encouraged).
4. Copy planning docs into `docs/01-create-game/` if not already present.

**Validation**

- `npm run build`
- Sidebar switches views without errors

---

### Phase 2 — Data layer and dev file API

**Tasks**

1. Add `vite.config.ts` plugin with reusable JSON middleware (copy from `wheel-of-fortune-game`):
   - `GET/PUT /api/board` → `public/data/board.json`
   - `GET/PUT /api/saved-game` → `public/data/saved-game.json`
2. Define types in `src/types/game.ts`.
3. Implement `loadBoard.ts` with validation (6 categories, 5 clues each, unique ids).
4. Seed `public/data/board.json` with sample content (6 categories × 5 clues).
5. Seed `public/data/saved-game.json` as `{ "savedGame": null }`.
6. Play view loads board on mount; show error if invalid.

**Validation**

- `npm run build`
- Dev server: board loads; invalid JSON shows friendly error
- Manual: PUT via Manage Game not required yet

---

### Phase 3 — Game engine (pure logic)

**Tasks**

1. Implement `src/game/engine.ts`:
   - `createGame(config, board)` → initial `GameState`
   - `selectClue(state, clueId)` — only unanswered; sets active clue, resets buzz
   - `openBuzz(state)` — enable buzzing for active clue
   - `buzz(state, playerIndex)` — first buzz wins; ignore if not open or already attempted
   - `judgeAnswer(state, correct: boolean)` — score update, clue resolution, selector change
   - `getWinnerIndices(state)` — for completion
2. Implement `src/game/board.ts` helpers:
   - Count remaining clues
   - `isGameComplete(state)`
3. Unit-testable: no side effects, immutable state returns.

**Scoring rules (engine)**

- Correct: `score += value`; that player becomes the next selector
- Incorrect: **no score change**; mark player as attempted; reopen buzz for **steal** (`isSteal: true`) if any unattempted players remain
- Steal: same buzz flow as initial ring-in, but only players not in `attemptedPlayerIndices` may buzz
- All players wrong on a clue: mark answered, no score changes, selector unchanged

**Validation**

- `npm run build`
- Optional: temporary `console.log` tests in App or a small script; formal tests not required in v1

---

### Phase 4 — Play UI (setup + board + buzz + judge)

**Tasks**

1. `GameSetupForm.tsx` — player count 3–5, dynamic name fields, Start Game.
2. `JeopardyBoard.tsx` — 6 columns, 5 rows; hide/disable answered cells; highlight selector's pick phase.
3. `CluePanel.tsx` — show question; **Reveal answer**; **Correct** / **Incorrect** (enabled only when someone has buzzed).
4. `BuzzPanel.tsx` — one button per player; disabled when not buzzing, already buzzed, or already attempted this clue. Show **Steal!** state when `buzzState.isSteal` is true.
5. `Scoreboard.tsx` — names, scores, indicator for current selector and who buzzed.
6. Wire in `App.tsx`:
   - Setup → `createGame` → playing view
   - **Open buzzers** host action after clue selected
   - Flow through engine functions
   - Transition to `GameComplete` when `isGameComplete`

**Validation**

- Play full sample board with 3 players in browser
- Correct answers add points; incorrect answers leave scores unchanged
- Second player can steal after first misses (buzz reopens)
- Game completes with winner display

---

### Phase 5 — Manage Game (board editor)

**Tasks**

1. `ManageGameView.tsx` modeled on `wheel-of-fortune-game/src/components/ManageGameView.tsx`:
   - Edit category titles
   - Edit each clue: question, answer (values fixed by row or read-only 200–1000)
   - Add/remove not required if board size is fixed at 6×5; focus on edit-in-place
   - Client validation + error messages
   - Save → `PUT /api/board`
   - Reset discards draft
2. Refresh Play view when returning from Manage (reload board).

**Validation**

- Edit a clue in UI, save, refresh app, see changes on new game
- Validation blocks empty questions/answers or duplicate ids

---

### Phase 6 — Save and resume

**Tasks**

1. `src/data/savedGame.ts`:
   - `SavedGamePayload` type, parse/validate (mirror WOF `savedGame.ts` style)
   - `gameStateToSavedPayload` / `savedPayloadToGameState`
   - `loadSavedGameFile` / `saveSavedGameFile`
2. Engine: `resumeGameFromSave(payload)` if needed for reconstruction.
3. Play UI:
   - **Save & menu** during active game
   - Main menu **Continue saved game** when valid save exists (show `savedAt`)
   - **Abandon save** optional (clear slot)
4. On continue, restore full state including in-progress clue and buzz state.

**Validation**

- Mid-game save → return to menu → continue → state matches
- Complete game → save not offered or overwrites with complete state
- Corrupt save → graceful error, no crash

---

### Phase 7 — Polish, README, and progress finalization

**Tasks**

1. Responsive layout for board (scroll or scale on narrow screens).
2. Empty/error states: no board file, incomplete board, save errors.
3. Project `README.md` at repo root (quick start, how to play, data files table — mirror WOF README structure).
4. Update [progress.md](./progress.md) — all items checked.
5. Final `npm run build` and lint.

**Validation**

- Clean playthrough documented in README
- All progress checklist items marked done

---

## Validation strategy (ongoing)

| Check | When |
|-------|------|
| `npm run build` | Every phase |
| Manual browser test | Phases 4–7 |
| Edit JSON on disk | Phase 2+ |

## Future enhancements (not in initial phases)

- Daily Double cells with wager dialog
- Countdown timer for answers
- Sound effects (`react-sounds` + `sound-settings.json`)
- Import/export board as downloadable file
- Automated unit tests for `engine.ts`
- Category list file (`categories.json`) for Manage Game dropdowns

## Reference files in wheel-of-fortune-game

| Concern | Reference path |
|---------|----------------|
| Vite JSON API | `vite.config.ts` |
| Save/load | `src/data/savedGame.ts` |
| Manage UI | `src/components/ManageGameView.tsx` |
| App navigation | `src/App.tsx` (first ~200 lines) |
| Docs style | `docs/spec.md`, `docs/progress.md`, `README.md` |
