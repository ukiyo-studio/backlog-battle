# Start Fable Build

Kick off Backlog Battle development from the documented plan. Use this when beginning implementation for the first time or after a long pause.

## Prompt to execute

You are building **Backlog Battle** from `docs/` — product spec, technical design, and agent setup already exist. No application code yet (or minimal scaffold).

### Goal

Complete **Phase 0 + Phase 1** with production-quality foundations:

- Agent infrastructure validated (this repo's `.cursor/agents/`)
- Expo app scaffolded with auth-ready navigation
- Supabase schema + RLS for profiles, categories, backlog_items
- UI foundation: themed Button, Card, Input + one prototype screen
- Verification gates passed

### Process

1. Read `docs/implementation-checklist.md`, `docs/open-decisions.md`, `docs/decisions-log.md`, and `docs/technical-design.md`.
2. Invoke `/product-planner` for Phase 0 and Phase 1 — produce execution plan.
3. **Parallel delegation** (distinct file ownership):
   - `/expo-scaffolder` — Expo + TypeScript + Expo Router + NativeWind + app layout
   - `/supabase-architect` — initial migrations + RLS
   - `/ui-prototype` — `src/components/ui/` primitives + matchup card prototype
4. Integrate Supabase auth into Expo Router (protected routes).
5. **Verification gates:**
   - `/security-auditor` on auth + schema
   - `/platform-tester` on typecheck/tests
   - `/verifier` against Phase 1 checklist
6. Commit on `cursor/<descriptive-name>-7446`, push, open PR.

### Constraints

- Match locked stack in `docs/decisions-log.md`
- Apply defaults from `docs/open-decisions.md`
- Battle domain logic only in `src/domain/` (stub OK in Phase 1)
- No scope creep

### After Phase 1

Tell the user to run `/build-phase 2` for backlog management CRUD.

## Optional: cloud execution

For long-running work without blocking local session:

```text
/in-cloud /build-phase 1
```

Use `/babysit` on the resulting PR to iterate until CI passes.
