import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  Text,
} from "@/components/ui";
import { CategoryCard } from "@/features/categories/components/category-card";
import { useCategories } from "@/features/categories/hooks";
import { supabase } from "@/lib/supabase";

export default function HomeScreen() {
  const router = useRouter();
  const { data: categories, isLoading, error, refetch } = useCategories();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
  };

  return (
    <Screen contentClassName="gap-6 p-5 pb-10">
      <View className="mt-4 gap-1">
        <Text variant="title">Backlog Battle</Text>
        <Text variant="caption">Your categories</Text>
      </View>

      <Button onPress={() => router.push("/categories/new")}>
        New category
      </Button>

      {isLoading ? (
        <LoadingState variant="inline" />
      ) : error ? (
        <ErrorState
          description={`We couldn't load your categories. ${error.message}`}
          onRetry={() => void refetch()}
        />
      ) : categories && categories.length > 0 ? (
        <View className="gap-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => router.push(`/categories/${category.id}`)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          title="No categories yet"
          description="Create your first arena — a category groups the backlog items that battle each other, like Steam games or unread books."
          action={{
            label: "Create a category",
            onPress: () => router.push("/categories/new"),
          }}
        />
      )}

      <Button variant="outline" onPress={() => router.push("/settings/reminders")}>
        Reminders
      </Button>

      <Button variant="ghost" onPress={handleSignOut} loading={signingOut}>
        Sign out
      </Button>
    </Screen>
  );
}
