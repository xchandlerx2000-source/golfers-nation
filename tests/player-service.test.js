import { describe, expect, it } from "vitest";

import { createDefaultState } from "../src/state/default-state.js";
import {
  buildCompetitivePreview,
  buildFriendLeaderboard,
  buildPlayerComparison,
  ensureProfilesForNames,
  requestFriendProfile,
  toggleFollowProfile,
} from "../src/services/player-service.js";

describe("player service", () => {
  it("creates persistent profile descriptors for round participants", () => {
    const state = createDefaultState();
    const startingProfiles = state.profiles.length;

    const descriptors = ensureProfilesForNames(state, ["Avery Brooks", "Reese Hall"]);

    expect(descriptors[0].profileId).toBe(state.currentUser.profileId);
    expect(descriptors[1].displayName).toBe("Reese Hall");
    expect(state.profiles.length).toBe(startingProfiles + 1);
  });

  it("builds a competitive preview from completed profile-linked rounds", () => {
    const state = createDefaultState();
    const preview = buildCompetitivePreview(state, state.currentUser.profileId);

    expect(preview.displayName).toBe("Avery Brooks");
    expect(preview.roundsPlayed).toBeGreaterThan(0);
    expect(preview.recentFormSummary).not.toBe("First round pending");
    expect(typeof preview.fairwayPercentage).toBe("number");
    expect(typeof preview.girPercentage).toBe("number");
    expect(preview.formLabel).toBeTruthy();
    expect(preview.strokesGained).toBeTruthy();
    expect(Array.isArray(preview.hardestHoles)).toBe(true);
    expect(preview.smartInsights.length).toBeGreaterThan(0);
  });

  it("builds a side-by-side comparison for public player stats", () => {
    const state = createDefaultState();
    const comparison = buildPlayerComparison(state, state.currentUser.profileId, "profile-maya");

    expect(comparison.left.displayName).toBe("Avery Brooks");
    expect(comparison.right.displayName).toBe("Maya Chen");
    expect(comparison.metricRows).toHaveLength(6);
    expect(comparison.metricRows.map((row) => row.label)).toContain("Average score");
    expect(comparison.metricRows.map((row) => row.label)).toContain("Driving");
    expect(comparison.right.headToHeadLabel).toContain("shared rounds");
  });

  it("tracks follow and friend-request scaffolding on public player cards", () => {
    const state = createDefaultState();
    const [, reese] = ensureProfilesForNames(state, ["Avery Brooks", "Reese Hall"]);

    const followResult = toggleFollowProfile(state, "profile-theo");
    const friendResult = requestFriendProfile(state, reese.profileId);
    const theoPreview = buildCompetitivePreview(state, "profile-theo", state.currentUser.profileId);
    const reesePreview = buildCompetitivePreview(state, reese.profileId, state.currentUser.profileId);

    expect(followResult.isFollowed).toBe(false);
    expect(friendResult.status).toBe("requested");
    expect(theoPreview?.isFollowed).toBe(false);
    expect(reesePreview?.pendingFriendRequest).toBe(true);
    expect(reesePreview?.relationshipLabel).toBe("Friend request sent");
  });

  it("builds a friend leaderboard from followed and friend golfers", () => {
    const state = createDefaultState();
    const leaderboard = buildFriendLeaderboard(state);

    expect(leaderboard.length).toBeGreaterThan(0);
    expect(leaderboard[0].relationshipLabel).toBe("Friend");
    expect(leaderboard.some((entry) => entry.profileId === "profile-theo")).toBe(true);
  });
});
