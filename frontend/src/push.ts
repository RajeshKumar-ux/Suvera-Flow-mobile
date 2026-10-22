import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "./api";
import { storage } from "./utils/storage";

const PUSH_KEY = "push_token";
export const pushSupported = Platform.OS !== "web";

if (pushSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function ensureVisitorsChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("visitors", {
    name: "Visitors",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
  });
}

export type PushPermission = "granted" | "undetermined" | "denied" | "blocked" | "unsupported";

export async function getPushPermission(): Promise<PushPermission> {
  if (!pushSupported || !Device.isDevice) return "unsupported";
  const p = await Notifications.getPermissionsAsync();
  if (p.status === "granted") return "granted";
  if (p.status === "undetermined") return "undetermined";
  return p.canAskAgain ? "denied" : "blocked";
}

export async function requestPushPermission(): Promise<PushPermission> {
  if (!pushSupported || !Device.isDevice) return "unsupported";
  await ensureVisitorsChannel();
  const p = await Notifications.requestPermissionsAsync();
  if (p.status === "granted") return "granted";
  return p.canAskAgain ? "denied" : "blocked";
}

// Registers only when permission is already granted.
export async function registerPush() {
  try {
    if ((await getPushPermission()) !== "granted") return;
    await ensureVisitorsChannel();
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await api("/api/push/devices", { method: "POST", body: { token: data, platform: Platform.OS } });
    await storage.setItem(PUSH_KEY, data);
  } catch (e) {
    console.warn("Push registration skipped", e);
  }
}

export async function unregisterPush() {
  const t = await storage.getItem(PUSH_KEY, null);
  if (typeof t !== "string") return;
  try {
    await api("/api/push/devices", { method: "DELETE", body: { token: t } });
  } catch {
    // ignore: logging out anyway
  }
  await storage.removeItem(PUSH_KEY);
}
