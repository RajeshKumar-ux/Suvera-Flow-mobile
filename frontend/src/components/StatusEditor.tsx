import Ionicons from "@react-native-vector-icons/ionicons";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { fmtDateTime, HOST_STATUSES, hostStatus, HostStatus } from "@/src/format";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { Button, Chip, toneColors } from "./ui";

export type StatusPayload = { status: HostStatus; reason: string; available_from: string | null };

type Preset = { key: string; label: string; make: () => Date | null };
const PRESETS: Preset[] = [
  { key: "none", label: "Not set", make: () => null },
  { key: "now", label: "Now", make: () => new Date() },
  { key: "30m", label: "In 30 min", make: () => new Date(Date.now() + 30 * 60000) },
  { key: "1h", label: "In 1 hr", make: () => new Date(Date.now() + 60 * 60000) },
  { key: "2h", label: "In 2 hrs", make: () => new Date(Date.now() + 120 * 60000) },
  {
    key: "tomorrow",
    label: "Tomorrow 9:00",
    make: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
];

function parseCustom(s: string): Date | null {
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return isNaN(d.getTime()) ? null : d;
}

export function StatusEditor({
  initial,
  onSave,
  saveLabel = "Update availability",
  testPrefix = "status",
}: {
  initial?: { status?: string; reason?: string; available_from?: string | null };
  onSave: (p: StatusPayload) => Promise<boolean>;
  saveLabel?: string;
  testPrefix?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [status, setStatus] = useState<HostStatus>((HOST_STATUSES as readonly string[]).includes(initial?.status ?? "") ? (initial!.status as HostStatus) : "available");
  const [reason, setReason] = useState(initial?.reason ?? "");
  const [preset, setPreset] = useState<string>(initial?.available_from ? "custom" : "none");
  const [custom, setCustom] = useState("");
  const [fromIso, setFromIso] = useState<string | null>(initial?.available_from ?? null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (preset === "custom") {
      const d = parseCustom(custom);
      if (d) setFromIso(d.toISOString());
      else if (custom) setFromIso(null);
      return;
    }
    const p = PRESETS.find((x) => x.key === preset);
    setFromIso(p?.make()?.toISOString() ?? null);
  }, [preset, custom]);

  const customInvalid = useMemo(() => preset === "custom" && !!custom && !parseCustom(custom), [preset, custom]);

  const save = async () => {
    setBusy(true);
    await onSave({ status, reason: reason.trim(), available_from: fromIso });
    setBusy(false);
  };

  return (
    <View>
      <View style={{ gap: 8 }}>
        {HOST_STATUSES.map((s) => {
          const meta = hostStatus(s);
          const t = toneColors(colors, meta.tone);
          const sel = status === s;
          return (
            <Pressable
              key={s}
              onPress={() => setStatus(s)}
              style={[styles.opt, { borderColor: sel ? t.solid : colors.border, backgroundColor: sel ? t.bg : colors.surfaceSecondary }]}
              testID={`${testPrefix}-option-${s}`}
            >
              <View style={[styles.optIcon, { backgroundColor: sel ? t.solid : t.bg }]}>
                <Ionicons name={meta.icon as any} size={20} color={sel ? colors.onBrand : t.solid} />
              </View>
              <Text style={[styles.optLabel, { color: sel ? t.fg : colors.onSurface }]}>{meta.label}</Text>
              <Ionicons name={sel ? "radio-button-on" : "radio-button-off"} size={22} color={sel ? t.solid : colors.borderStrong} />
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Reason / note</Text>
      <TextInput
        value={reason}
        onChangeText={setReason}
        placeholder="e.g. Board meeting till 4 PM"
        placeholderTextColor={colors.muted}
        style={styles.input}
        testID={`${testPrefix}-reason-input`}
      />

      <Text style={styles.label}>Available from</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipRow}>
        {[...PRESETS, { key: "custom", label: "Custom" } as Preset].map((p) => (
          <Chip key={p.key} label={p.label} selected={preset === p.key} onPress={() => setPreset(p.key)} testID={`${testPrefix}-from-${p.key}`} />
        ))}
      </ScrollView>
      {preset === "custom" ? (
        <TextInput
          value={custom}
          onChangeText={setCustom}
          placeholder="YYYY-MM-DD HH:mm"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.mono, customInvalid && { borderColor: colors.error }]}
          autoCapitalize="none"
          testID={`${testPrefix}-from-custom-input`}
        />
      ) : null}
      <Text style={styles.fromValue} testID={`${testPrefix}-from-value`}>
        {fromIso ? fmtDateTime(fromIso) : "No time set"}
      </Text>

      <Button label={saveLabel} onPress={save} loading={busy} disabled={customInvalid} size="lg" style={{ marginTop: 16 }} testID={`${testPrefix}-save-button`} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  opt: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, height: 60 },
  optIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  optLabel: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 16 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: c.onSurfaceTertiary, marginTop: 20, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: c.onSurface,
  },
  mono: { fontFamily: fonts.mono, marginTop: 8 },
  chipRow: { height: 56, flexGrow: 0 },
  chips: { gap: 8, alignItems: "center" },
  fromValue: { fontFamily: fonts.mono, fontSize: 14, color: c.brandPrimary, marginTop: 8 },
}));
