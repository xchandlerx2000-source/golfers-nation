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

  if (!activeRound) {
    router.replace("/(tabs)/home");
    return null;
  }

  return (
    <Screen>
      <SectionHeader title="Live Round" subtitle="Your round is live." />
      <LiveStrip
        live
        connected={liveSyncStatus === "connected"}
        players={activeRound.players.length}
        format={GAME_MODES[activeRound.mode]?.label || "Strokes"}
      />
      <Card>
        <Text style={styles.course}>{activeRound.courseName}</Text>
        <Text style={styles.meta}>{activeRound.teeBox} • Hole {activeRound.currentHole}</Text>
        <Text style={styles.code}>Code {activeRound.inviteCode || "GN18"}</Text>
        <Text style={styles.status}>
          {liveSyncStatus === "connected" ? "Connected" : liveSyncStatus === "connecting" ? "Connecting" : "Saved on this phone"}
        </Text>
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
    color: colors.success,
    fontWeight: "700",
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
