import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { AppButton } from "../../../src/components/AppButton";
import { Card } from "../../../src/components/Card";
import { Screen } from "../../../src/components/Screen";
import { SectionHeader } from "../../../src/components/SectionHeader";
import { colors, spacing } from "../../../src/theme";
import { useAppStore } from "../../../src/store/useAppStore";

function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export default function RoundSummaryScreen() {
  const { roundId } = useLocalSearchParams();
  const summaries = useAppStore((state) => state.getCompletedRoundSummaries());
  const item = summaries.find((entry) => entry.id === String(roundId || "")) || null;

  if (!item) {
    return (
      <Screen>
        <SectionHeader title="Round Summary" subtitle="Round not found." />
        <AppButton label="Back" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const summary = item.summary || {};
  const localTotals = summary.localTotals || {};
  const leaderboard = summary.leaderboard || [];

  return (
    <Screen scroll>
      <SectionHeader title={item.courseName} subtitle={`${new Date(item.completedAt).toLocaleDateString()} / ${item.scoreLabel}`} />

      <Card>
        <View style={styles.metricGrid}>
          <Metric label="Result" value={item.scoreLabel} />
          <Metric label="Winner" value={item.winnerLabel || "--"} />
          <Metric label="Holes" value={`${item.holesPlayed}/${item.totalHoles}`} />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Card Stats</Text>
        <View style={styles.stack}>
          <Metric label="Fairways" value={`${localTotals.fairwaysHit || 0}/${localTotals.fairwayOpportunities || 0}`} />
          <Metric label="GIR" value={`${localTotals.greensHit || 0}/${localTotals.girOpportunities || 0}`} />
          <Metric label="Putts" value={localTotals.averagePutts ? localTotals.averagePutts.toFixed(1) : "--"} />
          <Metric label="Penalties" value={String(localTotals.totalPenalties || 0)} />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        <View style={styles.stack}>
          {leaderboard.map((entry, index) => (
            <View key={entry.id || entry.participantId || `${entry.name}-${index}`} style={styles.row}>
              <Text style={styles.rowName}>{index + 1}. {entry.name}</Text>
              <Text style={styles.rowMeta}>{entry.displayStatus || entry.scoreLabel || "--"}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.actions}>
        <AppButton label="Back to Stats" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    gap: 4,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  metricValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  stack: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  actions: {
    gap: spacing.md,
  },
});
