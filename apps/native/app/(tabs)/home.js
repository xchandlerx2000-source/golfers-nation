import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { Screen } from "../../src/components/Screen";
import { SectionHeader } from "../../src/components/SectionHeader";
import { spacing, useAppTheme } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

function NearbyCourseRow({ course, onPress }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable onPress={onPress} style={styles.courseRow}>
      <View style={styles.courseCopy}>
        <Text style={styles.courseName}>{course.displayName || course.courseName || course.name}</Text>
        <Text style={styles.courseMeta}>
          {[course.city, course.state].filter(Boolean).join(", ") || "Location pending"}
        </Text>
      </View>
      <Text style={styles.courseLink}>Open</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const activeRound = useAppStore((state) => state.activeRound);
  const recentInviteCode = useAppStore((state) => state.recentInviteCode);
  const liveSyncStatus = useAppStore((state) => state.liveSyncStatus);
  const liveSyncNotice = useAppStore((state) => state.liveSyncNotice);
  const lastLiveSyncAt = useAppStore((state) => state.lastLiveSyncAt);
  const refreshLiveRound = useAppStore((state) => state.refreshLiveRound);
  const homeNearbyCourses = useAppStore((state) => state.homeNearbyCourses);
  const homeNearbyStatus = useAppStore((state) => state.homeNearbyStatus);
  const homeNearbyNotice = useAppStore((state) => state.homeNearbyNotice);
  const loadHomeNearbyCourses = useAppStore((state) => state.loadHomeNearbyCourses);
  const selectCourse = useAppStore((state) => state.selectCourse);

  useEffect(() => {
    void loadHomeNearbyCourses({ requestPermission: false });
  }, [loadHomeNearbyCourses]);

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
    <Screen scroll>
      <SectionHeader title="Home" subtitle="Live rounds, nearby courses, and the fastest next step." />

      {activeRound ? (
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
          <View style={styles.actionGrid}>
            <AppButton label="Open Score" onPress={() => router.push("/(tabs)/score")} />
            <AppButton label="Open Lobby" variant="secondary" onPress={() => router.push("/round/lobby")} />
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
        </Card>
      ) : (
        <Card style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Launch Pad</Text>
            </View>
            {recentInviteCode ? (
              <View style={styles.syncBadge}>
                <Text style={styles.syncBadgeText}>Recent {recentInviteCode}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.title}>Ready when the group is.</Text>
          <Text style={styles.meta}>Start a round fast or join a live room with a real code. Nearby stays tied to your phone location.</Text>
          <View style={styles.actionGrid}>
            <AppButton label="Start Round" onPress={() => router.push("/round/setup")} />
            <AppButton label="Join Game" variant="secondary" onPress={() => router.push("/round/join")} />
          </View>
        </Card>
      )}

      <Card>
        <View style={styles.sectionHead}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>Nearby Courses</Text>
            <Text style={styles.sectionSummary}>Real courses only. No seeded placeholders.</Text>
          </View>
          <AppButton
            label="Use My Location"
            size="compact"
            variant="secondary"
            onPress={() => {
              void loadHomeNearbyCourses({ requestPermission: true });
            }}
          />
        </View>
        {homeNearbyNotice ? <Text style={styles.notice}>{homeNearbyNotice}</Text> : null}
        {homeNearbyCourses.length ? (
          <View style={styles.courseList}>
            {homeNearbyCourses.map((course) => (
              <NearbyCourseRow
                key={course.id}
                course={course}
                onPress={async () => {
                  await selectCourse(course.id);
                  router.push("/round/setup");
                }}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyCopy}>
            {homeNearbyStatus === "loading" || homeNearbyStatus === "checking" || homeNearbyStatus === "locating"
              ? "Looking for nearby courses..."
              : homeNearbyStatus === "ready"
                ? "No nearby courses were found in range yet."
              : "Allow location to show real nearby courses here."}
          </Text>
        )}
      </Card>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  heroCard: {
    gap: spacing.lg,
  },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: "900",
  },
  meta: {
    color: theme.colors.textSoft,
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
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  statusBadgeText: {
    color: theme.colors.accent,
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
    backgroundColor: theme.colors.surfaceSoft,
    borderColor: theme.colors.border,
  },
  syncBadgeText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statusConnected: {
    backgroundColor: theme.isDark ? "rgba(52,208,123,0.16)" : "rgba(31,157,85,0.12)",
    borderColor: theme.isDark ? "rgba(52,208,123,0.45)" : "rgba(31,157,85,0.4)",
  },
  statusWarning: {
    backgroundColor: "rgba(240,180,74,0.12)",
    borderColor: "rgba(240,180,74,0.45)",
  },
  statusMuted: {
    backgroundColor: theme.colors.surfaceSoft,
    borderColor: theme.colors.border,
  },
  heroStats: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  heroStat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  heroStatLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroStatValue: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  notice: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  actionGrid: {
    gap: spacing.sm,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionCopy: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  sectionSummary: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  courseList: {
    gap: spacing.sm,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  courseCopy: {
    flex: 1,
    gap: 2,
  },
  courseName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  courseMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  courseLink: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
