import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { AppButton } from "../../../src/components/AppButton";
import { Card } from "../../../src/components/Card";
import { Screen } from "../../../src/components/Screen";
import { SectionHeader } from "../../../src/components/SectionHeader";
import { colors, spacing } from "../../../src/theme";
import { useAppStore } from "../../../src/store/useAppStore";

function getLeaderboardEntries(summary) {
  const leaderboard = summary?.leaderboard;
  if (Array.isArray(leaderboard)) {
    return leaderboard;
  }

  if (Array.isArray(leaderboard?.entries)) {
    return leaderboard.entries;
  }

  return [];
}

function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  const round = item.round || {};
  const localParticipant = summary.localParticipant || null;
  const localTotals = summary.localTotals || {};
  const leaderboard = getLeaderboardEntries(summary);
  const holeDetails = Array.isArray(localTotals.holeDetails) ? localTotals.holeDetails : [];
  const roundInsights = Array.isArray(summary.roundInsights) ? summary.roundInsights : [];
  const completedLabel = item.completedAt ? new Date(item.completedAt).toLocaleString() : "Saved locally";

  return (
    <Screen scroll>
      <SectionHeader
        title={item.courseName}
        subtitle={`${completedLabel} / ${item.scoreLabel}`}
      />

      <Card>
        <View style={styles.metricGrid}>
          <Metric label="Result" value={item.scoreLabel} />
          <Metric label="Winner" value={item.winnerLabel || "--"} />
          <Metric label="Holes" value={`${item.holesPlayed}/${item.totalHoles}`} />
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Round Context</Text>
        <InfoRow label="Format" value={summary.roundLabel || round.mode || "Round"} />
        <InfoRow label="Tee" value={round.teeBox || "Default"} />
        <InfoRow label="Course rating" value={round.courseRating ? String(round.courseRating) : "--"} />
        <InfoRow label="Slope" value={round.courseSlope ? String(round.courseSlope) : "--"} />
        <InfoRow label="Location" value={[round.courseCity, round.courseState].filter(Boolean).join(", ") || "Not set"} />
        <InfoRow label="Sync" value={round.syncTransport === "cloud" ? "Live round" : "Solo/local"} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Competitive Read</Text>
        <InfoRow label="Status" value={localParticipant?.displayStatus || "--"} />
        <InfoRow label="Rank" value={localParticipant?.rank ? `#${localParticipant.rank}` : "--"} />
        <InfoRow label="Trend" value={localParticipant?.rankTrendLabel || "--"} />
        {summary.momentum ? (
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{summary.momentum.label}</Text>
            <Text style={styles.calloutCopy}>{summary.momentum.detail}</Text>
          </View>
        ) : null}
        {summary.headToHead ? (
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{summary.headToHead.label}</Text>
            <Text style={styles.calloutCopy}>{summary.headToHead.detail}</Text>
          </View>
        ) : null}
        {summary.sideGame ? (
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{summary.sideGame.label}</Text>
            <Text style={styles.calloutCopy}>{summary.sideGame.detail}</Text>
          </View>
        ) : null}
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

      {roundInsights.length ? (
        <Card>
          <Text style={styles.sectionTitle}>Round Insights</Text>
          <View style={styles.stack}>
            {roundInsights.map((insight) => (
              <Text key={insight} style={styles.featureRow}>{insight}</Text>
            ))}
          </View>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>Scorecard</Text>
        <View style={styles.stack}>
          {holeDetails.map((detail) => {
            const relative = typeof detail.toPar === "number"
              ? detail.toPar === 0
                ? "E"
                : detail.toPar > 0
                  ? `+${detail.toPar}`
                  : String(detail.toPar)
              : "--";
            return (
              <View key={detail.holeNumber} style={styles.scoreRow}>
                <Text style={styles.scoreHole}>Hole {detail.holeNumber}</Text>
                <Text style={styles.scoreMeta}>Par {detail.par}</Text>
                <Text style={styles.scoreMeta}>Score {detail.strokes || "--"}</Text>
                <Text style={styles.scoreMeta}>{relative}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        <View style={styles.stack}>
          {leaderboard.map((entry, index) => (
            <View key={entry.id || entry.participantId || `${entry.name}-${index}`} style={styles.row}>
              <View style={styles.rowCopy}>
                <Text style={styles.rowName}>{index + 1}. {entry.name}</Text>
                <Text style={styles.rowSubcopy}>{entry.rankTrendLabel || entry.subtitle || "Player card"}</Text>
              </View>
              <View style={styles.rowStats}>
                <Text style={styles.rowMeta}>{entry.displayStatus || entry.scoreLabel || "--"}</Text>
                <Text style={styles.rowSubcopy}>
                  {typeof entry.total === "number" ? `${entry.total} total` : entry.scoreLabel || "--"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.actions}>
        <AppButton label="Back to Stats" variant="secondary" onPress={() => router.replace("/stats")} />
        <AppButton label="Go Home" onPress={() => router.replace("/(tabs)/home")} />
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
    backgroundColor: colors.surfaceMuted,
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  callout: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 2,
  },
  calloutTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  calloutCopy: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  scoreHole: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    width: 70,
  },
  scoreMeta: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
    textAlign: "right",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  rowSubcopy: {
    color: colors.textMuted,
    fontSize: 12,
  },
  rowMeta: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  rowStats: {
    alignItems: "flex-end",
    gap: 2,
  },
  featureRow: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  actions: {
    gap: spacing.md,
  },
});
