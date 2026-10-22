import { View } from "react-native";

import { HostAvailabilityList } from "@/src/components/HostAvailabilityList";
import { ScreenHeader } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

export default function ReceptionAvailability() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID="reception-availability-screen">
      <ScreenHeader title="Availability" subtitle="Who can meet now" />
      <HostAvailabilityList showWaiting />
    </View>
  );
}
