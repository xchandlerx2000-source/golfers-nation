import { isSideBasedMode } from "../config.js";
import { createPlayerProfile } from "../domain/factories.js";
import {
  buildPerformanceInsights,
  calculateHandicapScaffold,
  getParticipantTotals,
  getRecentTrend,
} from "../domain/scoring.js";
import { average } from "../utils/formatters.js";

function avatarFromName(displayName) {
  return String(displayName || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "GN";
}

function normalizeUsername(displayName) {
  const base = String(displayName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18);
  return base ? `@${base}` : "@golfer";
}

function percentage(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function roundValue(value, digits = 1) {
  return typeof value === "number" && Number.isFinite(value)
    ? Number(value.toFixed(digits))
    : null;
}

function createEmptyParType(par) {
  return {
    par,
    holes: 0,
    totalStrokes: 0,
    totalPar: 0,
    averageScore: null,
    toPar: 0,
  };
}

function mergeParTypeScoring(collection) {
  const merged = {
    3: createEmptyParType(3),
    4: createEmptyParType(4),
    5: createEmptyParType(5),
  };

  collection.forEach((entry) => {
    [3, 4, 5].forEach((par) => {
      const source = entry?.[par];
      if (!source) {
        return;
      }

      merged[par].holes += source.holes || 0;
      merged[par].totalStrokes += source.totalStrokes || 0;
      merged[par].totalPar += source.totalPar || 0;
    });
  });

  [3, 4, 5].forEach((par) => {
    const bucket = merged[par];
    bucket.averageScore = bucket.holes ? roundValue(bucket.totalStrokes / bucket.holes, 2) : null;
    bucket.toPar = bucket.totalStrokes - bucket.totalPar;
  });

  return merged;
}

function buildRecentFormSummary(recentForm) {
  return recentForm.length
    ? `${recentForm[0].courseName} ${recentForm[0].toPar > 0 ? `+${recentForm[0].toPar}` : recentForm[0].toPar}`
    : "First round pending";
}

function getScoringParticipantId(round, profileId) {
  const player = round.players.find((entry) => entry.profileId === profileId);
  if (!player) {
    return null;
  }

  if (!isSideBasedMode(round.mode)) {
    return player.id;
  }

  return round.sides.find((side) => side.playerIds.includes(player.id))?.id || null;
}

function mergeWithStoredProfileStats(profile, derivedStats, currentUserId) {
  const stored = profile?.publicProfile || {};
  const preferStored = Boolean(
    profile
    && profile.userId !== currentUserId
    && (stored.roundsPlayed || 0) > (derivedStats.roundsPlayed || 0)
  );

  if (preferStored) {
    return {
      ...derivedStats,
      roundsPlayed: stored.roundsPlayed ?? derivedStats.roundsPlayed,
      averageScore: stored.averageScore ?? derivedStats.averageScore,
      bestRound: stored.bestRound ?? derivedStats.bestRound,
      recentFormSummary: stored.recentFormSummary || derivedStats.recentFormSummary,
      fairwayPercentage: stored.fairwayPercentage ?? derivedStats.fairwayPercentage,
      girPercentage: stored.girPercentage ?? derivedStats.girPercentage,
      averagePutts: stored.averagePutts ?? derivedStats.averagePutts,
      penaltiesAverage: stored.penaltiesAverage ?? derivedStats.penaltiesAverage,
      upAndDownRate: stored.upAndDownRate ?? derivedStats.upAndDownRate,
      sandSaveCount: stored.sandSaveCount ?? derivedStats.sandSaveCount,
      scoringByParType: stored.scoringByParType || derivedStats.scoringByParType,
      hardestHoles: stored.hardestHoles?.length ? stored.hardestHoles : derivedStats.hardestHoles,
      bestHoles: stored.bestHoles?.length ? stored.bestHoles : derivedStats.bestHoles,
      strokesGained: stored.strokesGained || derivedStats.strokesGained,
      formLabel: stored.formLabel || derivedStats.formLabel,
      trendSummary: stored.trendSummary || derivedStats.trendSummary,
      handicapIndex: stored.handicapIndex ?? derivedStats.handicapIndex,
      smartInsights: stored.smartInsights?.length ? stored.smartInsights : derivedStats.smartInsights,
      recentForm: stored.recentForm?.length ? stored.recentForm : derivedStats.recentForm,
    };
  }

  return {
    ...derivedStats,
    fairwayPercentage: derivedStats.fairwayPercentage ?? stored.fairwayPercentage ?? 0,
    girPercentage: derivedStats.girPercentage ?? stored.girPercentage ?? 0,
    averagePutts: derivedStats.averagePutts ?? stored.averagePutts ?? null,
    penaltiesAverage: derivedStats.penaltiesAverage ?? stored.penaltiesAverage ?? 0,
    upAndDownRate: derivedStats.upAndDownRate ?? stored.upAndDownRate ?? 0,
    sandSaveCount: derivedStats.sandSaveCount ?? stored.sandSaveCount ?? 0,
    scoringByParType: derivedStats.scoringByParType || stored.scoringByParType || {},
    hardestHoles: derivedStats.hardestHoles?.length ? derivedStats.hardestHoles : (stored.hardestHoles || []),
    bestHoles: derivedStats.bestHoles?.length ? derivedStats.bestHoles : (stored.bestHoles || []),
    strokesGained: derivedStats.strokesGained || stored.strokesGained || null,
    formLabel: derivedStats.formLabel || stored.formLabel || "Stable",
    trendSummary: derivedStats.trendSummary || stored.trendSummary || "Building a trend",
    handicapIndex: derivedStats.handicapIndex ?? stored.handicapIndex ?? null,
    smartInsights: derivedStats.smartInsights?.length ? derivedStats.smartInsights : (stored.smartInsights || []),
  };
}

function buildDerivedStatsFromAppearances(appearances) {
  const totalFairwaysHit = appearances.reduce((sum, entry) => sum + entry.fairwaysHit, 0);
  const totalFairwayOpportunities = appearances.reduce((sum, entry) => sum + entry.fairwayOpportunities, 0);
  const totalGreensHit = appearances.reduce((sum, entry) => sum + entry.greensHit, 0);
  const totalGirOpportunities = appearances.reduce((sum, entry) => sum + entry.girOpportunities, 0);
  const totalPutts = appearances.reduce((sum, entry) => sum + entry.totalPutts, 0);
  const totalPlayedHoles = appearances.reduce((sum, entry) => sum + entry.holesPlayed, 0);
  const totalPenalties = appearances.reduce((sum, entry) => sum + entry.totalPenalties, 0);
  const totalUpAndDowns = appearances.reduce((sum, entry) => sum + entry.upAndDownSuccesses, 0);
  const totalUpAndDownOpportunities = appearances.reduce((sum, entry) => sum + entry.upAndDownOpportunities, 0);
  const totalSandSaves = appearances.reduce((sum, entry) => sum + entry.sandSaveCount, 0);
  const scoringByParType = mergeParTypeScoring(appearances.map((entry) => entry.scoringByParType));
  const holeMap = new Map();

  appearances.forEach((entry) => {
    (entry.holeDetails || []).forEach((hole) => {
      const existing = holeMap.get(hole.holeNumber) || {
        holeNumber: hole.holeNumber,
        par: hole.par,
        rounds: 0,
        totalToPar: 0,
        totalStrokes: 0,
      };
      existing.rounds += 1;
      existing.totalToPar += hole.toPar;
      existing.totalStrokes += hole.strokes;
      holeMap.set(hole.holeNumber, existing);
    });
  });
  const recentTrend = getRecentTrend(appearances.map((entry) => ({
    totalStrokes: entry.totalStrokes,
  })));
  const handicapIndex = calculateHandicapScaffold(appearances.map((entry) => ({
    totalStrokes: entry.totalStrokes,
    totalPar: entry.totalPar,
  })));
  const recentForm = appearances.slice(0, 3).map((entry) => ({
    roundId: entry.roundId,
    courseName: entry.courseName,
    totalStrokes: entry.totalStrokes,
    toPar: entry.toPar,
    completedAt: entry.completedAt,
  }));
  const hardestHoles = [...holeMap.values()]
    .map((entry) => ({
      holeNumber: entry.holeNumber,
      par: entry.par,
      averageScore: roundValue(entry.totalStrokes / entry.rounds, 2),
      averageToPar: roundValue(entry.totalToPar / entry.rounds, 2),
      rounds: entry.rounds,
    }))
    .sort((left, right) => (right.averageToPar ?? -999) - (left.averageToPar ?? -999) || left.holeNumber - right.holeNumber)
    .slice(0, 3);
  const bestHoles = [...holeMap.values()]
    .map((entry) => ({
      holeNumber: entry.holeNumber,
      par: entry.par,
      averageScore: roundValue(entry.totalStrokes / entry.rounds, 2),
      averageToPar: roundValue(entry.totalToPar / entry.rounds, 2),
      rounds: entry.rounds,
    }))
    .sort((left, right) => (left.averageToPar ?? 999) - (right.averageToPar ?? 999) || left.holeNumber - right.holeNumber)
    .slice(0, 3);
  const strokesGained = ["driving", "approach", "putting"].reduce((result, key) => {
    const values = appearances
      .map((entry) => entry.strokesGained?.[key]?.value)
      .filter((value) => typeof value === "number");
    const averageValue = values.length ? roundValue(average(values), 1) || 0 : 0;
    result[key] = {
      value: averageValue,
      label: averageValue >= 0.6 ? "Gaining" : averageValue <= -0.6 ? "Losing" : "Neutral",
    };
    return result;
  }, {});
  const rankedGains = Object.entries(strokesGained).sort((left, right) => right[1].value - left[1].value);

  const derived = {
    roundsPlayed: appearances.length,
    averageScore: average(appearances.map((entry) => entry.totalStrokes).filter(Boolean)),
    bestRound: appearances.length ? Math.min(...appearances.map((entry) => entry.totalStrokes).filter(Boolean)) : null,
    recentForm,
    recentFormSummary: buildRecentFormSummary(recentForm),
    fairwayPercentage: percentage(totalFairwaysHit, totalFairwayOpportunities),
    girPercentage: percentage(totalGreensHit, totalGirOpportunities),
    averagePutts: totalPlayedHoles ? roundValue(totalPutts / totalPlayedHoles, 2) : null,
    penaltiesAverage: appearances.length ? roundValue(totalPenalties / appearances.length, 2) : 0,
    upAndDownRate: percentage(totalUpAndDowns, totalUpAndDownOpportunities),
    sandSaveCount: totalSandSaves,
    scoringByParType,
    hardestHoles,
    bestHoles,
    recentTrend,
    formLabel: recentTrend.label,
    trendSummary: recentTrend.summary,
    handicapIndex,
    strokesGained: {
      ...strokesGained,
      total: roundValue(
        (strokesGained.driving?.value || 0)
        + (strokesGained.approach?.value || 0)
        + (strokesGained.putting?.value || 0),
        1
      ) || 0,
      bestCategory: rankedGains[0]?.[0] || "driving",
      weakestCategory: rankedGains[rankedGains.length - 1]?.[0] || "putting",
    },
  };

  return {
    ...derived,
    smartInsights: buildPerformanceInsights({
      fairwayPercentage: derived.fairwayPercentage,
      girPercentage: derived.girPercentage,
      averagePutts: derived.averagePutts,
      penaltiesAverage: derived.penaltiesAverage,
      upAndDownRate: derived.upAndDownRate,
      scoringByParType: derived.scoringByParType,
      hardestHoles: derived.hardestHoles,
      recentTrend: derived.recentTrend,
      formLabel: derived.formLabel,
      strokesGained: derived.strokesGained,
    }),
  };
}

export function getProfileById(state, profileId) {
  return state.profiles?.find((profile) => profile.id === profileId) || null;
}

export function getCurrentProfile(state) {
  return getProfileById(state, state.currentUser.profileId);
}

export function getProfileForPlayer(state, player) {
  return player?.profileId ? getProfileById(state, player.profileId) : null;
}

function getCurrentSocialSettings(state) {
  return state?.currentUser?.social || {};
}

function getUniqueSocialIds(value) {
  return Array.isArray(value)
    ? [...new Set(value.filter(Boolean))]
    : [];
}

export function getFollowedProfileIds(state) {
  return getUniqueSocialIds(getCurrentSocialSettings(state).followedProfileIds);
}

export function getFriendProfileIds(state) {
  return getUniqueSocialIds(getCurrentSocialSettings(state).friendProfileIds);
}

export function getPendingFriendProfileIds(state) {
  return getUniqueSocialIds(getCurrentSocialSettings(state).pendingFriendProfileIds);
}

export function isProfileFollowed(state, profileId) {
  return Boolean(profileId) && getFollowedProfileIds(state).includes(profileId);
}

export function isProfileFriend(state, profileId) {
  return Boolean(profileId) && getFriendProfileIds(state).includes(profileId);
}

export function hasPendingFriendRequest(state, profileId) {
  return Boolean(profileId) && getPendingFriendProfileIds(state).includes(profileId);
}

function buildProfileRelationship(state, profileId) {
  if (!profileId || profileId === state.currentUser?.profileId) {
    return {
      isCurrentUser: true,
      isFollowed: false,
      isFriend: false,
      pendingFriendRequest: false,
      label: "Your golfer profile",
    };
  }

  const isFriend = isProfileFriend(state, profileId);
  const pendingFriendRequest = hasPendingFriendRequest(state, profileId);
  const isFollowed = isFriend || isProfileFollowed(state, profileId);

  return {
    isCurrentUser: false,
    isFollowed,
    isFriend,
    pendingFriendRequest,
    label: isFriend
      ? "Friend"
      : pendingFriendRequest
        ? "Friend request sent"
        : isFollowed
          ? "Following"
          : "Public golfer",
  };
}

export function buildProfileRoundStats(state, profileId) {
  const profile = getProfileById(state, profileId);
  const appearances = state.rounds
    .filter((round) => round.status === "completed")
    .map((round) => {
      const participantId = getScoringParticipantId(round, profileId);
      if (!participantId) {
        return null;
      }

      const totals = getParticipantTotals(round, participantId);
      return {
        roundId: round.id,
        courseName: round.courseName,
        completedAt: round.completedAt || round.updatedAt || round.createdAt,
        totalStrokes: totals.totalStrokes,
        totalPar: totals.totalPar,
        toPar: totals.toPar,
        fairwaysHit: totals.fairwaysHit,
        fairwayOpportunities: totals.fairwayOpportunities,
        greensHit: totals.greensHit,
        girOpportunities: totals.girOpportunities,
        totalPutts: totals.totalPutts,
        holesPlayed: totals.holesPlayed,
        totalPenalties: totals.totalPenalties,
        upAndDownSuccesses: totals.upAndDownSuccesses,
        upAndDownOpportunities: totals.upAndDownOpportunities,
        sandSaveCount: totals.sandSaveCount,
        scoringByParType: totals.scoringByParType,
        holeDetails: totals.holeDetails,
        strokesGained: totals.strokesGained,
      };
    })
    .filter(Boolean)
    .sort((left, right) => (right.completedAt || 0) - (left.completedAt || 0));

  const derived = buildDerivedStatsFromAppearances(appearances);
  return profile ? mergeWithStoredProfileStats(profile, derived, state.currentUser.id) : derived;
}

export function buildCompetitivePreview(state, profileId, opponentProfileId = null) {
  const profile = getProfileById(state, profileId);
  if (!profile) {
    return null;
  }

  const stats = buildProfileRoundStats(state, profileId);
  const relationship = buildProfileRelationship(state, profileId);
  const headToHeadRounds = opponentProfileId
    ? state.rounds.filter((round) => {
        const profileIds = new Set(round.players.map((player) => player.profileId));
        return profileIds.has(profileId) && profileIds.has(opponentProfileId);
      }).length
    : 0;

  return {
    profileId: profile.id,
    displayName: profile.publicProfile.displayName,
    username: profile.publicProfile.username,
    avatarLabel: profile.publicProfile.avatarLabel,
    roundsPlayed: stats.roundsPlayed,
    averageScore: stats.averageScore,
    bestRound: stats.bestRound,
    recentFormSummary: stats.recentFormSummary,
    recentForm: profile.privateProfile.privacy.showRecentForm ? stats.recentForm : [],
    fairwayPercentage: stats.fairwayPercentage,
    girPercentage: stats.girPercentage,
    averagePutts: stats.averagePutts,
    penaltiesAverage: stats.penaltiesAverage,
    upAndDownRate: stats.upAndDownRate,
    sandSaveCount: stats.sandSaveCount,
    scoringByParType: stats.scoringByParType,
    hardestHoles: stats.hardestHoles,
    bestHoles: stats.bestHoles,
    strokesGained: stats.strokesGained,
    formLabel: stats.formLabel,
    trendSummary: stats.trendSummary,
    handicapIndex: profile.privateProfile.privacy.showHandicap ? stats.handicapIndex : null,
    smartInsights: stats.smartInsights,
    headToHeadLabel: opponentProfileId
      ? `${headToHeadRounds} shared rounds tracked`
      : "Head-to-head comparison ready",
    homeCourse: profile.privateProfile.privacy.showHomeCourse ? profile.publicProfile.homeCourse : "",
    handicap: profile.privateProfile.privacy.showHandicap ? profile.publicProfile.handicap : null,
    bio: profile.privateProfile.privacy.showBio ? profile.publicProfile.bio : "",
    relationship,
    isFollowed: relationship.isFollowed,
    isFriend: relationship.isFriend,
    pendingFriendRequest: relationship.pendingFriendRequest,
    relationshipLabel: relationship.label,
  };
}

export function buildFriendLeaderboard(state) {
  const candidateIds = [...new Set([
    ...getFriendProfileIds(state),
    ...getFollowedProfileIds(state),
  ])];

  return candidateIds
    .map((profileId) => buildCompetitivePreview(state, profileId, state.currentUser.profileId))
    .filter(Boolean)
    .sort((left, right) =>
      Number(right.isFriend) - Number(left.isFriend)
      || Number(right.isFollowed) - Number(left.isFollowed)
      || (left.averageScore ?? Number.POSITIVE_INFINITY) - (right.averageScore ?? Number.POSITIVE_INFINITY)
      || right.roundsPlayed - left.roundsPlayed
      || left.displayName.localeCompare(right.displayName)
    );
}

export function toggleFollowProfile(draft, profileId) {
  if (!profileId || profileId === draft.currentUser?.profileId) {
    return { changed: false, isFollowed: false };
  }

  const followed = new Set(getUniqueSocialIds(draft.currentUser?.social?.followedProfileIds));
  const alreadyFollowed = followed.has(profileId);

  if (alreadyFollowed) {
    followed.delete(profileId);
  } else {
    followed.add(profileId);
  }

  draft.currentUser.social = {
    ...(draft.currentUser.social || {}),
    followedProfileIds: [...followed],
  };

  return {
    changed: true,
    isFollowed: !alreadyFollowed,
  };
}

export function requestFriendProfile(draft, profileId) {
  if (!profileId || profileId === draft.currentUser?.profileId) {
    return { changed: false, status: "invalid" };
  }

  const friendIds = new Set(getUniqueSocialIds(draft.currentUser?.social?.friendProfileIds));
  if (friendIds.has(profileId)) {
    return { changed: false, status: "already-friends" };
  }

  const pendingIds = new Set(getUniqueSocialIds(draft.currentUser?.social?.pendingFriendProfileIds));
  if (pendingIds.has(profileId)) {
    return { changed: false, status: "pending" };
  }

  const followedIds = new Set(getUniqueSocialIds(draft.currentUser?.social?.followedProfileIds));
  followedIds.add(profileId);
  pendingIds.add(profileId);

  draft.currentUser.social = {
    ...(draft.currentUser.social || {}),
    followedProfileIds: [...followedIds],
    pendingFriendProfileIds: [...pendingIds],
  };

  return {
    changed: true,
    status: "requested",
  };
}

export function buildPlayerComparison(state, leftProfileId, rightProfileId) {
  const left = buildCompetitivePreview(state, leftProfileId, rightProfileId);
  const right = buildCompetitivePreview(state, rightProfileId, leftProfileId);

  if (!left || !right) {
    return null;
  }

  return {
    left,
    right,
    metricRows: [
      {
        label: "Average score",
        left: left.averageScore,
        right: right.averageScore,
      },
      {
        label: "Fairways",
        left: left.fairwayPercentage,
        right: right.fairwayPercentage,
      },
      {
        label: "GIR",
        left: left.girPercentage,
        right: right.girPercentage,
      },
      {
        label: "Putts",
        left: left.averagePutts,
        right: right.averagePutts,
      },
      {
        label: "Form",
        left: left.formLabel,
        right: right.formLabel,
      },
      {
        label: "Driving",
        left: left.strokesGained?.driving?.value,
        right: right.strokesGained?.driving?.value,
      },
    ],
  };
}

export function syncCurrentUserProfile(draft) {
  const existing = draft.profiles.find((profile) => profile.id === draft.currentUser.profileId);
  const payload = {
    userId: draft.currentUser.id,
    displayName: draft.currentUser.displayName || draft.currentUser.name,
    username: draft.currentUser.username,
    avatarLabel: draft.currentUser.avatarLabel || draft.currentUser.avatar || avatarFromName(draft.currentUser.name),
    email: draft.currentUser.email || "",
    homeCourse: draft.currentUser.homeCourse || "",
    handicap: draft.currentUser.handicap ?? null,
    bio: draft.currentUser.bio || "",
    createdAt: draft.currentUser.createdAt,
    premiumStatus: draft.currentUser.subscription?.tier || draft.currentUser.premiumStatus || "free",
    privacy: draft.currentUser.privacy || {},
  };

  const stats = buildProfileRoundStats(draft, draft.currentUser.profileId);

  if (!existing) {
    const profile = createPlayerProfile({
      ...payload,
      publicStats: stats,
      recentForm: stats.recentForm,
    });
    profile.id = draft.currentUser.profileId;
    profile.account.authProviders = [...(draft.auth?.linkedProviders || [])];
    draft.profiles.unshift(profile);
    return profile;
  }

  existing.userId = draft.currentUser.id;
  existing.displayName = payload.displayName;
  existing.username = payload.username.startsWith("@") ? payload.username : `@${payload.username}`;
  existing.avatarLabel = payload.avatarLabel;
  existing.account = {
    ...existing.account,
    email: payload.email,
    createdAt: payload.createdAt,
    premiumStatus: payload.premiumStatus,
    authProviders: [...(draft.auth?.linkedProviders || [])],
  };
  existing.privateProfile = {
    ...existing.privateProfile,
    homeCourse: payload.homeCourse,
    handicap: payload.handicap,
    bio: payload.bio,
    privacy: {
      ...existing.privateProfile.privacy,
      ...(draft.currentUser.privacy || {}),
    },
  };
  existing.publicProfile = {
    ...existing.publicProfile,
    displayName: payload.displayName,
    username: payload.username.startsWith("@") ? payload.username : `@${payload.username}`,
    avatarLabel: payload.avatarLabel,
    homeCourse: payload.homeCourse,
    handicap: payload.handicap,
    bio: payload.bio,
    roundsPlayed: stats.roundsPlayed,
    averageScore: stats.averageScore,
    bestRound: stats.bestRound,
    recentFormSummary: stats.recentFormSummary,
    fairwayPercentage: stats.fairwayPercentage,
    girPercentage: stats.girPercentage,
    averagePutts: stats.averagePutts,
    penaltiesAverage: stats.penaltiesAverage,
    upAndDownRate: stats.upAndDownRate,
    sandSaveCount: stats.sandSaveCount,
    scoringByParType: stats.scoringByParType,
    hardestHoles: stats.hardestHoles,
    bestHoles: stats.bestHoles,
    strokesGained: stats.strokesGained,
    formLabel: stats.formLabel,
    trendSummary: stats.trendSummary,
    handicapIndex: stats.handicapIndex,
    smartInsights: stats.smartInsights,
    recentForm: stats.recentForm,
  };
  existing.updatedAt = Date.now();
  return existing;
}

export function ensureProfilesForNames(draft, players) {
  return players.map((player) => {
    const displayName = String(player?.displayName || player?.name || player || "").trim();
    const currentDisplayName = draft.currentUser.displayName || draft.currentUser.name;

    if (displayName.toLowerCase() === currentDisplayName.toLowerCase()) {
      return {
        profileId: draft.currentUser.profileId,
        userId: draft.currentUser.id,
        displayName: currentDisplayName,
        username: draft.currentUser.username,
        avatarLabel: draft.currentUser.avatarLabel || draft.currentUser.avatar || avatarFromName(currentDisplayName),
      };
    }

    const existing = draft.profiles.find((profile) =>
      profile.publicProfile.displayName.toLowerCase() === displayName.toLowerCase()
      || profile.publicProfile.username.toLowerCase() === String(player?.username || normalizeUsername(displayName)).toLowerCase()
    );

    if (existing) {
      return {
        profileId: existing.id,
        userId: existing.userId,
        displayName: existing.publicProfile.displayName,
        username: existing.publicProfile.username,
        avatarLabel: existing.publicProfile.avatarLabel,
      };
    }

    const created = createPlayerProfile({
      displayName,
      username: player?.username || normalizeUsername(displayName),
      avatarLabel: player?.avatarLabel || player?.avatar || avatarFromName(displayName),
      bio: "Competitive profile ready for shared rounds and stats.",
      privacy: {
        showHomeCourse: false,
        showHandicap: false,
        showBio: true,
        showRecentForm: true,
      },
    });
    draft.profiles.push(created);

    return {
      profileId: created.id,
      userId: created.userId,
      displayName: created.publicProfile.displayName,
      username: created.publicProfile.username,
      avatarLabel: created.publicProfile.avatarLabel,
    };
  });
}

export function refreshProfileSnapshots(draft) {
  draft.profiles.forEach((profile) => {
    const stats = buildProfileRoundStats(draft, profile.id);
    profile.publicProfile = {
      ...profile.publicProfile,
      roundsPlayed: stats.roundsPlayed,
      averageScore: stats.averageScore,
      bestRound: stats.bestRound,
      recentFormSummary: stats.recentFormSummary,
      fairwayPercentage: stats.fairwayPercentage,
      girPercentage: stats.girPercentage,
      averagePutts: stats.averagePutts,
      penaltiesAverage: stats.penaltiesAverage,
      upAndDownRate: stats.upAndDownRate,
      sandSaveCount: stats.sandSaveCount,
      scoringByParType: stats.scoringByParType,
      hardestHoles: stats.hardestHoles,
      bestHoles: stats.bestHoles,
      strokesGained: stats.strokesGained,
      formLabel: stats.formLabel,
      trendSummary: stats.trendSummary,
      handicapIndex: stats.handicapIndex,
      smartInsights: stats.smartInsights,
      recentForm: profile.privateProfile.privacy.showRecentForm ? stats.recentForm : [],
    };
    profile.account = {
      ...profile.account,
      premiumStatus: profile.userId === draft.currentUser.id
        ? draft.currentUser.subscription?.tier || draft.currentUser.premiumStatus || "free"
        : profile.account.premiumStatus || "free",
    };
    profile.updatedAt = Date.now();
  });
}
