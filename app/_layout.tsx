import type { Session } from "@supabase/supabase-js";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import "../global.css";

import {
  addNotificationResponseListener,
  configureNotificationHandler,
} from "@/lib/notifications";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme";
import type { AuthContextValue } from "@/types/auth";

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setIsLoading(false);
      },
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    configureNotificationHandler();

    const subscription = addNotificationResponseListener(() => {
      router.replace("/(app)");
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style="dark" />
    </AuthProvider>
  );
}
