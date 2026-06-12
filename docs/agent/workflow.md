# Agent Workflow

How AI agents should plan, implement, and validate work in this repository.

## Phased development

This project is intentionally built in **7 phases** (plus Phase 0 scaffold). Each phase has:

- A defined scope in [`../01-create-game/implementation-plan.md`](../01-create-game/implementation-plan.md)
- Validation steps (usually `npm run build` + manual browser checks)
- Checklist items in [`../01-create-game/progress.md`](../01-create-game/progress.md)

### Default behavior

1. **Read first** — `spec.md` before any code; implementation plan before the current phase.
2. **Branch first** — create a feature branch for the phase; never work on `master`.
3. **One phase per session** — unless the user explicitly asks for multiple phases.
4. **No scope creep** — defer items listed under "Out of scope" in `spec.md` and "Deferred / future" in `progress.md`.
5. **Commit as you go** — on the feature branch, in logical chunks; do not wait until the end of the phase.
6. **Validate before done** — run commands listed in the phase; fix errors before reporting completion.
7. **Update progress** — check off items and add a dated note under "Milestone notes".
8. **Stop and wait** — after completing a phase, summarize what was done and wait for the user.

### When the user gives a free-form request

If the user asks for something outside the phased plan (e.g., "add a timer"):

- Check whether it is in scope per `spec.md`.
- If out of scope, confirm with the user or note it as a future enhancement.
- If in scope but not in the current phase, prefer completing pending phases first unless the user overrides.

## Architecture patterns

When implementing persistence, navigation, or save/load, follow the conventions in [`architecture.md`](architecture.md) and [`../01-create-game/spec.md`](../01-create-game/spec.md). All paths are relative to this repository root.

## Progress tracking

After completing a phase, update `progress.md`:

```markdown
### 2026-06-11 — Phase 1 complete
- Sidebar with Play Game / Manage Game; placeholder views; build passes.
```

Check every item in that phase's checklist. Set "Last updated" at the top of `progress.md`.

## Git, branches, and commits

### Branches

- **Never work directly on `master`.** Before writing code for a phase, create a feature branch from `master`.
- Use a descriptive branch name tied to the phase or task, e.g. `phase-1-app-shell`, `phase-3-game-engine`, `feature/manage-game-editor`.
- One feature branch per phase is typical; stay on it until the phase is complete.

```bash
git checkout master
git pull                    # if a remote exists and is configured
git checkout -b phase-1-app-shell
```

### Commits

- **Never commit on `master`.** All commits belong on a feature branch.
- **Commits on feature branches do not require user permission.** Commit as you make progress.
- **Split work into reasonable chunks** — e.g. data layer, then engine, then UI wiring — rather than one large commit at phase end. You decide the split; each commit should represent a coherent unit of work.
- **Commit messages** should clearly explain *what changed and why*, in plain language. Aim for one or two sentences; avoid walls of text and avoid bare messages like "fix" or "updates".
- **Do not push** unless the user explicitly requests it.
- **Do not merge to `master`** unless the user explicitly requests it.

```bash
# ✅ Good — descriptive, scoped
git commit -m "Add sidebar navigation with Play Game and Manage Game views"

# ✅ Good — explains why
git commit -m "Validate board.json on load so invalid 6×5 layout shows a clear error"

# ❌ Too vague
git commit -m "updates"

# ❌ Unnecessarily long
git commit -m "This commit adds a comprehensive overhaul of the entire application including..."
```

## Interactive commands

Avoid interactive CLI prompts that block agents:

- `npm create vite@latest` — already done in Phase 0; user runs manually if needed.
- Git commands with `-i` flags — not supported in agent environments.

## Reporting completion

A good phase completion summary includes:

1. Phase number and name
2. Files created or modified (brief)
3. Validation results (`npm run build`, manual test outcome)
4. What the user should verify in the browser
5. Reminder that the next phase waits on their go-ahead
