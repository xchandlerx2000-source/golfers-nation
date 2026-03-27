import {
  COURSE_SERVICE_REQUESTS_TABLE,
  LIVE_ROUND_SESSIONS_TABLE,
  SUPABASE_SESSION_STORAGE_KEY,
  TESTER_FEEDBACK_TABLE,
  TEE_TIME_REQUESTS_TABLE,
} from "@golfers-nation/core";

function getBrowserStorage(storageOverride = null) {
  if (storageOverride) {
    return storageOverride;
  }

  try {
    if (typeof localStorage === "undefined") {
      return null;
    }

    return localStorage;
  } catch (error) {
    console.warn("[Golfers Nation] Supabase session storage is unavailable.", error);
    return null;
  }
}

function normalizeUrl(value = "") {
  return String(value || "").trim().replace(/\/+$/, "");
}

function parseJsonSafely(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function normalizeError(payload, response) {
  return {
    status: response?.status || 0,
    message: payload?.msg || payload?.message || payload?.error_description || payload?.error || "Request failed.",
    code: payload?.code || payload?.error || "",
  };
}

function isMissingRelationError(error) {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();
  return code === "PGRST205"
    || message.includes("could not find the table")
    || message.includes("schema cache");
}

function logMissingRelation(tableName, error) {
  console.warn(`[Golfers Nation] Supabase table ${tableName} is not ready yet. Continuing with local-safe state.`, error);
}

function buildRestQuery(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function sanitizeSearchValue(value = "") {
  return String(value || "")
    .trim()
    .replace(/[(),]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeSessionPayload(payload) {
  const source = payload?.session || payload || null;
  const user = payload?.user || source?.user || null;

  if (!source || (!source.access_token && !source.refresh_token)) {
    return {
      session: null,
      user,
    };
  }

  const expiresAt = source.expires_at
    || (source.expires_in ? Math.floor(Date.now() / 1000) + Number(source.expires_in) : null);

  return {
    session: {
      access_token: source.access_token,
      refresh_token: source.refresh_token,
      expires_in: source.expires_in || null,
      expires_at: expiresAt,
      token_type: source.token_type || "bearer",
      user,
    },
    user,
  };
}

function isSessionExpired(session) {
  if (!session?.expires_at) {
    return false;
  }

  return (Number(session.expires_at) * 1000) <= (Date.now() + 30_000);
}

export function createSupabaseRestBridge({
  config,
  fetchImpl = typeof fetch === "function" ? fetch.bind(globalThis) : null,
  storage = null,
} = {}) {
  const runtimeConfig = {
    supabaseUrl: normalizeUrl(config?.supabaseUrl),
    supabaseAnonKey: String(config?.supabaseAnonKey || "").trim(),
    supabaseResetRedirectUrl: String(config?.supabaseResetRedirectUrl || config?.siteUrl || "").trim(),
    siteUrl: String(config?.siteUrl || "").trim(),
  };
  const storageRef = getBrowserStorage(storage);

  function isConfigured() {
    return Boolean(runtimeConfig.supabaseUrl && runtimeConfig.supabaseAnonKey && typeof fetchImpl === "function");
  }

  function readStoredSession() {
    if (!storageRef) {
      return null;
    }

    try {
      const raw = storageRef.getItem(SUPABASE_SESSION_STORAGE_KEY);
      return raw ? parseJsonSafely(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeStoredSession(session) {
    if (!storageRef) {
      return session;
    }

    try {
      storageRef.setItem(SUPABASE_SESSION_STORAGE_KEY, JSON.stringify(session || null));
    } catch (error) {
      console.warn("[Golfers Nation] Failed to store Supabase session.", error);
    }

    return session;
  }

  function clearStoredSession() {
    if (!storageRef) {
      return;
    }

    try {
      storageRef.removeItem(SUPABASE_SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn("[Golfers Nation] Failed to clear Supabase session.", error);
    }
  }

  async function request(path, {
    method = "GET",
    body = null,
    accessToken = "",
    headers = {},
  } = {}) {
    if (!isConfigured()) {
      return {
        error: {
          status: 0,
          message: "Supabase is not configured. Add the project URL and anon key first.",
          code: "supabase_not_configured",
        },
      };
    }

    const response = await fetchImpl(`${runtimeConfig.supabaseUrl}${path}`, {
      method,
      headers: {
        apikey: runtimeConfig.supabaseAnonKey,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const payloadText = await response.text();
    const payload = parseJsonSafely(payloadText);

    if (!response.ok) {
      return { error: normalizeError(payload, response) };
    }

    return { data: payload };
  }

  async function refreshStoredSession() {
    const current = readStoredSession();

    if (!current?.refresh_token) {
      return { error: { status: 401, message: "No refresh token is available.", code: "missing_refresh_token" } };
    }

    const result = await request("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: {
        refresh_token: current.refresh_token,
      },
    });

    if (result.error) {
      clearStoredSession();
      return result;
    }

    const normalized = normalizeSessionPayload(result.data);
    if (normalized.session) {
      writeStoredSession(normalized.session);
    }

    return normalized;
  }

  async function getActiveSession() {
    const stored = readStoredSession();
    if (!stored) {
      return { session: null };
    }

    if (!isSessionExpired(stored)) {
      return { session: stored };
    }

    const refreshed = await refreshStoredSession();
    if (refreshed.error) {
      return refreshed;
    }

    return { session: refreshed.session || null };
  }

  async function signUpWithEmail({ email, password, displayName }) {
    const result = await request("/auth/v1/signup", {
      method: "POST",
      body: {
        email: String(email || "").trim().toLowerCase(),
        password: String(password || ""),
        data: {
          display_name: String(displayName || "").trim(),
        },
      },
    });

    if (result.error) {
      return result;
    }

    const normalized = normalizeSessionPayload(result.data);
    if (normalized.session) {
      writeStoredSession(normalized.session);
    }

    return normalized;
  }

  async function signInWithEmail({ email, password }) {
    const result = await request("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: {
        email: String(email || "").trim().toLowerCase(),
        password: String(password || ""),
      },
    });

    if (result.error) {
      return result;
    }

    const normalized = normalizeSessionPayload(result.data);
    if (normalized.session) {
      writeStoredSession(normalized.session);
    }

    return normalized;
  }

  async function signOut() {
    const active = await getActiveSession();
    const accessToken = active.session?.access_token || "";

    if (accessToken) {
      await request("/auth/v1/logout", {
        method: "POST",
        accessToken,
      });
    }

    clearStoredSession();
    return { signedOut: true };
  }

  async function requestPasswordReset(email) {
    return request("/auth/v1/recover", {
      method: "POST",
      body: {
        email: String(email || "").trim().toLowerCase(),
        ...(runtimeConfig.supabaseResetRedirectUrl ? { redirect_to: runtimeConfig.supabaseResetRedirectUrl } : {}),
      },
    });
  }

  async function getCurrentUser() {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const result = await request("/auth/v1/user", {
      accessToken: active.session.access_token,
    });

    if (result.error) {
      if (result.error.status === 401) {
        clearStoredSession();
      }
      return result;
    }

    return {
      user: result.data,
      session: active.session,
    };
  }

  async function fetchWorkspace(userId) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const encodedUserId = encodeURIComponent(String(userId || ""));
    const [profileResult, workspaceResult] = await Promise.all([
      request(`/rest/v1/player_profiles?id=eq.${encodedUserId}&select=*`, {
        accessToken: active.session.access_token,
      }),
      request(`/rest/v1/player_workspaces?user_id=eq.${encodedUserId}&select=user_id,workspace,updated_at`, {
        accessToken: active.session.access_token,
      }),
    ]);

    if (profileResult.error && !isMissingRelationError(profileResult.error)) {
      return profileResult;
    }

    if (workspaceResult.error && !isMissingRelationError(workspaceResult.error)) {
      return workspaceResult;
    }

    if (profileResult.error && isMissingRelationError(profileResult.error)) {
      logMissingRelation("public.player_profiles", profileResult.error);
    }

    if (workspaceResult.error && isMissingRelationError(workspaceResult.error)) {
      logMissingRelation("public.player_workspaces", workspaceResult.error);
    }

    return {
      profile: profileResult.error
        ? null
        : Array.isArray(profileResult.data) ? profileResult.data[0] || null : profileResult.data || null,
      workspace: workspaceResult.error
        ? null
        : Array.isArray(workspaceResult.data) ? workspaceResult.data[0]?.workspace || null : workspaceResult.data?.workspace || null,
      session: active.session,
    };
  }

  async function upsertProfile(profileRecord) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const result = await request("/rest/v1/player_profiles?on_conflict=id", {
      method: "POST",
      accessToken: active.session.access_token,
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: profileRecord,
    });

    if (result?.error && isMissingRelationError(result.error)) {
      logMissingRelation("public.player_profiles", result.error);
      return { status: "skipped-missing-table", data: null };
    }

    return result;
  }

  async function upsertWorkspace(userId, workspace) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const result = await request("/rest/v1/player_workspaces?on_conflict=user_id", {
      method: "POST",
      accessToken: active.session.access_token,
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: {
        user_id: userId,
        workspace,
        updated_at: new Date().toISOString(),
      },
    });

    if (result?.error && isMissingRelationError(result.error)) {
      logMissingRelation("public.player_workspaces", result.error);
      return { status: "skipped-missing-table", data: null };
    }

    return result;
  }

  async function submitTesterFeedback(feedbackRecord) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "Sign in before sending tester feedback.", code: "missing_session" } };
    }

    return request(`/rest/v1/${TESTER_FEEDBACK_TABLE}`, {
      method: "POST",
      accessToken: active.session.access_token,
      headers: {
        Prefer: "return=representation",
      },
      body: feedbackRecord,
    });
  }

  async function createTableRecord(tableName, record) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const result = await request(`/rest/v1/${tableName}`, {
      method: "POST",
      accessToken: active.session.access_token,
      headers: {
        Prefer: "return=representation",
      },
      body: record,
    });

    if (result?.error && isMissingRelationError(result.error)) {
      logMissingRelation(`public.${tableName}`, result.error);
      return { status: "skipped-missing-table", data: null };
    }

    return result;
  }

  async function listTableRecords(tableName, {
    requesterUserId = "",
    status = "",
    limit = 25,
    order = "requested_at.desc",
  } = {}) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const query = buildRestQuery({
      select: "*",
      ...(requesterUserId ? { requester_user_id: `eq.${requesterUserId}` } : {}),
      ...(status ? { status: `eq.${status}` } : {}),
      order,
      limit,
    });

    const result = await request(`/rest/v1/${tableName}${query}`, {
      accessToken: active.session.access_token,
    });

    if (result?.error && isMissingRelationError(result.error)) {
      logMissingRelation(`public.${tableName}`, result.error);
      return { status: "skipped-missing-table", data: [] };
    }

    return result;
  }

  async function fetchLiveRoundSessionByInviteCode(inviteCode) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const result = await request(`/rest/v1/${LIVE_ROUND_SESSIONS_TABLE}?invite_code=eq.${encodeURIComponent(String(inviteCode || "").trim().toUpperCase())}&select=*`, {
      accessToken: active.session.access_token,
    });

    if (result?.error && isMissingRelationError(result.error)) {
      logMissingRelation(`public.${LIVE_ROUND_SESSIONS_TABLE}`, result.error);
      return {
        session: null,
        missingTable: true,
      };
    }

    if (result?.error) {
      return result;
    }

    return {
      session: Array.isArray(result.data) ? result.data[0] || null : result.data || null,
      missingTable: false,
    };
  }

  async function searchPlayerProfiles({
    query = "",
    limit = 12,
    excludeProfileId = "",
    excludeUserId = "",
  } = {}) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const safeQuery = sanitizeSearchValue(query);
    const queryParams = {
      select: "id,user_id,display_name,username,avatar_label,home_course,handicap,bio,rounds_played,average_score,best_round,recent_form_summary,updated_at",
      order: "rounds_played.desc.nullslast",
      limit,
      ...(excludeProfileId ? { id: `neq.${excludeProfileId}` } : {}),
      ...(excludeUserId ? { user_id: `neq.${excludeUserId}` } : {}),
      ...(safeQuery
        ? {
            or: `(display_name.ilike.*${safeQuery}*,username.ilike.*${safeQuery}*,home_course.ilike.*${safeQuery}*)`,
          }
        : {}),
    };

    const result = await request(`/rest/v1/player_profiles${buildRestQuery(queryParams)}`, {
      accessToken: active.session.access_token,
    });

    if (result?.error && isMissingRelationError(result.error)) {
      logMissingRelation("public.player_profiles", result.error);
      return { status: "skipped-missing-table", data: [] };
    }

    return result;
  }

  async function upsertLiveRoundSession(sessionRecord) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const result = await request(`/rest/v1/${LIVE_ROUND_SESSIONS_TABLE}?on_conflict=invite_code`, {
      method: "POST",
      accessToken: active.session.access_token,
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: sessionRecord,
    });

    if (result?.error && isMissingRelationError(result.error)) {
      logMissingRelation(`public.${LIVE_ROUND_SESSIONS_TABLE}`, result.error);
      return { status: "skipped-missing-table", data: null };
    }

    return result;
  }

  async function createTeeTimeRequest(requestRecord) {
    return createTableRecord(TEE_TIME_REQUESTS_TABLE, requestRecord);
  }

  async function listTeeTimeRequests(options = {}) {
    return listTableRecords(TEE_TIME_REQUESTS_TABLE, options);
  }

  async function createOnCourseServiceRequest(requestRecord) {
    return createTableRecord(COURSE_SERVICE_REQUESTS_TABLE, requestRecord);
  }

  async function listOnCourseServiceRequests(options = {}) {
    return listTableRecords(COURSE_SERVICE_REQUESTS_TABLE, options);
  }

  async function broadcastRealtimeMessage(topic, event, payload) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    return request("/realtime/v1/api/broadcast", {
      method: "POST",
      accessToken: active.session?.access_token || "",
      body: {
        messages: [
          {
            topic,
            event,
            payload,
            private: false,
          },
        ],
      },
    });
  }

  return {
    mode: "supabase-rest-bridge",
    config: runtimeConfig,
    isConfigured,
    readStoredSession,
    writeStoredSession,
    clearStoredSession,
    getActiveSession,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    requestPasswordReset,
    getCurrentUser,
    fetchWorkspace,
    upsertProfile,
    upsertWorkspace,
    submitTesterFeedback,
    createTeeTimeRequest,
    listTeeTimeRequests,
    createOnCourseServiceRequest,
    listOnCourseServiceRequests,
    searchPlayerProfiles,
    fetchLiveRoundSessionByInviteCode,
    upsertLiveRoundSession,
    broadcastRealtimeMessage,
  };
}
