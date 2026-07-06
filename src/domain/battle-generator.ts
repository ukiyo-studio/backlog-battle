import type { BattleState, DomainMatchup, RoundState } from './types';

/**
 * Pair an ordered pool into matchups for a round.
 * Odd pool: the LAST item becomes the round's bye.
 * Pool order convention: carried byes FIRST (in their stored order), then
 * winners in matchNumber order. Round 1 pool = participantItemIds as given
 * (caller pre-shuffles).
 */
export function generateRoundMatchups(
  pool: readonly string[],
  roundNumber: number,
): { matchups: DomainMatchup[]; byeItemIds: string[] } {
  const matchups: DomainMatchup[] = [];
  const byeItemIds: string[] = [];
  const pairedCount = pool.length % 2 === 0 ? pool.length : pool.length - 1;

  for (let i = 0; i < pairedCount; i += 2) {
    matchups.push({
      roundNumber,
      matchNumber: i / 2 + 1,
      itemAId: pool[i],
      itemBId: pool[i + 1],
      winnerItemId: null,
    });
  }
  if (pairedCount < pool.length) {
    byeItemIds.push(pool[pool.length - 1]);
  }
  return { matchups, byeItemIds };
}

function groupPersistedByRound(
  persistedMatchups: readonly DomainMatchup[],
): Map<number, DomainMatchup[]> {
  const byRound = new Map<number, DomainMatchup[]>();
  for (const matchup of persistedMatchups) {
    const list = byRound.get(matchup.roundNumber) ?? [];
    list.push(matchup);
    byRound.set(matchup.roundNumber, list);
  }
  for (const list of byRound.values()) {
    list.sort((a, b) => a.matchNumber - b.matchNumber);
  }
  return byRound;
}

/**
 * Validate that a persisted round matches the derived pairings exactly and
 * return the persisted matchups in matchNumber order.
 */
function reconcilePersistedRound(
  derived: DomainMatchup[],
  persisted: DomainMatchup[],
  roundNumber: number,
): DomainMatchup[] {
  if (persisted.length !== derived.length) {
    throw new Error(
      `Round ${roundNumber}: expected ${derived.length} matchups, got ${persisted.length}`,
    );
  }
  return derived.map((expected, index) => {
    const actual = persisted[index];
    if (actual.matchNumber !== expected.matchNumber) {
      throw new Error(
        `Round ${roundNumber}: expected match ${expected.matchNumber}, got ${actual.matchNumber}`,
      );
    }
    if (actual.itemAId !== expected.itemAId || actual.itemBId !== expected.itemBId) {
      throw new Error(
        `Round ${roundNumber} match ${expected.matchNumber}: persisted pairing ` +
          `(${actual.itemAId}, ${actual.itemBId}) does not match derived pairing ` +
          `(${expected.itemAId}, ${expected.itemBId})`,
      );
    }
    if (
      actual.winnerItemId !== null &&
      actual.winnerItemId !== actual.itemAId &&
      actual.winnerItemId !== actual.itemBId
    ) {
      throw new Error(
        `Round ${roundNumber} match ${actual.matchNumber}: winner ${actual.winnerItemId} ` +
          `is not one of the matchup's items`,
      );
    }
    return actual;
  });
}

/**
 * Reconstruct full tournament state from the participant snapshot (ordered,
 * post-shuffle) and every persisted matchup (any round, decided or not).
 * Throws on inconsistent input. Handles participantCount >= 2.
 */
export function computeBattleState(
  participantItemIds: readonly string[],
  persistedMatchups: readonly DomainMatchup[],
): BattleState {
  if (participantItemIds.length < 2) {
    throw new Error(`A battle requires at least 2 participants, got ${participantItemIds.length}`);
  }
  const knownIds = new Set(participantItemIds);
  if (knownIds.size !== participantItemIds.length) {
    throw new Error('Duplicate participant item ids');
  }
  for (const matchup of persistedMatchups) {
    for (const id of [matchup.itemAId, matchup.itemBId]) {
      if (!knownIds.has(id)) {
        throw new Error(`Matchup references unknown item id: ${id}`);
      }
    }
  }

  const byRound = groupPersistedByRound(persistedMatchups);

  const rounds: RoundState[] = [];
  let pool: string[] = [...participantItemIds];
  let roundNumber = 1;
  let championItemId: string | null = null;
  let completedMatches = 0;
  // Set when we derive a round that has no persisted matchups yet.
  let derivedFreshRound = false;

  for (;;) {
    if (pool.length === 1) {
      championItemId = pool[0];
      break;
    }

    const derived = generateRoundMatchups(pool, roundNumber);
    const persisted = byRound.get(roundNumber);

    let roundMatchups: DomainMatchup[];
    if (persisted) {
      roundMatchups = reconcilePersistedRound(derived.matchups, persisted, roundNumber);
    } else {
      roundMatchups = derived.matchups;
      derivedFreshRound = true;
    }

    rounds.push({
      roundNumber,
      matchups: roundMatchups,
      byeItemIds: derived.byeItemIds,
    });

    const decided = roundMatchups.filter((m) => m.winnerItemId !== null);
    completedMatches += decided.length;

    // A fresh (non-persisted) round is by definition undecided; either way an
    // incomplete round is the current round and we cannot derive further.
    if (decided.length < roundMatchups.length) {
      break;
    }

    pool = [...derived.byeItemIds, ...roundMatchups.map((m) => m.winnerItemId as string)];
    roundNumber += 1;
  }

  const derivedRoundNumbers = new Set(rounds.map((r) => r.roundNumber));
  for (const persistedRound of byRound.keys()) {
    if (!derivedRoundNumbers.has(persistedRound)) {
      throw new Error(
        `Persisted matchups exist for round ${persistedRound}, which is not reachable ` +
          `from the current tournament state`,
      );
    }
  }

  const isComplete = championItemId !== null;
  const currentRound = isComplete ? null : rounds[rounds.length - 1];
  const nextMatchup = currentRound?.matchups.find((m) => m.winnerItemId === null) ?? null;

  const allPersistedDecided = persistedMatchups.every((m) => m.winnerItemId !== null);
  const nextRoundMatchups =
    !isComplete && derivedFreshRound && allPersistedDecided && currentRound
      ? currentRound.matchups
      : null;

  return {
    rounds,
    totalMatches: participantItemIds.length - 1,
    completedMatches,
    currentRoundNumber: currentRound?.roundNumber ?? null,
    nextMatchup,
    nextRoundMatchups,
    championItemId,
    isComplete,
  };
}
