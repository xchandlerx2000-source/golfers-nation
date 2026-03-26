import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { Screen } from "../../src/components/Screen";
import { SectionHeader } from "../../src/components/SectionHeader";
import { colors, spacing } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

export default function HomeScreen() {
  const activeRound = useAppStore((state) => state.activeRound);
  const liveSyncStatus = useAppStore((state) => state.liveSyncStatus);
  const liveSyncNotice = useAppStore((state) => state.liveSyncNotice);
  const lastLiveSyncAt = useAppStore((state) => state.lastLiveSyncAt);
  const refreshLiveRound = useAppStore((state) => state.refreshLiveRound);

  const syncLabel = liveSyncStatus === "connected"
    ? "Connected"
    : liveSyncStatus === "connecting"
      ? "Connecting"
      : liveSyncStatus === "retry-needed"
        ? "Retry needed"
        : "Saved on this phone";
  const syncToneStyle = liveSyncStatus === "connected"
    ? styles.statusConnected
    : liveSyncStatus === "retry-needed"
      ? styles.statusWarning
      : styles.statusMuted;

  return (
    <Screen>
      <SectionHeader title="Home" subtitle="Launch, join, or get back into the round." />
      {activeRound ? (
        <>
          <Card>
            <Text style={styles.eyebrow}>Live Round</Text>
            <Text style={styles.title}>{activeRound.courseName}</Text>
            <Text style={styles.meta}>Hole {activeRound.currentHole} | {activeRound.teeBox}</Text>
            <Text style={[styles.status, syncToneStyle]}>{syncLabel}</Text>
            <Text style={styles.notice}>Invite code {activeRound.inviteCode || "Local round"}</Text>
            {lastLiveSyncAt ? <Text style={styles.notice}>Last sync {new Date(lastLiveSyncAt).toLocaleTimeString()}</Text> : null}
            {liveSyncNotice ? <Text style={styles.notice}>{liveSyncNotice}</Text> : null}
          </Card>
          <View style={styles.actions}>
            <AppButton label="Open Score" onPress={() => router.push("/(tabs)/score")} />
            <AppButton label="Invite" variant="secondary" onPress={() => router.push("/round/lobby")} />
            {activeRound.inviteCode ? (
              <AppButton
                label="Refresh Live Round"
                variant="secondary"
                onPress={() => {
                  void refreshLiveRound(true);
                }}
              />
            ) : null}
          </View>
        </>
      ) : (
        <View style={styles.actions}>
          <AppButton label="Start Round" onPress={() => router.push("/round/setup")} />
          <AppButton label="Join Game" variant="secondary" onPress={() => router.push("/round/join")} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  status: {
    fontSize: 13,
    fontWeight: "700",
  },
  statusConnected: {
    color: colors.success,
  },
  statusWarning: {
    color: colors.warning,
  },
  statusMuted: {
    color: colors.textMuted,
  },
  notice: {
    color: colors.textMuted,
    fontSize: 13,
  },
  actions: {
    gap: spacing.md,
  },
});
