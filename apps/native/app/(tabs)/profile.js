import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import {
  formatCourseRequestTypeLabel,
  getCourseServiceRequestStatusLabel,
  getTeeTimeRequestStatusLabel,
} from "@golfers-nation/core";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { Screen } from "../../src/components/Screen";
import { SectionHeader } from "../../src/components/SectionHeader";
import { getNativeRuntimeConfig } from "../../src/lib/runtime-config";
import { colors, spacing } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const authMode = useAppStore((state) => state.authMode);
  const sessionRestoredFrom = useAppStore((state) => state.sessionRestoredFrom);
  const authHealthStatus = useAppStore((state) => state.authHealthStatus);
  const sessionExpiresAt = useAppStore((state) => state.sessionExpiresAt);
  const activeRound = useAppStore((state) => state.activeRound);
  const completedRoundStats = useAppStore((state) => state.getCompletedRoundStats());
  const socialCircle = useAppStore((state) => state.getSocialCircle());
  const communityFeed = useAppStore((state) => state.getCommunityFeed());
  const teeTimeRequests = useAppStore((state) => state.teeTimeRequests);
  const courseServiceRequests = useAppStore((state) => state.courseServiceRequests);
  const signOut = useAppStore((state) => state.signOut);
  const runtimeConfig = getNativeRuntimeConfig();
  const formattedExpiry = sessionExpiresAt
    ? new Date(Number(sessionExpiresAt) * 1000).toLocaleString()
    : "Not set";
  const recentRequests = [
    ...teeTimeRequests.map((request) => ({
      id: request.id,
      label: request.courseName,
      status: getTeeTimeRequestStatusLabel(request.status),
      meta: request.desiredWindowLabel,
      createdAt: Number(request.updatedAt || request.createdAt || 0),
    })),
    ...courseServiceRequests.map((request) => ({
      id: request.id,
      label: request.courseName,
      status: getCourseServiceRequestStatusLabel(request.status),
      meta: formatCourseRequestTypeLabel(request.requestType),
      createdAt: Number(request.updatedAt || request.createdAt || 0),
    })),
  ]
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, 5);
  const friendCount = socialCircle.filter((entry) => entry.isFriend).length;
  const followingCount = socialCircle.filter((entry) => entry.isFollowed).length;

  return (
    <Screen scroll>
      <SectionHeader title="Profile" subtitle="Identity, account status, and settings access." />
      <Card>
        <Text style={styles.name}>{currentUser?.displayName || "Golfer"}</Text>
        <Text style={styles.username}>@{currentUser?.username || "golfer"}</Text>
        <Text style={styles.meta}>
          {currentUser?.homeCourse || "Home course not set"} / Handicap {currentUser?.handicap ?? "--"}
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Account</Text>
        <InfoRow label="Mode" value={authMode === "supabase" ? "Cloud account" : "Local tester"} />
        <InfoRow label="Restore" value={sessionRestoredFrom || "Fresh launch"} />
        <InfoRow label="Session" value={authHealthStatus || "idle"} />
        <InfoRow label="Expires" value={formattedExpiry} />
        <InfoRow label="Round" value={activeRound?.courseName || "No active round"} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Golf</Text>
        <InfoRow label="City" value={currentUser?.city || "Not set"} />
        <InfoRow label="Home course" value={currentUser?.homeCourse || "Not set"} />
        <InfoRow label="Handicap" value={currentUser?.handicap ? String(currentUser.handicap) : "--"} />
        <InfoRow label="Rounds" value={String(completedRoundStats.roundsPlayed || 0)} />
        <InfoRow label="Average" value={completedRoundStats.averageScore ? String(completedRoundStats.averageScore) : "--"} />
        <InfoRow label="Best" value={completedRoundStats.bestRound ? String(completedRoundStats.bestRound) : "--"} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Build</Text>
        <InfoRow label="Environment" value={runtimeConfig.appEnv} />
        <InfoRow label="Channel" value={runtimeConfig.releaseChannel} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Community</Text>
        <InfoRow label="Friends" value={String(friendCount)} />
        <InfoRow label="Following" value={String(followingCount)} />
        <InfoRow label="Clubhouse posts" value={String(communityFeed.length)} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Requests</Text>
        <InfoRow label="Tee times" value={String(teeTimeRequests.length)} />
        <InfoRow label="Course services" value={String(courseServiceRequests.length)} />
        {recentRequests.length ? (
          <View style={styles.requestList}>
            {recentRequests.map((request) => (
              <View key={request.id} style={styles.requestRow}>
                <View style={styles.requestCopy}>
                  <Text style={styles.requestName}>{request.label}</Text>
                  <Text style={styles.requestMeta}>{request.meta}</Text>
                </View>
                <Text style={styles.requestStatus}>{request.status}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyCopy}>No local requests saved yet.</Text>
        )}
      </Card>

      <View style={styles.actions}>
        <AppButton label="View Stats" variant="secondary" onPress={() => router.push("/stats")} />
        <AppButton label="Open Settings" onPress={() => router.push("/settings")} />
        <AppButton label="Support" variant="secondary" onPress={() => router.push("/support")} />
        <AppButton
          label="Sign Out"
          variant="secondary"
          onPress={async () => {
            await signOut();
            router.replace("/auth");
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  username: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
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
  actions: {
    gap: spacing.md,
  },
  requestList: {
    gap: spacing.sm,
  },
  requestRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  requestCopy: {
    flex: 1,
    gap: 2,
  },
  requestName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  requestMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  requestStatus: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  emptyCopy: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
