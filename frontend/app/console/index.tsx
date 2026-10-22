import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { errorMessage } from "@/src/api";
import { displayName, roleTitle, useAuth } from "@/src/auth";
import { Button, Card, ErrorBanner, HeaderIcon, Pill, ScreenHeader, SectionTitle } from "@/src/components/ui";
import { VisitorPhoto } from "@/src/components/VisitorPhoto";
import { fmtDateTime, fmtTime, hostStatus } from "@/src/format";
import { usesNativeTabs } from "@/src/navigation";
import { completedCount, currentMeeting, heldCount, nextVisitor, pendingCount, useQueueActions, useQueueState, visitorName, visitorNumber, waitingCount } from "@/src/queue";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function ConsoleHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const { user, logout } = useAuth();
  const styles = useStyles();
  const { colors } = useTheme();
  const q = useQueueState();
  const { busy, act, advance } = useQueueActions();
  const state = q.data;
  const host = state?.host ?? {};
  const hs = hostStatus(host.status);
  const current = currentMeeting(state);
  const next = nextVisitor(state);

  const counts = [
    { key: "pending", label: "Pending", value: pendingCount(state), color: colors.warning, onPress: () => router.push("/console/requests") },
    { key: "waiting", label: "Waiting", value: waitingCount(state), color: colors.brandPrimary, onPress: () => router.push("/console/queue") },
    { key: "hold", label: "On hold", value: heldCount(state), color: colors.info, onPress: () => router.push("/console/queue") },
    { key: "done", label: "Done today", value: completedCount(state), color: colors.success, onPress: () => router.push("/history") },
  ];

  return (
    <View style={styles.root} testID="console-home-screen">
      <ScreenHeader
        title={displayName(host.name ? host : user)}
        subtitle={roleTitle(user)}
        showLogo
        right={
          <View style={{ flexDirection: "row" }}>
            <HeaderIcon icon="time-outline" onPress={() => router.push("/history")} testID="console-history-button" />
            <HeaderIcon icon="log-out-outline" onPress={() => logout()} testID="logout-button" />
          </View>
        }
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 24 + bottomChrome }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brandPrimary} colors={[colors.brandPrimary]} />}
      >
        {q.error ? <ErrorBanner message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : null}

        <Animated.View entering={FadeInDown.duration(300)}>
          <Pressable onPress={() => router.push("/console/status")} testID="console-availability-card">
            <Card style={styles.availCard}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.caption}>My availability</Text>
                <Pill label={hs.label} tone={hs.tone} testID="console-availability-status" />
                {host.status_reason || host.reason ? <Text style={styles.reason}>{host.status_reason ?? host.reason}</Text> : null}
                {host.available_from ? <Text style={styles.mono}>From {fmtDateTime(host.available_from)}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.muted} />
            </Card>
          </Pressable>
        </Animated.View>

        <SectionTitle>In Meeting Now</SectionTitle>
        <Animated.View entering={FadeInDown.delay(60).duration(300)}>
          <Card style={[styles.meetCard, current && { borderColor: colors.info }]} testID="in-meeting-card">
            {current ? (
              <>
                <View style={styles.meetRow}>
                  <VisitorPhoto visitId={current.id} hasPhoto={current.has_photo === true} name={visitorName(current)} size={60} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.meetName} testID="in-meeting-name">
                      {visitorName(current)}
                    </Text>
                    {current.company || current.purpose ? <Text style={styles.sub}>{[current.company, current.purpose].filter(Boolean).join(" · ")}</Text> : null}
                    <Text style={styles.mono}>
                      {visitorNumber(current) != null ? `#${visitorNumber(current)}  ·  ` : ""}since {fmtTime(current.started_at ?? current.updated_at) || "--:--"}
                    </Text>
                  </View>
                </View>
                <Button
                  label="FINISH MEETING"
                  variant="success"
                  size="lg"
                  icon="checkmark-done"
                  onPress={() => act(current.id, "complete")}
                  loading={busy === `${current.id}:complete`}
                  disabled={!!busy}
                  style={{ marginTop: 14 }}
                  testID="finish-meeting-button"
                />
              </>
            ) : (
              <View style={styles.idle}>
                <Ionicons name="cafe-outline" size={26} color={colors.muted} />
                <Text style={styles.idleText}>No one is in your meeting right now.</Text>
              </View>
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(300)}>
          <Button
            label="NEXT PERSON IN"
            size="xl"
            icon="arrow-forward-circle"
            onPress={advance}
            loading={busy === "advance"}
            disabled={!!busy || !next}
            style={{ marginTop: 16, borderRadius: 18 }}
            testID="next-person-in-button"
          />
          <Text style={styles.nextHint} testID="next-visitor-hint">
            {next ? `Next: ${visitorName(next)}${visitorNumber(next) != null ? `  #${visitorNumber(next)}` : ""}` : "Nobody waiting"}
          </Text>
        </Animated.View>

        <SectionTitle>Today</SectionTitle>
        <View style={styles.grid}>
          {counts.map((c, i) => (
            <Animated.View key={c.key} entering={FadeInDown.delay(160 + i * 50).duration(300)} style={styles.gridItem}>
              <Pressable onPress={c.onPress} style={({ pressed }) => [styles.countCard, pressed && { backgroundColor: colors.surfaceTertiary }]} testID={`count-${c.key}`}>
                <View style={[styles.countBar, { backgroundColor: c.color }]} />
                <Text style={styles.countValue} testID={`count-${c.key}-value`}>
                  {q.isLoading ? "–" : c.value}
                </Text>
                <Text style={styles.countLabel}>{c.label}</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  availCard: { flexDirection: "row", alignItems: "center" },
  caption: { fontFamily: fonts.bodyBold, fontSize: 12, color: c.muted, textTransform: "uppercase", letterSpacing: 0.6 },
  reason: { fontFamily: fonts.body, fontSize: 14, color: c.onSurfaceTertiary },
  mono: { fontFamily: fonts.mono, fontSize: 13, color: c.onSurfaceTertiary },
  meetCard: { borderWidth: 1.5 },
  meetRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  meetName: { fontFamily: fonts.heading, fontSize: 20, color: c.onSurface },
  sub: { fontFamily: fonts.body, fontSize: 14, color: c.muted },
  idle: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  idleText: { fontFamily: fonts.body, fontSize: 15, color: c.muted, flex: 1 },
  nextHint: { fontFamily: fonts.mono, fontSize: 13, color: c.muted, textAlign: "center", marginTop: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  gridItem: { width: "50%", padding: 6 },
  countCard: { backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 16, overflow: "hidden" },
  countBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  countValue: { fontFamily: fonts.monoBold, fontSize: 32, color: c.onSurface },
  countLabel: { fontFamily: fonts.bodyMedium, fontSize: 14, color: c.muted, marginTop: 2 },
}));
