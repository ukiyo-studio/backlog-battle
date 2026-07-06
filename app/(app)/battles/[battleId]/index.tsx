import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  Text,
} from "@/components/ui";
import type { BattleState, DomainMatchup } from "@/domain";
import {
  abandonBattle,
  recordWinner,
  type BattleBundle,
  type BattleItem,
} from "@/features/battles/api";
import {
  BattleProgressMeter,
  ChallengerCard,
  VsBadge,
} from "@/features/battles/components";
import { useBattleBundle } from "@/features/battles/hooks";
import { confirmDestructive } from "@/lib/confirm";

interface LiveBattle {
  /** The bundle this continuation was derived from; a new fetch resets it. */
  source: BattleBundle;
  state: BattleState;
  matchups: DomainMatchup[];
}

export default function BattlePlayScreen() {
  const { battleId } = useLocalSearchParams<{ battleId: string }>();
  const router = useRouter();
  const bundle = useBattleBundle(battleId ?? "");

  // Local continuation of the tournament between picks; re-synced whenever
  // the bundle refetches (focus, retry) so mid-battle resume just works.
  // Render-time state adjustment ("storing information from previous
  // renders") instead of an effect, per React guidance.
  const [live, setLive] = useState<LiveBattle | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (bundle.data && live?.source !== bundle.data) {
    setLive({
      source: bundle.data,
      state: bundle.data.state,
      matchups: bundle.data.matchups,
    });
  }

  if (bundle.isLoading && !bundle.data) {
    return (
      <Screen scroll={false} className="items-center justify-center">
        <LoadingState />
      </Screen>
    );
  }

  if (bundle.error) {
    return (
      <Screen contentClassName="flex-1 justify-center gap-6 p-5">
        <ErrorState
          title="Couldn't load this battle"
          description={bundle.error}
          onRetry={() => void bundle.refetch()}
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

  const bundleData = bundle.data;
  const { battle, itemsById } = bundleData;

  if (battle.status === "completed") {
    return <Redirect href={`/battles/${battle.id}/ranking`} />;
  }

  if (battle.status === "abandoned") {
    return (
      <Screen contentClassName="flex-1 justify-center gap-6 p-5">
        <Card>
          <CardHeader>
            <CardTitle>Battle abandoned</CardTitle>
            <CardDescription>
              This battle was abandoned before a champion was crowned.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <Button
              onPress={() =>
                router.replace(`/categories/${battle.category_id}/battles`)
              }
            >
              Battle history
            </Button>
            <Button variant="outline" onPress={() => router.replace("/(app)")}>
              Back home
            </Button>
          </CardContent>
        </Card>
      </Screen>
    );
  }

  const current = live?.source === bundleData ? live : null;
  const state = current?.state ?? bundleData.state;
  const matchups = current?.matchups ?? bundleData.matchups;
  const matchup = state.nextMatchup;

  // Every matchup is decided but the battle row hasn't flipped to completed
  // (e.g. finalization was interrupted). Let the user hop to the ranking.
  if (!matchup) {
    return (
      <Screen contentClassName="flex-1 justify-center gap-6 p-5">
        <Card>
          <CardHeader>
            <CardTitle>Battle finished</CardTitle>
            <CardDescription>Every matchup has been decided.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onPress={() => router.replace(`/battles/${battle.id}/ranking`)}>
              View ranking
            </Button>
          </CardContent>
        </Card>
      </Screen>
    );
  }

  const itemFor = (id: string): BattleItem =>
    itemsById[id] ?? { id, title: "Unknown item", item_type: null };
  const itemA = itemFor(matchup.itemAId);
  const itemB = itemFor(matchup.itemBId);

  const handlePick = async (winnerItemId: string) => {
    if (submitting) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const result = await recordWinner({
        battleId: battle.id,
        categoryId: battle.category_id,
        matchup,
        winnerItemId,
        participantItemIds: battle.participant_item_ids,
        allMatchups: matchups,
      });
      if (result.state.isComplete) {
        router.replace(`/battles/${battle.id}/ranking`);
        return;
      }
      setLive({
        source: bundleData,
        state: result.state,
        matchups: result.matchups,
      });
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not record the winner.",
      );
      // Re-sync from the database in case local state went stale.
      void bundle.refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbandon = () => {
    confirmDestructive({
      title: "Abandon battle?",
      message:
        "Progress so far will be kept in history, but this battle won't crown a champion.",
      confirmLabel: "Abandon",
      onConfirm: () => {
        void (async () => {
          try {
            await abandonBattle(battle.id);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace(`/categories/${battle.category_id}`);
            }
          } catch (cause) {
            setActionError(
              cause instanceof Error
                ? cause.message
                : "Could not abandon the battle.",
            );
          }
        })();
      },
    });
  };

  return (
    <Screen contentClassName="gap-6 p-5 pb-10">
      {/* Round banner */}
      <View className="mt-4 items-center gap-2">
        <View className="rounded border-3 border-border bg-accent px-5 py-1.5 shadow-box-sm">
          <Text variant="label" className="text-base text-accent-foreground">
            Round {state.currentRoundNumber}
          </Text>
        </View>
        <Text variant="title" className="text-center">
          Who wins?
        </Text>
        <Text variant="caption">Tap the one you&apos;d rather pick right now</Text>
      </View>

      {/* Matchup */}
      <View className="gap-3">
        <ChallengerCard
          title={itemA.title}
          note={itemA.item_type}
          disabled={submitting}
          onPress={() => void handlePick(itemA.id)}
        />
        <VsBadge />
        <ChallengerCard
          title={itemB.title}
          note={itemB.item_type}
          disabled={submitting}
          onPress={() => void handlePick(itemB.id)}
        />
      </View>

      {actionError ? (
        <Card className="border-destructive">
          <CardHeader>
            <CardDescription className="text-destructive">
              {actionError}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <BattleProgressMeter
        completedMatches={state.completedMatches}
        totalMatches={state.totalMatches}
      />

      <Button
        variant="ghost"
        onPress={handleAbandon}
        disabled={submitting}
        textClassName="text-destructive"
      >
        Abandon battle
      </Button>
    </Screen>
  );
}
