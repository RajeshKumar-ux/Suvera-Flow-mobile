import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { displayName, useAuth } from "@/src/auth";
import { HostAvailabilityList } from "@/src/components/HostAvailabilityList";
import { HeaderIcon, ScreenHeader, SectionTitle } from "@/src/components/ui";
import { completedCount, heldCount, pendingCount, useQueueState, waitingCount } from "@/src/queue";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function AdminOverview() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const styles = useStyles();
  const { colors } = useTheme();
  const { data, isLoading } = useQueueState();

  const stats = [
    { key: "pending", label: "Pending", value: pendingCount(data), color: colors.warning },
    { key: "waiting", label: "Waiting", value: waitingCount(data), color: colors.brandPrimary },
    { key: "hold", label: "On hold", value: heldCount(data), color: colors.info },
    { key: "done", label: "Done", value: completedCount(data), color: colors.success },
  ];

  const header = (
    <>
      <View style={styles.stats}>
        {stats.map((s) => (
          <View key={s.key} style={styles.stat} testID={`admin-stat-${s.key}`}>
            <Text style={[styles.statNum, { color: s.color }]}>{isLoading ? "–" : s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.links}>
        <Pressable style={({ pressed }) => [styles.link, pressed && { backgroundColor: colors.surfaceTertiary }]} onPress={() => router.push("/history")} testID="admin-history-link">
          <Ionicons name="time-outline" size={22} color={colors.brandPrimary} />
          <Text style={styles.linkText}>History</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.link, pressed && { backgroundColor: colors.surfaceTertiary }]} onPress={() => router.push("/audit")} testID="admin-audit-link">
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.brandPrimary} />
          <Text style={styles.linkText}>Audit</Text>
        </Pressable>
      </View>
      <SectionTitle>Waiting per person</SectionTitle>
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID="admin-overview-screen">
      <ScreenHeader showLogo title="Overview" subtitle={`IT Admin · ${displayName(user)}`} right={<HeaderIcon icon="log-out-outline" onPress={() => logout()} testID="logout-button" />} />
      <HostAvailabilityList showWaiting header={header} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  stats: { flexDirection: "row", backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: 16, paddingVertical: 14 },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontFamily: fonts.monoBold, fontSize: 26 },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: c.muted, marginTop: 2 },
  links: { flexDirection: "row", gap: 10, marginTop: 12 },
  link: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, height: 52, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  linkText: { fontFamily: fonts.bodyBold, fontSize: 15, color: c.brandPrimary },
}));
