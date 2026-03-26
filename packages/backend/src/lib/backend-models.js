import { cloneData } from "@golfers-nation/core";

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

export function toBackendLiveRoundSessionRecord({
  round,
  group = null,
  userId = null,
  sessionId = null,
} = {}) {
  if (!round?.inviteCode) {
    return null;
  }

  return {
    id: sessionId || group?.id || round.groupId || `live-session-${String(round.inviteCode).toLowerCase()}`,
    invite_code: round.inviteCode,
    round_id: round.id,
    host_user_id: group?.hostUserId || userId || null,
    updated_by_user_id: userId || null,
    course_name: round.courseName,
    mode: round.mode,
    status: group?.status || round.status || "active",
    round_state: cloneData(round),
    group_state: group ? cloneData(group) : null,
    created_at: toIsoTimestamp(group?.createdAt || round.createdAt || Date.now()),
    updated_at: toIsoTimestamp(Date.now()),
  };
}

export function fromBackendLiveRoundSessionRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    inviteCode: record.invite_code,
    roundId: record.round_id,
    hostUserId: record.host_user_id,
    updatedByUserId: record.updated_by_user_id,
    courseName: record.course_name,
    mode: record.mode,
    status: record.status,
    round: cloneData(record.round_state || null),
    group: cloneData(record.group_state || null),
    createdAt: record.created_at ? Date.parse(record.created_at) : Date.now(),
    updatedAt: record.updated_at ? Date.parse(record.updated_at) : Date.now(),
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

export function toBackendCourseOverrideRecord(override = {}, userId = null) {
  if (!override) {
    return null;
  }

  return {
    id: override.id || override.courseId || override.canonicalCourseId || null,
    canonical_course_id: override.courseId || override.canonicalCourseId || override.id || null,
    submitted_by_user_id: userId,
    source: override.source || override.metadata?.source || "admin-course-overrides",
    source_type: override.sourceType || override.metadata?.sourceType || "course-admin-override",
    review_status: override.reviewStatus || override.metadata?.reviewStatus || "approved",
    review_notes: override.reviewNotes || override.metadata?.reviewNotes || "",
    quality_issues: cloneData(override.qualityIssues || override.metadata?.qualityIssues || []),
    override_fields: cloneData(override.metadata?.adminOverrideFields || []),
    override_payload: cloneData(override),
    updated_at: toIsoTimestamp(Date.now()),
  };
}

export function toBackendCourseReconciliationRecord(course = {}) {
  if (!course?.id) {
    return null;
  }

  return {
    id: course.id,
    canonical_course_id: course.id,
    display_name: course.displayName || course.name || "",
    city: course.city || null,
    state: course.state || null,
    provider_id: course.providerId || null,
    readiness_tier: course.metadata?.readinessTier || "incomplete",
    confidence_tier: course.metadata?.confidenceTier || "low",
    match_confidence: typeof course.metadata?.matchConfidence === "number" ? course.metadata.matchConfidence : 0,
    completeness_score: typeof course.metadata?.completenessScore === "number" ? course.metadata.completenessScore : 0,
    has_real_tee_data: Boolean(course.metadata?.qualityFlags?.hasRealTeeData),
    has_real_hole_data: Boolean(course.metadata?.qualityFlags?.hasRealHoleData),
    has_real_rating_slope: Boolean(course.metadata?.qualityFlags?.hasRealRatingSlope),
    uses_fallback_tee_data: Boolean(course.metadata?.qualityFlags?.usesFallbackTeeData),
    uses_fallback_hole_data: Boolean(course.metadata?.qualityFlags?.usesFallbackHoleData),
    admin_override_applied: Boolean(course.metadata?.adminOverrideApplied),
    admin_review_status: course.metadata?.adminReviewStatus || "",
    quality_issues: cloneData(course.metadata?.qualityIssues || []),
    source_history: cloneData(course.metadata?.sourceHistory || []),
    updated_at: toIsoTimestamp(Date.now()),
  };
}

export function toBackendCourseCapabilityRecord(course = {}) {
  if (!course?.id) {
    return null;
  }

  const teeTimes = cloneData(course.metadata?.teeTimes || course.metadata?.booking || {});
  const onCourseServices = cloneData(course.metadata?.onCourseServices || course.metadata?.serviceCapabilities || {});

  return {
    id: course.id,
    canonical_course_id: course.id,
    provider_id: course.providerId || null,
    tee_times_enabled: Boolean(teeTimes.enabled),
    tee_times_mode: teeTimes.mode || "none",
    tee_times_provider: teeTimes.provider || null,
    tee_times_url: teeTimes.url || null,
    on_course_services_enabled: Boolean(onCourseServices.enabled),
    on_course_services_mode: onCourseServices.mode || "none",
    on_course_request_types: cloneData(onCourseServices.requestTypes || []),
    updated_at: toIsoTimestamp(Date.now()),
  };
}

export function toBackendTeeTimeRequestRecord(request = {}, userId = null) {
  if (!request?.courseId) {
    return null;
  }

  return {
    id: request.id || null,
    course_id: request.courseId,
    requester_user_id: userId,
    round_id: request.roundId || null,
    request_mode: request.mode || "external-link",
    requested_at: toIsoTimestamp(request.requestedAt || Date.now()),
    status: request.status || "pending",
    notes: request.notes || "",
    metadata: cloneData(request.metadata || {}),
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
