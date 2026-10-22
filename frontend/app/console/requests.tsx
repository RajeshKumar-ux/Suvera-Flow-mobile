import { View } from "react-native";

import { QueueList } from "@/src/components/QueueList";
import { ScreenHeader } from "@/src/components/ui";
import { pendingCount, useQueueState } from "@/src/queue";
import { useTheme } from "@/src/theme";

export default function Requests() {
  const { colors } = useTheme();
  const { data } = useQueueState();
  const n = pendingCount(data);
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID="console-requests-screen">
      <ScreenHeader title="Requests" subtitle={n ? `${n} awaiting approval` : "All caught up"} />
      <QueueList
        mode="console"
        filters={[{ key: "pending", label: "Pending" }]}
        baseStatuses={["pending_approval", "pending"]}
        emptyTitle="No pending requests"
        emptyBody="Visitors who want to meet you will appear here for approval."
      />
    </View>
  );
}
