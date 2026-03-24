import { createActivity, createGearItem, createPlayerProfile, createRound, createTournament } from "../domain/factories.js";
import { getPendingRoundEvents } from "../domain/round-sync.js";
import { createIntegrationSettings, createSpotifySessionState } from "../integrations/spotify-service.js";
import { applyHoleUpdate, getParticipantTotals } from "../domain/scoring.js";
import { TESTER_DEFAULT_SUBSCRIPTION_TIER } from "../config.js";
import { getDefaultRoundSetup as getDefaultCourseRoundSetup } from "./course-service.js";
import { average, cloneData } from "../utils/formatters.js";

const DEFAULT_PASSWORD = "fairway123";

function normalizeUsername(value) {
  const base = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
  return base ? `@${base}` : "@golfer";
}

function avatarFromName(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "GN";
}

function createSubscription(tier = "free") {
  return {
    tier,
    planName: tier === "premium" ? "Premium" : "Free",
    status: "active",
    billingReady: true,
    renewalAt: null,
    trialAvailable: tier !== "premium",
  };
}

function createPrivacySettings(overrides = {}) {
  return {
    showHomeCourse: true,
    showHandicap: true,
    showBio: true,
    showRecentForm: true,
    showHeadToHead: false,
    showEmail: false,
    profileVisibility: "friends",
    ...cloneData(overrides || {}),
  };
}

function createAppearanceSettings(overrides = {}) {
  return {
    colorMode: "system",
    themeId: "forest",
    textScale: "standard",
    compactMode: false,
    contrastMode: "standard",
    ...cloneData(overrides || {}),
  };
}

function createSocialSettings(overrides = {}) {
  const next = cloneData(overrides || {});
  const followedProfileIds = Array.isArray(next.followedProfileIds)
    ? [...new Set(next.followedProfileIds.filter(Boolean))]
    : [];
  const friendProfileIds = Array.isArray(next.friendProfileIds)
    ? [...new Set(next.friendProfileIds.filter(Boolean))]
    : [];
  const pendingFriendProfileIds = Array.isArray(next.pendingFriendProfileIds)
    ? [...new Set(next.pendingFriendProfileIds.filter(Boolean))]
    : [];
  return {
    ...next,
    handles: {
      instagram: "",
      x: "",
      ghin: "",
      ...(next.handles || {}),
    },
    followedProfileIds,
    friendProfileIds,
    pendingFriendProfileIds,
    allowFriendConnections: next.allowFriendConnections !== false,
    allowProfileSharing: next.allowProfileSharing !== false,
    allowRoundSharing: next.allowRoundSharing !== false,
    inviteFriendsReady: next.inviteFriendsReady !== false,
  };
}

function createIntegrationsState(overrides = {}) {
  return createIntegrationSettings(overrides || {});
}

function formatRecentFormLabel(result) {
  if (!result) {
    return "First round pending";
  }

  return `${result.courseName} ${result.toPar > 0 ? `+${result.toPar}` : result.toPar}`;
}

function createDefaultRoundSetup() {
  return getDefaultCourseRoundSetup();
}

function buildAccountSummary(account, workspace) {
  const completedRounds = (workspace?.rounds || [])
    .filter((round) => round.status === "completed")
    .map((round) => {
      const participant = round.players.find((entry) => entry.userId === account.id || entry.profileId === account.profileId);
      if (!participant) {
        return null;
      }

      const totals = getParticipantTotals(round, participant.id);
      if (!totals.holesPlayed) {
        return null;
      }

      return {
        courseName: round.courseName,
        completedAt: round.completedAt || round.updatedAt || round.createdAt,
        totalStrokes: totals.totalStrokes,
        toPar: totals.toPar,
      };
    })
    .filter(Boolean)
    .sort((left, right) => (right.completedAt || 0) - (left.completedAt || 0));

  return {
    roundsPlayed: completedRounds.length,
    averageScore: average(completedRounds.map((entry) => entry.totalStrokes)),
    bestRound: completedRounds.length ? Math.min(...completedRounds.map((entry) => entry.totalStrokes)) : null,
    recentFormSummary: formatRecentFormLabel(completedRounds[0] || null),
  };
}

function syncAccountSummary(account, workspace) {
  const summary = buildAccountSummary(account, workspace);
  account.roundsPlayed = summary.roundsPlayed;
  account.averageScore = summary.averageScore;
  account.bestRound = summary.bestRound;
  account.recentFormSummary = summary.recentFormSummary;
  return summary;
}

function createSeedProfile(overrides) {
  const profile = createPlayerProfile(overrides);
  if (overrides?.id) {
    profile.id = overrides.id;
  }
  return profile;
}

function profilePlayer(profile) {
  return {
    profileId: profile.id,
    userId: profile.userId,
    displayName: profile.publicProfile.displayName,
    username: profile.publicProfile.username,
    avatarLabel: profile.publicProfile.avatarLabel,
  };
}

function createSelfProfile(account) {
  return createSeedProfile({
    id: account.profileId,
    userId: account.id,
    displayName: account.displayName,
    username: account.username,
    avatarLabel: account.avatarLabel,
    email: account.email,
    homeCourse: account.homeCourse,
    handicap: account.handicap,
    bio: account.bio,
    createdAt: account.createdAt,
    premiumStatus: account.subscription.tier,
    privacy: createPrivacySettings(account.privacy),
  });
}

function createPeerProfiles() {
  return [
    createSeedProfile({
      id: "profile-maya",
      displayName: "Maya Chen",
      username: "@mayachen",
      avatarLabel: "MC",
      homeCourse: "National Pines",
      handicap: 5.2,
      bio: "Strong iron player and dependable weekend match partner.",
      publicStats: {
        roundsPlayed: 14,
        averageScore: 78.9,
        bestRound: 74,
        recentFormSummary: "Two top rounds in the last three cards",
      },
    }),
    createSeedProfile({
      id: "profile-theo",
      displayName: "Theo Grant",
      username: "@theogrant",
      avatarLabel: "TG",
      homeCourse: "Shadow Ridge",
      handicap: 9.8,
      bio: "Steady fairway finder with a strong closing stretch.",
      publicStats: {
        roundsPlayed: 11,
        averageScore: 82.3,
        bestRound: 77,
        recentFormSummary: "Trending steady across the last two weeks",
      },
    }),
    createSeedProfile({
      id: "profile-jordan",
      displayName: "Jordan Wells",
      username: "@jordanwells",
      avatarLabel: "JW",
      homeCourse: "Prairie Lake",
      handicap: 7.1,
      bio: "Competitive group golfer who loves live leaderboards.",
      publicStats: {
        roundsPlayed: 9,
        averageScore: 79.8,
        bestRound: 75,
        recentFormSummary: "Fresh off a strong scramble weekend",
      },
    }),
  ];
}

function seedRoundPerformance(round, participantId, adjustments) {
  round.holes.forEach((hole, index) => {
    const delta = adjustments[index];
    const strokes = hole.par + delta;
    const gir = delta <= 0;
    const fairwayHit = hole.par > 3 ? delta <= 0 : false;
    const penalties = delta > 0 && hole.par > 3 && index % 5 === 0 ? 1 : 0;
    const upAndDown = !gir && (delta <= 0 || index % 4 === 0);
    const sandSave = upAndDown && !gir && hole.par !== 5 && index % 6 === 0;

    applyHoleUpdate(round, hole.number, participantId, {
      strokes,
      putts: Math.max(1, Math.min(3, 2 + Math.sign(delta))),
      penalties,
      fairwayHit,
      gir,
      upAndDown: sandSave ? true : upAndDown,
      sandSave,
    });
  });
}

function createCompletedSeedRound({ currentUser, courseName, weather, mode, players, localAdjustments, remotePatterns }) {
  const round = createRound({
    currentUser,
    courseName,
    teeBox: "Blue",
    weather,
    mode,
    players,
    status: "completed",
  });

  const participants = round.mode === "stroke" ? round.players : round.sides;
  participants.forEach((participant, index) => {
    const adjustments = index === 0 ? localAdjustments : remotePatterns[(index - 1) % remotePatterns.length];
    seedRoundPerformance(round, participant.id, adjustments);
  });
  round.completedAt = Date.now() - 1000 * 60 * 60 * (participants.length + 12);
  round.updatedAt = round.completedAt;
  return round;
}

function createSeededWorkspace(account, options = {}) {
  const profiles = [createSelfProfile(account), ...createPeerProfiles()];
  const premiumMode = options.premiumMode || "stroke";
  const activeRound = createRound({
    currentUser: account,
    courseName: premiumMode === "stroke" ? "National Pines" : "North Point",
    teeBox: "Blue",
    weather: premiumMode === "stroke" ? "Windy 68F" : "Clear 70F",
    mode: premiumMode,
    players: premiumMode === "scramble"
      ? [profiles[0], profiles[3], profiles[1], profiles[2]].map(profilePlayer)
      : profiles.map(profilePlayer),
  });

  const completedStroke = createCompletedSeedRound({
    currentUser: account,
    courseName: "Shadow Ridge",
    weather: "Clear 72F",
    mode: "stroke",
    players: profiles.slice(0, 3).map(profilePlayer),
    localAdjustments: [0, -1, 0, 1, 0, -1, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0, -1, 0],
    remotePatterns: [
      [1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 0, 0, 1, 0, 0, 1, -1, 0],
      [0, 0, 1, 0, 0, -1, 0, 1, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0],
    ],
  });

  const completedScramble = createCompletedSeedRound({
    currentUser: account,
    courseName: "Prairie Lake",
    weather: "Warm 76F",
    mode: "scramble",
    players: [profiles[0], profiles[3], profiles[1], profiles[2]].map(profilePlayer),
    localAdjustments: [0, -1, -1, 0, 0, -1, 0, 0, -1, 0, -1, 0, 0, 0, -1, 0, -1, 0],
    remotePatterns: [[1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]],
  });

  return {
    profiles,
    rounds: [activeRound, completedStroke, completedScramble],
    groups: [],
    tournaments: [
      createTournament({
        name: "Great Lakes Weekend Cup",
        courseName: "National Pines",
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8).toISOString(),
        mode: "stroke",
        fieldSize: 24,
        status: "open",
      }),
      createTournament({
        name: "Twilight Match Series",
        courseName: "North Point",
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
        mode: account.subscription.tier === "premium" ? "match" : "stroke",
        fieldSize: 8,
        status: "planning",
      }),
    ],
    gear: {
      items: [
        createGearItem({ category: "club", name: "TSR3 Driver", notes: "Trusted fairway finder", packed: true }),
        createGearItem({ category: "club", name: "56 Degree Wedge", notes: "Preferred bunker club", packed: true }),
        createGearItem({ category: "apparel", name: "Wind shell", notes: "Use for gusty afternoon rounds", packed: false, weatherUse: "wind" }),
        createGearItem({ category: "accessory", name: "Rangefinder", notes: "Battery charged", packed: true }),
      ],
    },
    social: {
      activity: [
        createActivity({
          type: "profile",
          message: `${account.displayName}'s account is linked to profile, stats, and round history.`,
        }),
        createActivity({
          type: "sync",
          message: "Invite code and offline-first sync are the primary phase-1 multiplayer path.",
        }),
        createActivity({
          type: "premium",
          message: account.subscription.tier === "premium"
            ? "Premium account access is active for advanced modes, stats, and tournament tools."
            : "Free account access is active. Premium tools stay cleanly locked until upgrade.",
        }),
      ],
    },
    userSession: {
      activeRoundId: activeRound.id,
      selectedHole: 1,
      summaryRoundId: completedStroke.id,
      selectedProfileId: account.profileId,
      roundSetup: createDefaultRoundSetup(),
    },
  };
}

export function createEmptyWorkspace(account) {
  const selfProfile = createSelfProfile(account);

  return {
    profiles: [selfProfile],
    rounds: [],
    groups: [],
    tournaments: [],
    gear: { items: [] },
    social: {
      activity: [
        createActivity({
          type: "profile",
          message: `${account.displayName} created a Golfers Nation account.`,
        }),
      ],
    },
    userSession: {
      activeRoundId: null,
      selectedHole: 1,
      summaryRoundId: null,
      selectedProfileId: account.profileId,
      roundSetup: createDefaultRoundSetup(),
    },
  };
}

function moveAccountVaultEntry(draft, previousId, nextId) {
  if (!draft.accountVault?.[previousId] || previousId === nextId) {
    return;
  }

  draft.accountVault[nextId] = draft.accountVault[previousId];
  delete draft.accountVault[previousId];
}

function remapWorkspaceIdentity(workspace, previousId, nextAccount) {
  if (!workspace || previousId === nextAccount.id) {
    return;
  }

  const previousProfileId = `profile-${String(previousId).replace(/^user-/, "")}`;
  const nextProfileId = nextAccount.profileId;
  const nextName = nextAccount.displayName;
  const nextUsername = nextAccount.username;
  const nextAvatarLabel = nextAccount.avatarLabel;

  (workspace.profiles || []).forEach((profile) => {
    if (profile.userId === previousId || profile.id === previousProfileId) {
      profile.userId = nextAccount.id;
      profile.id = nextProfileId;
      profile.publicProfile = {
        ...(profile.publicProfile || {}),
        displayName: nextName,
        username: nextUsername,
        avatarLabel: nextAvatarLabel,
      };
    }
  });

  (workspace.rounds || []).forEach((round) => {
    (round.players || []).forEach((player) => {
      if (player.userId === previousId || player.profileId === previousProfileId) {
        player.userId = nextAccount.id;
        player.profileId = nextProfileId;
        player.name = nextName;
        player.displayName = nextName;
        player.username = nextUsername;
        player.avatarLabel = nextAvatarLabel;
      }
    });
  });

  (workspace.groups || []).forEach((group) => {
    (group.members || []).forEach((member) => {
      if (member.userId === previousId || member.profileId === previousProfileId) {
        member.userId = nextAccount.id;
        member.profileId = nextProfileId;
        member.displayName = nextName;
        member.username = nextUsername;
        member.avatarLabel = nextAvatarLabel;
      }
    });
  });

  if (workspace.userSession?.selectedProfileId === previousProfileId) {
    workspace.userSession.selectedProfileId = nextProfileId;
  }
}

function sanitizeCurrentUser(account) {
  return {
    id: account.id,
    name: account.name,
    displayName: account.displayName,
    username: account.username,
    profileId: account.profileId,
    avatarLabel: account.avatarLabel,
    avatar: account.avatarLabel,
    avatarUrl: account.avatarUrl || "",
    email: account.email,
    provider: account.provider,
    providerType: account.provider,
    homeCourse: account.homeCourse,
    handicap: account.handicap,
    handedness: account.handedness || "",
    bio: account.bio,
    seasonGoal: account.seasonGoal,
    city: account.city,
    createdAt: account.createdAt,
    premiumStatus: account.subscription.tier,
    privacy: createPrivacySettings(account.privacy),
    appearance: createAppearanceSettings(account.appearance),
    social: createSocialSettings(account.social),
    integrations: createIntegrationsState(account.integrations),
    seededDemo: Boolean(account.seededDemo),
    subscription: cloneData(account.subscription),
    roundsPlayed: account.roundsPlayed || 0,
    averageScore: account.averageScore ?? null,
    bestRound: account.bestRound ?? null,
    recentFormSummary: account.recentFormSummary || "First round pending",
  };
}

function mergeCurrentUserIntoAccount(account, currentUser, auth) {
  account.name = currentUser.name;
  account.displayName = currentUser.displayName || currentUser.name;
  account.username = currentUser.username;
  account.profileId = currentUser.profileId;
  account.avatarLabel = currentUser.avatarLabel;
  account.avatarUrl = currentUser.avatarUrl || account.avatarUrl || "";
  account.email = currentUser.email;
  account.provider = currentUser.provider || currentUser.providerType || auth?.provider || account.provider;
  account.homeCourse = currentUser.homeCourse;
  account.handicap = currentUser.handicap;
  account.handedness = currentUser.handedness || "";
  account.bio = currentUser.bio;
  account.seasonGoal = currentUser.seasonGoal;
  account.city = currentUser.city;
  account.createdAt = currentUser.createdAt;
  account.privacy = createPrivacySettings(currentUser.privacy || {});
  account.appearance = createAppearanceSettings(currentUser.appearance || account.appearance);
  account.social = createSocialSettings(currentUser.social || account.social);
  account.integrations = createIntegrationsState(currentUser.integrations || account.integrations);
  account.subscription = cloneData(currentUser.subscription || account.subscription);
  account.premiumStatus = account.subscription.tier;
  account.roundsPlayed = currentUser.roundsPlayed ?? account.roundsPlayed ?? 0;
  account.averageScore = currentUser.averageScore ?? account.averageScore ?? null;
  account.bestRound = currentUser.bestRound ?? account.bestRound ?? null;
  account.recentFormSummary = currentUser.recentFormSummary || account.recentFormSummary || "First round pending";
}

function getUserSession(state) {
  return {
    activeRoundId: state.session.activeRoundId || null,
    selectedHole: state.session.selectedHole || 1,
    summaryRoundId: state.session.summaryRoundId || null,
    selectedProfileId: state.session.selectedProfileId || state.currentUser?.profileId || null,
    roundSetup: {
      courseQuery: state.session.roundSetup?.courseQuery || "",
      selectedCourseId: state.session.roundSetup?.selectedCourseId || "",
      selectedTeeBoxId: state.session.roundSetup?.selectedTeeBoxId || "",
      selectedHoleCount: Number(state.session.roundSetup?.selectedHoleCount || 18),
    },
  };
}

export function createAccountRecord({
  id,
  displayName,
  email,
  password = DEFAULT_PASSWORD,
  provider = "email",
  tier = "free",
  seededDemo = false,
  city = "Chicago, IL",
  homeCourse = "",
  handicap = null,
  handedness = "",
  bio = "",
  seasonGoal = "Track better golf all season",
  createdAt = Date.now(),
  appearance = {},
  social = {},
  integrations = {},
}) {
  const safeDisplayName = String(displayName || "").trim() || "Golfer";
  const username = normalizeUsername(safeDisplayName);
  const avatarLabel = avatarFromName(safeDisplayName);
  const safeId = id || `user-${username.replace("@", "")}-${Date.now().toString(36)}`;

  return {
    id: safeId,
    name: safeDisplayName,
    displayName: safeDisplayName,
    username,
    profileId: `profile-${safeId.replace(/^user-/, "")}`,
    avatarLabel,
    avatarUrl: "",
    email: String(email || "").trim().toLowerCase(),
    password,
    provider,
    providerType: provider,
    seededDemo,
    city,
    homeCourse,
    handicap,
    handedness,
    bio,
    seasonGoal,
    createdAt,
    privacy: createPrivacySettings(),
    appearance: createAppearanceSettings(appearance),
    social: createSocialSettings(social),
    integrations: createIntegrationsState(integrations),
    subscription: createSubscription(tier),
    premiumStatus: tier,
    roundsPlayed: 0,
    averageScore: null,
    bestRound: null,
    recentFormSummary: "First round pending",
  };
}

export function ensureAccountWorkspace(draft, userId) {
  const account = draft.accounts?.find((entry) => entry.id === userId);
  if (!account) {
    return null;
  }

  if (!draft.accountVault?.[userId]) {
    draft.accountVault = {
      ...(draft.accountVault || {}),
      [userId]: createEmptyWorkspace(account),
    };
  }

  syncAccountSummary(account, draft.accountVault[userId]);
  return draft.accountVault[userId];
}

export function replaceAccountWorkspace(draft, userId, workspace = null) {
  const account = draft.accounts?.find((entry) => entry.id === userId);
  if (!account) {
    return null;
  }

  const fallback = createEmptyWorkspace(account);
  draft.accountVault = {
    ...(draft.accountVault || {}),
    [userId]: {
      profiles: cloneData(workspace?.profiles || fallback.profiles),
      rounds: cloneData(workspace?.rounds || fallback.rounds),
      groups: cloneData(workspace?.groups || fallback.groups),
      tournaments: cloneData(workspace?.tournaments || fallback.tournaments),
      gear: cloneData(workspace?.gear || fallback.gear),
      social: cloneData(workspace?.social || fallback.social),
      userSession: {
        ...fallback.userSession,
        ...(workspace?.userSession || {}),
        roundSetup: {
          ...fallback.userSession.roundSetup,
          ...(workspace?.userSession?.roundSetup || {}),
        },
      },
    },
  };

  syncAccountSummary(account, draft.accountVault[userId]);
  return draft.accountVault[userId];
}

export function upsertRemoteAccount(draft, fields = {}) {
  const nextEmail = String(fields.email || "").trim().toLowerCase();
  if (!nextEmail || !fields.id) {
    return null;
  }

  let account = draft.accounts?.find((entry) => entry.id === fields.id)
    || draft.accounts?.find((entry) => !entry.seededDemo && entry.email === nextEmail)
    || null;

  const previousId = account?.id || null;
  const nextDisplayName = String(fields.displayName || "").trim() || account?.displayName || "Golfer";
  const nextProvider = String(fields.provider || account?.provider || "email");
  const nextCreatedAt = fields.createdAt || account?.createdAt || Date.now();
  const nextTier = fields.tier || account?.subscription?.tier || TESTER_DEFAULT_SUBSCRIPTION_TIER;

  if (!account) {
    account = createAccountRecord({
      id: fields.id,
      displayName: nextDisplayName,
      email: nextEmail,
      password: "",
      provider: nextProvider,
      tier: nextTier,
      seededDemo: false,
      city: fields.city || "",
      homeCourse: fields.homeCourse || "",
      handicap: typeof fields.handicap === "number" ? fields.handicap : null,
      handedness: fields.handedness || "",
      bio: fields.bio || "",
      seasonGoal: fields.seasonGoal || "Finish your first round",
      createdAt: nextCreatedAt,
      appearance: fields.appearance || {},
      social: fields.social || {},
      integrations: fields.integrations || {},
    });
    draft.accounts.push(account);
  } else {
    account.id = fields.id;
    account.name = nextDisplayName;
    account.displayName = nextDisplayName;
    account.email = nextEmail;
    account.provider = nextProvider;
    account.providerType = nextProvider;
    account.avatarLabel = fields.avatarLabel || avatarFromName(nextDisplayName);
    account.avatarUrl = fields.avatarUrl || account.avatarUrl || "";
    account.homeCourse = fields.homeCourse ?? account.homeCourse ?? "";
    account.handicap = typeof fields.handicap === "number" ? fields.handicap : account.handicap ?? null;
    account.handedness = fields.handedness ?? account.handedness ?? "";
    account.bio = fields.bio ?? account.bio ?? "";
    account.city = fields.city ?? account.city ?? "";
    account.seasonGoal = fields.seasonGoal ?? account.seasonGoal ?? "Finish your first round";
    account.createdAt = nextCreatedAt;
    account.appearance = createAppearanceSettings(fields.appearance || account.appearance);
    account.social = createSocialSettings(fields.social || account.social);
    account.integrations = createIntegrationsState(fields.integrations || account.integrations);
    account.privacy = createPrivacySettings(fields.privacy || account.privacy);
    account.subscription = createSubscription(nextTier);
    account.premiumStatus = nextTier;
    account.seededDemo = false;
  }

  account.profileId = `profile-${String(account.id).replace(/^user-/, "")}`;
  account.username = fields.username || normalizeUsername(nextDisplayName);
  account.avatarLabel = fields.avatarLabel || account.avatarLabel || avatarFromName(nextDisplayName);

  if (previousId && previousId !== account.id) {
    moveAccountVaultEntry(draft, previousId, account.id);
    remapWorkspaceIdentity(draft.accountVault?.[account.id], previousId, account);
    if (draft.previewAccountId === previousId) {
      draft.previewAccountId = account.id;
    }
  }

  ensureAccountWorkspace(draft, account.id);
  return account;
}

export function createDefaultAccountState() {
  const freeDemo = createAccountRecord({
    id: "user-demo-free",
    displayName: "Avery Brooks",
    email: "free@golfersnation.demo",
    password: DEFAULT_PASSWORD,
    provider: "email",
    tier: "free",
    seededDemo: true,
    city: "Chicago, IL",
    homeCourse: "Whispering Pines",
    handicap: 8.4,
    bio: "Competitive weekend golfer building a better multi-state season.",
    seasonGoal: "Break 80 in three new states",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 160,
    social: {
      followedProfileIds: ["profile-maya", "profile-theo"],
      friendProfileIds: ["profile-maya"],
      pendingFriendProfileIds: ["profile-jordan"],
    },
  });

  const premiumDemo = createAccountRecord({
    id: "user-demo-premium",
    displayName: "Maya Chen",
    email: "premium@golfersnation.demo",
    password: DEFAULT_PASSWORD,
    provider: "email",
    tier: "premium",
    seededDemo: true,
    city: "Seattle, WA",
    homeCourse: "National Pines",
    handicap: 5.2,
    bio: "Competitive player using premium analytics and live group tools.",
    seasonGoal: "Win three weekend events this season",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 220,
    social: {
      followedProfileIds: ["profile-demo-free", "profile-theo"],
      friendProfileIds: ["profile-demo-free"],
    },
  });

  const googleDemo = createAccountRecord({
    id: "user-google-review",
    displayName: "Riley Stone",
    email: "google@golfersnation.demo",
    password: "",
    provider: "google",
    tier: "free",
    seededDemo: true,
    city: "Austin, TX",
    homeCourse: "Blue River",
    handicap: 10.1,
    bio: "Google mock sign-in account for review flows.",
  });

  const appleDemo = createAccountRecord({
    id: "user-apple-review",
    displayName: "Parker Cole",
    email: "apple@golfersnation.demo",
    password: "",
    provider: "apple",
    tier: "premium",
    seededDemo: true,
    city: "Scottsdale, AZ",
    homeCourse: "North Point",
    handicap: 6.8,
    bio: "Apple mock sign-in account with premium access for review flows.",
  });

  const accounts = [freeDemo, premiumDemo, googleDemo, appleDemo];
  const accountVault = {
    [freeDemo.id]: createSeededWorkspace(freeDemo),
    [premiumDemo.id]: createSeededWorkspace(premiumDemo, { premiumMode: "scramble" }),
    [googleDemo.id]: createEmptyWorkspace(googleDemo),
    [appleDemo.id]: createSeededWorkspace(appleDemo, { premiumMode: "match" }),
  };

  accounts.forEach((account) => {
    syncAccountSummary(account, accountVault[account.id]);
  });

  return {
    accounts,
    accountVault,
    activeAccountId: null,
    previewAccountId: freeDemo.id,
  };
}

export function prepareStateForPersistence(state) {
  const snapshot = cloneData(state);
  const userId = snapshot.auth?.activeUserId || snapshot.currentUser?.id || null;

  if (snapshot.session) {
    snapshot.session.feedback = null;
    snapshot.session.pendingLabel = "";
    snapshot.session.lastScoredParticipantId = null;
    snapshot.session.lastScoredHole = null;
    snapshot.session.lastScorePulseAt = 0;
  }

  if (!userId) {
    return snapshot;
  }

  saveWorkspaceToVault(snapshot, userId);
  return snapshot;
}

export function hydrateActiveAccountState(state) {
  const next = cloneData(state);
  const activeUserId = next.auth?.activeUserId;

  if (!activeUserId) {
    return next;
  }

  const restored = loadAccountIntoState(next, activeUserId);
  if (restored) {
    const activeRound = next.rounds?.find((round) => round.id === next.session?.activeRoundId) || null;
    if (activeRound?.status === "active") {
      next.session.activeView = "round";
      next.session.previousView = "round";
      next.session.transitionDirection = "steady";
      const pendingCount = getPendingRoundEvents(activeRound).length;
      next.session.feedback = {
        tone: pendingCount || activeRound.sync?.saveState === "retry-needed" ? "warning" : "info",
        title: pendingCount || activeRound.sync?.saveState === "retry-needed" ? "Round restored / local copy safe" : "Round restored",
        message: pendingCount
          ? `${activeRound.courseName} reopened from this device with ${pendingCount === 1 ? "1 local change" : `${pendingCount} local changes`} still waiting on cloud backup.`
          : `${activeRound.courseName} reopened from this device and is ready for scoring.`,
        updatedAt: Date.now(),
      };
    }
    return next;
  }

  const previewAccountId = next.previewAccountId || next.accounts?.[0]?.id || null;
  const previewAccount = next.accounts?.find((entry) => entry.id === previewAccountId) || null;
  const previewWorkspace = previewAccount ? next.accountVault?.[previewAccount.id] : null;

  if (previewAccount && previewWorkspace) {
    syncAccountSummary(previewAccount, previewWorkspace);
    next.currentUser = sanitizeCurrentUser(previewAccount);
    next.profiles = cloneData(previewWorkspace.profiles || []);
    next.rounds = cloneData(previewWorkspace.rounds || []);
    next.groups = cloneData(previewWorkspace.groups || []);
    next.tournaments = cloneData(previewWorkspace.tournaments || []);
    next.gear = cloneData(previewWorkspace.gear || { items: [] });
    next.social = cloneData(previewWorkspace.social || { activity: [] });
    next.session.activeRoundId = previewWorkspace.userSession?.activeRoundId || null;
    next.session.selectedHole = previewWorkspace.userSession?.selectedHole || 1;
    next.session.summaryRoundId = previewWorkspace.userSession?.summaryRoundId || null;
    next.session.selectedProfileId = previewWorkspace.userSession?.selectedProfileId || previewAccount.profileId;
    next.session.roundSetup = {
      ...(next.session.roundSetup || {}),
      ...(previewWorkspace.userSession?.roundSetup || {}),
    };
    next.session.spotify = createSpotifySessionState(next.session.spotify);
  }

  next.auth.activeUserId = null;
  next.auth.status = "signed_out";
  next.auth.provider = null;
  next.auth.error = "";
  next.auth.notice = "We couldn't restore your last session. Sign in again or use a demo account.";
  next.auth.mode = "login";
  next.session.activeView = "home";
  next.session.previousView = "home";
  next.session.transitionDirection = "steady";
  next.session.spotify = createSpotifySessionState(next.session.spotify);

  return next;
}

export function saveWorkspaceToVault(draft, userId = draft.auth?.activeUserId || draft.currentUser?.id) {
  if (!userId) {
    return;
  }

  const account = draft.accounts?.find((entry) => entry.id === userId);
  if (!account) {
    return;
  }

  mergeCurrentUserIntoAccount(account, draft.currentUser, draft.auth);
  draft.accountVault = {
    ...(draft.accountVault || {}),
    [userId]: {
      profiles: cloneData(draft.profiles || []),
      rounds: cloneData(draft.rounds || []),
      groups: cloneData(draft.groups || []),
      tournaments: cloneData(draft.tournaments || []),
      gear: cloneData(draft.gear || { items: [] }),
      social: cloneData(draft.social || { activity: [] }),
      userSession: getUserSession(draft),
    },
  };
  const summary = syncAccountSummary(account, draft.accountVault[userId]);
  draft.currentUser.roundsPlayed = summary.roundsPlayed;
  draft.currentUser.averageScore = summary.averageScore;
  draft.currentUser.bestRound = summary.bestRound;
  draft.currentUser.recentFormSummary = summary.recentFormSummary;
}

export function loadAccountIntoState(draft, userId) {
  const account = draft.accounts?.find((entry) => entry.id === userId);
  const workspace = draft.accountVault?.[userId];

  if (!account || !workspace) {
    return false;
  }

  syncAccountSummary(account, workspace);
  draft.currentUser = sanitizeCurrentUser(account);
  draft.profiles = cloneData(workspace.profiles || []);
  draft.rounds = cloneData(workspace.rounds || []);
  draft.groups = cloneData(workspace.groups || []);
  draft.tournaments = cloneData(workspace.tournaments || []);
  draft.gear = cloneData(workspace.gear || { items: [] });
  draft.social = cloneData(workspace.social || { activity: [] });
  draft.auth.activeUserId = userId;
  draft.auth.lastUserId = userId;
  draft.auth.status = "authenticated";
  draft.auth.provider = account.provider;
  draft.auth.error = "";
  draft.auth.notice = account.subscription?.tier === "premium"
    ? `${account.displayName} is ready. Premium tester access, rounds, and settings are loaded.`
    : `${account.displayName} is ready. Rounds, stats, and plan access are loaded.`;
  draft.auth.linkedProviders = [...new Set([...(draft.auth.linkedProviders || []), account.provider])];
  draft.session.activeRoundId = workspace.userSession?.activeRoundId || null;
  draft.session.selectedHole = workspace.userSession?.selectedHole || 1;
  draft.session.summaryRoundId = workspace.userSession?.summaryRoundId || null;
  draft.session.selectedProfileId = workspace.userSession?.selectedProfileId || account.profileId;
  draft.session.roundSetup = {
    ...(draft.session.roundSetup || {}),
    ...(workspace.userSession?.roundSetup || {}),
  };
  draft.session.spotify = createSpotifySessionState(draft.session.spotify);
  draft.session.activeView = "home";
  draft.session.previousView = "home";
  draft.session.transitionDirection = "steady";
  return true;
}

export function signOutAccount(draft) {
  const activeUserId = draft.auth?.activeUserId || draft.currentUser?.id || null;
  const activeAccount = draft.accounts?.find((entry) => entry.id === activeUserId) || null;

  if (activeUserId) {
    saveWorkspaceToVault(draft, activeUserId);
  }

  draft.auth.lastUserId = activeUserId;
  draft.auth.activeUserId = null;
  draft.auth.status = "signed_out";
  draft.auth.provider = null;
  draft.auth.error = "";
  draft.auth.notice = activeAccount
    ? `${activeAccount.displayName} logged out. Log in below to return to your golfer account.`
    : "You were logged out. Log in below to return to your golfer account.";
  draft.auth.mode = "login";
  draft.session.activeView = "home";
  draft.session.previousView = "home";
  draft.session.transitionDirection = "steady";
  draft.session.appMenuOpen = false;
  draft.session.helpReturnView = "auth";
  draft.session.settingsDestination = "landing";
  draft.session.settingsReturnView = "auth";
  draft.session.settingsSection = "account";
  draft.session.activeRoundId = null;
  draft.session.summaryRoundId = null;
  draft.session.selectedHole = 1;
  draft.session.selectedProfileId = null;
  draft.session.roundSetup = {
    ...(draft.session.roundSetup || {}),
    ...createDefaultRoundSetup(),
  };
  draft.session.spotify = createSpotifySessionState();
}

export function findAccountByEmail(state, email) {
  const normalized = String(email || "").trim().toLowerCase();
  return state.accounts?.find((account) => account.email === normalized) || null;
}

export function createEmailAccount(draft, fields) {
  const email = String(fields.email || "").trim().toLowerCase();
  const displayName = String(fields.displayName || "").trim();
  const password = String(fields.password || "");

  if (!email || !displayName || !password) {
    return { error: "Enter a name, email, and password to create an account." };
  }

  if (findAccountByEmail(draft, email)) {
    return { error: "That email already has an account. Try logging in instead." };
  }

  const account = createAccountRecord({
    displayName,
    email,
    password,
    provider: "email",
    tier: TESTER_DEFAULT_SUBSCRIPTION_TIER,
    city: "Your city",
    homeCourse: "",
    handicap: null,
    bio: "",
    seasonGoal: "Finish your first round",
  });

  draft.accounts.push(account);
  draft.accountVault[account.id] = createEmptyWorkspace(account);
  return { account };
}

export function authenticateEmailAccount(state, fields) {
  const email = String(fields.email || "").trim().toLowerCase();
  const password = String(fields.password || "");
  const account = findAccountByEmail(state, email);

  if (!account || account.provider !== "email") {
    return { error: "No email account matches those details." };
  }

  if (account.password !== password) {
    return { error: "That password does not match this account." };
  }

  return { account };
}

export function signInWithMockProvider(draft, provider) {
  const providerId = provider === "apple" ? "user-apple-review" : "user-google-review";
  const account = draft.accounts.find((entry) => entry.id === providerId);

  if (!account) {
    return { error: "That provider demo account is not available." };
  }

  return { account };
}

export function togglePremiumAccessForUser(draft, userId = draft.auth?.activeUserId || draft.currentUser?.id) {
  if (!userId) {
    return null;
  }

  const account = draft.accounts?.find((entry) => entry.id === userId);
  if (!account) {
    return null;
  }

  const nextTier = account.subscription?.tier === "premium" ? "free" : "premium";
  account.subscription = createSubscription(nextTier);
  account.premiumStatus = nextTier;

  if (draft.currentUser?.id === userId) {
    draft.currentUser.subscription = cloneData(account.subscription);
    draft.currentUser.premiumStatus = nextTier;
  }

  const profile = draft.profiles?.find((entry) => entry.userId === userId || entry.id === account.profileId);
  if (profile) {
    profile.account = {
      ...profile.account,
      premiumStatus: nextTier,
    };
  }

  return account;
}

export function getReviewAccounts(state) {
  return (state.accounts || [])
    .filter((account) => account.seededDemo && account.provider === "email")
    .map((account) => ({
      id: account.id,
      displayName: account.displayName,
      email: account.email,
      tier: account.subscription.tier,
      provider: account.provider,
    }));
}
