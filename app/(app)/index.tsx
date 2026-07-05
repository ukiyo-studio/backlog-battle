import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";

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
import { CategoryCard } from "@/features/categories/components/category-card";
import { useCategories } from "@/features/categories/hooks";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme";

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
        <View className="items-center py-12">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>
              We couldn&apos;t load your categories. {error.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" onPress={() => void refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
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
        <Card>
          <CardHeader>
            <CardTitle>No categories yet</CardTitle>
            <CardDescription>
              Create your first arena — a category groups the backlog items
              that battle each other, like Steam games or unread books.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onPress={() => router.push("/categories/new")}>
              Create a category
            </Button>
          </CardContent>
        </Card>
      )}

      <Button variant="ghost" onPress={handleSignOut} loading={signingOut}>
        Sign out
      </Button>
    </Screen>
  );
}
