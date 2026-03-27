import { summarizeCompletedRounds } from "./round-history";

const LEGACY_SEEDED_PROFILE_IDS = new Set([
  "profile-maya",
  "profile-theo",
  "profile-jordan",
]);

function toText(value, fallback = "") {
  const text = String(value ?? fallback).trim();
  return text || fallback;
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeUsername(value = "", fallback = "golfer") {
  return toText(value, fallback).replace(/^@/, "") || fallback;
}

function uniqueIds(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

function normalizeProfile(profile = {}) {
  return {
    ...profile,
    id: toText(profile.id),
    userId: profile.userId ? toText(profile.userId) : null,
    displayName: toText(profile.displayName || profile.name, "Golfer"),
    username: normalizeUsername(profile.username),
    avatarLabel: toText(profile.avatarLabel, "GN"),
    homeCourse: toText(profile.homeCourse),
    handicap: profile.handicap === null || profile.handicap === undefined
      ? null
      : (Number.isFinite(Number(profile.handicap)) ? Number(profile.handicap) : null),
    city: toText(profile.city),
    bio: toText(profile.bio),
    stats: {
      roundsPlayed: toNumber(profile?.stats?.roundsPlayed, 0),
      averageScore: Number.isFinite(Number(profile?.stats?.averageScore)) ? Number(profile.stats.averageScore) : null,
      bestRound: Number.isFinite(Number(profile?.stats?.bestRound)) ? Number(profile.stats.bestRound) : null,
      recentFormSummary: toText(profile?.stats?.recentFormSummary, "Round history builds here."),
    },
  };
}

function normalizePost(post = {}) {
  return {
    ...post,
    id: toText(post.id),
    profileId: toText(post.profileId),
    message: toText(post.message),
    linkUrl: toText(post.linkUrl),
    createdAt: toNumber(post.createdAt, Date.now()),
    courseName: toText(post.courseName),
  };
}

function normalizeConversationMessage(message = {}) {
  return {
    ...message,
    id: toText(message.id),
    authorProfileId: toText(message.authorProfileId),
    text: toText(message.text),
    createdAt: toNumber(message.createdAt, Date.now()),
  };
}

function normalizeConversation(conversation = {}) {
  return {
    ...conversation,
    id: toText(conversation.id),
    participantProfileIds: uniqueIds(conversation.participantProfileIds).map((value) => toText(value)).filter(Boolean),
    messages: (Array.isArray(conversation.messages) ? conversation.messages : [])
      .map(normalizeConversationMessage)
      .filter((message) => message.id && message.authorProfileId && message.text),
  };
}

function mergeProfiles(...groups) {
  const byId = new Map();

  groups.flat().forEach((profile) => {
    const normalized = normalizeProfile(profile);
    if (!normalized?.id) {
      return;
    }

    byId.set(normalized.id, {
      ...byId.get(normalized.id),
      ...normalized,
      stats: {
        ...(byId.get(normalized.id)?.stats || {}),
        ...(normalized.stats || {}),
      },
    });
  });

  return [...byId.values()];
}

function createCurrentUserProfile(currentUser = {}, completedRounds = []) {
  if (!currentUser?.id && !currentUser?.profileId) {
    return null;
  }

  const stats = summarizeCompletedRounds(completedRounds, currentUser?.id);

  return normalizeProfile({
    id: currentUser?.profileId || currentUser?.id || "native-profile-self",
    userId: currentUser?.id || null,
    displayName: currentUser?.displayName || currentUser?.name || "Golfer",
    username: currentUser?.username || "golfer",
    avatarLabel: currentUser?.avatarLabel || "GN",
    homeCourse: currentUser?.homeCourse || "",
    handicap: currentUser?.handicap ?? null,
    city: currentUser?.city || "",
    bio: currentUser?.bio || "",
    stats: {
      roundsPlayed: stats.roundsPlayed || 0,
      averageScore: stats.averageScore || null,
      bestRound: stats.bestRound || null,
      recentFormSummary: stats.recentFormSummary || "Round history builds here.",
    },
  });
}

export function createSocialProfileFromDirectoryRecord(record = {}) {
  return normalizeProfile({
    id: record.id || record.profileId,
    userId: record.userId || record.user_id || null,
    displayName: record.displayName || record.display_name || record.username || "Golfer",
    username: record.username,
    avatarLabel: record.avatarLabel || record.avatar_label || "GN",
    homeCourse: record.homeCourse || record.home_course || "",
    handicap: record.handicap,
    bio: record.bio || "",
    stats: {
      roundsPlayed: record.roundsPlayed ?? record.rounds_played ?? 0,
      averageScore: record.averageScore ?? record.average_score ?? null,
      bestRound: record.bestRound ?? record.best_round ?? null,
      recentFormSummary: record.recentFormSummary || record.recent_form_summary || "Round history builds here.",
    },
  });
}

export function mergeSocialProfiles(existingProfiles = [], incomingProfiles = [], currentProfileId = "") {
  return mergeProfiles(
    (Array.isArray(existingProfiles) ? existingProfiles : []).filter(Boolean),
    (Array.isArray(incomingProfiles) ? incomingProfiles : [])
      .map(createSocialProfileFromDirectoryRecord)
      .filter((profile) => profile.id && profile.id !== currentProfileId)
  );
}

export function normalizeSocialState({
  currentUser,
  completedRounds,
  socialProfiles,
  socialPosts,
  socialConversations,
  socialSettings,
}) {
  const currentProfile = createCurrentUserProfile(currentUser || {}, completedRounds || []);
  const currentProfileId = currentProfile?.id || "";
  const profiles = mergeProfiles(
    currentProfile ? [currentProfile] : [],
    (Array.isArray(socialProfiles) ? socialProfiles : []).filter((profile) =>
      profile?.id !== currentProfileId && !LEGACY_SEEDED_PROFILE_IDS.has(String(profile?.id || ""))
    )
  );

  return {
    socialProfiles: profiles,
    socialPosts: (Array.isArray(socialPosts) ? socialPosts : [])
      .map(normalizePost)
      .filter((post) => post.id && post.profileId && post.message && !LEGACY_SEEDED_PROFILE_IDS.has(post.profileId)),
    socialConversations: (Array.isArray(socialConversations) ? socialConversations : [])
      .map(normalizeConversation)
      .filter((conversation) =>
        conversation?.id
        && Array.isArray(conversation.participantProfileIds)
        && !conversation.participantProfileIds.some((profileId) => LEGACY_SEEDED_PROFILE_IDS.has(String(profileId || "")))
      ),
    socialSettings: {
      followedProfileIds: uniqueIds(socialSettings?.followedProfileIds),
      friendProfileIds: uniqueIds(socialSettings?.friendProfileIds),
      pendingFriendProfileIds: uniqueIds(socialSettings?.pendingFriendProfileIds),
    },
  };
}

export function buildCommunityFeed({ currentUser, socialProfiles, socialPosts, socialSettings }) {
  const currentProfileId = currentUser?.profileId || currentUser?.id;
  const visibleIds = new Set([
    currentProfileId,
    ...uniqueIds(socialSettings?.friendProfileIds),
    ...uniqueIds(socialSettings?.followedProfileIds),
  ]);
  const profileMap = new Map((socialProfiles || []).map((profile) => [profile.id, profile]));

  return (socialPosts || [])
    .filter((post) => visibleIds.has(post.profileId))
    .map((post) => {
      const profile = profileMap.get(post.profileId);
      return {
        ...post,
        author: profile || null,
        isCurrentUser: post.profileId === currentProfileId,
      };
    })
    .sort((left, right) => Number(right.createdAt || 0) - Number(left.createdAt || 0));
}

export function buildSocialCircle({ currentUser, socialProfiles, socialSettings }) {
  const currentProfileId = currentUser?.profileId || currentUser?.id;
  const friendIds = new Set(uniqueIds(socialSettings?.friendProfileIds));
  const followedIds = new Set(uniqueIds(socialSettings?.followedProfileIds));

  return (socialProfiles || [])
    .filter((profile) => profile.id !== currentProfileId)
    .map((profile) => ({
      ...profile,
      isFriend: friendIds.has(profile.id),
      isFollowed: followedIds.has(profile.id),
    }))
    .sort((left, right) => {
      if (left.isFriend !== right.isFriend) {
        return left.isFriend ? -1 : 1;
      }
      if (left.isFollowed !== right.isFollowed) {
        return left.isFollowed ? -1 : 1;
      }
      return String(left.displayName || "").localeCompare(String(right.displayName || ""));
    });
}

export function buildDirectInbox({ currentUser, socialProfiles, socialConversations, socialSettings }) {
  const currentProfileId = currentUser?.profileId || currentUser?.id;
  const circle = buildSocialCircle({ currentUser, socialProfiles, socialSettings });
  const profileMap = new Map(circle.map((profile) => [profile.id, profile]));

  return (socialConversations || [])
    .map((conversation) => {
      const peerProfileId = (conversation.participantProfileIds || []).find((profileId) => profileId !== currentProfileId) || null;
      const peer = profileMap.get(peerProfileId) || (socialProfiles || []).find((profile) => profile.id === peerProfileId) || null;
      const messages = [...(conversation.messages || [])].sort((left, right) => Number(left.createdAt || 0) - Number(right.createdAt || 0));
      const latestMessage = messages[messages.length - 1] || null;
      return {
        ...conversation,
        peerProfileId,
        peer,
        latestMessage,
        messageCount: messages.length,
      };
    })
    .filter((conversation) => conversation.peerProfileId)
    .sort((left, right) => Number(right.latestMessage?.createdAt || 0) - Number(left.latestMessage?.createdAt || 0));
}

export function buildSocialProfilePreview({ currentUser, socialProfiles, socialSettings, profileId }) {
  const profile = (socialProfiles || []).find((entry) => entry.id === profileId) || null;
  if (!profile) {
    return null;
  }

  const currentProfileId = currentUser?.profileId || currentUser?.id;
  const friendIds = new Set(uniqueIds(socialSettings?.friendProfileIds));
  const followedIds = new Set(uniqueIds(socialSettings?.followedProfileIds));

  return {
    ...profile,
    isCurrentUser: profile.id === currentProfileId,
    isFriend: friendIds.has(profile.id),
    isFollowed: followedIds.has(profile.id),
  };
}

export function toggleFollowedProfileIds(settings, profileId) {
  const followedProfileIds = new Set(uniqueIds(settings?.followedProfileIds));
  if (followedProfileIds.has(profileId)) {
    followedProfileIds.delete(profileId);
  } else {
    followedProfileIds.add(profileId);
  }

  return {
    ...settings,
    followedProfileIds: [...followedProfileIds],
  };
}

export function addFriendProfileId(settings, profileId) {
  const friendProfileIds = new Set(uniqueIds(settings?.friendProfileIds));
  const followedProfileIds = new Set(uniqueIds(settings?.followedProfileIds));
  friendProfileIds.add(profileId);
  followedProfileIds.add(profileId);

  return {
    ...settings,
    friendProfileIds: [...friendProfileIds],
    followedProfileIds: [...followedProfileIds],
    pendingFriendProfileIds: uniqueIds(settings?.pendingFriendProfileIds).filter((id) => id !== profileId),
  };
}

export function createSocialPostRecord(currentUser, input) {
  return {
    id: `post-${Date.now()}`,
    profileId: currentUser?.profileId || currentUser?.id,
    message: String(input?.message || "").trim(),
    linkUrl: String(input?.linkUrl || "").trim(),
    createdAt: Date.now(),
    courseName: currentUser?.homeCourse || "",
  };
}

export function upsertDirectConversationMessage(conversations, currentUser, peerProfileId, text) {
  const currentProfileId = currentUser?.profileId || currentUser?.id;
  const trimmedText = String(text || "").trim();
  if (!trimmedText || !currentProfileId || !peerProfileId) {
    return Array.isArray(conversations) ? conversations : [];
  }

  const nextMessage = {
    id: `message-${Date.now()}`,
    authorProfileId: currentProfileId,
    text: trimmedText,
    createdAt: Date.now(),
  };

  const nextConversations = [...(Array.isArray(conversations) ? conversations : [])];
  const index = nextConversations.findIndex((conversation) => {
    const ids = uniqueIds(conversation?.participantProfileIds);
    return ids.includes(currentProfileId) && ids.includes(peerProfileId);
  });

  if (index >= 0) {
    const conversation = nextConversations[index];
    nextConversations[index] = {
      ...conversation,
      messages: [...(conversation.messages || []), nextMessage],
    };
    return nextConversations;
  }

  return [
    {
      id: `conversation-${currentProfileId}-${peerProfileId}`,
      participantProfileIds: [currentProfileId, peerProfileId],
      messages: [nextMessage],
    },
    ...nextConversations,
  ];
}

export function ensureDirectConversation(conversations, currentUser, peerProfileId) {
  const currentProfileId = currentUser?.profileId || currentUser?.id;
  const cleanedPeerProfileId = String(peerProfileId || "").trim();
  if (!currentProfileId || !cleanedPeerProfileId) {
    return {
      conversationId: "",
      conversations: Array.isArray(conversations) ? conversations : [],
    };
  }

  const nextConversations = [...(Array.isArray(conversations) ? conversations : [])];
  const existing = nextConversations.find((conversation) => {
    const ids = uniqueIds(conversation?.participantProfileIds);
    return ids.includes(currentProfileId) && ids.includes(cleanedPeerProfileId);
  });

  if (existing?.id) {
    return {
      conversationId: existing.id,
      conversations: nextConversations,
    };
  }

  const conversationId = `conversation-${currentProfileId}-${cleanedPeerProfileId}`;
  nextConversations.unshift({
    id: conversationId,
    participantProfileIds: [currentProfileId, cleanedPeerProfileId],
    messages: [],
  });

  return {
    conversationId,
    conversations: nextConversations,
  };
}
