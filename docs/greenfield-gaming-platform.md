# Gaming Library Platform — Greenfield Project Brief

Use this document to bootstrap a **new** gaming-focused product (separate from Backlog Battle). It captures product vision, modular architecture, data sketch, tech recommendations, and a build order.

**Status:** Planning brief  
**Relationship to Backlog Battle:** Parallel / replacement product. Do not evolve the existing generic entertainment backlog schema into this. Start a new repo (or a clean rewrite) and optionally port the battle/tournament domain later as a Decision module.

---

## 1. One-line pitch

A cross-platform game library and backlog manager with a living game catalog, release radar, and pluggable modules for store sync, news, and reviews.

## 2. Problem

Gamers own and play games across Steam, PlayStation, Xbox, Nintendo, and more. Their “library” is fragmented across storefronts. Tracking what they own, what they’ve finished, what’s sitting unplayed, and what’s coming next usually means spreadsheets, multiple apps, or nothing at all.

Existing tools are incomplete for a web + mobile audience:

| Product | Gap |
| --- | --- |
| Playnite | Desktop-first; weak as a living web/mobile companion |
| Backloggd | Strong social diary; weaker as cross-store library sync |
| Steam / console UIs | Single-platform |
| HowLongToBeat / GG.deals | Excellent at one job; not a full library OS |

## 3. Product principles

1. **Games are first-class** — not generic “backlog items.”
2. **Core + plugins** — platform and content sources are modules with contracts.
3. **Honest integrations** — if an API can’t provide ownership, say so in the UI.
4. **Catalog is shared knowledge** — one canonical game graph; personal libraries hang off it.
5. **Ship block by block** — each module should be useful alone and better together.
6. **Web + mobile** — same product; web carries SEO (game pages, release calendar).

## 4. Non-goals (initial)

- Becoming a full social network
- Rebuilding Metacritic / a review publication
- Price tracking / deals marketplace (optional later module)
- Emulation / DRM-free launcher (Playnite territory)
- Movies, books, anime as equal citizens (this product is gaming-only)

---

## 5. Architecture overview

```text
┌─────────────────────────────────────────────────────────┐
│  App shell (web + iOS + Android)                        │
│  auth · navigation · settings · entitlements            │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  CORE DOMAIN                                            │
│  Game · LibraryEntry · PlaySession · List · UserPrefs   │
│  Identity resolution (canonical game IDs)               │
└───────┬──────────┬──────────┬──────────┬────────────────┘
        │          │          │          │
   ┌────▼───┐ ┌────▼───┐ ┌────▼───┐ ┌────▼────┐
   │Catalog │ │Library │ │Release │ │Decision │
   │module  │ │module  │ │module  │ │(battles)│
   └────┬───┘ └────┬───┘ └────────┘ └─────────┘
        │          │
   ┌────▼──────────▼──────────────────────────────────────┐
   │ PLATFORM ADAPTERS (plugins)                          │
   │ steam · xbox · playstation · nintendo · manual/csv   │
   └──────────────────────────────────────────────────────┘
        │
   ┌────▼──────────┬──────────────┐
   │ News module   │ Reviews module│
   └───────────────┴──────────────┘
```

**Rule:** Adapters talk to external APIs. Core stores only **normalized** games and library state. Feature UI depends on core types, never on Steam app IDs (except inside the Steam plugin).

### Suggested monorepo layout

```text
apps/web                      # Next.js (SEO, catalog, calendar)
apps/mobile                   # Expo (library, sync, notifications)
packages/core                 # Domain types + pure logic
packages/db                   # Schema, migrations, typed client
packages/ui                   # Shared design system
packages/adapters-steam
packages/adapters-xbox
packages/adapters-playstation
packages/adapters-nintendo
packages/adapters-manual
packages/catalog-igdb
packages/news-rss
packages/reviews-opencritic
```

### Platform adapter contract

Every store plugin implements the same interface (TypeScript sketch):

```ts
export type PlatformId =
  | "steam"
  | "xbox"
  | "playstation"
  | "nintendo"
  | "manual";

export interface PlatformCapabilities {
  ownedLibrary: boolean;
  playtime: boolean;
  wishlist: boolean;
  official: boolean; // false → show “unofficial / limited” in UI
}

export interface RawLibraryItem {
  externalId: string;
  title: string;
  platformHint?: string;
  playtimeMinutes?: number;
  lastPlayedAt?: string; // ISO
  coverUrl?: string;
  raw?: Record<string, unknown>;
}

export interface PlatformAdapter {
  id: PlatformId;
  capabilities: PlatformCapabilities;
  connect(userId: string): Promise<{ accountId: string }>;
  disconnect(accountId: string): Promise<void>;
  fetchLibrary(accountId: string): Promise<RawLibraryItem[]>;
  fetchPlayActivity?(accountId: string): Promise<RawLibraryItem[]>;
}
```

Register adapters in a module registry so the shell can enable them via feature flags without rewriting core.

---

## 6. Modules

### 6.1 Catalog (games knowledge)

**Job:** What is this game, on which platforms, when does it release?

| Concern | Recommendation |
| --- | --- |
| Source of truth | **IGDB** (structured platforms, releases, covers, companies) |
| Secondary IDs | Steam, Xbox, PSN, Nintendo, OpenCritic, RAWG as external keys |
| Serving | Local Postgres mirror + search; do not hit IGDB on every page view |

**Owns:** game search, game detail pages, matching imported titles → canonical `game_id`.

### 6.2 Library (ownership + play + backlog)

**Job:** What do *I* own, play, finish, or backlog?

Personal state hangs off canonical games. Import flows preview/filter before dumping huge libraries into the backlog.

Suggested entry statuses (lock one model before coding):

```text
owned | playing | finished | abandoned | wishlist | backlog
```

Alternative: `owned` + separate `backlog` flag. Prefer a **single status enum** for v1 simplicity.

### 6.3 Platform adapters

| Adapter | Realistic v1 | Notes |
| --- | --- | --- |
| Steam | Owned library + playtime | Official Web API; require public game details (or clear UX) |
| Xbox | Title history / played | Not full digital ownership for consumer apps |
| PlayStation | Defer or advanced/unofficial | No public consumer library API; NPSSO-based wrappers are fragile / ToS-risky |
| Nintendo | Manual / CSV / search-add | No usable public library API |
| Manual | Always on | Catalog search → add to library |

UI must show capability badges: **Official sync** vs **Limited / manual**.

### 6.4 Releases & wishlist timeline

**Job:** What’s coming out, and what am I hyped for?

- Calendar / list by week, month, platform
- Personal wishlist + “most anticipated” ordering
- Notifications: releasing soon, date changed, delayed

Strong **web** surface (shareable / SEO) and later mobile push.

### 6.5 News

**Job:** What’s happening about games I care about?

Phased sources:

1. Steam news for owned/wishlisted apps (`ISteamNews`)
2. RSS ingest (Eurogamer, RPS, Polygon, Nintendo Life, etc.) matched to `game_id`
3. Optional commercial news APIs later

Personal feed = news linked to library ∪ wishlist.

### 6.6 Reviews & scores

**Job:** Quick signal before buying or playing.

- Prefer **OpenCritic** (official API) + IGDB ratings
- Avoid Metacritic scraping as a foundation
- Store snapshots + link out to full articles; do not become a review site in v1

### 6.7 Decision (optional, later)

**Job:** What should I play tonight?

Port Backlog Battle’s knockout tournament logic onto `library_entries` with `status = backlog`. Ship as a plugin after the library feels solid.

---

## 7. Data model sketch

```text
profiles
  id uuid pk → auth.users
  display_name text
  created_at / updated_at

games
  id uuid pk
  slug text unique
  title text not null
  summary text
  cover_url text
  igdb_id bigint unique
  status text              -- released, early_access, cancelled, …
  created_at / updated_at

game_platforms
  game_id → games
  platform text            -- pc, ps5, xbox_series, switch, …
  unique (game_id, platform)

game_releases
  id uuid pk
  game_id → games
  platform text
  region text nullable
  release_date date nullable
  date_precision text      -- day | month | year | tbd
  release_status text      -- official | delayed | cancelled | …

game_external_ids
  game_id → games
  provider text            -- steam | xbox | psn | nintendo | opencritic | rawg
  external_id text
  unique (provider, external_id)

linked_accounts
  id uuid pk
  user_id → auth.users
  provider text
  external_user_id text
  display_name text
  encrypted tokens / refresh metadata
  status text
  last_synced_at timestamptz
  last_error text
  unique (user_id, provider)

library_entries
  id uuid pk
  user_id → auth.users
  game_id → games
  status text              -- owned | playing | finished | abandoned | wishlist | backlog
  ownership_source text    -- steam | xbox | … | manual
  playtime_minutes int
  last_played_at timestamptz
  finished_at timestamptz
  personal_rating int nullable
  notes text
  external_provider text nullable
  external_id text nullable
  unique (user_id, game_id)           -- one row per user+game in v1
  unique (user_id, external_provider, external_id) where external_id is not null

import_jobs
  id uuid pk
  user_id → auth.users
  provider text
  status text              -- queued | running | completed | failed
  filter_snapshot jsonb
  stats jsonb              -- fetched, imported, skipped, failed
  created_at / completed_at

news_items
  id uuid pk
  title text
  url text unique
  source text
  summary text
  published_at timestamptz

news_game_links
  news_id → news_items
  game_id → games
  confidence real

review_snapshots
  game_id → games
  provider text            -- opencritic | igdb
  score numeric
  tier text nullable
  sample_size int nullable
  fetched_at timestamptz
  unique (game_id, provider)
```

All user-owned tables use **RLS** (owner-scoped). Catalog tables are readable by authenticated (or public for SEO-facing web).

---

## 8. App information architecture

| Area | Screens |
| --- | --- |
| Home | Continue playing · backlog suggestion · releasing soon · news for you |
| Library | Filters: platform, status, playtime, genre · Import CTA |
| Game | Cover, platforms, releases, your status, scores, news, reviews |
| Timeline | Release calendar + wishlist |
| Discover | Search, popular, coming soon by platform |
| Connect | Linked accounts + last sync + capability badges |
| Decide | Battle / play-next (Phase 8) |

**Brand:** Gaming-first from the first viewport (covers, platforms, atmosphere). Not a generic productivity shell.

---

## 9. Recommended tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Web | Next.js (App Router) + Vercel | SEO for game/release pages |
| Mobile | Expo + Expo Router | Shared TS types; native sync/notifications |
| Backend | Supabase (Auth, Postgres, RLS, Edge Functions) | Fast auth + data + cron/secrets |
| Language | TypeScript everywhere | Shared core between web/mobile/workers |
| Catalog ingest | Scheduled worker (Edge Function or separate job) | Mirror IGDB; cache aggressively |
| Analytics | PostHog | Product events |
| Errors | Sentry | Crash/reporting |
| Validation | Zod | Shared schemas at module boundaries |

Secrets (Steam key, OAuth clients, IGDB/Twitch credentials, OpenCritic key) live **server-side only**.

---

## 10. Build phases

### Phase 0 — Skeleton
- Monorepo, auth, app shell, module registry, feature flags
- Empty Connect / Library / Discover routes

### Phase 1 — Catalog + manual library (first shippable product)
- IGDB ingest + search + game pages
- Manual add with statuses + covers + platform badges
- Feels like a game library **before** any store sync

### Phase 2 — Steam adapter
- OpenID link → `GetOwnedGames` → map to catalog
- Preview + filters (e.g. unplayed / low playtime)
- Re-sync + unlink
- Privacy UX: Game details must be Public (document clearly)

### Phase 3 — Releases & wishlist
- Timeline from `game_releases`
- Wishlist + release reminders

### Phase 4 — Xbox adapter
- Title history / played import
- Honest copy: not full ownership

### Phase 5 — News
- Steam news for library/wishlist games
- RSS matching pass

### Phase 6 — Reviews
- OpenCritic snapshots on game pages

### Phase 7 — PlayStation / Nintendo
- Nintendo: manual + CSV
- PlayStation: defer, partnership, or clearly labeled advanced/unofficial beta

### Phase 8 — Decision module
- Port tournament/battle loop onto backlog entries

### Lean MVP cut

If scope must shrink, ship only:

1. Catalog (IGDB) + game pages  
2. Manual library + backlog statuses  
3. Steam import  
4. Release timeline + wishlist  

---

## 11. Platform integration notes (research summary)

### Steam (build first)
- Official: `IPlayerService/GetOwnedGames` (+ app info, playtime)
- Auth: Steam OpenID → SteamID64
- Constraint: third-party API keys only see libraries with **public** game details
- Keep Web API key on the server; rate limit ~100k/day/key

### Xbox
- Full Collections/Inventory APIs are publisher/Partner Center oriented
- Consumer path ≈ title history (played), via Microsoft OAuth + XSTS or a proxy (e.g. OpenXBL)
- Product copy must not promise “complete owned library”

### PlayStation
- No official public consumer library API
- Community wrappers use NPSSO ≈ password; ToS and breakage risk
- Default recommendation: **defer** for production

### Nintendo
- No usable public library API for third-party apps
- Manual search-add + optional CSV import formats

### Catalog / reviews / news sources
- Catalog: IGDB primary; RAWG optional enrichment
- Reviews: OpenCritic API; IGDB scores as fallback
- News: Steam `ISteamNews` + RSS; match to `game_id`

---

## 12. Open decisions (lock before implementation)

Copy into `docs/open-decisions.md` in the new repo and mark each Locked / Needs confirmation.

| ID | Decision | Suggested default |
| --- | --- | --- |
| OD-G01 | Web-first vs mobile-first | Web + catalog SEO first; Expo follows |
| OD-G02 | Canonical catalog provider | IGDB |
| OD-G03 | Library status model | Single status enum |
| OD-G04 | Steam privacy policy | Require public game details + helper UX |
| OD-G05 | Xbox promise | “Played / title history,” not full ownership |
| OD-G06 | PlayStation in v1 | Defer |
| OD-G07 | Nintendo in v1 | Manual / CSV only |
| OD-G08 | Battles in MVP | No — Phase 8 |
| OD-G09 | Product name / brand | Needs confirmation |
| OD-G10 | Relationship to Backlog Battle repo | New repo; optional later port of battle domain |

---

## 13. Bootstrap checklist for the new repo

1. Create empty repo with this brief as `README.md` (or `docs/PRODUCT.md` + short README).
2. Initialize monorepo (`apps/web`, `apps/mobile`, `packages/*`).
3. Add Supabase project + `packages/db` migrations for Phase 1 tables.
4. Wire IGDB (Twitch) credentials into server env.
5. Implement Catalog search + Game page + Manual library (Phase 1).
6. Add Steam adapter behind a feature flag (Phase 2).
7. Keep a living `docs/open-decisions.md` and `docs/implementation-checklist.md`.

### Suggested first commits

1. Repo scaffold + this brief  
2. Auth + empty shells  
3. `games` / `library_entries` schema + RLS  
4. IGDB sync worker + search UI  
5. Manual library CRUD  
6. Steam connect + import preview  

### Env vars to plan for

```text
# App
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Server only
SUPABASE_SERVICE_ROLE_KEY=
IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=
STEAM_WEB_API_KEY=
STEAM_OPENID_REALM=
STEAM_OPENID_RETURN_URL=
OPENCRITIC_RAPIDAPI_KEY=          # when Reviews module starts
MICROSOFT_CLIENT_ID=              # when Xbox starts
MICROSOFT_CLIENT_SECRET=
```

---

## 14. Success metrics (early)

- User can find a game and add it to their library in under a minute
- Steam users can import and filter a library without duplicates
- Wishlist + release calendar drives return visits
- Module boundaries stay clean: adding Xbox does not change Catalog or Game page contracts

---

## 15. What to port from Backlog Battle (optional)

| Port later | Do not carry over as core |
| --- | --- |
| Battle domain logic (`battle-generator`, ranking, tests) | Generic multi-media backlog framing |
| Auth / RLS patterns | Categories-as-primary model |
| Reminder / push infrastructure | Equal footing for movies/books/anime |
| Retro UI ideas (if on-brand) | Current phase checklist tied to entertainment MVP |

---

## 16. Next actions

1. Lock product name (OD-G09) and open decisions above.
2. Create the new repository.
3. Paste this brief into the new repo.
4. Execute Phase 0 → Phase 1 until manual library + catalog feels right.
5. Only then enable Steam (Phase 2).

When in doubt: **catalog + personal library first, adapters second, media modules third, battles last.**
