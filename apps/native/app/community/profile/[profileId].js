import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppButton } from "../../../src/components/AppButton";
import { Card } from "../../../src/components/Card";
import { Screen } from "../../../src/components/Screen";
import { SectionHeader } from "../../../src/components/SectionHeader";
import { spacing, useAppTheme } from "../../../src/theme";
import { useAppStore } from "../../../src/store/useAppStore";

function InfoRow({ label, value }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function Badge({ label, accent = false }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.badge, accent ? styles.badgeAccent : null]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export default function CommunityProfileScreen() {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { profileId } = useLocalSearchParams();
  const profile = useAppStore((state) => state.getSocialProfile(String(profileId || "")));
  const toggleFollowProfile = useAppStore((state) => state.toggleFollowProfile);
  const addFriendProfile = useAppStore((state) => state.addFriendProfile);
  const openDirectConversation = useAppStore((state) => state.openDirectConversation);

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
        <View style={styles.heroRow}>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>{String(profile.avatarLabel || profile.displayName || "GN").slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={styles.personCopy}>
            <Text style={styles.name}>{profile.displayName}</Text>
            <Text style={styles.meta}>
              @{profile.username} / {profile.homeCourse || profile.city || "Home course not set"}
            </Text>
            <Text style={styles.copy}>{profile.bio || "Golf profile"}</Text>
          </View>
        </View>
        <View style={styles.badgeRow}>
          {profile.isFriend ? <Badge label="Friend" accent /> : null}
          {profile.isFollowed ? <Badge label="Following" accent /> : null}
          <Badge label={`Handicap ${profile.handicap ?? "--"}`} />
        </View>
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
            <AppButton
              label="Message"
              variant="secondary"
              onPress={async () => {
                await openDirectConversation(profile.id);
                router.push("/(tabs)/community?tab=messages");
              }}
            />
            <Pressable onPress={() => router.push("/(tabs)/community?tab=discover")} style={styles.backLink}>
              <Text style={styles.backLinkText}>Back to discovery</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  name: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  heroRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  avatarBadge: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  avatarBadgeText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  personCopy: {
    flex: 1,
    gap: 4,
  },
  meta: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  copy: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgeAccent: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  badgeText: {
    color: theme.colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  value: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  actions: {
    gap: spacing.md,
  },
  backLink: {
    paddingVertical: spacing.xs,
    alignSelf: "flex-start",
  },
  backLinkText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
});
