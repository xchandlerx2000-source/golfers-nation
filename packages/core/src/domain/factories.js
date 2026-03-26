import { CONNECTION_COPY, COURSE_TEMPLATE, FEATURED_COURSE_ID, GAME_MODES, isSideBasedMode } from "../config.js";
import { ensureRoundSyncScaffold } from "./round-sync.js";
import { cloneData, compactNames, uid } from "../utils/formatters.js";

const DEFAULT_REAL_COURSE_NAME = "The Country Club at Golden Nugget";

function slugifyName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18);
}

function createAvatarLabel(displayName) {
  return String(displayName || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "GN";
}

function sanitizePlayers(players, currentUser) {
  const base = Array.isArray(players) ? players : [];
  const normalized = base
    .map((player) => {
      if (typeof player === "string") {
        const name = String(player || "").trim();
        return name
          ? {
              name,
              displayName: name,
              username: slugifyName(name),
              avatarLabel: createAvatarLabel(name),
            }
          : null;
      }

      const displayName = String(player?.displayName || player?.name || "").trim();
      if (!displayName) {
        return null;
      }

      return {
        profileId: player.profileId || player.id || null,
        userId: player.userId || null,
        name: displayName,
        displayName,
        username: player.username || slugifyName(displayName),
        avatarLabel: player.avatarLabel || player.avatar || createAvatarLabel(displayName),
      };
    })
    .filter(Boolean);

  const currentName = currentUser.displayName || currentUser.name;
  if (!normalized.some((player) =>
    player.profileId
      ? player.profileId === currentUser.profileId
      : player.name.toLowerCase() === String(currentName).toLowerCase()
  )) {
    normalized.unshift({
      profileId: currentUser.profileId || null,
      userId: currentUser.id,
      name: currentName,
      displayName: currentName,
      username: currentUser.username || slugifyName(currentName),
      avatarLabel: currentUser.avatarLabel || currentUser.avatar || createAvatarLabel(currentName),
    });
  }

  const seen = new Set();
  return normalized.filter((player) => {
    const key = player.profileId || player.name.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).slice(0, 4);
}

function createPlayer(player, index, currentUserId, currentUserName) {
  return {
    id: uid("player"),
    profileId: player.profileId || null,
    userId: player.userId || (player.name.toLowerCase() === currentUserName.toLowerCase() ? currentUserId : null),
    name: player.name,
    username: player.username || slugifyName(player.name),
    avatarLabel: player.avatarLabel || createAvatarLabel(player.name),
    role: index === 0 ? "owner" : "guest",
  };
}

function createSides(mode, players) {
  if (!isSideBasedMode(mode)) {
    return [];
  }

  const left = players.filter((_, index) => index % 2 === 0);
  const right = players.filter((_, index) => index % 2 === 1);

  return [
    {
      id: uid("side"),
      name: mode === "scramble" ? "Team Fairway" : "Side A",
      playerIds: left.map((player) => player.id),
      playerNames: left.map((player) => player.name),
    },
    {
      id: uid("side"),
      name: mode === "scramble" ? "Team Green" : "Side B",
      playerIds: right.map((player) => player.id),
      playerNames: right.map((player) => player.name),
    },
  ].filter((side) => side.playerIds.length);
}

function createHoleEntries(mode, players, sides) {
  const participants = isSideBasedMode(mode) ? sides : players;
  return participants.map((participant) => ({
    participantId: participant.id,
    strokes: null,
    putts: null,
    penalties: 0,
    fairwayHit: false,
    gir: false,
    upAndDown: false,
    sandSave: false,
    updatedAt: null,
    lastEventId: null,
  }));
}

export function createRound({
  currentUser,
  courseName,
  teeBox,
  teeBoxId = null,
  weather,
  mode = "stroke",
  players,
  syncTransport = "local",
  status = "active",
  inviteCode = null,
  groupId = null,
  tournamentId = null,
  courseId = null,
  courseCity = "",
  courseState = "",
  courseCountry = "",
  courseAddress = "",
  courseRegion = "",
  courseLatitude = null,
  courseLongitude = null,
  courseSource = "",
  courseSeeded = false,
  courseMetadata = null,
  holesTemplate = null,
  selectedHoleCount = null,
  courseRating = null,
  courseSlope = null,
}) {
  const safeMode = GAME_MODES[mode] ? mode : "stroke";
  const currentUserName = currentUser.displayName || currentUser.name;
  const playerInputs = sanitizePlayers(players, currentUser);
  const playerRecords = playerInputs.map((player, index) =>
    createPlayer(player, index, currentUser.id, currentUserName)
  );
  const sideRecords = createSides(safeMode, playerRecords);
  const sourceHoles = Array.isArray(holesTemplate) && holesTemplate.length > 0
    ? holesTemplate
    : COURSE_TEMPLATE;
  const holes = sourceHoles.map((hole) => ({
    ...cloneData(hole),
    entries: createHoleEntries(safeMode, playerRecords, sideRecords),
  }));

  const round = {
    id: uid("round"),
    status,
    mode: safeMode,
    courseName: courseName || DEFAULT_REAL_COURSE_NAME,
    teeBox: teeBox || "Blue",
    teeBoxId,
    courseId: courseId || FEATURED_COURSE_ID,
    courseCity,
    courseState,
    courseCountry,
    courseAddress,
    courseRegion,
    courseLatitude,
    courseLongitude,
    courseSource,
    courseSeeded,
    courseMetadata: cloneData(courseMetadata || {}),
    selectedHoleCount: Number(selectedHoleCount || sourceHoles.length || 18),
    courseHoleCount: sourceHoles.length,
    courseRating,
    courseSlope,
    weather: weather || "Calm 72F",
    visibility: "friends",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    startedAt: Date.now(),
    completedAt: status === "completed" ? Date.now() : null,
    inviteCode,
    groupId,
    tournamentId,
    currentHole: 1,
    players: playerRecords,
    sides: sideRecords,
    holes,
    sync: {
      state: syncTransport === "local" ? "local" : "connected",
      transport: syncTransport,
      label: CONNECTION_COPY[syncTransport] || CONNECTION_COPY.local,
      lastEventAt: null,
      note: "Offline-first round data with a future real-time sync path.",
    },
    eventLog: [],
    notes: [],
  };

  return ensureRoundSyncScaffold(round);
}

export function createGroup({ round, currentUser, inviteCode, transport = "invite", status = "hosting" }) {
  return {
    id: uid("group"),
    roundId: round.id,
    title: `${round.courseName} ${GAME_MODES[round.mode].label}`,
    inviteCode,
    status,
    transport,
    hostUserId: currentUser.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    hostRequired: false,
    hostOptional: true,
    members: round.players.map((player, index) => ({
      id: uid("member"),
      playerId: player.id,
      profileId: player.profileId,
      userId: player.userId,
      displayName: player.name,
      username: player.username || slugifyName(player.name),
      avatarLabel: player.avatarLabel || createAvatarLabel(player.name),
      role: index === 0 ? "host" : "player",
      connectionState: index === 0 ? "ready" : "pending",
    })),
    feed: [
      createActivity({
        type: "sync",
        message: `Invite code ${inviteCode} is live for ${round.courseName}.`,
      }),
    ],
  };
}

export function createTournament({
  name,
  courseName,
  date,
  mode = "stroke",
  fieldSize = 16,
  linkedRoundId = null,
  status = "planning",
}) {
  return {
    id: uid("tournament"),
    name,
    courseName,
    date,
    mode,
    fieldSize,
    linkedRoundId,
    status,
    createdAt: Date.now(),
    entries: [],
  };
}

export function createGearItem({ category, name, notes = "", packed = false, weatherUse = "" }) {
  return {
    id: uid("gear"),
    category,
    name,
    notes,
    packed,
    weatherUse,
    createdAt: Date.now(),
  };
}

export function createPlayerProfile({
  userId = null,
  displayName,
  username,
  avatarLabel,
  email = "",
  homeCourse = "",
  handicap = null,
  bio = "",
  createdAt = Date.now(),
  premiumStatus = "free",
  privacy = {},
  publicStats = {},
  recentForm = [],
  headToHead = [],
}) {
  const safeDisplayName = String(displayName || "").trim() || "Golfer";
  const safeUsername = String(username || "").trim() || slugifyName(safeDisplayName);
  const safeAvatarLabel = String(avatarLabel || "").trim() || createAvatarLabel(safeDisplayName);

  return {
    id: uid("profile"),
    userId,
    displayName: safeDisplayName,
    username: safeUsername.startsWith("@") ? safeUsername : `@${safeUsername}`,
    avatarLabel: safeAvatarLabel,
    account: {
      email,
      createdAt,
      premiumStatus,
      authProviders: [],
    },
    privateProfile: {
      homeCourse,
      handicap,
      bio,
      privacy: {
        showHomeCourse: true,
        showHandicap: true,
        showBio: true,
        showRecentForm: true,
        showHeadToHead: false,
        showEmail: false,
        ...privacy,
      },
    },
    publicProfile: {
      displayName: safeDisplayName,
      username: safeUsername.startsWith("@") ? safeUsername : `@${safeUsername}`,
      avatarLabel: safeAvatarLabel,
      homeCourse,
      handicap,
      bio,
      roundsPlayed: publicStats.roundsPlayed || 0,
      averageScore: publicStats.averageScore || null,
      bestRound: publicStats.bestRound || null,
      recentFormSummary: publicStats.recentFormSummary || "New profile",
      fairwayPercentage: publicStats.fairwayPercentage ?? 0,
      girPercentage: publicStats.girPercentage ?? 0,
      averagePutts: publicStats.averagePutts ?? null,
      penaltiesAverage: publicStats.penaltiesAverage ?? 0,
      upAndDownRate: publicStats.upAndDownRate ?? 0,
      sandSaveCount: publicStats.sandSaveCount ?? 0,
      scoringByParType: publicStats.scoringByParType || {},
      hardestHoles: publicStats.hardestHoles || [],
      bestHoles: publicStats.bestHoles || [],
      strokesGained: publicStats.strokesGained || null,
      formLabel: publicStats.formLabel || "Stable",
      trendSummary: publicStats.trendSummary || "Building a trend",
      handicapIndex: publicStats.handicapIndex ?? null,
      smartInsights: publicStats.smartInsights || [],
      recentForm,
      headToHead,
    },
    updatedAt: Date.now(),
  };
}

export function createActivity({ type = "update", message }) {
  return {
    id: uid("activity"),
    type,
    message,
    createdAt: Date.now(),
  };
}

export function createSocialPost({
  authorProfileId,
  message,
  linkUrl = "",
  linkLabel = "",
  courseName = "",
  visibility = "friends",
}) {
  return {
    id: uid("post"),
    authorProfileId,
    message: String(message || "").trim(),
    linkUrl: String(linkUrl || "").trim(),
    linkLabel: String(linkLabel || "").trim(),
    courseName: String(courseName || "").trim(),
    visibility,
    createdAt: Date.now(),
  };
}

function normalizeConversationProfileIds(participantProfileIds = []) {
  return [...new Set((Array.isArray(participantProfileIds) ? participantProfileIds : []).filter(Boolean))];
}

export function createDirectMessage({
  authorProfileId,
  message,
  createdAt = Date.now(),
  status = "sent",
}) {
  return {
    id: uid("message"),
    authorProfileId,
    message: String(message || "").trim(),
    createdAt,
    status,
  };
}

export function createDirectConversation({
  participantProfileIds = [],
  title = "",
  messages = [],
  createdAt = Date.now(),
  unreadByProfileId = {},
}) {
  const normalizedParticipantProfileIds = normalizeConversationProfileIds(participantProfileIds);
  const normalizedMessages = (Array.isArray(messages) ? messages : [])
    .map((message) => createDirectMessage({
      authorProfileId: message?.authorProfileId,
      message: message?.message,
      createdAt: message?.createdAt || createdAt,
      status: message?.status || "sent",
    }))
    .filter((message) => message.authorProfileId && message.message);
  const lastMessage = normalizedMessages[normalizedMessages.length - 1] || null;

  return {
    id: uid("conversation"),
    title: String(title || "").trim(),
    participantProfileIds: normalizedParticipantProfileIds,
    messages: normalizedMessages,
    unreadByProfileId: normalizedParticipantProfileIds.reduce((result, profileId) => {
      result[profileId] = Number(unreadByProfileId?.[profileId] || 0);
      return result;
    }, {}),
    createdAt,
    updatedAt: lastMessage?.createdAt || createdAt,
    lastMessageAt: lastMessage?.createdAt || createdAt,
  };
}

export function describeSide(side) {
  return `${side.name}: ${compactNames(side.playerNames)}`;
}
