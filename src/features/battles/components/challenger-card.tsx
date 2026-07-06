import { useState } from "react";
import { Pressable, View, type GestureResponderEvent } from "react-native";

import { cn, Text } from "@/components/ui";

export interface ChallengerCardProps {
  title: string;
  /** Optional supporting line, e.g. the item type. */
  note?: string | null;
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
}

/**
 * Tappable challenger panel with the same press-into-shadow feel as Button.
 * Initial-letter avatar — item images are optional in MVP.
 */
export function ChallengerCard({
  title,
  note,
  disabled = false,
  onPress,
}: ChallengerCardProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Pick ${title}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className={cn(
        "flex-row items-center gap-4 rounded border-3 border-border bg-card p-4 shadow-box-lg",
        pressed && !disabled && "translate-x-1 translate-y-1 shadow-none",
        disabled && "opacity-50",
      )}
    >
      <View className="h-14 w-14 items-center justify-center rounded border-3 border-border bg-secondary">
        <Text variant="title" className="text-2xl text-secondary-foreground">
          {title.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1 gap-1">
        <Text variant="heading" numberOfLines={2}>
          {title}
        </Text>
        {note ? <Text variant="caption">{note}</Text> : null}
      </View>
      <Text variant="label" className="text-accent">
        Pick
      </Text>
    </Pressable>
  );
}

/** Tilted coin-colored VS badge that sits between the two challenger cards. */
export function VsBadge() {
  return (
    <View className="z-10 -my-6 items-center">
      <View className="h-12 w-12 -rotate-6 items-center justify-center rounded border-3 border-border bg-secondary shadow-box">
        <Text variant="label" className="text-base text-secondary-foreground">
          VS
        </Text>
      </View>
    </View>
  );
}
