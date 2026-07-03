# Implementation Checklist

Acceptance criteria for each build phase. Fable orchestrator and `/verifier` subagent use this as the definition of done.

Reference: `docs/technical-design.md` (Implementation Phases), `docs/backlog-battle-idea.md` (MVP).

---

## Phase 0: Agent infrastructure & UI spike

**Goal:** Development workflow ready; UI direction validated on mobile + web before full build.

### Deliverables

- [ ] `.cursor/agents/` — project subagents committed (see repo)
- [ ] `.cursor/commands/` — `build-phase`, `start-fable-build`
- [ ] `docs/open-decisions.md` — defaults locked
- [ ] This checklist committed

### UI spike (recommended)

- [ ] NativeWind + theme tokens configured
- [ ] At least: Button, Card, Input in `src/components/ui/`
- [ ] Prototype: one **battle matchup** screen (playful)
- [ ] Prototype: one **category form** screen (calm, readable)
- [ ] Smoke-tested on web + one native platform (or documented gaps)

### Verifier gate

- [ ] `/product-planner` can produce Phase 1 plan without unresolved blockers

---

## Phase 1: App foundation

**Goal:** Runnable Expo app with auth shell and Supabase wired.

### Expo scaffold

- [ ] Expo project with TypeScript
- [ ] Expo Router: `app/_layout.tsx`, auth group, authenticated home
- [ ] `src/` structure per technical design
- [ ] NativeWind configured
- [ ] `src/lib/supabase.ts` with env-based config
- [ ] `.env.example` documents required variables

### Supabase

- [ ] Migrations for `profiles`, `categories`, `backlog_items`
- [ ] RLS enabled on all three tables; owner-scoped policies
- [ ] Profile created on sign-up (trigger or app logic)

### Auth

- [ ] Email/password sign up and sign in screens
- [ ] Session persisted; unauthenticated users redirected to auth
- [ ] Sign out works

### UI foundation

- [ ] Themed Button, Card, Input usable from feature screens

### Verification

- [ ] `/security-auditor` — no critical/high findings on auth + RLS
- [ ] `/platform-tester` — typecheck passes
- [ ] `/verifier` — all Phase 1 items checked

---

## Phase 2: Backlog management

**Goal:** Users can manage categories and items.

### Categories

- [ ] Create, edit, delete category
- [ ] List categories with item count
- [ ] Soft delete preserves history (`deleted_at`)

### Backlog items

- [ ] Add, edit, delete item (title, notes, type, status)
- [ ] Status values: active, completed, archived, removed
- [ ] Category detail shows items filtered by status

### UX

- [ ] Empty states for no categories / no items
- [ ] Loading and error states on CRUD operations

### Verification

- [ ] CRUD works for authenticated user only (RLS)
- [ ] `/verifier` — full category + item flow manually traceable in code

---

## Phase 3: Battle MVP

**Goal:** Core product loop — tournament battles end to end.

### Domain (`src/domain/`)

- [ ] `battle-generator.ts` — shuffle, bracket, byes
- [ ] `ranking.ts` — ordered result from completed matchups
- [ ] Unit tests: 4, 5, 10, 11 items; seeded shuffle; valid rankings

### Database

- [ ] Tables: `battles`, `battle_matchups`, `battle_rankings`
- [ ] RLS on all battle tables
- [ ] Matchup results persisted as user completes each choice

### UI flow

- [ ] Start battle from category (min 2 active items)
- [ ] One matchup at a time; pick winner
- [ ] Progress indicator (round / remaining)
- [ ] Final ranking screen
- [ ] Battle history list per category

### Verification

- [ ] `/battle-engine` tests pass
- [ ] `/verifier` — full loop: sign in → category → items → battle → ranking → history

---

## Phase 4: Reminders & polish

**Goal:** Re-engagement + production UX polish.

### Reminders

- [ ] `reminder_settings` table + RLS
- [ ] Opt-in UI; frequency: weekly, biweekly, monthly
- [ ] Expo Notifications permission flow (native)
- [ ] Scheduled job sets `next_reminder_at` and sends notification (Edge Function or equivalent)

### Polish

- [ ] Consistent empty/loading/error states app-wide
- [ ] Battle screens use themed matchup card + battle meter
- [ ] Category CRUD remains readable (not over-gamified)

### Verification

- [ ] Reminder opt-in/out persists
- [ ] `/platform-tester` — no regressions on Phases 1–3 flows

---

## Phase 5: Release readiness

**Goal:** Shippable MVP on iOS, Android, and web.

### Observability

- [ ] Sentry integrated
- [ ] PostHog events: category_created, backlog_item_created, battle_started, matchup_completed, battle_completed, ranking_viewed, reminder_enabled, reminder_opened

### Legal & store

- [ ] Privacy policy and terms links in app
- [ ] App store metadata draft (icons, screenshots, description)

### Build & deploy

- [ ] EAS Build config for iOS and Android
- [ ] Web deploy config (Vercel or Netlify)
- [ ] Production env vars documented

### Final verification

- [ ] `/security-auditor` — full schema + auth audit
- [ ] `/verifier` — MVP checklist from `docs/backlog-battle-idea.md`:
  - [ ] Create account
  - [ ] Create categories
  - [ ] Add items manually
  - [ ] Start battle
  - [ ] Head-to-head matchups
  - [ ] View final ranking
  - [ ] Save battle history
  - [ ] Periodic reminders (opt-in)

---

## MVP feature cross-reference

From `docs/backlog-battle-idea.md`:

| MVP feature | Phase |
|-------------|-------|
| Create account | 1 |
| Create backlog categories | 2 |
| Add backlog items manually | 2 |
| Start battle from category | 3 |
| Head-to-head matchups | 3 |
| View final ranking | 3 |
| Save battle history | 3 |
| Periodic reminders | 4 |

---

## How Fable uses this doc

1. `/product-planner` copies relevant phase section into execution plan
2. Implementer subagents receive only their phase section + file ownership
3. `/verifier` checks every box before PR merge
4. After phase complete, user runs `/build-phase N+1`
