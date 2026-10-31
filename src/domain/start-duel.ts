import type { DomainMatchup } from "./types";
import { shuffleItems } from "./shuffle";

export const START_DUEL_MAX_MATCHES = 7;
export const START_DUEL_SHORTLIST_CAP = 8;
export const START_DUEL_WIN_STREAK = 3;
/** Failures in the same time and energy window are skipped for this long. */
export const CONTEXT_EXCLUSION_MS = 14 * 24 * 60 * 60 * 1000;
/** How long after a pick before the app asks whether it was started. */
export const START_CHECK_DELAY_MS = 3 * 60 * 60 * 1000;

export const DUEL_CONTEXT_TIMES = ["tonight", "weekend", "whenever"] as const;
export const DUEL_CONTEXT_ENERGIES = ["low", "medium", "locked_in"] as const;

export type DuelContextTime = (typeof DUEL_CONTEXT_TIMES)[number];
export type DuelContextEnergy = (typeof DUEL_CONTEXT_ENERGIES)[number];

export interface ContextFailure {
  itemId: string;
  contextTime: DuelContextTime;
  contextEnergy: DuelContextEnergy;
  checkedAt: string;
}

export interface StartDuelState {
  completedMatches: number;
  /** Shortlist length minus one, capped at START_DUEL_MAX_MATCHES. */
  maxMatches: number;
  /** Undecided matchup already stored. Null when the next pair still needs inserting. */
  nextMatchup: DomainMatchup | null;
  /** Next pair to persist. Null when a stored matchup is waiting or the duel is over. */
  pendingMatchup: DomainMatchup | null;
  isComplete: boolean;
  pickItemId: string | null;
  /** Last item the pick beat. Null until the duel is complete. */
  runnerUpItemId: string | null;
  leaderStreak: number;
}

export function isDuelContextTime(value: unknown): value is DuelContextTime {
  return value === "tonight" || value === "weekend" || value === "whenever";
}

export function isDuelContextEnergy(value: unknown): value is DuelContextEnergy {
  return value === "low" || value === "medium" || value === "locked_in";
}

/**
 * Drop items that bounced or were never opened in this same window recently.
 * If that leaves fewer than 2, keep the full active list.
 */
export function selectDuelCandidates(input: {
  activeItemIds: readonly string[];
  contextTime: DuelContextTime;
  contextEnergy: DuelContextEnergy;
  failures: readonly ContextFailure[];
  now: Date;
}): { itemIds: string[]; usedFullList: boolean } {
  const blocked = new Set<string>();
  const nowMs = input.now.getTime();

  for (const failure of input.failures) {
    if (failure.contextTime !== input.contextTime) continue;
    if (failure.contextEnergy !== input.contextEnergy) continue;
    const checkedMs = Date.parse(failure.checkedAt);
    if (Number.isNaN(checkedMs)) continue;
    const ageMs = nowMs - checkedMs;
    if (ageMs > CONTEXT_EXCLUSION_MS) continue;
    blocked.add(failure.itemId);
  }

  const filtered = input.activeItemIds.filter((id) => !blocked.has(id));
  if (filtered.length < 2) {
    return { itemIds: [...input.activeItemIds], usedFullList: true };
  }
  return { itemIds: filtered, usedFullList: false };
}

/** Seeded shuffle, then at most START_DUEL_SHORTLIST_CAP items. */
export function buildDuelShortlist(
  itemIds: readonly string[],
  seed: number,
): string[] {
  return shuffleItems(itemIds, seed).slice(0, START_DUEL_SHORTLIST_CAP);
}

function shouldStop(
  completed: number,
  streak: number,
  shortlistLength: number,
): boolean {
  return (
    streak >= START_DUEL_WIN_STREAK ||
    completed >= START_DUEL_MAX_MATCHES ||
    completed >= shortlistLength - 1
  );
}

function pairFor(
  shortlist: readonly string[],
  matchNumber: number,
  leader: string | null,
): { itemAId: string; itemBId: string } {
  if (matchNumber === 1) {
    return { itemAId: shortlist[0], itemBId: shortlist[1] };
  }
  const challenger = shortlist[matchNumber];
  if (!leader || !challenger) {
    throw new Error(`Match ${matchNumber} has no challenger left`);
  }
  return { itemAId: leader, itemBId: challenger };
}

/**
 * King of the hill over a shortlist. Match 1 is the first two items; each
 * later match is the leader against the next item. Stops when the leader
 * wins 3 in a row, the shortlist is exhausted, or 7 matchups are done.
 * Throws if the persisted pairs disagree with that order.
 */
export function computeStartDuelState(
  shortlist: readonly string[],
  persistedMatchups: readonly DomainMatchup[],
): StartDuelState {
  if (shortlist.length < 2) {
    throw new Error(
      `A start duel requires at least 2 items, got ${shortlist.length}`,
    );
  }
  if (new Set(shortlist).size !== shortlist.length) {
    throw new Error("Duplicate shortlist item ids");
  }

  const ordered = [...persistedMatchups].sort((a, b) => {
    if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
    return a.matchNumber - b.matchNumber;
  });

  const maxMatches = Math.min(shortlist.length - 1, START_DUEL_MAX_MATCHES);
  let leader: string | null = null;
  let streak = 0;
  let runnerUp: string | null = null;
  let completed = 0;

  const base = {
    completedMatches: completed,
    maxMatches,
    leaderStreak: streak,
  };

  for (let index = 0; index < ordered.length; index++) {
    if (completed > 0 && shouldStop(completed, streak, shortlist.length)) {
      throw new Error("Start duel matchup continues after the duel has ended");
    }

    const actual = ordered[index];
    if (actual.roundNumber !== 1) {
      throw new Error(
        `Start duel matchups use round 1, got round ${actual.roundNumber}`,
      );
    }
    if (actual.matchNumber !== index + 1) {
      throw new Error(
        `Expected match ${index + 1}, got match ${actual.matchNumber}`,
      );
    }

    const expected = pairFor(shortlist, actual.matchNumber, leader);
    if (
      actual.itemAId !== expected.itemAId ||
      actual.itemBId !== expected.itemBId
    ) {
      throw new Error(
        `Match ${actual.matchNumber}: persisted pairing ` +
          `(${actual.itemAId}, ${actual.itemBId}) does not match ` +
          `(${expected.itemAId}, ${expected.itemBId})`,
      );
    }
    if (
      actual.winnerItemId !== null &&
      actual.winnerItemId !== actual.itemAId &&
      actual.winnerItemId !== actual.itemBId
    ) {
      throw new Error(
        `Match ${actual.matchNumber}: winner ${actual.winnerItemId} ` +
          `is not one of the matchup's items`,
      );
    }

    if (actual.winnerItemId === null) {
      if (index !== ordered.length - 1) {
        throw new Error(
          `Match ${actual.matchNumber} is undecided but later matchups exist`,
        );
      }
      return {
        ...base,
        completedMatches: completed,
        leaderStreak: streak,
        nextMatchup: actual,
        pendingMatchup: null,
        isComplete: false,
        pickItemId: null,
        runnerUpItemId: null,
      };
    }

    const loser =
      actual.winnerItemId === actual.itemAId ? actual.itemBId : actual.itemAId;
    if (leader === actual.winnerItemId) {
      streak += 1;
    } else {
      leader = actual.winnerItemId;
      streak = 1;
    }
    runnerUp = loser;
    completed += 1;
  }

  if (leader && shouldStop(completed, streak, shortlist.length)) {
    return {
      completedMatches: completed,
      maxMatches,
      leaderStreak: streak,
      nextMatchup: null,
      pendingMatchup: null,
      isComplete: true,
      pickItemId: leader,
      runnerUpItemId: runnerUp,
    };
  }

  const pendingNumber = completed + 1;
  return {
    completedMatches: completed,
    maxMatches,
    leaderStreak: streak,
    nextMatchup: null,
    pendingMatchup: {
      roundNumber: 1,
      matchNumber: pendingNumber,
      ...pairFor(shortlist, pendingNumber, leader),
      winnerItemId: null,
    },
    isComplete: false,
    pickItemId: null,
    runnerUpItemId: null,
  };
}
