import { View } from "react-native";

import { QueueList } from "@/src/components/QueueList";
import { ScreenHeader } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

export default function AdminQueue() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID="admin-queue-screen">
      <ScreenHeader title="Queue" subtitle="Whole company" />
      <QueueList mode="admin" showHost />
    </View>
  );
}
