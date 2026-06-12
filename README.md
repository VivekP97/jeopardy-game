# Jeopardy Game

A browser-based Jeopardy-style party game for 3–5 players. One person acts as host: they read questions aloud, open buzzers, and judge verbal answers. The app manages the board, buzzer flow, scoring, board editing, and save/resume.

Built with React 19, TypeScript, Vite, and Material UI.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Use the sidebar to switch between **Play Game** and **Manage Game**.

```bash
npm run build      # Typecheck + production bundle
npm run lint       # ESLint
npm run preview    # Preview production build
npm test           # Vitest watch mode
npm run test:run   # Single test run (CI)
npm run test:coverage # Coverage report + thresholds
```

**Note:** Board and save-file writes use a dev-server API (`/api/board`, `/api/saved-game`). Editing and saving work when running `npm run dev`. A static production build can load data but cannot persist changes without a separate backend.

## How to play

1. **Setup** — Choose 3–5 players, enter names, and start a new game (or continue a saved game).
2. **Pick a clue** — The current selector clicks a dollar value on the board. The question appears.
3. **Open buzzers** — The host clicks **Open buzzers**. Players tap their buzz button; first buzz wins.
4. **Judge** — The host hears the verbal answer and marks **Correct** or **Incorrect**.
   - **Correct:** Player earns the clue value and picks the next clue.
   - **Incorrect:** No score change. Buzzers reopen for a **steal** by players who have not yet tried this clue (one attempt per player per clue).
   - **All miss:** Clue is removed; the same selector picks again.
5. **Finish** — When all 30 clues are resolved, final standings and winner(s) are shown.

### Rules (simplified vs. TV Jeopardy)

| | This app |
|---|---|
| Board display | Shows **questions**; players give **answers** |
| Wrong answers | **No penalty** — scores only go up |
| Players | **3–5** with in-app buzz buttons |
| Board size | **6 categories × 5 clues** ($200–$1000 per row) |

Use **Save & menu** during play to exit and resume later from the setup screen.

## Data files

All persisted JSON lives under `public/data/`:

| File | Purpose |
|------|---------|
| `public/data/board.json` | Game board — 6 categories, 5 clues each (question, answer, fixed values) |
| `public/data/saved-game.json` | Save slot for in-progress games (`{ "savedGame": null }` when empty) |

Edit the board in **Manage Game** or directly in `board.json` while the dev server is running. Invalid board data shows a friendly error on the Play and Manage screens.

## Project layout

```
src/
  game/           # Pure game engine (no React)
  data/           # Load/save/validate JSON
  components/     # UI (board, buzzers, setup, editor)
  types/game.ts   # Shared types
public/data/      # Board and save files
docs/             # Spec, implementation plan, agent guides
```

Full game rules and schemas: [`docs/01-create-game/spec.md`](docs/01-create-game/spec.md).

## License

Private project — see repository owner for usage terms.
