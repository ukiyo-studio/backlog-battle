import { Redirect, useRouter } from "expo-router";
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
import {
  START_DUEL_MAX_MATCHES,
  type DomainMatchup,
  type StartDuelState,
} from "@/domain";
import { confirmDestructive } from "@/lib/confirm";

import { abandonBattle, recordStartDuelChoice, type BattleItem, type StartDuelBattleBundle } from "../api";
import { BattleProgressMeter } from "./battle-progress-meter";
import { ChallengerCard, VsBadge } from "./challenger-card";

interface LiveDuel {
  source: StartDuelBattleBundle;
  state: StartDuelState;
  matchups: DomainMatchup[];
}

export function StartDuelPlay({
  bundle,
  onRefetch,
}: {
  bundle: StartDuelBattleBundle;
  onRefetch: () => void;
}) {
  const router = useRouter();
  const [live, setLive] = useState<LiveDuel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (live?.source !== bundle) {
    setLive({
      source: bundle,
      state: bundle.state,
      matchups: bundle.matchups,
    });
  }

  const { battle, itemsById } = bundle;

  if (battle.status === "completed") {
    return <Redirect href={`/battles/${battle.id}/start`} />;
  }

  if (battle.status === "abandoned") {
    return (
      <Screen contentClassName="flex-1 justify-center gap-6 p-5">
        <Card>
          <CardHeader>
            <CardTitle>Duel abandoned</CardTitle>
            <CardDescription>
              This duel was abandoned before it named a pick.
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

  const current = live?.source === bundle ? live : null;
  const state = current?.state ?? bundle.state;
  const matchups = current?.matchups ?? bundle.matchups;
  const matchup = state.nextMatchup;

  if (!matchup) {
    return (
      <Screen contentClassName="flex-1 justify-center gap-6 p-5">
        <Card>
          <CardHeader>
            <CardTitle>Duel finished</CardTitle>
            <CardDescription>Every choice in this duel is in.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onPress={() => router.replace(`/battles/${battle.id}/start`)}>
              See your pick
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
  const choiceNumber = Math.min(state.completedMatches + 1, START_DUEL_MAX_MATCHES);

  const handlePick = async (winnerItemId: string) => {
    if (submitting) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const result = await recordStartDuelChoice({
        battleId: battle.id,
        matchup,
        winnerItemId,
        participantItemIds: battle.participant_item_ids,
        allMatchups: matchups,
      });
      if (result.state.isComplete) {
        router.replace(`/battles/${battle.id}/start`);
        return;
      }
      setLive({
        source: bundle,
        state: result.state,
        matchups: result.matchups,
      });
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not record the choice.",
      );
      onRefetch();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbandon = () => {
    confirmDestructive({
      title: "Abandon duel?",
      message: "Progress so far stays in history, but this duel won't name a pick.",
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
              cause instanceof Error ? cause.message : "Could not abandon the duel.",
            );
          }
        })();
      },
    });
  };

  return (
    <Screen contentClassName="gap-6 p-5 pb-10">
      <View className="mt-4 items-center gap-2">
        <Text variant="title" className="text-center">
          Which would you open?
        </Text>
        <Text variant="caption">Tap the one you&apos;d open in this window</Text>
      </View>

      {battle.pool_fallback ? (
        <Text variant="caption" className="text-center">
          Recent picks in this window didn&apos;t stick, so this duel uses the full
          list.
        </Text>
      ) : null}

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
        totalMatches={START_DUEL_MAX_MATCHES}
        label="This duel"
        countText={`Choice ${choiceNumber} of up to ${START_DUEL_MAX_MATCHES}`}
      />

      <Button
        variant="ghost"
        onPress={handleAbandon}
        disabled={submitting}
        textClassName="text-destructive"
      >
        Abandon duel
      </Button>
    </Screen>
  );
}
