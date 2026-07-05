import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { BacklogItem, Category } from "@/types/backlog";

interface QueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Shared fetch-on-focus state machine. isLoading is true while a fetch is in
 * flight; screens that keep stale data visible should gate spinners on
 * `isLoading && !data`.
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
 * The category row for the detail screen. Resolves to null (with no error)
 * when the category does not exist or was soft-deleted.
 */
export function useCategoryDetail(categoryId: string): QueryResult<Category> {
  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", categoryId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }, [categoryId]);

  return useFocusQuery<Category>(fetcher);
}

/**
 * All non-deleted items in a category (every status), newest first. Status
 * filtering happens client-side so screens can tell "no items at all" apart
 * from "nothing with this status".
 */
export function useBacklogItems(categoryId: string): QueryResult<BacklogItem[]> {
  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from("backlog_items")
      .select("*")
      .eq("category_id", categoryId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }, [categoryId]);

  return useFocusQuery(fetcher);
}

/** A single non-deleted item, for the edit screen. Null when missing. */
export function useBacklogItem(itemId: string): QueryResult<BacklogItem> {
  const fetcher = useCallback(async () => {
    const { data, error } = await supabase
      .from("backlog_items")
      .select("*")
      .eq("id", itemId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }, [itemId]);

  return useFocusQuery<BacklogItem>(fetcher);
}
