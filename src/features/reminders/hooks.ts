import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { fetchReminderSettings, type ReminderSettings } from "./api";

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

/** Global reminder preferences (category_id is null for MVP). */
export function useReminderSettings(userId: string | undefined): QueryResult<ReminderSettings> {
  const fetcher = useCallback(async () => {
    if (!userId) return null;
    return fetchReminderSettings(userId);
  }, [userId]);

  return useFocusQuery<ReminderSettings>(fetcher);
}
