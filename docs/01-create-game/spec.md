# Jeopardy Game Spec

## Purpose

Create a local web app for hosting a single-round Jeopardy-style quiz board for 3–5 players. The app manages the board, turn/buzzer flow, and scoring. A human host reads questions aloud and judges answers (with optional reveal of the stored answer).

## Inspiration vs. this version

Traditional [Jeopardy!](https://en.wikipedia.org/wiki/Jeopardy!) displays **answers** (clues) and contestants respond in **question form** ("Who is…?", "What is…?"). This app **simplifies** that:

| TV Jeopardy | This app |
|-------------|----------|
| Clue is an "answer"; contestant gives a "question" | Board shows a **question**; contestant gives the **answer** |
| Jeopardy + Double Jeopardy + Final Jeopardy | **Single round** only |
| 3 contestants | **3–5** contestants |
| Studio buzzer hardware | In-app **buzz** buttons (one per player) |

Everything else follows familiar Jeopardy flow: category grid, dollar values, pick-a-clue, ring in, correct adds points, incorrect opens a **steal** for other players (no penalty), board clears → game over → highest score wins.

## Core requirements

- **Stack:** React + Vite + TypeScript, runnable locally.
- **Players:** 3–5, each with a display name; configured on a setup form before play.
- **Board:** One round — **6 categories × 5 clues** (30 cells total).
- **Values:** `$200`, `$400`, `$600`, `$800`, `$1000` per row (row 1 = $200, row 5 = $1000).
- **Scoring:** In-app score tracking per player. **Correct** → add clue value. **Incorrect** → no score change; other players may **steal** (see below). Scores never decrease.
- **Clue selection:** After a correct response, the player who answered correctly chooses the next clue. At game start, the player with **lowest score** picks first (all start at $0 → **Player 1** picks first, or use random tie-break among tied lowest).
- **Ring-in and steal:** When a clue is revealed, any player may buzz. First buzz locks that player in to answer. If they are **incorrect**, their score is unchanged and buzzers reopen for a **steal** — any player who has **not yet attempted** this clue may buzz (max one attempt per player per clue). The first stealer to buzz answers next; repeat until someone is correct or all players have missed.
- **Clue lifecycle:** Unanswered → selected (question shown) → answered correctly / exhausted (all wrong) → **removed** from board (greyed or hidden). Game ends when all 30 clues are resolved.
- **Winner:** Player(s) with highest score; ties noted.
- **Manage Game:** UI to edit categories, questions, answers, and dollar values; persist to `public/data/board.json`.
- **Save & continue:** Exit mid-game; resume later from `public/data/saved-game.json`.
- **Data folder:** All persisted JSON under `public/data/`.

## Gameplay flow (host-led)

1. **Setup** — Choose 3–5 players, enter names, start game (loads board from JSON).
2. **Select clue** — Current selector clicks a cell; question text appears (answer hidden until host marks correct/incorrect or clicks "Reveal answer").
3. **Buzz** — Host says "open buzzers"; players click their buzz button. First buzz highlights that player.
4. **Respond** — Host hears verbal answer, then marks **Correct** or **Incorrect** in the app.
   - **Correct:** Add value to player score; they become the next selector.
   - **Incorrect:** No score change; reopen buzzers for a **steal** by players who have not yet attempted this clue.
   - **Steal:** Host opens buzzers again; the next player to buzz attempts the same clue (one try per player total for that clue).
   - If all players miss: reveal answer, no score changes; **same selector** picks the next clue.
5. **Repeat** until board empty.
6. **Game complete** — Show final standings and winner.

## Out of scope (v1)

- Daily Double / wagering
- Double Jeopardy round
- Final Jeopardy
- Requiring "question form" phrasing
- Automated speech / speech recognition
- Timer / 5-second limit (optional future enhancement)
- Sound effects
- Server or database; static deploy without write API (document limitation like Wheel of Fortune README)
- Point penalties on incorrect answers (scores only go up)

## JSON: game board

**Path:** `public/data/board.json`

```json
{
  "categories": [
    {
      "id": "cat-1",
      "title": "Science",
      "clues": [
        {
          "id": "cat-1-200",
          "value": 200,
          "question": "This force keeps planets in orbit around the Sun.",
          "answer": "Gravity"
        }
      ]
    }
  ]
}
```

### Schema

- `categories` (array, length **6** for a standard board)
  - `id` (string, unique, required)
  - `title` (string, non-empty, required) — column header
  - `clues` (array, length **5** for a standard board)
    - `id` (string, unique within file, required)
    - `value` (number, required) — typically 200, 400, 600, 800, 1000
    - `question` (string, non-empty, required) — shown when clue is selected
    - `answer` (string, non-empty, required) — host reference; revealed on demand

Validation rules:

- Exactly **6** categories and **5** clues per category when starting a new game (Manage Game may allow editing; validate on save and on game start).
- Clue `value` must match row convention for that index (row 0 → 200, row 1 → 400, …) OR values are taken as stored (prefer **enforcing 200–1000 by row** on save for consistency).
- All `id` fields unique across the file.

## JSON: saved game

**Path:** `public/data/saved-game.json`

Wrapper shape (matches Wheel of Fortune pattern):

```json
{
  "savedGame": { ... } 
}
```

When no save exists, file may be `{ "savedGame": null }` or equivalent empty state.

### `savedGame` payload

```json
{
  "version": 1,
  "savedAt": "2026-06-11T12:00:00.000Z",
  "config": {
    "players": [
      { "id": "p1", "name": "Alice" }
    ]
  },
  "board": { "categories": [ "...same as board.json..." ] },
  "scores": [0, 0, 0],
  "currentSelectorIndex": 0,
  "phase": "playing",
  "clueStates": {
    "cat-1-200": "unanswered",
    "cat-1-400": "answered"
  },
  "activeClueId": null,
  "buzzState": {
    "status": "idle",
    "buzzedPlayerIndex": null,
    "attemptedPlayerIndices": [],
    "isSteal": false
  }
}
```

- `version` — `1`; reject unknown versions on load.
- `config.players` — 3–5 players, same shape as runtime.
- `board` — snapshot of categories/clues at game start (so edits to `board.json` don't break a resumed game).
- `scores` — integer array, length = player count, each ≥ 0.
- `currentSelectorIndex` — who picks the next clue when idle.
- `phase` — `"playing"` | `"complete"`.
- `clueStates` — map clue id → `"unanswered"` | `"answered"`.
- `activeClueId` — currently open clue, or `null`.
- `buzzState` — tracks open buzz, who buzzed, who already attempted this clue, and whether the current open buzz is a **steal** (`isSteal: true` after an incorrect answer).

## UI views

| View | Description |
|------|-------------|
| **Play Game** | Setup form, board, buzz controls, scores, save/exit |
| **Manage Game** | Edit `board.json` (categories, clues, validation, save) |

Optional later: **Sounds** (not in v1).

## Local run

1. `npm install`
2. `npm run dev`
3. Open the Vite URL (usually `http://localhost:5173`).

Persistence writes require the dev-server API in `vite.config.ts` (copy pattern from `wheel-of-fortune-game`).

## Acceptance criteria (full app)

- [ ] New game with 3, 4, and 5 players.
- [ ] Full 6×5 board renders with category titles and dollar values.
- [ ] Clue select → question display → buzz → correct adds points; incorrect does not subtract.
- [ ] Incorrect answers open a steal; other unattempted players may buzz; each player at most once per clue.
- [ ] Answered clues leave the board; game completes after 30 clues.
- [ ] Winner screen with correct standings and tie handling.
- [ ] Manage Game edits persist to `public/data/board.json`.
- [ ] Save mid-game and resume restores scores, board state, selector, and active clue.
- [ ] `npm run build` passes.
