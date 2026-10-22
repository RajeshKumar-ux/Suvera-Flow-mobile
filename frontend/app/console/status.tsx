import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { RefreshControl, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, errorMessage } from "@/src/api";
import { StatusEditor } from "@/src/components/StatusEditor";
import { Card, ErrorBanner, HeaderIcon, LoadingBlock, Pill, ScreenHeader } from "@/src/components/ui";
import { fmtDateTime, hostStatus } from "@/src/format";
import { usesNativeTabs } from "@/src/navigation";
import { QUEUE_KEY, useQueueState } from "@/src/queue";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useToast } from "@/src/toast";

export default function MyStatus() {
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQueueState();
  const host = q.data?.host;
  const hs = hostStatus(host?.status);

  const save = async (p: any) => {
    try {
      await api("/api/md/status", { method: "PUT", body: p });
      toast.show("Availability updated", "success");
      return true;
    } catch (e) {
      toast.show(errorMessage(e), "error");
      return false;
    } finally {
      await qc.invalidateQueries({ queryKey: QUEUE_KEY });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID="console-status-screen">
      <ScreenHeader title="My Status" subtitle="Availability" right={<HeaderIcon icon="time-outline" onPress={() => router.push("/history")} testID="status-history-button" />} />
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 + bottomChrome }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brandPrimary} colors={[colors.brandPrimary]} />}
      >
        {q.error ? <ErrorBanner message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : null}
        {q.isLoading ? (
          <LoadingBlock />
        ) : (
          <>
            <Card style={{ marginBottom: 20, gap: 6 }} testID="current-status-card">
              <Text style={styles.caption}>Currently shown to visitors</Text>
              <Pill label={hs.label} tone={hs.tone} testID="current-status-pill" />
              {host?.status_reason || host?.reason ? <Text style={styles.reason}>{host.status_reason ?? host.reason}</Text> : null}
              {host?.available_from ? <Text style={styles.mono}>Available from {fmtDateTime(host.available_from)}</Text> : null}
            </Card>
            <StatusEditor
              key={`${host?.status}-${host?.available_from}`}
              initial={{ status: host?.status, reason: host?.status_reason ?? host?.reason, available_from: host?.available_from }}
              onSave={save}
              testPrefix="my-status"
            />
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  caption: { fontFamily: fonts.bodyBold, fontSize: 12, color: c.muted, textTransform: "uppercase", letterSpacing: 0.6 },
  reason: { fontFamily: fonts.body, fontSize: 14, color: c.onSurfaceTertiary },
  mono: { fontFamily: fonts.mono, fontSize: 13, color: c.onSurfaceTertiary },
}));
