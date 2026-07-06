# Battle domain

Pure TypeScript battle domain logic — no React/Expo/Supabase imports. Modules
in this folder may only import from within `src/domain/`.

## Public API (via `src/domain/index.ts`)

- `createRng(seed)` — deterministic mulberry32 PRNG.
- `shuffleItems(items, seed)` — seeded Fisher-Yates shuffle; does not mutate input.
- `generateRoundMatchups(pool, roundNumber)` — pair an ordered pool into matchups;
  odd pool sizes give the last item a bye.
- `computeBattleState(participantItemIds, persistedMatchups)` — reconstruct the
  full tournament state (rounds, next matchup, next round to persist, champion).
- `buildRanking(participantItemIds, matchups)` — dense 1..n ranking from a
  complete tournament (champion = rank 1).

Tests live alongside the modules (`*.test.ts`) and run with `npm test`.
