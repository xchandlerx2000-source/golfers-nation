import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { Screen } from "../../src/components/Screen";
import { SectionHeader } from "../../src/components/SectionHeader";
import { colors, spacing } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

export default function FinishedRoundScreen() {
  const summary = useAppStore((state) => state.getRoundSummary());
  const finishRound = useAppStore((state) => state.finishRound);

  if (!summary) {
    router.replace("/(tabs)/home");
    return null;
  }

  return (
    <Screen scroll>
      <SectionHeader title="Finished Round" subtitle="Clubhouse view." />
      <Card>
        <Text style={styles.eyebrow}>Winner</Text>
        <Text style={styles.winner}>{summary.winnerLabel || "Pending"}</Text>
        <Text style={styles.meta}>
          {summary.roundLabel || "Round complete"} / {summary.holesPlayed}/{summary.totalHoles} holes scored
        </Text>
      </Card>
      <Card>
        <Text style={styles.title}>Standings</Text>
        {(summary.leaderboard?.entries || summary.leaderboard || []).map((entry, index) => (
          <View key={entry.participantId || entry.id || `${entry.name}-${index}`} style={styles.row}>
            <Text style={styles.name}>{index + 1}. {entry.name}</Text>
            <Text style={styles.score}>{entry.scoreLabel || entry.displayStatus || entry.totalLabel || "--"}</Text>
          </View>
        ))}
      </Card>
      {summary.momentum ? (
        <Card>
          <Text style={styles.title}>{summary.momentum.label}</Text>
          <Text style={styles.meta}>{summary.momentum.detail}</Text>
        </Card>
      ) : null}
      <View style={styles.actions}>
        <AppButton label="Review Scores" variant="secondary" onPress={() => router.replace("/(tabs)/score")} />
        <AppButton
          label="Finish Round"
          onPress={async () => {
            const completedRound = await finishRound();
            if (completedRound?.id) {
              router.replace(`/round/summary/${completedRound.id}`);
              return;
            }
            router.replace("/(tabs)/home");
          }}
        />
      </View>
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
  winner: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
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
  name: {
    color: colors.text,
    fontSize: 15,
  },
  score: {
    color: colors.primary,
    fontWeight: "700",
  },
  actions: {
    gap: spacing.md,
  },
});
