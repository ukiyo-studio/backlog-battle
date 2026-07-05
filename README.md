# Backlog Battle

Cross-platform app (iOS, Android, Web) that helps you prioritize your entertainment backlog through tournament-style battles. Add games, movies, books, or anything else to categories, run knockout battles between items, and get a ranked list of what deserves your time next.

## Stack

- [Expo](https://expo.dev) (React Native + React Native Web), TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) for file-based navigation
- [NativeWind](https://www.nativewind.dev) (Tailwind CSS) for styling
- [Supabase](https://supabase.com) for auth, Postgres, and Row Level Security

## Setup

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL and anon key
npm start
```

Required environment variables (see `.env.example`):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Scripts

| Script | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run ios` / `npm run android` / `npm run web` | Start on a specific platform |
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm run lint` | Lint with `expo lint` |

## Testing status (Phase 0/1)

Verified: TypeScript typecheck, ESLint, `expo-doctor`, static web export, and iOS JS bundle all pass. Known gap: interactive runtime smoke testing (tapping through auth and prototype screens on a device/simulator and browser) has not been performed yet — planned alongside Phase 2 feature work.

## Project structure

```text
app/            Expo Router routes ((auth) and (app) groups)
src/
  components/   Shared UI components (ui/ = primitives)
  features/     Feature modules (auth, categories, battles, ...)
  lib/          Clients and integrations (supabase.ts)
  domain/       Pure TypeScript battle/ranking logic
  schemas/      Zod validation schemas
  types/        Shared TypeScript types
  theme/        Theme tokens
supabase/       Database migrations and config
docs/           Product and technical docs
```
