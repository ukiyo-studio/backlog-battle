import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
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
import { isDuelContextEnergy, isDuelContextTime } from "@/domain";
import { swapStartDuelRunnerUp } from "@/features/battles/api";
import { ChampionCard } from "@/features/battles/components";
import { useBattleBundle } from "@/features/battles/hooks";

function windowPhrase(time: string, energy: string): string | null {
  if (!isDuelContextTime(time) || !isDuelContextEnergy(energy)) return null;
  const energyLabel =
    energy === "low"
      ? "a low-energy"
      : energy === "medium"
        ? "a medium-energy"
        : "a locked-in";
  const timeLabel =
    time === "tonight" ? "tonight" : time === "weekend" ? "weekend" : "open-ended window";
  return `${energyLabel} ${timeLabel}`;
}

export default function StartCardScreen() {
  const { battleId } = useLocalSearchParams<{ battleId: string }>();
  const router = useRouter();
  const bundle = useBattleBundle(battleId ?? "");
  const [swapping, setSwapping] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
          title="Couldn't load this pick"
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
          title="Duel not found"
          description="This duel doesn't exist or belongs to another account."
          action={{ label: "Back home", onPress: () => router.replace("/(app)") }}
        />
      </Screen>
    );
  }

  if (bundle.data.algorithm !== "start_duel") {
    return <Redirect href={`/battles/${bundle.data.battle.id}/ranking`} />;
  }

  const { battle, itemsById, state, startCheck } = bundle.data;

  if (battle.status !== "completed") {
    return <Redirect href={`/battles/${battle.id}`} />;
  }

  const pickId = battle.pick_item_id ?? state.pickItemId;
  const runnerUpId = battle.runner_up_item_id ?? state.runnerUpItemId;
  const pickTitle = pickId ? (itemsById[pickId]?.title ?? "Your pick") : "Your pick";
  const runnerUpTitle = runnerUpId ? itemsById[runnerUpId]?.title : null;
  const phrase =
    battle.context_time && battle.context_energy
      ? windowPhrase(battle.context_time, battle.context_energy)
      : null;
  const canSwap = Boolean(
    runnerUpId && startCheck && !startCheck.runner_up_swapped && !startCheck.outcome,
  );

  const handleSwap = async () => {
    if (swapping) return;
    setSwapping(true);
    setActionError(null);
    try {
      await swapStartDuelRunnerUp(battle.id);
      await bundle.refetch();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Could not swap in the runner-up.",
      );
    } finally {
      setSwapping(false);
    }
  };

  return (
    <Screen contentClassName="gap-6 p-5 pb-10">
      <View className="mt-4 items-center gap-2">
        <Text variant="title" className="text-center">
          Start this
        </Text>
        {phrase ? (
          <Text variant="caption" className="text-center">
            You picked it for {phrase}.
          </Text>
        ) : null}
      </View>

      <ChampionCard title={pickTitle} badge="Your pick" />

      {runnerUpTitle ? (
        <Text variant="caption" className="text-center">
          Runner-up is {runnerUpTitle}.
        </Text>
      ) : null}

      {actionError ? (
        <Text variant="caption" className="text-center text-destructive">
          {actionError}
        </Text>
      ) : null}

      <Button onPress={() => router.replace("/(app)")} disabled={swapping}>
        I&apos;m starting this
      </Button>
      {canSwap && runnerUpTitle ? (
        <Button variant="outline" loading={swapping} onPress={() => void handleSwap()}>
          Show {runnerUpTitle} instead
        </Button>
      ) : null}
    </Screen>
  );
}
