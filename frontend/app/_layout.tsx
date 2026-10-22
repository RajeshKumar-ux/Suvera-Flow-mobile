import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, LogBox, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AuthProvider } from "@/src/auth";
import { ErrorBoundary } from "@/src/components/error-boundary";
import { PushPrompt } from "@/src/components/PushPrompt";
import { LiveSync } from "@/src/LiveSync";
import { queryClient } from "@/src/query-client";
import { colors } from "@/src/theme";
import { ToastProvider } from "@/src/toast";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  const [loaded] = useFonts({
    "Manrope-SemiBold": require("../assets/fonts/Manrope-SemiBold.ttf"),
    "Manrope-ExtraBold": require("../assets/fonts/Manrope-ExtraBold.ttf"),
    "DMSans-Regular": require("../assets/fonts/DMSans-Regular.ttf"),
    "DMSans-Medium": require("../assets/fonts/DMSans-Medium.ttf"),
    "DMSans-Bold": require("../assets/fonts/DMSans-Bold.ttf"),
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
    "JetBrainsMono-Bold": require("../assets/fonts/JetBrainsMono-Bold.ttf"),
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            <AuthProvider>
              <ToastProvider>
                <StatusBar style="light" />
                {loaded ? (
                  <>
                    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }} />
                    <LiveSync />
                    <PushPrompt />
                  </>
                ) : (
                  <View style={styles.splash}>
                    <ActivityIndicator color={colors.onBrand} />
                  </View>
                )}
              </ToastProvider>
            </AuthProvider>
          </KeyboardProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.brandPrimary },
});
