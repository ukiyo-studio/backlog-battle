import { useCallback } from "react";

import { useFocusQuery, type FocusQueryResult } from "@/lib/use-focus-query";
import type { BattleRanking } from "@/types/backlog";

import {
  fetchBattleBundle,
  fetchBattlesForCategory,
  fetchDueStartCheck,
  fetchRanking,
  type BattleBundle,
  type CategoryBattle,
  type DueStartCheck,
} from "./api";

/**
 * The full battle bundle (battle + matchups + items + derived state).
 * Resolves to null (with no error) when the battle does not exist.
 */
export function useBattleBundle(
  battleId: string,
): FocusQueryResult<BattleBundle> {
  const fetcher = useCallback(() => fetchBattleBundle(battleId), [battleId]);
  return useFocusQuery(fetcher);
}

/** All battles for a category, newest first, with champion titles. */
export function useCategoryBattles(
  categoryId: string,
): FocusQueryResult<CategoryBattle[]> {
  const fetcher = useCallback(
    () => fetchBattlesForCategory(categoryId),
    [categoryId],
  );
  return useFocusQuery(fetcher);
}

/** Oldest due, unanswered follow-through for this user. */
export function useDueStartCheck(
  userId: string | undefined,
): FocusQueryResult<DueStartCheck> {
  const fetcher = useCallback(
    () => (userId ? fetchDueStartCheck(userId) : Promise.resolve(null)),
    [userId],
  );
  return useFocusQuery(fetcher);
}

/** The persisted final ranking for a battle, best rank first. */
export function useBattleRanking(
  battleId: string,
): FocusQueryResult<BattleRanking[]> {
  const fetcher = useCallback(() => fetchRanking(battleId), [battleId]);
  return useFocusQuery(fetcher);
}
