import Ionicons from "@react-native-vector-icons/ionicons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, asList, errorMessage } from "@/src/api";
import { useAuth } from "@/src/auth";
import { Sheet } from "@/src/components/Sheet";
import { Button, Chip, EmptyState, ErrorBanner, HeaderIcon, LoadingBlock, Pill, ScreenHeader } from "@/src/components/ui";
import { VisitorPhoto } from "@/src/components/VisitorPhoto";
import { usesNativeTabs } from "@/src/navigation";
import { QUEUE_KEY } from "@/src/queue";
import { fonts, makeStyles, useTheme } from "@/src/theme";
import { useToast } from "@/src/toast";

const USERS_KEY = ["admin-users"];
const ROLE_OPTIONS = [
  { key: "reception", label: "Reception" },
  { key: "md", label: "MD" },
  { key: "admin", label: "IT Admin" },
  { key: "others", label: "Others" },
];

function roleLabelOf(u: any) {
  if (u.role === "admin") return "IT Admin";
  if (u.role === "reception") return "Reception";
  if (u.role === "md") return u.role_label || "Managing Director";
  return u.role_label || "Meeting person";
}

const isActive = (u: any) => u.is_active !== false && u.active !== false;

export default function People() {
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const styles = useStyles();
  const { colors } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const q = useQuery({ queryKey: USERS_KEY, queryFn: () => api("/api/admin/users") });
  const users = asList(q.data, ["users", "items", "results"]);

  const [addOpen, setAddOpen] = useState(false);
  const [manage, setManage] = useState<any | null>(null);
  const [mode, setMode] = useState<"menu" | "password" | "delete">("menu");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const call = async (key: string, fn: () => Promise<unknown>, done: string) => {
    setBusy(key);
    try {
      await fn();
      toast.show(done, "success");
      return true;
    } catch (e) {
      toast.show(errorMessage(e), "error");
      return false;
    } finally {
      await qc.invalidateQueries({ queryKey: USERS_KEY });
      await qc.invalidateQueries({ queryKey: QUEUE_KEY });
      setBusy(null);
    }
  };

  const openManage = (u: any) => {
    setManage(u);
    setMode("menu");
    setNewPw("");
  };

  const resetPassword = async () => {
    const ok = await call("pw", () => api(`/api/admin/users/${manage.id}`, { method: "PUT", body: { password: newPw } }), "Password reset");
    if (ok) setManage(null);
  };
  const toggleActive = async () => {
    const ok = await call("active", () => api(`/api/admin/users/${manage.id}`, { method: "PUT", body: { is_active: !isActive(manage) } }), isActive(manage) ? "Account deactivated" : "Account reactivated");
    if (ok) setManage(null);
  };
  const remove = async () => {
    const ok = await call("delete", () => api(`/api/admin/users/${manage.id}`, { method: "DELETE" }), "Person deleted");
    if (ok) setManage(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }} testID="admin-people-screen">
      <ScreenHeader title="People" subtitle={`${users.length} accounts`} right={<HeaderIcon icon="person-add" onPress={() => setAddOpen(true)} testID="people-add-button" />} />
      <FlatList
        data={q.isLoading ? [] : users}
        keyExtractor={(u: any) => String(u.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 + bottomChrome }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} tintColor={colors.brandPrimary} colors={[colors.brandPrimary]} />}
        ListHeaderComponent={q.error ? <ErrorBanner message={errorMessage(q.error)} onRetry={() => q.refetch()} /> : null}
        ListEmptyComponent={q.isLoading ? <LoadingBlock /> : <EmptyState icon="people-outline" title="No people yet" body="Tap + to add your first staff member." testID="people-empty-state" />}
        renderItem={({ item }: { item: any }) => (
          <Pressable onPress={() => openManage(item)} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceTertiary }]} testID={`person-row-${item.id}`}>
            <VisitorPhoto visitId={`user-${item.id}`} name={item.name ?? item.email} size={46} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name ?? item.full_name ?? item.email}
                {String(item.id) === String(me?.id) ? <Text style={styles.you}>  (you)</Text> : null}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {item.email}
              </Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Pill label={roleLabelOf(item)} tone="brand" />
                {!isActive(item) ? <Pill label="Inactive" tone="error" /> : null}
              </View>
            </View>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.muted} />
          </Pressable>
        )}
      />

      <AddPersonSheet visible={addOpen} onClose={() => setAddOpen(false)} onCreate={(body) => call("create", () => api("/api/admin/users", { method: "POST", body }), "Person added")} />

      <Sheet visible={!!manage} title={manage?.name ?? manage?.email ?? ""} subtitle={manage ? `${roleLabelOf(manage)} · ${manage.email}` : undefined} onClose={() => setManage(null)} testID="person-manage-sheet">
        <View style={{ gap: 10, marginTop: 16 }}>
          {mode === "menu" ? (
            <>
              <Button label="Reset password" icon="key-outline" variant="outline" size="lg" onPress={() => setMode("password")} testID="person-reset-password-button" />
              <Button
                label={manage && isActive(manage) ? "Deactivate account" : "Reactivate account"}
                icon={manage && isActive(manage) ? "pause-circle-outline" : "play-circle-outline"}
                variant={manage && isActive(manage) ? "warning" : "success"}
                size="lg"
                onPress={toggleActive}
                loading={busy === "active"}
                testID="person-toggle-active-button"
              />
              <Button label="Delete person" icon="trash-outline" variant="danger" size="lg" onPress={() => setMode("delete")} testID="person-delete-button" />
            </>
          ) : mode === "password" ? (
            <>
              <TextInput
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry
                placeholder="New password (min 8 chars)"
                placeholderTextColor={colors.muted}
                style={styles.input}
                testID="person-new-password-input"
              />
              <Button label="Set new password" size="lg" onPress={resetPassword} loading={busy === "pw"} disabled={newPw.length < 8} testID="person-new-password-submit" />
              <Button label="Back" variant="ghost" onPress={() => setMode("menu")} testID="person-password-back" />
            </>
          ) : (
            <>
              <Text style={styles.warn}>This permanently removes the account. Visit history stays on the server.</Text>
              <Button label="Yes, delete" variant="danger" size="lg" onPress={remove} loading={busy === "delete"} testID="person-delete-confirm-button" />
              <Button label="Back" variant="ghost" onPress={() => setMode("menu")} testID="person-delete-back" />
            </>
          )}
        </View>
      </Sheet>
    </View>
  );
}

function AddPersonSheet({ visible, onClose, onCreate }: { visible: boolean; onClose: () => void; onCreate: (body: any) => Promise<boolean> }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("reception");
  const [roleLabel, setRoleLabel] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setRole("reception");
    setRoleLabel("");
  };

  const valid = name.trim() && /\S+@\S+\.\S+/.test(email.trim()) && password.length >= 8 && (role !== "others" || roleLabel.trim());

  const submit = async () => {
    setBusy(true);
    const body: any = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role === "others" ? "host" : role,
    };
    if (phone.trim()) body.phone = phone.trim();
    if (role === "others") body.role_label = roleLabel.trim();
    const ok = await onCreate(body);
    setBusy(false);
    if (ok) {
      reset();
      onClose();
    }
  };

  const field = (label: string, value: string, set: (s: string) => void, testID: string, extra: any = {}) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={set} placeholderTextColor={colors.muted} style={styles.input} testID={testID} {...extra} />
    </>
  );

  return (
    <Sheet visible={visible} title="Add person" subtitle="Create a staff login" onClose={onClose} testID="add-person-sheet">
      <KeyboardAwareScrollView bottomOffset={24} style={{ marginTop: 8 }} keyboardShouldPersistTaps="handled">
        {field("Name", name, setName, "add-person-name-input", { placeholder: "Full name" })}
        {field("Email", email, setEmail, "add-person-email-input", { placeholder: "name@company.com", autoCapitalize: "none", keyboardType: "email-address" })}
        {field("Phone (optional)", phone, setPhone, "add-person-phone-input", { placeholder: "+91 …", keyboardType: "phone-pad" })}
        {field("Password", password, setPassword, "add-person-password-input", { placeholder: "Min 8 characters", secureTextEntry: true })}
        <Text style={styles.label}>Role</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipRow}>
          {ROLE_OPTIONS.map((r) => (
            <Chip key={r.key} label={r.label} selected={role === r.key} onPress={() => setRole(r.key)} testID={`add-person-role-${r.key}`} />
          ))}
        </ScrollView>
        {role === "others" ? field("Type the role", roleLabel, setRoleLabel, "add-person-role-label-input", { placeholder: "e.g. Finance Head" }) : null}
        <Button label="Add person" size="lg" onPress={submit} loading={busy} disabled={!valid} style={{ marginTop: 20 }} testID="add-person-submit-button" />
      </KeyboardAwareScrollView>
    </Sheet>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  name: { fontFamily: fonts.headingSemi, fontSize: 16, color: c.onSurface },
  you: { fontFamily: fonts.body, fontSize: 13, color: c.muted },
  email: { fontFamily: fonts.body, fontSize: 13, color: c.muted },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: c.onSurfaceTertiary, marginTop: 14, marginBottom: 6 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceTertiary,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: c.onSurface,
  },
  chipRow: { height: 56, flexGrow: 0 },
  chips: { gap: 8, alignItems: "center" },
  warn: { fontFamily: fonts.body, fontSize: 15, color: c.onSurfaceTertiary, lineHeight: 21 },
}));
