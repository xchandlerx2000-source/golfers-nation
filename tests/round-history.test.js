import { describe, expect, it } from "vitest";

import { createRound } from "../packages/core/src/index.js";
import {
  buildFrequentPartners,
  getCompletedRoundSummary,
  summarizeCompletedRounds,
} from "../apps/native/src/lib/round-history.js";

function createCompletedRound({ courseName, completedAt, currentUserId = "user-1", partnerName = "Jordan Lee" }) {
  const round = createRound({
    currentUser: {
      id: currentUserId,
      profileId: "profile-user-1",
      displayName: "Alex Mercer",
      username: "alexmercer",
      avatarLabel: "AM",
    },
    courseName,
    teeBox: "Blue",
    mode: "stroke",
    players: [
      { userId: currentUserId, profileId: "profile-user-1", displayName: "Alex Mercer", username: "alexmercer", avatarLabel: "AM" },
      { profileId: `profile-${partnerName.toLowerCase().replace(/\s+/g, "-")}`, displayName: partnerName, username: partnerName.toLowerCase().replace(/\s+/g, ""), avatarLabel: "JL" },
    ],
    status: "completed",
  });

  round.completedAt = completedAt;
  round.updatedAt = completedAt;
  round.holes = round.holes.map((hole) => ({
    ...hole,
    entries: hole.entries.map((entry, index) => ({
      ...entry,
      strokes: index === 0 ? hole.par : hole.par + 1,
      updatedAt: completedAt,
    })),
  }));
  return round;
}

describe("round history helpers", () => {
  it("summarizes completed rounds and exposes recent rounds", () => {
    const rounds = [
      createCompletedRound({ courseName: "Torrey Pines", completedAt: 200 }),
      createCompletedRound({ courseName: "Pebble Beach", completedAt: 100 }),
    ];

    const stats = summarizeCompletedRounds(rounds, "user-1");

    expect(stats.roundsPlayed).toBe(2);
    expect(stats.recentRounds[0].courseName).toBe("Torrey Pines");
  });

  it("builds frequent playing partners from completed rounds", () => {
    const rounds = [
      createCompletedRound({ courseName: "Torrey Pines", completedAt: 200, partnerName: "Jordan Lee" }),
      createCompletedRound({ courseName: "Pebble Beach", completedAt: 100, partnerName: "Jordan Lee" }),
    ];

    const partners = buildFrequentPartners(rounds, "user-1");

    expect(partners[0].name).toBe("Jordan Lee");
    expect(partners[0].rounds).toBe(2);
  });

  it("returns a summary for a specific completed round id", () => {
    const round = createCompletedRound({ courseName: "Torrey Pines", completedAt: 200 });

    const summary = getCompletedRoundSummary([round], "user-1", round.id);

    expect(summary?.id).toBe(round.id);
    expect(summary?.courseName).toBe("Torrey Pines");
  });
});
