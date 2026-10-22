import { View } from "react-native";

import { displayName, useAuth } from "@/src/auth";
import { QueueList } from "@/src/components/QueueList";
import { HeaderIcon, ScreenHeader } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

export default function ReceptionToday() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID="reception-today-screen">
      <ScreenHeader showLogo title="Today" subtitle={`Reception · ${displayName(user)}`} right={<HeaderIcon icon="log-out-outline" onPress={() => logout()} testID="logout-button" />} />
      <QueueList mode="reception" showHost />
    </View>
  );
}
