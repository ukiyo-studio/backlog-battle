import { Sentry } from "@/lib/sentry";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";

import "../global.css";

import { LoadingState } from "@/components/ui";
import { AuthProvider, useAuth } from "@/lib/auth";
import {
  addNotificationResponseListener,
  configureNotificationHandler,
  ensureAndroidNotificationChannel,
} from "@/lib/notifications";
import { colors } from "@/theme";

function RootNavigator() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    configureNotificationHandler();
    void ensureAndroidNotificationChannel();

    const subscription = addNotificationResponseListener(() => {
      // Reminder payloads currently only carry `{ type: "reminder" }`.
      router.replace("/(app)");
    });

    return () => subscription.remove();
  }, [router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <LoadingState />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Screen name="index" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

export default Sentry.wrap(RootLayout);
