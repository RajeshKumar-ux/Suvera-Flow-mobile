import Ionicons from "@react-native-vector-icons/ionicons";
import { Redirect, Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform } from "react-native";

import { homeFor, Role, useAuth } from "@/src/auth";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, useTheme } from "@/src/theme";

export type TabDef = { name: string; title: string; icon: string; sf: string; badge?: number };

export function RoleTabs({ tabs, roles }: { tabs: TabDef[]; roles: Role[] }) {
  const { status, user } = useAuth();
  const { colors } = useTheme();

  if (status === "signedOut") return <Redirect href="/login" />;
  if (status === "signedIn" && user && !roles.includes(user.role)) return <Redirect href={homeFor(user.role)} />;

  if (usesNativeTabs) {
    return (
      <NativeTabs tintColor={colors.brandPrimary} badgeBackgroundColor={colors.warning}>
        {tabs.map((t) => (
          <NativeTabs.Trigger key={t.name} name={t.name}>
            <NativeTabs.Trigger.Icon sf={t.sf as any} />
            <NativeTabs.Trigger.Label>{t.title}</NativeTabs.Trigger.Label>
            {t.badge ? <NativeTabs.Trigger.Badge>{String(t.badge)}</NativeTabs.Trigger.Badge> : null}
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surfaceSecondary, borderTopColor: colors.border, ...(Platform.OS === "web" ? { height: 64 } : {}) },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 12 },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarButtonTestID: `tab-${t.name}`,
            tabBarBadge: t.badge ? t.badge : undefined,
            tabBarBadgeStyle: { backgroundColor: colors.warning, color: colors.onWarning, fontFamily: fonts.monoBold, fontSize: 11 },
            tabBarIcon: ({ color, focused }) => <Ionicons name={(focused ? t.icon : `${t.icon}-outline`) as any} size={24} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
