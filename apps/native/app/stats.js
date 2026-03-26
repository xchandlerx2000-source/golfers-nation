import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../src/components/AppButton";
import { Card } from "../src/components/Card";
import { Screen } from "../src/components/Screen";
import { SectionHeader } from "../src/components/SectionHeader";
import { colors, spacing } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";

function MetricCard({ label, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const stats = useAppStore((state) => state.getCompletedRoundStats());

  return (
    <Screen scroll>
      <SectionHeader title="Stats" subtitle="Round history and scoring trend." />
      <Card>
        <View style={styles.metricGrid}>
          <MetricCard label="Rounds" value={String(stats.roundsPlayed || 0)} />
          <MetricCard label="Average" value={stats.averageScore ? String(stats.averageScore) : "--"} />
          <MetricCard label="Best" value={stats.bestRound ? String(stats.bestRound) : "--"} />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Recent Rounds</Text>
        {stats.recentRounds.length ? (
          <View style={styles.list}>
            {stats.recentRounds.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.copy}>
                  <Text style={styles.name}>{item.courseName}</Text>
                  <Text style={styles.meta}>
                    {new Date(item.completedAt).toLocaleDateString()} / {item.holesPlayed}/{item.totalHoles} holes
                  </Text>
                </View>
                <Text style={styles.score}>{item.scoreLabel}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Finish a round on the phone app and your history will show here.</Text>
        )}
      </Card>

      <View style={styles.actions}>
        <AppButton label="Back to Profile" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: 4,
    backgroundColor: colors.surfaceRaised,
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
    fontSize: 24,
    fontWeight: "800",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  list: {
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
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  score: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.md,
  },
});
