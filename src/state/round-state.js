import {
  ensureRoundSyncScaffold,
  getPendingRoundEvents,
  workspaceHasPendingRoundSync,
} from "../domain/round-sync.js";
import { refreshProfileSnapshots, syncCurrentUserProfile } from "../services/player-service.js";
import { appendActivity, setFeedback } from "./session-state.js";

export function findRound(state, roundId) {
  return state.rounds.find((round) => round.id === roundId);
}

export function getRoundEventSyncCopy(round, pendingCount = getPendingRoundEvents(round).length) {
  const courseName = round?.courseName || "This round";
  const baseSubject = pendingCount === 1 ? "1 live change" : `${pendingCount} live changes`;

  return {
    pendingLabel: pendingCount ? `Backing up ${baseSubject} from ${courseName}...` : "Checking live round backup...",
    successTitle: "Live round synced",
    successMessage: `${courseName} is backed up and safe to reopen on this golfer account.`,
    failureTitle: "Saved locally",
    failureMessage: pendingCount
      ? `${baseSubject} are safe on this phone, and Golfers Nation will keep retrying when the connection improves.`
      : `${courseName} is still safe on this device, and Golfers Nation will keep retrying when the connection improves.`,
    retryLabel: "Retry live sync",
  };
}

export function hasPendingRoundSyncForUser(state, userId = state.auth?.activeUserId || state.currentUser?.id || null) {
  if (!userId) {
    return false;
  }

  return workspaceHasPendingRoundSync({
    rounds: state.rounds,
  });
}

export function collectPendingRoundEvents(state, userId = state.auth?.activeUserId || state.currentUser?.id || null) {
  if (!userId) {
    return [];
  }

  return (state.rounds || [])
    .map((round) => ({
      round,
      events: getPendingRoundEvents(round),
    }))
    .filter(({ events }) => events.length)
    .map(({ round, events }) => ({
      roundId: round.id,
      eventIds: events.map((event) => event.id),
      pendingCount: events.length,
      events,
    }));
}

export function updateRoundSyncDraft(draft, roundId, updater) {
  const round = findRound(draft, roundId);
  if (!round) {
    return null;
  }

  ensureRoundSyncScaffold(round);
  updater(round);
  return round;
}

function normalizeInviteCode(value = "") {
  return String(value || "").trim().toUpperCase();
}

function createGroupMemberFromPlayer(player, index = 0) {
  return {
    id: `member-${player.id || player.profileId || player.userId || index}`,
    playerId: player.id || null,
    profileId: player.profileId || null,
    userId: player.userId || null,
    displayName: player.displayName || player.name || "Golfer",
    username: player.username || "",
    avatarLabel: player.avatarLabel || "GN",
    role: index === 0 ? "host" : "player",
    connectionState: index === 0 ? "ready" : "connected",
  };
}

export function ensureLiveRoundGroupState(draft, round, {
  inviteCode = "",
  sessionId = null,
} = {}) {
  if (!round) {
    return null;
  }

  const normalizedInviteCode = normalizeInviteCode(inviteCode || round.inviteCode);
  const nextGroup = {
    id: sessionId || round.groupId || `group-${round.id}`,
    roundId: round.id,
    title: `${round.courseName} live round`,
    inviteCode: normalizedInviteCode,
    status: "active",
    transport: round.sync?.transport || "cloud",
    hostUserId: round.players?.[0]?.userId || null,
    createdAt: round.createdAt || Date.now(),
    updatedAt: Date.now(),
    hostRequired: false,
    hostOptional: true,
    members: (round.players || []).map((player, index) => createGroupMemberFromPlayer(player, index)),
    feed: [],
  };

  if (normalizedInviteCode) {
    round.inviteCode = normalizedInviteCode;
  }
  round.groupId = nextGroup.id;
  draft.groups.unshift(nextGroup);
  return nextGroup;
}

export function resolveLiveRoundSessionEntities(draft, {
  inviteCode = "",
  roundId = null,
  sessionId = null,
  createGroupIfMissing = false,
} = {}) {
  const normalizedInviteCode = normalizeInviteCode(inviteCode);
  let round = roundId ? draft.rounds.find((entry) => entry.id === roundId) || null : null;
  let group = sessionId ? draft.groups.find((entry) => entry.id === sessionId) || null : null;

  if (!group && normalizedInviteCode) {
    group = draft.groups.find((entry) => entry.inviteCode === normalizedInviteCode) || null;
  }

  if (!round && group?.roundId) {
    round = draft.rounds.find((entry) => entry.id === group.roundId) || null;
  }

  if (!round && normalizedInviteCode) {
    round = draft.rounds.find((entry) => entry.inviteCode === normalizedInviteCode) || null;
  }

  if (!group && round) {
    group = draft.groups.find((entry) =>
      entry.roundId === round.id
        || (round.groupId && entry.id === round.groupId)
    ) || null;
  }

  let createdGroup = false;
  if (!group && round && createGroupIfMissing) {
    group = ensureLiveRoundGroupState(draft, round, {
      inviteCode: normalizedInviteCode,
      sessionId,
    });
    createdGroup = Boolean(group);
  }

  if (round && normalizedInviteCode && !round.inviteCode) {
    round.inviteCode = normalizedInviteCode;
  }

  if (group) {
    if (!group.roundId && round?.id) {
      group.roundId = round.id;
    }
    if (normalizedInviteCode && !group.inviteCode) {
      group.inviteCode = normalizedInviteCode;
    }
  }

  if (round && group?.id && !round.groupId) {
    round.groupId = group.id;
  }

  return {
    round,
    group,
    createdGroup,
  };
}

export function upsertLiveRoundSessionState(draft, incoming, {
  mergeRound = (existingRound, nextRound) => nextRound,
} = {}) {
  if (!incoming?.round) {
    return {
      round: null,
      group: null,
      roundIndex: -1,
      groupIndex: -1,
    };
  }

  const roundIndex = draft.rounds.findIndex((round) =>
    round.id === incoming.round.id
      || (incoming.inviteCode && round.inviteCode === incoming.inviteCode)
  );
  const existingRound = roundIndex >= 0 ? draft.rounds[roundIndex] : null;
  const nextRound = mergeRound(existingRound, incoming.round);
  const canonicalInviteCode = incoming.inviteCode
    || incoming.group?.inviteCode
    || existingRound?.inviteCode
    || "";
  const canonicalGroupId = incoming.group?.id
    || nextRound.groupId
    || existingRound?.groupId
    || null;

  if (canonicalInviteCode) {
    nextRound.inviteCode = canonicalInviteCode;
  }

  if (canonicalGroupId) {
    nextRound.groupId = canonicalGroupId;
  }

  if (roundIndex >= 0) {
    draft.rounds[roundIndex] = nextRound;
  } else {
    draft.rounds.unshift(nextRound);
  }

  let nextGroup = incoming.group || null;
  let groupIndex = -1;
  if (nextGroup) {
    groupIndex = draft.groups.findIndex((group) =>
      group.id === nextGroup.id
        || group.roundId === nextRound.id
        || (incoming.inviteCode && group.inviteCode === incoming.inviteCode)
    );

    if (groupIndex >= 0) {
      draft.groups[groupIndex] = nextGroup;
      nextGroup = draft.groups[groupIndex];
    } else {
      draft.groups.unshift(nextGroup);
      groupIndex = 0;
    }
  }

  return {
    round: nextRound,
    group: nextGroup,
    roundIndex,
    groupIndex,
  };
}

export function getNextIncompleteHoleNumber(round, participantId, currentHoleNumber) {
  const orderedHoles = round.holes
    .slice(currentHoleNumber)
    .concat(round.holes.slice(0, currentHoleNumber));
  const nextHole = orderedHoles.find((hole) => {
    const entry = hole.entries.find((item) => item.participantId === participantId);
    return entry && (entry.strokes === null || entry.strokes === 0);
  });

  return nextHole ? nextHole.number : currentHoleNumber;
}

export function finishRound(draft, roundId, dataGateway, setActiveView) {
  const round = draft.rounds.find((item) => item.id === roundId);
  if (!round) {
    return null;
  }

  const progress = round.holes.filter((hole) => hole.entries.some((entry) => entry.strokes && entry.strokes > 0)).length;
  if (!progress) {
    setFeedback(
      draft,
      "info",
      "Score at least one hole",
      "Enter a score before finishing so the round summary and stats have something real to save."
    );
    return null;
  }

  round.status = "completed";
  round.completedAt = Date.now();
  round.updatedAt = Date.now();
  draft.session.summaryRoundId = round.id;
  appendActivity(draft, `${round.courseName} was finished and moved into round history.`, "round");
  setFeedback(
    draft,
    "info",
    "Round finished",
    `${round.courseName} was added to ${draft.currentUser.displayName}'s history on this device. Cloud backup is finishing now.`
  );
  draft.session.activeRoundId = null;
  draft.session.selectedHole = 1;
  draft.session.selectedProfileId = draft.currentUser.profileId;
  setActiveView(draft, "stats", "tab");
  refreshProfileSnapshots(draft);
  syncCurrentUserProfile(draft);
  dataGateway.saveWorkspace(draft, draft.currentUser.id);
  return round.id;
}
