const packageJson = require("./package.json");

const PROJECT_ID = "288cbd3d-72d1-42e8-81f5-78ca17a67de4";
const OWNER = "xcjx2000s-organization";

function readEnv(name, fallback = "") {
  return String(process.env[name] || fallback).trim();
}

function createAppVariant(appEnv = "development") {
  const normalized = String(appEnv || "development").trim().toLowerCase();

  if (normalized === "production") {
    return {
      appEnv: "production",
      name: "Golfers Nation",
      scheme: "golfersnation",
      bundleIdentifier: "com.golfersnation.app",
      androidPackage: "com.golfersnation.app",
      channel: "production",
    };
  }

  if (normalized === "preview" || normalized === "internal-alpha") {
    return {
      appEnv: "preview",
      name: "Golfers Nation Alpha",
      scheme: "golfersnationalpha",
      bundleIdentifier: "com.golfersnation.app.alpha",
      androidPackage: "com.golfersnation.app.alpha",
      channel: "internal-alpha",
    };
  }

  return {
    appEnv: "development",
    name: "Golfers Nation Dev",
    scheme: "golfersnationdev",
    bundleIdentifier: "com.golfersnation.app.dev",
    androidPackage: "com.golfersnation.app.dev",
    channel: "development",
  };
}

module.exports = () => {
  const requestedEnv = readEnv("APP_ENV", readEnv("EXPO_PUBLIC_APP_ENV", "development"));
  const variant = createAppVariant(requestedEnv);
  const version = String(packageJson.version || "0.1.0");

  return {
    expo: {
      name: variant.name,
      slug: "golf-nation-xrlom7zlneow1muou0wp",
      version,
      owner: OWNER,
      scheme: variant.scheme,
      orientation: "portrait",
      userInterfaceStyle: "dark",
      runtimeVersion: `${variant.appEnv}-${version}`,
      updates: {
        url: `https://u.expo.dev/${PROJECT_ID}`,
      },
      assetBundlePatterns: ["**/*"],
      ios: {
        supportsTablet: false,
        bundleIdentifier: variant.bundleIdentifier,
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false,
        },
      },
      android: {
        package: variant.androidPackage,
      },
      plugins: ["expo-router"],
      experiments: {
        typedRoutes: false,
      },
      extra: {
        eas: {
          projectId: PROJECT_ID,
        },
        appEnv: variant.appEnv,
        releaseChannel: readEnv("EXPO_PUBLIC_RELEASE_CHANNEL", variant.channel),
        siteUrl: readEnv("EXPO_PUBLIC_SITE_URL", "https://golfers-nation.pages.dev"),
        courseAssetBaseUrl: readEnv(
          "EXPO_PUBLIC_COURSE_ASSET_BASE_URL",
          readEnv("EXPO_PUBLIC_SITE_URL", "https://golfers-nation.pages.dev")
        ),
        supportEmail: readEnv("EXPO_PUBLIC_SUPPORT_EMAIL", "support@golfersnation.com"),
        crashReportingEnabled: readEnv("EXPO_PUBLIC_CRASH_REPORTING", "true").toLowerCase() !== "false",
      },
    },
  };
};
