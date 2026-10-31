import { useCallback } from "react";

import { useFocusQuery, type FocusQueryResult } from "@/lib/use-focus-query";

import { fetchReminderSettings, type ReminderSettings } from "./api";

/** Global reminder preferences (category_id is null for MVP). */
export function useReminderSettings(
  userId: string | undefined,
): FocusQueryResult<ReminderSettings> {
  const fetcher = useCallback(async () => {
    if (!userId) return null;
    return fetchReminderSettings(userId);
  }, [userId]);

  return useFocusQuery<ReminderSettings>(fetcher);
}
