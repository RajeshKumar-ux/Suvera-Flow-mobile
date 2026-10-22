import { View } from "react-native";

import { QUEUE_FILTERS, QueueList } from "@/src/components/QueueList";
import { ScreenHeader } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

export default function ConsoleQueue() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID="console-queue-screen">
      <ScreenHeader title="My Queue" subtitle="Server order" />
      <QueueList mode="console" filters={QUEUE_FILTERS.filter((f) => f.key !== "pending")} />
    </View>
  );
}
