import { APP_VERSION } from "@golfers-nation/core";
import { getNativeRuntimeConfig } from "../lib/runtime-config";
import { readItem, removeItem, writeItem } from "../lib/native-storage";

export const NATIVE_CRASH_LOG_STORAGE_KEY = "golfers-nation-native-crash-log-v1";
export const NATIVE_CRASH_LOG_LIMIT = 20;

let crashHandlersInstalled = false;

function isReactNativeRuntime() {
  return typeof navigator !== "undefined" && navigator.product === "ReactNative";
}

function normalizeError(error) {
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

function sanitizeContext(context = {}) {
  try {
    return JSON.parse(JSON.stringify(context || {}));
  } catch {
    return {
      note: "Crash context could not be fully serialized.",
    };
  }
}

async function writeCrashEntries(entries) {
  await writeItem(NATIVE_CRASH_LOG_STORAGE_KEY, JSON.stringify(entries));
}

export async function readNativeCrashLogEntries() {
  const raw = await readItem(NATIVE_CRASH_LOG_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function recordNativeCrashLog({
  stage = "runtime",
  source = "native-app",
  error = null,
  context = {},
} = {}) {
  const config = getNativeRuntimeConfig();
  const entry = {
    id: `native-crash-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    appEnv: config.appEnv,
    releaseChannel: config.releaseChannel,
    stage: String(stage || "runtime"),
    source: String(source || "native-app"),
    ...normalizeError(error),
    context: sanitizeContext(context),
  };

  const entries = [entry, ...(await readNativeCrashLogEntries())].slice(0, NATIVE_CRASH_LOG_LIMIT);
  await writeCrashEntries(entries);
  return entry;
}

export async function clearNativeCrashLogEntries() {
  await removeItem(NATIVE_CRASH_LOG_STORAGE_KEY);
}

export async function getNativeCrashLogSummary({ limit = 5 } = {}) {
  const entries = await readNativeCrashLogEntries();
  const latest = entries[0] || null;

  return {
    count: entries.length,
    lastCrashAt: latest?.createdAt || "",
    latestStage: latest?.stage || "",
    latestMessage: latest?.message || "",
    entries: entries.slice(0, Math.max(1, Number(limit || 5))),
  };
}

export function installNativeCrashHandlers(getContext = () => ({})) {
  if (crashHandlersInstalled || !isReactNativeRuntime() || getNativeRuntimeConfig().crashReportingEnabled === false) {
    return;
  }

  crashHandlersInstalled = true;

  const globalErrorUtils = globalThis.ErrorUtils;
  if (globalErrorUtils?.getGlobalHandler && globalErrorUtils?.setGlobalHandler) {
    const previousHandler = globalErrorUtils.getGlobalHandler();
    globalErrorUtils.setGlobalHandler((error, isFatal) => {
      void recordNativeCrashLog({
        stage: isFatal ? "fatal-js" : "global-js",
        source: "global-handler",
        error,
        context: getContext(),
      });

      if (typeof previousHandler === "function") {
        previousHandler(error, isFatal);
      }
    });
  }

  if (typeof globalThis.addEventListener === "function") {
    globalThis.addEventListener("unhandledrejection", (event) => {
      void recordNativeCrashLog({
        stage: "unhandled-rejection",
        source: "promise",
        error: event?.reason || "Unhandled promise rejection",
        context: getContext(),
      });
    });
  }
}
