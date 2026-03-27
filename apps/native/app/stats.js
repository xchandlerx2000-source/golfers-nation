import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../src/components/AppButton";
import { Card } from "../src/components/Card";
import { Screen } from "../src/components/Screen";
import { SectionHeader } from "../src/components/SectionHeader";
import { buildFrequentPartners } from "../src/lib/round-history";
import { spacing, useAppTheme } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";

function MetricCard({ label, value, detail }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {detail ? <Text style={styles.metricDetail}>{detail}</Text> : null}
    </View>
  );
}

export default function StatsScreen() {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const currentUser = useAppStore((state) => state.currentUser);
  const completedRounds = useAppStore((state) => state.completedRounds);
  const stats = useAppStore((state) => state.getCompletedRoundStats());
  const roundSummaries = useAppStore((state) => state.getCompletedRoundSummaries());
  const partners = buildFrequentPartners(completedRounds, currentUser?.id || "");
  const latestRound = roundSummaries[0] || null;
  const latestSummary = latestRound?.summary || {};
  const latestTotals = latestSummary.localTotals || {};
  const latestInsights = Array.isArray(latestSummary.roundInsights) ? latestSummary.roundInsights.slice(0, 3) : [];

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
            <View style={styles.metricGrid}>
              <MetricCard
                label="Fairways"
                value={`${latestTotals.fairwaysHit || 0}/${latestTotals.fairwayOpportunities || 0}`}
                detail="In play off the tee"
              />
              <MetricCard
                label="GIR"
                value={`${latestTotals.greensHit || 0}/${latestTotals.girOpportunities || 0}`}
                detail="Reached in regulation"
              />
              <MetricCard
                label="Putts"
                value={latestTotals.averagePutts ? latestTotals.averagePutts.toFixed(1) : "--"}
                detail="Average putts"
              />
            </View>
            {latestInsights.length ? (
              <View style={styles.stack}>
                {latestInsights.map((insight) => (
                  <Text key={insight} style={styles.featureRow}>{insight}</Text>
                ))}
              </View>
            ) : null}
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

      <Card>
        <Text style={styles.sectionTitle}>Help and Support</Text>
        <Text style={styles.copy}>Use help for quick answers and support for tester feedback or rollout issues.</Text>
        <View style={styles.actions}>
          <AppButton label="Open Help" variant="secondary" onPress={() => router.push("/help")} />
          <AppButton label="Open Support" variant="secondary" onPress={() => router.push("/support")} />
        </View>
      </Card>

      <View style={styles.actions}>
        <AppButton label="Back to Profile" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  metricGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: 4,
    backgroundColor: theme.colors.surfaceRaised,
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  metricDetail: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  sectionTitle: {
    color: theme.colors.text,
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
    borderTopColor: theme.colors.border,
  },
  copyBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  copy: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  sideValue: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  archiveActions: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  score: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  empty: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  featureRow: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: theme.colors.surfaceMuted,
  },
  actions: {
    gap: spacing.md,
  },
});
