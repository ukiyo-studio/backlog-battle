import Constants from "expo-constants";
import * as Device from "expo-device";
import {
  AndroidImportance,
  addNotificationResponseReceivedListener,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  type EventSubscription,
  type NotificationResponse,
} from "expo-notifications";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

export type PushPlatform = "ios" | "android";

export const ANDROID_REMINDER_CHANNEL_ID = "reminders";

/** Push reminders are native-only; web is a no-op for registration flows. */
export function isNativePushSupported(): boolean {
  return Platform.OS !== "web";
}

export function configureNotificationHandler(): void {
  if (!isNativePushSupported()) return;

  setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Android 8+ requires a channel before permission prompts / token fetch. */
export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await setNotificationChannelAsync(ANDROID_REMINDER_CHANNEL_ID, {
    name: "Reminders",
    importance: AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#2563EB",
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!isNativePushSupported()) return false;

  await ensureAndroidNotificationChannel();

  const { status: existingStatus } = await getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await requestPermissionsAsync();
  return status === "granted";
}

export async function getNotificationPermissionStatus(): Promise<
  "granted" | "denied" | "undetermined"
> {
  if (!isNativePushSupported()) return "undetermined";

  const { status } = await getPermissionsAsync();
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

function getEasProjectId(): string {
  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId || projectId === "your-eas-project-id") {
    throw new Error(
      "Missing EAS project ID. Set EXPO_PUBLIC_EAS_PROJECT_ID in .env or replace extra.eas.projectId in app.json (run `eas init` to create a project).",
    );
  }

  return projectId;
}

export async function getExpoPushToken(): Promise<string> {
  if (!isNativePushSupported()) {
    throw new Error("Push notifications are not supported on web.");
  }

  if (!Device.isDevice) {
    throw new Error("Push notifications require a physical device, not a simulator.");
  }

  await ensureAndroidNotificationChannel();

  const projectId = getEasProjectId();
  const token = await getExpoPushTokenAsync({ projectId });
  return token.data;
}

export async function registerPushToken(userId: string): Promise<void> {
  if (!isNativePushSupported()) return;

  const token = await getExpoPushToken();
  const platform: PushPlatform = Platform.OS === "ios" ? "ios" : "android";
  const now = new Date().toISOString();

  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: userId,
      token,
      platform,
      updated_at: now,
    },
    { onConflict: "token" },
  );

  if (error) throw new Error(error.message);
}

export function addNotificationResponseListener(
  callback: (response: NotificationResponse) => void,
): EventSubscription {
  if (!isNativePushSupported()) {
    return { remove: () => {} };
  }

  return addNotificationResponseReceivedListener(callback);
}
