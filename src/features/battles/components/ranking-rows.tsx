import { View } from "react-native";

import { Card, Text } from "@/components/ui";

/** Gold hero card for the tournament winner. */
export function ChampionCard({ title }: { title: string }) {
  return (
    <Card className="items-center gap-3 bg-secondary p-6">
      <View className="rounded border-2 border-border bg-card px-3 py-1">
        <Text variant="label">Champion</Text>
      </View>
      <View className="h-20 w-20 items-center justify-center rounded border-3 border-border bg-card">
        <Text variant="title" className="text-4xl">
          {title.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text
        variant="title"
        className="text-center text-2xl text-secondary-foreground"
      >
        {title}
      </Text>
    </Card>
  );
}

export interface RankRowProps {
  rank: number;
  title: string;
}

/** Calm ranked list row: rank badge + item title. */
export function RankRow({ rank, title }: RankRowProps) {
  return (
    <Card className="flex-row items-center gap-4 p-4">
      <View className="h-10 w-10 items-center justify-center rounded border-2 border-border bg-muted">
        <Text variant="heading" className="text-muted-foreground">
          {rank}
        </Text>
      </View>
      <Text variant="heading" className="flex-1" numberOfLines={2}>
        {title}
      </Text>
    </Card>
  );
}
