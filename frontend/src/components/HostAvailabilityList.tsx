import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { errorMessage } from "@/src/api";
import { fmtDateTime, hostStatus } from "@/src/format";
import { usesNativeTabs } from "@/src/navigation";
import { getHosts, Host, hostWaiting, useQueueState } from "@/src/queue";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { EmptyState, ErrorBanner, LoadingBlock, Pill } from "./ui";
import { VisitorPhoto } from "./VisitorPhoto";

// Hosts from state.hosts. Read-only unless onSelect is given.
export function HostAvailabilityList({ onSelect, showWaiting, header }: { onSelect?: (h: Host) => void; showWaiting?: boolean; header?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const styles = useStyles();
  const { colors } = useTheme();
  const q = useQueueState();
  const hosts = getHosts(q.data);

  return (
    <FlatList
      data={q.isLoading ? [] : hosts}
      keyExtractor={(h) => String(h.id)}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 + bottomChrome }}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brandPrimary} colors={[colors.brandPrimary]} />}
      ListHeaderComponent={
        <>
          {q.error ? <ErrorBanner message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : null}
          {header}
        </>
      }
      ListEmptyComponent={q.isLoading ? <LoadingBlock /> : <EmptyState icon="people-outline" title="No meeting persons yet" testID="hosts-empty-state" />}
      renderItem={({ item }) => {
        const hs = hostStatus(item.status);
        const name = item.name ?? item.full_name ?? "Host";
        const body = (
          <>
            <VisitorPhoto visitId={`host-${item.id}`} name={name} size={46} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.role} numberOfLines={1}>
                {item.role_label ?? (item.role === "md" ? "Managing Director" : "Meeting person")}
              </Text>
              <Pill label={hs.label} tone={hs.tone} testID={`host-status-${item.id}`} />
              {item.status_reason || item.reason ? <Text style={styles.reason}>{item.status_reason ?? item.reason}</Text> : null}
              {item.available_from ? <Text style={styles.mono}>From {fmtDateTime(item.available_from)}</Text> : null}
            </View>
            {showWaiting ? (
              <View style={styles.waitBox} testID={`host-waiting-${item.id}`}>
                <Text style={styles.waitNum}>{hostWaiting(q.data, item)}</Text>
                <Text style={styles.waitLabel}>waiting</Text>
              </View>
            ) : null}
            {onSelect ? <Ionicons name="create-outline" size={22} color={colors.brandPrimary} /> : null}
          </>
        );
        return onSelect ? (
          <Pressable onPress={() => onSelect(item)} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceTertiary }]} testID={`host-row-${item.id}`}>
            {body}
          </Pressable>
        ) : (
          <View style={styles.row} testID={`host-row-${item.id}`}>
            {body}
          </View>
        );
      }}
    />
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  name: { fontFamily: fonts.headingSemi, fontSize: 16, color: c.onSurface },
  role: { fontFamily: fonts.body, fontSize: 13, color: c.muted },
  reason: { fontFamily: fonts.body, fontSize: 13, color: c.onSurfaceTertiary },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: c.onSurfaceTertiary },
  waitBox: { alignItems: "center", minWidth: 56, paddingVertical: 6, borderRadius: 12, backgroundColor: c.brandTertiary },
  waitNum: { fontFamily: fonts.monoBold, fontSize: 22, color: c.brandPrimary },
  waitLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, color: c.brandPrimary },
}));
