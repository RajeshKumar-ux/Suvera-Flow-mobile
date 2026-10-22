import { useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { WS_URL } from "./api";
import { homeFor, useAuth } from "./auth";
import { pushSupported, registerPush } from "./push";
import { QUEUE_KEY } from "./queue";

const REFRESH_EVENTS = ["visitor_registered", "queue_updated", "md_status_changed", "settings_updated"];

// Keeps GET /api/queue/state fresh: websocket frames, app foreground, push deep links.
export function LiveSync() {
  const { status, token, user } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== "signedIn" || !token) return;
    let ws: WebSocket | null = null;
    let closed = false;
    let retry = 2000;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const refresh = () => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => {
        qc.invalidateQueries({ queryKey: QUEUE_KEY });
        qc.invalidateQueries({ queryKey: ["history"] });
      }, 250);
    };

    const connect = () => {
      ws = new WebSocket(`${WS_URL}/api/ws?token=${encodeURIComponent(token)}`);
      ws.onopen = () => {
        retry = 2000;
      };
      ws.onmessage = (ev) => {
        let frame: any = null;
        try {
          frame = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        const event = frame?.event ?? frame?.type;
        if (event && !REFRESH_EVENTS.includes(event)) return;
        if (user?.role === "md" || user?.role === "host") {
          const state: any = qc.getQueryData(QUEUE_KEY);
          const pHost = frame?.payload?.host_id;
          const myHost = state?.host?.id;
          if (pHost != null && myHost != null && String(pHost) !== String(myHost)) return;
        }
        refresh();
      };
      ws.onclose = () => {
        if (closed) return;
        retryTimer = setTimeout(connect, retry);
        retry = Math.min(retry * 2, 30000);
      };
      ws.onerror = () => ws?.close();
    };
    connect();

    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        qc.invalidateQueries({ queryKey: QUEUE_KEY });
        if (ws && ws.readyState === WebSocket.CLOSED && !retryTimer) connect();
      }
    });

    registerPush();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close();
      sub.remove();
    };
  }, [status, token, user?.role, qc]);

  // Push deep links from data.url
  useEffect(() => {
    if (status !== "signedIn" || !pushSupported) return;
    const go = (url?: unknown) => {
      if (typeof url !== "string" || !url) return;
      let path = url;
      if (url.includes("://")) path = "/" + (Linking.parse(url).path ?? "");
      if (!path.startsWith("/")) path = "/" + path;
      try {
        router.push(path as any);
      } catch {
        router.replace(homeFor(user?.role));
      }
    };
    Notifications.getLastNotificationResponseAsync()
      .then((r) => r && go(r.notification.request.content.data?.url))
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      qc.invalidateQueries({ queryKey: QUEUE_KEY });
      go(r.notification.request.content.data?.url);
    });
    return () => sub.remove();
  }, [status, router, user?.role, qc]);

  return null;
}
