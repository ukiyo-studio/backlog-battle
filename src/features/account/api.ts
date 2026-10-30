import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

async function messageFromFunctionsError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json();
      if (
        payload &&
        typeof payload === "object" &&
        typeof (payload as { error?: unknown }).error === "string"
      ) {
        return (payload as { error: string }).error;
      }
    } catch {
      // Fall through to the generic message.
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Could not delete account.";
}

/**
 * Permanently deletes the signed-in user's auth account and owned data via the
 * delete-account Edge Function. The function derives the user id from the JWT;
 * the client must not send a user id.
 */
export async function deleteAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke("delete-account", {
    method: "POST",
    body: {},
  });

  if (error) {
    throw new Error(await messageFromFunctionsError(error));
  }

  if (data && typeof data === "object" && "error" in data) {
    const message =
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Could not delete account.";
    throw new Error(message);
  }
}
