import { useQuery } from "@tanstack/react-query";
import React from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";

import { api, asList, errorMessage } from "@/src/api";
import { fmtDateTime, visitStatus } from "@/src/format";
import { Visitor, visitorName, visitorNumber } from "@/src/queue";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { EmptyState, ErrorBanner, LoadingBlock, Pill } from "./ui";
import { VisitorPhoto } from "./VisitorPhoto";

export function HistoryView({ bottomPad }: { bottomPad: number }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const q = useQuery({ queryKey: ["history", "week"], queryFn: () => api("/api/visits/history?range=week") });
  const list: Visitor[] = asList(q.data, ["items", "visits", "history", "results"]);

  return (
    <FlatList
      data={q.isLoading ? [] : list}
      keyExtractor={(v, i) => String(v.id ?? i)}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 + bottomPad }}
      refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brandPrimary} colors={[colors.brandPrimary]} />}
      ListHeaderComponent={
        <>
          {q.error ? <ErrorBanner message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : null}
          <Text style={styles.caption}>Last 7 days</Text>
        </>
      }
      ListEmptyComponent={q.isLoading ? <LoadingBlock /> : <EmptyState icon="time-outline" title="No visits this week" testID="history-empty-state" />}
      renderItem={({ item }) => {
        const st = visitStatus(item.status);
        const num = visitorNumber(item);
        return (
          <View style={styles.row} testID={`history-row-${item.id}`}>
            <VisitorPhoto visitId={item.id} hasPhoto={item.has_photo === true} name={visitorName(item)} size={44} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.name} numberOfLines={1}>
                {visitorName(item)}
              </Text>
              {item.host_name || item.host?.name ? (
                <Text style={styles.sub} numberOfLines={1}>
                  Met {item.host_name ?? item.host?.name}
                </Text>
              ) : item.company ? (
                <Text style={styles.sub}>{item.company}</Text>
              ) : null}
              <Text style={styles.time}>
                {num != null ? `#${num}  ·  ` : ""}
                {fmtDateTime(item.created_at ?? item.completed_at ?? item.updated_at)}
              </Text>
            </View>
            <Pill label={st.label} tone={st.tone} />
          </View>
        );
      }}
      testID="history-list"
    />
  );
}

const useStyles = makeStyles((c) => ({
  caption: { fontFamily: fonts.bodyBold, fontSize: 13, color: c.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 12, marginBottom: 10 },
  name: { fontFamily: fonts.headingSemi, fontSize: 16, color: c.onSurface },
  sub: { fontFamily: fonts.body, fontSize: 13, color: c.muted },
  time: { fontFamily: fonts.mono, fontSize: 12, color: c.onSurfaceTertiary },
}));
