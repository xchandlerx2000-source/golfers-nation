import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { AppButton } from "../../../src/components/AppButton";
import { Card } from "../../../src/components/Card";
import { Screen } from "../../../src/components/Screen";
import { SectionHeader } from "../../../src/components/SectionHeader";
import { colors, spacing } from "../../../src/theme";
import { useAppStore } from "../../../src/store/useAppStore";

function InfoRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function CommunityProfileScreen() {
  const { profileId } = useLocalSearchParams();
  const profile = useAppStore((state) => state.getSocialProfile(String(profileId || "")));
  const toggleFollowProfile = useAppStore((state) => state.toggleFollowProfile);
  const addFriendProfile = useAppStore((state) => state.addFriendProfile);

  if (!profile) {
    return (
      <Screen>
        <SectionHeader title="Golfer" subtitle="Profile not found." />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionHeader title={profile.displayName} subtitle={`@${profile.username}`} />
      <Card>
        <Text style={styles.name}>{profile.displayName}</Text>
        <Text style={styles.meta}>
          {profile.homeCourse || "Home course not set"} / Handicap {profile.handicap ?? "--"}
        </Text>
        <Text style={styles.copy}>{profile.bio || "Golf profile"}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Stats</Text>
        <InfoRow label="Rounds" value={String(profile.stats?.roundsPlayed || 0)} />
        <InfoRow label="Average" value={profile.stats?.averageScore ? String(profile.stats.averageScore) : "--"} />
        <InfoRow label="Best" value={profile.stats?.bestRound ? String(profile.stats.bestRound) : "--"} />
        <InfoRow label="Form" value={profile.stats?.recentFormSummary || "Building"} />
      </Card>

      <View style={styles.actions}>
        {!profile.isCurrentUser ? (
          <>
            <AppButton
              label={profile.isFriend ? "Friends" : "Add Friend"}
              variant="secondary"
              disabled={profile.isFriend}
              onPress={() => addFriendProfile(profile.id)}
            />
            <AppButton
              label={profile.isFollowed ? "Following" : "Follow"}
              variant="secondary"
              onPress={() => toggleFollowProfile(profile.id)}
            />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  meta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  copy: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  actions: {
    gap: spacing.md,
  },
});
