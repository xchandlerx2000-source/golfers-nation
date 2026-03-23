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
