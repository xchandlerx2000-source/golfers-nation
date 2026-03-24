import { CONNECTION_COPY, GAME_MODES } from "../config.js";
import { createGroup, createRound } from "../domain/factories.js";
import { ensureProfilesForNames } from "./player-service.js";
import { getSeededNearbyRooms } from "./nearby-detection-service.js";

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

  const seeded = getSeededNearbyRooms().find((room) => room.inviteCode === normalized);
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
