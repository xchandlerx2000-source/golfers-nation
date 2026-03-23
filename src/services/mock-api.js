import { CONNECTION_COPY, GAME_MODES } from "../config.js";
import { createGroup, createRound } from "../domain/factories.js";
import { ensureProfilesForNames } from "./player-service.js";

const seededRooms = [
  {
    inviteCode: "WIND7",
    title: "Saturday Wind Game",
    courseName: "Lakeview Downs",
    weather: "Windy 64F",
    mode: "stroke",
    players: [
      { displayName: "Reese Hall", username: "@reesehall", avatarLabel: "RH" },
      { displayName: "Maya Chen", username: "@mayachen", avatarLabel: "MC" },
      { displayName: "Theo Grant", username: "@theogrant", avatarLabel: "TG" },
    ],
    distance: "2.8 mi",
  },
  {
    inviteCode: "MATCH9",
    title: "Twilight Match",
    courseName: "North Point",
    weather: "Clear 70F",
    mode: "match",
    players: [
      { displayName: "Jordan Wells", username: "@jordanwells", avatarLabel: "JW" },
      { displayName: "Parker Cole", username: "@parkercole", avatarLabel: "PC" },
      { displayName: "Emery Shaw", username: "@emeryshaw", avatarLabel: "ES" },
      { displayName: "Drew Cain", username: "@drewcain", avatarLabel: "DC" },
    ],
    distance: "6.1 mi",
  },
  {
    inviteCode: "SCRAM8",
    title: "Sunday Scramble",
    courseName: "Red Cedar Club",
    weather: "Warm 78F",
    mode: "scramble",
    players: [
      { displayName: "Cameron Vale", username: "@cameronvale", avatarLabel: "CV" },
      { displayName: "Skye Rivers", username: "@skyerivers", avatarLabel: "SR" },
      { displayName: "Luca Gray", username: "@lucagray", avatarLabel: "LG" },
      { displayName: "Noah Kane", username: "@noahkane", avatarLabel: "NK" },
    ],
    distance: "9.4 mi",
  },
];

function getProfileVisibility(profile) {
  return profile?.privateProfile?.privacy?.profileVisibility || "friends";
}

function isProfileDiscoverable(profile) {
  return getProfileVisibility(profile) !== "private";
}

function buildActiveRoundMap(state) {
  const activeByProfileId = new Map();

  state.groups.forEach((group) => {
    const round = state.rounds.find((item) => item.id === group.roundId);
    if (!round || round.status !== "active") {
      return;
    }

    round.players.forEach((player) => {
      if (!player.profileId) {
        return;
      }

      activeByProfileId.set(player.profileId, {
        round,
        group,
        player,
      });
    });
  });

  return activeByProfileId;
}

function generateInviteCode(existingCodes) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  while (!code || existingCodes.has(code)) {
    code = Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  }

  return code;
}

export function hostRoundGroup({ state, round }) {
  const existingCodes = new Set(state.groups.map((group) => group.inviteCode));
  const inviteCode = generateInviteCode(existingCodes);
  const group = createGroup({
    round,
    currentUser: state.currentUser,
    inviteCode,
    transport: "invite",
    status: "hosting",
  });

  return { inviteCode, group };
}

export function joinByInviteCode({ code, state }) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  const localGroup = state.groups.find((group) => group.inviteCode === normalized);
  if (localGroup) {
    const round = state.rounds.find((item) => item.id === localGroup.roundId);
    return {
      source: "local",
      group: localGroup,
      round,
      notice: `Joined ${localGroup.title} from local device storage.`,
    };
  }

  const seeded = seededRooms.find((room) => room.inviteCode === normalized);
  if (!seeded) {
    return null;
  }

  const remoteRound = createRound({
    currentUser: state.currentUser,
    courseName: seeded.courseName,
    teeBox: "Blue",
    weather: seeded.weather,
    mode: seeded.mode,
    players: ensureProfilesForNames(state, [state.currentUser.displayName || state.currentUser.name, ...seeded.players]),
    syncTransport: "cloud",
  });
  remoteRound.inviteCode = seeded.inviteCode;
  remoteRound.sync = {
    state: "connected",
    transport: "cloud",
    label: CONNECTION_COPY.cloud,
    lastEventAt: Date.now(),
    note: "Joined devices keep their own safe local card even if the original host leaves.",
    hostRequired: false,
    hostOptional: true,
    saveState: "saved-local",
    pendingActionCount: 0,
    lastLocalSaveAt: Date.now(),
    lastSyncedAt: 0,
    lastSyncError: "",
    conflictStrategy: "latest-write-wins",
  };

  const group = createGroup({
    round: remoteRound,
    currentUser: state.currentUser,
    inviteCode: seeded.inviteCode,
    transport: "cloud",
    status: "joined",
  });
  group.title = seeded.title;
  group.members.forEach((member) => {
    member.connectionState = member.role === "host" ? "connected" : "connected";
  });

  return {
    source: "seeded",
    group,
    round: remoteRound,
    notice: `Joined ${seeded.title} via invite code.`,
  };
}

export function listNearbyGames(state) {
  const localCards = state.groups
    .map((group) => {
      const round = state.rounds.find((item) => item.id === group.roundId);
      if (!round || round.status !== "active") {
        return null;
      }

      return {
        inviteCode: group.inviteCode,
        title: group.title,
        courseName: round.courseName,
        modeLabel: GAME_MODES[round.mode].label,
        transport: CONNECTION_COPY[group.transport] || CONNECTION_COPY.invite,
        distance: "On device",
        source: "local",
        playerCount: round.players.length,
        hostName: group.members[0]?.displayName || round.players[0]?.name || "Host golfer",
        statusLabel: `Hole ${round.currentHole} / ${round.players.length} golfers`,
      };
    })
    .filter(Boolean);

  const seededCards = seededRooms.map((room) => ({
    inviteCode: room.inviteCode,
    title: room.title,
    courseName: room.courseName,
    modeLabel: GAME_MODES[room.mode].label,
    transport: CONNECTION_COPY.cloud,
    distance: room.distance,
    source: "seeded",
    playerCount: room.players.length,
    hostName: room.players[0]?.displayName || "Host golfer",
    statusLabel: `${room.players.length} golfers nearby`,
  }));

  return [...localCards, ...seededCards];
}

export function listNearbyPlayers(state) {
  const activeRoundMap = buildActiveRoundMap(state);

  return (state.profiles || [])
    .filter((profile) => profile.id !== state.currentUser.profileId)
    .filter((profile) => isProfileDiscoverable(profile) || activeRoundMap.has(profile.id))
    .map((profile) => {
      const active = activeRoundMap.get(profile.id);
      const showHomeCourse = profile.privateProfile?.privacy?.showHomeCourse !== false;
      const showHandicap = profile.privateProfile?.privacy?.showHandicap !== false;
      const roundsPlayed = profile.publicProfile?.roundsPlayed || 0;
      const averageScore = profile.publicProfile?.averageScore;

      return {
        profileId: profile.id,
        displayName: profile.publicProfile.displayName,
        username: profile.publicProfile.username,
        avatarLabel: profile.publicProfile.avatarLabel,
        homeCourse: showHomeCourse ? profile.publicProfile.homeCourse || "" : "",
        handicap: showHandicap ? profile.publicProfile.handicap : null,
        recentFormSummary: profile.publicProfile.recentFormSummary || "Competitive profile ready",
        statsSummary: roundsPlayed
          ? `${roundsPlayed} rounds / ${typeof averageScore === "number" ? averageScore.toFixed(1) : "--"} avg`
          : "New public player card",
        statusLabel: active
          ? "In a live nearby round"
          : roundsPlayed
            ? "Recently active"
            : "Available to join",
        detail: active
          ? `${active.round.courseName} / Hole ${active.round.currentHole}`
          : profile.publicProfile.recentFormSummary || "Public profile ready",
        inviteCode: active?.group.inviteCode || active?.round.inviteCode || "",
        isLive: Boolean(active),
        updatedAt: profile.updatedAt || 0,
      };
    })
    .sort((left, right) =>
      Number(right.isLive) - Number(left.isLive)
      || (right.updatedAt || 0) - (left.updatedAt || 0)
      || right.displayName.localeCompare(left.displayName)
    );
}

export function getGearRecommendations(weather) {
  const lower = String(weather || "").toLowerCase();
  const recommendations = [
    "Rangefinder",
    "Alignment sticks",
    "Microfiber towel",
  ];

  if (lower.includes("wind")) {
    recommendations.push("Wind shell", "Low-spin ball sleeve");
  }

  if (lower.includes("rain")) {
    recommendations.push("Rain gloves", "Umbrella");
  }

  if (lower.includes("cold")) {
    recommendations.push("Quarter zip", "Hand warmers");
  }

  if (lower.includes("warm") || lower.includes("hot")) {
    recommendations.push("Cooling polo", "Electrolyte bottle");
  }

  return recommendations;
}
