import { CONNECTION_COPY, GAME_MODES } from "../config.js";
import {
  getFollowedProfileIds,
  getFriendProfileIds,
  hasPendingFriendRequest,
  isProfileFollowed,
  isProfileFriend,
} from "./player-service.js";

const SEEDED_DISCOVERABLE_ROOMS = [
  {
    inviteCode: "WIND7",
    title: "Saturday Wind Game",
    courseName: "TPC Louisiana",
    weather: "Windy 64F",
    mode: "stroke",
    players: [
      { displayName: "Reese Hall", username: "@reesehall", avatarLabel: "RH" },
      { profileId: "profile-maya", displayName: "Maya Chen", username: "@mayachen", avatarLabel: "MC" },
      { displayName: "Theo Grant", username: "@theogrant", avatarLabel: "TG" },
    ],
    distance: "2.8 mi",
    discoverySource: "seeded",
  },
  {
    inviteCode: "MATCH9",
    title: "Twilight Match",
    courseName: "Torrey Pines Golf Course - South",
    weather: "Clear 70F",
    mode: "match",
    players: [
      { profileId: "profile-jordan", displayName: "Jordan Wells", username: "@jordanwells", avatarLabel: "JW" },
      { displayName: "Parker Cole", username: "@parkercole", avatarLabel: "PC" },
      { displayName: "Emery Shaw", username: "@emeryshaw", avatarLabel: "ES" },
      { displayName: "Drew Cain", username: "@drewcain", avatarLabel: "DC" },
    ],
    distance: "6.1 mi",
    discoverySource: "seeded",
  },
  {
    inviteCode: "SCRAM8",
    title: "Sunday Scramble",
    courseName: "Pebble Beach Golf Links",
    weather: "Warm 78F",
    mode: "scramble",
    players: [
      { displayName: "Cameron Vale", username: "@cameronvale", avatarLabel: "CV" },
      { displayName: "Skye Rivers", username: "@skyerivers", avatarLabel: "SR" },
      { profileId: "profile-theo", displayName: "Theo Grant", username: "@theogrant", avatarLabel: "TG" },
      { displayName: "Noah Kane", username: "@noahkane", avatarLabel: "NK" },
    ],
    distance: "9.4 mi",
    discoverySource: "seeded",
  },
];

export function createDefaultNearbyState() {
  return {
    discoveryMode: "app-presence",
    enabled: true,
    locationPermission: "prompt",
    locationStatus: "idle",
    bluetoothStatus: "idle",
    coordinates: null,
    lastScanAt: 0,
    lastError: "",
  };
}

function getNearbyState(state) {
  return {
    ...createDefaultNearbyState(),
    ...(state.session?.nearby || {}),
  };
}

function getProfileVisibility(profile) {
  return profile?.privateProfile?.privacy?.profileVisibility || "friends";
}

function isProfileDiscoverable(profile) {
  return getProfileVisibility(profile) !== "private";
}

function buildActiveRoundMap(state) {
  const activeByProfileId = new Map();

  (state.groups || []).forEach((group) => {
    const round = (state.rounds || []).find((item) => item.id === group.roundId);
    if (!round || round.status !== "active") {
      return;
    }

    (round.players || []).forEach((player) => {
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

function buildRecentActivityMap(state) {
  const activity = new Map();

  (state.profiles || []).forEach((profile) => {
    activity.set(profile.id, {
      updatedAt: profile.updatedAt || 0,
      recentFormSummary: profile.publicProfile?.recentFormSummary || "Ready for the next round",
    });
  });

  return activity;
}

function getDiscoveryDistanceLabel(nearbyState, fallbackDistance = "Discoverable now") {
  if (nearbyState.locationPermission === "granted" && nearbyState.coordinates) {
    return fallbackDistance;
  }

  if (nearbyState.bluetoothStatus === "ready") {
    return "Nearby sync ready";
  }

  return "Discoverable now";
}

function dedupeNearbyGames(rows) {
  const seen = new Map();
  rows.forEach((row) => {
    const key = row.inviteCode || row.roundId || row.title;
    const existing = seen.get(key);
    if (!existing || (row.discoveryPriority || 0) > (existing.discoveryPriority || 0)) {
      seen.set(key, row);
    }
  });
  return [...seen.values()];
}

export function getSeededNearbyRooms() {
  return SEEDED_DISCOVERABLE_ROOMS.map((room) => ({
    ...room,
    players: room.players.map((player) => ({ ...player })),
  }));
}

export function listNearbyGames(state) {
  const nearbyState = getNearbyState(state);
  const followedIds = new Set(getFollowedProfileIds(state));
  const friendIds = new Set(getFriendProfileIds(state));
  const localCards = (state.groups || [])
    .map((group) => {
      const round = (state.rounds || []).find((item) => item.id === group.roundId);
      if (!round || round.status !== "active") {
        return null;
      }

      const socialPlayers = (round.players || []).filter((player) =>
        friendIds.has(player.profileId) || followedIds.has(player.profileId)
      );

      return {
        inviteCode: group.inviteCode,
        roundId: round.id,
        title: group.title,
        courseName: round.courseName,
        modeLabel: GAME_MODES[round.mode].label,
        transport: CONNECTION_COPY[group.transport] || CONNECTION_COPY.invite,
        distance: getDiscoveryDistanceLabel(nearbyState, "Nearby now"),
        source: "live",
        playerCount: round.players.length,
        hostName: group.members?.[0]?.displayName || round.players?.[0]?.name || "Host golfer",
        statusLabel: `Hole ${round.currentHole} / ${round.players.length} golfers`,
        availableToJoin: true,
        joinActionLabel: socialPlayers.length ? "Join friends" : "Join now",
        friendCount: socialPlayers.filter((player) => friendIds.has(player.profileId)).length,
        socialCount: socialPlayers.length,
        socialSummary: socialPlayers.length
          ? `${socialPlayers.map((player) => player.displayName || player.name).slice(0, 2).join(", ")} in this round`
          : "Hosted and discoverable now",
        liveBadge: round.sync?.label || CONNECTION_COPY.cloud,
        discoveryPriority: 3,
      };
    })
    .filter(Boolean);

  const seededCards = getSeededNearbyRooms().map((room) => {
    const socialPlayers = (room.players || []).filter((player) =>
      friendIds.has(player.profileId) || followedIds.has(player.profileId)
    );

    return {
      inviteCode: room.inviteCode,
      roundId: room.inviteCode,
      title: room.title,
      courseName: room.courseName,
      modeLabel: GAME_MODES[room.mode].label,
      transport: CONNECTION_COPY.cloud,
      distance: room.distance,
      source: "seeded",
      playerCount: room.players.length,
      hostName: room.players[0]?.displayName || "Host golfer",
      statusLabel: `${room.players.length} golfers active`,
      availableToJoin: true,
      joinActionLabel: socialPlayers.length ? "Join friends" : "Join now",
      friendCount: socialPlayers.filter((player) => friendIds.has(player.profileId)).length,
      socialCount: socialPlayers.length,
      socialSummary: socialPlayers.length
        ? `${socialPlayers.map((player) => player.displayName || player.name).slice(0, 2).join(", ")} nearby`
        : "Discoverable nearby round",
      liveBadge: "Discoverable now",
      discoveryPriority: socialPlayers.length ? 2 : 1,
    };
  });

  return dedupeNearbyGames([...localCards, ...seededCards]).sort((left, right) =>
    (right.friendCount || 0) - (left.friendCount || 0)
    || (right.socialCount || 0) - (left.socialCount || 0)
    || (right.discoveryPriority || 0) - (left.discoveryPriority || 0)
    || left.title.localeCompare(right.title)
  );
}

export function listNearbyPlayers(state) {
  const activeRoundMap = buildActiveRoundMap(state);
  const activityMap = buildRecentActivityMap(state);
  const nearbyState = getNearbyState(state);

  return (state.profiles || [])
    .filter((profile) => profile.id !== state.currentUser.profileId)
    .filter((profile) => isProfileDiscoverable(profile) || activeRoundMap.has(profile.id))
    .map((profile) => {
      const active = activeRoundMap.get(profile.id);
      const activity = activityMap.get(profile.id) || { updatedAt: 0, recentFormSummary: "Available to join" };
      const showHomeCourse = profile.privateProfile?.privacy?.showHomeCourse !== false;
      const showHandicap = profile.privateProfile?.privacy?.showHandicap !== false;
      const roundsPlayed = profile.publicProfile?.roundsPlayed || 0;
      const averageScore = profile.publicProfile?.averageScore;
      const isFriend = isProfileFriend(state, profile.id);
      const isFollowed = isFriend || isProfileFollowed(state, profile.id);
      const pendingFriendRequest = hasPendingFriendRequest(state, profile.id);

      return {
        profileId: profile.id,
        displayName: profile.publicProfile.displayName,
        username: profile.publicProfile.username,
        avatarLabel: profile.publicProfile.avatarLabel,
        homeCourse: showHomeCourse ? profile.publicProfile.homeCourse || "" : "",
        handicap: showHandicap ? profile.publicProfile.handicap : null,
        recentFormSummary: activity.recentFormSummary,
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
          : activity.recentFormSummary || "Public profile ready",
        proximityLabel: active
          ? getDiscoveryDistanceLabel(nearbyState, "Nearby now")
          : nearbyState.locationPermission === "granted" && nearbyState.coordinates
            ? "Around you"
            : "Discoverable now",
        inviteCode: active?.group?.inviteCode || active?.round?.inviteCode || "",
        isLive: Boolean(active),
        isFriend,
        isFollowed,
        pendingFriendRequest,
        relationshipLabel: isFriend
          ? "Friend"
          : pendingFriendRequest
            ? "Friend request sent"
            : isFollowed
              ? "Following"
              : "Public player",
        availableToJoin: Boolean(active?.group?.inviteCode || active?.round?.inviteCode),
        joinActionLabel: active ? (isFriend ? "Join friend" : "Join round") : (pendingFriendRequest ? "View card" : "Send invite"),
        updatedAt: activity.updatedAt || 0,
      };
    })
    .sort((left, right) =>
      Number(right.isFriend) - Number(left.isFriend)
      || Number(right.isLive) - Number(left.isLive)
      || Number(right.isFollowed) - Number(left.isFollowed)
      || (right.updatedAt || 0) - (left.updatedAt || 0)
      || right.displayName.localeCompare(left.displayName)
    );
}

export function listFriendActivity(state) {
  const friendIds = getFriendProfileIds(state);
  const activeRoundMap = buildActiveRoundMap(state);

  return friendIds
    .map((profileId) => {
      const profile = (state.profiles || []).find((entry) => entry.id === profileId);
      if (!profile) {
        return null;
      }

      const active = activeRoundMap.get(profile.id);
      const roundsPlayed = profile.publicProfile?.roundsPlayed || 0;

      return {
        profileId: profile.id,
        displayName: profile.publicProfile.displayName,
        avatarLabel: profile.publicProfile.avatarLabel,
        statusLabel: active
          ? `${active.round.courseName} / Hole ${active.round.currentHole}`
          : profile.publicProfile.recentFormSummary || "Ready for the next round",
        activityLabel: active
          ? "Live now"
          : roundsPlayed
            ? `${roundsPlayed} total rounds`
            : "New golfer",
        inviteCode: active?.group?.inviteCode || active?.round?.inviteCode || "",
        canJoin: Boolean(active?.group?.inviteCode || active?.round?.inviteCode),
        isLive: Boolean(active),
      };
    })
    .filter(Boolean)
    .sort((left, right) =>
      Number(right.isLive) - Number(left.isLive)
      || left.displayName.localeCompare(right.displayName)
    )
    .slice(0, 4);
}

export function getNearbyStrategySummary(state) {
  const nearbyState = getNearbyState(state);
  const locationReady = nearbyState.locationPermission === "granted" && Boolean(nearbyState.coordinates);
  const bluetoothReady = nearbyState.bluetoothStatus === "ready";
  const usingFallback = nearbyState.locationPermission === "denied" || nearbyState.locationStatus === "unavailable";
  const signals = ["Live rooms", "Friend activity", "Recent app presence"];

  if (locationReady) {
    signals.unshift("Location assist");
  }

  if (bluetoothReady) {
    signals.push("Nearby sync standby");
  }

  return {
    title: locationReady
      ? "Nearby with location assist"
      : "Discoverable now",
    badge: bluetoothReady
      ? "Bluetooth ready"
      : locationReady
        ? "Location on"
        : usingFallback
          ? "App-safe discovery"
          : "Live app discovery",
    detail: usingFallback
      ? "Location is off, so Golfers Nation is using active rounds, friend availability, and recent activity instead."
      : locationReady
        ? "Live rooms and social activity are ranked with lightweight location assist when permission is available."
        : "Golfers Nation is using live rooms, active golfers, and friend activity to surface nearby-style discovery right now.",
    signals,
    locationReady,
    bluetoothReady,
    lastScanAt: nearbyState.lastScanAt || 0,
  };
}

export function getNearbyDiscoveryState(state) {
  const games = listNearbyGames(state);
  const players = listNearbyPlayers(state);
  const friends = listFriendActivity(state);

  return {
    strategy: getNearbyStrategySummary(state),
    games,
    players,
    friends,
  };
}
