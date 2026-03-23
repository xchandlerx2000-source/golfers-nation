import { STORAGE_KEY } from "../config.js";
import { cloneData } from "../utils/formatters.js";

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

export function loadStoredState(createDefaultState) {
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
    // Merge a few nested shells explicitly so future billing/profile fields can be
    // added without breaking older locally stored payloads.
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

export function persistState(state) {
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
