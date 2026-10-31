import { View } from "react-native";

import { Text } from "@/components/ui";

export interface BattleProgressMeterProps {
  completedMatches: number;
  totalMatches: number;
  label?: string;
  countText?: string;
}

/** XP-style meter: "Match {next} of {total}" with a chunky fill bar. */
export function BattleProgressMeter({
  completedMatches,
  totalMatches,
  label = "Battle progress",
  countText,
}: BattleProgressMeterProps) {
  const progress =
    totalMatches > 0
      ? Math.min(Math.max(completedMatches, 0) / totalMatches, 1)
      : 0;
  const currentMatch = Math.min(completedMatches + 1, totalMatches);

  return (
    <View className="gap-2">
      <View className="flex-row justify-between">
        <Text variant="label">{label}</Text>
        <Text variant="caption">
          {countText ?? `Match ${currentMatch} of ${totalMatches}`}
        </Text>
      </View>
      <View className="h-5 overflow-hidden rounded border-3 border-border bg-muted">
        <View
          className="h-full bg-accent"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </View>
    </View>
  );
}
