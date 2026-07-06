import { useLocalSearchParams, useRouter } from "expo-router";
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
import {
  BacklogItemRow,
  StatusFilter,
  statusLabel,
} from "@/features/backlog-items/components";
import { useBacklogItems, useCategoryDetail } from "@/features/backlog-items/hooks";
import { startBattle } from "@/features/battles/api";
import type { ItemStatus } from "@/types/backlog";

import { useAuth } from "../../../_layout";

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const categoryId = id ?? "";

  const { session } = useAuth();
  const category = useCategoryDetail(categoryId);
  const items = useBacklogItems(categoryId);
  const [statusFilter, setStatusFilter] = useState<ItemStatus>("active");
  const [startingBattle, setStartingBattle] = useState(false);
  const [battleError, setBattleError] = useState<string | null>(null);

  const activeItemCount = (items.data ?? []).filter(
    (item) => item.status === "active",
  ).length;
  const canBattle = activeItemCount >= 2;

  const handleStartBattle = async () => {
    if (!session) return;
    setStartingBattle(true);
    setBattleError(null);
    try {
      const battleId = await startBattle({
        userId: session.user.id,
        categoryId,
      });
      router.push(`/battles/${battleId}`);
    } catch (cause) {
      setBattleError(
        cause instanceof Error ? cause.message : "Could not start the battle.",
      );
    } finally {
      setStartingBattle(false);
    }
  };

  if (category.isLoading && !category.data) {
    return (
      <Screen scroll={false} className="items-center justify-center">
        <LoadingState />
      </Screen>
    );
  }

  if (category.error) {
    return (
      <Screen contentClassName="flex-1 justify-center gap-6 p-5">
        <ErrorState
          title="Couldn't load this category"
          description={category.error}
          onRetry={() => {
            void category.refetch();
            void items.refetch();
          }}
        />
      </Screen>
    );
  }

  if (!category.data) {
    return (
      <Screen contentClassName="flex-1 justify-center gap-6 p-5">
        <EmptyState
          title="Category not found"
          description="This category doesn't exist or has been deleted."
          action={{ label: "Back home", onPress: () => router.replace("/(app)") }}
        />
      </Screen>
    );
  }

  const allItems = items.data ?? [];
  const filteredItems = allItems.filter((item) => item.status === statusFilter);

  return (
    <Screen contentClassName="gap-6 p-5 pb-10">
      <View className="mt-4 flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text variant="title">{category.data.name}</Text>
          {category.data.description ? (
            <Text variant="caption">{category.data.description}</Text>
          ) : null}
        </View>
        <Button
          variant="outline"
          size="sm"
          onPress={() => router.push(`/categories/${categoryId}/edit`)}
        >
          Edit
        </Button>
      </View>

      {/* Battle arena entry — the playful core loop lives behind this. */}
      <View className="gap-2">
        <View className="flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onPress={() => void handleStartBattle()}
            loading={startingBattle}
            disabled={!canBattle}
          >
            Start battle
          </Button>
          <Button
            variant="outline"
            onPress={() => router.push(`/categories/${categoryId}/battles`)}
          >
            History
          </Button>
        </View>
        {!canBattle ? (
          <Text variant="caption">
            You need at least 2 active items to start a battle
            {activeItemCount === 1 ? " — one more to go!" : "."}
          </Text>
        ) : null}
        {battleError ? (
          <Text variant="caption" className="text-destructive">
            {battleError}
          </Text>
        ) : null}
      </View>

      <StatusFilter selected={statusFilter} onSelect={setStatusFilter} />

      <Button onPress={() => router.push(`/categories/${categoryId}/items/new`)}>
        Add item
      </Button>

      {items.error ? (
        <ErrorState
          title="Couldn't load items"
          description={items.error}
          retryVariant="outline"
          onRetry={() => void items.refetch()}
        />
      ) : items.isLoading && !items.data ? (
        <LoadingState variant="inline" />
      ) : allItems.length === 0 ? (
        <EmptyState
          title="No items yet"
          description="Add your first item to start filling this backlog. You'll need at least 2 active items to run a battle."
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title={`Nothing ${statusLabel(statusFilter).toLowerCase()} here`}
          description="No items with this status. Try another filter above."
        />
      ) : (
        <View className="gap-3">
          {filteredItems.map((item) => (
            <BacklogItemRow
              key={item.id}
              item={item}
              onPress={() =>
                router.push(`/categories/${categoryId}/items/${item.id}/edit`)
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
