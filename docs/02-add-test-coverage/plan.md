# Unit Test Coverage Plan

Last updated: 2026-06-12  
Branch: `add-test-coverage`

## Purpose

Add **automated unit and component tests** across the Jeopardy game so gameplay rules, validation, persistence, and critical UI behavior are verified without manual browser smoke tests. This plan is independent of the phased game-build docs in `docs/01-create-game/`; it describes one cohesive testing initiative on the `add-test-coverage` branch.

## Goals

| Goal | Rationale |
|------|-----------|
| Lock in game rules in `src/game/` | Scoring, steal, selector, and completion logic are easy to regress and are pure functions |
| Validate JSON schemas in `src/data/` | Board and save files are the persistence contract; bad data must fail predictably |
| Exercise UI wiring for host/player flows | Components mostly delegate to the engine; tests confirm buttons, disabled states, and callbacks |
| Run tests in CI on every PR | `npm test` should be as routine as `npm run build` |

## Success criteria

- [ ] `npm test` runs Vitest in watch and CI modes
- [ ] `npm run test:coverage` reports coverage with agreed thresholds (see [Coverage targets](#coverage-targets))
- [ ] Game engine has exhaustive rule coverage (happy paths + invalid transitions + edge cases)
- [ ] Data validators have table-driven tests for every documented rejection reason
- [ ] Core play and manage UI flows have component tests with React Testing Library
- [ ] `docs/agent/coding-standards.md` and root `README.md` updated for the new workflow
- [ ] `docs/01-create-game/progress.md` deferred item “Automated unit tests” checked off when done

## Non-goals (v1 of test suite)

- End-to-end browser automation (Playwright/Cypress) — manual smoke tests remain sufficient for layout polish
- Visual regression / screenshot tests
- Performance or load testing
- Sound effects, Daily Double, timers (not implemented)

---

## Tooling

### Stack

| Tool | Role |
|------|------|
| **Vitest** | Test runner (native Vite integration, fast, ESM-friendly) |
| **@testing-library/react** + **@testing-library/user-event** | Component tests focused on user-visible behavior |
| **@testing-library/jest-dom** | DOM matchers (`toBeDisabled`, `toHaveTextContent`, etc.) |
| **jsdom** | Browser-like environment for component tests |
| **MSW** (Mock Service Worker) | Mock `fetch` for `loadBoard`, `saveBoard`, `savedGame` without a running dev server |

Vitest is preferred over Jest because the project already uses Vite 8; configuration stays minimal and shares `vite.config.ts` resolution.

### New npm scripts

```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

### New devDependencies (approximate)

- `vitest`
- `@vitest/coverage-v8`
- `jsdom`
- `@testing-library/react`
- `@testing-library/user-event`
- `@testing-library/jest-dom`
- `msw`

### Configuration files

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Test environment, globals, coverage include/exclude, setup file |
| `src/test/setup.ts` | Import `@testing-library/jest-dom`, MSW server lifecycle (`beforeAll` / `afterEach` / `afterAll`) |
| `src/test/render.tsx` | `renderWithTheme(ui)` — wraps components in MUI `ThemeProvider` + `CssBaseline` |
| `src/test/msw/handlers.ts` | Default handlers for `/api/board` and `/api/saved-game` |
| `src/test/fixtures/` | Minimal valid board, saved-game payloads, and factory helpers |

### Test file placement

Colocate tests next to source (Vitest convention):

```
src/game/engine.test.ts
src/game/board.test.ts
src/data/loadBoard.test.ts
src/data/savedGame.test.ts
src/data/saveBoard.test.ts
src/components/BuzzPanel.test.tsx
...
```

Alternative `src/**/*.test.ts` glob is equivalent; pick one convention and stay consistent.

### Coverage targets

Prioritize **behavioral coverage** over chasing 100% line coverage on presentational code.

| Area | Line coverage target | Notes |
|------|---------------------|-------|
| `src/game/` | ≥ 95% | Every exported function and branch |
| `src/data/` | ≥ 90% | Validators fully covered; fetch wrappers need success + failure paths |
| `src/components/` | ≥ 75% | Focus on interactive components; skip pure layout in `ViewStateMessage` if trivial |
| `src/App.tsx`, `src/theme.ts` | Optional smoke tests | Low risk; test navigation wiring only if time permits |

Configure Vitest coverage thresholds to fail the build only for `src/game/**` and `src/data/**` initially; relax component thresholds until the suite stabilizes.

---

## Shared test infrastructure

Implement fixtures and helpers **before** module-specific tests so engine and data tests stay readable.

### `createTestBoard()`

Build a **small** board (e.g. 2 categories × 2 clues) for fast engine tests. Full 6×5 boards are only needed where validation requires standard dimensions.

```typescript
// Example shape — implement in src/test/fixtures/board.ts
export function createTestBoard(overrides?: Partial<Board>): Board
export function getClueId(board: Board, categoryIndex: number, rowIndex: number): string
```

### `createTestConfig(playerCount = 3)`

Returns `GameConfig` with stable player ids `p1`, `p2`, …

### `playThroughClue(state, { selector, buzzer, correct })`

Helper that chains `selectClue` → `openBuzz` → `buzz` → `judgeAnswer` for integration-style engine tests.

### `createValidSavedPayload(state: GameState)`

Uses `gameStateToSavedPayload` or builds from fixtures for round-trip tests.

### MSW handlers

- `GET /api/board` → fixture board JSON
- `PUT /api/board` → 200 with echoed body
- `GET /api/saved-game` → `{ savedGame: null }` or valid payload
- `PUT /api/saved-game` → 200
- Error variants: 404, 400, network failure (override per test with `server.use(...)`)

### `renderWithTheme`

All component tests that use MUI hooks (`useTheme`, `useMediaQuery`) must render through the app theme to avoid context errors.

---

## Coverage map

### 1. Game engine — `src/game/engine.ts` (highest priority)

Pure functions; no mocks required. These tests are the **contract** for all gameplay rules. Reference: [`docs/agent/game-domain.md`](../agent/game-domain.md).

#### `createGame`

- Initializes scores to zero for 3, 4, and 5 players
- Sets `currentSelectorIndex` to 0
- Sets `phase` to `'playing'`
- Marks every board clue `'unanswered'`
- Resets buzz state (`idle`, no active clue)

#### `selectClue`

- **Happy path:** unanswered clue becomes `activeClueId`, buzz resets
- **Rejects:** wrong phase, clue already active, clue already answered, unknown clue id
- **Immutability:** input `state` unchanged (reference equality check)

#### `openBuzz`

- **Happy path:** `idle` → `open` when clue is active
- **Rejects:** no active clue, buzz already open/buzzed, wrong phase

#### `buzz`

- **Happy path:** first buzz sets `buzzed` and `buzzedPlayerIndex`
- **Rejects:** buzz not open, invalid player index, player already in `attemptedPlayerIndices`
- **Steal round:** after incorrect answer, only unattempted players can buzz

#### `judgeAnswer` — correct

- Adds clue value to buzzed player score
- Sets buzzed player as `currentSelectorIndex`
- Marks clue `answered`, clears `activeClueId`, resets buzz
- When last clue answered → `phase` becomes `'complete'`

#### `judgeAnswer` — incorrect

- **No score change** (assert scores array identical)
- Adds buzzer to `attemptedPlayerIndices`
- If players remain: buzz → `idle`, `isSteal: true`, clue stays active
- If all players attempted: clue `answered`, selector **unchanged**, buzz reset

#### Multi-step scenarios (integration within engine tests)

| Scenario | Assertions |
|----------|------------|
| 3 players, P1 wrong → P2 steals correctly | P2 score increases; P2 becomes selector |
| 3 players, all wrong | Clue answered; selector unchanged; no score changes |
| Play until board empty | `phase === 'complete'` |
| 5 players, partial steal chain | Each wrong attempt excludes that player from buzzing |

#### `resumeGameFromSave`

- Deep-copies arrays (`scores`, `attemptedPlayerIndices`, `clueStates`) so mutations do not alias payload
- Preserves mid-clue state (`activeClueId`, `buzzState.status === 'buzzed'`)

#### Invalid transitions (table-driven)

For each engine function, one parameterized test verifying **unchanged state reference** when preconditions fail.

---

### 2. Board helpers — `src/game/board.ts`

#### `getAllClueIds`

- Returns 30 ids for standard board; order stable (category-major)

#### `countRemainingClues`

- Matches number of `'unanswered'` entries
- Decreases after `judgeAnswer` marks answered

#### `isGameComplete`

- `false` when any clue unanswered
- `true` when all answered OR `phase === 'complete'` already

#### `getWinnerIndices`

- Single winner
- Tie (two or more max scores)
- Empty scores → `[]`
- All zero → all indices (tie at 0)

---

### 3. Board validation — `src/data/loadBoard.ts`

Test `validateBoard` directly (not only via `loadBoard`). Use table-driven `it.each` with `{ input, expectedError }`.

#### Valid input

- Minimal valid 6×5 board passes
- Trims whitespace on string fields

#### Structural errors

- Not an object
- Missing / non-array `categories`
- Wrong category count (≠ 6)
- Wrong clue count per category (≠ 5)
- Non-numeric or wrong row values (200–1000 by row index)
- Empty id, title, question, or answer
- Duplicate category ids
- Duplicate clue ids across board

#### `loadBoard` (with MSW)

- API success → `{ ok: true, board }`
- API 404, static fallback success
- Both fail → `{ ok: false, error }` with friendly message
- Invalid JSON shape → `{ ok: false, error }` with validator message

---

### 4. Saved game — `src/data/savedGame.ts`

#### `validateSavedGamePayload`

Cover cross-field rules that go beyond board validation:

| Case | Expected error |
|------|----------------|
| Wrong `version` | Unsupported version |
| Invalid / missing `savedAt` | Timestamp errors |
| Player count < 3 or > 5 | Player bounds |
| Duplicate player ids | Duplicate id |
| `scores` length mismatch | Length error |
| Negative or non-integer score | Score validation |
| `currentSelectorIndex` out of range | Index error |
| Missing / extra `clueStates` keys | Clue state sync with board |
| `activeClueId` unknown or answered | Active clue rules |
| `buzzState` inconsistent with `activeClueId` | Idle buzz when no clue; buzzed requires index |
| `phase === 'complete'` with active clue | Phase consistency |
| `attemptedPlayerIndices` / `buzzedPlayerIndex` out of range | Index bounds |

#### `parseSavedGameFile`

- `{ savedGame: null }` → `null`
- Valid wrapper → validated payload
- Missing `savedGame` key → error

#### Round-trip helpers

- `gameStateToSavedPayload` → `validateSavedGamePayload` succeeds
- `savedPayloadToGameState` → `resumeGameFromSave` equivalent state (deep equality on key fields)
- Mid-game snapshot: active clue + steal buzz state survives round-trip

#### `loadSavedGameFile` / `saveSavedGameFile` (MSW)

- Load empty slot, load valid save, load corrupt save
- Save success, save 400 from API, network error
- Save re-validates payload before PUT

---

### 5. Save board — `src/data/saveBoard.ts`

- Valid board → `{ ok: true, board }` (validated copy)
- Invalid board → `{ ok: false, error }` before fetch
- PUT failure → `{ ok: false, error }` with API message when present

---

### 6. Components — `src/components/`

Use **React Testing Library** with `renderWithTheme`. Prefer queries by role/label (`getByRole`, `getByLabelText`) per MUI accessibility patterns already in the app.

#### `GameSetupForm`

- Renders 3 name fields by default
- Changing player count to 5 shows 5 fields
- Empty name on Start → error alert, `onStart` not called
- Valid names → `onStart` with `{ players: [{ id, name }] }`
- Continue / Abandon buttons call handlers when `savedGameAt` provided
- Disabled while `isContinuing` / `isAbandoning`

#### `JeopardyBoard`

- Shows selector prompt with current player name
- Answered clues disabled or hidden (match implementation)
- Unanswered clue click calls `onSelectClue` with id
- No selection when `activeClueId` set (clue in progress message)

#### `CluePanel`

- Shows question for active clue
- Reveal answer toggles answer visibility
- Correct / Incorrect disabled until someone buzzed
- Correct / Incorrect call parent handlers

#### `BuzzPanel`

- All buzz buttons disabled when no active clue
- Disabled when buzz not open
- Enabled for eligible players when open
- After steal (`isSteal: true`), shows “Steal round!” and disables attempted players
- Click calls `onBuzz(index)`

#### `Scoreboard`

- Lists names and scores
- Highlights current selector and buzzed-in player

#### `GameComplete`

- Shows winner name(s) on tie
- Displays final scores

#### `ViewStateMessage`

- Renders loading spinner, error alert, or children based on props (light coverage)

#### `PlayGameView` (orchestration — medium priority)

Mock `loadBoard` / `loadSavedGameFile` at module boundary or via MSW. Test:

- Loading → error state when board fails
- Setup form → start game → board visible
- Save & menu triggers `saveSavedGameFile`
- Continue saved game restores state

Keep these tests **few and high-value**; detailed rules stay in engine tests.

#### `ManageGameView`

- Loads board into editable draft
- Save disabled when not dirty
- Invalid edit → validation error, no PUT
- Successful save calls `onBoardSaved`, clears dirty state
- Reset restores saved board

---

### 7. App shell — `src/App.tsx` (optional, lower priority)

- Clicking “Manage Game” / “Play Game” switches main content
- Saving board in manage increments `boardRevision` (if exposed via test id or mock child)

Skip exhaustive responsive drawer tests unless regressions appear; `useMediaQuery` is awkward in jsdom.

---

### 8. Out of scope / defer

| Module | Reason |
|--------|--------|
| `src/theme.ts` | Declarative palette; no logic |
| `vite.config.ts` middleware | Dev-only; extract handler to testable module only if bugs appear |
| `src/main.tsx` | Bootstrap only |

---

## Recommended implementation order

Work streams are ordered by **risk and dependency**, not arbitrary phase numbers. Complete each stream’s infrastructure before moving on; commit logical chunks on `add-test-coverage`.

```
1. Tooling + test harness (Vitest, setup, renderWithTheme, MSW, fixtures)
2. Engine + board tests (engine.test.ts, board.test.ts)
3. Data layer tests (loadBoard, savedGame, saveBoard)
4. Presentational components (BuzzPanel, CluePanel, Scoreboard, GameComplete, JeopardyBoard)
5. Forms and orchestration (GameSetupForm, ManageGameView, PlayGameView)
6. Coverage thresholds, README/docs, progress.md checkbox
```

Within stream 2, implement `judgeAnswer` steal scenarios before `resumeGameFromSave` — steal logic is the most regression-prone.

---

## Documentation updates

When the suite lands, update:

| File | Change |
|------|--------|
| Root `README.md` | Add `npm test`, `npm run test:run`, `npm run test:coverage` |
| `docs/agent/coding-standards.md` | Remove “deferred in v1” for test frameworks; add colocation and RTL conventions |
| `docs/agent/architecture.md` | Change “formal tests deferred to v2” to point at `docs/unit-testing/plan.md` |
| `docs/01-create-game/progress.md` | Check “Automated unit tests”; add milestone note |
| `AGENTS.md` | Add `npm test` to Commands; remove tests from “do not add unless requested” |

---

## CI integration (recommended)

Add a test step to any existing GitHub Actions workflow (or create `.github/workflows/test.yml`):

```yaml
- run: npm ci
- run: npm run test:run
- run: npm run build
```

Run `test:run` before `build` so failing tests fail fast. Coverage upload (Codecov, etc.) is optional for v1.

---

## Commit strategy on `add-test-coverage`

Suggested commit sequence (user may squash at merge):

1. `chore: add vitest and testing-library tooling`
2. `test: add shared fixtures, MSW handlers, and render helpers`
3. `test: cover game engine and board helpers`
4. `test: cover data validation and persistence modules`
5. `test: cover play and manage UI components`
6. `docs: document test workflow and mark automated tests complete`

All work stays on `add-test-coverage` until the user opens a PR to merge.

---

## Definition of done

The testing initiative is complete when:

1. All checkboxes in [Success criteria](#success-criteria) are satisfied
2. `npm run test:run` and `npm run build` pass locally
3. Engine tests document every rule in the [Game domain](../agent/game-domain.md) scoring table (correct, incorrect, steal, all miss, completion, ties)
4. A developer can add a new clue validation rule with a single new row in a table-driven test
5. No game-rule logic is tested only through UI — UI tests assert wiring; engine tests assert rules

---

## Appendix: example engine test sketch

```typescript
import { describe, it, expect } from 'vitest'
import { createGame, selectClue, openBuzz, buzz, judgeAnswer } from './engine'
import { createTestBoard, createTestConfig, getClueId } from '../test/fixtures/board'

describe('judgeAnswer — incorrect', () => {
  it('does not change scores and enables steal for remaining players', () => {
    const board = createTestBoard()
    const config = createTestConfig(3)
    let state = createGame(config, board)
    const clueId = getClueId(board, 0, 0)

    state = selectClue(state, clueId)
    state = openBuzz(state)
    state = buzz(state, 0)
    const scoresBefore = [...state.scores]
    state = judgeAnswer(state, false)

    expect(state.scores).toEqual(scoresBefore)
    expect(state.buzzState.isSteal).toBe(true)
    expect(state.buzzState.status).toBe('idle')
    expect(state.activeClueId).toBe(clueId)
  })
})
```

This pattern — fixture → explicit state transitions → assert invariants — should be used consistently across engine tests.
