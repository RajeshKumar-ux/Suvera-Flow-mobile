import { Redirect, useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/auth";
import { HistoryView } from "@/src/components/HistoryView";
import { ScreenHeader } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { status } = useAuth();
  if (status === "signedOut") return <Redirect href="/login" />;
  if (status !== "signedIn") return null;
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID="history-screen">
      <ScreenHeader title="History" subtitle="Visits" onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
      <HistoryView bottomPad={insets.bottom} />
    </View>
  );
}
