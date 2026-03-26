import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../src/components/AppButton";
import { Card } from "../src/components/Card";
import { Screen } from "../src/components/Screen";
import { SectionHeader } from "../src/components/SectionHeader";
import {
  clearNativeCrashLogEntries,
  getNativeCrashLogSummary,
} from "../src/services/native-crash-service";
import { colors, spacing } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function TestingScreen() {
  const revalidateSession = useAppStore((state) => state.revalidateSession);
  const refreshRequestReviewQueue = useAppStore((state) => state.refreshRequestReviewQueue);
  const requestReviewQueue = useAppStore((state) => state.requestReviewQueue);
  const requestReviewQueueStatus = useAppStore((state) => state.requestReviewQueueStatus);
  const liveSyncStatus = useAppStore((state) => state.liveSyncStatus);
  const authHealthStatus = useAppStore((state) => state.authHealthStatus);
  const [crashSummary, setCrashSummary] = useState({
    count: 0,
    lastCrashAt: "",
    latestStage: "",
  });

  useEffect(() => {
    void getNativeCrashLogSummary().then(setCrashSummary);
  }, []);

  return (
    <Screen scroll>
      <SectionHeader title="Testing" subtitle="Diagnostics and rollout checks." />

      <Card>
        <Text style={styles.title}>Diagnostics</Text>
        <Row label="Session" value={authHealthStatus || "idle"} />
        <Row label="Live sync" value={liveSyncStatus || "idle"} />
        <Row label="Queue" value={requestReviewQueueStatus || "idle"} />
        <Row label="Queue items" value={String(requestReviewQueue.length)} />
      </Card>

      <Card>
        <Text style={styles.title}>Crash Logs</Text>
        <Row label="Stored logs" value={String(crashSummary.count || 0)} />
        <Row label="Last crash" value={crashSummary.lastCrashAt || "None"} />
        <Row label="Stage" value={crashSummary.latestStage || "None"} />
      </Card>

      <View style={styles.actions}>
        <AppButton label="Refresh Session" variant="secondary" onPress={() => revalidateSession()} />
        <AppButton label="Refresh Request Queue" variant="secondary" onPress={() => refreshRequestReviewQueue()} />
        <AppButton
          label="Clear Crash Logs"
          variant="secondary"
          onPress={async () => {
            await clearNativeCrashLogEntries();
            setCrashSummary({
              count: 0,
              lastCrashAt: "",
              latestStage: "",
            });
          }}
        />
        <AppButton label="Back to Settings" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
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
  actions: {
    gap: spacing.md,
  },
});
