import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { Screen } from "../../src/components/Screen";
import { SectionHeader } from "../../src/components/SectionHeader";
import {
  buildCommunityFeed,
  buildDirectInbox,
  buildSocialCircle,
  buildSocialProfilePreview,
} from "../../src/lib/social-state";
import { spacing, useAppTheme } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

function Segment({ label, active, onPress }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable onPress={onPress} style={[styles.segment, active ? styles.segmentActive : null]}>
      <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function StatPill({ label, value }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AvatarBadge({ label }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.avatarBadge}>
      <Text style={styles.avatarBadgeText}>{String(label || "GN").slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

function ConnectionBadge({ label, tone = "neutral" }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View
      style={[
        styles.connectionBadge,
        tone === "accent" ? styles.connectionBadgeAccent : null,
        tone === "strong" ? styles.connectionBadgeStrong : null,
      ]}
    >
      <Text style={styles.connectionBadgeText}>{label}</Text>
    </View>
  );
}

function ProfileRow({
  player,
  onOpen,
  onFollow,
  onAddFriend,
  onMessage,
}) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.personRow}>
      <Pressable onPress={onOpen} style={styles.personHeader}>
        <AvatarBadge label={player.avatarLabel || player.displayName} />
        <View style={styles.personCopy}>
          <Text style={styles.personName}>{player.displayName}</Text>
          <Text style={styles.personMeta}>
            @{player.username} / {player.homeCourse || player.city || "Golf profile"}
          </Text>
          <Text style={styles.personDetail}>
            {player.stats?.recentFormSummary || player.bio || "Profile ready."}
          </Text>
        </View>
      </Pressable>

      <View style={styles.badgeRow}>
        {player.isFriend ? <ConnectionBadge label="Friend" tone="strong" /> : null}
        {player.isFollowed ? <ConnectionBadge label="Following" tone="accent" /> : null}
        {player.handicap !== null && player.handicap !== undefined ? (
          <ConnectionBadge label={`Hdcp ${player.handicap}`} />
        ) : null}
      </View>

      <View style={styles.personActions}>
        <AppButton
          label={player.isFriend ? "Friends" : "Add Friend"}
          size="compact"
          variant="secondary"
          disabled={player.isFriend}
          onPress={onAddFriend}
        />
        <AppButton
          label={player.isFollowed ? "Following" : "Follow"}
          size="compact"
          variant="secondary"
          onPress={onFollow}
        />
        <AppButton
          label="Message"
          size="compact"
          variant="secondary"
          onPress={onMessage}
        />
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const params = useLocalSearchParams();
  const authMode = useAppStore((state) => state.authMode);
  const currentUser = useAppStore((state) => state.currentUser);
  const socialProfiles = useAppStore((state) => state.socialProfiles);
  const socialPosts = useAppStore((state) => state.socialPosts);
  const socialConversations = useAppStore((state) => state.socialConversations);
  const socialSettings = useAppStore((state) => state.socialSettings);
  const socialDiscoveryQuery = useAppStore((state) => state.socialDiscoveryQuery);
  const socialDiscoveryResults = useAppStore((state) => state.socialDiscoveryResults);
  const socialDiscoveryStatus = useAppStore((state) => state.socialDiscoveryStatus);
  const socialDiscoveryNotice = useAppStore((state) => state.socialDiscoveryNotice);
  const setSocialDiscoveryQuery = useAppStore((state) => state.setSocialDiscoveryQuery);
  const clearSocialDiscovery = useAppStore((state) => state.clearSocialDiscovery);
  const refreshSocialDiscovery = useAppStore((state) => state.refreshSocialDiscovery);
  const toggleFollowProfile = useAppStore((state) => state.toggleFollowProfile);
  const addFriendProfile = useAppStore((state) => state.addFriendProfile);
  const createSocialPost = useAppStore((state) => state.createSocialPost);
  const openDirectConversation = useAppStore((state) => state.openDirectConversation);
  const sendDirectMessage = useAppStore((state) => state.sendDirectMessage);
  const [tab, setTab] = useState("discover");
  const [postMessage, setPostMessage] = useState("");
  const [postLinkUrl, setPostLinkUrl] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [activeConversationId, setActiveConversationId] = useState("");

  useEffect(() => {
    if (socialDiscoveryStatus === "idle") {
      void refreshSocialDiscovery("");
    }
  }, [refreshSocialDiscovery, socialDiscoveryStatus]);

  useEffect(() => {
    const requestedTab = String(params?.tab || "").trim().toLowerCase();
    if (requestedTab === "messages" || requestedTab === "discover" || requestedTab === "circle" || requestedTab === "clubhouse") {
      setTab(requestedTab);
    }
  }, [params]);

  const communityFeed = useMemo(() => buildCommunityFeed({
    currentUser,
    socialProfiles,
    socialPosts,
    socialSettings,
  }), [currentUser, socialProfiles, socialPosts, socialSettings]);
  const socialCircle = useMemo(() => buildSocialCircle({
    currentUser,
    socialProfiles,
    socialSettings,
  }), [currentUser, socialProfiles, socialSettings]);
  const directInbox = useMemo(() => buildDirectInbox({
    currentUser,
    socialProfiles,
    socialConversations,
    socialSettings,
  }), [currentUser, socialProfiles, socialConversations, socialSettings]);
  const currentProfile = useMemo(() => buildSocialProfilePreview({
    currentUser,
    socialProfiles,
    socialSettings,
    profileId: currentUser?.profileId || currentUser?.id || "",
  }), [currentUser, socialProfiles, socialSettings]);
  const activeConversation = useMemo(() => {
    if (!directInbox.length) {
      return null;
    }

    return directInbox.find((conversation) => conversation.id === activeConversationId) || directInbox[0];
  }, [activeConversationId, directInbox]);
  const friends = socialCircle.filter((entry) => entry.isFriend);
  const following = socialCircle.filter((entry) => entry.isFollowed && !entry.isFriend);
  const discoveryResults = socialDiscoveryResults.filter((entry) => entry?.id);
  const profileCount = socialProfiles.filter((entry) => entry?.id && entry.id !== (currentUser?.profileId || currentUser?.id)).length;

  useEffect(() => {
    setMessageDraft("");
  }, [activeConversation?.id]);

  const handleOpenProfile = (profileId) => {
    router.push(`/community/profile/${profileId}`);
  };

  const handleOpenMessage = async (profileId) => {
    const conversationId = await openDirectConversation(profileId);
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
    setTab("messages");
  };

  const renderProfileRows = (players, emptyCopy) => {
    if (!players.length) {
      return <Text style={styles.emptyCopy}>{emptyCopy}</Text>;
    }

    return (
      <View style={styles.list}>
        {players.map((player) => (
          <ProfileRow
            key={player.id}
            player={player}
            onOpen={() => handleOpenProfile(player.id)}
            onFollow={() => toggleFollowProfile(player.id)}
            onAddFriend={() => addFriendProfile(player.id)}
            onMessage={() => {
              void handleOpenMessage(player.id);
            }}
          />
        ))}
      </View>
    );
  };

  return (
    <Screen scroll>
      <SectionHeader title="Community" subtitle="Real golfers, clean discovery, and direct messages that stay tied to your golf circle." />

      <Card>
        <Text style={styles.sectionTitle}>Social overview</Text>
        <Text style={styles.sectionSummary}>
          Build a circle first, then messages and clubhouse updates feel like one connected product instead of separate screens.
        </Text>
        <View style={styles.overviewRow}>
          <StatPill label="Profiles" value={profileCount} />
          <StatPill label="Friends" value={friends.length} />
          <StatPill label="Following" value={following.length} />
          <StatPill label="Inbox" value={directInbox.length} />
        </View>
        <View style={styles.inlineActions}>
          <AppButton label="Discover Golfers" size="compact" variant="secondary" onPress={() => setTab("discover")} />
          <AppButton label="Open Inbox" size="compact" variant="secondary" onPress={() => setTab("messages")} />
        </View>
      </Card>

      <Card>
        <View style={styles.segmentRow}>
          <Segment label="Discover" active={tab === "discover"} onPress={() => setTab("discover")} />
          <Segment label="Circle" active={tab === "circle"} onPress={() => setTab("circle")} />
          <Segment label="Messages" active={tab === "messages"} onPress={() => setTab("messages")} />
          <Segment label="Clubhouse" active={tab === "clubhouse"} onPress={() => setTab("clubhouse")} />
        </View>
      </Card>

      {tab === "discover" ? (
        <Card>
          <Text style={styles.sectionTitle}>Discover golfers</Text>
          <Text style={styles.sectionSummary}>
            {authMode === "supabase"
              ? "Search real player profiles from the cloud account path and open profiles directly."
              : "Cloud sign-in unlocks real golfer discovery. Local mode only shows golfers already saved on this phone."}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Search golfers by name, username, or home course"
            placeholderTextColor={theme.colors.textMuted}
            value={socialDiscoveryQuery}
            onChangeText={setSocialDiscoveryQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.inlineActions}>
            <AppButton
              label={socialDiscoveryStatus === "loading" ? "Searching..." : "Search"}
              size="compact"
              onPress={() => {
                void refreshSocialDiscovery();
              }}
            />
            <AppButton
              label="Clear"
              size="compact"
              variant="secondary"
              onPress={() => {
                clearSocialDiscovery();
                void refreshSocialDiscovery("");
              }}
            />
          </View>
          {socialDiscoveryNotice ? <Text style={styles.notice}>{socialDiscoveryNotice}</Text> : null}
          {renderProfileRows(discoveryResults, "No golfer discovery results yet.")}
        </Card>
      ) : null}

      {tab === "circle" ? (
        <Card>
          <Text style={styles.sectionTitle}>Your golf circle</Text>
          <Text style={styles.sectionSummary}>
            Friends are your close golf crew. Following keeps a lighter connection for rounds, stats, and clubhouse posts.
          </Text>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Friends</Text>
            {renderProfileRows(friends, "No friends added yet.")}
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Following</Text>
            {renderProfileRows(following, "You are not following any golfers yet.")}
          </View>
        </Card>
      ) : null}

      {tab === "messages" ? (
        <Card>
          <Text style={styles.sectionTitle}>Direct messages</Text>
          <Text style={styles.sectionSummary}>
            {directInbox.length
              ? `${directInbox.length} conversation${directInbox.length === 1 ? "" : "s"} tied to real golfer profiles.`
              : "Start from a real golfer profile or the circle view."}
          </Text>

          <View style={styles.inlineActions}>
            <AppButton label="Find Golfers" size="compact" variant="secondary" onPress={() => setTab("discover")} />
            {activeConversation?.peerProfileId ? (
              <AppButton
                label="View Profile"
                size="compact"
                variant="secondary"
                onPress={() => handleOpenProfile(activeConversation.peerProfileId)}
              />
            ) : null}
          </View>

          {directInbox.length ? (
            <>
              <View style={styles.list}>
                {directInbox.map((conversation) => (
                  <Pressable
                    key={conversation.id}
                    onPress={() => setActiveConversationId(conversation.id)}
                    style={[
                      styles.messageRow,
                      conversation.id === activeConversation?.id ? styles.messageRowActive : null,
                    ]}
                  >
                    <View style={styles.messageRowHeader}>
                      <AvatarBadge label={conversation.peer?.avatarLabel || conversation.peer?.displayName} />
                      <View style={styles.personCopy}>
                        <Text style={styles.personName}>{conversation.peer?.displayName || "Golfer"}</Text>
                        <Text style={styles.personMeta}>
                          @{conversation.peer?.username || "golfer"} / {conversation.messageCount} messages
                        </Text>
                      </View>
                      {conversation.id === activeConversation?.id ? <ConnectionBadge label="Open" tone="accent" /> : null}
                    </View>
                    <Text style={styles.personDetail}>{conversation.latestMessage?.text || "No messages yet."}</Text>
                  </Pressable>
                ))}
              </View>

              {activeConversation ? (
                <View style={styles.thread}>
                  <View style={styles.threadHeader}>
                    <View style={styles.threadProfile}>
                      <AvatarBadge label={activeConversation.peer?.avatarLabel || activeConversation.peer?.displayName} />
                      <View style={styles.personCopy}>
                        <Text style={styles.sectionTitle}>{activeConversation.peer?.displayName || "Conversation"}</Text>
                        <Text style={styles.personMeta}>
                          @{activeConversation.peer?.username || "golfer"} / {activeConversation.peer?.homeCourse || activeConversation.peer?.city || "Golf profile"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.list}>
                    {(activeConversation.messages || []).slice(-10).map((message) => (
                      <View
                        key={message.id}
                        style={[
                          styles.messageBubble,
                          message.authorProfileId === currentProfile?.id ? styles.messageBubbleOutbound : styles.messageBubbleInbound,
                        ]}
                      >
                        <Text style={[styles.messageText, message.authorProfileId === currentProfile?.id ? styles.messageTextOutbound : null]}>
                          {message.text}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Plan a round, confirm a tee time, or send a quick golf note"
                    placeholderTextColor={theme.colors.textMuted}
                    value={messageDraft}
                    onChangeText={setMessageDraft}
                    multiline
                  />
                  <AppButton
                    label="Send Message"
                    onPress={async () => {
                      const saved = await sendDirectMessage(activeConversation.peerProfileId, messageDraft);
                      if (saved) {
                        setMessageDraft("");
                      }
                    }}
                  />
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.emptyCopy}>No real conversations yet.</Text>
          )}
        </Card>
      ) : null}

      {tab === "clubhouse" ? (
        <Card>
          <Text style={styles.sectionTitle}>Clubhouse</Text>
          <Text style={styles.sectionSummary}>Text-only golf updates from you and golfers you actually follow.</Text>
          <View style={styles.composer}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Post a golf update"
              placeholderTextColor={theme.colors.textMuted}
              value={postMessage}
              onChangeText={setPostMessage}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Optional link"
              placeholderTextColor={theme.colors.textMuted}
              value={postLinkUrl}
              onChangeText={setPostLinkUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <AppButton
              label="Post"
              onPress={async () => {
                const post = await createSocialPost({ message: postMessage, linkUrl: postLinkUrl });
                if (post) {
                  setPostMessage("");
                  setPostLinkUrl("");
                }
              }}
            />
          </View>
          {communityFeed.length ? (
            <View style={styles.list}>
              {communityFeed.map((post) => (
                <View key={post.id} style={styles.feedRow}>
                  <View style={styles.feedHead}>
                    <View style={styles.threadProfile}>
                      <AvatarBadge label={post.author?.avatarLabel || post.author?.displayName} />
                      <View style={styles.personCopy}>
                        <Text style={styles.personName}>{post.author?.displayName || "Golfer"}</Text>
                        <Text style={styles.personMeta}>@{post.author?.username || "golfer"}</Text>
                      </View>
                    </View>
                    <AppButton
                      label="Profile"
                      size="compact"
                      variant="secondary"
                      onPress={() => handleOpenProfile(post.profileId)}
                    />
                  </View>
                  <Text style={styles.feedBody}>{post.message}</Text>
                  {post.courseName ? <Text style={styles.personMeta}>{post.courseName}</Text> : null}
                  {post.linkUrl ? <Text style={styles.linkText}>{post.linkUrl}</Text> : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyCopy}>No real golf updates yet.</Text>
          )}
        </Card>
      ) : null}
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  overviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statPill: {
    minWidth: 74,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
    gap: 2,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  segment: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
  },
  segmentActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: theme.colors.text,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  subsection: {
    gap: spacing.sm,
  },
  subsectionTitle: {
    color: theme.colors.textSoft,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  sectionSummary: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  notice: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  list: {
    gap: spacing.sm,
  },
  personRow: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
  },
  personHeader: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  avatarBadge: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  avatarBadgeText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  personCopy: {
    gap: 2,
    flex: 1,
  },
  personName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  personMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  personDetail: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  connectionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  connectionBadgeAccent: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  connectionBadgeStrong: {
    backgroundColor: theme.colors.overlayAccent,
    borderColor: theme.colors.borderStrong,
  },
  connectionBadgeText: {
    color: theme.colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  personActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  messageRow: {
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
    gap: spacing.xs,
  },
  messageRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  messageRowActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  thread: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  threadHeader: {
    gap: spacing.sm,
  },
  threadProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  messageBubble: {
    maxWidth: "88%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  messageBubbleInbound: {
    backgroundColor: theme.colors.surfaceMuted,
    alignSelf: "flex-start",
  },
  messageBubbleOutbound: {
    backgroundColor: theme.colors.primary,
    alignSelf: "flex-end",
  },
  messageText: {
    color: theme.colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextOutbound: {
    color: theme.colors.text,
  },
  composer: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  feedRow: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  feedHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  feedBody: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    color: theme.colors.primary,
    fontSize: 12,
  },
  emptyCopy: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
