import Ionicons from "@react-native-vector-icons/ionicons";
import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { fmtTime, visitStatus } from "@/src/format";
import { ActionKey, Host, hostNameOf, Visitor, visitorName, visitorNumber } from "@/src/queue";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { Button, Pill } from "./ui";
import { VisitorPhoto } from "./VisitorPhoto";

const ACTION_UI: Record<ActionKey, { label: string; variant: "primary" | "success" | "danger" | "info" | "warning" | "outline"; icon: any }> = {
  approve: { label: "Approve", variant: "success", icon: "checkmark" },
  reject: { label: "Reject", variant: "danger", icon: "close" },
  call: { label: "Call", variant: "primary", icon: "megaphone-outline" },
  start: { label: "Start", variant: "info", icon: "play" },
  complete: { label: "Finish", variant: "success", icon: "checkmark-done" },
  hold: { label: "Hold", variant: "outline", icon: "pause" },
  resume: { label: "Resume", variant: "primary", icon: "play-forward" },
  cancel: { label: "Cancel", variant: "outline", icon: "trash-outline" },
};

export function VisitorCard({
  visitor,
  hosts = [],
  showHost,
  actions = [],
  busy,
  onAction,
  index = 0,
}: {
  visitor: Visitor;
  hosts?: Host[];
  showHost?: boolean;
  actions?: ActionKey[];
  busy?: string | null;
  onAction?: (a: ActionKey) => void;
  index?: number;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const st = visitStatus(visitor.status);
  const num = visitorNumber(visitor);
  const name = visitorName(visitor);
  const host = showHost ? hostNameOf(visitor, hosts) : undefined;
  const sub = [visitor.company, visitor.purpose].filter(Boolean).join(" · ");
  const time = fmtTime(visitor.created_at ?? visitor.registered_at ?? visitor.checked_in_at);
  const anyBusy = !!busy && busy.startsWith(`${visitor.id}:`);

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(260)} style={styles.card} testID={`visitor-card-${visitor.id}`}>
      <View style={styles.top}>
        <VisitorPhoto visitId={visitor.id} hasPhoto={visitor.has_photo === true} name={name} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.nameRow}>
            {num != null ? (
              <Text style={styles.num} testID={`visitor-number-${visitor.id}`}>
                #{num}
              </Text>
            ) : null}
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
          </View>
          {sub ? (
            <Text style={styles.sub} numberOfLines={2}>
              {sub}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Pill label={st.label} tone={st.tone} testID={`visitor-status-${visitor.id}`} />
            {time ? <Text style={styles.time}>{time}</Text> : null}
          </View>
        </View>
      </View>
      {host ? (
        <View style={styles.hostRow} testID={`visitor-host-${visitor.id}`}>
          <Ionicons name="person-circle-outline" size={18} color={colors.brandPrimary} />
          <Text style={styles.hostText} numberOfLines={1}>
            Meeting <Text style={styles.hostName}>{host}</Text>
          </Text>
        </View>
      ) : null}
      {visitor.phone ? <Text style={styles.phone}>{visitor.phone}</Text> : null}
      {visitor.reason || visitor.status_reason ? <Text style={styles.reason}>“{visitor.reason ?? visitor.status_reason}”</Text> : null}
      {actions.length ? (
        <View style={styles.actions}>
          {actions.map((a) => (
            <Button
              key={a}
              label={ACTION_UI[a].label}
              icon={ACTION_UI[a].icon}
              variant={ACTION_UI[a].variant}
              size="md"
              onPress={() => onAction?.(a)}
              loading={busy === `${visitor.id}:${a}`}
              disabled={anyBusy}
              style={styles.actionBtn}
              testID={`visitor-${a}-button-${visitor.id}`}
            />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  card: { backgroundColor: c.surfaceSecondary, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12 },
  top: { flexDirection: "row", gap: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  num: { fontFamily: fonts.monoBold, fontSize: 15, color: c.brandPrimary, backgroundColor: c.brandTertiary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: "hidden" },
  name: { fontFamily: fonts.headingSemi, fontSize: 17, color: c.onSurface, flex: 1 },
  sub: { fontFamily: fonts.body, fontSize: 14, color: c.muted },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  time: { fontFamily: fonts.mono, fontSize: 13, color: c.muted },
  hostRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, backgroundColor: c.surfaceTertiary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  hostText: { fontFamily: fonts.body, fontSize: 14, color: c.onSurfaceTertiary, flex: 1 },
  hostName: { fontFamily: fonts.bodyBold, color: c.brandPrimary },
  phone: { fontFamily: fonts.mono, fontSize: 13, color: c.onSurfaceTertiary, marginTop: 8 },
  reason: { fontFamily: fonts.body, fontSize: 13, color: c.muted, marginTop: 6, fontStyle: "italic" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  actionBtn: { flexGrow: 1, minWidth: 96 },
}));
