import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { GAME_MODES } from "@golfers-nation/core";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { LiveStrip } from "../../src/components/LiveStrip";
import { Screen } from "../../src/components/Screen";
import { SectionHeader } from "../../src/components/SectionHeader";
import { colors, spacing } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

export default function RoundLobbyScreen() {
  const activeRound = useAppStore((state) => state.activeRound);
  const leaveRound = useAppStore((state) => state.leaveRound);
  const liveSyncStatus = useAppStore((state) => state.liveSyncStatus);
  const liveSyncNotice = useAppStore((state) => state.liveSyncNotice);
  const lastLiveSyncAt = useAppStore((state) => state.lastLiveSyncAt);
  const refreshLiveRound = useAppStore((state) => state.refreshLiveRound);

  if (!activeRound) {
    router.replace("/(tabs)/home");
    return null;
  }

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
      <SectionHeader title="Live Round" subtitle="Your round is live." />
      <LiveStrip
        live
        connected={liveSyncStatus === "connected"}
        players={activeRound.players.length}
        format={GAME_MODES[activeRound.mode]?.label || "Strokes"}
        statusLabel={syncLabel}
      />
      <Card>
        <Text style={styles.course}>{activeRound.courseName}</Text>
        <Text style={styles.meta}>{activeRound.teeBox} | Hole {activeRound.currentHole}</Text>
        <Text style={styles.code}>Code {activeRound.inviteCode || "GN18"}</Text>
        <Text style={[styles.status, syncToneStyle]}>{syncLabel}</Text>
        {lastLiveSyncAt ? <Text style={styles.notice}>Last sync {new Date(lastLiveSyncAt).toLocaleTimeString()}</Text> : null}
        {liveSyncNotice ? <Text style={styles.notice}>{liveSyncNotice}</Text> : null}
      </Card>
      <Card>
        <Text style={styles.groupTitle}>Players</Text>
        {activeRound.players.map((player) => (
          <View key={player.id} style={styles.playerRow}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerMeta}>{player.role}</Text>
          </View>
        ))}
      </Card>
      <AppButton label="Start Scoring" onPress={() => router.replace("/(tabs)/score")} />
      <AppButton
        label="Refresh Live Round"
        variant="secondary"
        onPress={() => {
          void refreshLiveRound(true);
        }}
      />
      <AppButton
        label="Leave Round"
        variant="secondary"
        onPress={() => {
          leaveRound();
          router.replace("/(tabs)/home");
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  course: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  code: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 18,
  },
  status: {
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
  groupTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  playerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  playerName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  playerMeta: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: "capitalize",
  },
});
