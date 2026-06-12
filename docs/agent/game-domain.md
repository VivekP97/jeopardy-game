# Game Domain Rules

Critical gameplay and data rules for agents implementing or modifying game logic.

Source of truth: [`../01-create-game/spec.md`](../01-create-game/spec.md). This document highlights rules that are commonly misimplemented.

## Simplified Jeopardy model

| TV Jeopardy | This app |
|-------------|----------|
| Clue is an "answer"; contestant responds in question form | Board shows a **question**; player gives the **answer** |
| Penalties on wrong answers | **No penalties** — scores only increase |
| 3 contestants | **3–5** players |
| Physical buzzers | In-app **buzz buttons** per player |

## Board

- **6 categories × 5 clues** = 30 cells per game.
- Dollar values by row: **$200, $400, $600, $800, $1000** (row index 0 → 200, etc.).
- Enforce values on save in Manage Game for consistency.
- Answered clues are removed from play (greyed or hidden).

## Player setup

- **3–5 players**, each with display name and stable `id`.
- All start at score **0**.
- First selector: player with lowest score (all tied at 0 → **Player 1**, or random among tied lowest).

## Clue lifecycle

```
unanswered → selected (question shown) → buzzing → judged
                ↓ incorrect (steal round) ──────────────┘
                ↓ all wrong / correct → answered (removed from board)
```

### `clueStates` values

- `"unanswered"` — on board, selectable
- `"answered"` — resolved; not selectable

## Buzz and steal flow

1. Selector picks clue → question displayed; buzz **closed**.
2. Host clicks **Open buzzers** → `openBuzz()`.
3. First valid buzz locks that player in (`buzzedPlayerIndex`).
4. Host marks **Correct** or **Incorrect**.

### Correct

- Add clue **value** to player's score.
- That player becomes **next selector**.
- Mark clue **answered**; clear active clue.

### Incorrect

- **No score change.**
- Add player to `attemptedPlayerIndices` for this clue.
- If any player has **not** attempted → set `isSteal: true`, reopen buzz (only unattempted players may buzz).
- If **all** players attempted → mark clue **answered**, reveal answer optional, **selector unchanged**.

### Steal

- Same buzz rules as initial ring-in, but players in `attemptedPlayerIndices` **cannot** buzz.
- Max **one attempt per player per clue**.

## Scoring invariants

- Scores are integers ≥ 0.
- Scores **never decrease**.
- No wagering, no Daily Double in v1.

## Game completion

- Game ends when all **30** clues are `"answered"`.
- `phase` → `"complete"`.
- Winner: highest score; **ties** allowed and should be displayed.

## Engine functions (Phase 3)

| Function | Responsibility |
|----------|----------------|
| `createGame(config, board)` | Initial state from setup + board |
| `selectClue(state, clueId)` | Only unanswered; set active clue; reset buzz |
| `openBuzz(state)` | Enable buzzing for active clue |
| `buzz(state, playerIndex)` | First valid buzz wins; ignore if closed or already attempted |
| `judgeAnswer(state, correct)` | Apply scoring/steal/selector rules; resolve clue when done |
| `getWinnerIndices(state)` | Indices of highest scorers (ties) |

Helpers in `board.ts`: `isGameComplete`, remaining clue count.

## JSON: `board.json`

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

Validation on load/save:

- Exactly **6** categories, **5** clues each (standard board).
- Unique `id` across all categories and clues.
- Non-empty `title`, `question`, `answer`.

## JSON: `saved-game.json`

Wrapper:

```json
{ "savedGame": null }
```

Payload fields (when present):

| Field | Purpose |
|-------|---------|
| `version` | Must be `1`; reject unknown |
| `savedAt` | ISO timestamp |
| `config.players` | 3–5 players |
| `board` | Snapshot at game start |
| `scores` | Integer array, length = player count |
| `currentSelectorIndex` | Who picks next clue when idle |
| `phase` | `"playing"` \| `"complete"` |
| `clueStates` | Map clue id → `"unanswered"` \| `"answered"` |
| `activeClueId` | Current clue or `null` |
| `buzzState` | `status`, `buzzedPlayerIndex`, `attemptedPlayerIndices`, `isSteal` |

Resume must restore **in-progress clue and buzz state**, not just scores.

## Out of scope (v1)

Do not implement unless explicitly requested:

- Daily Double / wagering
- Double Jeopardy, Final Jeopardy
- Question-form phrasing requirement
- Speech / timers / sound effects
- Server or database backend
- Point penalties on wrong answers
