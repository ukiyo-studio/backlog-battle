import { describe, expect, it } from 'vitest';

import { computeBattleState, generateRoundMatchups } from './battle-generator';
import { buildRanking } from './ranking';
import type { DomainMatchup } from './types';

function makeParticipants(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `item-${i + 1}`);
}

/** Play a full tournament with the given winner policy; returns all decided matchups. */
function playTournament(
  participants: readonly string[],
  pickWinner: (m: DomainMatchup) => string = (m) => m.itemAId,
): DomainMatchup[] {
  let persisted: DomainMatchup[] = [];
  let state = computeBattleState(participants, persisted);
  while (!state.isComplete) {
    if (state.nextRoundMatchups !== null) {
      persisted = [
        ...persisted,
        ...state.nextRoundMatchups.map((m) => ({ ...m, winnerItemId: pickWinner(m) })),
      ];
    }
    state = computeBattleState(participants, persisted);
  }
  return persisted;
}

describe('buildRanking', () => {
  for (const n of [2, 3, 4, 5, 10, 11]) {
    it(`ranks all ${n} participants with dense ranks`, () => {
      const participants = makeParticipants(n);
      const matchups = playTournament(participants);
      const ranking = buildRanking(participants, matchups);

      expect(ranking).toHaveLength(n);
      expect(ranking.map((r) => r.rank)).toEqual(
        Array.from({ length: n }, (_, i) => i + 1),
      );
      expect([...ranking.map((r) => r.itemId)].sort()).toEqual([...participants].sort());
    });
  }

  it('puts the champion first and the final loser second', () => {
    const participants = makeParticipants(10);
    const matchups = playTournament(participants);
    const state = computeBattleState(participants, matchups);
    const finalMatchup = matchups.reduce((a, b) => (a.roundNumber > b.roundNumber ? a : b));
    const finalLoser =
      finalMatchup.winnerItemId === finalMatchup.itemAId
        ? finalMatchup.itemBId
        : finalMatchup.itemAId;

    const ranking = buildRanking(participants, matchups);
    expect(ranking[0]).toEqual({ itemId: state.championItemId, rank: 1 });
    expect(ranking[1]).toEqual({ itemId: finalLoser, rank: 2 });
  });

  it('ranks later-eliminated items above earlier-eliminated items', () => {
    const participants = makeParticipants(11);
    const matchups = playTournament(participants);
    const ranking = buildRanking(participants, matchups);
    const rankByItem = new Map(ranking.map((r) => [r.itemId, r.rank]));

    for (const m of matchups) {
      const loser = m.winnerItemId === m.itemAId ? m.itemBId : m.itemAId;
      for (const other of matchups) {
        if (other.roundNumber >= m.roundNumber) continue;
        const earlierLoser = other.winnerItemId === other.itemAId ? other.itemBId : other.itemAId;
        expect(rankByItem.get(loser)!).toBeLessThan(rankByItem.get(earlierLoser)!);
      }
    }
  });

  it('orders items eliminated in the same round by matchNumber ascending', () => {
    const participants = makeParticipants(8);
    const matchups = playTournament(participants);
    const ranking = buildRanking(participants, matchups);
    const rankByItem = new Map(ranking.map((r) => [r.itemId, r.rank]));

    const round1Losers = matchups
      .filter((m) => m.roundNumber === 1)
      .sort((a, b) => a.matchNumber - b.matchNumber)
      .map((m) => (m.winnerItemId === m.itemAId ? m.itemBId : m.itemAId));

    const round1Ranks = round1Losers.map((id) => rankByItem.get(id)!);
    expect(round1Ranks).toEqual([...round1Ranks].sort((a, b) => a - b));
  });

  it('produces the exact expected ranking for a 5-item always-itemA tournament', () => {
    const participants = ['a', 'b', 'c', 'd', 'e'];
    // r1: (a,b)->a, (c,d)->c, bye e. r2 pool [e,a,c]: (e,a)->e, bye c.
    // r3 pool [c,e]: (c,e)->c. Champion c.
    const matchups = playTournament(participants);
    expect(buildRanking(participants, matchups)).toEqual([
      { itemId: 'c', rank: 1 },
      { itemId: 'e', rank: 2 },
      { itemId: 'a', rank: 3 },
      { itemId: 'b', rank: 4 },
      { itemId: 'd', rank: 5 },
    ]);
  });

  it('is deterministic for the same input', () => {
    const participants = makeParticipants(10);
    const matchups = playTournament(participants, (m) => m.itemBId);
    expect(buildRanking(participants, matchups)).toEqual(buildRanking(participants, matchups));
  });

  it('throws if the tournament is incomplete', () => {
    const participants = makeParticipants(4);
    expect(() => buildRanking(participants, [])).toThrow(/not complete/);

    const round1 = generateRoundMatchups(participants, 1).matchups;
    const partial = [{ ...round1[0], winnerItemId: round1[0].itemAId }, round1[1]];
    expect(() => buildRanking(participants, partial)).toThrow(/not complete/);
  });
});
