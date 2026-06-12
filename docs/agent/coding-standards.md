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
- **Accessibility** — buttons for all actions; `type="button"` on non-submit buttons; meaningful labels on buzz buttons (player name).

```tsx
// ✅ Component calls parent handler; engine runs upstream
<button type="button" onClick={() => onBuzz(playerIndex)} disabled={!canBuzz}>
  Buzz — {player.name}
</button>
```

## File and naming conventions

| Kind | Convention | Example |
|------|------------|---------|
| Components | `PascalCase.tsx` | `JeopardyBoard.tsx` |
| Utilities / data / game | `camelCase.ts` | `loadBoard.ts`, `engine.ts` |
| Types module | `game.ts` in `types/` | `src/types/game.ts` |
| CSS | `App.css` + component classes | BEM-like or semantic class names |

## Styling

- Global layout and theme in `App.css`.
- Jeopardy aesthetic: dark blue background, gold accents, high-contrast board cells.
- Responsive board from Phase 7 — scroll or scale on narrow viewports.
- Avoid inline styles except for dynamic values (e.g., grid position).

## Error handling

- **Data load failures** — show user-visible message; do not crash the app.
- **Validation errors** — in Manage Game, show field-level or summary errors before save.
- **Corrupt save file** — graceful fallback to menu with error message.
- **Engine invalid actions** — engine should no-op or return unchanged state; UI disables invalid actions proactively.

## Dependencies

- Minimize new packages — v1 uses React + Vite only.
- Do not add routing, state management libraries, or CSS frameworks unless the user requests them.
- Do not add test frameworks until explicitly requested (deferred in v1).

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
