import { View } from "react-native";

import { Chip } from "@/features/backlog-items/components/chip";
import { REMINDER_FREQUENCIES, type ReminderFrequency } from "@/schemas/reminder";

const FREQUENCY_LABELS: Record<ReminderFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

export interface FrequencyPickerProps {
  selected: ReminderFrequency;
  onSelect: (frequency: ReminderFrequency) => void;
  disabled?: boolean;
}

export function FrequencyPicker({
  selected,
  onSelect,
  disabled = false,
}: FrequencyPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {REMINDER_FREQUENCIES.map((frequency) => (
        <Chip
          key={frequency}
          label={FREQUENCY_LABELS[frequency]}
          selected={selected === frequency}
          disabled={disabled}
          onPress={() => onSelect(frequency)}
        />
      ))}
    </View>
  );
}
