import { Pressable, View } from "react-native";

import { Card, cn, Text } from "@/components/ui";
import type { BattleStatus } from "@/types/backlog";

import type { CategoryBattle } from "../api";

const statusBadge: Record<BattleStatus, { label: string; className: string; textClassName: string }> = {
  active: { label: "Active", className: "bg-accent", textClassName: "text-accent-foreground" },
  completed: { label: "Completed", className: "bg-secondary", textClassName: "text-secondary-foreground" },
  abandoned: { label: "Abandoned", className: "bg-muted", textClassName: "text-muted-foreground" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export interface BattleRowProps {
  battle: CategoryBattle;
  onPress: () => void;
}

/** Tappable history row: start date, status badge, and outcome line. */
export function BattleRow({ battle, onPress }: BattleRowProps) {
  const status = (battle.status as BattleStatus) ?? "active";
  const badge = statusBadge[status] ?? statusBadge.active;
  const isAbandoned = status === "abandoned";

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {({ pressed }) => (
        <Card
          className={cn(
            "gap-2 p-4",
            pressed && "translate-x-1 translate-y-1 shadow-none",
            isAbandoned && "opacity-60",
          )}
        >
          <View className="flex-row items-center justify-between gap-3">
            <Text variant="heading" className="flex-1">
              {formatDate(battle.started_at)}
            </Text>
            <View className={cn("rounded border-2 border-border px-2 py-1", badge.className)}>
              <Text variant="label" className={badge.textClassName}>
                {badge.label}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between gap-3">
            <Text variant="caption" className="flex-1">
              {battle.participant_item_ids.length} contenders
            </Text>
            {status === "active" ? (
              <Text variant="label" className="text-accent">
                Continue
              </Text>
            ) : status === "completed" && battle.championTitle ? (
              <Text variant="caption" numberOfLines={1} className="max-w-[60%]">
                Champion: {battle.championTitle}
              </Text>
            ) : null}
          </View>
        </Card>
      )}
    </Pressable>
  );
}
