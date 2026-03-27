import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
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
import { colors, spacing } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

function Section({ title, summary, open, onToggle, children }) {
  return (
    <Card>
      <Pressable onPress={onToggle} style={styles.sectionHeader}>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSummary}>{summary}</Text>
        </View>
        <Text style={styles.sectionToggle}>{open ? "-" : "+"}</Text>
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </Card>
  );
}

export default function CommunityScreen() {
  const activeRound = useAppStore((state) => state.activeRound);
  const recentInviteCode = useAppStore((state) => state.recentInviteCode);
  const currentUser = useAppStore((state) => state.currentUser);
  const socialProfiles = useAppStore((state) => state.socialProfiles);
  const socialPosts = useAppStore((state) => state.socialPosts);
  const socialConversations = useAppStore((state) => state.socialConversations);
  const socialSettings = useAppStore((state) => state.socialSettings);
  const toggleFollowProfile = useAppStore((state) => state.toggleFollowProfile);
  const addFriendProfile = useAppStore((state) => state.addFriendProfile);
  const createSocialPost = useAppStore((state) => state.createSocialPost);
  const sendDirectMessage = useAppStore((state) => state.sendDirectMessage);
  const [openSection, setOpenSection] = useState("join");
  const [postMessage, setPostMessage] = useState("");
  const [postLinkUrl, setPostLinkUrl] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [activeConversationId, setActiveConversationId] = useState("");

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
  const spotlight = friends[0] || socialCircle[0] || null;

  return (
    <Screen scroll>
      <SectionHeader title="Community" subtitle="Join live rounds, follow golfers, and keep the golf chat moving." />

      <Section
        title="Join"
        summary={recentInviteCode ? `Recent code ${recentInviteCode}` : "Enter a code and go straight into the round"}
        open={openSection === "join"}
        onToggle={() => setOpenSection((value) => (value === "join" ? "" : "join"))}
      >
        <AppButton label="Join Game" onPress={() => router.push("/round/join")} />
        {activeRound?.inviteCode ? (
          <AppButton label="Open Live Round" variant="secondary" onPress={() => router.push("/round/lobby")} />
        ) : null}
      </Section>

      <Section
        title="Clubhouse"
        summary={`${communityFeed.length} posts in your golf circle`}
        open={openSection === "clubhouse"}
        onToggle={() => setOpenSection((value) => (value === "clubhouse" ? "" : "clubhouse"))}
      >
        <View style={styles.composer}>
          <Text style={styles.composerTitle}>Share update</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Post a quick golf update."
            placeholderTextColor={colors.textMuted}
            value={postMessage}
            multiline
            onChangeText={setPostMessage}
          />
          <TextInput
            style={styles.input}
            placeholder="Optional link"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            value={postLinkUrl}
            onChangeText={setPostLinkUrl}
          />
          <AppButton
            label="Post"
            onPress={async () => {
              await createSocialPost({ message: postMessage, linkUrl: postLinkUrl });
              setPostMessage("");
              setPostLinkUrl("");
            }}
          />
        </View>
        <View style={styles.stack}>
          {communityFeed.map((post) => (
            <View key={post.id} style={styles.feedRow}>
              <View style={styles.feedHead}>
                <View style={styles.feedCopy}>
                  <Text style={styles.feedName}>{post.author?.displayName || "Golfer"}</Text>
                  <Text style={styles.feedMeta}>
                    @{post.author?.username || "golfer"} / {new Date(Number(post.createdAt || 0)).toLocaleString()}
                  </Text>
                </View>
                <Pressable onPress={() => router.push(`/community/profile/${post.profileId}`)}>
                  <Text style={styles.inlineAction}>View stats</Text>
                </Pressable>
              </View>
              <Text style={styles.feedBody}>{post.message}</Text>
              {post.courseName ? <Text style={styles.feedDetail}>{post.courseName}</Text> : null}
              {post.linkUrl ? <Text style={styles.feedLink}>{post.linkUrl}</Text> : null}
            </View>
          ))}
        </View>
      </Section>

      <Section
        title="Golf Circle"
        summary={`${friends.length} friends / ${following.length} following`}
        open={openSection === "friends"}
        onToggle={() => setOpenSection((value) => (value === "friends" ? "" : "friends"))}
      >
        {socialCircle.map((player) => (
          <View key={player.id} style={styles.personRow}>
            <View style={styles.personCopy}>
              <Text style={styles.personName}>{player.displayName}</Text>
              <Text style={styles.personMeta}>
                @{player.username} / {player.homeCourse || player.city || "Golf profile"}
              </Text>
              <Text style={styles.personDetail}>{player.stats?.recentFormSummary || player.bio}</Text>
            </View>
            <View style={styles.personActions}>
              <AppButton label="View" variant="secondary" onPress={() => router.push(`/community/profile/${player.id}`)} />
              <AppButton
                label={player.isFriend ? "Friends" : "Add Friend"}
                variant="secondary"
                disabled={player.isFriend}
                onPress={() => addFriendProfile(player.id)}
              />
              <AppButton
                label={player.isFollowed ? "Following" : "Follow"}
                variant="secondary"
                onPress={() => toggleFollowProfile(player.id)}
              />
            </View>
          </View>
        ))}
      </Section>

      <Section
        title="Messages"
        summary={directInbox.length ? `${directInbox.length} conversations` : "Start a chat with your golf circle"}
        open={openSection === "messages"}
        onToggle={() => setOpenSection((value) => (value === "messages" ? "" : "messages"))}
      >
        {directInbox.length ? (
          <>
            <View style={styles.stack}>
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
                <Text style={styles.composerTitle}>{activeConversation.peer?.displayName || "Conversation"}</Text>
                <View style={styles.stack}>
                  {(activeConversation.messages || []).slice(-6).map((message) => (
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
                  placeholder="Send a quick golf message."
                  placeholderTextColor={colors.textMuted}
                  value={messageDraft}
                  multiline
                  onChangeText={setMessageDraft}
                />
                <AppButton
                  label="Send"
                  onPress={async () => {
                    await sendDirectMessage(activeConversation.peerProfileId, messageDraft);
                    setMessageDraft("");
                  }}
                />
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.emptyCopy}>Add golfers to your circle to open direct messages.</Text>
        )}
      </Section>

      <Section
        title="Spotlight"
        summary={spotlight ? spotlight.displayName : "No spotlight golfer yet"}
        open={openSection === "spotlight"}
        onToggle={() => setOpenSection((value) => (value === "spotlight" ? "" : "spotlight"))}
      >
        {spotlight ? (
          <View style={styles.spotlight}>
            <Text style={styles.personName}>{spotlight.displayName}</Text>
            <Text style={styles.personMeta}>@{spotlight.username}</Text>
            <Text style={styles.personDetail}>{spotlight.bio}</Text>
            <Text style={styles.personDetail}>{spotlight.stats?.recentFormSummary || "Recent form pending."}</Text>
            <View style={styles.personActions}>
              <AppButton label="View Stats" variant="secondary" onPress={() => router.push(`/community/profile/${spotlight.id}`)} />
              <AppButton label="Message" onPress={() => {
                setOpenSection("messages");
                const conversation = directInbox.find((entry) => entry.peerProfileId === spotlight.id);
                if (conversation) {
                  setActiveConversationId(conversation.id);
                }
              }} />
            </View>
          </View>
        ) : (
          <Text style={styles.emptyCopy}>Your golf circle will surface here as it grows.</Text>
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  sectionSummary: {
    color: colors.textMuted,
    fontSize: 13,
  },
  sectionToggle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 24,
  },
  sectionBody: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  composer: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  composerTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  stack: {
    gap: spacing.sm,
  },
  feedRow: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  feedHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  feedCopy: {
    flex: 1,
    gap: 2,
  },
  feedName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  feedMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  inlineAction: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  feedBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  feedDetail: {
    color: colors.textMuted,
    fontSize: 12,
  },
  feedLink: {
    color: colors.primary,
    fontSize: 12,
  },
  personRow: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  personCopy: {
    gap: 2,
  },
  personName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  personMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  personDetail: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  personActions: {
    gap: spacing.sm,
  },
  messageRow: {
    padding: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  messageRowActive: {
    borderColor: colors.primary,
  },
  thread: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  messageBubble: {
    maxWidth: "88%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
  },
  messageBubbleInbound: {
    backgroundColor: colors.surfaceMuted,
    alignSelf: "flex-start",
  },
  messageBubbleOutbound: {
    backgroundColor: colors.primary,
    alignSelf: "flex-end",
  },
  messageText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  spotlight: {
    gap: spacing.sm,
  },
  emptyCopy: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
