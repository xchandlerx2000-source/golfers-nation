import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../src/components/AppButton";
import { Card } from "../src/components/Card";
import { Screen } from "../src/components/Screen";
import { SectionHeader } from "../src/components/SectionHeader";
import { getNativeRuntimeConfig } from "../src/lib/runtime-config";
import {
  clearNativeCrashLogEntries,
  getNativeCrashLogSummary,
} from "../src/services/native-crash-service";
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
  const authHealthNotice = useAppStore((state) => state.authHealthNotice);
  const sessionExpiresAt = useAppStore((state) => state.sessionExpiresAt);
  const lastAuthCheckAt = useAppStore((state) => state.lastAuthCheckAt);
  const revalidateSession = useAppStore((state) => state.revalidateSession);
  const requestReviewQueue = useAppStore((state) => state.requestReviewQueue);
  const requestReviewQueueStatus = useAppStore((state) => state.requestReviewQueueStatus);
  const requestReviewQueueNotice = useAppStore((state) => state.requestReviewQueueNotice);
  const refreshRequestReviewQueue = useAppStore((state) => state.refreshRequestReviewQueue);
  const [crashSummary, setCrashSummary] = useState({
    count: 0,
    lastCrashAt: "",
    latestStage: "",
    latestMessage: "",
  });
  const runtimeConfig = getNativeRuntimeConfig();

  useEffect(() => {
    void getNativeCrashLogSummary().then(setCrashSummary);
    void refreshRequestReviewQueue();
  }, [refreshRequestReviewQueue]);

  const formattedExpiry = sessionExpiresAt
    ? new Date(Number(sessionExpiresAt) * 1000).toLocaleString()
    : "Not set";
  const formattedLastAuthCheck = lastAuthCheckAt
    ? new Date(Number(lastAuthCheckAt)).toLocaleString()
    : "Not checked yet";

  return (
    <Screen scroll>
      <SectionHeader title="Settings" subtitle="Account, sync, and rollout controls." />
      <Card>
        <Text style={styles.groupTitle}>Account</Text>
        <SettingRow label="Sign-in mode" value={authMode === "supabase" ? "Cloud account" : "Local tester"} />
        <SettingRow label="Session source" value={sessionRestoredFrom || "Fresh launch"} />
        <SettingRow label="Session health" value={authHealthStatus || "idle"} />
        <SettingRow label="Session expiry" value={formattedExpiry} />
        <SettingRow label="Last auth check" value={formattedLastAuthCheck} />
        {authHealthNotice ? <Text style={styles.note}>{authHealthNotice}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.groupTitle}>Release</Text>
        <SettingRow label="Environment" value={runtimeConfig.appEnv} />
        <SettingRow label="Channel" value={runtimeConfig.releaseChannel} />
        <SettingRow label="Support" value={runtimeConfig.supportEmail} />
      </Card>

      <Card>
        <Text style={styles.groupTitle}>Sync</Text>
        <SettingRow label="Live rounds" value={liveSyncStatus || "idle"} />
        <Text style={styles.note}>Realtime plus backend reconcile are both active in the native client.</Text>
      </Card>

      <Card>
        <Text style={styles.groupTitle}>Request Queue</Text>
        <SettingRow label="Queue status" value={requestReviewQueueStatus || "idle"} />
        <SettingRow label="Items" value={String(requestReviewQueue.length)} />
        {requestReviewQueueNotice ? <Text style={styles.note}>{requestReviewQueueNotice}</Text> : null}
        {requestReviewQueue.slice(0, 5).map((item) => (
          <View key={item.id} style={styles.queueRow}>
            <View style={styles.queueCopy}>
              <Text style={styles.queueTitle}>{item.courseName || "Course request"}</Text>
              <Text style={styles.queueMeta}>
                {(item.queueType === "tee-time" ? "Tee Time" : "Course Service")}
                {" / "}
                {item.queueLabel || item.requestType || item.desiredWindowLabel || "Request"}
              </Text>
            </View>
            <Text style={styles.queueStatus}>{item.status || "requested"}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.groupTitle}>Crash Logs</Text>
        <SettingRow label="Stored logs" value={String(crashSummary.count || 0)} />
        <SettingRow label="Last crash" value={crashSummary.lastCrashAt || "None"} />
        <SettingRow label="Stage" value={crashSummary.latestStage || "None"} />
        {crashSummary.latestMessage ? <Text style={styles.note}>{crashSummary.latestMessage}</Text> : null}
      </Card>

      <View style={styles.actions}>
        <AppButton
          label="Refresh Session"
          variant="secondary"
          onPress={async () => {
            await revalidateSession();
          }}
        />
        <AppButton
          label="Refresh Request Queue"
          variant="secondary"
          onPress={async () => {
            await refreshRequestReviewQueue();
          }}
        />
        <AppButton
          label="Clear Crash Logs"
          variant="secondary"
          onPress={async () => {
            await clearNativeCrashLogEntries();
            setCrashSummary({
              count: 0,
              lastCrashAt: "",
              latestStage: "",
              latestMessage: "",
            });
          }}
        />
        <AppButton
          label="Back to Profile"
          variant="secondary"
          onPress={() => router.back()}
        />
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
  queueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  queueCopy: {
    flex: 1,
    gap: 2,
  },
  queueTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  queueMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  queueStatus: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  actions: {
    gap: spacing.md,
  },
});
