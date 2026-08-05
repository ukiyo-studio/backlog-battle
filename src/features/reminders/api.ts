import { calculateNextReminderAt } from "@/domain/reminder-schedule";
import { supabase } from "@/lib/supabase";
import type { ReminderSettings as ReminderSettingsRow } from "@/types/backlog";
import type { ReminderFrequency } from "@/schemas/reminder";

export type ReminderSettings = ReminderSettingsRow;

export async function fetchReminderSettings(
  userId: string,
): Promise<ReminderSettings | null> {
  const { data, error } = await supabase
    .from("reminder_settings")
    .select("*")
    .eq("user_id", userId)
    .is("category_id", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ReminderSettings | null;
}

export async function upsertReminderSettings(input: {
  userId: string;
  enabled: boolean;
  frequency: ReminderFrequency;
}): Promise<ReminderSettings> {
  const existing = await fetchReminderSettings(input.userId);
  const now = new Date();
  const nowIso = now.toISOString();

  let nextReminderAt: string | null = null;

  if (input.enabled) {
    const shouldRecalculate =
      !existing?.enabled || existing.frequency !== input.frequency;

    nextReminderAt = shouldRecalculate
      ? calculateNextReminderAt(input.frequency, now).toISOString()
      : (existing?.next_reminder_at ??
        calculateNextReminderAt(input.frequency, now).toISOString());
  }

  if (existing) {
    const { data, error } = await supabase
      .from("reminder_settings")
      .update({
        enabled: input.enabled,
        frequency: input.frequency,
        next_reminder_at: nextReminderAt,
        updated_at: nowIso,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ReminderSettings;
  }

  const { data, error } = await supabase
    .from("reminder_settings")
    .insert({
      user_id: input.userId,
      category_id: null,
      enabled: input.enabled,
      frequency: input.frequency,
      next_reminder_at: nextReminderAt,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ReminderSettings;
}

export async function upsertPushToken(input: {
  userId: string;
  token: string;
  platform: "ios" | "android";
}): Promise<void> {
  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: input.userId,
      token: input.token,
      platform: input.platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );

  if (error) throw new Error(error.message);
}
