import { useQuery } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, asList, errorMessage } from "@/src/api";
import { homeFor, useAuth } from "@/src/auth";
import { EmptyState, ErrorBanner, LoadingBlock, ScreenHeader } from "@/src/components/ui";
import { fmtDateTime } from "@/src/format";
import { fonts, makeStyles, useTheme } from "@/src/theme";

function describe(details: any): string {
  if (!details) return "";
  if (typeof details === "string") return details;
  try {
    return Object.entries(details)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
      .join(" · ");
  } catch {
    return "";
  }
}

export default function AuditScreen() {
  const { status, user } = useAuth();
  if (status === "signedOut") return <Redirect href="/login" />;
  if (status !== "signedIn" || !user) return null;
  if (user.role !== "admin") return <Redirect href={homeFor(user.role)} />;
  return <AuditList />;
}

function AuditList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const q = useQuery({ queryKey: ["audit"], queryFn: () => api("/api/admin/audit") });
  const list = asList(q.data, ["items", "logs", "audit", "entries", "results"]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID="audit-screen">
      <ScreenHeader title="Audit log" subtitle="IT Admin" onBack={() => (router.canGoBack() ? router.back() : router.replace("/admin"))} />
      <FlatList
        data={q.isLoading ? [] : list}
        keyExtractor={(x: any, i) => String(x.id ?? i)}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brandPrimary} colors={[colors.brandPrimary]} />}
        ListHeaderComponent={q.error ? <ErrorBanner message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : null}
        ListEmptyComponent={q.isLoading ? <LoadingBlock /> : <EmptyState icon="document-text-outline" title="No audit entries" testID="audit-empty-state" />}
        renderItem={({ item }: { item: any }) => (
          <View style={styles.row} testID={`audit-row-${item.id ?? ""}`}>
            <View style={styles.bar} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.action}>{String(item.action ?? item.event ?? "event").replace(/_/g, " ")}</Text>
              <Text style={styles.actor}>{item.actor_name ?? item.actor_email ?? item.user_name ?? item.actor ?? "System"}</Text>
              {describe(item.details ?? item.meta ?? item.message) ? (
                <Text style={styles.details} numberOfLines={3}>
                  {describe(item.details ?? item.meta ?? item.message)}
                </Text>
              ) : null}
              <Text style={styles.time}>{fmtDateTime(item.created_at ?? item.timestamp ?? item.at)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: "row", gap: 12, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, marginBottom: 10 },
  bar: { width: 4, borderRadius: 2, backgroundColor: c.brandPrimary },
  action: { fontFamily: fonts.headingSemi, fontSize: 15, color: c.onSurface, textTransform: "capitalize" },
  actor: { fontFamily: fonts.bodyMedium, fontSize: 13, color: c.brandPrimary },
  details: { fontFamily: fonts.body, fontSize: 13, color: c.muted },
  time: { fontFamily: fonts.mono, fontSize: 12, color: c.onSurfaceTertiary },
}));
