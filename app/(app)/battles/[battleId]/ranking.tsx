import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
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
import { ChampionCard, RankRow } from "@/features/battles/components";
import { useBattleBundle, useBattleRanking } from "@/features/battles/hooks";
import { colors } from "@/theme";

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
        <ActivityIndicator size="large" color={colors.primary} />
      </Screen>
    );
  }

  const loadError = bundle.error ?? ranking.error;
  if (loadError) {
    return (
      <Screen contentClassName="flex-1 justify-center gap-6 p-5">
        <Card>
          <CardHeader>
            <CardTitle>Couldn&apos;t load the ranking</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onPress={() => {
                void bundle.refetch();
                void ranking.refetch();
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </Screen>
    );
  }

  if (!bundle.data) {
    return (
      <Screen contentClassName="flex-1 justify-center gap-6 p-5">
        <Card>
          <CardHeader>
            <CardTitle>Battle not found</CardTitle>
            <CardDescription>
              This battle doesn&apos;t exist or belongs to another account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onPress={() => router.replace("/(app)")}>Back home</Button>
          </CardContent>
        </Card>
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
        <Card>
          <CardHeader>
            <CardTitle>No ranking recorded</CardTitle>
            <CardDescription>
              This battle is marked complete but no ranking was saved.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Button onPress={() => router.replace(`/categories/${battle.category_id}`)}>
        Back to category
      </Button>
    </Screen>
  );
}
