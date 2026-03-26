import { getRoundSummary } from "@golfers-nation/core";

function normalizeRound(round = {}) {
  if (!round?.id || !Array.isArray(round?.holes)) {
    return null;
  }

  return {
    ...round,
    status: "completed",
    completedAt: Number(round.completedAt || Date.now()),
    updatedAt: Number(round.updatedAt || round.completedAt || Date.now()),
  };
}

function getLocalEntry(summary = {}) {
  return summary?.localParticipant || summary?.leaderboard?.[0] || null;
}

export function normalizeCompletedRounds(rounds = []) {
  return (Array.isArray(rounds) ? rounds : [])
    .map(normalizeRound)
    .filter(Boolean)
    .sort((left, right) => Number(right.completedAt || 0) - Number(left.completedAt || 0));
}

export function buildCompletedRoundSummaries(rounds = [], currentUserId = "") {
  return normalizeCompletedRounds(rounds).map((round) => {
    const summary = getRoundSummary(round, currentUserId);
    const localEntry = getLocalEntry(summary);

    return {
      id: round.id,
      round,
      summary,
      courseName: round.courseName || "Golf course",
      completedAt: Number(round.completedAt || round.updatedAt || 0),
      holesPlayed: summary?.holesPlayed || 0,
      totalHoles: summary?.totalHoles || round.selectedHoleCount || round.holes.length || 18,
      scoreLabel: localEntry?.displayStatus || localEntry?.scoreLabel || "--",
      winnerLabel: summary?.winnerLabel || "Pending",
      totalStrokes: typeof localEntry?.totalStrokes === "number" ? localEntry.totalStrokes : null,
    };
  });
}

export function summarizeCompletedRounds(rounds = [], currentUserId = "") {
  const items = buildCompletedRoundSummaries(rounds, currentUserId);
  const strokeTotals = items
    .map((item) => item.totalStrokes)
    .filter((value) => typeof value === "number" && value > 0);

  const roundsPlayed = items.length;
  const averageScore = strokeTotals.length
    ? Number((strokeTotals.reduce((sum, value) => sum + value, 0) / strokeTotals.length).toFixed(1))
    : null;
  const bestRound = strokeTotals.length ? Math.min(...strokeTotals) : null;

  return {
    roundsPlayed,
    averageScore,
    bestRound,
    recentRounds: items.slice(0, 8),
  };
}
