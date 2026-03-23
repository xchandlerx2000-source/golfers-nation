import { describe, expect, it } from "vitest";

import { createRound } from "../src/domain/factories.js";
import {
  appendRoundAction,
  applyRoundActionEvent,
  createRoundActionEvent,
  getPendingRoundEvents,
  markRoundEventsRetryNeeded,
  markRoundEventsSynced,
  markRoundEventsSyncing,
  workspaceHasPendingRoundSync,
} from "../src/domain/round-sync.js";

const currentUser = {
  id: "user-1",
  name: "Avery Brooks",
};

describe("round sync domain helpers", () => {
  it("creates rounds with host-optional sync scaffolding", () => {
    const round = createRound({
      currentUser,
      courseName: "The Country Club at Golden Nugget",
      teeBox: "Gold",
      weather: "Humid 79F",
      mode: "stroke",
      players: ["Avery Brooks", "Maya Chen"],
    });

    expect(round.sync.hostRequired).toBe(false);
    expect(round.sync.hostOptional).toBe(true);
    expect(round.sync.saveState).toBe("saved-local");
    expect(round.eventLog).toEqual([]);
  });

  it("tracks pending round actions and marks them synced after a successful backup", () => {
    const round = createRound({
      currentUser,
      courseName: "The Country Club at Golden Nugget",
      teeBox: "Gold",
      weather: "Humid 79F",
      mode: "stroke",
      players: ["Avery Brooks", "Maya Chen"],
    });
    const participantId = round.players[0].id;
    const event = createRoundActionEvent({
      roundId: round.id,
      participantId,
      holeNumber: 1,
      patch: { strokes: 4, putts: 2, gir: true },
      actorUserId: currentUser.id,
      occurredAt: 1000,
    });

    expect(applyRoundActionEvent(round, event).applied).toBe(true);
    appendRoundAction(round, event);

    expect(getPendingRoundEvents(round)).toHaveLength(1);
    expect(round.sync.pendingActionCount).toBe(1);
    expect(round.holes[0].entries[0].strokes).toBe(4);

    markRoundEventsSyncing(round, [event.id], 1500);
    expect(round.sync.saveState).toBe("syncing");

    markRoundEventsSynced(round, [event.id], 2000);
    expect(getPendingRoundEvents(round)).toHaveLength(0);
    expect(round.sync.pendingActionCount).toBe(0);
    expect(round.sync.saveState).toBe("synced");
    expect(round.sync.lastSyncedAt).toBe(2000);
  });

  it("uses latest update wins for conflicting hole events", () => {
    const round = createRound({
      currentUser,
      courseName: "Golden Nugget",
      teeBox: "Gold",
      weather: "Humid 79F",
      mode: "stroke",
      players: ["Avery Brooks", "Maya Chen"],
    });
    const participantId = round.players[0].id;
    const newerEvent = createRoundActionEvent({
      roundId: round.id,
      participantId,
      holeNumber: 1,
      patch: { strokes: 5 },
      actorUserId: currentUser.id,
      occurredAt: 3000,
    });
    const olderEvent = createRoundActionEvent({
      roundId: round.id,
      participantId,
      holeNumber: 1,
      patch: { strokes: 4 },
      actorUserId: currentUser.id,
      occurredAt: 2000,
    });

    expect(applyRoundActionEvent(round, newerEvent).applied).toBe(true);
    expect(applyRoundActionEvent(round, olderEvent).applied).toBe(false);
    expect(round.holes[0].entries[0].strokes).toBe(5);
  });

  it("keeps pending round actions flagged for retry after a failed backup", () => {
    const round = createRound({
      currentUser,
      courseName: "Golden Nugget",
      teeBox: "Gold",
      weather: "Humid 79F",
      mode: "stroke",
      players: ["Avery Brooks", "Maya Chen"],
    });
    const participantId = round.players[0].id;
    const event = createRoundActionEvent({
      roundId: round.id,
      participantId,
      holeNumber: 1,
      patch: { penalties: 1 },
      actorUserId: currentUser.id,
      occurredAt: 1000,
    });

    applyRoundActionEvent(round, event);
    appendRoundAction(round, event);
    markRoundEventsSyncing(round, [event.id], 1200);
    markRoundEventsRetryNeeded(round, [event.id], "Weak signal.", 1400);

    expect(getPendingRoundEvents(round)).toHaveLength(1);
    expect(round.sync.saveState).toBe("retry-needed");
    expect(round.sync.lastSyncError).toContain("Weak signal");
    expect(workspaceHasPendingRoundSync({ rounds: [round] })).toBe(true);
  });
});
