import { APP_VERSION } from "../config.js";

export const CRASH_LOG_STORAGE_KEY = "golfers-nation-crash-log-v1";
export const CRASH_LOG_LIMIT = 20;

function getCrashLogStorage(storage = null) {
  if (storage) {
    return storage;
  }

  try {
    if (typeof localStorage === "undefined") {
      return null;
    }

    return localStorage;
  } catch (error) {
    console.warn("[Golfers Nation] Crash log storage is unavailable.", error);
    return null;
  }
}

function normalizeCrashLogError(error) {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "Unknown error.",
      stack: typeof error.stack === "string" ? error.stack : "",
    };
  }

  if (error && typeof error === "object") {
    return {
      name: String(error.name || "Error"),
      message: String(error.message || "Unknown error."),
      stack: typeof error.stack === "string" ? error.stack : "",
    };
  }

  return {
    name: "Error",
    message: String(error || "Unknown error."),
    stack: "",
  };
}

function sanitizeCrashLogContext(context = {}) {
  try {
    return JSON.parse(JSON.stringify(context || {}));
  } catch (error) {
    return {
      note: "Crash context could not be fully serialized.",
    };
  }
}

function getCrashLogWindowHref() {
  if (typeof window === "undefined" || !window.location) {
    return "";
  }

  return window.location.href || "";
}

function getCrashLogUserAgent() {
  if (typeof navigator === "undefined") {
    return "";
  }

  return navigator.userAgent || "";
}

function writeCrashLogEntries(entries, { storage = null } = {}) {
  const availableStorage = getCrashLogStorage(storage);
  if (!availableStorage || typeof availableStorage.setItem !== "function") {
    return false;
  }

  try {
    availableStorage.setItem(CRASH_LOG_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.warn("[Golfers Nation] Failed to write crash logs.", error);
    return false;
  }
}

export function readCrashLogEntries({ storage = null } = {}) {
  const availableStorage = getCrashLogStorage(storage);
  if (!availableStorage || typeof availableStorage.getItem !== "function") {
    return [];
  }

  try {
    const raw = availableStorage.getItem(CRASH_LOG_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("[Golfers Nation] Failed to read crash logs.", error);
    return [];
  }
}

export function recordCrashLog({
  stage = "runtime",
  source = "app",
  error = null,
  context = {},
  storage = null,
} = {}) {
  const normalizedError = normalizeCrashLogError(error);
  const entry = {
    id: `crash-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    stage: String(stage || "runtime"),
    source: String(source || "app"),
    appVersion: APP_VERSION,
    href: getCrashLogWindowHref(),
    userAgent: getCrashLogUserAgent(),
    ...normalizedError,
    context: sanitizeCrashLogContext(context),
  };

  const entries = [entry, ...readCrashLogEntries({ storage })].slice(0, CRASH_LOG_LIMIT);
  writeCrashLogEntries(entries, { storage });
  return entry;
}

export function clearCrashLogEntries({ storage = null } = {}) {
  const availableStorage = getCrashLogStorage(storage);
  if (!availableStorage || typeof availableStorage.removeItem !== "function") {
    return false;
  }

  try {
    availableStorage.removeItem(CRASH_LOG_STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn("[Golfers Nation] Failed to clear crash logs.", error);
    return false;
  }
}

export function getCrashLogSummary({ storage = null, limit = 5 } = {}) {
  const entries = readCrashLogEntries({ storage });
  const latestEntry = entries[0] || null;

  return {
    count: entries.length,
    lastCrashAt: latestEntry?.createdAt || "",
    latestStage: latestEntry?.stage || "",
    latestMessage: latestEntry?.message || "",
    entries: entries.slice(0, Math.max(1, Number(limit || 5))),
  };
}

export function createCrashLogReport(summary = null, { storage = null } = {}) {
  const crashSummary = summary || getCrashLogSummary({ storage, limit: CRASH_LOG_LIMIT });
  if (!crashSummary.count) {
    return "";
  }

  return [
    "Golfers Nation Crash Report",
    `Generated: ${new Date().toISOString()}`,
    `App version: ${APP_VERSION}`,
    "",
    ...crashSummary.entries.flatMap((entry, index) => ([
      `Crash ${index + 1}`,
      `ID: ${entry.id}`,
      `Time: ${entry.createdAt}`,
      `Stage: ${entry.stage}`,
      `Source: ${entry.source}`,
      `Name: ${entry.name}`,
      `Message: ${entry.message}`,
      `URL: ${entry.href || ""}`,
      `User agent: ${entry.userAgent || ""}`,
      `Context: ${JSON.stringify(entry.context || {}, null, 2)}`,
      entry.stack ? `Stack:\n${entry.stack}` : "Stack:",
      "",
    ])),
  ].join("\n");
}
