// Suvera FLOW design tokens (light only). Keys follow design_guidelines "color" block.
import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#F8FAFC",
  onSurface: "#0F172A",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#1E293B",
  surfaceTertiary: "#F1F5F9",
  onSurfaceTertiary: "#475569",
  surfaceInverse: "#0F172A",
  onSurfaceInverse: "#FFFFFF",
  muted: "#64748B",

  brand: "#1A2F5A",
  onBrand: "#FFFFFF",
  brandPrimary: "#1A2F5A",
  onBrandPrimary: "#FFFFFF",
  brandPressed: "#2A4580",
  brandSecondary: "#E8EDF7",
  onBrandSecondary: "#1A2F5A",
  brandTertiary: "#EEF2FA",
  onBrandTertiary: "#1A2F5A",
  onBrandMuted: "#B8C4DE",

  success: "#00A651",
  onSuccess: "#FFFFFF",
  successSoft: "#E6F6EE",
  warning: "#E9A61B",
  onWarning: "#2B1D02",
  warningSoft: "#FDF4E3",
  warningText: "#9A6A05",
  error: "#E8121F",
  onError: "#FFFFFF",
  errorSoft: "#FDE8EA",
  info: "#1B7FC4",
  onInfo: "#FFFFFF",
  infoSoft: "#E7F2FA",

  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  divider: "#E2E8F0",
  scrim: "rgba(15,23,42,0.45)",
};

export type ThemeColors = typeof light;

export const fonts = {
  heading: "Manrope-ExtraBold",
  headingSemi: "Manrope-SemiBold",
  body: "DMSans-Regular",
  bodyMedium: "DMSans-Medium",
  bodyBold: "DMSans-Bold",
  mono: "JetBrainsMono-Medium",
  monoBold: "JetBrainsMono-Bold",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = (system === "light" || system === "dark") && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export const colors = light;

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
