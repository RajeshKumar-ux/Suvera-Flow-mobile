import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { errorMessage } from "@/src/api";
import { usesNativeTabs } from "@/src/navigation";
import { ActionKey, actionsFor, FINAL, getHosts, getVisitors, HELD, useQueueActions, useQueueState, Visitor, visitorName, visitorNumber, WAITING } from "@/src/queue";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { ReasonSheet } from "./ReasonSheet";
import { Chip, EmptyState, ErrorBanner, LoadingBlock } from "./ui";
import { VisitorCard } from "./VisitorCard";

export type Filter = { key: string; label: string; statuses?: string[]; exclude?: string[] };

export const QUEUE_FILTERS: Filter[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending", statuses: ["pending_approval", "pending"] },
  { key: "waiting", label: "Waiting", statuses: WAITING },
  { key: "meeting", label: "In meeting", statuses: ["in_meeting"] },
  { key: "hold", label: "On hold", statuses: HELD },
  { key: "done", label: "Done", statuses: FINAL },
];

const REASON_PRESETS: Record<string, string[]> = {
  reject: ["Not available today", "Please reschedule", "Wrong person", "Not expected"],
  hold: ["Back in 10 minutes", "Urgent call", "Short break"],
  cancel: ["Visitor left", "Duplicate entry", "Rescheduled"],
};

// Lists visitors from GET /api/queue/state in exact server order (filtering only, never sorting).
export function QueueList({
  mode,
  showHost,
  filters = QUEUE_FILTERS,
  baseStatuses,
  header,
  emptyTitle = "No visitors right now",
  emptyBody = "New visitors appear here automatically.",
  searchable,
}: {
  searchable?: boolean;
  mode: "console" | "reception" | "admin";
  showHost?: boolean;
  filters?: Filter[];
  baseStatuses?: string[];
  header?: React.ReactNode;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const { colors } = useTheme();
  const styles = useStyles();
  const q = useQueueState();
  const { busy, act } = useQueueActions();
  const [filter, setFilter] = useState(filters[0]?.key ?? "all");
  const [search, setSearch] = useState("");
  const [sheet, setSheet] = useState<{ v: Visitor; a: ActionKey } | null>(null);

  const hosts = getHosts(q.data);
  const list = useMemo(() => {
    let vs = getVisitors(q.data);
    if (baseStatuses) vs = vs.filter((v) => baseStatuses.includes(v.status));
    const f = filters.find((x) => x.key === filter);
    if (f?.statuses) vs = vs.filter((v) => f.statuses!.includes(v.status));
    const term = search.trim().toLowerCase();
    if (term) {
      const digits = term.replace(/\D/g, "");
      vs = vs.filter((v) => {
        const name = String(visitorName(v)).toLowerCase();
        const phone = String(v.phone ?? v.mobile ?? "").replace(/\D/g, "");
        const num = String(visitorNumber(v) ?? "");
        return name.includes(term) || String(v.company ?? "").toLowerCase().includes(term) || (digits.length > 0 && (phone.includes(digits) || num === digits));
      });
    }
    return vs;
  }, [q.data, filter, filters, baseStatuses, search]);

  const onAction = (v: Visitor, a: ActionKey) => {
    if (a === "reject" || a === "hold" || a === "cancel") setSheet({ v, a });
    else act(v.id, a);
  };

  return (
    <View style={{ flex: 1 }}>
      {searchable ? (
        <View style={styles.searchBar}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search name, phone or token"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="never"
              testID="queue-search-input"
            />
            {search ? (
              <Pressable onPress={() => setSearch("")} hitSlop={10} style={styles.clearBtn} testID="queue-search-clear">
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
      {filters.length > 1 ? (
        <View style={styles.chipBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {filters.map((f) => (
              <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} testID={`queue-filter-${f.key}`} />
            ))}
          </ScrollView>
        </View>
      ) : null}
      <FlatList
        data={q.isLoading ? [] : list}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 + bottomChrome }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brandPrimary} colors={[colors.brandPrimary]} />}
        ListHeaderComponent={
          <>
            {q.error ? <ErrorBanner message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : null}
            {header}
          </>
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          q.isLoading ? (
            <LoadingBlock />
          ) : search.trim() ? (
            <EmptyState icon="search-outline" title="No matching visitors" body={`Nothing matches “${search.trim()}” today.`} testID="queue-search-empty" />
          ) : (
            <EmptyState icon="people-outline" title={emptyTitle} body={emptyBody} testID="queue-empty-state" />
          )
        }
        renderItem={({ item, index }) => (
          <VisitorCard visitor={item} hosts={hosts} showHost={showHost} actions={actionsFor(item, mode)} busy={busy} onAction={(a) => onAction(item, a)} index={index} />
        )}
        testID="queue-list"
      />
      <ReasonSheet
        visible={!!sheet}
        title={sheet?.a === "reject" ? "Reject visitor" : sheet?.a === "hold" ? "Put on hold" : "Cancel visit"}
        subtitle={sheet ? `Tell the visitor why (${sheet.v.visitor_name ?? sheet.v.name ?? "visitor"})` : undefined}
        confirmLabel={sheet?.a === "reject" ? "Reject" : sheet?.a === "hold" ? "Hold" : "Cancel visit"}
        tone={sheet?.a === "hold" ? "warning" : "danger"}
        required={sheet?.a === "reject"}
        presets={sheet ? REASON_PRESETS[sheet.a] : []}
        onSubmit={(r) => (sheet ? act(sheet.v.id, sheet.a, r) : Promise.resolve(false))}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  searchBar: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: c.surface },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, height: 48, paddingLeft: 14, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  searchInput: { flex: 1, height: 48, fontFamily: fonts.body, fontSize: 16, color: c.onSurface },
  clearBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  chipBar: { height: 56, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border, justifyContent: "center" },
  chips: { gap: 8, paddingHorizontal: 16, alignItems: "center" },
}));
