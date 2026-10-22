import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import { Redirect } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError, errorMessage } from "@/src/api";
import { homeFor, useAuth } from "@/src/auth";
import { Button } from "@/src/components/ui";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Login() {
  const { status, user, login, notice } = useAuth();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ msg: string; locked: boolean } | null>(null);

  if (status === "signedIn" && user) return <Redirect href={homeFor(user.role)} />;

  const submit = async () => {
    if (!email.trim() || !password) {
      setError({ msg: "Enter your email and password.", locked: false });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (e) {
      setError({ msg: errorMessage(e), locked: e instanceof ApiError && e.status === 429 });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { paddingTop: insets.top + 48 }]}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <Image source={require("../assets/images/logo.png")} style={styles.logo} contentFit="contain" accessibilityLabel="Suvera FLOW" testID="login-logo" />
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(80).duration(400)} style={styles.tagline}>
            Visitor queue, in real time.
          </Animated.Text>
        </View>

        <Animated.View entering={FadeInDown.delay(150).duration(450)} style={[styles.form, { paddingBottom: insets.bottom + 24 }]}>
          <Text style={styles.formTitle}>Staff sign in</Text>
          {notice ? (
            <View style={styles.notice} testID="login-notice">
              <Ionicons name="information-circle" size={18} color={colors.info} />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}
          {error ? (
            <View style={styles.err} testID="login-error">
              <Ionicons name={error.locked ? "lock-closed" : "alert-circle"} size={18} color={colors.error} />
              <Text style={styles.errText} testID="login-error-text">
                {error.msg}
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@company.com"
            placeholderTextColor={colors.muted}
            style={styles.input}
            returnKeyType="next"
            testID="login-email-input"
          />
          <Text style={styles.label}>Password</Text>
          <View style={styles.pwWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!show}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              style={[styles.input, { flex: 1, borderWidth: 0 }]}
              returnKeyType="go"
              onSubmitEditing={submit}
              testID="login-password-input"
            />
            <Pressable onPress={() => setShow((s) => !s)} style={styles.eye} testID="login-toggle-password">
              <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={22} color={colors.muted} />
            </Pressable>
          </View>
          <Button label="Sign in" size="lg" onPress={submit} loading={busy} style={{ marginTop: 24 }} testID="login-submit-button" />
          <Text style={styles.foot}>Accounts are managed by your IT Admin.</Text>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.brandPrimary },
  hero: { paddingHorizontal: 24, paddingBottom: 40 },
  logo: { width: 220, height: 67 },
  tagline: { fontFamily: fonts.body, fontSize: 16, color: c.onBrandMuted, marginTop: 14 },
  form: { flex: 1, backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 28 },
  formTitle: { fontFamily: fonts.heading, fontSize: 24, color: c.onSurface, marginBottom: 8 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: c.onSurfaceTertiary, marginTop: 16, marginBottom: 8 },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: c.onSurface,
  },
  pwWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, borderRadius: 12 },
  eye: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  err: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: c.errorSoft, padding: 12, borderRadius: 12, marginTop: 8 },
  errText: { flex: 1, fontFamily: fonts.bodyMedium, color: c.error, fontSize: 14 },
  notice: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: c.infoSoft, padding: 12, borderRadius: 12, marginTop: 8 },
  noticeText: { flex: 1, fontFamily: fonts.bodyMedium, color: c.info, fontSize: 14 },
  foot: { fontFamily: fonts.body, color: c.muted, fontSize: 13, textAlign: "center", marginTop: 20 },
}));
