import { describe, expect, it } from "vitest";

import { createDefaultState } from "../src/state/default-state.js";
import { buildCompetitivePreview, buildPlayerComparison, ensureProfilesForNames } from "../src/services/player-service.js";

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
});
