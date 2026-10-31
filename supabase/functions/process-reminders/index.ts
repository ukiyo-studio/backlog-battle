import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const REMINDER_TITLE = "Backlog Battle";
const REMINDER_BODY =
  "Your backlog is waiting. Run a short duel and pick what to open next.";

interface PushMessage {
  title: string;
  body: string;
  data: Record<string, string>;
}

type ReminderSetting = {
  id: string;
  user_id: string;
  frequency: "weekly" | "biweekly" | "monthly";
};

type PushToken = {
  id: string;
  token: string;
};

type ExpoTicket =
  | { status: "ok"; id?: string }
  | {
      status: "error";
      message?: string;
      details?: { error?: string };
    };

type ExpoPushResponse = {
  data?: ExpoTicket[];
  errors?: Array<{ code?: string; message?: string }>;
};

function computeNextReminderAt(frequency: ReminderSetting["frequency"]): string {
  const next = new Date();
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
  return next.toISOString();
}

function isInvalidTokenError(ticket: ExpoTicket): boolean {
  if (ticket.status !== "error") {
    return false;
  }
  const errorCode = ticket.details?.error;
  return errorCode === "DeviceNotRegistered" || errorCode === "InvalidCredentials";
}

async function sendExpoPushBatch(
  tokens: PushToken[],
  message: PushMessage,
): Promise<{ sent: number; errors: string[]; invalidTokenIds: string[] }> {
  if (tokens.length === 0) {
    return { sent: 0, errors: [], invalidTokenIds: [] };
  }

  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };
  if (expoAccessToken) {
    headers.Authorization = `Bearer ${expoAccessToken}`;
  }

  const messages = tokens.map((row) => ({
    to: row.token,
    title: message.title,
    body: message.body,
    data: message.data,
    channelId: "reminders",
    sound: "default",
  }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      sent: 0,
      errors: [`Expo push HTTP ${response.status}: ${body}`],
      invalidTokenIds: [],
    };
  }

  const payload = (await response.json()) as ExpoPushResponse;
  const errors: string[] = [];
  const invalidTokenIds: string[] = [];
  let sent = 0;

  if (payload.errors?.length) {
    for (const err of payload.errors) {
      errors.push(err.message ?? err.code ?? "Unknown Expo push error");
    }
  }

  const tickets = payload.data ?? [];
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    const tokenRow = tokens[i];
    if (!ticket || !tokenRow) {
      continue;
    }

    if (ticket.status === "ok") {
      sent += 1;
      continue;
    }

    errors.push(ticket.message ?? "Expo push ticket error");
    if (isInvalidTokenError(ticket)) {
      invalidTokenIds.push(tokenRow.id);
    }
  }

  return { sent, errors, invalidTokenIds };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fail closed: verify_jwt is disabled for cron callers, so CRON_SECRET is required.
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    return new Response(
      JSON.stringify({ error: "CRON_SECRET is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase environment variables" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date().toISOString();

  const { data: dueSettings, error: queryError } = await supabase
    .from("reminder_settings")
    .select("id, user_id, frequency")
    .eq("enabled", true)
    .not("next_reminder_at", "is", null)
    .lte("next_reminder_at", now);

  if (queryError) {
    return new Response(
      JSON.stringify({ error: queryError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const settings = (dueSettings ?? []) as ReminderSetting[];
  let processed = 0;
  let sent = 0;
  const errors: string[] = [];

  for (const setting of settings) {
    processed += 1;

    const { data: tokenRows, error: tokenError } = await supabase
      .from("push_tokens")
      .select("id, token")
      .eq("user_id", setting.user_id);

    if (tokenError) {
      errors.push(`setting ${setting.id}: ${tokenError.message}`);
    } else if (tokenRows && tokenRows.length > 0) {
      const pushResult = await sendExpoPushBatch(tokenRows as PushToken[], {
        title: REMINDER_TITLE,
        body: REMINDER_BODY,
        data: { type: "reminder" },
      });
      sent += pushResult.sent;
      errors.push(...pushResult.errors.map((msg) => `setting ${setting.id}: ${msg}`));

      if (pushResult.invalidTokenIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("push_tokens")
          .delete()
          .in("id", pushResult.invalidTokenIds);

        if (deleteError) {
          errors.push(`setting ${setting.id}: token cleanup failed: ${deleteError.message}`);
        }
      }
    }

    const nextReminderAt = computeNextReminderAt(setting.frequency);
    const { error: updateError } = await supabase
      .from("reminder_settings")
      .update({ next_reminder_at: nextReminderAt })
      .eq("id", setting.id);

    if (updateError) {
      errors.push(`setting ${setting.id}: advance failed: ${updateError.message}`);
    }
  }

  let startChecksProcessed = 0;
  let startChecksSent = 0;

  const { data: dueChecks, error: checksError } = await supabase
    .from("start_checks")
    .select("id, user_id, battle_id, backlog_items(title)")
    .is("outcome", null)
    .is("notified_at", null)
    .lte("due_at", now);

  if (checksError) {
    errors.push(`start checks: ${checksError.message}`);
  } else {
    for (const check of dueChecks ?? []) {
      startChecksProcessed += 1;
      const title = embeddedTitle(check.backlog_items) ?? "your pick";

      const { data: tokenRows, error: tokenError } = await supabase
        .from("push_tokens")
        .select("id, token")
        .eq("user_id", check.user_id);

      if (tokenError) {
        errors.push(`start check ${check.id}: ${tokenError.message}`);
        continue;
      }

      if (!tokenRows || tokenRows.length === 0) {
        continue;
      }

      const pushResult = await sendExpoPushBatch(tokenRows as PushToken[], {
        title: "Did you start?",
        body: `Did you start ${title}?`,
        data: { type: "start_check", battleId: check.battle_id, checkId: check.id },
      });
      startChecksSent += pushResult.sent;
      errors.push(
        ...pushResult.errors.map((msg) => `start check ${check.id}: ${msg}`),
      );

      if (pushResult.invalidTokenIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("push_tokens")
          .delete()
          .in("id", pushResult.invalidTokenIds);

        if (deleteError) {
          errors.push(
            `start check ${check.id}: token cleanup failed: ${deleteError.message}`,
          );
        }
      }

      const { error: notifiedError } = await supabase
        .from("start_checks")
        .update({ notified_at: now })
        .eq("id", check.id)
        .is("notified_at", null);

      if (notifiedError) {
        errors.push(`start check ${check.id}: ${notifiedError.message}`);
      }
    }
  }

  return new Response(
    JSON.stringify({
      processed,
      sent,
      startChecksProcessed,
      startChecksSent,
      errors,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});

function embeddedTitle(value: unknown): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object" || !("title" in row)) return null;
  const title = (row as { title?: unknown }).title;
  return typeof title === "string" ? title : null;
}
