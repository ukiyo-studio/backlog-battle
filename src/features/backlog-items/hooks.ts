import { useCallback } from "react";

import { supabase } from "@/lib/supabase";
import { useFocusQuery, type FocusQueryResult } from "@/lib/use-focus-query";
import type { BacklogItem, Category } from "@/types/backlog";

/**
 * The category row for the detail screen. Resolves to null (with no error)
 * when the category does not exist or was soft-deleted.
 */
export function useCategoryDetail(
  categoryId: string,
): FocusQueryResult<Category> {
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
export function useBacklogItems(
  categoryId: string,
): FocusQueryResult<BacklogItem[]> {
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
export function useBacklogItem(itemId: string): FocusQueryResult<BacklogItem> {
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
