import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Switch,
  View,
} from "react-native";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingState,
  Screen,
  Text,
} from "@/components/ui";
import { upsertReminderSettings } from "@/features/reminders/api";
import { FrequencyPicker } from "@/features/reminders/components";
import { useReminderSettings } from "@/features/reminders/hooks";
import {
  getNotificationPermissionStatus,
  isNativePushSupported,
  registerPushToken,
  requestNotificationPermissions,
} from "@/lib/notifications";
import type { ReminderFrequency } from "@/schemas/reminder";
import { parseReminderFrequency } from "@/schemas/reminder";
import { colors } from "@/theme";

import { useAuth } from "../../_layout";

const DEFAULT_FREQUENCY: ReminderFrequency = "weekly";

type DraftSettings = {
  enabled: boolean;
  frequency: ReminderFrequency;
};

export default function RemindersSettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: settings, isLoading, error, refetch } = useReminderSettings(userId);

  const [draft, setDraft] = useState<DraftSettings | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    "granted" | "denied" | "undetermined"
  >("undetermined");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nativePush = isNativePushSupported();
  const enabled = draft?.enabled ?? settings?.enabled ?? false;
  const frequency: ReminderFrequency =
    draft?.frequency ??
    (settings ? parseReminderFrequency(settings.frequency) : DEFAULT_FREQUENCY);

  useFocusEffect(
    useCallback(() => {
      if (!nativePush) return;

      let active = true;
      void getNotificationPermissionStatus().then((status) => {
        if (active) setPermissionStatus(status);
      });

      return () => {
        active = false;
      };
    }, [nativePush]),
  );

  const persistSettings = async (nextEnabled: boolean, nextFrequency: ReminderFrequency) => {
    if (!userId) return;

    setDraft({ enabled: nextEnabled, frequency: nextFrequency });
    setSaving(true);
    setSubmitError(null);

    try {
      if (nextEnabled && nativePush) {
        const granted = await requestNotificationPermissions();
        setPermissionStatus(await getNotificationPermissionStatus());

        if (!granted) {
          setSubmitError(
            "Notification permission is required to enable reminders. Allow notifications in system settings.",
          );
          setDraft(null);
          setSaving(false);
          return;
        }

        await registerPushToken(userId);
      }

      await upsertReminderSettings({
        userId,
        enabled: nextEnabled,
        frequency: nextFrequency,
      });
      setDraft(null);
      await refetch();
    } catch (cause) {
      setSubmitError(
        cause instanceof Error ? cause.message : "Could not save reminder settings.",
      );
      setDraft(null);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (value: boolean) => {
    void persistSettings(value, frequency);
  };

  const handleFrequencyChange = (nextFrequency: ReminderFrequency) => {
    void persistSettings(enabled, nextFrequency);
  };

  if (isLoading && !settings) {
    return (
      <Screen scroll={false}>
        <LoadingState variant="page" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen contentClassName="p-5 pb-10">
        <ErrorState
          description={`We couldn't load your reminder settings. ${error}`}
          onRetry={() => void refetch()}
          secondaryAction={{ label: "Go back", onPress: () => router.back() }}
        />
      </Screen>
    );
  }

  return (
    <Screen contentClassName="p-5 pb-10">
      <View className="mb-6 gap-2">
        <Text variant="title">Reminders</Text>
        <Text variant="caption">
          Get a nudge when it&apos;s time to run another battle and refresh your backlog ranking.
        </Text>
      </View>

      {!nativePush ? (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Mobile only</CardTitle>
            <CardDescription>
              Push reminders are available on iOS and Android. Open Backlog Battle on your phone to
              opt in.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Reminder schedule</CardTitle>
          <CardDescription>
            {nativePush
              ? "Choose how often we should remind you to battle your backlog."
              : "Reminder preferences sync when you use the mobile app."}
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1 gap-1">
              <Text variant="label">Enable reminders</Text>
              <Text variant="caption">
                {nativePush
                  ? "Turn on push notifications for periodic battle prompts."
                  : "Available on iOS and Android only."}
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              disabled={!nativePush || saving || !userId}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={Platform.OS === "android" ? colors.card : undefined}
              accessibilityLabel="Enable reminders"
            />
          </View>

          <View className="gap-3">
            <Text variant="label">Frequency</Text>
            <FrequencyPicker
              selected={frequency}
              onSelect={handleFrequencyChange}
              disabled={!enabled || saving || !nativePush}
            />
          </View>

          {nativePush ? (
            <View className="gap-2">
              <Text variant="label">Notification permission</Text>
              <Text variant="caption">
                {permissionStatus === "granted"
                  ? "Allowed — you can receive reminder notifications."
                  : permissionStatus === "denied"
                    ? "Denied — enable notifications in system settings to receive reminders."
                    : "Not requested yet — turn on reminders to prompt for permission."}
              </Text>
              {permissionStatus === "denied" ? (
                <Button variant="outline" onPress={() => void Linking.openSettings()}>
                  Open system settings
                </Button>
              ) : null}
            </View>
          ) : null}

          {submitError ? (
            <Text variant="caption" className="text-destructive">
              {submitError}
            </Text>
          ) : null}

          {saving ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color={colors.primary} />
              <Text variant="caption">Saving…</Text>
            </View>
          ) : null}
        </CardContent>
      </Card>

      <View className="mt-6">
        <Button variant="ghost" onPress={() => router.back()}>
          Back
        </Button>
      </View>
    </Screen>
  );
}
