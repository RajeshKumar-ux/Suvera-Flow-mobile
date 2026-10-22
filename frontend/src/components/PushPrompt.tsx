import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";

import { useAuth } from "@/src/auth";
import { getPushPermission, PushPermission, registerPush, requestPushPermission } from "@/src/push";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import { Sheet } from "./Sheet";
import { Button } from "./ui";

const DISMISS_KEY = "push_prompt_dismissed";

// Pre-permission explainer shown once after sign-in, before the native prompt.
export function PushPrompt() {
  const { status } = useAuth();
  const [perm, setPerm] = useState<PushPermission | null>(null);
  const [open, setOpen] = useState(false);
  const styles = useStyles();
  const { colors } = useTheme();

  useEffect(() => {
    if (status !== "signedIn") return;
    (async () => {
      const p = await getPushPermission();
      setPerm(p);
      const dismissed = await storage.getItem(DISMISS_KEY, false);
      if ((p === "undetermined" || p === "denied" || p === "blocked") && !dismissed) setOpen(true);
    })();
  }, [status]);

  const close = async () => {
    await storage.setItem(DISMISS_KEY, true);
    setOpen(false);
  };

  const enable = async () => {
    if (perm === "blocked") {
      Linking.openSettings();
      return close();
    }
    const p = await requestPushPermission();
    setPerm(p);
    if (p === "granted") {
      await registerPush();
      return close();
    }
    if (p !== "blocked") return close();
  };

  return (
    <Sheet visible={open} title="Never miss a visitor" onClose={close} testID="push-prompt-sheet">
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name="notifications" size={26} color={colors.brandPrimary} />
        </View>
        <Text style={styles.body}>
          {perm === "blocked"
            ? "Notifications are turned off. Open Settings to get alerted when visitors arrive or need approval."
            : "Get alerted the moment a visitor arrives, needs approval, or is ready to come in."}
        </Text>
      </View>
      <View style={{ gap: 10, marginTop: 20 }}>
        <Button label={perm === "blocked" ? "Open Settings" : "Enable notifications"} size="lg" onPress={enable} testID="push-prompt-enable-button" />
        <Button label="Not now" variant="ghost" onPress={close} testID="push-prompt-dismiss-button" />
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: "row", gap: 14, alignItems: "center", marginTop: 16 },
  icon: { width: 52, height: 52, borderRadius: 26, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: c.onSurfaceTertiary, lineHeight: 21 },
}));
