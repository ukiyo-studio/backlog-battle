import { Pressable, View } from "react-native";

import { Card, cn, Text } from "@/components/ui";
import type { BacklogItem } from "@/types/backlog";

export interface BacklogItemRowProps {
  item: BacklogItem;
  onPress: () => void;
}

/** Tappable list row for a backlog item: title, optional type badge + notes. */
export function BacklogItemRow({ item, onPress }: BacklogItemRowProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {({ pressed }) => (
        <Card className={cn("p-4", pressed && "translate-x-1 translate-y-1 shadow-none")}>
          <View className="flex-row items-center justify-between gap-3">
            <Text variant="heading" className="flex-1" numberOfLines={2}>
              {item.title}
            </Text>
            {item.item_type ? (
              <View className="rounded border-2 border-border bg-muted px-2 py-1">
                <Text variant="label" className="text-muted-foreground">
                  {item.item_type}
                </Text>
              </View>
            ) : null}
          </View>
          {item.description ? (
            <Text variant="caption" className="mt-1" numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </Card>
      )}
    </Pressable>
  );
}
