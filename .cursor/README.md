# Backlog Battle — Cursor Agent Setup

This folder configures **Fable** (or any Cursor Agent) to build Backlog Battle using specialized subagents.

## Quick start

1. Open Cursor Agent with **Claude Fable 5** (high thinking recommended for orchestration).
2. Run the kickoff command:

   ```text
   /start-fable-build
   ```

   Or begin a specific phase:

   ```text
   /build-phase 1
   ```

3. Fable reads docs, invokes `/product-planner`, delegates to implementers, and gates PRs with `/verifier` and `/security-auditor`.

## Subagents

| Agent | Purpose | Readonly |
|-------|---------|----------|
| `product-planner` | Phase execution plans | Yes |
| `expo-scaffolder` | Expo + Router + NativeWind scaffold | No |
| `supabase-architect` | Schema, migrations, RLS | No |
| `battle-engine` | Pure TS tournament logic + tests | No |
| `ui-prototype` | Themed UI components | No |
| `platform-tester` | Tests, typecheck, cross-platform | No |
| `security-auditor` | Auth + RLS audit | Yes |
| `verifier` | Skeptical acceptance testing | Yes |

Invoke explicitly: `/verifier confirm Phase 1 is complete`

Built-in subagents (`explore`, `bash`, `browser`) are used automatically for search, commands, and E2E checks.

## Key docs

| Doc | Use |
|-----|-----|
| `docs/implementation-checklist.md` | Definition of done per phase |
| `docs/open-decisions.md` | Locked defaults for ambiguous spec |
| `docs/technical-design.md` | Architecture, data model, algorithms |
| `docs/decisions-log.md` | Stack and UI decisions |

## Workflow pattern

```text
You → Fable (/build-phase N)
        → /product-planner (plan)
        → parallel implementers (owned file paths)
        → Fable integrates
        → /security-auditor + /platform-tester + /verifier
        → PR (/babysit optional)
```

## Parallel work rules

- Assign **file ownership** before parallel subagents
- Never edit the same files in parallel
- Shared types only via `src/types/` — Fable merges
- Battle logic only in `src/domain/` via `battle-engine`

## Cloud agents

- `/in-cloud /build-phase 3` — long-running work on isolated VM/branch
- `/babysit` — iterate PR until CI green

## Branch naming

Use `cursor/<descriptive-name>-7446` for all agent-created branches.

## Model guidance

| Task | Model |
|------|-------|
| Orchestration, integration, Phase 3 battles | Fable (high/xhigh) |
| Explore, test runs | `fast` (platform-tester) |
| Bounded implementation | `inherit` |

Do not use Fable for one-line typo fixes — use a faster model.
