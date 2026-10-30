import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Screen,
  Text,
} from "@/components/ui";
import { deleteAccount } from "@/features/account/api";
import { confirmDestructive } from "@/lib/confirm";
import { supabase } from "@/lib/supabase";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDeletion = async () => {
    setDeleting(true);
    setError(null);

    try {
      await deleteAccount();
      // Auth user is already gone server-side; clear the local session only.
      await supabase.auth.signOut({ scope: "local" });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not delete account.",
      );
      setDeleting(false);
    }
  };

  const handleDeletePress = () => {
    confirmDestructive({
      title: "Delete account?",
      message:
        "This permanently deletes your account and all of your data — profile, categories, backlog items, battles, rankings, reminder settings, and push tokens. You will not be able to sign in again with this account.",
      confirmLabel: "Delete account",
      onConfirm: () => {
        void runDeletion();
      },
    });
  };

  return (
    <Screen contentClassName="p-5 pb-10">
      <View className="mb-6 gap-2">
        <Text variant="title">Account</Text>
        <Text variant="caption">Manage your Backlog Battle account.</Text>
      </View>

      <Card>
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
          <CardDescription>
            Permanently remove your account and all associated data. This cannot
            be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          {error ? (
            <Text variant="caption" className="text-destructive">
              {error}
            </Text>
          ) : null}

          <Button
            variant="destructive"
            onPress={handleDeletePress}
            loading={deleting}
            accessibilityLabel="Delete account"
          >
            Delete account
          </Button>
        </CardContent>
      </Card>

      <View className="mt-6">
        <Button variant="ghost" onPress={() => router.back()} disabled={deleting}>
          Back
        </Button>
      </View>
    </Screen>
  );
}
