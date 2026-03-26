function readEnv(name, fallback = "") {
  return String(process.env[name] || fallback).trim();
}

export function getNativeRuntimeConfig() {
  const siteUrl = readEnv("EXPO_PUBLIC_SITE_URL", "https://golfers-nation.pages.dev");
  const appEnv = readEnv("EXPO_PUBLIC_APP_ENV", readEnv("APP_ENV", "development"));
  const releaseChannel = readEnv("EXPO_PUBLIC_RELEASE_CHANNEL", readEnv("EAS_BUILD_PROFILE", "development"));

  return {
    appEnv,
    releaseChannel,
    supportEmail: readEnv("EXPO_PUBLIC_SUPPORT_EMAIL", "support@golfersnation.com"),
    crashReportingEnabled: readEnv("EXPO_PUBLIC_CRASH_REPORTING", "true").toLowerCase() !== "false",
    supabaseUrl: readEnv("EXPO_PUBLIC_SUPABASE_URL", "https://jsvxckzbymbdilyujjko.supabase.co"),
    supabaseAnonKey: readEnv(
      "EXPO_PUBLIC_SUPABASE_ANON_KEY",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzdnhja3pieW1iZGlseXVqamtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxOTY2MTksImV4cCI6MjA4OTc3MjYxOX0._-lsBDKYQZ3XOD6LQPtvhHLDf7jlKJKOfru-250x8F8"
    ),
    supabaseResetRedirectUrl: readEnv("EXPO_PUBLIC_SUPABASE_RESET_REDIRECT_URL"),
    siteUrl,
    courseAssetBaseUrl: readEnv("EXPO_PUBLIC_COURSE_ASSET_BASE_URL", siteUrl),
  };
}

export function hasNativeSupabaseConfig(config = getNativeRuntimeConfig()) {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}
