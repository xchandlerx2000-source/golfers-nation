import { CONNECTION_COPY } from "../config.js";
import { uid } from "../utils/formatters.js";
import { applyHoleUpdate } from "./scoring.js";

export const ROUND_CONFLICT_STRATEGY = "latest-write-wins";

const DEFAULT_SYNC_NOTE = "Offline-first round data with a future real-time sync path.";
const LOCAL_SAVE_NOTE = "Scores are safe on this device first and will keep trying to back up when signal returns.";
const SYNCING_NOTE = "Local changes are safe and currently backing up to the cloud.";
const SYNCED_NOTE = "All live round changes are backed up.";

function getRawPendingRoundEvents(round) {
  const events = Array.isArray(round?.eventLog) ? round.eventLog : [];
  return events.filter((event) => event.syncState !== "synced");
}

function detectActionType(patch = {}) {
  if (Object.hasOwn(patch, "strokes")) {
    return "score-set";
  }

  if (Object.hasOwn(patch, "putts")) {
    return "putts-updated";
  }

  if (Object.hasOwn(patch, "penalties")) {
    return "penalty-updated";
  }

  return "stat-toggle-changed";
}

export function ensureRoundSyncScaffold(round) {
  if (!round) {
    return round;
  }

  round.eventLog = Array.isArray(round.eventLog) ? round.eventLog : [];
  round.sync = {
    state: "local",
    transport: "local",
    label: CONNECTION_COPY.local,
    lastEventAt: null,
    note: DEFAULT_SYNC_NOTE,
    hostRequired: false,
    hostOptional: true,
    saveState: round.status === "completed" ? "synced" : "saved-local",
    pendingActionCount: 0,
    lastLocalSaveAt: round.updatedAt || round.createdAt || Date.now(),
    lastSyncedAt: 0,
    lastSyncError: "",
    conflictStrategy: ROUND_CONFLICT_STRATEGY,
    ...(round.sync || {}),
  };

  round.sync.hostRequired = false;
  round.sync.hostOptional = true;
  round.sync.conflictStrategy = ROUND_CONFLICT_STRATEGY;
  round.sync.pendingActionCount = getRawPendingRoundEvents(round).length;

  if (!round.sync.lastLocalSaveAt) {
    round.sync.lastLocalSaveAt = round.updatedAt || round.createdAt || Date.now();
  }

  if (!round.sync.lastSyncedAt && round.sync.pendingActionCount === 0 && round.status === "completed") {
    round.sync.lastSyncedAt = round.completedAt || round.updatedAt || Date.now();
  }

  return round;
}

export function createRoundActionEvent({
  roundId,
  participantId,
  holeNumber,
  patch,
  actorUserId = null,
  deviceId = "local-device",
  actionType,
  occurredAt = Date.now(),
} = {}) {
  const nextPatch = { ...(patch || {}) };

  return {
    id: uid("round-event"),
    roundId,
    participantId,
    holeNumber: Number(holeNumber) || 1,
    patch: nextPatch,
    fields: Object.keys(nextPatch),
    actionType: actionType || detectActionType(nextPatch),
    actorUserId,
    deviceId,
    occurredAt,
    syncState: "pending",
    syncAttempts: 0,
    lastAttemptAt: 0,
    lastError: "",
    syncedAt: 0,
    conflictStrategy: ROUND_CONFLICT_STRATEGY,
  };
}

export function appendRoundAction(round, event) {
  ensureRoundSyncScaffold(round);
  round.eventLog.push(event);
  round.sync.pendingActionCount = getRawPendingRoundEvents(round).length;
  round.sync.lastLocalSaveAt = event?.occurredAt || Date.now();
  round.sync.lastEventAt = event?.occurredAt || Date.now();
  round.sync.lastSyncError = "";
  round.sync.saveState = "saved-local";
  round.sync.note = LOCAL_SAVE_NOTE;
  return event;
}

export function applyRoundActionEvent(round, event) {
  ensureRoundSyncScaffold(round);

  const hole = round.holes.find((item) => item.number === Number(event?.holeNumber));
  const entry = hole?.entries.find((item) => item.participantId === event?.participantId);
  if (!hole || !entry) {
    return {
      applied: false,
      reason: "missing-entry",
      conflictStrategy: ROUND_CONFLICT_STRATEGY,
    };
  }

  const eventTimestamp = Number(event?.occurredAt) || Date.now();
  const currentTimestamp = Number(entry.updatedAt) || 0;
  if (currentTimestamp && eventTimestamp < currentTimestamp) {
    return {
      applied: false,
      reason: "stale-event",
      conflictStrategy: ROUND_CONFLICT_STRATEGY,
    };
  }

  applyHoleUpdate(round, hole.number, entry.participantId, event.patch || {}, {
    timestamp: eventTimestamp,
    eventId: event.id,
  });

  round.sync.lastEventAt = eventTimestamp;
  round.sync.lastLocalSaveAt = eventTimestamp;
  return {
    applied: true,
    conflictStrategy: ROUND_CONFLICT_STRATEGY,
  };
}

export function getPendingRoundEvents(round) {
  ensureRoundSyncScaffold(round);
  return getRawPendingRoundEvents(round);
}

export function markRoundEventsSyncing(round, eventIds = [], attemptedAt = Date.now()) {
  ensureRoundSyncScaffold(round);
  const idSet = new Set(eventIds);

  round.eventLog.forEach((event) => {
    if (idSet.has(event.id) && event.syncState !== "synced") {
      event.syncState = "syncing";
      event.syncAttempts = (event.syncAttempts || 0) + 1;
      event.lastAttemptAt = attemptedAt;
      event.lastError = "";
    }
  });

  round.sync.pendingActionCount = getRawPendingRoundEvents(round).length;
  round.sync.saveState = round.sync.pendingActionCount ? "syncing" : "synced";
  round.sync.lastSyncError = "";
  round.sync.note = round.sync.pendingActionCount ? SYNCING_NOTE : SYNCED_NOTE;
}

export function markRoundEventsSynced(round, eventIds = [], syncedAt = Date.now()) {
  ensureRoundSyncScaffold(round);
  const idSet = new Set(eventIds);

  round.eventLog.forEach((event) => {
    if (idSet.has(event.id)) {
      event.syncState = "synced";
      event.syncedAt = syncedAt;
      event.lastError = "";
    }
  });

  round.sync.pendingActionCount = getRawPendingRoundEvents(round).length;
  round.sync.lastSyncedAt = syncedAt;
  round.sync.lastSyncError = "";
  round.sync.saveState = round.sync.pendingActionCount ? "saved-local" : "synced";
  round.sync.note = round.sync.pendingActionCount ? LOCAL_SAVE_NOTE : SYNCED_NOTE;
}

export function markRoundEventsRetryNeeded(round, eventIds = [], errorMessage = "", attemptedAt = Date.now()) {
  ensureRoundSyncScaffold(round);
  const idSet = new Set(eventIds);

  round.eventLog.forEach((event) => {
    if (idSet.has(event.id) && event.syncState !== "synced") {
      event.syncState = "pending";
      event.lastAttemptAt = attemptedAt;
      event.lastError = errorMessage || "";
    }
  });

  round.sync.pendingActionCount = getRawPendingRoundEvents(round).length;
  round.sync.saveState = round.sync.pendingActionCount ? "retry-needed" : "synced";
  round.sync.lastSyncError = errorMessage || "";
  round.sync.note = round.sync.pendingActionCount
    ? "Live updates are still safe on this device. Cloud backup will retry when the connection stabilizes."
    : SYNCED_NOTE;
}

export function workspaceHasPendingRoundSync(workspace) {
  const rounds = workspace?.rounds || [];

  return rounds.some((round) => {
    ensureRoundSyncScaffold(round);
    const pendingCount = getRawPendingRoundEvents(round).length;
    return pendingCount > 0
      || ["syncing", "retry-needed"].includes(round.sync.saveState);
  });
}
