import {
  SUPABASE_SESSION_STORAGE_KEY,
  isSideBasedMode,
  uid,
} from "@golfers-nation/core";
import {
  createSupabaseRestBridge,
  fromBackendLiveRoundSessionRecord,
  toBackendLiveRoundSessionRecord,
} from "@golfers-nation/backend";
import {
  readItem,
  readMemoryItem,
  removeItem,
  removeMemoryItem,
  writeItem,
  writeMemoryItem,
} from "../lib/native-storage";
import { getNativeRuntimeConfig, hasNativeSupabaseConfig } from "../lib/runtime-config";

const APP_SESSION_KEY = "golfers-nation-native-app-session-v1";

function createSessionHealthResult({
  status = "signed-out",
  notice = "",
  session = null,
  currentUser = null,
  authMode = "local-demo",
  restoredFrom = "",
  expired = false,
} = {}) {
  return {
    status,
    notice,
    sessionExpiresAt: session?.expires_at || null,
    signedIn: Boolean(currentUser),
    currentUser,
    authMode,
    restoredFrom,
    expired,
  };
}

function mapSupabaseUserToAccount(user = {}) {
  const metadata = user?.user_metadata || {};
  const displayName = metadata.display_name || metadata.full_name || String(user.email || "").split("@")[0] || "Golfer";
  return {
    id: user.id,
    profileId: metadata.profile_id || user.id,
    name: displayName,
    displayName,
    username: metadata.username || String(user.email || "").split("@")[0] || "golfer",
    avatarLabel: displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "GN",
    email: user.email || "",
    provider: user?.app_metadata?.provider || "email",
  };
}

function normalizeComparable(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9]+/g, "");
}

function createRoundParticipant(currentUser, role = "guest") {
  const displayName = currentUser.displayName || currentUser.name || "Golfer";
  return {
    id: uid("player"),
    profileId: currentUser.profileId || currentUser.id || null,
    userId: currentUser.id || null,
    name: displayName,
    displayName,
    username: currentUser.username || normalizeComparable(displayName) || "golfer",
    avatarLabel: currentUser.avatarLabel || "GN",
    role,
  };
}

function createStrokeEntry(participantId) {
  return {
    participantId,
    strokes: null,
    putts: null,
    penalties: 0,
    fairwayHit: false,
    gir: false,
    upAndDown: false,
    sandSave: false,
    updatedAt: null,
    lastEventId: null,
  };
}

function ensureCurrentUserOnLiveRound(round, group, currentUser) {
  if (!round || !currentUser?.id) {
    return {
      round,
      group,
      added: false,
    };
  }

  round.players = Array.isArray(round.players) ? round.players : [];
  const displayName = currentUser.displayName || currentUser.name || "Golfer";
  const normalizedName = normalizeComparable(displayName);
  const normalizedUsername = normalizeComparable(currentUser.username);

  let participant = round.players.find((player) =>
    player.userId === currentUser.id || player.profileId === currentUser.profileId
  ) || null;

  if (!participant) {
    participant = round.players.find((player) => {
      const playerName = normalizeComparable(player.displayName || player.name);
      const playerUsername = normalizeComparable(player.username);
      return playerName === normalizedName || (normalizedUsername && playerUsername === normalizedUsername);
    }) || null;
  }

  let added = false;
  if (!participant) {
    participant = createRoundParticipant(currentUser, round.players.length ? "guest" : "owner");
    round.players.push(participant);
    added = true;

    if (!isSideBasedMode(round.mode)) {
      (round.holes || []).forEach((hole) => {
        hole.entries = Array.isArray(hole.entries) ? hole.entries : [];
        hole.entries.push(createStrokeEntry(participant.id));
      });
    } else if (Array.isArray(round.sides) && round.sides.length) {
      const targetSide = [...round.sides].sort((left, right) => left.playerIds.length - right.playerIds.length)[0];
      if (targetSide) {
        targetSide.playerIds = Array.isArray(targetSide.playerIds) ? targetSide.playerIds : [];
        targetSide.playerIds.push(participant.id);
      }
    }
  }

  participant.userId = currentUser.id;
  participant.profileId = currentUser.profileId || participant.profileId || null;
  participant.name = displayName;
  participant.displayName = displayName;
  participant.username = currentUser.username || participant.username;
  participant.avatarLabel = currentUser.avatarLabel || participant.avatarLabel || "GN";

  if (Array.isArray(round.sides)) {
    round.sides.forEach((side) => {
      side.playerNames = (side.playerIds || [])
        .map((playerId) => round.players.find((player) => player.id === playerId)?.name || "")
        .filter(Boolean);
    });
  }

  if (group) {
    group.members = Array.isArray(group.members) ? group.members : [];
    let member = group.members.find((item) =>
      item.userId === currentUser.id || item.profileId === currentUser.profileId || item.playerId === participant.id
    ) || null;

    if (!member) {
      member = {
        id: uid("member"),
        playerId: participant.id,
        profileId: participant.profileId,
        userId: currentUser.id,
        displayName: participant.name,
        username: participant.username,
        avatarLabel: participant.avatarLabel,
        role: group.members.length ? "player" : "host",
        connectionState: "connected",
      };
      group.members.push(member);
    }

    member.playerId = participant.id;
    member.profileId = participant.profileId;
    member.userId = currentUser.id;
    member.displayName = participant.name;
    member.username = participant.username;
    member.avatarLabel = participant.avatarLabel;
    member.connectionState = "connected";
    group.updatedAt = Date.now();
  }

  round.updatedAt = Date.now();
  if (round.sync) {
    round.sync.state = "connected";
    round.sync.transport = "cloud";
    round.sync.label = "Live cloud sync";
    round.sync.note = "Live round changes are syncing through the shared backend session.";
    round.sync.lastEventAt = Date.now();
  }

  return {
    round,
    group,
    added,
  };
}

async function hydrateBridgeCache() {
  const stored = await readItem(SUPABASE_SESSION_STORAGE_KEY);
  if (stored) {
    writeMemoryItem(SUPABASE_SESSION_STORAGE_KEY, stored);
  }
}

function createBridgeStorage() {
  return {
    getItem(key) {
      return readMemoryItem(key);
    },
    setItem(key, value) {
      writeMemoryItem(key, value);
      void writeItem(key, value);
    },
    removeItem(key) {
      removeMemoryItem(key);
      void removeItem(key);
    },
  };
}

let bridgeInstance = null;

function getBridge() {
  if (!bridgeInstance) {
    bridgeInstance = createSupabaseRestBridge({
      config: getNativeRuntimeConfig(),
      storage: createBridgeStorage(),
    });
  }

  return bridgeInstance;
}

async function getActiveCloudSession() {
  await hydrateBridgeCache();
  const bridge = getBridge();
  return bridge.getActiveSession();
}

export async function getNativeRealtimeAccessToken() {
  if (!hasNativeSupabaseConfig()) {
    return "";
  }

  await hydrateBridgeCache();
  const bridge = getBridge();
  const active = await bridge.getActiveSession();
  return active?.session?.access_token || "";
}

export async function readNativeAppSession() {
  const raw = await readItem(APP_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeNativeAppSession(session) {
  await writeItem(APP_SESSION_KEY, JSON.stringify(session || null));
}

export async function clearNativeAppSession() {
  await removeItem(APP_SESSION_KEY);
}

export async function restoreNativeAuthSession() {
  const persisted = await readNativeAppSession();

  if (!hasNativeSupabaseConfig()) {
    return persisted ? { ...persisted, restoredFrom: "native-storage" } : null;
  }

  const health = await revalidateNativeAuthSession({
    signedIn: persisted?.signedIn,
    authMode: persisted?.authMode,
  });
  if (health.signedIn && health.currentUser) {
    return {
      signedIn: true,
      currentUser: health.currentUser,
      authMode: health.authMode || "supabase",
      restoredFrom: health.restoredFrom || "supabase",
      sessionExpiresAt: health.sessionExpiresAt || null,
    };
  }

  return persisted && persisted.authMode !== "supabase"
    ? { ...persisted, restoredFrom: "native-storage" }
    : null;
}

export async function revalidateNativeAuthSession({
  signedIn = false,
  authMode = "local-demo",
} = {}) {
  if (authMode !== "supabase") {
    return createSessionHealthResult({
      status: signedIn ? "local" : "signed-out",
      notice: signedIn ? "Local tester session active." : "",
      currentUser: signedIn ? (await readNativeAppSession())?.currentUser || null : null,
      authMode: "local-demo",
      restoredFrom: signedIn ? "native-storage" : "",
      expired: false,
    });
  }

  if (!hasNativeSupabaseConfig()) {
    return createSessionHealthResult({
      status: "config-missing",
      notice: "Cloud auth is unavailable in this build.",
      authMode: "supabase",
      expired: false,
    });
  }

  const active = await getActiveCloudSession();
  if (active?.error || !active?.session?.access_token) {
    await clearNativeAppSession();
    return createSessionHealthResult({
      status: "expired",
      notice: "Cloud session expired. Sign in again.",
      authMode: "supabase",
      expired: true,
    });
  }

  const bridge = getBridge();
  const current = await bridge.getCurrentUser();
  if (current?.error || !current?.user?.id) {
    await clearNativeAppSession();
    return createSessionHealthResult({
      status: "expired",
      notice: "Cloud session expired. Sign in again.",
      authMode: "supabase",
      expired: true,
    });
  }

  const session = {
    signedIn: true,
    currentUser: mapSupabaseUserToAccount(current.user),
    authMode: "supabase",
    restoredFrom: "supabase",
    sessionExpiresAt: active.session.expires_at || null,
  };
  await writeNativeAppSession(session);

  return createSessionHealthResult({
    status: "active",
    notice: "Cloud session active.",
    session: active.session,
    currentUser: session.currentUser,
    authMode: "supabase",
    restoredFrom: "supabase",
    expired: false,
  });
}

export async function signInWithEmailNative({ email, password }) {
  await hydrateBridgeCache();
  const bridge = getBridge();
  const result = await bridge.signInWithEmail({ email, password });
  if (result?.error) {
    return result;
  }

  const current = await bridge.getCurrentUser();
  if (current?.error || !current?.user?.id) {
    return current?.error ? current : { error: { message: "Session created but user profile was unavailable." } };
  }

  const session = {
    signedIn: true,
    currentUser: mapSupabaseUserToAccount(current.user),
    authMode: "supabase",
    restoredFrom: "supabase",
    sessionExpiresAt: result.session?.expires_at || current.session?.expires_at || null,
  };
  await writeNativeAppSession(session);
  return { session };
}

export async function signUpWithEmailNative({ email, password, displayName }) {
  await hydrateBridgeCache();
  const bridge = getBridge();
  const result = await bridge.signUpWithEmail({ email, password, displayName });
  if (result?.error) {
    return result;
  }

  const current = await bridge.getCurrentUser();
  if (!current?.user?.id) {
    return {
      session: null,
      notice: "Account created. Confirm email if required, then sign in on this device.",
    };
  }

  const session = {
    signedIn: true,
    currentUser: mapSupabaseUserToAccount(current.user),
    authMode: "supabase",
    restoredFrom: "supabase",
    sessionExpiresAt: result.session?.expires_at || current.session?.expires_at || null,
  };
  await writeNativeAppSession(session);
  return { session };
}

export async function signOutNative() {
  if (hasNativeSupabaseConfig()) {
    await hydrateBridgeCache();
    const bridge = getBridge();
    await bridge.signOut();
  }

  await clearNativeAppSession();
}

export async function requestPasswordResetNative(email) {
  if (!hasNativeSupabaseConfig()) {
    return {
      error: {
        message: "Password reset is unavailable in local tester mode.",
      },
    };
  }

  await hydrateBridgeCache();
  const bridge = getBridge();
  return bridge.requestPasswordReset(email);
}

export async function syncHostedRoundNative(round, currentUser, group = null) {
  if (!hasNativeSupabaseConfig()) {
    return { status: "local-only" };
  }

  await hydrateBridgeCache();
  const bridge = getBridge();
  const record = toBackendLiveRoundSessionRecord({
    round,
    group,
    userId: currentUser?.id || null,
    sessionId: round.groupId || group?.id || null,
  });

  if (!record) {
    return { status: "skipped" };
  }

  const result = await bridge.upsertLiveRoundSession(record);
  if (result?.error) {
    return result;
  }

  const sourceRecord = Array.isArray(result?.data) ? result.data[0] || record : result?.data || record;
  return {
    status: result?.status || "synced",
    session: fromBackendLiveRoundSessionRecord(sourceRecord),
  };
}

export async function broadcastLiveRoundSnapshotNative(round, currentUser, group = null, deviceId = "") {
  const synced = await syncHostedRoundNative(round, currentUser, group);
  if (!hasNativeSupabaseConfig()) {
    return synced;
  }

  if (synced?.error || !synced?.session?.inviteCode) {
    return synced;
  }

  await hydrateBridgeCache();
  const bridge = getBridge();
  const topic = `gn-live-round:${String(synced.session.inviteCode || "").trim().toUpperCase()}`;
  const broadcastResult = await bridge.broadcastRealtimeMessage(topic, "round-snapshot", {
    session: synced.session,
    deviceId,
  });

  if (broadcastResult?.error) {
    return broadcastResult;
  }

  return synced;
}

export async function broadcastLiveMemberStateNative({
  round,
  group = null,
  currentUser,
  deviceId = "",
} = {}) {
  if (!hasNativeSupabaseConfig() || !round?.inviteCode || !currentUser?.id) {
    return { status: "skipped" };
  }

  await hydrateBridgeCache();
  const bridge = getBridge();
  const topic = `gn-live-round:${String(round.inviteCode || "").trim().toUpperCase()}`;
  const member = {
    id: uid("member"),
    playerId: currentUser.profileId || currentUser.id,
    profileId: currentUser.profileId || currentUser.id,
    userId: currentUser.id,
    displayName: currentUser.displayName || currentUser.name || "Golfer",
    username: currentUser.username || normalizeComparable(currentUser.displayName || currentUser.name || "golfer"),
    avatarLabel: currentUser.avatarLabel || "GN",
    role: group?.members?.length ? "player" : "host",
    connectionState: "connected",
  };

  return bridge.broadcastRealtimeMessage(topic, "member-state", {
    inviteCode: String(round.inviteCode || "").trim().toUpperCase(),
    roundId: round.id,
    sessionId: round.groupId || group?.id || null,
    member,
    deviceId,
  });
}

export async function fetchLiveRoundByCodeNative(inviteCode) {
  if (!hasNativeSupabaseConfig()) {
    return { status: "local-only", session: null };
  }

  await hydrateBridgeCache();
  const bridge = getBridge();
  const result = await bridge.fetchLiveRoundSessionByInviteCode(inviteCode);
  if (result?.error) {
    return result;
  }

  if (!result?.session) {
    return { status: "missing", session: null };
  }

  return {
    status: "joined",
    session: fromBackendLiveRoundSessionRecord(result.session),
  };
}

export async function joinRoundByCodeNative(inviteCode, currentUser = null) {
  const remote = await fetchLiveRoundByCodeNative(inviteCode);
  if (!remote?.session?.round) {
    return remote;
  }

  const round = typeof structuredClone === "function"
    ? structuredClone(remote.session.round)
    : JSON.parse(JSON.stringify(remote.session.round));
  const group = remote.session.group
    ? (typeof structuredClone === "function"
      ? structuredClone(remote.session.group)
      : JSON.parse(JSON.stringify(remote.session.group)))
    : null;

  const ensured = ensureCurrentUserOnLiveRound(round, group, currentUser);
  if (ensured.added && currentUser) {
    await syncHostedRoundNative(ensured.round, currentUser, ensured.group);
  }

  return {
    status: remote.status,
    session: {
      ...remote.session,
      round: ensured.round,
      group: ensured.group,
      updatedAt: ensured.round?.updatedAt || remote.session.updatedAt,
    },
  };
}

export async function publishLiveRoundUpdateNative(round, currentUser, group = null) {
  return syncHostedRoundNative(round, currentUser, group);
}
