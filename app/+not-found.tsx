import { Link, Stack } from "expo-router";
import { View } from "react-native";

import { Screen, Text } from "@/components/ui";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found", headerShown: true }} />
      <Screen contentClassName="items-center justify-center gap-4 p-5">
        <View className="items-center gap-2">
          <Text variant="title">Screen not found</Text>
          <Text variant="caption" className="text-center">
            That route does not exist. Head back home and try again.
          </Text>
        </View>
        <Link href="/(app)" className="mt-2">
          <Text variant="label" className="text-primary underline">
            Go home
          </Text>
        </Link>
      </Screen>
    </>
  );
}
