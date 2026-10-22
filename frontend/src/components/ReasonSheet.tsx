import React, { useEffect, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";

import { fonts, makeStyles, useTheme } from "@/src/theme";
import { Sheet } from "./Sheet";
import { Button, Chip } from "./ui";

export function ReasonSheet({
  visible,
  title,
  subtitle,
  confirmLabel,
  tone = "danger",
  required,
  presets = [],
  onSubmit,
  onClose,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  confirmLabel: string;
  tone?: "danger" | "warning" | "primary";
  required?: boolean;
  presets?: string[];
  onSubmit: (reason: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const styles = useStyles();
  const { colors } = useTheme();

  useEffect(() => {
    if (visible) setReason("");
  }, [visible]);

  const submit = async () => {
    setBusy(true);
    const ok = await onSubmit(reason.trim());
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Sheet visible={visible} title={title} subtitle={subtitle} onClose={onClose} testID="reason-sheet">
      {presets.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipRow}>
          {presets.map((p, i) => (
            <Chip key={p} label={p} selected={reason === p} onPress={() => setReason(p)} testID={`reason-preset-${i}`} />
          ))}
        </ScrollView>
      ) : null}
      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder={required ? "Reason (required)" : "Reason (optional)"}
        placeholderTextColor={colors.muted}
        style={styles.input}
        multiline
        testID="reason-input"
      />
      <View style={styles.row}>
        <Button label="Cancel" variant="outline" onPress={onClose} style={{ flex: 1 }} size="lg" testID="reason-cancel-button" />
        <Button
          label={confirmLabel}
          variant={tone}
          onPress={submit}
          loading={busy}
          disabled={required && !reason.trim()}
          style={{ flex: 1.4 }}
          size="lg"
          testID="reason-confirm-button"
        />
      </View>
    </Sheet>
  );
}

const useStyles = makeStyles((c) => ({
  chipRow: { marginTop: 16, height: 56, flexGrow: 0 },
  chips: { gap: 8, alignItems: "center" },
  input: {
    marginTop: 12,
    minHeight: 96,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceTertiary,
    borderRadius: 12,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: c.onSurface,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", gap: 12, marginTop: 16 },
}));
