import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { APP_VERSION } from "@golfers-nation/core";
import { AppButton } from "../src/components/AppButton";
import { Card } from "../src/components/Card";
import { Screen } from "../src/components/Screen";
import { SectionHeader } from "../src/components/SectionHeader";
import { getNativeRuntimeConfig } from "../src/lib/runtime-config";
import {
  clearNativeCrashLogEntries,
  getNativeCrashLogSummary,
} from "../src/services/native-crash-service";
import { spacing, useAppTheme } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";

function Row({ label, value }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function TestingScreen() {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const runtimeConfig = getNativeRuntimeConfig();
  const revalidateSession = useAppStore((state) => state.revalidateSession);
  const refreshRequestReviewQueue = useAppStore((state) => state.refreshRequestReviewQueue);
  const requestReviewQueue = useAppStore((state) => state.requestReviewQueue);
  const requestReviewQueueStatus = useAppStore((state) => state.requestReviewQueueStatus);
  const requestReviewQueueNotice = useAppStore((state) => state.requestReviewQueueNotice);
  const liveSyncStatus = useAppStore((state) => state.liveSyncStatus);
  const liveSyncNotice = useAppStore((state) => state.liveSyncNotice);
  const authHealthStatus = useAppStore((state) => state.authHealthStatus);
  const authHealthNotice = useAppStore((state) => state.authHealthNotice);
  const sessionExpiresAt = useAppStore((state) => state.sessionExpiresAt);
  const lastAuthCheckAt = useAppStore((state) => state.lastAuthCheckAt);
  const nearbyLocation = useAppStore((state) => state.nearbyLocation);
  const nearbyLocationStatus = useAppStore((state) => state.nearbyLocationStatus);
  const nearbyLocationSource = useAppStore((state) => state.nearbyLocationSource);
  const nearbyLocationNotice = useAppStore((state) => state.nearbyLocationNotice);
  const refreshNearbyCoursesFromLocation = useAppStore((state) => state.refreshNearbyCoursesFromLocation);
  const courseResultsSource = useAppStore((state) => state.courseResultsSource);
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
        <Text style={styles.title}>Build</Text>
        <Row label="App version" value={APP_VERSION} />
        <Row label="Environment" value={runtimeConfig.appEnv} />
        <Row label="Channel" value={runtimeConfig.releaseChannel} />
        <Row label="Course source" value={courseResultsSource || "starter"} />
      </Card>

      <Card>
        <Text style={styles.title}>Session</Text>
        <Row label="Session health" value={authHealthStatus || "idle"} />
        <Row label="Live sync" value={liveSyncStatus || "idle"} />
        <Row label="Queue" value={requestReviewQueueStatus || "idle"} />
        <Row label="Queue items" value={String(requestReviewQueue.length)} />
        <Row label="Session expiry" value={sessionExpiresAt ? new Date(sessionExpiresAt).toLocaleString() : "Not set"} />
        <Row label="Last auth check" value={lastAuthCheckAt ? new Date(lastAuthCheckAt).toLocaleString() : "Not checked"} />
        {authHealthNotice ? <Text style={styles.notice}>{authHealthNotice}</Text> : null}
        {liveSyncNotice ? <Text style={styles.notice}>{liveSyncNotice}</Text> : null}
        {requestReviewQueueNotice ? <Text style={styles.notice}>{requestReviewQueueNotice}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.title}>Location</Text>
        <Row label="Status" value={nearbyLocationStatus || "idle"} />
        <Row label="Source" value={nearbyLocationSource || "none"} />
        <Row
          label="Coordinates"
          value={nearbyLocation
            ? `${nearbyLocation.latitude.toFixed(4)}, ${nearbyLocation.longitude.toFixed(4)}`
            : "Not saved"}
        />
        {nearbyLocationNotice ? <Text style={styles.notice}>{nearbyLocationNotice}</Text> : null}
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
          label="Refresh Nearby From Phone"
          variant="secondary"
          onPress={() => {
            void refreshNearbyCoursesFromLocation({ requestPermission: true });
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
            });
          }}
        />
        <AppButton label="Open Support" variant="secondary" onPress={() => router.push("/support")} />
        <AppButton label="Back to Settings" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  value: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  notice: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    gap: spacing.md,
  },
});
