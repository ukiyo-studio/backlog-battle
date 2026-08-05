import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";

import {
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  Text,
} from "@/components/ui";
import type { CategoryBattle } from "@/features/battles/api";
import { BattleRow } from "@/features/battles/components";
import { useCategoryBattles } from "@/features/battles/hooks";

export default function CategoryBattlesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const categoryId = id ?? "";
  const battles = useCategoryBattles(categoryId);

  const openBattle = (battle: CategoryBattle) => {
    if (battle.status === "completed") {
      router.push(`/battles/${battle.id}/ranking`);
    } else {
      // Active battles resume play; abandoned ones show their status card.
      router.push(`/battles/${battle.id}`);
    }
  };

  if (battles.isLoading && !battles.data) {
    return (
      <Screen scroll={false} className="items-center justify-center">
        <LoadingState />
      </Screen>
    );
  }

  if (battles.error) {
    return (
      <Screen contentClassName="flex-1 justify-center gap-6 p-5">
        <ErrorState
          title="Couldn't load battles"
          description={battles.error}
          onRetry={() => void battles.refetch()}
        />
      </Screen>
    );
  }

  const rows = battles.data ?? [];

  return (
    <Screen contentClassName="gap-6 p-5 pb-10">
      <View className="mt-4 gap-1">
        <Text variant="title">Battles</Text>
        <Text variant="caption">Every battle in this category, newest first</Text>
      </View>

      {rows.length === 0 ? (
        <EmptyState
          title="No battles yet"
          description="Start one from the category to crown your first champion."
          action={{
            label: "Back to category",
            onPress: () => router.replace(`/categories/${categoryId}`),
          }}
          actionVariant="outline"
        />
      ) : (
        <View className="gap-3">
          {rows.map((battle) => (
            <BattleRow
              key={battle.id}
              battle={battle}
              onPress={() => openBattle(battle)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
