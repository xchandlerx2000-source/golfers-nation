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
      <SectionHeader title="Home" subtitle="Fast launch, live status, and the next action without clutter." />
      {activeRound ? (
        <>
          <Card style={styles.heroCard}>
            <View style={styles.badgeRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Live Round</Text>
              </View>
              <View style={[styles.syncBadge, syncToneStyle]}>
                <Text style={styles.syncBadgeText}>{syncLabel}</Text>
              </View>
            </View>
            <Text style={styles.title}>{activeRound.courseName}</Text>
            <Text style={styles.meta}>Hole {activeRound.currentHole} / {activeRound.teeBox}</Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Room</Text>
                <Text style={styles.heroStatValue}>{activeRound.inviteCode || "Local"}</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Players</Text>
                <Text style={styles.heroStatValue}>{activeRound.players.length}</Text>
              </View>
            </View>
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
        <Card style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Launch Pad</Text>
            </View>
          </View>
          <Text style={styles.title}>Ready when the group is.</Text>
          <Text style={styles.meta}>Start a round fast, or jump straight into a live game with a code.</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Flow</Text>
              <Text style={styles.heroStatValue}>Course / Format / Play</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Nearby</Text>
              <Text style={styles.heroStatValue}>Phone location ready</Text>
            </View>
          </View>
        </Card>
      )}

      {!activeRound ? (
        <View style={styles.actions}>
          <AppButton label="Start Round" onPress={() => router.push("/round/setup")} />
          <AppButton label="Join Game" variant="secondary" onPress={() => router.push("/round/join")} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
  },
  meta: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  statusBadgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  syncBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  syncBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statusConnected: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderColor: "rgba(34,197,94,0.45)",
  },
  statusWarning: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderColor: "rgba(245,158,11,0.45)",
  },
  statusMuted: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.border,
  },
  notice: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  heroStats: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  heroStat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  heroStatLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroStatValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  actions: {
    gap: spacing.md,
  },
});
