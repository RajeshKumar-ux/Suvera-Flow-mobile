import Ionicons from "@react-native-vector-icons/ionicons";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, makeStyles, useTheme } from "./theme";

type Tone = "success" | "error" | "info";
type ToastItem = { id: number; message: string; tone: Tone };

const ToastContext = createContext<{ show: (message: string, tone?: Tone) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();

  const show = useCallback((message: string, tone: Tone = "info") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const bg = toast?.tone === "success" ? colors.success : toast?.tone === "error" ? colors.error : colors.surfaceInverse;
  const icon = toast?.tone === "success" ? "checkmark-circle" : toast?.tone === "error" ? "alert-circle" : "information-circle";

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 8 }]}>
          <Animated.View key={toast.id} entering={FadeInUp} exiting={FadeOutUp} style={[styles.toast, { backgroundColor: bg }]} testID={`toast-${toast.tone}`}>
            <Ionicons name={icon} size={20} color={colors.onSurfaceInverse} />
            <Text style={styles.text} testID="toast-message">
              {toast.message}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast outside ToastProvider");
  return ctx;
}

const useStyles = makeStyles((c) => ({
  wrap: { position: "absolute", left: 16, right: 16, alignItems: "center" },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    maxWidth: 520,
    width: "100%",
    boxShadow: "0px 4px 12px rgba(15,23,42,0.2)",
  },
  text: { color: c.onSurfaceInverse, fontFamily: fonts.bodyMedium, fontSize: 15, flex: 1 },
}));
