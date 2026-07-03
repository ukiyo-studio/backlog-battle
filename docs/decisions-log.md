# Decisions Log

This document records product and technical decisions for Backlog Battle so implementation stays consistent as the project grows.

## Decision 001: Core Tech Stack

Date: May 20, 2026

Status: Decided

### Decision

Backlog Battle will be built as a cross-platform app using:

- React Native
- Expo
- TypeScript
- Expo Router
- React Native Web through Expo
- Supabase for backend, auth, Postgres database, and row-level security
- Expo Notifications for native reminders
- EAS Build and EAS Submit for mobile app builds and submission
- Vercel or Netlify for web deployment

### Rationale

The product needs to ship on iOS, Android, and web from one codebase. Expo gives us the fastest practical path to cross-platform development, routing, notifications, mobile builds, and web support. Supabase gives us a straightforward backend for authentication, persisted backlog data, battle history, rankings, and authorization without needing to build and host a custom API for the MVP.

### Notes

The MVP should keep business logic in framework-neutral TypeScript modules where possible, especially battle generation and ranking logic.

## Decision 002: UI Component Direction

Date: May 20, 2026

Status: Decided

### Decision

Backlog Battle will use **React Native Reusables + NativeWind** as the starting UI component foundation.

The app will build a small Backlog Battle-specific themed UI layer on top of those primitives, inspired by **8bitcn** and retro game interfaces.

### Rationale

React Native Reusables gives us the shadcn-like approach we want while remaining compatible with the planned Expo and React Native stack. NativeWind gives us a practical utility styling layer for mobile and web. This direction lets us own and customize component source, which is important for creating a distinct game-like product without fighting an opaque component library.

8bitcn strongly matches the desired mood: playful, retro, 8-bit, and game-like. However, it is primarily built for web React and the shadcn ecosystem, not native mobile. Using it directly as the app foundation would add avoidable cross-platform risk.

### UI Principles

- Use 8bitcn as visual inspiration, not as the core native component dependency.
- Keep body text readable; avoid tiny pixel fonts for normal content.
- Use pixel-inspired borders, badges, progress meters, battle cards, and tournament motifs where they support the product loop.
- Keep category and item management efficient and calm, even if battle screens are more playful.
- Prefer themed reusable components under `src/components/ui` over one-off styling in feature screens.
- Validate native and web behavior early with a small prototype before building the full app.

### Planned UI Foundation

```text
app screens
  -> feature components
    -> Backlog Battle themed UI components
      -> React Native Reusables primitives
      -> NativeWind tokens/utilities
```

### First Components To Prototype

- Button
- Card
- Input
- Dialog or Sheet
- Tabs
- Progress
- Matchup card
- Battle progress meter
- Ranking row

### Related Research

See [UI Component Library Research](./ui-component-library-research.md).

## Decision 003: Fable Agent Workflow

Date: July 3, 2026

Status: Decided

### Decision

Backlog Battle implementation will use **Cursor Agent with Claude Fable 5** as orchestrator, delegating to project subagents in `.cursor/agents/` and phase commands in `.cursor/commands/`.

Locked workflow:

- Fable integrates; subagents implement bounded slices with explicit file ownership
- `/product-planner` produces phase plans (readonly)
- `/security-auditor` and `/verifier` gate every PR (readonly)
- Acceptance criteria live in `docs/implementation-checklist.md`
- Ambiguous spec defaults live in `docs/open-decisions.md`

Kickoff command: `/start-fable-build` (Phase 0 + 1). Subsequent phases: `/build-phase N`.

### Rationale

The repo is docs-only today. A committed agent layer gives consistent delegation, verification, and scope control across local and cloud agent sessions without re-deriving process each time.

### Related Files

- `.cursor/README.md` — agent quick start
- `.cursor/agents/` — eight project subagents
- `.cursor/commands/build-phase.md` — orchestration workflow
- `docs/implementation-checklist.md` — phase definition of done
- `docs/open-decisions.md` — locked MVP defaults
