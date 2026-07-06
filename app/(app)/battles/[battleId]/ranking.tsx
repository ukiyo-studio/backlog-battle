import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";

import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  Text,
} from "@/components/ui";
import { ChampionCard, RankRow } from "@/features/battles/components";
import { useBattleBundle, useBattleRanking } from "@/features/battles/hooks";

export default function BattleRankingScreen() {
  const { battleId } = useLocalSearchParams<{ battleId: string }>();
  const router = useRouter();
  const bundle = useBattleBundle(battleId ?? "");
  const ranking = useBattleRanking(battleId ?? "");

  if (
    (bundle.isLoading && !bundle.data) ||
    (ranking.isLoading && !ranking.data)
  ) {
    return (
      <Screen scroll={false} className="items-center justify-center">
        <LoadingState />
      </Screen>
    );
  }

  const loadError = bundle.error ?? ranking.error;
  if (loadError) {
    return (
      <Screen contentClassName="flex-1 justify-center gap-6 p-5">
        <ErrorState
          title="Couldn't load the ranking"
          description={loadError}
          onRetry={() => {
            void bundle.refetch();
            void ranking.refetch();
          }}
        />
      </Screen>
    );
  }

  if (!bundle.data) {
    return (
      <Screen contentClassName="flex-1 justify-center gap-6 p-5">
        <EmptyState
          title="Battle not found"
          description="This battle doesn't exist or belongs to another account."
          action={{ label: "Back home", onPress: () => router.replace("/(app)") }}
        />
      </Screen>
    );
  }

  const { battle, itemsById } = bundle.data;

  // Not finished yet (or abandoned) — the play screen owns those states.
  if (battle.status !== "completed") {
    return <Redirect href={`/battles/${battle.id}`} />;
  }

  const rows = ranking.data ?? [];
  const titleFor = (itemId: string) => itemsById[itemId]?.title ?? "Unknown item";
  const champion = rows.find((row) => row.rank === 1);
  const rest = rows.filter((row) => row.rank !== 1);

  return (
    <Screen contentClassName="gap-6 p-5 pb-10">
      <View className="mt-4 items-center gap-2">
        <Text variant="title" className="text-center">
          Final ranking
        </Text>
        <Text variant="caption">
          {battle.participant_item_ids.length} contenders battled it out
        </Text>
      </View>

      {champion ? <ChampionCard title={titleFor(champion.item_id)} /> : null}

      {rest.length > 0 ? (
        <View className="gap-3">
          {rest.map((row) => (
            <RankRow key={row.id} rank={row.rank} title={titleFor(row.item_id)} />
          ))}
        </View>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No ranking recorded"
          description="This battle is marked complete but no ranking was saved."
        />
      ) : null}

      <Button onPress={() => router.replace(`/categories/${battle.category_id}`)}>
        Back to category
      </Button>
    </Screen>
  );
}
