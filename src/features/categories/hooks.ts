import { useCallback } from "react";

import { useFocusQuery, type FocusQueryResult } from "@/lib/use-focus-query";
import type { Category, CategoryWithItemCount } from "@/types/backlog";

import { fetchCategoriesWithItemCounts, fetchCategory } from "./api";

/**
 * Read hooks for categories. Fetches run on every screen focus (via
 * useFocusEffect) so lists refresh when navigating back after a mutation.
 */

/** Non-deleted categories, newest first, each with its live item count. */
export function useCategories(): FocusQueryResult<CategoryWithItemCount[]> {
  const fetcher = useCallback(() => fetchCategoriesWithItemCounts(), []);
  return useFocusQuery(fetcher);
}

/** A single non-deleted category by id; data is null when not found. */
export function useCategory(id: string): FocusQueryResult<Category> {
  const fetcher = useCallback(() => fetchCategory(id), [id]);
  return useFocusQuery(fetcher);
}
