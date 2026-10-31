import { useCallback } from "react";

import { useFocusQuery, type FocusQueryResult } from "@/lib/use-focus-query";
import type { BattleRanking } from "@/types/backlog";

import {
  fetchBattleBundle,
  fetchBattlesForCategory,
  fetchRanking,
  type BattleBundle,
  type CategoryBattle,
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

/** The persisted final ranking for a battle, best rank first. */
export function useBattleRanking(
  battleId: string,
): FocusQueryResult<BattleRanking[]> {
  const fetcher = useCallback(() => fetchRanking(battleId), [battleId]);
  return useFocusQuery(fetcher);
}
