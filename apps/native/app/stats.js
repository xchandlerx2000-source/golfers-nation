import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../src/components/AppButton";
import { Card } from "../src/components/Card";
import { Screen } from "../src/components/Screen";
import { SectionHeader } from "../src/components/SectionHeader";
import { buildFrequentPartners } from "../src/lib/round-history";
import { colors, spacing } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";

function MetricCard({ label, value, detail }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {detail ? <Text style={styles.metricDetail}>{detail}</Text> : null}
    </View>
  );
}

export default function StatsScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const completedRounds = useAppStore((state) => state.completedRounds);
  const stats = useAppStore((state) => state.getCompletedRoundStats());
  const roundSummaries = useAppStore((state) => state.getCompletedRoundSummaries());
  const partners = buildFrequentPartners(completedRounds, currentUser?.id || "");
  const latestRound = roundSummaries[0] || null;

  return (
    <Screen scroll>
      <SectionHeader title="Stats" subtitle="History, recent form, and archived rounds." />
      <Card>
        <View style={styles.metricGrid}>
          <MetricCard label="Rounds" value={String(stats.roundsPlayed || 0)} detail="Completed cards" />
          <MetricCard label="Average" value={stats.averageScore ? String(stats.averageScore) : "--"} detail="Scoring average" />
          <MetricCard label="Best" value={stats.bestRound ? String(stats.bestRound) : "--"} detail="Lowest card" />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Latest Round</Text>
        {latestRound ? (
          <View style={styles.stack}>
            <Text style={styles.name}>{latestRound.courseName}</Text>
            <Text style={styles.meta}>
              {new Date(latestRound.completedAt).toLocaleDateString()} / {latestRound.scoreLabel} / {latestRound.holesPlayed} holes
            </Text>
            <Text style={styles.copy}>Winner: {latestRound.winnerLabel}</Text>
            <AppButton label="Open Summary" variant="secondary" onPress={() => router.push(`/round/summary/${latestRound.id}`)} />
          </View>
        ) : (
          <Text style={styles.empty}>Finish a round on the phone app and your archive will start filling in here.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Playing Partners</Text>
        {partners.length ? (
          <View style={styles.list}>
            {partners.map((partner) => (
              <View key={partner.id} style={styles.row}>
                <View style={styles.copyBlock}>
                  <Text style={styles.name}>{partner.name}</Text>
                  <Text style={styles.meta}>{partner.rounds} rounds together</Text>
                </View>
                <Text style={styles.sideValue}>{new Date(partner.latest).toLocaleDateString()}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Partner trends will show up after shared completed rounds.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Round Archive</Text>
        {roundSummaries.length ? (
          <View style={styles.list}>
            {roundSummaries.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.copyBlock}>
                  <Text style={styles.name}>{item.courseName}</Text>
                  <Text style={styles.meta}>
                    {new Date(item.completedAt).toLocaleDateString()} / {item.holesPlayed}/{item.totalHoles} holes
                  </Text>
                </View>
                <View style={styles.archiveActions}>
                  <Text style={styles.score}>{item.scoreLabel}</Text>
                  <AppButton label="View" variant="secondary" onPress={() => router.push(`/round/summary/${item.id}`)} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Your round archive builds automatically from finished rounds.</Text>
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
  metricDetail: {
    color: colors.textMuted,
    fontSize: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  stack: {
    gap: spacing.sm,
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
  copyBlock: {
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
  copy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  sideValue: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  archiveActions: {
    alignItems: "flex-end",
    gap: spacing.xs,
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
