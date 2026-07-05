import type { Session } from "@supabase/supabase-js";

export type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
};
