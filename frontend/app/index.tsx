import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { homeFor, useAuth } from "@/src/auth";
import { useTheme } from "@/src/theme";

export default function Index() {
  const { status, user } = useAuth();
  const { colors } = useTheme();
  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.brandPrimary }} testID="boot-loading">
        <ActivityIndicator color={colors.onBrand} size="large" />
      </View>
    );
  }
  if (status === "signedIn" && user) return <Redirect href={homeFor(user.role)} />;
  return <Redirect href="/login" />;
}
