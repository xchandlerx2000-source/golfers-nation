import { createActivity } from "../domain/factories.js";
import { createDefaultNearbyState } from "../services/nearby-detection-service.js";

export function appendActivity(draft, message, type = "product") {
  draft.social.activity.unshift(
    createActivity({
      type,
      message,
    })
  );
  draft.social.activity = draft.social.activity.slice(0, 16);
}

export function setFeedback(draft, tone, title, message) {
  draft.session.feedback = {
    tone,
    title,
    message,
    updatedAt: Date.now(),
  };
  draft.session.pendingLabel = "";
}

export function clearFeedback(draft) {
  draft.session.feedback = null;
  draft.session.pendingLabel = "";
}

export function getDefaultCloudSyncState() {
  return {
    status: "idle",
    scope: "",
    roundId: null,
    userId: null,
    errorMessage: "",
    lastAttemptAt: 0,
    lastSuccessAt: 0,
    retryCount: 0,
  };
}

export function getDefaultNearbySessionState() {
  return createDefaultNearbyState();
}

export function mergeNearbySessionState(current = {}, updates = {}) {
  return {
    ...getDefaultNearbySessionState(),
    ...(current || {}),
    ...(updates || {}),
  };
}

export function setNearbySessionState(draft, updates = {}) {
  draft.session.nearby = mergeNearbySessionState(draft.session.nearby, updates);
}

export function mergeCloudSyncState(current = {}, updates = {}) {
  return {
    ...getDefaultCloudSyncState(),
    ...(current || {}),
    ...(updates || {}),
  };
}

export function setCloudSyncState(draft, updates = {}) {
  draft.session.cloudSync = mergeCloudSyncState(draft.session.cloudSync, updates);
}

export function resetCloudSyncState(draft) {
  draft.session.cloudSync = mergeCloudSyncState(draft.session.cloudSync, {
    status: "idle",
    scope: "",
    roundId: null,
    userId: null,
    errorMessage: "",
    retryCount: 0,
    lastSuccessAt: Date.now(),
  });
}

export function getCloudSyncCopy(scope = "workspace", roundId = null) {
  if (scope === "round-finish") {
    return {
      pendingLabel: "Backing up this round to your golfer account...",
      successTitle: "Round backed up",
      successMessage: "This round is now saved to your Golfers Nation account and will restore after refresh or sign-in.",
      failureTitle: "Round saved on this device",
      failureMessage: "This round is safe on this phone, but cloud backup needs another try before it appears on restored sessions or another device.",
      retryLabel: "Retry round save",
    };
  }

  return {
    pendingLabel: "Saving your latest changes to the cloud...",
    successTitle: "Cloud save complete",
    successMessage: "Your latest account changes are backed up to this golfer.",
    failureTitle: "Saved on this device",
    failureMessage: "Your latest changes are safe on this phone, but cloud backup needs another try.",
    retryLabel: roundId ? "Retry save" : "Retry cloud save",
  };
}

export function normalizeUsernameInput(value, fallbackName = "golfer") {
  const source = String(value || "").trim() || fallbackName;
  const base = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
  return base ? `@${base}` : "@golfer";
}

export function normalizeAvatarLabel(value, fallbackName = "Golfer") {
  const source = String(value || "").trim().toUpperCase();
  if (source && source.length <= 2 && !source.includes(" ")) {
    return source.slice(0, 2);
  }

  const derived = (source || fallbackName)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  return derived || "GN";
}

export function syncIdentityAcrossRecords(draft) {
  draft.rounds.forEach((round) => {
    round.players.forEach((player) => {
      if (player.userId === draft.currentUser.id || player.profileId === draft.currentUser.profileId) {
        player.name = draft.currentUser.name;
        player.displayName = draft.currentUser.displayName;
        player.username = draft.currentUser.username;
        player.avatarLabel = draft.currentUser.avatarLabel;
      }
    });

    round.sides.forEach((side) => {
      side.playerNames = side.playerIds.map((playerId) => {
        const player = round.players.find((item) => item.id === playerId);
        return player ? player.name : "";
      });
    });
  });

  draft.groups.forEach((group) => {
    group.members.forEach((member) => {
      if (member.userId === draft.currentUser.id || member.profileId === draft.currentUser.profileId) {
        member.displayName = draft.currentUser.name;
        member.username = draft.currentUser.username;
        member.avatarLabel = draft.currentUser.avatarLabel;
      }
    });
  });
}
