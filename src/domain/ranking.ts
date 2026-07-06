import { computeBattleState } from './battle-generator';
import type { DomainMatchup } from './types';

export interface RankedItem {
  itemId: string;
  rank: number; // rank 1 = champion
}

/**
 * Ranking from a COMPLETE tournament: champion 1st, runner-up 2nd, then
 * eliminated items grouped by elimination round (later round = better rank),
 * within a group ordered by matchNumber asc. Ranks are dense (1, 2, 3, ...).
 * Throws if the tournament isn't complete.
 */
export function buildRanking(
  participantItemIds: readonly string[],
  matchups: readonly DomainMatchup[],
): RankedItem[] {
  const state = computeBattleState(participantItemIds, matchups);
  if (!state.isComplete || state.championItemId === null) {
    throw new Error('Cannot build ranking: the tournament is not complete');
  }

  const ranking: RankedItem[] = [{ itemId: state.championItemId, rank: 1 }];

  let rank = 2;
  for (let i = state.rounds.length - 1; i >= 0; i--) {
    for (const matchup of state.rounds[i].matchups) {
      const loserItemId =
        matchup.winnerItemId === matchup.itemAId ? matchup.itemBId : matchup.itemAId;
      ranking.push({ itemId: loserItemId, rank });
      rank += 1;
    }
  }

  return ranking;
}
