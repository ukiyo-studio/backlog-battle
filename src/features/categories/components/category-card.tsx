import * as React from "react";
import { Pressable } from "react-native";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Text,
  cn,
} from "@/components/ui";
import type { CategoryWithItemCount } from "@/types/backlog";

/**
 * Tappable category row for the home list. Pressing translates the card into
 * its hard shadow, matching the Button press treatment.
 */
export interface CategoryCardProps {
  category: CategoryWithItemCount;
  onPress: () => void;
}

export function CategoryCard({ category, onPress }: CategoryCardProps) {
  const [pressed, setPressed] = React.useState(false);
  const { name, description, itemCount } = category;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <Card
        className={cn(pressed && "translate-x-1 translate-y-1 shadow-none")}
      >
        <CardHeader className={description ? undefined : "pb-1"}>
          <CardTitle>{name}</CardTitle>
          {description ? (
            <CardDescription numberOfLines={2}>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <Text variant="caption">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Text>
        </CardContent>
      </Card>
    </Pressable>
  );
}
