import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Text,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";

import { useAuth } from "../_layout";

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 p-5 pb-10"
    >
      <View className="mt-4 gap-1">
        <Text variant="title">Backlog Battle</Text>
        <Text variant="caption">
          Signed in as {session?.user.email ?? "unknown"}
        </Text>
      </View>

      <Card>
        <CardHeader>
          <CardTitle>Your backlog arena</CardTitle>
          <CardDescription>
            Categories and battles arrive in the next phases. For now, check
            out the UI prototypes below.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          <Button
            variant="secondary"
            onPress={() => router.push("/prototype/matchup")}
          >
            Matchup prototype
          </Button>
          <Button
            variant="outline"
            onPress={() => router.push("/prototype/category-form")}
          >
            Category form prototype
          </Button>
        </CardContent>
      </Card>

      <Button variant="ghost" onPress={handleSignOut} loading={signingOut}>
        Sign out
      </Button>
    </ScrollView>
  );
}
