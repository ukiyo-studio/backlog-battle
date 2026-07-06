import { Redirect, Stack } from "expo-router";
import { View } from "react-native";

import { LoadingState } from "@/components/ui";

import { useAuth } from "../_layout";

export default function AppLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <LoadingState />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
