import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import React from "react";
import { ActivityIndicator, Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, makeStyles, radius, ThemeColors, useTheme } from "@/src/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export function ScreenHeader({
  title,
  subtitle,
  right,
  onBack,
  showLogo,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  showLogo?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]} testID="screen-header">
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8} testID="header-back-button">
          <Ionicons name="chevron-back" size={26} color={colors.onBrand} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        {showLogo ? <Image source={require("../../assets/images/logo.png")} style={styles.headerLogo} contentFit="contain" testID="header-logo" /> : null}
        {subtitle ? <Text style={styles.headerSub}>{subtitle}</Text> : null}
        <Text style={styles.headerTitle} numberOfLines={1} testID="screen-title">
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

export function HeaderIcon({ icon, onPress, testID }: { icon: IconName; onPress: () => void; testID: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.headerIcon, pressed && { backgroundColor: colors.brandPressed }]} testID={testID}>
      <Ionicons name={icon} size={22} color={colors.onBrand} />
    </Pressable>
  );
}

type Variant = "primary" | "success" | "danger" | "info" | "warning" | "outline" | "ghost";

function variantColors(c: ThemeColors, v: Variant) {
  switch (v) {
    case "success":
      return { bg: c.success, fg: c.onSuccess, pressed: c.success, border: c.success };
    case "danger":
      return { bg: c.error, fg: c.onError, pressed: c.error, border: c.error };
    case "info":
      return { bg: c.info, fg: c.onInfo, pressed: c.info, border: c.info };
    case "warning":
      return { bg: c.warning, fg: c.onWarning, pressed: c.warning, border: c.warning };
    case "outline":
      return { bg: c.surfaceSecondary, fg: c.brandPrimary, pressed: c.brandTertiary, border: c.borderStrong };
    case "ghost":
      return { bg: "transparent", fg: c.brandPrimary, pressed: c.brandTertiary, border: "transparent" };
    default:
      return { bg: c.brandPrimary, fg: c.onBrandPrimary, pressed: c.brandPressed, border: c.brandPrimary };
  }
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading,
  disabled,
  testID,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: "sm" | "md" | "lg" | "xl";
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  testID: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const vc = variantColors(colors, variant);
  const h = size === "xl" ? 68 : size === "lg" ? 56 : size === "md" ? 48 : 44;
  const fs = size === "xl" ? 18 : size === "lg" ? 16 : size === "md" ? 15 : 14;
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      testID={testID}
      style={({ pressed }) => [
        styles.btn,
        { height: h, backgroundColor: pressed ? vc.pressed : vc.bg, borderColor: vc.border, opacity: off ? 0.55 : pressed && variant !== "primary" ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vc.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={fs + 4} color={vc.fg} /> : null}
          <Text style={[styles.btnText, { color: vc.fg, fontSize: fs, letterSpacing: size === "xl" ? 0.8 : 0.2 }]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function Card({ children, style, testID }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const styles = useStyles();
  return (
    <View style={[styles.card, style]} testID={testID}>
      {children}
    </View>
  );
}

export type Tone = "success" | "info" | "warning" | "error" | "neutral" | "brand";

export function toneColors(c: ThemeColors, tone: Tone) {
  switch (tone) {
    case "success":
      return { bg: c.successSoft, fg: c.success, solid: c.success };
    case "info":
      return { bg: c.infoSoft, fg: c.info, solid: c.info };
    case "warning":
      return { bg: c.warningSoft, fg: c.warningText, solid: c.warning };
    case "error":
      return { bg: c.errorSoft, fg: c.error, solid: c.error };
    case "brand":
      return { bg: c.brandTertiary, fg: c.brandPrimary, solid: c.brandPrimary };
    default:
      return { bg: c.surfaceTertiary, fg: c.onSurfaceTertiary, solid: c.muted };
  }
}

export function Pill({ label, tone, testID }: { label: string; tone: Tone; testID?: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const t = toneColors(colors, tone);
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]} testID={testID}>
      <View style={[styles.dot, { backgroundColor: t.solid }]} />
      <Text style={[styles.pillText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, body, testID }: { icon: IconName; title: string; body?: string; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.empty} testID={testID ?? "empty-state"}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={30} color={colors.brandPrimary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Text style={styles.emptyBody}>{body}</Text> : null}
    </View>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.errorBanner} testID="error-banner">
      <Ionicons name="cloud-offline-outline" size={20} color={colors.error} />
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={8} testID="error-retry-button">
          <Text style={styles.retry}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function LoadingBlock() {
  const { colors } = useTheme();
  return (
    <View style={{ paddingVertical: 48, alignItems: "center" }} testID="loading-indicator">
      <ActivityIndicator color={colors.brandPrimary} size="large" />
    </View>
  );
}

export function SectionTitle({ children, right }: { children: string; right?: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function Chip({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={[styles.chip, { backgroundColor: selected ? colors.brandPrimary : colors.surfaceSecondary, borderColor: selected ? colors.brandPrimary : colors.border }]}
    >
      <Text style={[styles.chipText, { color: selected ? colors.onBrandPrimary : colors.onSurfaceSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  header: {
    backgroundColor: c.brandPrimary,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: { width: 36, height: 44, justifyContent: "center", marginLeft: -8 },
  headerLogo: { width: 92, height: 28, marginBottom: 10 },
  headerSub: { color: c.onBrandMuted, fontFamily: fonts.bodyMedium, fontSize: 13, letterSpacing: 0.6, textTransform: "uppercase" },
  headerTitle: { color: c.onBrand, fontFamily: fonts.heading, fontSize: 26, marginTop: 2 },
  headerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  btnText: { fontFamily: fonts.bodyBold },
  card: {
    backgroundColor: c.surfaceSecondary,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
  },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, height: 26, borderRadius: radius.pill, alignSelf: "flex-start" },
  dot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.3 },
  empty: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontFamily: fonts.headingSemi, fontSize: 18, color: c.onSurface, textAlign: "center" },
  emptyBody: { fontFamily: fonts.body, fontSize: 14, color: c.muted, textAlign: "center", marginTop: 6, lineHeight: 20 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: c.errorSoft,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { flex: 1, color: c.error, fontFamily: fonts.bodyMedium, fontSize: 14 },
  retry: { color: c.brandPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 18, color: c.onSurface },
  chip: { height: 36, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, justifyContent: "center", flexShrink: 0 },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 14 },
}));
