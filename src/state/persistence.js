import { STORAGE_KEY } from "../config.js";
import { cloneData } from "../utils/formatters.js";

const LIVE_SYNC_RENDER_REASONS = [
  "realtime-member-state",
  "realtime-round-event",
  "realtime-round-snapshot",
];

function getAvailableStorage() {
  try {
    if (typeof localStorage === "undefined") {
      return null;
    }

    return localStorage;
  } catch (error) {
    console.warn("[Golfers Nation] Local storage is unavailable.", error);
    return null;
  }
}

export function loadPersistedState(createDefaultState) {
  const fallback = createDefaultState();
  const storage = getAvailableStorage();
  if (!storage) {
    return fallback;
  }

  try {
    const saved = storage.getItem(STORAGE_KEY);
    if (!saved) {
      return fallback;
    }

    const parsed = JSON.parse(saved);
    return {
      ...cloneData(fallback),
      ...parsed,
      session: {
        ...fallback.session,
        ...parsed.session,
        cloudSync: {
          ...(fallback.session?.cloudSync || {}),
          ...(parsed.session?.cloudSync || {}),
        },
      },
      auth: { ...(fallback.auth || {}), ...(parsed.auth || {}) },
      social: { ...fallback.social, ...parsed.social },
      gear: { ...fallback.gear, ...parsed.gear },
      currentUser: {
        ...fallback.currentUser,
        ...parsed.currentUser,
        privacy: {
          ...(fallback.currentUser?.privacy || {}),
          ...(parsed.currentUser?.privacy || {}),
        },
        appearance: {
          ...(fallback.currentUser?.appearance || {}),
          ...(parsed.currentUser?.appearance || {}),
        },
        social: {
          ...(fallback.currentUser?.social || {}),
          ...(parsed.currentUser?.social || {}),
          handles: {
            ...(fallback.currentUser?.social?.handles || {}),
            ...(parsed.currentUser?.social?.handles || {}),
          },
        },
        subscription: {
          ...(fallback.currentUser?.subscription || {}),
          ...(parsed.currentUser?.subscription || {}),
        },
      },
    };
  } catch (error) {
    return fallback;
  }
}

export function persistAppState(state) {
  const storage = getAvailableStorage();
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn("[Golfers Nation] State persistence failed.", error);
    return false;
  }
}

export function persistPlatformState(platform, state) {
  const prepared = platform.data.prepareForPersistence(state);
  platform.data.persist(prepared);
  return prepared;
}

export function subscribeStorePersistence({
  store,
  platform,
  safeRender,
  applyAppearanceToDocument = () => {},
  applyShellModeToDocument = () => {},
} = {}) {
  return store.subscribe((state, meta = {}) => {
    try {
      persistPlatformState(platform, state);
    } catch (error) {
      console.error("[Golfers Nation] Failed to persist app state.", error);
    }

    if (LIVE_SYNC_RENDER_REASONS.includes(meta.reason)) {
      console.info("[Golfers Nation] Rerender triggered after live sync update.", {
        reason: meta.reason,
        activeRoundId: state.session?.activeRoundId || null,
      });
    }

    safeRender(state, "state-render");
    applyAppearanceToDocument(state);
    applyShellModeToDocument(state);
  });
}

export function renderInitialAppState({
  store,
  safeRender,
  applyAppearanceToDocument = () => {},
  applyShellModeToDocument = () => {},
} = {}) {
  const state = store.getState();
  if (!safeRender(state, "initial-render")) {
    return false;
  }

  applyAppearanceToDocument(state);
  applyShellModeToDocument(state);
  return true;
}
