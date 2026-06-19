# Architecture

Module layout and separation of concerns for the Jeopardy game.

## Target directory structure

```
public/data/
  board.json              # Default 6×5 board content
  saved-game.json         # Save slot ({ "savedGame": null } when empty)
src/
  types/
    game.ts               # Player, Clue, Category, Board, GameState, BuzzState
  data/
    loadBoard.ts          # Fetch + validate board.json
    saveBoard.ts          # PUT board via /api/board
    savedGame.ts          # Save/load/validate saved-game.json
  game/
    engine.ts             # createGame, resumeGameFromSave, selectClue, openBuzz, buzz, judgeAnswer
    board.ts              # remaining clues, isGameComplete, getWinnerIndices
  components/
    PlayGameView.tsx      # Play orchestrator — holds GameState, wires engine + save/load
    GameSetupForm.tsx
    JeopardyBoard.tsx
    CluePanel.tsx
    BuzzPanel.tsx
    Scoreboard.tsx
    GameComplete.tsx
    ManageGameView.tsx
    ViewStateMessage.tsx  # Load/error empty states
  theme.ts                # MUI createTheme — Jeopardy palette
  App.tsx                 # Sidebar nav; switches Play vs Manage
  main.tsx                # ThemeProvider + CssBaseline
vite.config.ts            # Dev-only /api/board and /api/saved-game middleware
docs/
  01-create-game/         # Spec, implementation plan, progress
  agent/                  # Agent guidance supplements
```

Runtime UI flow and component map: [`codebase-map.md`](codebase-map.md).

## Layer boundaries

### `src/game/` — pure engine

- **No React imports.** No `fetch`, no DOM, no side effects.
- Functions take `GameState` (or config) and return **new immutable state**.
- All scoring, buzz, steal, and selector rules live here.
- Must be unit-testable in isolation — see [`../02-add-test-coverage/plan.md`](../02-add-test-coverage/plan.md).

```typescript
// ✅ Engine function signature pattern
export function judgeAnswer(state: GameState, correct: boolean): GameState {
  // return new state object — never mutate `state`
}
```

### `src/data/` — persistence and validation

- Fetch JSON from `/api/*` endpoints (dev) or static paths (read-only fallback).
- Validate shape, counts, and IDs before returning typed data.
- Throw or return `Result` types with user-facing error messages for UI.

### `src/components/` — presentation

- Built with **Material UI** components; styled via theme and `sx`, not ad-hoc CSS.
- Receive state and callbacks as props; call engine functions via parent handlers.
- No embedded game rules (e.g., do not add `score -= value` in a component).
- Local UI state only (form drafts, reveal-answer toggle, etc.).

### `src/theme.ts` + `main.tsx` — theming

- `createTheme` defines Jeopardy-inspired palette, typography, and optional component overrides.
- `ThemeProvider` and `CssBaseline` wrap the app in `main.tsx`.
- All views share one theme for a polished, consistent look.

### `App.tsx` + `PlayGameView.tsx` — orchestration

- **`App.tsx`** — sidebar (**Play Game**, **Manage Game**); passes `boardRevision` to Play so the board reloads after Manage saves.
- **`PlayGameView.tsx`** — holds authoritative `GameState` during play; loads board and saved game; calls engine functions and passes updated state to child components; save/load via `src/data/savedGame.ts`.
- Engine transitions: setup → playing → complete. See [`codebase-map.md`](codebase-map.md) for the screen flow.

## Data flow (Play Game)

```
board.json ──fetch──► loadBoard.ts ──validate──► Board
                                                      │
Player setup ──► createGame(config, board) ──► GameState
                                                      │
User actions ──► engine.ts functions ──► updated GameState ──► React re-render
                                                      │
Save ──► gameStateToSavedPayload ──► PUT /api/saved-game
```

## Dev-server file API

Production builds serve static files only — **writes require the dev server**.

Implement in `vite.config.ts` as dev-only Connect middleware:

| Endpoint | File |
|----------|------|
| `GET/PUT /api/board` | `public/data/board.json` |
| `GET/PUT /api/saved-game` | `public/data/saved-game.json` |

Documented in the root [`README.md`](../../README.md).

## JSON files

| File | Purpose |
|------|---------|
| `board.json` | Category titles, clues (question + answer + value), unique IDs |
| `saved-game.json` | Wrapper `{ "savedGame": ... \| null }` with full in-progress state snapshot |

Schema details: [`game-domain.md`](game-domain.md) and [`../01-create-game/spec.md`](../01-create-game/spec.md).

## TypeScript configuration

- App code: `tsconfig.app.json` — strict unused checks, `verbatimModuleSyntax`.
- Vite config: `tsconfig.node.json`.
- Build: `tsc -b && vite build` (see `package.json`).
