# Build Phase

Orchestrate Backlog Battle implementation for a specific phase using Fable and project subagents.

## Usage

```text
/build-phase 1
/build-phase 2
/build-phase 0
```

Replace the number with the target phase (0–5). See `docs/implementation-checklist.md` for scope.

## Your role (Fable orchestrator)

You are the **integrator**, not the sole implementer. Delegate bounded work to subagents, merge results, and gate every PR with readonly verification.

## Required reading (read before delegating)

1. `docs/implementation-checklist.md` — acceptance criteria for the target phase
2. `docs/open-decisions.md` — locked defaults
3. `docs/decisions-log.md` — stack and UI decisions
4. `docs/technical-design.md` — architecture reference

## Workflow

### Step 1 — Plan

Invoke `/product-planner` (readonly) for the target phase. Use its output as the execution plan.

If the user has not confirmed open decisions marked "needs confirmation", propose defaults from `docs/open-decisions.md` and proceed unless they object.

### Step 2 — Delegate in parallel (when safe)

Assign **file ownership** before launching parallel subagents. Never let two subagents edit the same files simultaneously.

| Phase | Typical parallel delegation |
|-------|----------------------------|
| 0 | `ui-prototype` (theme spike) — optional alongside planning |
| 1 | `expo-scaffolder` + `supabase-architect` + `ui-prototype` (different paths) |
| 2 | categories feature + backlog-items feature + schemas (separate `src/features/` dirs) |
| 3 | `battle-engine` first (domain + tests), then persistence, then battle UI |
| 4 | reminders (background/cloud OK) + polish passes |
| 5 | `security-auditor` + `platform-tester` + release config |

Use explicit subagent invocation:

```text
/expo-scaffolder scaffold Phase 1 foundation per plan
/supabase-architect create initial migrations per data model
```

Or natural language: "Use the battle-engine subagent to implement src/domain/ with tests."

### Step 3 — Integrate

After subagents return:

- Resolve merge conflicts and shared interfaces (`src/types/`)
- Wire features together (navigation, auth guards, data layer)
- Commit on branch `cursor/<descriptive-name>-7446`

### Step 4 — Verify (mandatory before PR)

Run readonly gates in order:

1. `/security-auditor` — if auth, Supabase, or user data touched
2. `/platform-tester` — run tests, typecheck, lint
3. `/verifier` — check phase acceptance criteria line by line

If any gate fails, assign fixes to the appropriate implementer subagent and re-run verification.

### Step 5 — PR

- Push branch
- Open or update PR with phase checklist copied into description
- Use `/babysit` on cloud for CI iteration if needed

## Phase summary

| Phase | Name | Primary subagents |
|-------|------|-------------------|
| 0 | Agent & UI spike | `product-planner`, `ui-prototype` |
| 1 | App foundation | `expo-scaffolder`, `supabase-architect`, `ui-prototype` |
| 2 | Backlog management | feature implementers + `supabase-architect` |
| 3 | Battle MVP | `battle-engine`, `supabase-architect`, `ui-prototype` |
| 4 | Reminders & polish | `expo-scaffolder`, `supabase-architect`, `ui-prototype` |
| 5 | Release readiness | `security-auditor`, `platform-tester`, `verifier` |

## Constraints (all phases)

- Stack: Expo + TypeScript + Expo Router + Supabase + NativeWind + React Native Reusables
- Battle logic stays pure in `src/domain/`
- No MVP scope creep: no Steam/Goodreads imports, social features, AI recommendations
- Subagents for multi-step work; skills for one-shot tasks (format, changelog)

## Model guidance

- **Fable (you):** architecture, integration, verification coordination, complex debugging
- **`fast` subagents:** explore, search, test runs, repetitive checks
- **`inherit` subagents:** implementation requiring same reasoning depth as parent

Reserve Fable xhigh effort for Phase 3 battle integration and cross-platform UI validation.
