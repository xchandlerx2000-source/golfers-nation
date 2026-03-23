import { cloneData } from "../utils/formatters.js";

function toIsoTimestamp(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

function normalizePrivacy(privacy = {}) {
  return {
    show_home_course: Boolean(privacy.showHomeCourse),
    show_handicap: Boolean(privacy.showHandicap),
    show_bio: Boolean(privacy.showBio),
    show_recent_form: Boolean(privacy.showRecentForm),
    show_head_to_head: Boolean(privacy.showHeadToHead),
    show_email: Boolean(privacy.showEmail),
  };
}

export function toBackendAccountRecord(account) {
  if (!account) {
    return null;
  }

  return {
    id: account.id,
    profile_id: account.profileId,
    display_name: account.displayName || account.name,
    username: account.username,
    email: account.email,
    provider: account.provider || account.providerType || "email",
    avatar_label: account.avatarLabel || "GN",
    avatar_url: account.avatarUrl || null,
    city: account.city || null,
    home_course: account.homeCourse || null,
    handicap: typeof account.handicap === "number" ? account.handicap : null,
    bio: account.bio || "",
    season_goal: account.seasonGoal || "",
    subscription_tier: account.subscription?.tier || account.premiumStatus || "free",
    subscription_status: account.subscription?.status || "active",
    billing_ready: Boolean(account.subscription?.billingReady),
    rounds_played: account.roundsPlayed || 0,
    average_score: typeof account.averageScore === "number" ? account.averageScore : null,
    best_round: typeof account.bestRound === "number" ? account.bestRound : null,
    recent_form_summary: account.recentFormSummary || "First round pending",
    privacy: normalizePrivacy(account.privacy),
    appearance: cloneData(account.appearance || {}),
    social_settings: cloneData(account.social || {}),
    seeded_demo: Boolean(account.seededDemo),
    created_at: toIsoTimestamp(account.createdAt),
    updated_at: toIsoTimestamp(Date.now()),
  };
}

export function toBackendProfileRecord(profile) {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    user_id: profile.userId || null,
    display_name: profile.publicProfile?.displayName || "",
    username: profile.publicProfile?.username || "",
    avatar_label: profile.publicProfile?.avatarLabel || "GN",
    home_course: profile.publicProfile?.homeCourse || null,
    handicap: typeof profile.publicProfile?.handicap === "number" ? profile.publicProfile.handicap : null,
    bio: profile.publicProfile?.bio || "",
    rounds_played: profile.publicStats?.roundsPlayed || 0,
    average_score: typeof profile.publicStats?.averageScore === "number" ? profile.publicStats.averageScore : null,
    best_round: typeof profile.publicStats?.bestRound === "number" ? profile.publicStats.bestRound : null,
    recent_form_summary: profile.publicStats?.recentFormSummary || "First round pending",
    premium_status: profile.account?.premiumStatus || "free",
    privacy: normalizePrivacy(profile.privacy),
    created_at: toIsoTimestamp(profile.account?.createdAt || profile.createdAt),
    updated_at: toIsoTimestamp(Date.now()),
  };
}

export function toBackendRoundRecord(round, userId = null) {
  if (!round) {
    return null;
  }

  return {
    id: round.id,
    owner_user_id: userId,
    group_id: round.groupId || null,
    tournament_id: round.tournamentId || null,
    invite_code: round.inviteCode || null,
    course_id: round.courseId || null,
    course_name: round.courseName,
    course_city: round.courseCity || null,
    course_state: round.courseState || null,
    course_region: round.courseRegion || null,
    course_latitude: typeof round.courseLatitude === "number" ? round.courseLatitude : null,
    course_longitude: typeof round.courseLongitude === "number" ? round.courseLongitude : null,
    course_source: round.courseSource || null,
    course_seeded: Boolean(round.courseSeeded),
    tee_box: round.teeBox,
    tee_box_id: round.teeBoxId || null,
    course_rating: typeof round.courseRating === "number" ? round.courseRating : null,
    course_slope: typeof round.courseSlope === "number" ? round.courseSlope : null,
    weather: round.weather,
    mode: round.mode,
    status: round.status,
    current_hole: round.currentHole || 1,
    sync: cloneData(round.sync || {}),
    event_log: cloneData(round.eventLog || []),
    conflict_strategy: round.sync?.conflictStrategy || "latest-write-wins",
    players: cloneData(round.players || []),
    sides: cloneData(round.sides || []),
    holes: cloneData(round.holes || []),
    created_at: toIsoTimestamp(round.createdAt),
    updated_at: toIsoTimestamp(round.updatedAt),
    completed_at: toIsoTimestamp(round.completedAt),
  };
}

export function toBackendGroupRecord(group, userId = null) {
  if (!group) {
    return null;
  }

  return {
    id: group.id,
    owner_user_id: userId,
    round_id: group.roundId,
    invite_code: group.inviteCode,
    transport: group.transport,
    status: group.status,
    members: cloneData(group.members || []),
    feed: cloneData(group.feed || []),
    created_at: toIsoTimestamp(group.createdAt),
    updated_at: toIsoTimestamp(group.updatedAt),
  };
}

export function toBackendTournamentRecord(tournament, userId = null) {
  if (!tournament) {
    return null;
  }

  return {
    id: tournament.id,
    owner_user_id: userId,
    linked_round_id: tournament.linkedRoundId || null,
    name: tournament.name,
    course_name: tournament.courseName,
    mode: tournament.mode,
    field_size: tournament.fieldSize,
    status: tournament.status,
    start_date: tournament.date,
    created_at: toIsoTimestamp(tournament.createdAt),
    updated_at: toIsoTimestamp(tournament.updatedAt),
  };
}

export function toBackendGearRecord(item, userId = null) {
  if (!item) {
    return null;
  }

  return {
    id: item.id,
    owner_user_id: userId,
    category: item.category,
    name: item.name,
    notes: item.notes || "",
    weather_use: item.weatherUse || "",
    packed: Boolean(item.packed),
    created_at: toIsoTimestamp(item.createdAt),
    updated_at: toIsoTimestamp(item.updatedAt),
  };
}

export function toBackendWorkspaceSnapshot(state, userId = state.auth?.activeUserId || state.currentUser?.id || null) {
  const account = (state.accounts || []).find((entry) => entry.id === userId) || state.currentUser || null;

  return {
    auth_user: toBackendAccountRecord(account),
    profiles: (state.profiles || []).map((profile) => toBackendProfileRecord(profile)).filter(Boolean),
    rounds: (state.rounds || []).map((round) => toBackendRoundRecord(round, userId)).filter(Boolean),
    groups: (state.groups || []).map((group) => toBackendGroupRecord(group, userId)).filter(Boolean),
    tournaments: (state.tournaments || []).map((tournament) => toBackendTournamentRecord(tournament, userId)).filter(Boolean),
    gear_items: (state.gear?.items || []).map((item) => toBackendGearRecord(item, userId)).filter(Boolean),
    social_activity: cloneData(state.social?.activity || []),
    session: {
      active_round_id: state.session?.activeRoundId || null,
      selected_hole: state.session?.selectedHole || 1,
      summary_round_id: state.session?.summaryRoundId || null,
      selected_profile_id: state.session?.selectedProfileId || null,
      updated_at: toIsoTimestamp(Date.now()),
    },
  };
}
