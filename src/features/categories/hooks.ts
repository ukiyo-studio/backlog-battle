import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import type { Category, CategoryWithItemCount } from "@/types/backlog";

import { fetchCategoriesWithItemCounts, fetchCategory } from "./api";

/**
 * Read hooks for categories. Fetches run on every screen focus (via
 * useFocusEffect) so lists refresh when navigating back after a mutation.
 */

interface QueryState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause));
}

/** Non-deleted categories, newest first, each with its live item count. */
export function useCategories(): QueryState<CategoryWithItemCount[]> {
  const [data, setData] = useState<CategoryWithItemCount[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      setData(await fetchCategoriesWithItemCounts());
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  return { data, isLoading, error, refetch };
}

/** A single non-deleted category by id; data is null when not found. */
export function useCategory(id: string): QueryState<Category> {
  const [data, setData] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setError(null);
      setData(await fetchCategory(id));
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  return { data, isLoading, error, refetch };
}
