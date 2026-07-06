import { describe, expect, it } from 'vitest';

import { computeBattleState, generateRoundMatchups } from './battle-generator';
import type { BattleState, DomainMatchup } from './types';

function makeParticipants(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `item-${i + 1}`);
}

/**
 * Reference progression using generateRoundMatchups directly, with the given
 * winner policy, to independently predict the champion.
 */
function referenceChampion(
  participants: readonly string[],
  pickWinner: (m: DomainMatchup) => string,
): string {
  let pool = [...participants];
  let round = 1;
  while (pool.length > 1) {
    const { matchups, byeItemIds } = generateRoundMatchups(pool, round);
    pool = [...byeItemIds, ...matchups.map(pickWinner)];
    round += 1;
  }
  return pool[0];
}

interface SimulationResult {
  finalState: BattleState;
  persisted: DomainMatchup[];
  /** roundNumber:matchNumber keys in the order nextMatchup surfaced them. */
  playedSequence: string[];
  /** States observed where nextRoundMatchups was non-null. */
  freshRoundStates: BattleState[];
}

/**
 * Drive a full tournament through computeBattleState the way the persistence
 * layer would: persist nextRoundMatchups when offered, otherwise decide
 * nextMatchup, recomputing state after every step.
 */
function simulateTournament(
  participants: readonly string[],
  pickWinner: (m: DomainMatchup) => string = (m) => m.itemAId,
): SimulationResult {
  let persisted: DomainMatchup[] = [];
  const playedSequence: string[] = [];
  const freshRoundStates: BattleState[] = [];

  let state = computeBattleState(participants, persisted);
  let guard = 0;
  while (!state.isComplete) {
    guard += 1;
    if (guard > 500) throw new Error('simulation did not terminate');

    expect(state.championItemId).toBeNull();
    expect(state.currentRoundNumber).not.toBeNull();

    if (state.nextRoundMatchups !== null) {
      freshRoundStates.push(state);
      for (const m of state.nextRoundMatchups) {
        expect(m.winnerItemId).toBeNull();
      }
      persisted = [...persisted, ...state.nextRoundMatchups.map((m) => ({ ...m }))];
      state = computeBattleState(participants, persisted);
      continue;
    }

    const next = state.nextMatchup;
    expect(next).not.toBeNull();
    if (next === null) throw new Error('unreachable');
    playedSequence.push(`${next.roundNumber}:${next.matchNumber}`);
    persisted = persisted.map((m) =>
      m.roundNumber === next.roundNumber && m.matchNumber === next.matchNumber
        ? { ...m, winnerItemId: pickWinner(m) }
        : m,
    );
    state = computeBattleState(participants, persisted);
  }

  return { finalState: state, persisted, playedSequence, freshRoundStates };
}

describe('generateRoundMatchups', () => {
  it('pairs an even pool with no byes', () => {
    const { matchups, byeItemIds } = generateRoundMatchups(['a', 'b', 'c', 'd'], 1);
    expect(byeItemIds).toEqual([]);
    expect(matchups).toEqual([
      { roundNumber: 1, matchNumber: 1, itemAId: 'a', itemBId: 'b', winnerItemId: null },
      { roundNumber: 1, matchNumber: 2, itemAId: 'c', itemBId: 'd', winnerItemId: null },
    ]);
  });

  it('gives the last item a bye for an odd pool', () => {
    const { matchups, byeItemIds } = generateRoundMatchups(['a', 'b', 'c', 'd', 'e'], 2);
    expect(byeItemIds).toEqual(['e']);
    expect(matchups).toHaveLength(2);
    expect(matchups[0].roundNumber).toBe(2);
  });
});

describe('computeBattleState — full tournaments', () => {
  const expectedRounds: Record<number, number> = { 2: 1, 3: 2, 4: 2, 5: 3, 10: 4, 11: 4 };

  for (const n of [2, 3, 4, 5, 10, 11]) {
    it(`runs a complete ${n}-item tournament`, () => {
      const participants = makeParticipants(n);
      const { finalState, persisted, playedSequence, freshRoundStates } =
        simulateTournament(participants);

      // Knockout invariant: n - 1 matches total, all played exactly once.
      expect(finalState.totalMatches).toBe(n - 1);
      expect(finalState.completedMatches).toBe(n - 1);
      expect(persisted).toHaveLength(n - 1);
      expect(playedSequence).toHaveLength(n - 1);
      expect(new Set(playedSequence).size).toBe(n - 1);

      // nextMatchup walks matchups in round order, matchNumber order.
      const sortedSequence = [...playedSequence].sort((a, b) => {
        const [ra, ma] = a.split(':').map(Number);
        const [rb, mb] = b.split(':').map(Number);
        return ra - rb || ma - mb;
      });
      expect(playedSequence).toEqual(sortedSequence);

      // nextRoundMatchups surfaced exactly once per round.
      expect(finalState.rounds).toHaveLength(expectedRounds[n]);
      expect(freshRoundStates).toHaveLength(expectedRounds[n]);
      freshRoundStates.forEach((s, i) => {
        expect(s.currentRoundNumber).toBe(i + 1);
        expect(s.nextRoundMatchups?.every((m) => m.roundNumber === i + 1)).toBe(true);
      });

      // Byes: odd pools produce exactly one bye, and it leads the next round's pool.
      for (const round of finalState.rounds) {
        const poolSize = round.matchups.length * 2 + round.byeItemIds.length;
        expect(round.byeItemIds).toHaveLength(poolSize % 2);
        if (round.byeItemIds.length === 1) {
          const nextRound = finalState.rounds.find(
            (r) => r.roundNumber === round.roundNumber + 1,
          );
          expect(nextRound).toBeDefined();
          expect(nextRound?.matchups[0].itemAId).toBe(round.byeItemIds[0]);
        }
      }

      // Final round: single matchup, no byes; its winner is the champion.
      const finalRound = finalState.rounds[finalState.rounds.length - 1];
      expect(finalRound.matchups).toHaveLength(1);
      expect(finalRound.byeItemIds).toEqual([]);
      expect(finalState.championItemId).toBe(finalRound.matchups[0].winnerItemId);
      expect(finalState.championItemId).toBe(
        referenceChampion(participants, (m) => m.itemAId),
      );

      expect(finalState.isComplete).toBe(true);
      expect(finalState.currentRoundNumber).toBeNull();
      expect(finalState.nextMatchup).toBeNull();
      expect(finalState.nextRoundMatchups).toBeNull();
    });
  }

  it('produces the correct champion with an itemB winner policy', () => {
    const participants = makeParticipants(11);
    const pickB = (m: DomainMatchup) => m.itemBId;
    const { finalState } = simulateTournament(participants, pickB);
    expect(finalState.championItemId).toBe(referenceChampion(participants, pickB));
  });
});

describe('computeBattleState — initial and mid-tournament states', () => {
  it('offers round 1 matchups via nextRoundMatchups when nothing is persisted', () => {
    const state = computeBattleState(makeParticipants(4), []);
    expect(state.currentRoundNumber).toBe(1);
    expect(state.nextRoundMatchups).toHaveLength(2);
    expect(state.nextMatchup).toEqual(state.nextRoundMatchups?.[0]);
    expect(state.completedMatches).toBe(0);
    expect(state.isComplete).toBe(false);
  });

  it('resumes mid-round at the first undecided matchup', () => {
    const participants = makeParticipants(10);
    const round1 = generateRoundMatchups(participants, 1).matchups.map((m) => ({
      ...m,
      winnerItemId: m.itemAId,
    }));
    const round2Pool = round1.map((m) => m.itemAId);
    const round2 = generateRoundMatchups(round2Pool, 2).matchups;
    round2[0] = { ...round2[0], winnerItemId: round2[0].itemAId };

    const state = computeBattleState(participants, [...round1, ...round2]);

    expect(state.currentRoundNumber).toBe(2);
    expect(state.completedMatches).toBe(6);
    expect(state.nextMatchup).toMatchObject({ roundNumber: 2, matchNumber: 2 });
    expect(state.nextRoundMatchups).toBeNull();
    expect(state.isComplete).toBe(false);
  });

  it('offers the next round exactly when the current round completes', () => {
    const participants = makeParticipants(5);
    const round1 = generateRoundMatchups(participants, 1).matchups.map((m) => ({
      ...m,
      winnerItemId: m.itemAId,
    }));

    const state = computeBattleState(participants, round1);

    // Round 2 pool: bye (item-5) first, then round-1 winners.
    expect(state.currentRoundNumber).toBe(2);
    expect(state.nextRoundMatchups).toEqual([
      { roundNumber: 2, matchNumber: 1, itemAId: 'item-5', itemBId: 'item-1', winnerItemId: null },
    ]);
    expect(state.rounds[1].byeItemIds).toEqual(['item-3']);
    expect(state.nextMatchup).toEqual(state.nextRoundMatchups?.[0]);
  });
});

describe('computeBattleState — validation', () => {
  it('throws on fewer than 2 participants', () => {
    expect(() => computeBattleState([], [])).toThrow();
    expect(() => computeBattleState(['only'], [])).toThrow();
  });

  it('throws on duplicate participant ids', () => {
    expect(() => computeBattleState(['a', 'a', 'b'], [])).toThrow();
  });

  it('throws when a matchup references an unknown item id', () => {
    const matchup: DomainMatchup = {
      roundNumber: 1,
      matchNumber: 1,
      itemAId: 'a',
      itemBId: 'ghost',
      winnerItemId: null,
    };
    expect(() => computeBattleState(['a', 'b'], [matchup])).toThrow(/unknown item/);
  });

  it('throws when a persisted pairing does not match the derived bracket', () => {
    const matchup: DomainMatchup = {
      roundNumber: 1,
      matchNumber: 1,
      itemAId: 'a',
      itemBId: 'c',
      winnerItemId: null,
    };
    expect(() => computeBattleState(['a', 'b', 'c', 'd'], [matchup])).toThrow();
  });

  it('throws when a winner is not one of the matchup items', () => {
    const round1 = generateRoundMatchups(['a', 'b', 'c', 'd'], 1).matchups;
    const corrupted = [{ ...round1[0], winnerItemId: 'c' }, round1[1]];
    expect(() => computeBattleState(['a', 'b', 'c', 'd'], corrupted)).toThrow(/winner/);
  });

  it('throws when persisted matchups exist for an unreachable round', () => {
    const bogus: DomainMatchup = {
      roundNumber: 5,
      matchNumber: 1,
      itemAId: 'a',
      itemBId: 'b',
      winnerItemId: null,
    };
    expect(() => computeBattleState(['a', 'b', 'c', 'd'], [bogus])).toThrow(/round 5/);
  });
});
