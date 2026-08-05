export type ReminderFrequency = "weekly" | "biweekly" | "monthly";

/** Next fire time for a reminder interval. Shared by client and Edge Function logic. */
export function calculateNextReminderAt(
  frequency: ReminderFrequency,
  fromDate: Date,
): Date {
  const next = new Date(fromDate);

  switch (frequency) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setDate(next.getDate() + 30);
      break;
  }

  return next;
}
