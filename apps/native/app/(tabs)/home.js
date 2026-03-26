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

  return (
    <Screen>
      <SectionHeader title="Home" subtitle="Launch, join, or get back into the round." />
      {activeRound ? (
        <>
          <Card>
            <Text style={styles.eyebrow}>Live Round</Text>
            <Text style={styles.title}>{activeRound.courseName}</Text>
            <Text style={styles.meta}>Hole {activeRound.currentHole} • {activeRound.teeBox}</Text>
            <Text style={styles.status}>
              {liveSyncStatus === "connected" ? "Connected" : liveSyncStatus === "connecting" ? "Connecting" : "Saved on this phone"}
            </Text>
            {liveSyncNotice ? <Text style={styles.notice}>{liveSyncNotice}</Text> : null}
          </Card>
          <View style={styles.actions}>
            <AppButton label="Open Score" onPress={() => router.push("/(tabs)/score")} />
            <AppButton label="Invite" variant="secondary" onPress={() => router.push("/round/lobby")} />
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
    color: colors.success,
    fontSize: 13,
    fontWeight: "700",
  },
  notice: {
    color: colors.textMuted,
    fontSize: 13,
  },
  actions: {
    gap: spacing.md,
  },
});
