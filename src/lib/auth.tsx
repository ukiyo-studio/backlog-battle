import type { Session } from "@supabase/supabase-js";
import * as SplashScreen from "expo-splash-screen";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import { supabase } from "@/lib/supabase";
import type { AuthContextValue } from "@/types/auth";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash may already be hidden in web / fast refresh; ignore.
});

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        setSession(data.session);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSession(null);
        setIsLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setIsLoading(false);
      },
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    void SplashScreen.hideAsync();
  }, [isLoading]);

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
