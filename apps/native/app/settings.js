import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../src/components/AppButton";
import { Card } from "../src/components/Card";
import { Screen } from "../src/components/Screen";
import { SectionHeader } from "../src/components/SectionHeader";
import { getNativeRuntimeConfig } from "../src/lib/runtime-config";
import { colors, spacing } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";

function SettingRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const signOut = useAppStore((state) => state.signOut);
  const authMode = useAppStore((state) => state.authMode);
  const sessionRestoredFrom = useAppStore((state) => state.sessionRestoredFrom);
  const liveSyncStatus = useAppStore((state) => state.liveSyncStatus);
  const authHealthStatus = useAppStore((state) => state.authHealthStatus);
  const requestReviewQueueStatus = useAppStore((state) => state.requestReviewQueueStatus);
  const runtimeConfig = getNativeRuntimeConfig();

  return (
    <Screen scroll>
      <SectionHeader title="Settings" subtitle="Account, support, and testing access." />

      <Card>
        <Text style={styles.groupTitle}>Account</Text>
        <SettingRow label="Sign-in mode" value={authMode === "supabase" ? "Cloud account" : "Local tester"} />
        <SettingRow label="Session source" value={sessionRestoredFrom || "Fresh launch"} />
        <SettingRow label="Session health" value={authHealthStatus || "idle"} />
      </Card>

      <Card>
        <Text style={styles.groupTitle}>App</Text>
        <SettingRow label="Environment" value={runtimeConfig.appEnv} />
        <SettingRow label="Channel" value={runtimeConfig.releaseChannel} />
        <SettingRow label="Live sync" value={liveSyncStatus || "idle"} />
        <SettingRow label="Request queue" value={requestReviewQueueStatus || "idle"} />
      </Card>

      <Card>
        <Text style={styles.groupTitle}>Support</Text>
        <Text style={styles.note}>Use Help for product flow answers and Testing for rollout diagnostics.</Text>
      </Card>

      <View style={styles.actions}>
        <AppButton label="Open Help" onPress={() => router.push("/help")} />
        <AppButton label="Open Testing" variant="secondary" onPress={() => router.push("/testing")} />
        <AppButton label="Back to Profile" variant="secondary" onPress={() => router.back()} />
        <AppButton
          label="Sign Out"
          variant="secondary"
          onPress={async () => {
            await signOut();
            router.replace("/auth");
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  groupTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  note: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.md,
  },
});
