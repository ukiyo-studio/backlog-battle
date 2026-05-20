# Backlog Battle Technical Design

## Overview

Backlog Battle is a cross-platform app for iOS, Android, and Web that helps users organically prioritize their entertainment and hobby backlogs through tournament-style battles.

Users add items such as games, movies, TV series, anime, books, or other media into backlog categories. The app generates matchups between those items, the user chooses winners, and the tournament produces a prioritized ranking. Over time, the app periodically prompts users to run new battles so their backlog stays fresh and rankings can evolve.

## Goals

- Ship a high-quality MVP across iOS, Android, and Web from one codebase.
- Make backlog prioritization fun, fast, and low-friction.
- Support manual backlog entry first.
- Generate tournament-style battles from user-created backlog categories.
- Persist rankings and battle history.
- Remind users periodically to revisit and re-battle their backlog.
- Keep the architecture simple enough for fast iteration while leaving room for future integrations.

## Non-Goals For MVP

- Steam, Goodreads, Letterboxd, Trakt, or other third-party imports.
- Complex recommendation algorithms.
- Social networking features.
- Public profiles.
- AI-generated summaries or recommendations.
- Advanced gamification systems.
- Multi-user shared backlogs.

## Recommended Tech Stack

### Application

- **Framework:** React Native with Expo
- **Language:** TypeScript
- **Navigation:** Expo Router
- **Web Support:** React Native Web via Expo
- **Mobile Builds:** EAS Build
- **Push Notifications:** Expo Notifications
- **State Management:** Start with local component state and lightweight shared state where needed
- **Forms:** React Hook Form or simple controlled forms depending on complexity
- **Validation:** Zod

### Backend

- **Backend Platform:** Supabase
- **Database:** Postgres
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage, if item images or custom covers are added
- **Scheduled Jobs:** Supabase Edge Functions or scheduled jobs for reminder orchestration
- **Authorization:** Supabase Row Level Security

### Observability And Product Analytics

- **Crash Reporting:** Sentry
- **Product Analytics:** PostHog or Amplitude
- **Basic Event Tracking:** Battle started, matchup answered, tournament completed, reminder opened

### Deployment

- **Web Hosting:** Vercel or Netlify
- **iOS Distribution:** Apple App Store via EAS Submit
- **Android Distribution:** Google Play Store via EAS Submit

## Architecture

The application should use a shared Expo codebase that targets native mobile and web. Most business logic should live in framework-neutral TypeScript modules so it can be reused across screens and platforms.

```text
Expo App
  ├── iOS
  ├── Android
  └── Web

Shared TypeScript Code
  ├── UI screens
  ├── Battle generation logic
  ├── Ranking logic
  ├── API/data access layer
  └── Validation schemas

Supabase
  ├── Auth
  ├── Postgres
  ├── Row Level Security
  ├── Edge Functions
  └── Storage
```

## Core Product Flow

1. User signs up or signs in.
2. User creates a backlog category, such as `Steam Games`, `Movies`, or `Books`.
3. User manually adds backlog items to the category.
4. User starts a battle for that category.
5. The app shuffles eligible items and generates a knockout tournament bracket.
6. The user is shown one matchup at a time.
7. The user selects the item they would rather prioritize.
8. Winners advance until the tournament completes.
9. The app stores the final ranking and battle history.
10. The app periodically reminds the user to run another battle.

## MVP Feature Set

### Authentication

- Email/password sign up and sign in.
- Optional OAuth can be added later.

### Backlog Categories

- Create category.
- Edit category name.
- Delete category.
- View category item count and latest battle date.

### Backlog Items

- Add item manually.
- Edit item title, notes, type, and optional metadata.
- Mark item as active, completed, archived, or removed.
- Delete item.

### Battles

- Start battle from a category.
- Generate randomized knockout bracket.
- Present one matchup at a time.
- Let user pick a winner.
- Persist each matchup result.
- Show final winner and ordered ranking.

### Rankings

- Store ranking result for every completed battle.
- Show current category ranking.
- Show previous battle results.

### Reminders

- Let users opt in to reminders.
- Support simple reminder frequency, such as weekly or monthly.
- Send push notification when it is time to revisit a category.

## Data Model

### users

Managed by Supabase Auth.

### profiles

Stores app-specific user profile data.

```text
id uuid primary key references auth.users(id)
display_name text
created_at timestamptz
updated_at timestamptz
```

### categories

Stores user-created backlog groups.

```text
id uuid primary key
user_id uuid references auth.users(id)
name text not null
description text
created_at timestamptz
updated_at timestamptz
deleted_at timestamptz nullable
```

### backlog_items

Stores individual backlog entries.

```text
id uuid primary key
user_id uuid references auth.users(id)
category_id uuid references categories(id)
title text not null
description text
item_type text
status text not null
image_url text nullable
external_source text nullable
external_id text nullable
created_at timestamptz
updated_at timestamptz
deleted_at timestamptz nullable
```

Suggested `status` values:

```text
active
completed
archived
removed
```

### battles

Stores each tournament run.

```text
id uuid primary key
user_id uuid references auth.users(id)
category_id uuid references categories(id)
status text not null
algorithm text not null
started_at timestamptz
completed_at timestamptz nullable
created_at timestamptz
updated_at timestamptz
```

Suggested `status` values:

```text
draft
active
completed
abandoned
```

### battle_matchups

Stores pairwise choices within a battle.

```text
id uuid primary key
battle_id uuid references battles(id)
round_number int not null
match_number int not null
item_a_id uuid references backlog_items(id)
item_b_id uuid references backlog_items(id)
winner_item_id uuid references backlog_items(id) nullable
completed_at timestamptz nullable
created_at timestamptz
updated_at timestamptz
```

### battle_rankings

Stores the final ranking for a completed battle.

```text
id uuid primary key
battle_id uuid references battles(id)
category_id uuid references categories(id)
item_id uuid references backlog_items(id)
rank int not null
created_at timestamptz
```

### reminder_settings

Stores user reminder preferences.

```text
id uuid primary key
user_id uuid references auth.users(id)
category_id uuid references categories(id) nullable
enabled boolean not null
frequency text not null
next_reminder_at timestamptz nullable
created_at timestamptz
updated_at timestamptz
```

Suggested `frequency` values:

```text
weekly
biweekly
monthly
```

## Battle Algorithm

The MVP should use a simple randomized knockout tournament.

### Initial Algorithm

1. Load all active backlog items for a category.
2. Shuffle items randomly.
3. Pair items into matchups.
4. If there is an odd number of items, give one item a bye into the next round.
5. User selects winners for each matchup.
6. Winners advance into the next round.
7. Continue until one winner remains.
8. Build a final ranking from tournament progression.

This keeps the product fun and easy to understand. More advanced ranking systems can be added later once user behavior is better understood.

### Future Algorithm Improvements

- Elo-style item ratings.
- Swiss-style battles.
- Pairwise ranking with confidence scores.
- Decay for stale rankings.
- Time-to-complete weighting.
- Mood-based battles, such as `short`, `long`, `relaxing`, or `high effort`.
- Re-battle prompts for items that have not appeared recently.

## Notification Strategy

For MVP, reminders should be simple and user-controlled.

- Ask users to opt in to push notifications.
- Let users choose reminder frequency.
- Store `next_reminder_at` per user or category.
- A scheduled backend job checks due reminders.
- Due reminders trigger push notifications through Expo Notifications.
- When a reminder is sent, calculate and store the next reminder date.

Example notification copy:

```text
Your backlog is waiting. Start a new battle and pick what deserves your time next.
```

## Security And Authorization

- Enable Row Level Security on all user-owned tables.
- Users can only read, insert, update, and delete their own records.
- Use Supabase Auth user IDs as ownership boundaries.
- Never trust client-provided `user_id` without RLS policies.
- Soft delete categories and items where preserving battle history matters.

## Analytics Events

Track only useful product events at first.

```text
category_created
backlog_item_created
battle_started
matchup_completed
battle_completed
ranking_viewed
reminder_enabled
reminder_opened
```

Useful properties:

```text
category_id
item_count
battle_id
round_number
matchup_count
duration_seconds
platform
```

## Project Structure

A practical Expo project structure:

```text
app/
  _layout.tsx
  index.tsx
  auth/
  categories/
  battles/

src/
  components/
  features/
    auth/
    categories/
    backlog-items/
    battles/
    rankings/
    reminders/
  lib/
    supabase.ts
    analytics.ts
    notifications.ts
  domain/
    battle-generator.ts
    ranking.ts
  schemas/
  types/
```

## Implementation Phases

### Phase 1: App Foundation

- Create Expo app with TypeScript.
- Set up Expo Router.
- Configure Supabase client.
- Add auth screens.
- Add basic authenticated app layout.

### Phase 2: Backlog Management

- Create categories.
- Add, edit, and delete backlog items.
- Display category detail pages.

### Phase 3: Battle MVP

- Implement bracket generation.
- Create battle session screen.
- Persist matchups and winners.
- Generate final ranking.
- Show completed battle results.

### Phase 4: Reminders And Polish

- Add notification permission flow.
- Add reminder settings.
- Add scheduled reminder job.
- Improve empty states, loading states, and error handling.

### Phase 5: Release Readiness

- Add Sentry.
- Add analytics.
- Add privacy policy and terms links.
- Prepare app store metadata.
- Build with EAS.
- Deploy web build.

## Key Technical Risks

### Web And Native UI Differences

React Native Web is powerful, but some UI behavior can differ across platforms.

Mitigation: test mobile and web layouts early, especially battle screens and forms.

### Notification Complexity

Push notifications differ across iOS, Android, and Web.

Mitigation: prioritize native push notifications first. Treat web push as a later enhancement if needed.

### Ranking Quality

A pure knockout tournament is fun but can produce imperfect rankings because one early matchup can eliminate a strong item.

Mitigation: start simple, store battle history, and improve ranking logic later with more user data.

### Scope Creep

Import integrations and social features can delay the MVP.

Mitigation: ship manual entry and core battles first.

## Open Decisions

- Whether web should be a full app at launch or a lighter companion experience.
- Whether users can use the app without an account for local-only backlogs.
- Whether item images are required for MVP.
- Whether rankings should be global per category or scoped to each completed battle only.
- Which analytics provider to choose between PostHog and Amplitude.

## Recommendation

Build Backlog Battle with React Native, Expo, TypeScript, Expo Router, Supabase, Postgres, Expo Notifications, EAS Build, and Vercel for web hosting.

This stack provides the best balance of cross-platform reach, development speed, maintainability, and room for future product growth.
