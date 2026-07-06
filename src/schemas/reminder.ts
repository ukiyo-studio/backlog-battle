import { z } from "zod";

export const REMINDER_FREQUENCIES = ["weekly", "biweekly", "monthly"] as const;

export type ReminderFrequency = (typeof REMINDER_FREQUENCIES)[number];

export const reminderFrequencySchema = z.enum(REMINDER_FREQUENCIES);

export type ReminderSettingsFormValues = {
  enabled: boolean;
  frequency: ReminderFrequency;
};

export function parseReminderFrequency(value: string): ReminderFrequency {
  return reminderFrequencySchema.parse(value);
}
