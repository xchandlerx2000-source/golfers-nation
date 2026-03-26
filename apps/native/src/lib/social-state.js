import { summarizeCompletedRounds } from "./round-history";

const DAY_MS = 24 * 60 * 60 * 1000;

function uniqueIds(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

function createCurrentUserProfile(currentUser, completedRounds) {
  const stats = summarizeCompletedRounds(completedRounds || [], currentUser?.id);

  return {
    id: currentUser?.profileId || currentUser?.id || "native-profile-self",
    userId: currentUser?.id || null,
    displayName: currentUser?.displayName || currentUser?.name || "Golfer",
    username: currentUser?.username || "golfer",
    avatarLabel: currentUser?.avatarLabel || "GN",
    homeCourse: currentUser?.homeCourse || "",
    handicap: currentUser?.handicap ?? null,
    city: currentUser?.city || "",
    bio: "Playing more rounds, tracking better stats, and keeping the group chat in one place.",
    stats: {
      roundsPlayed: stats.roundsPlayed || 0,
      averageScore: stats.averageScore || null,
      bestRound: stats.bestRound || null,
      recentFormSummary: stats.recentFormSummary || "Round history builds here.",
    },
  };
}

function createPeerProfiles() {
  return [
    {
      id: "profile-maya",
      userId: null,
      displayName: "Maya Chen",
      username: "mayachen",
      avatarLabel: "MC",
      homeCourse: "Pebble Beach Golf Links",
      handicap: 5.2,
      city: "Monterey",
      bio: "Short game specialist who travels for marquee public tracks.",
      stats: {
        roundsPlayed: 14,
        averageScore: 78.9,
        bestRound: 74,
        recentFormSummary: "Two clean cards in the last three rounds.",
      },
    },
    {
      id: "profile-theo",
      userId: null,
      displayName: "Theo Grant",
      username: "theogrant",
      avatarLabel: "TG",
      homeCourse: "Shadow Creek Golf Course",
      handicap: 9.8,
      city: "Las Vegas",
      bio: "Reliable fairway finder who always wants a live game going.",
      stats: {
        roundsPlayed: 11,
        averageScore: 82.3,
        bestRound: 77,
        recentFormSummary: "Trending steady and closing rounds stronger.",
      },
    },
    {
      id: "profile-jordan",
      userId: null,
      displayName: "Jordan Wells",
      username: "jordanwells",
      avatarLabel: "JW",
      homeCourse: "Torrey Pines Golf Course",
      handicap: 7.1,
      city: "San Diego",
      bio: "Weekend match player who likes skins, side games, and quick join codes.",
      stats: {
        roundsPlayed: 9,
        averageScore: 79.8,
        bestRound: 75,
        recentFormSummary: "Fresh off a good scramble weekend.",
      },
    },
  ];
}

function createSeedPosts(currentProfile, peerProfiles) {
  const now = Date.now();
  return [
    {
      id: "post-self-1",
      profileId: currentProfile.id,
      message: "Locked in a round and keeping this one tidy. Looking for another live match later.",
      linkUrl: "",
      createdAt: now - 2 * 60 * 60 * 1000,
      courseName: currentProfile.homeCourse || "",
    },
    {
      id: "post-maya-1",
      profileId: peerProfiles[0].id,
      message: "Booked an early time for the weekend. Anybody else making the trip?",
      linkUrl: "https://www.pebblebeach.com/golf/pebble-beach-golf-links/",
      createdAt: now - DAY_MS,
      courseName: peerProfiles[0].homeCourse,
    },
    {
      id: "post-theo-1",
      profileId: peerProfiles[1].id,
      message: "Need one more for a money game this week. Fast players only.",
      linkUrl: "",
      createdAt: now - (DAY_MS + 3 * 60 * 60 * 1000),
      courseName: peerProfiles[1].homeCourse,
    },
  ];
}

function createSeedConversations(currentProfile, peerProfiles) {
  const now = Date.now();
  return [
    {
      id: `conversation-${currentProfile.id}-${peerProfiles[0].id}`,
      participantProfileIds: [currentProfile.id, peerProfiles[0].id],
      messages: [
        {
          id: "message-maya-1",
          authorProfileId: peerProfiles[0].id,
          text: "You in for a morning tee time if I grab one?",
          createdAt: now - 4 * 60 * 60 * 1000,
        },
        {
          id: "message-self-1",
          authorProfileId: currentProfile.id,
          text: "Yes. Send it if you find a good slot.",
          createdAt: now - 3 * 60 * 60 * 1000,
        },
      ],
    },
    {
      id: `conversation-${currentProfile.id}-${peerProfiles[2].id}`,
      participantProfileIds: [currentProfile.id, peerProfiles[2].id],
      messages: [
        {
          id: "message-jordan-1",
          authorProfileId: peerProfiles[2].id,
          text: "Join code is live if you want in after work.",
          createdAt: now - 90 * 60 * 1000,
        },
      ],
    },
  ];
}

function mergeProfiles(currentProfile, storedProfiles) {
  const peerProfiles = createPeerProfiles();
  const merged = [currentProfile, ...(Array.isArray(storedProfiles) ? storedProfiles : []), ...peerProfiles];
  const byId = new Map();

  merged.forEach((profile) => {
    if (!profile?.id) {
      return;
    }

    byId.set(profile.id, {
      ...byId.get(profile.id),
      ...profile,
      stats: {
        ...(byId.get(profile.id)?.stats || {}),
        ...(profile.stats || {}),
      },
    });
  });

  return [...byId.values()];
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
  const profiles = mergeProfiles(currentProfile, socialProfiles);
  const peerProfiles = profiles.filter((profile) => profile.id !== currentProfile.id);
  const settings = {
    followedProfileIds: uniqueIds(socialSettings?.followedProfileIds?.length
      ? socialSettings.followedProfileIds
      : peerProfiles.slice(0, 2).map((profile) => profile.id)),
    friendProfileIds: uniqueIds(socialSettings?.friendProfileIds?.length
      ? socialSettings.friendProfileIds
      : peerProfiles.slice(0, 2).map((profile) => profile.id)),
    pendingFriendProfileIds: uniqueIds(socialSettings?.pendingFriendProfileIds),
  };

  const posts = (Array.isArray(socialPosts) && socialPosts.length
    ? socialPosts
    : createSeedPosts(currentProfile, peerProfiles)).filter((post) => post?.id && post?.profileId);

  const conversations = (Array.isArray(socialConversations) && socialConversations.length
    ? socialConversations
    : createSeedConversations(currentProfile, peerProfiles))
    .filter((conversation) => conversation?.id && Array.isArray(conversation.participantProfileIds));

  return {
    socialProfiles: profiles,
    socialPosts: posts,
    socialConversations: conversations,
    socialSettings: settings,
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
