# Supabase — Backlog Battle

Database schema, Row Level Security policies, and local dev config for Backlog Battle.

## Current scope (Phase 1)

The initial migration (`migrations/20260705123700_initial_schema.sql`) creates:

- `profiles` — app-specific user data, 1:1 with `auth.users`, auto-created on sign-up via trigger.
- `categories` — user-owned backlog groups (soft-deleted via `deleted_at`).
- `backlog_items` — user-owned items within a category (soft-deleted via `deleted_at`).

RLS is enabled on all three tables with owner-scoped select/insert/update/delete policies. Battle tables (`battles`, `battle_matchups`, `battle_rankings`) arrive in Phase 3 and `reminder_settings` in Phase 4 as separate migrations.

## Local development

Requires Docker and the Supabase CLI (used via `npx`, no global install needed).

```bash
# Start the local Supabase stack (Postgres, Auth, API, Studio)
npx supabase start

# Apply all migrations to the local database (drops and recreates)
npx supabase db reset
```

Local Studio is available at http://127.0.0.1:54323 once the stack is running. `npx supabase status` prints the local API URL and anon key for the app's `.env`.

## Hosted project

```bash
# One-time: link this repo to your hosted Supabase project
npx supabase link --project-ref <project-ref>

# Push pending migrations to the hosted database
npx supabase db push
```

## Adding migrations

```bash
npx supabase migration new <name>
```

This creates a timestamped file in `migrations/`. Keep migrations idempotent (`create table if not exists`, `drop policy if exists` before `create policy`, etc.) and never edit an already-applied migration — add a new one instead.
