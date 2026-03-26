export const APPEARANCE_MODE_OPTIONS = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export const TEXT_SCALE_OPTIONS = [
  { id: "standard", label: "Standard" },
  { id: "large", label: "Large" },
];

export const THEME_PRESET_OPTIONS = [
  { id: "forest", label: "Forest" },
  { id: "sand", label: "Sand" },
  { id: "ocean", label: "Ocean" },
  { id: "slate", label: "Slate" },
  { id: "midnight", label: "Midnight" },
];

export const PROFILE_VISIBILITY_OPTIONS = [
  { id: "public", label: "Public" },
  { id: "friends", label: "Friends" },
  { id: "private", label: "Private" },
];

export const DEFAULT_APPEARANCE = {
  colorMode: "system",
  themeId: "forest",
  textScale: "standard",
  compactMode: false,
  contrastMode: "standard",
};

export const DEFAULT_PRIVACY = {
  showHomeCourse: true,
  showHandicap: true,
  showBio: true,
  showRecentForm: true,
  showHeadToHead: false,
  showEmail: false,
  profileVisibility: "friends",
};

export const DEFAULT_SUBSCRIPTION = {
  tier: "free",
  planName: "Free",
  status: "active",
};

function coerceHandicap(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function normalizeCurrentUser(user = {}) {
  const displayName = String(user.displayName || user.name || "Golfer").trim() || "Golfer";
  const username = String(user.username || displayName.toLowerCase().replace(/[^a-z0-9]+/g, "") || "golfer").trim();

  return {
    ...user,
    name: displayName,
    displayName,
    username,
    email: String(user.email || "").trim(),
    city: String(user.city || "").trim(),
    homeCourse: String(user.homeCourse || "").trim(),
    bio: String(user.bio || "").trim(),
    seasonGoal: String(user.seasonGoal || "Finish a cleaner round").trim(),
    handicap: coerceHandicap(user.handicap),
    provider: String(user.provider || "email"),
    appearance: {
      ...DEFAULT_APPEARANCE,
      ...(user.appearance || {}),
    },
    privacy: {
      ...DEFAULT_PRIVACY,
      ...(user.privacy || {}),
    },
    subscription: {
      ...DEFAULT_SUBSCRIPTION,
      ...(user.subscription || {}),
    },
  };
}

export function formatSubscriptionLabel(subscription = {}) {
  const normalized = {
    ...DEFAULT_SUBSCRIPTION,
    ...(subscription || {}),
  };
  return normalized.tier === "premium" ? "Premium" : "Free";
}

export function formatProfileVisibilityLabel(value = "") {
  return PROFILE_VISIBILITY_OPTIONS.find((option) => option.id === value)?.label || "Friends";
}
