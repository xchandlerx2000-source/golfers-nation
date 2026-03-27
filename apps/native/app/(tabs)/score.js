import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import {
  formatCourseRequestTypeLabel,
  GAME_MODES,
  getCourseServiceRequestStatusLabel,
  getLatestCourseServiceRequest,
} from "@golfers-nation/core";
import { getCourseOnCourseServiceAccess } from "@golfers-nation/course";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { LiveStrip } from "../../src/components/LiveStrip";
import { Screen } from "../../src/components/Screen";
import { SectionHeader } from "../../src/components/SectionHeader";
import { colors, spacing } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

function CollapsibleSection({ title, summary, open, onToggle, children, danger = false }) {
  return (
    <Card>
      <Pressable onPress={onToggle} style={styles.sectionToggle}>
        <View style={styles.sectionToggleText}>
          <Text style={[styles.sectionTitle, danger ? styles.sectionTitleDanger : null]}>{title}</Text>
          <Text style={styles.sectionSummary}>{summary}</Text>
        </View>
        <Text style={styles.sectionChevron}>{open ? "-" : "+"}</Text>
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </Card>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function ScoreScreen() {
  const activeRound = useAppStore((state) => state.activeRound);
  const submitHoleScore = useAppStore((state) => state.submitHoleScore);
  const goToPreviousHole = useAppStore((state) => state.goToPreviousHole);
  const leaveRound = useAppStore((state) => state.leaveRound);
  const getRoundSummary = useAppStore((state) => state.getRoundSummary);
  const courseServiceRequests = useAppStore((state) => state.courseServiceRequests);
  const createActiveRoundCourseServiceRequest = useAppStore((state) => state.createActiveRoundCourseServiceRequest);
  const liveSyncStatus = useAppStore((state) => state.liveSyncStatus);
  const liveSyncNotice = useAppStore((state) => state.liveSyncNotice);
  const lastLiveSyncAt = useAppStore((state) => state.lastLiveSyncAt);
  const refreshLiveRound = useAppStore((state) => state.refreshLiveRound);
  const [score, setScore] = useState(4);
  const [openSection, setOpenSection] = useState("");

  const summary = getRoundSummary();
  const currentHole = useMemo(() => {
    if (!activeRound) {
      return null;
    }

    return activeRound.holes.find((hole) => hole.number === activeRound.currentHole) || activeRound.holes[0];
  }, [activeRound]);
  const courseServiceAccess = useMemo(() => getCourseOnCourseServiceAccess({
    id: activeRound?.courseId,
    displayName: activeRound?.courseName,
    metadata: activeRound?.courseMetadata || {},
  }), [activeRound?.courseId, activeRound?.courseName, activeRound?.courseMetadata]);

  useEffect(() => {
    if (!currentHole) {
      return;
    }

    const ownerEntry = currentHole.entries?.[0];
    setScore(Number(ownerEntry?.strokes) > 0 ? Number(ownerEntry.strokes) : Math.max(1, currentHole.par || 4));
  }, [currentHole?.number, currentHole?.entries, currentHole?.par]);

  if (!activeRound || !currentHole) {
    return (
      <Screen>
        <SectionHeader title="Score" subtitle="No round in progress." />
        <AppButton label="Start Round" onPress={() => router.push("/round/setup")} />
      </Screen>
    );
  }

  const localParticipant = summary?.localParticipant;
  const scoreSummary = localParticipant?.displayStatus || "NS";
  const playersSummary = `${activeRound.players.length} golfers`;
  const leaderboardSummary = summary?.leaderboard?.[0]?.name
    ? `${summary.leaderboard[0].name} leads`
    : "Waiting on scores";
  const finishSummary = activeRound.inviteCode ? "Leave or finish this round" : "Finish or end this round";
  const latestServiceRequests = (courseServiceAccess?.requestTypes || [])
    .map((requestType) => ({
      requestType,
      latest: getLatestCourseServiceRequest(courseServiceRequests, activeRound.courseId, requestType),
    }));
  const scorecardRows = activeRound.holes
    .map((hole) => {
      const ownerEntry = hole.entries?.[0];
      return {
        number: hole.number,
        par: hole.par,
        strokes: Number(ownerEntry?.strokes) > 0 ? Number(ownerEntry.strokes) : null,
      };
    })
    .filter((hole) => hole.strokes !== null)
    .slice(-9);
  const roundDetailsSummary = activeRound.teeBox || activeRound.weather || "Round details";
  const connectionSummary = activeRound.inviteCode
    ? `${activeRound.inviteCode} | ${liveSyncStatus === "connected" ? "Connected" : liveSyncStatus === "connecting" ? "Connecting" : liveSyncStatus === "retry-needed" ? "Retry needed" : "Saved on this phone"}`
    : "This round stays on this phone";

  return (
    <Screen scroll>
      <SectionHeader title="Score" subtitle={activeRound.courseName} />
      <LiveStrip
        live={Boolean(activeRound.inviteCode)}
        connected={liveSyncStatus === "connected"}
        players={activeRound.players.length}
        format={GAME_MODES[activeRound.mode]?.label || "Strokes"}
        statusLabel={liveSyncStatus === "connected" ? "Connected" : liveSyncStatus === "connecting" ? "Connecting" : "Saved on this phone"}
      />
      {liveSyncNotice ? <Text style={styles.notice}>{liveSyncNotice}</Text> : null}

      <Card>
        <View style={styles.holeHeader}>
          <View>
            <Text style={styles.holeLabel}>Hole {currentHole.number}</Text>
            <Text style={styles.meta}>Par {currentHole.par} / {currentHole.yards} yds</Text>
          </View>
          <View style={styles.scoreMeta}>
            <Text style={styles.scoreMetaLabel}>Card</Text>
            <Text style={styles.scoreMetaValue}>{scoreSummary}</Text>
          </View>
        </View>
        <View style={styles.scoreRow}>
          <AppButton label="Prev" variant="secondary" onPress={goToPreviousHole} />
          <View style={styles.scorePad}>
            <Text style={styles.scoreValue}>{score}</Text>
            <View style={styles.scoreAdjust}>
              <AppButton label="-1" variant="secondary" onPress={() => setScore((value) => Math.max(1, value - 1))} />
              <AppButton label="+1" variant="secondary" onPress={() => setScore((value) => value + 1)} />
            </View>
          </View>
        </View>
        <AppButton
          label="Next Hole"
          onPress={() => {
            const result = submitHoleScore(score);
            if (result.finished) {
              router.replace("/round/finished");
            }
          }}
        />
      </Card>

      <CollapsibleSection
        title="Stats"
        summary={summary?.momentum?.label || "Round pulse"}
        open={openSection === "stats"}
        onToggle={() => setOpenSection((value) => (value === "stats" ? "" : "stats"))}
      >
        <Text style={styles.sectionCopy}>{summary?.momentum?.detail || "Momentum builds after a few holes."}</Text>
        <Text style={styles.sectionCopy}>Putts {summary?.averagePutts ?? "--"} / Holes played {summary?.holesPlayed ?? 0}</Text>
      </CollapsibleSection>

      <CollapsibleSection
        title="Scorecard"
        summary={scorecardRows.length ? `${scorecardRows.length} scored holes` : "Waiting on the first score"}
        open={openSection === "scorecard"}
        onToggle={() => setOpenSection((value) => (value === "scorecard" ? "" : "scorecard"))}
      >
        {scorecardRows.length ? (
          scorecardRows.map((hole) => (
            <View key={hole.number} style={styles.listRow}>
              <Text style={styles.listName}>Hole {hole.number}</Text>
              <Text style={styles.listMeta}>Par {hole.par} / Score {hole.strokes}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.sectionCopy}>Scores start showing here as soon as the card is underway.</Text>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Connection"
        summary={connectionSummary}
        open={openSection === "connection"}
        onToggle={() => setOpenSection((value) => (value === "connection" ? "" : "connection"))}
      >
        <DetailRow label="Room" value={activeRound.inviteCode || "Local round"} />
        <DetailRow label="Sync" value={activeRound.sync?.label || "Offline-first"} />
        <DetailRow label="Status" value={liveSyncStatus === "connected" ? "Connected" : liveSyncStatus === "connecting" ? "Connecting" : liveSyncStatus === "retry-needed" ? "Retry needed" : "Saved on this phone"} />
        <DetailRow label="Last sync" value={lastLiveSyncAt ? new Date(lastLiveSyncAt).toLocaleTimeString() : "--"} />
        {liveSyncNotice ? <Text style={styles.sectionCopy}>{liveSyncNotice}</Text> : null}
        {activeRound.inviteCode ? (
          <>
            <AppButton
              label="Refresh Live Round"
              variant="secondary"
              onPress={() => {
                void refreshLiveRound(true);
              }}
            />
            <AppButton label="Open Lobby" variant="secondary" onPress={() => router.push("/round/lobby")} />
          </>
        ) : (
          <Text style={styles.sectionCopy}>This round is stored locally until you start a live room.</Text>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Players"
        summary={playersSummary}
        open={openSection === "players"}
        onToggle={() => setOpenSection((value) => (value === "players" ? "" : "players"))}
      >
        {activeRound.players.map((player) => (
          <View key={player.id} style={styles.listRow}>
            <Text style={styles.listName}>{player.name}</Text>
            <Text style={styles.listMeta}>{player.role}</Text>
          </View>
        ))}
      </CollapsibleSection>

      <CollapsibleSection
        title="Round Details"
        summary={roundDetailsSummary}
        open={openSection === "details"}
        onToggle={() => setOpenSection((value) => (value === "details" ? "" : "details"))}
      >
        <DetailRow label="Course" value={activeRound.courseName} />
        <DetailRow label="Tee" value={activeRound.teeBox || "--"} />
        <DetailRow label="Weather" value={activeRound.weather || "--"} />
        <DetailRow label="Rating" value={activeRound.courseRating ? String(activeRound.courseRating) : "--"} />
        <DetailRow label="Slope" value={activeRound.courseSlope ? String(activeRound.courseSlope) : "--"} />
        <DetailRow label="Invite code" value={activeRound.inviteCode || "Local round"} />
        <DetailRow label="Sync" value={activeRound.sync?.label || "Offline-first"} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Leaderboard"
        summary={leaderboardSummary}
        open={openSection === "leaderboard"}
        onToggle={() => setOpenSection((value) => (value === "leaderboard" ? "" : "leaderboard"))}
      >
        {(summary?.leaderboard || []).map((entry, index) => (
          <View key={entry.id || entry.participantId || `${entry.name}-${index}`} style={styles.listRow}>
            <Text style={styles.listName}>{index + 1}. {entry.name}</Text>
            <Text style={styles.listMeta}>{entry.displayStatus || entry.scoreLabel || "--"}</Text>
          </View>
        ))}
      </CollapsibleSection>

      <CollapsibleSection
        title="Course Services"
        summary={courseServiceAccess?.enabled ? "Request support without leaving the card" : "Not available on this course"}
        open={openSection === "services"}
        onToggle={() => setOpenSection((value) => (value === "services" ? "" : "services"))}
      >
        {courseServiceAccess?.enabled ? (
          <>
            <Text style={styles.sectionCopy}>{courseServiceAccess.notes || "Supported requests are saved locally until partner dispatch is wired live."}</Text>
            {(courseServiceAccess.requestTypes || []).map((requestType) => {
              const latestRequest = latestServiceRequests.find((entry) => entry.requestType === requestType)?.latest || null;
              const label = formatCourseRequestTypeLabel(requestType);
              return (
                <View key={requestType} style={styles.serviceRow}>
                  <View style={styles.serviceCopy}>
                    <Text style={styles.listName}>{label}</Text>
                    <Text style={styles.listMeta}>
                      {latestRequest
                        ? `${getCourseServiceRequestStatusLabel(latestRequest.status)} / ${label}`
                        : "Save a local request"}
                    </Text>
                  </View>
                  <AppButton
                    label={latestRequest ? "Saved" : "Request"}
                    variant="secondary"
                    disabled={Boolean(latestRequest && ["requested", "accepted", "fulfilled"].includes(latestRequest.status))}
                    onPress={async () => {
                      await createActiveRoundCourseServiceRequest(requestType);
                    }}
                  />
                </View>
              );
            })}
          </>
        ) : (
          <Text style={styles.sectionCopy}>This course does not expose on-course request support yet.</Text>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Finish Round"
        summary={finishSummary}
        open={openSection === "finish"}
        onToggle={() => setOpenSection((value) => (value === "finish" ? "" : "finish"))}
        danger
      >
        <AppButton label="Finish Round" onPress={() => router.replace("/round/finished")} />
        <AppButton
          label={activeRound.inviteCode ? "Leave Round" : "End Round"}
          variant="secondary"
          onPress={() => {
            leaveRound();
            router.replace("/(tabs)/home");
          }}
        />
      </CollapsibleSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: {
    color: colors.textMuted,
    fontSize: 13,
  },
  holeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  holeLabel: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  scoreMeta: {
    alignItems: "flex-end",
    gap: 2,
  },
  scoreMetaLabel: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  scoreMetaValue: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  scoreRow: {
    gap: spacing.md,
  },
  scorePad: {
    alignItems: "center",
    gap: spacing.md,
  },
  scoreValue: {
    color: colors.text,
    fontSize: 56,
    fontWeight: "900",
  },
  scoreAdjust: {
    width: "100%",
    flexDirection: "row",
    gap: spacing.md,
  },
  sectionToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  sectionToggleText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  sectionTitleDanger: {
    color: colors.danger,
  },
  sectionSummary: {
    color: colors.textMuted,
    fontSize: 13,
  },
  sectionChevron: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 24,
    width: 24,
    textAlign: "center",
  },
  sectionBody: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  sectionCopy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  listMeta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  serviceCopy: {
    flex: 1,
    gap: 2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
});
