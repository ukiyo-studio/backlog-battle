# Supabase — Backlog Battle

Database schema, Row Level Security policies, and local dev config for Backlog Battle.

## Current scope (Phase 4)

- `migrations/20260705131203_initial_schema.sql` — creates `profiles` (app-specific user data, 1:1 with `auth.users`, auto-created on sign-up via trigger), `categories` (user-owned backlog groups, soft-deleted via `deleted_at`), and `backlog_items` (user-owned items within a category, soft-deleted via `deleted_at`).
- `migrations/20260705131305_revoke_function_execute.sql` — revokes PostgREST RPC access to trigger functions.
- `migrations/20260705144712_phase2_hardening.sql` — backlog item insert/update policies now verify the referenced category belongs to the same user, and length CHECK constraints guard user-supplied text columns.
- `migrations/20260706210000_battle_tables.sql` — creates `battles` (owner-scoped knockout battles with a `participant_item_ids` snapshot), `battle_matchups` (per-round pairings with winner tracking), and `battle_rankings` (final per-battle rankings), all RLS-gated by battle ownership.
- `migrations/20260706220000_reminder_settings.sql` — creates `reminder_settings` (user reminder preferences; MVP uses global rows with `category_id IS NULL`) and `push_tokens` (Expo push tokens per device), both RLS-gated by `user_id`.
- `migrations/20260706220100_phase4_hardening.sql` — reminder_settings policies verify category ownership when `category_id` is set; caps push token length.

RLS is enabled on all tables with owner-scoped select/insert/update/delete policies.

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

## Reminders (Phase 4)

### MVP behavior

- Reminders are **global only**: one row per user with `category_id IS NULL` (enforced by partial unique index).
- `category_id` is nullable for future per-category reminders; the app does not use it in MVP.
- Users register device tokens in `push_tokens`; preferences live in `reminder_settings`.

### Edge Function: `process-reminders`

Hourly scheduled job that finds due reminders, sends Expo push notifications, prunes invalid tokens, and advances `next_reminder_at`.

**Deploy:**

```bash
npx supabase functions deploy process-reminders
```

**Secrets** (hosted Dashboard → Edge Functions → Secrets, or CLI):

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | auto | Injected by Supabase at runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | auto | Injected by Supabase at runtime |
| `EXPO_ACCESS_TOKEN` | optional | Expo push API bearer token for higher rate limits |
| `CRON_SECRET` | **recommended** | Shared secret; cron must send `Authorization: Bearer <CRON_SECRET>`. Function returns 401 without it when set. |

Set secrets:

```bash
npx supabase secrets set EXPO_ACCESS_TOKEN=<your-expo-access-token>
npx supabase secrets set CRON_SECRET=<random-long-secret>
```

**Local invoke** (after `npx supabase start`):

```bash
npx supabase functions serve process-reminders
curl -i --request POST 'http://127.0.0.1:54321/functions/v1/process-reminders' \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Hourly cron (hosted)

Supabase does not define cron schedules in `config.toml`. Configure an hourly job in the **Supabase Dashboard** (Integrations → Cron) or via `pg_cron` + `pg_net`:

1. Enable `pg_cron` and `pg_net` extensions if not already enabled.
2. Create a cron job that POSTs to `/functions/v1/process-reminders` every hour (`0 * * * *`).
3. Store the project URL and anon/service key in Vault; pass them in the `Authorization` / `apikey` headers.

`config.toml` sets `verify_jwt = false` for `process-reminders` so pg_cron can invoke it without a user session. **Always set `CRON_SECRET`** and pass it from the cron job — the function rejects unauthenticated requests when the secret is configured.

Example SQL (adjust URL and key via Vault in production):

```sql
select cron.schedule(
  'process-reminders-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/process-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```
