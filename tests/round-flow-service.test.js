import { describe, expect, it } from "vitest";

import { createGroup, createRound } from "../src/domain/factories.js";
import {
  applyJoinedRoundConnectionState,
  ensureHostedGroupForRound,
  getDefaultRoundSetup,
  parsePlayers,
  upsertJoinedRoundIntoState,
} from "../src/services/round-flow-service.js";
import { createDefaultState } from "../src/state/default-state.js";

describe("round flow service", () => {
  it("keeps the current user first and caps live rounds at four players", () => {
    const result = parsePlayers("Jordan Wells, jordan wells, Theo Grant, Maya Chen, Reese Hall", "Avery Brooks");

    expect(result.names).toEqual([
      "Avery Brooks",
      "Jordan Wells",
      "Theo Grant",
      "Maya Chen",
    ]);
    expect(result.note).toContain("first four names");

    const minimal = parsePlayers("", "Avery Brooks");
    expect(minimal.names).toEqual(["Avery Brooks"]);
    expect(minimal.note).toBe("");
  });

  it("falls back safely when the current user name is missing", () => {
    const result = parsePlayers("Jordan Wells", "");

    expect(result.names).toEqual(["Golfer", "Jordan Wells"]);
  });

  it("builds a hosted group once and reuses it on later host requests", () => {
    const state = createDefaultState();
    const round = createRound({
      currentUser: state.currentUser,
      courseName: "The Country Club at Golden Nugget",
      teeBox: "Gold",
      mode: "stroke",
      players: [state.currentUser.displayName],
    });

    const first = ensureHostedGroupForRound(state, round);
    const second = ensureHostedGroupForRound(state, round);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.group.id).toBe(first.group.id);
    expect(state.groups.some((group) => group.id === first.group.id)).toBe(true);
    expect(round.sync.state).toBe("hosting");
    expect(round.sync.label).toBe("Invite code");
  });

  it("applies joined round connection state and upserts round/group safely", () => {
    const state = createDefaultState();
    const round = createRound({
      currentUser: state.currentUser,
      courseName: "The Country Club at Golden Nugget",
      teeBox: "Gold",
      mode: "stroke",
      players: [state.currentUser.displayName, "Maya Chen"],
    });
    const group = createGroup({
      round,
      currentUser: state.currentUser,
      inviteCode: "GN1234",
    });

    applyJoinedRoundConnectionState(round, "cloud");
    upsertJoinedRoundIntoState(state, { round, group });

    expect(round.sync.state).toBe("connected");
    expect(round.sync.transport).toBe("cloud");
    expect(round.sync.label).toBe("Live cloud sync");
    expect(state.rounds[0].id).toBe(round.id);
    expect(state.groups[0].id).toBe(group.id);
  });

  it("starts round setup without a preselected featured course", () => {
    const setup = getDefaultRoundSetup();

    expect(setup.selectedCourseId).toBe("");
    expect(setup.selectedTeeBoxId).toBe("");
  });
});
