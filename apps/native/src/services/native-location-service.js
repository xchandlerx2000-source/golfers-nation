import { readItem, removeItem, writeItem } from "../lib/native-storage";

const LOCATION_CACHE_KEY = "golfers-nation-native-location-v1";

let expoLocationModulePromise = null;

function isReactNativeRuntime() {
  return typeof navigator !== "undefined" && navigator.product === "ReactNative";
}

function normalizeCoordinates(value = null) {
  if (!value) {
    return null;
  }

  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    accuracy: Number.isFinite(Number(value.accuracy)) ? Number(value.accuracy) : null,
    timestamp: Number.isFinite(Number(value.timestamp)) ? Number(value.timestamp) : Date.now(),
  };
}

async function getExpoLocationModule() {
  if (!isReactNativeRuntime()) {
    return null;
  }

  if (!expoLocationModulePromise) {
    expoLocationModulePromise = import("expo-location")
      .then((module) => module.default || module)
      .catch(() => null);
  }

  return expoLocationModulePromise;
}

export async function writeCachedNativeLocation(coords = null) {
  const normalized = normalizeCoordinates(coords);
  if (!normalized) {
    return null;
  }

  await writeItem(LOCATION_CACHE_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function readCachedNativeLocation() {
  const raw = await readItem(LOCATION_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeCoordinates(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function clearCachedNativeLocation() {
  await removeItem(LOCATION_CACHE_KEY);
}

export async function refreshNativeLocation({ requestPermission = false } = {}) {
  const cachedLocation = await readCachedNativeLocation();
  if (!isReactNativeRuntime()) {
    return {
      status: cachedLocation ? "cached" : "unsupported",
      source: cachedLocation ? "cache" : "unsupported",
      coords: cachedLocation,
      notice: cachedLocation
        ? "Using the last nearby match saved on this device."
        : "Device location needs a native phone build.",
    };
  }

  const locationModule = await getExpoLocationModule();
  if (!locationModule) {
    return {
      status: cachedLocation ? "cached" : "unavailable",
      source: cachedLocation ? "cache" : "unavailable",
      coords: cachedLocation,
      notice: cachedLocation
        ? "Using the last nearby match saved on this device."
        : "Location services are not available in this build.",
    };
  }

  let permission = null;
  try {
    permission = await locationModule.getForegroundPermissionsAsync();
  } catch {
    permission = null;
  }

  if (!permission?.granted && requestPermission) {
    try {
      permission = await locationModule.requestForegroundPermissionsAsync();
    } catch {
      permission = null;
    }
  }

  if (!permission?.granted) {
    const blocked = permission?.canAskAgain === false;
    return {
      status: cachedLocation ? "cached" : blocked ? "blocked" : "permission-needed",
      source: cachedLocation ? "cache" : "permission",
      coords: cachedLocation,
      notice: cachedLocation
        ? "Using the last nearby match saved on this device."
        : blocked
          ? "Location permission is blocked in device settings."
          : "Use My Location to load real nearby courses.",
    };
  }

  try {
    const lastKnown = await locationModule.getLastKnownPositionAsync();
    const lastKnownCoords = normalizeCoordinates(lastKnown?.coords
      ? {
          ...lastKnown.coords,
          timestamp: lastKnown.timestamp,
        }
      : null);

    if (lastKnownCoords) {
      const cached = await writeCachedNativeLocation(lastKnownCoords);
      return {
        status: "ready",
        source: "device",
        coords: cached,
        notice: "Nearby courses matched to your phone location.",
      };
    }

    const current = await locationModule.getCurrentPositionAsync({
      accuracy: locationModule.Accuracy?.Balanced,
    });
    const currentCoords = normalizeCoordinates(current?.coords
      ? {
          ...current.coords,
          timestamp: current.timestamp,
        }
      : null);

    if (currentCoords) {
      const cached = await writeCachedNativeLocation(currentCoords);
      return {
        status: "ready",
        source: "device",
        coords: cached,
        notice: "Nearby courses matched to your phone location.",
      };
    }
  } catch {
    // Fall through to cached fallback.
  }

  return {
    status: cachedLocation ? "cached" : "error",
    source: cachedLocation ? "cache" : "error",
    coords: cachedLocation,
    notice: cachedLocation
      ? "Using the last nearby match saved on this device."
      : "Could not read your location on this device.",
  };
}
