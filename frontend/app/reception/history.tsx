import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HistoryView } from "@/src/components/HistoryView";
import { ScreenHeader } from "@/src/components/ui";
import { usesNativeTabs } from "@/src/navigation";
import { useTheme } from "@/src/theme";

export default function ReceptionHistory() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID="reception-history-screen">
      <ScreenHeader title="History" subtitle="Visits" />
      <HistoryView bottomPad={usesNativeTabs ? insets.bottom : 0} />
    </View>
  );
}
