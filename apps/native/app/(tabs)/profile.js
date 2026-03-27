import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
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
import {
  formatProfileVisibilityLabel,
  formatSubscriptionLabel,
  normalizeCurrentUser,
} from "../../src/lib/account-state";
import { buildCommunityFeed, buildSocialCircle } from "../../src/lib/social-state";
import { summarizeCompletedRounds } from "../../src/lib/round-history";
import { radii, spacing, useAppTheme } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

function InfoRow({ label, value }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function FormField({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, multiline ? styles.inputMultiline : null]}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const rawCurrentUser = useAppStore((state) => state.currentUser);
  const activeRound = useAppStore((state) => state.activeRound);
  const authMode = useAppStore((state) => state.authMode);
  const sessionRestoredFrom = useAppStore((state) => state.sessionRestoredFrom);
  const completedRounds = useAppStore((state) => state.completedRounds);
  const socialProfiles = useAppStore((state) => state.socialProfiles);
  const socialPosts = useAppStore((state) => state.socialPosts);
  const socialSettings = useAppStore((state) => state.socialSettings);
  const teeTimeRequests = useAppStore((state) => state.teeTimeRequests);
  const courseServiceRequests = useAppStore((state) => state.courseServiceRequests);
  const signOut = useAppStore((state) => state.signOut);
  const updateCurrentUserProfile = useAppStore((state) => state.updateCurrentUserProfile);

  const currentUser = normalizeCurrentUser(rawCurrentUser || {});
  const completedRoundStats = summarizeCompletedRounds(completedRounds, currentUser.id);
  const socialCircle = buildSocialCircle({
    currentUser,
    socialProfiles,
    socialSettings,
  });
  const communityFeed = buildCommunityFeed({
    currentUser,
    socialProfiles,
    socialPosts,
    socialSettings,
  });
  const [formState, setFormState] = useState({
    displayName: currentUser.displayName,
    city: currentUser.city,
    homeCourse: currentUser.homeCourse,
    handicap: currentUser.handicap === null ? "" : String(currentUser.handicap),
    bio: currentUser.bio,
    seasonGoal: currentUser.seasonGoal,
  });

  useEffect(() => {
    setFormState({
      displayName: currentUser.displayName,
      city: currentUser.city,
      homeCourse: currentUser.homeCourse,
      handicap: currentUser.handicap === null ? "" : String(currentUser.handicap),
      bio: currentUser.bio,
      seasonGoal: currentUser.seasonGoal,
    });
  }, [
    currentUser.bio,
    currentUser.city,
    currentUser.displayName,
    currentUser.handicap,
    currentUser.homeCourse,
    currentUser.seasonGoal,
  ]);

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
  ].sort((left, right) => right.createdAt - left.createdAt).slice(0, 5);

  const friendCount = socialCircle.filter((entry) => entry.isFriend).length;
  const followingCount = socialCircle.filter((entry) => entry.isFollowed).length;

  return (
    <Screen scroll>
      <SectionHeader title="Profile" subtitle="Identity, golf settings, and account status." />

      <Card>
        <Text style={styles.name}>{currentUser.displayName}</Text>
        <Text style={styles.username}>@{currentUser.username}</Text>
        <Text style={styles.meta}>
          {currentUser.homeCourse || "Home course not set"} / Handicap {currentUser.handicap ?? "--"}
        </Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Identity</Text>
        <FormField
          label="Display name"
          value={formState.displayName}
          onChangeText={(value) => setFormState((state) => ({ ...state, displayName: value }))}
          placeholder="Your name"
        />
        <FormField
          label="City"
          value={formState.city}
          onChangeText={(value) => setFormState((state) => ({ ...state, city: value }))}
          placeholder="Home city"
        />
        <FormField
          label="Home course"
          value={formState.homeCourse}
          onChangeText={(value) => setFormState((state) => ({ ...state, homeCourse: value }))}
          placeholder="Course you play most"
        />
        <FormField
          label="Handicap"
          value={formState.handicap}
          onChangeText={(value) => setFormState((state) => ({ ...state, handicap: value }))}
          placeholder="9.8"
          keyboardType="decimal-pad"
        />
        <FormField
          label="Bio"
          value={formState.bio}
          onChangeText={(value) => setFormState((state) => ({ ...state, bio: value }))}
          placeholder="Short golf bio"
          multiline
        />
        <FormField
          label="Season goal"
          value={formState.seasonGoal}
          onChangeText={(value) => setFormState((state) => ({ ...state, seasonGoal: value }))}
          placeholder="Break 80"
          multiline
        />
        <AppButton
          label="Save Profile"
          onPress={async () => {
            await updateCurrentUserProfile({
              displayName: formState.displayName,
              city: formState.city,
              homeCourse: formState.homeCourse,
              handicap: formState.handicap,
              bio: formState.bio,
              seasonGoal: formState.seasonGoal,
            });
          }}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Golf Card</Text>
        <InfoRow label="Rounds" value={String(completedRoundStats.roundsPlayed || 0)} />
        <InfoRow label="Average" value={completedRoundStats.averageScore ? String(completedRoundStats.averageScore) : "--"} />
        <InfoRow label="Best" value={completedRoundStats.bestRound ? String(completedRoundStats.bestRound) : "--"} />
        <InfoRow label="Plan" value={formatSubscriptionLabel(currentUser.subscription)} />
        <InfoRow label="Visibility" value={formatProfileVisibilityLabel(currentUser.privacy?.profileVisibility)} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Account</Text>
        <InfoRow label="Mode" value={authMode === "supabase" ? "Cloud account" : "Local tester"} />
        <InfoRow label="Restore" value={sessionRestoredFrom || "Fresh launch"} />
        <InfoRow label="Email" value={currentUser.email || "Not connected"} />
        <InfoRow label="Provider" value={currentUser.provider || "email"} />
        <InfoRow label="Round" value={activeRound?.courseName || "No active round"} />
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
          <Text style={styles.emptyCopy}>No request history saved yet.</Text>
        )}
      </Card>

      <View style={styles.actions}>
        <AppButton label="View Stats" variant="secondary" onPress={() => router.push("/stats")} />
        <AppButton label="Open Settings" onPress={() => router.push("/settings")} />
        <AppButton label="Help" variant="secondary" onPress={() => router.push("/help")} />
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

const createStyles = (theme) => StyleSheet.create({
  name: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  username: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
    color: theme.colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  infoValue: {
    color: theme.colors.text,
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
    borderTopColor: theme.colors.border,
  },
  requestCopy: {
    flex: 1,
    gap: 2,
  },
  requestName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  requestMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  requestStatus: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
});
