import { describe, expect, it } from "vitest";

import type { DomainMatchup } from "./types";
import {
  CONTEXT_EXCLUSION_MS,
  START_DUEL_MAX_MATCHES,
  START_DUEL_SHORTLIST_CAP,
  buildDuelShortlist,
  computeStartDuelState,
  selectDuelCandidates,
  type ContextFailure,
  type DuelContextEnergy,
  type DuelContextTime,
} from "./start-duel";

function items(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `item-${index + 1}`);
}

function match(
  matchNumber: number,
  itemAId: string,
  itemBId: string,
  winnerItemId: string | null,
): DomainMatchup {
  return {
    roundNumber: 1,
    matchNumber,
    itemAId,
    itemBId,
    winnerItemId,
  };
}

const NOW = new Date("2026-10-31T12:00:00.000Z");

function failure(
  itemId: string,
  checkedAt: string,
  contextTime: DuelContextTime = "tonight",
  contextEnergy: DuelContextEnergy = "low",
): ContextFailure {
  return { itemId, checkedAt, contextTime, contextEnergy };
}

describe("computeStartDuelState", () => {
  it("opens with the first two shortlist items", () => {
    const shortlist = items(8);
    const state = computeStartDuelState(shortlist, []);

    expect(state.isComplete).toBe(false);
    expect(state.pendingMatchup).toEqual(
      match(1, "item-1", "item-2", null),
    );
    expect(state.nextMatchup).toBeNull();
    expect(state.maxMatches).toBe(START_DUEL_MAX_MATCHES);
  });

  it("treats a stored undecided pair as the current matchup", () => {
    const shortlist = items(4);
    const state = computeStartDuelState(shortlist, [
      match(1, "item-1", "item-2", null),
    ]);

    expect(state.nextMatchup?.matchNumber).toBe(1);
    expect(state.pendingMatchup).toBeNull();
    expect(state.isComplete).toBe(false);
  });

  it("stops when the leader wins three in a row and keeps the last loser as runner-up", () => {
    const shortlist = items(8);
    const state = computeStartDuelState(shortlist, [
      match(1, "item-1", "item-2", "item-1"),
      match(2, "item-1", "item-3", "item-1"),
      match(3, "item-1", "item-4", "item-1"),
    ]);

    expect(state.isComplete).toBe(true);
    expect(state.completedMatches).toBe(3);
    expect(state.pickItemId).toBe("item-1");
    expect(state.runnerUpItemId).toBe("item-4");
    expect(state.pendingMatchup).toBeNull();
  });

  it("resets the streak when the leader changes", () => {
    const shortlist = items(8);
    const afterTakeover = computeStartDuelState(shortlist, [
      match(1, "item-1", "item-2", "item-1"),
      match(2, "item-1", "item-3", "item-1"),
      match(3, "item-1", "item-4", "item-4"),
    ]);

    expect(afterTakeover.isComplete).toBe(false);
    expect(afterTakeover.leaderStreak).toBe(1);
    expect(afterTakeover.pendingMatchup).toEqual(
      match(4, "item-4", "item-5", null),
    );

    const finished = computeStartDuelState(shortlist, [
      match(1, "item-1", "item-2", "item-1"),
      match(2, "item-1", "item-3", "item-1"),
      match(3, "item-1", "item-4", "item-4"),
      match(4, "item-4", "item-5", "item-4"),
      match(5, "item-4", "item-6", "item-4"),
    ]);

    expect(finished.isComplete).toBe(true);
    expect(finished.pickItemId).toBe("item-4");
    expect(finished.runnerUpItemId).toBe("item-6");
    expect(finished.completedMatches).toBe(5);
  });

  it("caps a duel at 7 matchups even when the shortlist is longer", () => {
    const shortlist = items(9);
    const matchups: DomainMatchup[] = [
      match(1, "item-1", "item-2", "item-2"),
    ];
    for (let matchNumber = 2; matchNumber <= 7; matchNumber++) {
      const leader = `item-${matchNumber}`;
      const challenger = `item-${matchNumber + 1}`;
      matchups.push(match(matchNumber, leader, challenger, challenger));
    }

    const state = computeStartDuelState(shortlist, matchups);

    expect(state.isComplete).toBe(true);
    expect(state.completedMatches).toBe(7);
    expect(state.pickItemId).toBe("item-8");
    expect(state.runnerUpItemId).toBe("item-7");
  });

  it("finishes a two-item shortlist after one match", () => {
    const state = computeStartDuelState(items(2), [
      match(1, "item-1", "item-2", "item-2"),
    ]);

    expect(state.isComplete).toBe(true);
    expect(state.pickItemId).toBe("item-2");
    expect(state.runnerUpItemId).toBe("item-1");
    expect(state.maxMatches).toBe(1);
  });

  it("rejects a pairing that skips the king-of-the-hill order", () => {
    expect(() =>
      computeStartDuelState(items(4), [match(1, "item-1", "item-3", null)]),
    ).toThrow(/does not match/);
  });

  it("rejects matchups after the duel has already stopped", () => {
    expect(() =>
      computeStartDuelState(items(8), [
        match(1, "item-1", "item-2", "item-1"),
        match(2, "item-1", "item-3", "item-1"),
        match(3, "item-1", "item-4", "item-1"),
        match(4, "item-1", "item-5", "item-1"),
      ]),
    ).toThrow(/after the duel has ended/);
  });
});

describe("selectDuelCandidates", () => {
  const active = items(4);

  it("drops recent failures in the same window", () => {
    const result = selectDuelCandidates({
      activeItemIds: active,
      contextTime: "tonight",
      contextEnergy: "low",
      now: NOW,
      failures: [
        failure("item-1", "2026-10-30T12:00:00.000Z"),
        failure("item-2", "2026-10-20T12:00:00.000Z", "weekend", "low"),
      ],
    });

    expect(result.usedFullList).toBe(false);
    expect(result.itemIds).toEqual(["item-2", "item-3", "item-4"]);
  });

  it("keeps failures older than 14 days and failures from another window", () => {
    const stale = new Date(NOW.getTime() - CONTEXT_EXCLUSION_MS - 1).toISOString();
    const result = selectDuelCandidates({
      activeItemIds: active,
      contextTime: "tonight",
      contextEnergy: "low",
      now: NOW,
      failures: [
        failure("item-1", stale),
        failure("item-2", NOW.toISOString(), "tonight", "locked_in"),
      ],
    });

    expect(result.itemIds).toEqual(active);
    expect(result.usedFullList).toBe(false);
  });

  it("uses the full list when fewer than 2 items would remain", () => {
    const result = selectDuelCandidates({
      activeItemIds: ["item-1", "item-2"],
      contextTime: "weekend",
      contextEnergy: "medium",
      now: NOW,
      failures: [
        failure("item-1", NOW.toISOString(), "weekend", "medium"),
      ],
    });

    expect(result.usedFullList).toBe(true);
    expect(result.itemIds).toEqual(["item-1", "item-2"]);
  });
});

describe("buildDuelShortlist", () => {
  it("caps the shortlist at 8 and stays stable for a seed", () => {
    const pool = items(12);
    const first = buildDuelShortlist(pool, 42);
    const second = buildDuelShortlist(pool, 42);

    expect(first).toEqual(second);
    expect(first).toHaveLength(START_DUEL_SHORTLIST_CAP);
    expect(new Set(first).size).toBe(START_DUEL_SHORTLIST_CAP);
  });
});
