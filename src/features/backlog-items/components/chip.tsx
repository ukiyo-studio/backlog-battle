import { Pressable } from "react-native";

import { cn, Text } from "@/components/ui";

export interface ChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

/**
 * Small selectable pill used for status filters/selectors and quick-pick
 * type suggestions. Selected chips fill with the secondary color.
 */
export function Chip({ label, selected = false, disabled = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        "rounded border-3 border-border px-3 py-2",
        selected ? "bg-secondary" : "bg-card",
        disabled && "opacity-50",
      )}
    >
      <Text
        variant="label"
        className={selected ? "text-secondary-foreground" : "text-muted-foreground"}
      >
        {label}
      </Text>
    </Pressable>
  );
}
