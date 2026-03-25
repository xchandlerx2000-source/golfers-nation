import { createDefaultState } from "../state/default-state.js";
import { renderAppTemplate } from "./templates.js";

function getActiveRound(state) {
  return (state?.rounds || []).find((round) => round.id === state?.session?.activeRoundId) || null;
}

function getActiveGroup(state, round) {
  if (!round) {
    return null;
  }

  return (state?.groups || []).find((group) =>
    group.roundId === round.id
    || group.id === round.groupId
    || (round.inviteCode && group.inviteCode === round.inviteCode)
  ) || null;
}

const RENDER_FALLBACK_STATE = createDefaultState();

function createRenderableHole(number) {
  return {
    id: `render-hole-${number}`,
    number,
    par: 4,
    yards: "--",
    handicapIndex: null,
    notes: "",
    entries: [],
  };
}

function getRenderableHoles(round = {}) {
  if (Array.isArray(round?.holes) && round.holes.length) {
    return round.holes.map((hole, index) => ({
      id: hole?.id || `render-hole-${hole?.number || index + 1}`,
      number: Number.isFinite(Number(hole?.number)) ? Number(hole.number) : index + 1,
      par: Number.isFinite(Number(hole?.par)) ? Number(hole.par) : 4,
      yards: hole?.yards ?? "--",
      handicapIndex: hole?.handicapIndex ?? null,
      notes: hole?.notes || "",
      entries: Array.isArray(hole?.entries) ? hole.entries : [],
      ...hole,
      entries: Array.isArray(hole?.entries) ? hole.entries : [],
    }));
  }

  const holeCount = Number(round?.selectedHoleCount || round?.courseHoleCount || 18);
  return Array.from({ length: holeCount > 0 ? holeCount : 18 }, (_, index) => createRenderableHole(index + 1));
}

function normalizeRenderableRound(round = {}) {
  return {
    ...round,
    players: Array.isArray(round?.players) ? round.players : [],
    holes: getRenderableHoles(round),
    sides: Array.isArray(round?.sides) ? round.sides : [],
    sync: {
      label: "Local only",
      note: "Offline-first local data foundation.",
      transport: "local",
      state: "idle",
      ...(round?.sync || {}),
    },
  };
}

function normalizeRenderableGroup(group = {}) {
  return {
    ...group,
    members: Array.isArray(group?.members) ? group.members : [],
    feed: Array.isArray(group?.feed) ? group.feed : [],
  };
}

function getRenderableState(state = {}) {
  return {
    ...RENDER_FALLBACK_STATE,
    ...(state || {}),
    auth: {
      ...(RENDER_FALLBACK_STATE.auth || {}),
      ...(state?.auth || {}),
    },
    currentUser: {
      ...(RENDER_FALLBACK_STATE.currentUser || {}),
      ...(state?.currentUser || {}),
      privacy: {
        ...(RENDER_FALLBACK_STATE.currentUser?.privacy || {}),
        ...(state?.currentUser?.privacy || {}),
      },
      appearance: {
        ...(RENDER_FALLBACK_STATE.currentUser?.appearance || {}),
        ...(state?.currentUser?.appearance || {}),
      },
      social: {
        ...(RENDER_FALLBACK_STATE.currentUser?.social || {}),
        ...(state?.currentUser?.social || {}),
        handles: {
          ...(RENDER_FALLBACK_STATE.currentUser?.social?.handles || {}),
          ...(state?.currentUser?.social?.handles || {}),
        },
      },
      integrations: {
        ...(RENDER_FALLBACK_STATE.currentUser?.integrations || {}),
        ...(state?.currentUser?.integrations || {}),
        spotify: {
          ...(RENDER_FALLBACK_STATE.currentUser?.integrations?.spotify || {}),
          ...(state?.currentUser?.integrations?.spotify || {}),
        },
      },
      subscription: {
        ...(RENDER_FALLBACK_STATE.currentUser?.subscription || {}),
        ...(state?.currentUser?.subscription || {}),
      },
    },
    social: {
      ...(RENDER_FALLBACK_STATE.social || {}),
      ...(state?.social || {}),
      activity: Array.isArray(state?.social?.activity)
        ? state.social.activity
        : (RENDER_FALLBACK_STATE.social?.activity || []),
    },
    session: {
      ...(RENDER_FALLBACK_STATE.session || {}),
      ...(state?.session || {}),
      cloudSync: {
        ...(RENDER_FALLBACK_STATE.session?.cloudSync || {}),
        ...(state?.session?.cloudSync || {}),
      },
      nearby: {
        ...(RENDER_FALLBACK_STATE.session?.nearby || {}),
        ...(state?.session?.nearby || {}),
      },
      spotify: {
        ...(RENDER_FALLBACK_STATE.session?.spotify || {}),
        ...(state?.session?.spotify || {}),
      },
      crashLog: {
        ...(RENDER_FALLBACK_STATE.session?.crashLog || {}),
        ...(state?.session?.crashLog || {}),
      },
    },
    gear: {
      ...(RENDER_FALLBACK_STATE.gear || {}),
      ...(state?.gear || {}),
    },
    profiles: Array.isArray(state?.profiles) ? state.profiles : [],
    rounds: Array.isArray(state?.rounds) ? state.rounds.map((round) => normalizeRenderableRound(round)) : [],
    groups: Array.isArray(state?.groups) ? state.groups.map((group) => normalizeRenderableGroup(group)) : [],
    tournaments: Array.isArray(state?.tournaments) ? state.tournaments : [],
    accounts: Array.isArray(state?.accounts) ? state.accounts : (RENDER_FALLBACK_STATE.accounts || []),
    accountVault: state?.accountVault || RENDER_FALLBACK_STATE.accountVault || {},
  };
}

function getLiveSessionFromState(state) {
  const activeRound = getActiveRound(state);
  if (!activeRound) {
    return null;
  }

  const activeGroup = getActiveGroup(state, activeRound);
  const players = activeGroup?.members?.length
    ? activeGroup.members.map((member) => member.displayName).filter(Boolean)
    : activeRound.players.map((player) => player.name).filter(Boolean);
  const code = activeGroup?.inviteCode || activeRound.inviteCode || "---";

  return {
    code,
    players,
  };
}

function updateLiveSession(root, session) {
  const strip = root.querySelector("#liveStrip");
  if (!strip) {
    return;
  }

  if (!session) {
    strip.classList.add("hidden");
    return;
  }

  strip.classList.remove("hidden");

  const codeElement = root.querySelector("#liveCode");
  const playersElement = root.querySelector("#livePlayers");

  if (codeElement) {
    codeElement.textContent = session.code;
  }

  if (playersElement) {
    const playerCount = session.players.length || 1;
    playersElement.textContent = `${playerCount} ${playerCount === 1 ? "golfer" : "golfers"}`;
  }
}

export function createRenderer(root) {
  return function render(state) {
    const renderableState = getRenderableState(state);
    root.innerHTML = renderAppTemplate(renderableState);
    updateLiveSession(root, getLiveSessionFromState(renderableState));
  };
}
