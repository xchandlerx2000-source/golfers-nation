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

export default function CommunityScreen() {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
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

  return (
    <Screen scroll>
      <SectionHeader title="Community" subtitle="Real golfers only. Discover profiles, follow your circle, and keep messages clean." />

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
              ? "Search real player profiles from the cloud account path."
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
          {socialDiscoveryResults.length ? (
            <View style={styles.list}>
              {socialDiscoveryResults.map((player) => (
                <View key={player.id} style={styles.personRow}>
                  <View style={styles.personCopy}>
                    <Text style={styles.personName}>{player.displayName}</Text>
                    <Text style={styles.personMeta}>
                      @{player.username} / {player.homeCourse || player.city || "Golf profile"}
                    </Text>
                    <Text style={styles.personDetail}>{player.stats?.recentFormSummary || player.bio || "Profile ready."}</Text>
                  </View>
                  <View style={styles.personActions}>
                    <AppButton label="View" size="compact" variant="secondary" onPress={() => router.push(`/community/profile/${player.id}`)} />
                    <AppButton label="Add" size="compact" variant="secondary" onPress={() => addFriendProfile(player.id)} />
                    <AppButton label="Follow" size="compact" variant="secondary" onPress={() => toggleFollowProfile(player.id)} />
                    <AppButton
                      label="Message"
                      size="compact"
                      variant="secondary"
                      onPress={async () => {
                        const conversationId = await openDirectConversation(player.id);
                        setActiveConversationId(conversationId);
                        setTab("messages");
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyCopy}>No golfer discovery results yet.</Text>
          )}
        </Card>
      ) : null}

      {tab === "circle" ? (
        <Card>
          <Text style={styles.sectionTitle}>Your golf circle</Text>
          <Text style={styles.sectionSummary}>{friends.length} friends / {following.length} following</Text>
          {socialCircle.length ? (
            <View style={styles.list}>
              {socialCircle.map((player) => (
                <View key={player.id} style={styles.personRow}>
                  <View style={styles.personCopy}>
                    <Text style={styles.personName}>{player.displayName}</Text>
                    <Text style={styles.personMeta}>
                      @{player.username} / {player.homeCourse || player.city || "Golf profile"}
                    </Text>
                    <Text style={styles.personDetail}>{player.stats?.recentFormSummary || player.bio || "Profile ready."}</Text>
                  </View>
                  <View style={styles.personActions}>
                    <AppButton label="View" size="compact" variant="secondary" onPress={() => router.push(`/community/profile/${player.id}`)} />
                    <AppButton
                      label={player.isFriend ? "Friends" : "Add"}
                      size="compact"
                      variant="secondary"
                      disabled={player.isFriend}
                      onPress={() => addFriendProfile(player.id)}
                    />
                    <AppButton
                      label={player.isFollowed ? "Following" : "Follow"}
                      size="compact"
                      variant="secondary"
                      onPress={() => toggleFollowProfile(player.id)}
                    />
                    <AppButton
                      label="Message"
                      size="compact"
                      variant="secondary"
                      onPress={async () => {
                        const conversationId = await openDirectConversation(player.id);
                        setActiveConversationId(conversationId);
                        setTab("messages");
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyCopy}>Search for golfers first. Nothing is seeded here.</Text>
          )}
        </Card>
      ) : null}

      {tab === "messages" ? (
        <Card>
          <Text style={styles.sectionTitle}>Direct messages</Text>
          <Text style={styles.sectionSummary}>
            {directInbox.length ? `${directInbox.length} conversations` : "Start from a real golfer card or your circle."}
          </Text>
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
                    <View style={styles.personCopy}>
                      <Text style={styles.personName}>{conversation.peer?.displayName || "Golfer"}</Text>
                      <Text style={styles.personMeta}>
                        @{conversation.peer?.username || "golfer"} / {conversation.messageCount} messages
                      </Text>
                      <Text style={styles.personDetail}>{conversation.latestMessage?.text || "No messages yet."}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
              {activeConversation ? (
                <View style={styles.thread}>
                  <Text style={styles.sectionTitle}>{activeConversation.peer?.displayName || "Conversation"}</Text>
                  <View style={styles.list}>
                    {(activeConversation.messages || []).slice(-8).map((message) => (
                      <View
                        key={message.id}
                        style={[
                          styles.messageBubble,
                          message.authorProfileId === currentProfile?.id ? styles.messageBubbleOutbound : styles.messageBubbleInbound,
                        ]}
                      >
                        <Text style={styles.messageText}>{message.text}</Text>
                      </View>
                    ))}
                  </View>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Send a quick golf message"
                    placeholderTextColor={theme.colors.textMuted}
                    value={messageDraft}
                    onChangeText={setMessageDraft}
                    multiline
                  />
                  <AppButton
                    label="Send"
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
                    <View style={styles.personCopy}>
                      <Text style={styles.personName}>{post.author?.displayName || "Golfer"}</Text>
                      <Text style={styles.personMeta}>@{post.author?.username || "golfer"}</Text>
                    </View>
                    <AppButton label="View" size="compact" variant="secondary" onPress={() => router.push(`/community/profile/${post.profileId}`)} />
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
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
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
  personActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  messageRow: {
    padding: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
  },
  messageRowActive: {
    borderColor: theme.colors.primary,
  },
  thread: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
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
  const params = useLocalSearchParams();
