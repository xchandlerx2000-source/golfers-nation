import { GAME_MODES } from "../config.js";
import { average, formatRelationToPar } from "../utils/formatters.js";

const PAR_TYPES = [3, 4, 5];

function getGameModeLabel(modeId = "stroke") {
  return GAME_MODES[modeId]?.label || GAME_MODES.stroke.label;
}

function isPlayedEntry(entry) {
  return Boolean(entry && entry.strokes !== null && entry.strokes > 0);
}

function getRoundHoles(round, holeLimit = null) {
  if (!Number.isFinite(holeLimit)) {
    return round.holes;
  }

  return round.holes.filter((hole) => hole.number <= holeLimit);
}

function roundRatio(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function roundValue(value, digits = 1) {
  return typeof value === "number" && Number.isFinite(value)
    ? Number(value.toFixed(digits))
    : null;
}

function createParTypeBucket(par) {
  return {
    par,
    holes: 0,
    totalStrokes: 0,
    totalPar: 0,
    averageScore: null,
    toPar: 0,
  };
}

function summarizeParTypeScoring(playedHoles) {
  const buckets = {
    3: createParTypeBucket(3),
    4: createParTypeBucket(4),
    5: createParTypeBucket(5),
  };

  playedHoles.forEach(({ hole, entry }) => {
    const bucket = buckets[hole.par];
    if (!bucket) {
      return;
    }

    bucket.holes += 1;
    bucket.totalStrokes += entry.strokes;
    bucket.totalPar += hole.par;
  });

  PAR_TYPES.forEach((par) => {
    const bucket = buckets[par];
    bucket.averageScore = bucket.holes ? roundValue(bucket.totalStrokes / bucket.holes, 2) : null;
    bucket.toPar = bucket.totalStrokes - bucket.totalPar;
  });

  return buckets;
}

function mergeParTypeScoring(collection) {
  const merged = {
    3: createParTypeBucket(3),
    4: createParTypeBucket(4),
    5: createParTypeBucket(5),
  };

  collection.forEach((buckets) => {
    PAR_TYPES.forEach((par) => {
      const source = buckets?.[par];
      if (!source) {
        return;
      }

      merged[par].holes += source.holes || 0;
      merged[par].totalStrokes += source.totalStrokes || 0;
      merged[par].totalPar += source.totalPar || 0;
    });
  });

  PAR_TYPES.forEach((par) => {
    const bucket = merged[par];
    bucket.averageScore = bucket.holes ? roundValue(bucket.totalStrokes / bucket.holes, 2) : null;
    bucket.toPar = bucket.totalStrokes - bucket.totalPar;
  });

  return merged;
}

function createHolePerformanceBucket(holeNumber, par) {
  return {
    holeNumber,
    par,
    rounds: 0,
    totalStrokes: 0,
    totalToPar: 0,
    totalPutts: 0,
    totalPenalties: 0,
    fairwaysHit: 0,
    fairwayOpportunities: 0,
    greensHit: 0,
  };
}

function summarizeHolePerformance(detailCollections) {
  const buckets = new Map();

  detailCollections.forEach((details) => {
    (details || []).forEach((detail) => {
      const existing = buckets.get(detail.holeNumber) || createHolePerformanceBucket(detail.holeNumber, detail.par);
      existing.rounds += 1;
      existing.totalStrokes += detail.strokes;
      existing.totalToPar += detail.toPar;
      existing.totalPutts += detail.putts ?? 0;
      existing.totalPenalties += detail.penalties || 0;
      existing.greensHit += detail.gir ? 1 : 0;

      if (detail.par > 3) {
        existing.fairwayOpportunities += 1;
        existing.fairwaysHit += detail.fairwayHit ? 1 : 0;
      }

      buckets.set(detail.holeNumber, existing);
    });
  });

  const list = [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      averageScore: bucket.rounds ? roundValue(bucket.totalStrokes / bucket.rounds, 2) : null,
      averageToPar: bucket.rounds ? roundValue(bucket.totalToPar / bucket.rounds, 2) : null,
      averagePutts: bucket.rounds ? roundValue(bucket.totalPutts / bucket.rounds, 2) : null,
      penaltiesAverage: bucket.rounds ? roundValue(bucket.totalPenalties / bucket.rounds, 2) : 0,
      fairwayRate: roundRatio(bucket.fairwaysHit, bucket.fairwayOpportunities),
      girRate: roundRatio(bucket.greensHit, bucket.rounds),
    }))
    .sort((left, right) => left.holeNumber - right.holeNumber);

  const byDifficulty = [...list].sort((left, right) =>
    (right.averageToPar ?? -999) - (left.averageToPar ?? -999)
    || (right.averageScore ?? -999) - (left.averageScore ?? -999)
    || left.holeNumber - right.holeNumber
  );
  const byScoring = [...list].sort((left, right) =>
    (left.averageToPar ?? 999) - (right.averageToPar ?? 999)
    || (left.averageScore ?? 999) - (right.averageScore ?? 999)
    || left.holeNumber - right.holeNumber
  );

  return {
    holePerformance: list,
    hardestHoles: byDifficulty.slice(0, 3),
    bestHoles: byScoring.slice(0, 3),
  };
}

function buildStrokesGainedCategory(value) {
  const rounded = roundValue(value, 1) || 0;
  return {
    value: rounded,
    label: rounded >= 0.6 ? "Gaining" : rounded <= -0.6 ? "Losing" : "Neutral",
  };
}

function calculateSimplifiedStrokesGained(playedHoles) {
  let driving = 0;
  let approach = 0;
  let putting = 0;

  playedHoles.forEach(({ hole, entry }) => {
    const penalties = entry.penalties || 0;

    if (hole.par > 3) {
      driving += entry.fairwayHit ? 0.25 : -0.18;
      driving -= penalties * 0.55;
    }

    approach += entry.gir ? 0.32 : -0.2;

    if (hole.par === 3 && !entry.gir) {
      approach -= 0.08;
    }

    if (typeof entry.putts === "number" && Number.isFinite(entry.putts)) {
      putting += (2 - entry.putts) * 0.45;
    }
  });

  const categories = {
    driving: buildStrokesGainedCategory(driving),
    approach: buildStrokesGainedCategory(approach),
    putting: buildStrokesGainedCategory(putting),
  };

  const ranked = Object.entries(categories).sort((left, right) => right[1].value - left[1].value);

  return {
    ...categories,
    total: roundValue(driving + approach + putting, 1) || 0,
    bestCategory: ranked[0]?.[0] || "driving",
    weakestCategory: ranked[ranked.length - 1]?.[0] || "putting",
  };
}

export function getRecentTrend(roundEntries) {
  const values = roundEntries
    .map((entry) => entry?.totalStrokes)
    .filter((value) => typeof value === "number" && value > 0);

  if (values.length < 2) {
    return {
      label: "Stable",
      delta: 0,
      summary: "Need more rounds to establish a trend",
    };
  }

  const recentAverage = average(values.slice(0, 3));
  const priorValues = values.slice(3, 6);

  if (!priorValues.length) {
    return {
      label: "Stable",
      delta: 0,
      summary: "Building a trend from recent rounds",
    };
  }

  const priorAverage = average(priorValues);
  const delta = roundValue(priorAverage - recentAverage, 1) || 0;
  const label = delta >= 1.5
      ? "Improving"
      : delta <= -1.5
        ? "Declining"
        : "Stable";

  return {
    label,
    delta,
    summary: label === "Improving"
      ? `${Math.abs(delta).toFixed(1)} strokes better than the prior stretch`
      : label === "Declining"
        ? `${Math.abs(delta).toFixed(1)} strokes higher than the prior stretch`
        : "Recent scoring is holding steady",
  };
}

export function calculateHandicapScaffold(roundEntries) {
  const differentials = roundEntries
    .map((entry) => {
      if (typeof entry?.totalStrokes !== "number" || typeof entry?.totalPar !== "number") {
        return null;
      }

      return entry.totalStrokes - entry.totalPar;
    })
    .filter((value) => value !== null)
    .sort((left, right) => left - right);

  if (!differentials.length) {
    return null;
  }

  const sampleSize = differentials.length >= 8 ? 3 : differentials.length >= 4 ? 2 : 1;
  return roundValue(average(differentials.slice(0, sampleSize)) * 0.96, 1);
}

export function buildPerformanceInsights(metrics) {
  const insights = [];
  const fairwayRate = metrics.fairwayRate ?? metrics.fairwayPercentage ?? metrics.fairways ?? 0;
  const girRate = metrics.girRate ?? metrics.girPercentage ?? metrics.gir ?? 0;
  const averagePutts = metrics.averagePutts ?? metrics.putts ?? null;
  const penalties = metrics.totalPenalties ?? metrics.penaltiesAverage ?? 0;
  const upAndDownRate = metrics.upAndDownRate ?? 0;
  const trendLabel = metrics.recentTrend?.label || metrics.formLabel || null;
  const parFive = metrics.scoringByParType?.[5];
  const strokesGained = metrics.strokesGained || null;
  const hardestHole = metrics.hardestHoles?.[0] || null;

  if (fairwayRate >= 60) {
    insights.push("Driving looks reliable and is keeping the round in position.");
  } else if (fairwayRate > 0 && fairwayRate <= 45) {
    insights.push("Missed fairways are costing clean approaches. Tighten the tee ball first.");
  }

  if (girRate >= 55) {
    insights.push("Approach play is creating plenty of birdie and par looks.");
  } else if (girRate > 0 && girRate <= 35) {
    insights.push("Greens in regulation are low. More center-green approaches could save shots quickly.");
  }

  if (typeof averagePutts === "number" && averagePutts <= 1.9) {
    insights.push("Putting is a strength right now. Conversion on the green is helping scoring.");
  } else if (typeof averagePutts === "number" && averagePutts >= 2.2) {
    insights.push("Putting is leaving strokes out there. Short-putt cleanup is the fastest gain.");
  }

  if (penalties >= 1.5) {
    insights.push("Penalty strokes are adding up. Smarter misses can lower scores quickly.");
  }

  if (upAndDownRate >= 45) {
    insights.push("Short-game recovery is strong when greens are missed.");
  }

  if (parFive?.holes && parFive.toPar <= 0) {
    insights.push("Par 5 scoring is a clear advantage in the current sample.");
  }

  if (strokesGained?.putting?.label === "Gaining") {
    insights.push("Putting is outperforming your baseline and helping you convert scoring chances.");
  } else if (strokesGained?.approach?.label === "Losing") {
    insights.push("Approach play is trailing the rest of the game. More greens hit would move scoring fast.");
  }

  if (hardestHole && hardestHole.averageToPar >= 0.8) {
    insights.push(`Hole ${hardestHole.holeNumber} has been the toughest scoring spot in your recent sample.`);
  }

  if (trendLabel === "Improving") {
    insights.push("Recent rounds are trending better. The current practice plan is working.");
  } else if (trendLabel === "Declining") {
    insights.push("Recent rounds are slipping. Focus on the weakest category before the next card.");
  }

  if (!insights.length) {
    insights.push("The stat sample is still building. Finish a few more rounds for sharper insights.");
  }

  return insights.slice(0, 3);
}

export function getScoringParticipants(round) {
  return round.mode === "stroke" ? round.players : round.sides;
}

export function getLocalParticipantIds(round, currentUserId) {
  if (round.mode === "stroke") {
    return round.players.filter((player) => player.userId === currentUserId).map((player) => player.id);
  }

  return round.sides
    .filter((side) => side.playerIds.some((playerId) => round.players.find((player) => player.id === playerId)?.userId === currentUserId))
    .map((side) => side.id);
}

export function applyHoleUpdate(round, holeNumber, participantId, patch, options = {}) {
  const hole = round.holes.find((item) => item.number === holeNumber);
  if (!hole) {
    return round;
  }

  const entry = hole.entries.find((item) => item.participantId === participantId);
  if (!entry) {
    return round;
  }

  if (Object.hasOwn(patch, "strokes")) {
    entry.strokes = patch.strokes === null || patch.strokes === "" ? null : Number(patch.strokes);
  }

  if (Object.hasOwn(patch, "putts")) {
    entry.putts = patch.putts === null || patch.putts === "" ? null : Number(patch.putts);
  }

  if (Object.hasOwn(patch, "penalties")) {
    entry.penalties = patch.penalties === null || patch.penalties === ""
      ? 0
      : Math.max(0, Number(patch.penalties));
  }

  if (Object.hasOwn(patch, "fairwayHit")) {
    entry.fairwayHit = Boolean(patch.fairwayHit);
  }

  if (Object.hasOwn(patch, "gir")) {
    entry.gir = Boolean(patch.gir);
  }

  if (Object.hasOwn(patch, "upAndDown")) {
    entry.upAndDown = Boolean(patch.upAndDown);
  }

  if (Object.hasOwn(patch, "sandSave")) {
    entry.sandSave = Boolean(patch.sandSave);
  }

  const appliedAt = Number.isFinite(options.timestamp) ? Number(options.timestamp) : Date.now();
  entry.updatedAt = appliedAt;
  if (options.eventId) {
    entry.lastEventId = options.eventId;
  }
  round.updatedAt = appliedAt;
  round.currentHole = hole.number;
  return round;
}

export function getParticipantTotals(round, participantId, options = {}) {
  const holeLimit = typeof options === "number" ? options : options?.holeLimit ?? null;
  const holes = getRoundHoles(round, holeLimit)
    .map((hole) => ({
      hole,
      entry: hole.entries.find((item) => item.participantId === participantId),
    }))
    .filter(({ entry }) => entry);

  const played = holes.filter(({ entry }) => isPlayedEntry(entry));
  const holeDetails = played.map(({ hole, entry }) => ({
    holeNumber: hole.number,
    par: hole.par,
    strokes: entry.strokes,
    toPar: entry.strokes - hole.par,
    putts: typeof entry.putts === "number" ? entry.putts : null,
    penalties: entry.penalties || 0,
    fairwayHit: entry.fairwayHit,
    gir: entry.gir,
  }));
  const totalStrokes = played.reduce((sum, item) => sum + item.entry.strokes, 0);
  const puttEntries = played.filter(({ entry }) => typeof entry.putts === "number" && Number.isFinite(entry.putts));
  const totalPutts = puttEntries.reduce((sum, item) => sum + item.entry.putts, 0);
  const totalPar = played.reduce((sum, item) => sum + item.hole.par, 0);
  const totalPenalties = played.reduce((sum, item) => sum + (item.entry.penalties || 0), 0);
  const fairwayEligible = played.filter(({ hole }) => hole.par > 3);
  const fairwaysHit = fairwayEligible.filter(({ entry }) => entry.fairwayHit).length;
  const greensHit = played.filter(({ entry }) => entry.gir).length;
  const upAndDownOpportunities = played.filter(({ entry }) => !entry.gir).length;
  const upAndDownSuccesses = played.filter(({ entry }) => entry.upAndDown).length;
  const sandSaveCount = played.filter(({ entry }) => entry.sandSave).length;
  const scoringByParType = summarizeParTypeScoring(played);
  const strokesGained = calculateSimplifiedStrokesGained(played);

  return {
    holesPlayed: played.length,
    holeDetails,
    totalStrokes,
    totalPutts,
    puttHolesRecorded: puttEntries.length,
    totalPar,
    toPar: totalStrokes - totalPar,
    fairwaysHit,
    fairwayOpportunities: fairwayEligible.length,
    fairwayRate: roundRatio(fairwaysHit, fairwayEligible.length),
    greensHit,
    girOpportunities: played.length,
    girRate: roundRatio(greensHit, played.length),
    totalPenalties,
    upAndDownSuccesses,
    upAndDownOpportunities,
    upAndDownRate: roundRatio(upAndDownSuccesses, upAndDownOpportunities),
    sandSaveCount,
    averagePutts: puttEntries.length ? roundValue(totalPutts / puttEntries.length, 2) : null,
    scoringByParType,
    strokesGained,
  };
}

function buildStrokeLeaderboard(round, currentUserId, holeLimit = null) {
  return getScoringParticipants(round)
    .map((participant) => {
      const totals = getParticipantTotals(round, participant.id, { holeLimit });
      const localIds = getLocalParticipantIds(round, currentUserId);
      return {
        id: participant.id,
        name: participant.name,
        subtitle: round.mode === "scramble" ? participant.playerNames.join(", ") : "Player card",
        isLocal: localIds.includes(participant.id),
        thru: totals.holesPlayed,
        total: totals.totalStrokes,
        toPar: totals.toPar,
        fairwayRate: totals.fairwayRate,
        girRate: totals.girRate,
        totalPutts: totals.totalPutts,
        totalPenalties: totals.totalPenalties,
        displayStatus: totals.holesPlayed ? formatRelationToPar(totals.toPar) : "NS",
      };
    })
    .sort((left, right) => {
      if (left.thru === 0 && right.thru > 0) {
        return 1;
      }
      if (right.thru === 0 && left.thru > 0) {
        return -1;
      }
      return left.toPar - right.toPar || left.total - right.total || right.thru - left.thru;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

function buildMatchLeaderboard(round, currentUserId, holeLimit = null) {
  const sides = getScoringParticipants(round);
  const [left, right] = sides;

  if (!left || !right) {
    return buildStrokeLeaderboard(round, currentUserId, holeLimit);
  }

  let leftWins = 0;
  let rightWins = 0;
  let halved = 0;
  let holesPlayed = 0;

  getRoundHoles(round, holeLimit).forEach((hole) => {
    const leftEntry = hole.entries.find((entry) => entry.participantId === left.id);
    const rightEntry = hole.entries.find((entry) => entry.participantId === right.id);
    if (!leftEntry?.strokes || !rightEntry?.strokes) {
      return;
    }

    holesPlayed += 1;
    if (leftEntry.strokes < rightEntry.strokes) {
      leftWins += 1;
      return;
    }

    if (rightEntry.strokes < leftEntry.strokes) {
      rightWins += 1;
      return;
    }

    halved += 1;
  });

  const delta = leftWins - rightWins;
  const leftLocal = getLocalParticipantIds(round, currentUserId).includes(left.id);
  const rightLocal = getLocalParticipantIds(round, currentUserId).includes(right.id);

  const leftStanding = delta > 0 ? `${delta} Up` : delta < 0 ? `${Math.abs(delta)} Down` : "AS";
  const rightStanding = delta < 0 ? `${Math.abs(delta)} Up` : delta > 0 ? `${delta} Down` : "AS";

  return [
    {
      id: left.id,
      rank: delta >= 0 ? 1 : 2,
      name: left.name,
      subtitle: left.playerNames.join(", "),
      isLocal: leftLocal,
      thru: holesPlayed,
      total: leftWins,
      toPar: 0,
      fairwayRate: 0,
      girRate: 0,
      totalPutts: 0,
      totalPenalties: 0,
      displayStatus: leftStanding,
      holesWon: leftWins,
      holesHalved: halved,
    },
    {
      id: right.id,
      rank: delta <= 0 ? 1 : 2,
      name: right.name,
      subtitle: right.playerNames.join(", "),
      isLocal: rightLocal,
      thru: holesPlayed,
      total: rightWins,
      toPar: 0,
      fairwayRate: 0,
      girRate: 0,
      totalPutts: 0,
      totalPenalties: 0,
      displayStatus: rightStanding,
      holesWon: rightWins,
      holesHalved: halved,
    },
  ].sort((leftEntry, rightEntry) => leftEntry.rank - rightEntry.rank);
}

export function buildLeaderboard(round, currentUserId, holeLimit = null) {
  return round.mode === "match"
    ? buildMatchLeaderboard(round, currentUserId, holeLimit)
    : buildStrokeLeaderboard(round, currentUserId, holeLimit);
}

function getLastScoredHoleNumber(round) {
  return round.holes.reduce((highest, hole) => {
    const hasScore = hole.entries.some((entry) => isPlayedEntry(entry));
    return hasScore ? hole.number : highest;
  }, 0);
}

function buildHoleWinnerSummary(round) {
  const participants = getScoringParticipants(round);
  const participantNames = new Map(participants.map((participant) => [participant.id, participant.name]));
  const latestCompetitiveHole = [...round.holes]
    .reverse()
    .find((hole) => hole.entries.filter((entry) => isPlayedEntry(entry)).length >= 2);

  if (!latestCompetitiveHole) {
    return null;
  }

  const playedEntries = latestCompetitiveHole.entries.filter((entry) => isPlayedEntry(entry));
  const winningScore = Math.min(...playedEntries.map((entry) => entry.strokes));
  const winnerNames = playedEntries
    .filter((entry) => entry.strokes === winningScore)
    .map((entry) => participantNames.get(entry.participantId) || "Golfer");

  return {
    holeNumber: latestCompetitiveHole.number,
    winningScore,
    winnerNames,
    tied: winnerNames.length > 1,
    label: winnerNames.length > 1
      ? `Hole ${latestCompetitiveHole.number} halved`
      : `Hole ${latestCompetitiveHole.number} to ${winnerNames[0]}`,
    detail: winnerNames.length > 1
      ? `${winnerNames.join(" and ")} matched ${winningScore}.`
      : `${winnerNames[0]} won the hole with ${winningScore}.`,
  };
}

function buildMomentumSummary(localTotals) {
  const recentHoles = (localTotals?.holeDetails || []).slice(-3);

  if (!recentHoles.length) {
    return {
      label: "Start the card",
      detail: "Momentum shows up after the first few holes.",
      tone: "steady",
    };
  }

  const totalToPar = recentHoles.reduce((sum, hole) => sum + hole.toPar, 0);
  const underParCount = recentHoles.filter((hole) => hole.toPar < 0).length;
  const evenOrBetterCount = recentHoles.filter((hole) => hole.toPar <= 0).length;
  const bogeyOrWorseCount = recentHoles.filter((hole) => hole.toPar > 0).length;

  if (underParCount >= 2 || (recentHoles.length >= 2 && evenOrBetterCount === recentHoles.length)) {
    return {
      label: "Hot streak",
      detail: `${evenOrBetterCount}/${recentHoles.length} recent holes at par or better.`,
      tone: "up",
    };
  }

  if (totalToPar <= -1) {
    return {
      label: "Momentum up",
      detail: `${Math.abs(totalToPar)} under par over the last ${recentHoles.length} holes.`,
      tone: "up",
    };
  }

  if (bogeyOrWorseCount >= 2) {
    return {
      label: "Bounce-back spot",
      detail: `Last ${recentHoles.length} holes have trended ${totalToPar > 0 ? `${totalToPar} over` : "flat"}.`,
      tone: "down",
    };
  }

  return {
    label: "Steady stretch",
    detail: `Last ${recentHoles.length} holes are settling in.`,
    tone: "steady",
  };
}

function buildHeadToHeadSummary(round, leaderboard, localParticipant) {
  if (!localParticipant || leaderboard.length < 2) {
    return null;
  }

  const rival = localParticipant.rank === 1
    ? leaderboard.find((entry) => entry.id !== localParticipant.id)
    : leaderboard[Math.max(0, localParticipant.rank - 2)] || leaderboard[0];

  if (!rival) {
    return null;
  }

  if (round.mode === "match") {
    return {
      rivalName: rival.name,
      label: localParticipant.rank === 1 ? `Ahead of ${rival.name}` : `Chasing ${rival.name}`,
      detail: `${localParticipant.displayStatus} vs ${rival.displayStatus}`,
    };
  }

  const strokeGap = Math.abs((localParticipant.total || 0) - (rival.total || 0));
  return {
    rivalName: rival.name,
    label: localParticipant.rank === 1 ? `Ahead of ${rival.name}` : `Chasing ${rival.name}`,
    detail: `${strokeGap} ${strokeGap === 1 ? "stroke" : "strokes"} ${localParticipant.rank === 1 ? "clear" : "back"}`,
  };
}

function getParticipantProfileIds(round, participantId) {
  if (round.mode === "stroke") {
    const player = round.players.find((entry) => entry.id === participantId);
    return player?.profileId ? [player.profileId] : [];
  }

  const side = (round.sides || []).find((entry) => entry.id === participantId);
  if (!side) {
    return [];
  }

  return side.playerIds
    .map((playerId) => round.players.find((player) => player.id === playerId)?.profileId || null)
    .filter(Boolean);
}

function buildFriendLeaderboard(round, leaderboard, {
  friendProfileIds = [],
  followedProfileIds = [],
} = {}) {
  const friendSet = new Set(friendProfileIds.filter(Boolean));
  const followedSet = new Set(followedProfileIds.filter(Boolean));

  const entries = leaderboard
    .map((entry) => {
      const profileIds = getParticipantProfileIds(round, entry.id);
      const isFriend = profileIds.some((profileId) => friendSet.has(profileId));
      const isFollowed = isFriend || profileIds.some((profileId) => followedSet.has(profileId));

      if (!isFriend && !isFollowed) {
        return null;
      }

      return {
        ...entry,
        isFriend,
        isFollowed,
        relationshipLabel: isFriend ? "Friend" : "Following",
      };
    })
    .filter(Boolean)
    .sort((left, right) =>
      Number(right.isFriend) - Number(left.isFriend)
      || left.rank - right.rank
      || left.name.localeCompare(right.name)
    )
    .slice(0, 3);

  if (!entries.length) {
    return null;
  }

  return {
    title: entries.some((entry) => entry.isFriend) ? "Friends in this round" : "Followed golfers in this round",
    entries,
    leaderLabel: `${entries[0].name} leads your social view`,
  };
}

function buildSideGameSummary(round, leaderboard, localParticipant, holeWinner) {
  if (!localParticipant || leaderboard.length < 2) {
    return null;
  }

  const leader = leaderboard[0];
  const strokesBack = leader?.id === localParticipant.id
    ? 0
    : Math.max(0, (localParticipant.toPar || 0) - (leader?.toPar || 0));
  const swingLabel = holeWinner?.tied
    ? "Halved the latest hole"
    : holeWinner?.winnerIds?.includes(localParticipant.id)
      ? "Won the latest hole"
      : "Lost the latest hole";

  return {
    title: round.mode === "match" ? "Side game pulse" : "Skins-style pulse",
    swingLabel,
    detail: leader?.id === localParticipant.id
      ? "You control the side-game pace right now."
      : `${strokesBack} ${strokesBack === 1 ? "stroke" : "strokes"} back from the side-game lead.`,
    leaderName: leader?.name || "Waiting on scores",
  };
}

function buildTournamentScaffold(round, leaderboard) {
  if (!leaderboard.length) {
    return null;
  }

  return {
    title: "Tournament-ready scaffold",
    detail: `${leaderboard[0].name} is leading the current card. This round summary is ready to feed a future event board.`,
  };
}

function addRankMovement(round, currentUserId, leaderboard) {
  const lastScoredHole = getLastScoredHoleNumber(round);
  if (lastScoredHole <= 1) {
    return leaderboard.map((entry) => ({
      ...entry,
      previousRank: entry.rank,
      rankDelta: 0,
      rankTrend: "steady",
      rankTrendLabel: "Opening stretch",
    }));
  }

  const previousLeaderboard = buildLeaderboard(round, currentUserId, lastScoredHole - 1);
  const previousRanks = new Map(previousLeaderboard.map((entry) => [entry.id, entry.rank]));

  return leaderboard.map((entry) => {
    const previousRank = previousRanks.get(entry.id) ?? entry.rank;
    const rankDelta = previousRank - entry.rank;

    return {
      ...entry,
      previousRank,
      rankDelta,
      rankTrend: rankDelta > 0 ? "up" : rankDelta < 0 ? "down" : "steady",
      rankTrendLabel: rankDelta > 0
        ? `Up ${rankDelta}`
        : rankDelta < 0
          ? `Down ${Math.abs(rankDelta)}`
          : "Steady",
    };
  });
}

export function getRoundSummary(round, currentUserId, options = {}) {
  const friendProfileIds = Array.isArray(options.friendProfileIds) ? options.friendProfileIds : [];
  const followedProfileIds = Array.isArray(options.followedProfileIds) ? options.followedProfileIds : [];
  const leaderboard = addRankMovement(round, currentUserId, buildLeaderboard(round, currentUserId));
  const localParticipant = leaderboard.find((entry) => entry.isLocal) || leaderboard[0];
  const localTotals = localParticipant ? getParticipantTotals(round, localParticipant.id) : null;
  const holesPlayed = Math.max(...leaderboard.map((entry) => entry.thru), 0);
  const holeWinner = buildHoleWinnerSummary(round);
  const momentum = buildMomentumSummary(localTotals);
  const headToHead = buildHeadToHeadSummary(round, leaderboard, localParticipant);
  const friendLeaderboard = buildFriendLeaderboard(round, leaderboard, {
    friendProfileIds,
    followedProfileIds,
  });
  const sideGame = buildSideGameSummary(round, leaderboard, localParticipant, holeWinner);
  const tournamentScaffold = buildTournamentScaffold(round, leaderboard);

  return {
    leaderboard,
    holesPlayed,
    totalHoles: Array.isArray(round?.holes) ? round.holes.length : 0,
    localParticipant,
    localTotals,
    roundInsights: localTotals ? buildPerformanceInsights({
      ...localTotals,
      ...summarizeHolePerformance([localTotals.holeDetails]),
    }) : [],
    holeWinner,
    momentum,
    headToHead,
    friendLeaderboard,
    sideGame,
    tournamentScaffold,
    roundLabel: getGameModeLabel(round?.mode),
    averagePutts: localTotals?.averagePutts ?? null,
    completed: round.status === "completed",
    winnerLabel: leaderboard.length ? leaderboard[0].name : "No leader yet",
  };
}

export function getHistoryMetrics(rounds, currentUserId) {
  const localRounds = rounds
    .filter((round) => round.status === "completed")
    .map((round) => {
      const participantId = getLocalParticipantIds(round, currentUserId)[0];
      if (!participantId) {
        return null;
      }

      return {
        roundId: round.id,
        completedAt: round.completedAt || round.updatedAt || round.createdAt,
        totals: getParticipantTotals(round, participantId),
      };
    })
    .filter(Boolean)
    .sort((left, right) => (right.completedAt || 0) - (left.completedAt || 0));

  const totalFairwaysHit = localRounds.reduce((sum, round) => sum + round.totals.fairwaysHit, 0);
  const totalFairwayOpportunities = localRounds.reduce((sum, round) => sum + round.totals.fairwayOpportunities, 0);
  const totalGreensHit = localRounds.reduce((sum, round) => sum + round.totals.greensHit, 0);
  const totalGirOpportunities = localRounds.reduce((sum, round) => sum + round.totals.girOpportunities, 0);
  const totalPutts = localRounds.reduce((sum, round) => sum + round.totals.totalPutts, 0);
  const totalPlayedHoles = localRounds.reduce((sum, round) => sum + round.totals.holesPlayed, 0);
  const totalPuttHoles = localRounds.reduce((sum, round) => sum + (round.totals.puttHolesRecorded || 0), 0);
  const totalPenalties = localRounds.reduce((sum, round) => sum + round.totals.totalPenalties, 0);
  const totalUpAndDowns = localRounds.reduce((sum, round) => sum + round.totals.upAndDownSuccesses, 0);
  const totalUpAndDownOpportunities = localRounds.reduce((sum, round) => sum + round.totals.upAndDownOpportunities, 0);
  const totalSandSaves = localRounds.reduce((sum, round) => sum + round.totals.sandSaveCount, 0);
  const recentTrend = getRecentTrend(localRounds.map((round) => ({
    totalStrokes: round.totals.totalStrokes,
  })));
  const scoringByParType = mergeParTypeScoring(localRounds.map((round) => round.totals.scoringByParType));
  const holeSummary = summarizeHolePerformance(localRounds.map((round) => round.totals.holeDetails));
  const strokesGained = ["driving", "approach", "putting"].reduce((result, key) => {
    const values = localRounds
      .map((round) => round.totals.strokesGained?.[key]?.value)
      .filter((value) => typeof value === "number");
    const averageValue = values.length ? roundValue(average(values), 1) || 0 : 0;
    result[key] = buildStrokesGainedCategory(averageValue);
    return result;
  }, {});
  const rankedStrokesGained = Object.entries(strokesGained).sort((left, right) => right[1].value - left[1].value);
  const handicapIndex = calculateHandicapScaffold(localRounds.map((round) => ({
    totalStrokes: round.totals.totalStrokes,
    totalPar: round.totals.totalPar,
  })));

  return {
    roundsPlayed: localRounds.length,
    scoringAverage: average(localRounds.map((round) => round.totals.totalStrokes || 0)),
    fairways: roundRatio(totalFairwaysHit, totalFairwayOpportunities),
    gir: roundRatio(totalGreensHit, totalGirOpportunities),
    putts: totalPuttHoles ? roundValue(totalPutts / totalPuttHoles, 2) : null,
    penaltiesAverage: localRounds.length ? roundValue(totalPenalties / localRounds.length, 2) : 0,
    upAndDownRate: roundRatio(totalUpAndDowns, totalUpAndDownOpportunities),
    sandSaveCount: totalSandSaves,
    scoringByParType,
    hardestHoles: holeSummary.hardestHoles,
    bestHoles: holeSummary.bestHoles,
    holePerformance: holeSummary.holePerformance,
    recentTrend,
    formLabel: recentTrend.label,
    trendDirection: recentTrend.delta > 0 ? "up" : recentTrend.delta < 0 ? "down" : "flat",
    handicapIndex,
    strokesGained: {
      ...strokesGained,
      total: roundValue(
        (strokesGained.driving?.value || 0)
        + (strokesGained.approach?.value || 0)
        + (strokesGained.putting?.value || 0),
        1
      ) || 0,
      bestCategory: rankedStrokesGained[0]?.[0] || "driving",
      weakestCategory: rankedStrokesGained[rankedStrokesGained.length - 1]?.[0] || "putting",
    },
    smartInsights: buildPerformanceInsights({
      fairways: roundRatio(totalFairwaysHit, totalFairwayOpportunities),
      gir: roundRatio(totalGreensHit, totalGirOpportunities),
      putts: totalPuttHoles ? roundValue(totalPutts / totalPuttHoles, 2) : null,
      penaltiesAverage: localRounds.length ? roundValue(totalPenalties / localRounds.length, 2) : 0,
      upAndDownRate: roundRatio(totalUpAndDowns, totalUpAndDownOpportunities),
      scoringByParType,
      hardestHoles: holeSummary.hardestHoles,
      recentTrend,
      formLabel: recentTrend.label,
      strokesGained: {
        ...strokesGained,
        total: roundValue(
          (strokesGained.driving?.value || 0)
          + (strokesGained.approach?.value || 0)
          + (strokesGained.putting?.value || 0),
          1
        ) || 0,
      },
    }),
  };
}

export function getFrequentPartners(rounds, currentUserId) {
  const partnerMap = new Map();

  rounds.forEach((round) => {
    const localPlayers = round.players.filter((player) => player.userId === currentUserId);
    if (!localPlayers.length) {
      return;
    }

    round.players
      .filter((player) => player.userId !== currentUserId)
      .forEach((player) => {
        const previous = partnerMap.get(player.name) || { name: player.name, rounds: 0, latest: 0 };
        previous.rounds += 1;
        previous.latest = Math.max(previous.latest, round.updatedAt || round.completedAt || round.createdAt);
        partnerMap.set(player.name, previous);
      });
  });

  return [...partnerMap.values()]
    .sort((left, right) => right.rounds - left.rounds || right.latest - left.latest)
    .slice(0, 6);
}
