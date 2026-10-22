import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { api, errorMessage } from "@/src/api";
import { HostAvailabilityList } from "@/src/components/HostAvailabilityList";
import { Sheet } from "@/src/components/Sheet";
import { StatusEditor, StatusPayload } from "@/src/components/StatusEditor";
import { ScreenHeader } from "@/src/components/ui";
import { Host, QUEUE_KEY } from "@/src/queue";
import { useTheme } from "@/src/theme";
import { useToast } from "@/src/toast";

export default function AvailabilityControl() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [host, setHost] = useState<Host | null>(null);

  const save = async (p: StatusPayload) => {
    if (!host) return false;
    try {
      await api(`/api/admin/hosts/${host.id}/status`, { method: "PUT", body: p });
      toast.show(`${host.name ?? "Host"} updated`, "success");
      setHost(null);
      return true;
    } catch (e) {
      toast.show(errorMessage(e), "error");
      return false;
    } finally {
      await qc.invalidateQueries({ queryKey: QUEUE_KEY });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID="admin-control-screen">
      <ScreenHeader title="Availability" subtitle="Control · tap a person" />
      <HostAvailabilityList onSelect={setHost} />
      <Sheet visible={!!host} title={`Set status · ${host?.name ?? ""}`} onClose={() => setHost(null)} testID="admin-status-sheet">
        <KeyboardAwareScrollView bottomOffset={24} style={{ marginTop: 16 }} contentContainerStyle={{ paddingBottom: 8 }}>
          {host ? (
            <StatusEditor
              initial={{ status: host.status, reason: host.status_reason ?? host.reason, available_from: host.available_from }}
              onSave={save}
              saveLabel="Save status"
              testPrefix="admin-status"
            />
          ) : null}
        </KeyboardAwareScrollView>
      </Sheet>
    </View>
  );
}
