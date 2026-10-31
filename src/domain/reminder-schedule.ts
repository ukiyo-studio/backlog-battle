export type ReminderFrequency = "weekly" | "biweekly" | "monthly";

/**
 * Next fire time for a reminder interval.
 * Uses UTC calendar math so client and Edge Function schedules stay aligned
 * regardless of the device timezone.
 */
export function calculateNextReminderAt(
  frequency: ReminderFrequency,
  fromDate: Date,
): Date {
  const next = new Date(fromDate);

  switch (frequency) {
    case "weekly":
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case "biweekly":
      next.setUTCDate(next.getUTCDate() + 14);
      break;
    case "monthly":
      next.setUTCDate(next.getUTCDate() + 30);
      break;
  }

  return next;
}
