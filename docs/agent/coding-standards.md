# Coding Standards

Project-specific conventions beyond default React/TypeScript practices.

## TypeScript

- **Strict typing** — no `any`, `@ts-ignore`, or `@ts-expect-error` without a comment explaining why.
- **Unused code** — `noUnusedLocals` and `noUnusedParameters` are enabled; remove dead code.
- **Type-only imports** — use `import type { Foo } from './foo'` when importing types only (`verbatimModuleSyntax`).
- **Enums** — prefer string literal unions or `as const` objects over TypeScript enums.
- **Exports** — export types from `src/types/game.ts`; keep component prop types colocated or in the same file.

```typescript
// ✅ Preferred
import type { GameState } from '../types/game';

export type BuzzPanelProps = {
  state: GameState;
  onBuzz: (playerIndex: number) => void;
};

// ❌ Avoid
import { GameState } from '../types/game'; // type-only import required
```

## React

- **Functional components only** — use hooks for state and effects.
- **State ownership** — game state in `App.tsx` (or a dedicated hook); components stay presentational where possible.
- **Immutability** — when updating game state, always use engine return values; never mutate state in place.
- **Keys** — use stable IDs (`clue.id`, `player.id`) for list keys, not array indices.
- **Event handlers** — name as `handleX` / `onX` consistently; pass indices or IDs, not DOM events, to engine calls.
- **Accessibility** — use MUI components (built-in ARIA where applicable); meaningful labels on buzz buttons (player name).

```tsx
// ✅ MUI button calls parent handler; engine runs upstream
<Button variant="contained" onClick={() => onBuzz(playerIndex)} disabled={!canBuzz}>
  Buzz — {player.name}
</Button>
```

## File and naming conventions

| Kind | Convention | Example |
|------|------------|---------|
| Components | `PascalCase.tsx` | `JeopardyBoard.tsx` |
| Utilities / data / game | `camelCase.ts` | `loadBoard.ts`, `engine.ts` |
| Types module | `game.ts` in `types/` | `src/types/game.ts` |
| Theme | `theme.ts` at `src/` | `src/theme.ts` |

## Styling (Material UI)

- **Use MUI for all UI** — layout (`Box`, `Stack`, `Grid`, `Drawer`), inputs (`TextField`, `Select`), actions (`Button`, `IconButton`), surfaces (`Paper`, `Card`), feedback (`Alert`, `Snackbar`), typography (`Typography`).
- **Central theme** — define colors, typography, and component overrides in `src/theme.ts` via `createTheme`. Jeopardy aesthetic: dark blue background, gold accents, high-contrast board cells.
- **Prefer `sx` and theme tokens** over custom CSS files. Use the theme palette (e.g. `primary`, `secondary`, custom keys) instead of hard-coded hex values in components.
- **CssBaseline** — include in `main.tsx` for consistent MUI baseline styles.
- **Responsive layout** — use MUI breakpoints and `useMediaQuery` (Phase 7); board should remain usable on narrow viewports.
- **Custom CSS** — only when MUI theming is insufficient; do not add another CSS framework.

```tsx
// ✅ Theme-aware styling
<Box sx={{ bgcolor: 'primary.dark', p: 2, borderRadius: 1 }}>
  <Typography variant="h5" color="secondary.main">{category.title}</Typography>
</Box>
```

## Error handling

- **Data load failures** — show user-visible message; do not crash the app.
- **Validation errors** — in Manage Game, show field-level or summary errors before save.
- **Corrupt save file** — graceful fallback to menu with error message.
- **Engine invalid actions** — engine should no-op or return unchanged state; UI disables invalid actions proactively.

## Dependencies

- **Material UI** — required for all UI (`@mui/material`, `@emotion/react`, `@emotion/styled`). Optional: `@mui/icons-material`.
- Do not add routing or state management libraries unless explicitly requested.
- Do not add another CSS framework or component library alongside MUI.

## Testing

- **Vitest** + **React Testing Library** for unit and component tests; **MSW** mocks `fetch` for data-layer tests.
- Colocate tests as `*.test.ts` / `*.test.tsx` next to source (e.g. `src/game/engine.test.ts`).
- Shared helpers live under `src/test/` (`renderWithTheme`, fixtures, MSW handlers).
- Prefer role/label queries (`getByRole`, `getByLabelText`) over test IDs.
- Game rules belong in `src/game/` tests; UI tests assert wiring and disabled states, not scoring logic.
- Run `npm run test:run` before finishing work that touches engine, data validation, or tested components.
- Coverage thresholds (enforced on `npm run test:coverage`): `src/game/**` ≥ 95%, `src/data/**` ≥ 90%.

Full testing plan: [`docs/02-add-test-coverage/plan.md`](../02-add-test-coverage/plan.md).

## ESLint

Config: `eslint.config.js` (flat config).

- Run `npm run lint` before finishing Phase 7+ work.
- Fix lint errors in files you touch; do not drive large unrelated lint refactors.

## Code change discipline

- **Smallest correct diff** — only code required for the current phase.
- **No premature abstraction** — one hook or helper is fine; avoid framework-like layers.
- **Comments** — only for non-obvious business rules (steal logic, selector tie-break); not for obvious code.
- **Match existing style** — indentation, quotes, and import order consistent with neighboring files.

## Examples to follow (after implementation)

Once phases land, treat these as canonical:

- `src/game/engine.ts` — pure functions, immutable updates
- `src/data/loadBoard.ts` — validation + typed return
- `src/components/JeopardyBoard.tsx` — props down, events up
