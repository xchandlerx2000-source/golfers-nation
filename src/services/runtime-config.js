import { RUNTIME_CONFIG_GLOBAL } from "../config.js";

function getGlobalRuntimeConfig() {
  if (typeof window !== "undefined" && window[RUNTIME_CONFIG_GLOBAL]) {
    return window[RUNTIME_CONFIG_GLOBAL];
  }

  if (typeof globalThis !== "undefined" && globalThis[RUNTIME_CONFIG_GLOBAL]) {
    return globalThis[RUNTIME_CONFIG_GLOBAL];
  }

  return {};
}

export function getRuntimeConfig() {
  const runtime = getGlobalRuntimeConfig();

  return {
    supabaseUrl: String(runtime.supabaseUrl || runtime.SUPABASE_URL || "").trim(),
    supabaseAnonKey: String(runtime.supabaseAnonKey || runtime.SUPABASE_ANON_KEY || "").trim(),
    supabaseResetRedirectUrl: String(runtime.supabaseResetRedirectUrl || runtime.SUPABASE_RESET_REDIRECT_URL || "").trim(),
    siteUrl: String(runtime.siteUrl || runtime.SITE_URL || "").trim(),
  };
}

export function hasSupabaseRuntimeConfig(config = getRuntimeConfig()) {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}
