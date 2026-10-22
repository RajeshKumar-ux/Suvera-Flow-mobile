import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, makeStyles } from "@/src/theme";

export function Sheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  testID,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  testID: string;
}) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable style={styles.scrim} onPress={onClose} testID={`${testID}-backdrop`} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]} testID={testID}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  scrim: { flex: 1, backgroundColor: c.scrim },
  sheet: {
    backgroundColor: c.surfaceSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: "92%",
  },
  handle: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: c.borderStrong, marginBottom: 16 },
  title: { fontFamily: fonts.heading, fontSize: 20, color: c.onSurface },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: c.muted, marginTop: 4 },
}));
