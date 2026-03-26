import { isSideBasedMode } from "../config.js";
import {
  ensureRoundSyncScaffold,
  getPendingRoundEvents,
  workspaceHasPendingRoundSync,
} from "../domain/round-sync.js";
import { refreshProfileSnapshots, syncCurrentUserProfile } from "../services/player-service.js";
import { appendActivity, setFeedback } from "./session-state.js";

export function findRound(state, roundId) {
  return (state?.rounds || []).find((round) => round.id === roundId) || null;
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

function buildLiveGroupMember(member = {}, participantId = null) {
  return {
    id: member.id || `member-${member.userId || member.profileId || participantId || Date.now()}`,
    playerId: participantId || member.playerId || null,
    profileId: member.profileId || null,
    userId: member.userId || null,
    displayName: member.displayName || "Golfer",
    username: member.username || "",
    avatarLabel: member.avatarLabel || "GN",
    role: member.role || "player",
    connectionState: member.connectionState || "connected",
  };
}

function createStrokeEntry(participantId) {
  return {
    participantId,
    strokes: null,
    putts: null,
    penalties: 0,
    fairwayHit: false,
    gir: false,
    upAndDown: false,
    sandSave: false,
    updatedAt: null,
    lastEventId: null,
  };
}

function ensureMemberOnRound(round, member) {
  if (!round || !member) {
    return { participantId: null, added: false };
  }

  let participant = (round.players || []).find((player) =>
    player.id === member.playerId
      || player.userId === member.userId
      || player.profileId === member.profileId
  ) || null;
  let added = false;

  if (!participant) {
    participant = {
      id: member.playerId || `player-${Date.now()}`,
      profileId: member.profileId || null,
      userId: member.userId || null,
      name: member.displayName || "Golfer",
      displayName: member.displayName || "Golfer",
      username: member.username || "",
      avatarLabel: member.avatarLabel || "GN",
      role: member.role === "host" ? "owner" : "guest",
    };
    round.players = Array.isArray(round.players) ? round.players : [];
    round.players.push(participant);
    added = true;

    if (!isSideBasedMode(round.mode)) {
      round.holes.forEach((hole) => {
        hole.entries = Array.isArray(hole.entries) ? hole.entries : [];
        hole.entries.push(createStrokeEntry(participant.id));
      });
    } else if (Array.isArray(round.sides) && round.sides.length) {
      const targetSide = [...round.sides].sort((left, right) => left.playerIds.length - right.playerIds.length)[0];
      if (targetSide) {
        targetSide.playerIds.push(participant.id);
        targetSide.playerNames = targetSide.playerIds
          .map((playerId) => round.players.find((player) => player.id === playerId)?.name || "")
          .filter(Boolean);
      }
    }
  }

  participant.id = member.playerId || participant.id;
  participant.profileId = member.profileId || participant.profileId || null;
  participant.userId = member.userId || participant.userId || null;
  participant.name = member.displayName || participant.name;
  participant.displayName = member.displayName || participant.displayName || participant.name;
  participant.username = member.username || participant.username;
  participant.avatarLabel = member.avatarLabel || participant.avatarLabel || "GN";

  if (Array.isArray(round.sides)) {
    round.sides.forEach((side) => {
      side.playerNames = side.playerIds
        .map((playerId) => round.players.find((player) => player.id === playerId)?.name || "")
        .filter(Boolean);
    });
  }

  return {
    participantId: participant.id,
    added,
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

export function mergeLiveSessionMember(draft, {
  inviteCode = "",
  roundId = null,
  sessionId = null,
  member = null,
} = {}) {
  if (!member) {
    return {
      round: null,
      group: null,
      participantId: null,
      added: false,
      createdGroup: false,
    };
  }

  const resolved = resolveLiveRoundSessionEntities(draft, {
    inviteCode,
    roundId,
    sessionId,
    createGroupIfMissing: true,
  });
  const round = resolved.round;
  const group = resolved.group;

  if (!round) {
    return {
      round: null,
      group,
      participantId: null,
      added: false,
      createdGroup: resolved.createdGroup,
    };
  }

  if (group) {
    group.members = Array.isArray(group.members) ? group.members : [];
  }

  const ensuredMember = ensureMemberOnRound(round, member);
  const nextMember = buildLiveGroupMember(member, ensuredMember.participantId);
  const existingMember = group?.members?.find((entry) =>
    entry.id === nextMember.id
      || entry.playerId === nextMember.playerId
      || entry.userId === nextMember.userId
      || entry.profileId === nextMember.profileId
  ) || null;

  if (existingMember) {
    Object.assign(existingMember, nextMember);
  } else if (group) {
    group.members.push(nextMember);
  }

  if (group) {
    group.updatedAt = Date.now();
  }

  return {
    round,
    group,
    participantId: ensuredMember.participantId,
    added: ensuredMember.added,
    createdGroup: resolved.createdGroup,
  };
}

export function getNextIncompleteHoleNumber(round, participantId, currentHoleNumber) {
  const holes = Array.isArray(round?.holes) ? round.holes : [];
  const orderedHoles = holes
    .slice(currentHoleNumber)
    .concat(holes.slice(0, currentHoleNumber));
  const nextHole = orderedHoles.find((hole) => {
    const entry = (hole.entries || []).find((item) => item.participantId === participantId);
    return entry && (entry.strokes === null || entry.strokes === 0);
  });

  return nextHole ? nextHole.number : currentHoleNumber;
}

export function isRoundFullyScored(round) {
  const holes = Array.isArray(round?.holes) ? round.holes : [];
  if (!holes.length) {
    return false;
  }

  return holes.every((hole) =>
    Array.isArray(hole?.entries)
    && hole.entries.length > 0
    && hole.entries.every((entry) => Number.isFinite(entry?.strokes) && entry.strokes > 0)
  );
}

export function getPreferredRoundScreenMode(round) {
  if (!round) {
    return "setup";
  }

  return isRoundFullyScored(round) ? "finished" : "score";
}

export function finishRound(draft, roundId, dataGateway, setActiveView) {
  const round = (draft?.rounds || []).find((item) => item.id === roundId) || null;
  if (!round) {
    return null;
  }

  const progress = (round.holes || []).filter((hole) => (hole.entries || []).some((entry) => entry.strokes && entry.strokes > 0)).length;
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

function removeRoundArtifacts(draft, round) {
  if (!round) {
    return;
  }

  draft.rounds = (draft.rounds || []).filter((entry) => entry.id !== round.id);
  draft.groups = (draft.groups || []).filter((group) =>
    group.roundId !== round.id
      && group.id !== round.groupId
      && (!round.inviteCode || group.inviteCode !== round.inviteCode)
  );

  if (draft.session.summaryRoundId === round.id) {
    draft.session.summaryRoundId = null;
  }
}

function isLiveRound(round, group) {
  return Boolean(
    group?.inviteCode
      || round?.inviteCode
      || (round?.sync?.transport && round.sync.transport !== "local")
  );
}

export function endRound(draft, roundId, dataGateway, setActiveView) {
  const round = (draft?.rounds || []).find((item) => item.id === roundId) || null;
  if (!round) {
    return null;
  }

  const group = (draft?.groups || []).find((entry) =>
    entry.roundId === round.id
      || entry.id === round.groupId
      || (round.inviteCode && entry.inviteCode === round.inviteCode)
  ) || null;
  const liveRound = isLiveRound(round, group);
  const courseName = round.courseName || "This round";

  removeRoundArtifacts(draft, round);

  draft.session.activeRoundId = null;
  draft.session.selectedHole = 1;
  draft.session.lastScoredParticipantId = null;
  draft.session.roundScreenMode = "setup";
  draft.session.selectedProfileId = draft.currentUser.profileId;
  setActiveView(draft, "home", "tab");

  appendActivity(
    draft,
    liveRound
      ? `${draft.currentUser.displayName} left ${courseName}.`
      : `${courseName} was ended before finishing.`,
    "round"
  );
  setFeedback(
    draft,
    "info",
    liveRound ? "You left the round" : "Round ended",
    liveRound
      ? `${courseName} was removed from this phone. Other golfers can keep playing.`
      : `${courseName} was removed from this phone and will not be added to round history.`
  );

  refreshProfileSnapshots(draft);
  syncCurrentUserProfile(draft);
  dataGateway.saveWorkspace(draft, draft.currentUser.id);

  return round.id;
}
