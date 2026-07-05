import { View } from "react-native";

import { ITEM_STATUSES, type ItemStatus } from "@/types/backlog";

import { Chip } from "./chip";

export function statusLabel(status: ItemStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export interface StatusFilterProps {
  selected: ItemStatus;
  onSelect: (status: ItemStatus) => void;
  disabled?: boolean;
}

/** Segmented row of status chips (Active / Completed / Archived / Removed). */
export function StatusFilter({ selected, onSelect, disabled = false }: StatusFilterProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {ITEM_STATUSES.map((status) => (
        <Chip
          key={status}
          label={statusLabel(status)}
          selected={selected === status}
          disabled={disabled}
          onPress={() => onSelect(status)}
        />
      ))}
    </View>
  );
}
