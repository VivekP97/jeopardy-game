# Codebase map

Quick orientation for agents working on UI or gameplay changes. Read this after [`AGENTS.md`](../../AGENTS.md); use the linked docs for rules and conventions — not a full repo walkthrough.

## Read order

| Order | Document | When you need it |
|-------|----------|------------------|
| 1 | [`AGENTS.md`](../../AGENTS.md) | Commands, boundaries, rule summary |
| 2 | **This file** | Where code lives, screen flow, what to edit |
| 3 | [`architecture.md`](./architecture.md) | Layer rules, data flow, dev API |
| 4 | [`game-domain.md`](./game-domain.md) | Buzz/steal/scoring rules, JSON schemas |
| 5 | [`coding-standards.md`](./coding-standards.md) | TypeScript, React, MUI conventions |

Historical build notes live under [`../01-create-game/`](../01-create-game/) — useful for context, not the default onboarding path for new work.

## App shell

```
App.tsx
├── Sidebar nav: Play Game | Manage Game
├── boardRevision (counter) — bumped when Manage Game saves a board
├── PlayGameView (boardRevision) — all play-mode state and engine wiring
└── ManageGameView (onBoardSaved) — board editor draft + save
```

- **`App.tsx`** — navigation only; no `GameState`.
- **`PlayGameView`** — owns `gameState`, board load, save/load, and engine callbacks during play.
- **`ManageGameView`** — owns editor draft; calls `saveBoard` → triggers Play reload via `boardRevision`.

## Play Game screen flow

`PlayGameView` renders one of these branches:

```
loadBoard()
    │
    ├─ loading ──► spinner
    ├─ error ──► ViewStateMessage
    │
    └─ ready
         │
         ├─ gameState === null ──► GameSetupForm
         │       (new game / continue save / abandon save)
         │
         ├─ phase === 'complete' ──► GameComplete
         │
         └─ phase === 'playing'
                 ├── Scoreboard + Save & menu
                 ├── activeClue set? ──► CluePanel  :  JeopardyBoard
                 └── BuzzPanel (always during play)
```

### During an active clue

1. Selector picks cell → `selectClue` → **JeopardyBoard** hidden, **CluePanel** shows question.
2. Host clicks **Open buzzers** → `openBuzz` → **BuzzPanel** buttons enable.
3. Player buzzes → `buzz` → host marks Correct/Incorrect → `judgeAnswer`.
4. Clue resolved → `activeClueId` cleared → **JeopardyBoard** returns.

Save & menu serializes `gameState` to `saved-game.json` and returns to setup.

## Component responsibilities

| Component | Role | Key props / callbacks |
|-----------|------|------------------------|
| `PlayGameView` | Play orchestrator; holds `GameState` | `boardRevision` |
| `GameSetupForm` | 3–5 player names; continue/abandon save | `onStart`, `onContinueSavedGame`, … |
| `JeopardyBoard` | 6×5 grid; selector picks clue | `state`, `onSelectClue` |
| `CluePanel` | Question, reveal answer, host controls | `clue`, `buzzState`, `onOpenBuzz`, `onJudge` |
| `BuzzPanel` | Per-player buzz buttons | `state`, `onBuzz` |
| `Scoreboard` | Scores, selector/buzzed highlights | `state` |
| `GameComplete` | Final standings and winner(s) | `state`, `onNewGame` |
| `ManageGameView` | Edit categories/questions/answers | `onBoardSaved` |
| `ViewStateMessage` | Friendly load/empty errors | `title`, `message`, `hint` |

**Local UI state only** (not in `GameState`): e.g. `CluePanel` answer-revealed toggle, `ManageGameView` draft vs saved board, form fields in setup.

## Game state (`src/types/game.ts`)

| Field | Purpose |
|-------|---------|
| `config.players` | 3–5 players (`id`, `name`) |
| `board` | Board snapshot at game start |
| `scores[]` | Per-player totals (never decrease) |
| `currentSelectorIndex` | Who picks the next clue on the board |
| `clueStates` | `unanswered` \| `answered` per clue id |
| `activeClueId` | Open clue, or `null` when showing the board |
| `buzzState` | Buzzer lifecycle (see below) |
| `phase` | `playing` \| `complete` |

### Buzz state machine

```
idle ──openBuzz──► open ──buzz──► buzzed ──judgeAnswer──► …
                      ▲                    │
                      │                    ├─ correct → clue answered, board
                      │                    ├─ incorrect, steal left → idle (isSteal: true)
                      └── openBuzz         └─ all missed → clue answered, same selector
```

| `buzzState.status` | Meaning |
|--------------------|---------|
| `idle` | Buzzers closed; host can open |
| `open` | Players may buzz (if not in `attemptedPlayerIndices`) |
| `buzzed` | One player locked in; host judges |

Also: `buzzedPlayerIndex`, `attemptedPlayerIndices`, `isSteal`.

## Engine (`src/game/engine.ts`)

Pure functions — `(GameState, …) → GameState`. No React, no I/O.

| Function | When |
|----------|------|
| `createGame(config, board)` | New game from setup |
| `resumeGameFromSave(payload)` | Restore saved game |
| `selectClue(state, clueId)` | Selector picks cell |
| `openBuzz(state)` | Host opens buzzers |
| `buzz(state, playerIndex)` | Player rings in |
| `judgeAnswer(state, correct)` | Score, steal, or exhaust clue |

Helpers in `src/game/board.ts`: `isGameComplete`, `countRemainingClues`, `getWinnerIndices`.

## Data layer (`src/data/`)

| Module | Role |
|--------|------|
| `loadBoard.ts` | Fetch + validate `board.json`; `CLUE_VALUES_BY_ROW` |
| `saveBoard.ts` | Validate + `PUT /api/board` |
| `savedGame.ts` | Load/save/validate `saved-game.json`; `gameStateToSavedPayload` |

Fetch tries `/api/*` first, then static `/data/*` (read-only fallback).

## Where to change things

| Goal | Start here |
|------|------------|
| Scoring, steal, selector rules | `src/game/engine.ts` + `engine.test.ts` |
| Board completion / winners | `src/game/board.ts` |
| JSON validation | `src/data/loadBoard.ts`, `savedGame.ts` |
| Play flow / save & menu | `src/components/PlayGameView.tsx` |
| Board grid UI | `src/components/JeopardyBoard.tsx` |
| Host clue controls | `src/components/CluePanel.tsx` |
| Buzz buttons | `src/components/BuzzPanel.tsx` |
| Board editor | `src/components/ManageGameView.tsx` |
| Nav / view switching | `src/App.tsx` |
| Colors / theme | `src/theme.ts` |
| Shared types | `src/types/game.ts` |

## Tests

| Location | Purpose |
|----------|---------|
| `src/game/*.test.ts` | Engine and board helpers |
| `src/data/*.test.ts` | Validation and fetch/save |
| `src/components/*.test.tsx` | UI flows (RTL + user-event) |
| `src/test/msw/handlers.ts` | Default mock API responses |
| `src/test/fixtures/` | Board and saved-game fixtures |
| `src/test/render.tsx` | Theme-wrapped render helper |

Run `npm run test:run` after engine, data, or tested UI changes.

## Persistence files

| File | Written by |
|------|------------|
| `public/data/board.json` | Manage Game → `saveBoard` |
| `public/data/saved-game.json` | Play → Save & menu → `saveSavedGameFile` |

Dev writes require `npm run dev` (Vite middleware in `vite.config.ts`). Production build is read-only for writes.
