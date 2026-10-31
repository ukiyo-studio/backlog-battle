import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Button, Screen, Text } from "@/components/ui";
import {
  DUEL_CONTEXT_ENERGIES,
  DUEL_CONTEXT_TIMES,
  type DuelContextEnergy,
  type DuelContextTime,
} from "@/domain";
import { Chip } from "@/features/backlog-items/components/chip";
import { startBattle } from "@/features/battles/api";

import { useAuth } from "../../../_layout";

const TIME_LABELS: Record<DuelContextTime, string> = {
  tonight: "Tonight",
  weekend: "This weekend",
  whenever: "Whenever",
};

const ENERGY_LABELS: Record<DuelContextEnergy, string> = {
  low: "Low",
  medium: "Medium",
  locked_in: "Locked in",
};

export default function StartDuelContextScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const categoryId = id ?? "";

  const [time, setTime] = useState<DuelContextTime>("tonight");
  const [energy, setEnergy] = useState<DuelContextEnergy>("low");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!session || starting) return;
    setStarting(true);
    setError(null);
    try {
      const battleId = await startBattle({
        userId: session.user.id,
        categoryId,
        contextTime: time,
        contextEnergy: energy,
      });
      router.replace(`/battles/${battleId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start the duel.");
      setStarting(false);
    }
  };

  return (
    <Screen contentClassName="gap-6 p-5 pb-10">
      <View className="mt-4 gap-1">
        <Text variant="title">Start a duel</Text>
        <Text variant="caption">
          Two questions, then at most seven choices. The duel stops once a pick
          is obvious.
        </Text>
      </View>

      <View className="gap-2">
        <Text variant="label">How much time?</Text>
        <View className="flex-row flex-wrap gap-2">
          {DUEL_CONTEXT_TIMES.map((option) => (
            <Chip
              key={option}
              label={TIME_LABELS[option]}
              selected={time === option}
              disabled={starting}
              onPress={() => setTime(option)}
            />
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Text variant="label">How much energy?</Text>
        <View className="flex-row flex-wrap gap-2">
          {DUEL_CONTEXT_ENERGIES.map((option) => (
            <Chip
              key={option}
              label={ENERGY_LABELS[option]}
              selected={energy === option}
              disabled={starting}
              onPress={() => setEnergy(option)}
            />
          ))}
        </View>
      </View>

      {error ? (
        <Text variant="caption" className="text-destructive">
          {error}
        </Text>
      ) : null}

      <Button onPress={() => void handleStart()} loading={starting}>
        Start duel
      </Button>
      <Button variant="outline" disabled={starting} onPress={() => router.back()}>
        Cancel
      </Button>
    </Screen>
  );
}
