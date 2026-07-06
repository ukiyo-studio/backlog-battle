export interface DomainMatchup {
  roundNumber: number; // 1-based
  matchNumber: number; // 1-based within the round
  itemAId: string;
  itemBId: string;
  winnerItemId: string | null; // null = not yet decided
}

export interface RoundState {
  roundNumber: number;
  matchups: DomainMatchup[];
  byeItemIds: string[]; // items skipping this round
}

export interface BattleState {
  rounds: RoundState[]; // all rounds derivable so far (incl. current)
  totalMatches: number; // always participantCount - 1 for knockout
  completedMatches: number;
  currentRoundNumber: number | null; // null when complete
  nextMatchup: DomainMatchup | null; // first undecided matchup in the current round; null when complete
  nextRoundMatchups: DomainMatchup[] | null; // freshly derived next-round matchups ready to persist; otherwise null
  championItemId: string | null; // set when the tournament is complete
  isComplete: boolean;
}
