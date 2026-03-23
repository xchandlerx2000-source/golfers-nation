import { describe, expect, it } from "vitest";

import { createRound } from "../src/domain/factories.js";
import {
  applyHoleUpdate,
  buildLeaderboard,
  getHistoryMetrics,
  getRoundSummary,
  getScoringParticipants,
} from "../src/domain/scoring.js";

const currentUser = {
  id: "user-1",
  name: "Avery Brooks",
};

function scoreHole(
  round,
  participantId,
  holeNumber,
  strokes,
  puttsOrOptions = 2,
  fairwayHit = false,
  gir = false,
  penalties = 0,
  upAndDown = false,
  sandSave = false
) {
  const options = typeof puttsOrOptions === "object"
    ? puttsOrOptions
    : {
        putts: puttsOrOptions,
        fairwayHit,
        gir,
        penalties,
        upAndDown,
        sandSave,
      };

  applyHoleUpdate(round, holeNumber, participantId, {
    strokes,
    putts: options.putts ?? 2,
    fairwayHit: options.fairwayHit ?? false,
    gir: options.gir ?? false,
    penalties: options.penalties ?? 0,
    upAndDown: options.upAndDown ?? false,
    sandSave: options.sandSave ?? false,
  });
}

describe("scoring", () => {
  it("builds a stroke-play leaderboard from hole scores", () => {
    const round = createRound({
      currentUser,
      courseName: "National Pines",
      teeBox: "Blue",
      weather: "Clear 72F",
      mode: "stroke",
      players: ["Avery Brooks", "Maya Chen"],
    });
    const [avery, maya] = round.players;

    scoreHole(round, avery.id, 1, 4, 2, true, true);
    scoreHole(round, avery.id, 2, 5, 2, true, true);
    scoreHole(round, maya.id, 1, 5, 2, false, false);
    scoreHole(round, maya.id, 2, 6, 3, false, false);

    const leaderboard = buildLeaderboard(round, currentUser.id);
    const summary = getRoundSummary(round, currentUser.id);

    expect(leaderboard[0].name).toBe("Avery Brooks");
    expect(leaderboard[0].displayStatus).toBe("E");
    expect(leaderboard[1].displayStatus).toBe("+2");
    expect(summary.holesPlayed).toBe(2);
    expect(summary.localParticipant.name).toBe("Avery Brooks");
  });

  it("builds match-play standings using sides", () => {
    const round = createRound({
      currentUser,
      courseName: "North Point",
      teeBox: "Blue",
      weather: "Calm 70F",
      mode: "match",
      players: ["Avery Brooks", "Maya Chen", "Theo Grant", "Jordan Wells"],
    });
    const [sideA, sideB] = getScoringParticipants(round);

    scoreHole(round, sideA.id, 1, 4, 2, true, true);
    scoreHole(round, sideB.id, 1, 5, 2, false, false);
    scoreHole(round, sideA.id, 2, 5, 2, true, true);
    scoreHole(round, sideB.id, 2, 4, 2, true, true);
    scoreHole(round, sideA.id, 3, 3, 1, false, true);
    scoreHole(round, sideB.id, 3, 4, 2, false, false);

    const leaderboard = buildLeaderboard(round, currentUser.id);

    expect(leaderboard[0].name).toBe(sideA.name);
    expect(leaderboard[0].displayStatus).toBe("1 Up");
    expect(leaderboard[1].displayStatus).toBe("1 Down");
  });

  it("aggregates completed-round history metrics", () => {
    const firstRound = createRound({
      currentUser,
      courseName: "Shadow Ridge",
      teeBox: "Blue",
      weather: "Clear 72F",
      mode: "stroke",
      players: ["Avery Brooks", "Maya Chen"],
      status: "completed",
    });
    const secondRound = createRound({
      currentUser,
      courseName: "Prairie Lake",
      teeBox: "Blue",
      weather: "Warm 76F",
      mode: "stroke",
      players: ["Avery Brooks", "Jordan Wells"],
      status: "completed",
    });

    scoreHole(firstRound, firstRound.players[0].id, 1, 4, { putts: 2, fairwayHit: true, gir: true });
    scoreHole(firstRound, firstRound.players[0].id, 2, 5, { putts: 2, fairwayHit: true, gir: true });
    scoreHole(secondRound, secondRound.players[0].id, 1, 5, {
      putts: 2,
      fairwayHit: false,
      gir: false,
      penalties: 1,
      upAndDown: true,
    });
    scoreHole(secondRound, secondRound.players[0].id, 2, 6, {
      putts: 3,
      fairwayHit: false,
      gir: false,
    });

    const metrics = getHistoryMetrics([firstRound, secondRound], currentUser.id);

    expect(metrics.roundsPlayed).toBe(2);
    expect(metrics.scoringAverage).toBe(10);
    expect(metrics.fairways).toBe(50);
    expect(metrics.gir).toBe(50);
    expect(metrics.putts).toBe(2.25);
    expect(metrics.penaltiesAverage).toBe(0.5);
    expect(metrics.upAndDownRate).toBe(50);
    expect(metrics.scoringByParType[4].averageScore).toBe(4.5);
    expect(metrics.scoringByParType[5].averageScore).toBe(5.5);
    expect(metrics.handicapIndex).toBe(0);
    expect(metrics.strokesGained.driving).toBeTruthy();
    expect(metrics.trendDirection).toBe("flat");
    expect(metrics.smartInsights.length).toBeGreaterThan(0);
  });

  it("builds round insights from live performance data", () => {
    const round = createRound({
      currentUser,
      courseName: "National Pines",
      teeBox: "Blue",
      weather: "Windy 66F",
      mode: "stroke",
      players: ["Avery Brooks", "Maya Chen"],
    });
    const [avery] = round.players;

    scoreHole(round, avery.id, 1, 6, {
      putts: 3,
      fairwayHit: false,
      gir: false,
      penalties: 1,
    });
    scoreHole(round, avery.id, 2, 6, {
      putts: 3,
      fairwayHit: false,
      gir: false,
    });

    const summary = getRoundSummary(round, currentUser.id);

    expect(summary.localTotals.totalPenalties).toBe(1);
    expect(summary.localTotals.averagePutts).toBe(3);
    expect(summary.localTotals.strokesGained.putting.label).toBe("Losing");
    expect(summary.roundInsights.length).toBeGreaterThan(0);
  });

  it("identifies hardest and best holes from completed history", () => {
    const round = createRound({
      currentUser,
      courseName: "Links Point",
      teeBox: "Blue",
      weather: "Clear 70F",
      mode: "stroke",
      players: ["Avery Brooks", "Maya Chen"],
      status: "completed",
    });
    const [avery] = round.players;

    scoreHole(round, avery.id, 1, 5, { putts: 2, fairwayHit: false, gir: false });
    scoreHole(round, avery.id, 2, 4, { putts: 1, fairwayHit: true, gir: true });
    scoreHole(round, avery.id, 3, 5, { putts: 2, fairwayHit: false, gir: false, penalties: 1 });

    const metrics = getHistoryMetrics([round], currentUser.id);

    expect(metrics.hardestHoles[0].holeNumber).toBe(3);
    expect(metrics.bestHoles[0].holeNumber).toBe(2);
    expect(metrics.holePerformance).toHaveLength(3);
  });
});
