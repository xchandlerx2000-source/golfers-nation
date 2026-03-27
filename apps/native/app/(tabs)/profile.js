import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import {
  formatCourseRequestTypeLabel,
  getCourseServiceRequestStatusLabel,
  getTeeTimeRequestStatusLabel,
} from "@golfers-nation/core";
import { AccordionSection } from "../../src/components/AccordionSection";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { Screen } from "../../src/components/Screen";
import { SectionHeader } from "../../src/components/SectionHeader";
import {
  DEFAULT_PRIVACY,
  PROFILE_VISIBILITY_OPTIONS,
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

function SummaryChip({ label, value }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.summaryChip}>
      <Text style={styles.summaryChipValue}>{value}</Text>
      <Text style={styles.summaryChipLabel}>{label}</Text>
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

function ChoiceGroup({ title, options, selectedId, onSelect }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{title}</Text>
      <View style={styles.choiceWrap}>
        {options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <Pressable
              key={option.id}
              onPress={() => onSelect(option.id)}
              style={[styles.choiceChip, selected ? styles.choiceChipActive : null]}
            >
              <Text style={[styles.choiceText, selected ? styles.choiceTextActive : null]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function BinaryChoiceRow({ label, value, onValueChange }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={styles.binaryWrap}>
        <Pressable onPress={() => onValueChange(true)} style={[styles.binaryChip, value ? styles.binaryChipActive : null]}>
          <Text style={[styles.binaryText, value ? styles.binaryTextActive : null]}>On</Text>
        </Pressable>
        <Pressable onPress={() => onValueChange(false)} style={[styles.binaryChip, !value ? styles.binaryChipActive : null]}>
          <Text style={[styles.binaryText, !value ? styles.binaryTextActive : null]}>Off</Text>
        </Pressable>
      </View>
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
  const updateCurrentUserPrivacy = useAppStore((state) => state.updateCurrentUserPrivacy);

  const currentUser = normalizeCurrentUser(rawCurrentUser || {});
  const privacy = {
    ...DEFAULT_PRIVACY,
    ...(currentUser.privacy || {}),
  };
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
      <SectionHeader title="Profile" subtitle="Golfer settings first. App settings stay separate." />

      <Card>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={styles.name}>{currentUser.displayName}</Text>
            <Text style={styles.username}>@{currentUser.username}</Text>
            <Text style={styles.meta}>
              {currentUser.homeCourse || "Home course not set"} / Handicap {currentUser.handicap ?? "--"}
            </Text>
          </View>
          <View style={styles.heroActions}>
            <AppButton label="App Settings" size="compact" variant="secondary" onPress={() => router.push("/settings")} />
            <AppButton label="View Stats" size="compact" variant="secondary" onPress={() => router.push("/stats")} />
          </View>
        </View>

        <View style={styles.summaryRow}>
          <SummaryChip label="Rounds" value={completedRoundStats.roundsPlayed || 0} />
          <SummaryChip label="Friends" value={friendCount} />
          <SummaryChip label="Following" value={followingCount} />
          <SummaryChip label="Requests" value={teeTimeRequests.length + courseServiceRequests.length} />
        </View>
      </Card>

      <AccordionSection
        title="Profile details"
        subtitle="Display name, home course, handicap, bio, and season goal."
        defaultOpen
      >
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
          label="Save Golfer Profile"
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
      </AccordionSection>

      <AccordionSection
        title="Profile privacy"
        subtitle="Control what other golfers can see from your card."
      >
        <ChoiceGroup
          title="Profile visibility"
          options={PROFILE_VISIBILITY_OPTIONS}
          selectedId={privacy.profileVisibility}
          onSelect={(id) => updateCurrentUserPrivacy({ profileVisibility: id })}
        />
        <BinaryChoiceRow
          label="Show home course"
          value={privacy.showHomeCourse === true}
          onValueChange={(value) => updateCurrentUserPrivacy({ showHomeCourse: value })}
        />
        <BinaryChoiceRow
          label="Show handicap"
          value={privacy.showHandicap === true}
          onValueChange={(value) => updateCurrentUserPrivacy({ showHandicap: value })}
        />
        <BinaryChoiceRow
          label="Show bio"
          value={privacy.showBio === true}
          onValueChange={(value) => updateCurrentUserPrivacy({ showBio: value })}
        />
        <BinaryChoiceRow
          label="Show recent form"
          value={privacy.showRecentForm === true}
          onValueChange={(value) => updateCurrentUserPrivacy({ showRecentForm: value })}
        />
        <BinaryChoiceRow
          label="Show head-to-head"
          value={privacy.showHeadToHead === true}
          onValueChange={(value) => updateCurrentUserPrivacy({ showHeadToHead: value })}
        />
      </AccordionSection>

      <AccordionSection
        title="Golf card"
        subtitle="Scoring summary, active round, and membership state."
      >
        <InfoRow label="Rounds" value={String(completedRoundStats.roundsPlayed || 0)} />
        <InfoRow label="Average" value={completedRoundStats.averageScore ? String(completedRoundStats.averageScore) : "--"} />
        <InfoRow label="Best" value={completedRoundStats.bestRound ? String(completedRoundStats.bestRound) : "--"} />
        <InfoRow label="Plan" value={formatSubscriptionLabel(currentUser.subscription)} />
        <InfoRow label="Visibility" value={formatProfileVisibilityLabel(privacy.profileVisibility)} />
        <InfoRow label="Active round" value={activeRound?.courseName || "No active round"} />
      </AccordionSection>

      <AccordionSection
        title="Community"
        subtitle="Circle counts, clubhouse activity, and quick paths."
      >
        <InfoRow label="Friends" value={String(friendCount)} />
        <InfoRow label="Following" value={String(followingCount)} />
        <InfoRow label="Clubhouse posts" value={String(communityFeed.length)} />
        <View style={styles.inlineActions}>
          <AppButton label="Open Community" size="compact" variant="secondary" onPress={() => router.push("/(tabs)/community")} />
          <AppButton label="Support" size="compact" variant="secondary" onPress={() => router.push("/support")} />
        </View>
      </AccordionSection>

      <AccordionSection
        title="Request history"
        subtitle="Tee time and course-service requests saved on this device or in cloud."
      >
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
      </AccordionSection>

      <AccordionSection
        title="Account"
        subtitle="Sign-in state and identity for this golfer."
      >
        <InfoRow label="Mode" value={authMode === "supabase" ? "Cloud account" : "Local tester"} />
        <InfoRow label="Restore" value={sessionRestoredFrom || "Fresh launch"} />
        <InfoRow label="Email" value={currentUser.email || "Not connected"} />
        <InfoRow label="Provider" value={currentUser.provider || "email"} />
        <AppButton
          label="Sign Out"
          variant="secondary"
          onPress={async () => {
            await signOut();
            router.replace("/auth");
          }}
        />
      </AccordionSection>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  heroHeader: {
    gap: spacing.md,
  },
  heroCopy: {
    gap: 4,
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  summaryChip: {
    minWidth: 78,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
    gap: 2,
  },
  summaryChipValue: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  summaryChipLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
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
    backgroundColor: theme.colors.surface,
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
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  choiceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  choiceChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  choiceText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  choiceTextActive: {
    color: theme.colors.text,
  },
  toggleRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  toggleLabel: {
    color: theme.colors.text,
    fontSize: 14,
  },
  binaryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  binaryChip: {
    minWidth: 68,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
  },
  binaryChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  binaryText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  binaryTextActive: {
    color: theme.colors.text,
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
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
