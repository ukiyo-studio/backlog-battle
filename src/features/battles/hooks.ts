import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type { BattleRanking } from "@/types/backlog";

import {
  fetchBattleBundle,
  fetchBattlesForCategory,
  fetchRanking,
  type BattleBundle,
  type CategoryBattle,
} from "./api";

interface QueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Shared fetch-on-focus state machine (local copy of the pattern used by
 * other features — features do not import from each other). isLoading is
 * true while a fetch is in flight; screens that keep stale data visible
 * should gate spinners on `isLoading && !data`.
 */
function useFocusQuery<T>(fetcher: () => Promise<T | null>): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  return { data, isLoading, error, refetch };
}

/**
 * The full battle bundle (battle + matchups + items + derived state).
 * Resolves to null (with no error) when the battle does not exist.
 */
export function useBattleBundle(battleId: string): QueryResult<BattleBundle> {
  const fetcher = useCallback(() => fetchBattleBundle(battleId), [battleId]);
  return useFocusQuery(fetcher);
}

/** All battles for a category, newest first, with champion titles. */
export function useCategoryBattles(
  categoryId: string,
): QueryResult<CategoryBattle[]> {
  const fetcher = useCallback(
    () => fetchBattlesForCategory(categoryId),
    [categoryId],
  );
  return useFocusQuery(fetcher);
}

/** The persisted final ranking for a battle, best rank first. */
export function useBattleRanking(battleId: string): QueryResult<BattleRanking[]> {
  const fetcher = useCallback(() => fetchRanking(battleId), [battleId]);
  return useFocusQuery(fetcher);
}
