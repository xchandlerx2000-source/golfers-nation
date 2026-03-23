export const STORAGE_KEY = "golfers-nation-platform-v2";
export const APP_VERSION = "0.1.0";
export const SUPABASE_SESSION_STORAGE_KEY = "golfers-nation-supabase-session-v1";
export const RUNTIME_CONFIG_GLOBAL = "__GN_RUNTIME_CONFIG__";
export const FEATURED_COURSE_ID = "golden-nugget-lake-charles";
export const TESTER_DEFAULT_SUBSCRIPTION_TIER = "premium";
export const LIVE_ROUND_SESSIONS_TABLE = "live_round_sessions";

export const AUTH_PROVIDER_OPTIONS = [
  {
    id: "google",
    label: "Continue with Google",
    shortLabel: "Google",
    description: "Fast sign-in for existing golfers and future cloud sync.",
  },
  {
    id: "apple",
    label: "Continue with Apple",
    shortLabel: "Apple",
    description: "Private, high-trust account access for mobile-first use.",
  },
  {
    id: "email",
    label: "Sign up or log in with email",
    shortLabel: "Email",
    description: "Traditional account setup for universal access and recovery.",
  },
];

export const VIEW_ORDER = [
  { id: "home", label: "Home", shortLabel: "Home" },
  { id: "round", label: "Round", shortLabel: "Round" },
  { id: "stats", label: "Stats", shortLabel: "Stats" },
  { id: "community", label: "Community", shortLabel: "Groups" },
  { id: "premium", label: "Premium", shortLabel: "Premium" },
];

export const GAME_MODES = {
  stroke: {
    id: "stroke",
    label: "Stroke Play",
    description: "Track every player by total strokes and to-par standing.",
  },
  match: {
    id: "match",
    label: "Match Play",
    description: "Track side-vs-side holes won with a head-to-head scoreboard.",
  },
  scramble: {
    id: "scramble",
    label: "Scramble",
    description: "Score teams with one combined card and faster social play.",
  },
};

export const COURSE_TEMPLATE = [
  { number: 1, par: 4, yards: 412 },
  { number: 2, par: 5, yards: 531 },
  { number: 3, par: 3, yards: 188 },
  { number: 4, par: 4, yards: 427 },
  { number: 5, par: 4, yards: 396 },
  { number: 6, par: 5, yards: 548 },
  { number: 7, par: 3, yards: 173 },
  { number: 8, par: 4, yards: 442 },
  { number: 9, par: 4, yards: 408 },
  { number: 10, par: 4, yards: 399 },
  { number: 11, par: 5, yards: 554 },
  { number: 12, par: 4, yards: 434 },
  { number: 13, par: 3, yards: 181 },
  { number: 14, par: 4, yards: 446 },
  { number: 15, par: 4, yards: 402 },
  { number: 16, par: 3, yards: 194 },
  { number: 17, par: 5, yards: 566 },
  { number: 18, par: 4, yards: 418 },
];

export const CONNECTION_COPY = {
  local: "Local only",
  invite: "Invite code",
  nearby: "Nearby sync",
  bluetooth: "Bluetooth sync",
  cloud: "Live cloud sync",
};

export const TOURNAMENT_STATUSES = ["planning", "open", "live", "completed"];
export const GEAR_CATEGORIES = ["club", "apparel", "accessory"];
export const PREMIUM_MODE_IDS = ["match", "scramble"];
export const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    label: "Free",
    priceLabel: "$0",
    billingLabel: "Included",
    highlight: "Simple live scoring and round history",
    features: [
      "Start and track rounds",
      "Basic score entry and leaderboard",
      "Round history and simple stats",
      "Join rounds by invite code",
      "Basic player profile",
    ],
  },
  {
    id: "premium",
    label: "Premium",
    priceLabel: "$8.99",
    billingLabel: "per month",
    highlight: "Advanced golf intelligence and premium group tools",
    features: [
      "Advanced stats and round insights",
      "Enhanced live group and sync tools",
      "Tournament and league controls",
      "Advanced scoring modes",
      "Future GPS, watch, and smart gear integrations",
    ],
  },
];

export const PRIVACY_CONTROL_OPTIONS = [
  { id: "showHomeCourse", label: "Show home course publicly" },
  { id: "showHandicap", label: "Show handicap publicly" },
  { id: "showBio", label: "Show bio publicly" },
  { id: "showRecentForm", label: "Show recent form publicly" },
  { id: "showHeadToHead", label: "Show head-to-head placeholders publicly" },
];

export const APPEARANCE_MODE_OPTIONS = [
  { id: "system", label: "System default", description: "Follow your phone or browser appearance." },
  { id: "light", label: "Light mode", description: "Brighter surfaces with softer contrast." },
  { id: "dark", label: "Dark mode", description: "Deeper contrast for low-light use." },
];

export const TEXT_SCALE_OPTIONS = [
  { id: "standard", label: "Standard text", description: "Balanced sizing for most golfers." },
  { id: "large", label: "Larger text", description: "A little easier to scan during play." },
];

export const THEME_PRESET_OPTIONS = [
  { id: "forest", label: "Forest", description: "Classic fairway greens with warm club-house gold." },
  { id: "sand", label: "Sand", description: "Sunlit neutrals with richer bronze trim." },
  { id: "ocean", label: "Ocean", description: "Blue-green depth with brighter coastal accents." },
  { id: "slate", label: "Slate", description: "Cool stone surfaces with crisp steel-blue contrast." },
  { id: "midnight", label: "Midnight", description: "Deep ink tones with premium late-round glow." },
  { id: "ember", label: "Ember", description: "Copper warmth and sunset energy without the noise." },
  { id: "plum", label: "Plum", description: "Refined berry tones with soft luxury contrast." },
  { id: "ice", label: "Ice", description: "Clean arctic light with bright modern highlights." },
];

export const PROFILE_VISIBILITY_OPTIONS = [
  { id: "public", label: "Public", description: "Visible anywhere shared rounds and profiles are shown." },
  { id: "friends", label: "Friends only", description: "Best for invite-code groups and known golfers." },
  { id: "private", label: "Private", description: "Keep your competitive card mostly hidden for now." },
];

export const TESTER_FEEDBACK_TABLE = "tester_feedback";

export const TESTER_FEEDBACK_AREAS = [
  { id: "onboarding", label: "Getting started" },
  { id: "account", label: "Account or settings" },
  { id: "round", label: "Playing a round" },
  { id: "stats", label: "Stats and profiles" },
  { id: "community", label: "Community or joining" },
  { id: "premium", label: "Premium or upgrades" },
  { id: "bug", label: "Bug or broken behavior" },
  { id: "other", label: "Other feedback" },
];
