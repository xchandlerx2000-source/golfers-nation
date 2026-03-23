(function () {
"use strict";

// Generated browser-safe bundle for direct file opening.

// ---- src/utils/formatters.js ----
let idCounter = 0;
function uid(prefix = "id") {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}
function cloneData(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function formatDate(value) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
function formatTime(value) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}
function formatRelativeSync(value) {
  if (!value) {
    return "Not synced yet";
  }

  const diffMs = Date.now() - value;
  const diffSeconds = Math.max(0, Math.round(diffMs / 1000));

  if (diffSeconds < 15) {
    return "Just now";
  }

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  return formatTime(value);
}
function formatRelationToPar(value) {
  if (value === null || value === undefined) {
    return "--";
  }

  if (value === 0) {
    return "E";
  }

  return value > 0 ? `+${value}` : `${value}`;
}
function titleCase(value) {
  return String(value || "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function average(numbers) {
  if (!numbers.length) {
    return 0;
  }

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}
function compactNames(values) {
  return values.filter(Boolean).join(", ");
}

// ---- src/config.js ----
const STORAGE_KEY = "golfers-nation-platform-v2";
const APP_VERSION = "0.1.0";
const SUPABASE_SESSION_STORAGE_KEY = "golfers-nation-supabase-session-v1";
const RUNTIME_CONFIG_GLOBAL = "__GN_RUNTIME_CONFIG__";
const FEATURED_COURSE_ID = "golden-nugget-lake-charles";
const TESTER_DEFAULT_SUBSCRIPTION_TIER = "premium";
const LIVE_ROUND_SESSIONS_TABLE = "live_round_sessions";
const AUTH_PROVIDER_OPTIONS = [
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
const VIEW_ORDER = [
  { id: "home", label: "Home", shortLabel: "Home" },
  { id: "round", label: "Round", shortLabel: "Round" },
  { id: "stats", label: "Stats", shortLabel: "Stats" },
  { id: "community", label: "Community", shortLabel: "Groups" },
  { id: "premium", label: "Premium", shortLabel: "Premium" },
];
const GAME_MODES = {
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
const COURSE_TEMPLATE = [
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
const CONNECTION_COPY = {
  local: "Local only",
  invite: "Invite code",
  nearby: "Nearby sync",
  bluetooth: "Bluetooth sync",
  cloud: "Live cloud sync",
};
const TOURNAMENT_STATUSES = ["planning", "open", "live", "completed"];
const GEAR_CATEGORIES = ["club", "apparel", "accessory"];
const PREMIUM_MODE_IDS = ["match", "scramble"];
const SUBSCRIPTION_PLANS = [
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
const PRIVACY_CONTROL_OPTIONS = [
  { id: "showHomeCourse", label: "Show home course publicly" },
  { id: "showHandicap", label: "Show handicap publicly" },
  { id: "showBio", label: "Show bio publicly" },
  { id: "showRecentForm", label: "Show recent form publicly" },
  { id: "showHeadToHead", label: "Show head-to-head placeholders publicly" },
];
const APPEARANCE_MODE_OPTIONS = [
  { id: "system", label: "System default", description: "Follow your phone or browser appearance." },
  { id: "light", label: "Light mode", description: "Brighter surfaces with softer contrast." },
  { id: "dark", label: "Dark mode", description: "Deeper contrast for low-light use." },
];
const TEXT_SCALE_OPTIONS = [
  { id: "standard", label: "Standard text", description: "Balanced sizing for most golfers." },
  { id: "large", label: "Larger text", description: "A little easier to scan during play." },
];
const THEME_PRESET_OPTIONS = [
  { id: "forest", label: "Forest", description: "Classic fairway greens with warm club-house gold." },
  { id: "sand", label: "Sand", description: "Sunlit neutrals with richer bronze trim." },
  { id: "ocean", label: "Ocean", description: "Blue-green depth with brighter coastal accents." },
  { id: "slate", label: "Slate", description: "Cool stone surfaces with crisp steel-blue contrast." },
  { id: "midnight", label: "Midnight", description: "Deep ink tones with premium late-round glow." },
  { id: "ember", label: "Ember", description: "Copper warmth and sunset energy without the noise." },
  { id: "plum", label: "Plum", description: "Refined berry tones with soft luxury contrast." },
  { id: "ice", label: "Ice", description: "Clean arctic light with bright modern highlights." },
];
const PROFILE_VISIBILITY_OPTIONS = [
  { id: "public", label: "Public", description: "Visible anywhere shared rounds and profiles are shown." },
  { id: "friends", label: "Friends only", description: "Best for invite-code groups and known golfers." },
  { id: "private", label: "Private", description: "Keep your competitive card mostly hidden for now." },
];
const TESTER_FEEDBACK_TABLE = "tester_feedback";
const TESTER_FEEDBACK_AREAS = [
  { id: "onboarding", label: "Getting started" },
  { id: "account", label: "Account or settings" },
  { id: "round", label: "Playing a round" },
  { id: "stats", label: "Stats and profiles" },
  { id: "community", label: "Community or joining" },
  { id: "premium", label: "Premium or upgrades" },
  { id: "bug", label: "Bug or broken behavior" },
  { id: "other", label: "Other feedback" },
];

// ---- src/domain/factories.js ----
function slugifyName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18);
}

function createAvatarLabel(displayName) {
  return String(displayName || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "GN";
}

function sanitizePlayers(players, currentUser) {
  const base = Array.isArray(players) ? players : [];
  const normalized = base
    .map((player) => {
      if (typeof player === "string") {
        const name = String(player || "").trim();
        return name
          ? {
              name,
              displayName: name,
              username: slugifyName(name),
              avatarLabel: createAvatarLabel(name),
            }
          : null;
      }

      const displayName = String(player?.displayName || player?.name || "").trim();
      if (!displayName) {
        return null;
      }

      return {
        profileId: player.profileId || player.id || null,
        userId: player.userId || null,
        name: displayName,
        displayName,
        username: player.username || slugifyName(displayName),
        avatarLabel: player.avatarLabel || player.avatar || createAvatarLabel(displayName),
      };
    })
    .filter(Boolean);

  const currentName = currentUser.displayName || currentUser.name;
  if (!normalized.some((player) =>
    player.profileId
      ? player.profileId === currentUser.profileId
      : player.name.toLowerCase() === String(currentName).toLowerCase()
  )) {
    normalized.unshift({
      profileId: currentUser.profileId || null,
      userId: currentUser.id,
      name: currentName,
      displayName: currentName,
      username: currentUser.username || slugifyName(currentName),
      avatarLabel: currentUser.avatarLabel || currentUser.avatar || createAvatarLabel(currentName),
    });
  }

  const seen = new Set();
  return normalized.filter((player) => {
    const key = player.profileId || player.name.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).slice(0, 4);
}

function createPlayer(player, index, currentUserId, currentUserName) {
  return {
    id: uid("player"),
    profileId: player.profileId || null,
    userId: player.userId || (player.name.toLowerCase() === currentUserName.toLowerCase() ? currentUserId : null),
    name: player.name,
    username: player.username || slugifyName(player.name),
    avatarLabel: player.avatarLabel || createAvatarLabel(player.name),
    role: index === 0 ? "owner" : "guest",
  };
}

function createSides(mode, players) {
  if (mode === "stroke") {
    return [];
  }

  const left = players.filter((_, index) => index % 2 === 0);
  const right = players.filter((_, index) => index % 2 === 1);

  return [
    {
      id: uid("side"),
      name: mode === "scramble" ? "Team Fairway" : "Side A",
      playerIds: left.map((player) => player.id),
      playerNames: left.map((player) => player.name),
    },
    {
      id: uid("side"),
      name: mode === "scramble" ? "Team Green" : "Side B",
      playerIds: right.map((player) => player.id),
      playerNames: right.map((player) => player.name),
    },
  ].filter((side) => side.playerIds.length);
}

function createHoleEntries(mode, players, sides) {
  const participants = mode === "stroke" ? players : sides;
  return participants.map((participant) => ({
    participantId: participant.id,
    strokes: null,
    putts: null,
    penalties: 0,
    fairwayHit: false,
    gir: false,
    upAndDown: false,
    sandSave: false,
    updatedAt: null,
    lastEventId: null,
  }));
}
function createRound({
  currentUser,
  courseName,
  teeBox,
  teeBoxId = null,
  weather,
  mode = "stroke",
  players,
  syncTransport = "local",
  status = "active",
  inviteCode = null,
  groupId = null,
  tournamentId = null,
  courseId = null,
  courseCity = "",
  courseState = "",
  courseRegion = "",
  courseLatitude = null,
  courseLongitude = null,
  courseSource = "",
  courseSeeded = false,
  courseMetadata = null,
  holesTemplate = null,
  courseRating = null,
  courseSlope = null,
}) {
  const safeMode = GAME_MODES[mode] ? mode : "stroke";
  const currentUserName = currentUser.displayName || currentUser.name;
  const playerInputs = sanitizePlayers(players, currentUser);
  const playerRecords = playerInputs.map((player, index) =>
    createPlayer(player, index, currentUser.id, currentUserName)
  );
  const sideRecords = createSides(safeMode, playerRecords);
  const sourceHoles = Array.isArray(holesTemplate) && holesTemplate.length === 18
    ? holesTemplate
    : COURSE_TEMPLATE;
  const holes = sourceHoles.map((hole) => ({
    ...cloneData(hole),
    entries: createHoleEntries(safeMode, playerRecords, sideRecords),
  }));

  const round = {
    id: uid("round"),
    status,
    mode: safeMode,
    courseName: courseName || "National Pines",
    teeBox: teeBox || "Blue",
    teeBoxId,
    courseId,
    courseCity,
    courseState,
    courseRegion,
    courseLatitude,
    courseLongitude,
    courseSource,
    courseSeeded,
    courseMetadata: cloneData(courseMetadata || {}),
    courseRating,
    courseSlope,
    weather: weather || "Calm 72F",
    visibility: "friends",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    startedAt: Date.now(),
    completedAt: status === "completed" ? Date.now() : null,
    inviteCode,
    groupId,
    tournamentId,
    currentHole: 1,
    players: playerRecords,
    sides: sideRecords,
    holes,
    sync: {
      state: syncTransport === "local" ? "local" : "connected",
      transport: syncTransport,
      label: CONNECTION_COPY[syncTransport] || CONNECTION_COPY.local,
      lastEventAt: null,
      note: "Offline-first round data with a future real-time sync path.",
    },
    eventLog: [],
    notes: [],
  };

  return ensureRoundSyncScaffold(round);
}
function createGroup({ round, currentUser, inviteCode, transport = "invite", status = "hosting" }) {
  return {
    id: uid("group"),
    roundId: round.id,
    title: `${round.courseName} ${GAME_MODES[round.mode].label}`,
    inviteCode,
    status,
    transport,
    hostUserId: currentUser.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    hostRequired: false,
    hostOptional: true,
    members: round.players.map((player, index) => ({
      id: uid("member"),
      playerId: player.id,
      profileId: player.profileId,
      userId: player.userId,
      displayName: player.name,
      username: player.username || slugifyName(player.name),
      avatarLabel: player.avatarLabel || createAvatarLabel(player.name),
      role: index === 0 ? "host" : "player",
      connectionState: index === 0 ? "ready" : "pending",
    })),
    feed: [
      createActivity({
        type: "sync",
        message: `Invite code ${inviteCode} is live for ${round.courseName}.`,
      }),
    ],
  };
}
function createTournament({
  name,
  courseName,
  date,
  mode = "stroke",
  fieldSize = 16,
  linkedRoundId = null,
  status = "planning",
}) {
  return {
    id: uid("tournament"),
    name,
    courseName,
    date,
    mode,
    fieldSize,
    linkedRoundId,
    status,
    createdAt: Date.now(),
    entries: [],
  };
}
function createGearItem({ category, name, notes = "", packed = false, weatherUse = "" }) {
  return {
    id: uid("gear"),
    category,
    name,
    notes,
    packed,
    weatherUse,
    createdAt: Date.now(),
  };
}
function createPlayerProfile({
  userId = null,
  displayName,
  username,
  avatarLabel,
  email = "",
  homeCourse = "",
  handicap = null,
  bio = "",
  createdAt = Date.now(),
  premiumStatus = "free",
  privacy = {},
  publicStats = {},
  recentForm = [],
  headToHead = [],
}) {
  const safeDisplayName = String(displayName || "").trim() || "Golfer";
  const safeUsername = String(username || "").trim() || slugifyName(safeDisplayName);
  const safeAvatarLabel = String(avatarLabel || "").trim() || createAvatarLabel(safeDisplayName);

  return {
    id: uid("profile"),
    userId,
    displayName: safeDisplayName,
    username: safeUsername.startsWith("@") ? safeUsername : `@${safeUsername}`,
    avatarLabel: safeAvatarLabel,
    account: {
      email,
      createdAt,
      premiumStatus,
      authProviders: [],
    },
    privateProfile: {
      homeCourse,
      handicap,
      bio,
      privacy: {
        showHomeCourse: true,
        showHandicap: true,
        showBio: true,
        showRecentForm: true,
        showHeadToHead: false,
        showEmail: false,
        ...privacy,
      },
    },
    publicProfile: {
      displayName: safeDisplayName,
      username: safeUsername.startsWith("@") ? safeUsername : `@${safeUsername}`,
      avatarLabel: safeAvatarLabel,
      homeCourse,
      handicap,
      bio,
      roundsPlayed: publicStats.roundsPlayed || 0,
      averageScore: publicStats.averageScore || null,
      bestRound: publicStats.bestRound || null,
      recentFormSummary: publicStats.recentFormSummary || "New profile",
      fairwayPercentage: publicStats.fairwayPercentage ?? 0,
      girPercentage: publicStats.girPercentage ?? 0,
      averagePutts: publicStats.averagePutts ?? null,
      penaltiesAverage: publicStats.penaltiesAverage ?? 0,
      upAndDownRate: publicStats.upAndDownRate ?? 0,
      sandSaveCount: publicStats.sandSaveCount ?? 0,
      scoringByParType: publicStats.scoringByParType || {},
      hardestHoles: publicStats.hardestHoles || [],
      bestHoles: publicStats.bestHoles || [],
      strokesGained: publicStats.strokesGained || null,
      formLabel: publicStats.formLabel || "Stable",
      trendSummary: publicStats.trendSummary || "Building a trend",
      handicapIndex: publicStats.handicapIndex ?? null,
      smartInsights: publicStats.smartInsights || [],
      recentForm,
      headToHead,
    },
    updatedAt: Date.now(),
  };
}
function createActivity({ type = "update", message }) {
  return {
    id: uid("activity"),
    type,
    message,
    createdAt: Date.now(),
  };
}
function describeSide(side) {
  return `${side.name}: ${compactNames(side.playerNames)}`;
}

// ---- src/domain/scoring.js ----
const PAR_TYPES = [3, 4, 5];

function isPlayedEntry(entry) {
  return Boolean(entry && entry.strokes !== null && entry.strokes > 0);
}

function getRoundHoles(round, holeLimit = null) {
  if (!Number.isFinite(holeLimit)) {
    return round.holes;
  }

  return round.holes.filter((hole) => hole.number <= holeLimit);
}

function roundRatio(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function roundValue(value, digits = 1) {
  return typeof value === "number" && Number.isFinite(value)
    ? Number(value.toFixed(digits))
    : null;
}

function createParTypeBucket(par) {
  return {
    par,
    holes: 0,
    totalStrokes: 0,
    totalPar: 0,
    averageScore: null,
    toPar: 0,
  };
}

function summarizeParTypeScoring(playedHoles) {
  const buckets = {
    3: createParTypeBucket(3),
    4: createParTypeBucket(4),
    5: createParTypeBucket(5),
  };

  playedHoles.forEach(({ hole, entry }) => {
    const bucket = buckets[hole.par];
    if (!bucket) {
      return;
    }

    bucket.holes += 1;
    bucket.totalStrokes += entry.strokes;
    bucket.totalPar += hole.par;
  });

  PAR_TYPES.forEach((par) => {
    const bucket = buckets[par];
    bucket.averageScore = bucket.holes ? roundValue(bucket.totalStrokes / bucket.holes, 2) : null;
    bucket.toPar = bucket.totalStrokes - bucket.totalPar;
  });

  return buckets;
}

function mergeParTypeScoring(collection) {
  const merged = {
    3: createParTypeBucket(3),
    4: createParTypeBucket(4),
    5: createParTypeBucket(5),
  };

  collection.forEach((buckets) => {
    PAR_TYPES.forEach((par) => {
      const source = buckets?.[par];
      if (!source) {
        return;
      }

      merged[par].holes += source.holes || 0;
      merged[par].totalStrokes += source.totalStrokes || 0;
      merged[par].totalPar += source.totalPar || 0;
    });
  });

  PAR_TYPES.forEach((par) => {
    const bucket = merged[par];
    bucket.averageScore = bucket.holes ? roundValue(bucket.totalStrokes / bucket.holes, 2) : null;
    bucket.toPar = bucket.totalStrokes - bucket.totalPar;
  });

  return merged;
}

function createHolePerformanceBucket(holeNumber, par) {
  return {
    holeNumber,
    par,
    rounds: 0,
    totalStrokes: 0,
    totalToPar: 0,
    totalPutts: 0,
    totalPenalties: 0,
    fairwaysHit: 0,
    fairwayOpportunities: 0,
    greensHit: 0,
  };
}

function summarizeHolePerformance(detailCollections) {
  const buckets = new Map();

  detailCollections.forEach((details) => {
    (details || []).forEach((detail) => {
      const existing = buckets.get(detail.holeNumber) || createHolePerformanceBucket(detail.holeNumber, detail.par);
      existing.rounds += 1;
      existing.totalStrokes += detail.strokes;
      existing.totalToPar += detail.toPar;
      existing.totalPutts += detail.putts ?? 0;
      existing.totalPenalties += detail.penalties || 0;
      existing.greensHit += detail.gir ? 1 : 0;

      if (detail.par > 3) {
        existing.fairwayOpportunities += 1;
        existing.fairwaysHit += detail.fairwayHit ? 1 : 0;
      }

      buckets.set(detail.holeNumber, existing);
    });
  });

  const list = [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      averageScore: bucket.rounds ? roundValue(bucket.totalStrokes / bucket.rounds, 2) : null,
      averageToPar: bucket.rounds ? roundValue(bucket.totalToPar / bucket.rounds, 2) : null,
      averagePutts: bucket.rounds ? roundValue(bucket.totalPutts / bucket.rounds, 2) : null,
      penaltiesAverage: bucket.rounds ? roundValue(bucket.totalPenalties / bucket.rounds, 2) : 0,
      fairwayRate: roundRatio(bucket.fairwaysHit, bucket.fairwayOpportunities),
      girRate: roundRatio(bucket.greensHit, bucket.rounds),
    }))
    .sort((left, right) => left.holeNumber - right.holeNumber);

  const byDifficulty = [...list].sort((left, right) =>
    (right.averageToPar ?? -999) - (left.averageToPar ?? -999)
    || (right.averageScore ?? -999) - (left.averageScore ?? -999)
    || left.holeNumber - right.holeNumber
  );
  const byScoring = [...list].sort((left, right) =>
    (left.averageToPar ?? 999) - (right.averageToPar ?? 999)
    || (left.averageScore ?? 999) - (right.averageScore ?? 999)
    || left.holeNumber - right.holeNumber
  );

  return {
    holePerformance: list,
    hardestHoles: byDifficulty.slice(0, 3),
    bestHoles: byScoring.slice(0, 3),
  };
}

function buildStrokesGainedCategory(value) {
  const rounded = roundValue(value, 1) || 0;
  return {
    value: rounded,
    label: rounded >= 0.6 ? "Gaining" : rounded <= -0.6 ? "Losing" : "Neutral",
  };
}

function calculateSimplifiedStrokesGained(playedHoles) {
  let driving = 0;
  let approach = 0;
  let putting = 0;

  playedHoles.forEach(({ hole, entry }) => {
    const penalties = entry.penalties || 0;

    if (hole.par > 3) {
      driving += entry.fairwayHit ? 0.25 : -0.18;
      driving -= penalties * 0.55;
    }

    approach += entry.gir ? 0.32 : -0.2;

    if (hole.par === 3 && !entry.gir) {
      approach -= 0.08;
    }

    if (typeof entry.putts === "number" && Number.isFinite(entry.putts)) {
      putting += (2 - entry.putts) * 0.45;
    }
  });

  const categories = {
    driving: buildStrokesGainedCategory(driving),
    approach: buildStrokesGainedCategory(approach),
    putting: buildStrokesGainedCategory(putting),
  };

  const ranked = Object.entries(categories).sort((left, right) => right[1].value - left[1].value);

  return {
    ...categories,
    total: roundValue(driving + approach + putting, 1) || 0,
    bestCategory: ranked[0]?.[0] || "driving",
    weakestCategory: ranked[ranked.length - 1]?.[0] || "putting",
  };
}
function getRecentTrend(roundEntries) {
  const values = roundEntries
    .map((entry) => entry?.totalStrokes)
    .filter((value) => typeof value === "number" && value > 0);

  if (values.length < 2) {
    return {
      label: "Stable",
      delta: 0,
      summary: "Need more rounds to establish a trend",
    };
  }

  const recentAverage = average(values.slice(0, 3));
  const priorValues = values.slice(3, 6);

  if (!priorValues.length) {
    return {
      label: "Stable",
      delta: 0,
      summary: "Building a trend from recent rounds",
    };
  }

  const priorAverage = average(priorValues);
  const delta = roundValue(priorAverage - recentAverage, 1) || 0;
  const label = delta >= 1.5
      ? "Improving"
      : delta <= -1.5
        ? "Declining"
        : "Stable";

  return {
    label,
    delta,
    summary: label === "Improving"
      ? `${Math.abs(delta).toFixed(1)} strokes better than the prior stretch`
      : label === "Declining"
        ? `${Math.abs(delta).toFixed(1)} strokes higher than the prior stretch`
        : "Recent scoring is holding steady",
  };
}
function calculateHandicapScaffold(roundEntries) {
  const differentials = roundEntries
    .map((entry) => {
      if (typeof entry?.totalStrokes !== "number" || typeof entry?.totalPar !== "number") {
        return null;
      }

      return entry.totalStrokes - entry.totalPar;
    })
    .filter((value) => value !== null)
    .sort((left, right) => left - right);

  if (!differentials.length) {
    return null;
  }

  const sampleSize = differentials.length >= 8 ? 3 : differentials.length >= 4 ? 2 : 1;
  return roundValue(average(differentials.slice(0, sampleSize)) * 0.96, 1);
}
function buildPerformanceInsights(metrics) {
  const insights = [];
  const fairwayRate = metrics.fairwayRate ?? metrics.fairwayPercentage ?? metrics.fairways ?? 0;
  const girRate = metrics.girRate ?? metrics.girPercentage ?? metrics.gir ?? 0;
  const averagePutts = metrics.averagePutts ?? metrics.putts ?? null;
  const penalties = metrics.totalPenalties ?? metrics.penaltiesAverage ?? 0;
  const upAndDownRate = metrics.upAndDownRate ?? 0;
  const trendLabel = metrics.recentTrend?.label || metrics.formLabel || null;
  const parFive = metrics.scoringByParType?.[5];
  const strokesGained = metrics.strokesGained || null;
  const hardestHole = metrics.hardestHoles?.[0] || null;

  if (fairwayRate >= 60) {
    insights.push("Driving looks reliable and is keeping the round in position.");
  } else if (fairwayRate > 0 && fairwayRate <= 45) {
    insights.push("Missed fairways are costing clean approaches. Tighten the tee ball first.");
  }

  if (girRate >= 55) {
    insights.push("Approach play is creating plenty of birdie and par looks.");
  } else if (girRate > 0 && girRate <= 35) {
    insights.push("Greens in regulation are low. More center-green approaches could save shots quickly.");
  }

  if (typeof averagePutts === "number" && averagePutts <= 1.9) {
    insights.push("Putting is a strength right now. Conversion on the green is helping scoring.");
  } else if (typeof averagePutts === "number" && averagePutts >= 2.2) {
    insights.push("Putting is leaving strokes out there. Short-putt cleanup is the fastest gain.");
  }

  if (penalties >= 1.5) {
    insights.push("Penalty strokes are adding up. Smarter misses can lower scores quickly.");
  }

  if (upAndDownRate >= 45) {
    insights.push("Short-game recovery is strong when greens are missed.");
  }

  if (parFive?.holes && parFive.toPar <= 0) {
    insights.push("Par 5 scoring is a clear advantage in the current sample.");
  }

  if (strokesGained?.putting?.label === "Gaining") {
    insights.push("Putting is outperforming your baseline and helping you convert scoring chances.");
  } else if (strokesGained?.approach?.label === "Losing") {
    insights.push("Approach play is trailing the rest of the game. More greens hit would move scoring fast.");
  }

  if (hardestHole && hardestHole.averageToPar >= 0.8) {
    insights.push(`Hole ${hardestHole.holeNumber} has been the toughest scoring spot in your recent sample.`);
  }

  if (trendLabel === "Improving") {
    insights.push("Recent rounds are trending better. The current practice plan is working.");
  } else if (trendLabel === "Declining") {
    insights.push("Recent rounds are slipping. Focus on the weakest category before the next card.");
  }

  if (!insights.length) {
    insights.push("The stat sample is still building. Finish a few more rounds for sharper insights.");
  }

  return insights.slice(0, 3);
}
function getScoringParticipants(round) {
  return round.mode === "stroke" ? round.players : round.sides;
}
function getLocalParticipantIds(round, currentUserId) {
  if (round.mode === "stroke") {
    return round.players.filter((player) => player.userId === currentUserId).map((player) => player.id);
  }

  return round.sides
    .filter((side) => side.playerIds.some((playerId) => round.players.find((player) => player.id === playerId)?.userId === currentUserId))
    .map((side) => side.id);
}
function applyHoleUpdate(round, holeNumber, participantId, patch, options = {}) {
  const hole = round.holes.find((item) => item.number === holeNumber);
  if (!hole) {
    return round;
  }

  const entry = hole.entries.find((item) => item.participantId === participantId);
  if (!entry) {
    return round;
  }

  if (Object.hasOwn(patch, "strokes")) {
    entry.strokes = patch.strokes === null || patch.strokes === "" ? null : Number(patch.strokes);
  }

  if (Object.hasOwn(patch, "putts")) {
    entry.putts = patch.putts === null || patch.putts === "" ? null : Number(patch.putts);
  }

  if (Object.hasOwn(patch, "penalties")) {
    entry.penalties = patch.penalties === null || patch.penalties === ""
      ? 0
      : Math.max(0, Number(patch.penalties));
  }

  if (Object.hasOwn(patch, "fairwayHit")) {
    entry.fairwayHit = Boolean(patch.fairwayHit);
  }

  if (Object.hasOwn(patch, "gir")) {
    entry.gir = Boolean(patch.gir);
  }

  if (Object.hasOwn(patch, "upAndDown")) {
    entry.upAndDown = Boolean(patch.upAndDown);
  }

  if (Object.hasOwn(patch, "sandSave")) {
    entry.sandSave = Boolean(patch.sandSave);
  }

  const appliedAt = Number.isFinite(options.timestamp) ? Number(options.timestamp) : Date.now();
  entry.updatedAt = appliedAt;
  if (options.eventId) {
    entry.lastEventId = options.eventId;
  }
  round.updatedAt = appliedAt;
  round.currentHole = hole.number;
  return round;
}
function getParticipantTotals(round, participantId, options = {}) {
  const holeLimit = typeof options === "number" ? options : options?.holeLimit ?? null;
  const holes = getRoundHoles(round, holeLimit)
    .map((hole) => ({
      hole,
      entry: hole.entries.find((item) => item.participantId === participantId),
    }))
    .filter(({ entry }) => entry);

  const played = holes.filter(({ entry }) => isPlayedEntry(entry));
  const holeDetails = played.map(({ hole, entry }) => ({
    holeNumber: hole.number,
    par: hole.par,
    strokes: entry.strokes,
    toPar: entry.strokes - hole.par,
    putts: typeof entry.putts === "number" ? entry.putts : null,
    penalties: entry.penalties || 0,
    fairwayHit: entry.fairwayHit,
    gir: entry.gir,
  }));
  const totalStrokes = played.reduce((sum, item) => sum + item.entry.strokes, 0);
  const puttEntries = played.filter(({ entry }) => typeof entry.putts === "number" && Number.isFinite(entry.putts));
  const totalPutts = puttEntries.reduce((sum, item) => sum + item.entry.putts, 0);
  const totalPar = played.reduce((sum, item) => sum + item.hole.par, 0);
  const totalPenalties = played.reduce((sum, item) => sum + (item.entry.penalties || 0), 0);
  const fairwayEligible = played.filter(({ hole }) => hole.par > 3);
  const fairwaysHit = fairwayEligible.filter(({ entry }) => entry.fairwayHit).length;
  const greensHit = played.filter(({ entry }) => entry.gir).length;
  const upAndDownOpportunities = played.filter(({ entry }) => !entry.gir).length;
  const upAndDownSuccesses = played.filter(({ entry }) => entry.upAndDown).length;
  const sandSaveCount = played.filter(({ entry }) => entry.sandSave).length;
  const scoringByParType = summarizeParTypeScoring(played);
  const strokesGained = calculateSimplifiedStrokesGained(played);

  return {
    holesPlayed: played.length,
    holeDetails,
    totalStrokes,
    totalPutts,
    puttHolesRecorded: puttEntries.length,
    totalPar,
    toPar: totalStrokes - totalPar,
    fairwaysHit,
    fairwayOpportunities: fairwayEligible.length,
    fairwayRate: roundRatio(fairwaysHit, fairwayEligible.length),
    greensHit,
    girOpportunities: played.length,
    girRate: roundRatio(greensHit, played.length),
    totalPenalties,
    upAndDownSuccesses,
    upAndDownOpportunities,
    upAndDownRate: roundRatio(upAndDownSuccesses, upAndDownOpportunities),
    sandSaveCount,
    averagePutts: puttEntries.length ? roundValue(totalPutts / puttEntries.length, 2) : null,
    scoringByParType,
    strokesGained,
  };
}

function buildStrokeLeaderboard(round, currentUserId, holeLimit = null) {
  return getScoringParticipants(round)
    .map((participant) => {
      const totals = getParticipantTotals(round, participant.id, { holeLimit });
      const localIds = getLocalParticipantIds(round, currentUserId);
      return {
        id: participant.id,
        name: participant.name,
        subtitle: round.mode === "scramble" ? participant.playerNames.join(", ") : "Player card",
        isLocal: localIds.includes(participant.id),
        thru: totals.holesPlayed,
        total: totals.totalStrokes,
        toPar: totals.toPar,
        fairwayRate: totals.fairwayRate,
        girRate: totals.girRate,
        totalPutts: totals.totalPutts,
        totalPenalties: totals.totalPenalties,
        displayStatus: totals.holesPlayed ? formatRelationToPar(totals.toPar) : "NS",
      };
    })
    .sort((left, right) => {
      if (left.thru === 0 && right.thru > 0) {
        return 1;
      }
      if (right.thru === 0 && left.thru > 0) {
        return -1;
      }
      return left.toPar - right.toPar || left.total - right.total || right.thru - left.thru;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

function buildMatchLeaderboard(round, currentUserId, holeLimit = null) {
  const sides = getScoringParticipants(round);
  const [left, right] = sides;

  if (!left || !right) {
    return buildStrokeLeaderboard(round, currentUserId, holeLimit);
  }

  let leftWins = 0;
  let rightWins = 0;
  let halved = 0;
  let holesPlayed = 0;

  getRoundHoles(round, holeLimit).forEach((hole) => {
    const leftEntry = hole.entries.find((entry) => entry.participantId === left.id);
    const rightEntry = hole.entries.find((entry) => entry.participantId === right.id);
    if (!leftEntry?.strokes || !rightEntry?.strokes) {
      return;
    }

    holesPlayed += 1;
    if (leftEntry.strokes < rightEntry.strokes) {
      leftWins += 1;
      return;
    }

    if (rightEntry.strokes < leftEntry.strokes) {
      rightWins += 1;
      return;
    }

    halved += 1;
  });

  const delta = leftWins - rightWins;
  const leftLocal = getLocalParticipantIds(round, currentUserId).includes(left.id);
  const rightLocal = getLocalParticipantIds(round, currentUserId).includes(right.id);

  const leftStanding = delta > 0 ? `${delta} Up` : delta < 0 ? `${Math.abs(delta)} Down` : "AS";
  const rightStanding = delta < 0 ? `${Math.abs(delta)} Up` : delta > 0 ? `${delta} Down` : "AS";

  return [
    {
      id: left.id,
      rank: delta >= 0 ? 1 : 2,
      name: left.name,
      subtitle: left.playerNames.join(", "),
      isLocal: leftLocal,
      thru: holesPlayed,
      total: leftWins,
      toPar: 0,
      fairwayRate: 0,
      girRate: 0,
      totalPutts: 0,
      totalPenalties: 0,
      displayStatus: leftStanding,
      holesWon: leftWins,
      holesHalved: halved,
    },
    {
      id: right.id,
      rank: delta <= 0 ? 1 : 2,
      name: right.name,
      subtitle: right.playerNames.join(", "),
      isLocal: rightLocal,
      thru: holesPlayed,
      total: rightWins,
      toPar: 0,
      fairwayRate: 0,
      girRate: 0,
      totalPutts: 0,
      totalPenalties: 0,
      displayStatus: rightStanding,
      holesWon: rightWins,
      holesHalved: halved,
    },
  ].sort((leftEntry, rightEntry) => leftEntry.rank - rightEntry.rank);
}
function buildLeaderboard(round, currentUserId, holeLimit = null) {
  return round.mode === "match"
    ? buildMatchLeaderboard(round, currentUserId, holeLimit)
    : buildStrokeLeaderboard(round, currentUserId, holeLimit);
}

function getLastScoredHoleNumber(round) {
  return round.holes.reduce((highest, hole) => {
    const hasScore = hole.entries.some((entry) => isPlayedEntry(entry));
    return hasScore ? hole.number : highest;
  }, 0);
}

function buildHoleWinnerSummary(round) {
  const participants = getScoringParticipants(round);
  const participantNames = new Map(participants.map((participant) => [participant.id, participant.name]));
  const latestCompetitiveHole = [...round.holes]
    .reverse()
    .find((hole) => hole.entries.filter((entry) => isPlayedEntry(entry)).length >= 2);

  if (!latestCompetitiveHole) {
    return null;
  }

  const playedEntries = latestCompetitiveHole.entries.filter((entry) => isPlayedEntry(entry));
  const winningScore = Math.min(...playedEntries.map((entry) => entry.strokes));
  const winnerNames = playedEntries
    .filter((entry) => entry.strokes === winningScore)
    .map((entry) => participantNames.get(entry.participantId) || "Golfer");

  return {
    holeNumber: latestCompetitiveHole.number,
    winningScore,
    winnerNames,
    tied: winnerNames.length > 1,
    label: winnerNames.length > 1
      ? `Hole ${latestCompetitiveHole.number} halved`
      : `Hole ${latestCompetitiveHole.number} to ${winnerNames[0]}`,
    detail: winnerNames.length > 1
      ? `${winnerNames.join(" and ")} matched ${winningScore}.`
      : `${winnerNames[0]} won the hole with ${winningScore}.`,
  };
}

function buildMomentumSummary(localTotals) {
  const recentHoles = (localTotals?.holeDetails || []).slice(-3);

  if (!recentHoles.length) {
    return {
      label: "Start the card",
      detail: "Momentum shows up after the first few holes.",
      tone: "steady",
    };
  }

  const totalToPar = recentHoles.reduce((sum, hole) => sum + hole.toPar, 0);
  const underParCount = recentHoles.filter((hole) => hole.toPar < 0).length;
  const evenOrBetterCount = recentHoles.filter((hole) => hole.toPar <= 0).length;
  const bogeyOrWorseCount = recentHoles.filter((hole) => hole.toPar > 0).length;

  if (underParCount >= 2 || (recentHoles.length >= 2 && evenOrBetterCount === recentHoles.length)) {
    return {
      label: "Hot streak",
      detail: `${evenOrBetterCount}/${recentHoles.length} recent holes at par or better.`,
      tone: "up",
    };
  }

  if (totalToPar <= -1) {
    return {
      label: "Momentum up",
      detail: `${Math.abs(totalToPar)} under par over the last ${recentHoles.length} holes.`,
      tone: "up",
    };
  }

  if (bogeyOrWorseCount >= 2) {
    return {
      label: "Bounce-back spot",
      detail: `Last ${recentHoles.length} holes have trended ${totalToPar > 0 ? `${totalToPar} over` : "flat"}.`,
      tone: "down",
    };
  }

  return {
    label: "Steady stretch",
    detail: `Last ${recentHoles.length} holes are settling in.`,
    tone: "steady",
  };
}

function buildHeadToHeadSummary(round, leaderboard, localParticipant) {
  if (!localParticipant || leaderboard.length < 2) {
    return null;
  }

  const rival = localParticipant.rank === 1
    ? leaderboard.find((entry) => entry.id !== localParticipant.id)
    : leaderboard[Math.max(0, localParticipant.rank - 2)] || leaderboard[0];

  if (!rival) {
    return null;
  }

  if (round.mode === "match") {
    return {
      rivalName: rival.name,
      label: localParticipant.rank === 1 ? `Ahead of ${rival.name}` : `Chasing ${rival.name}`,
      detail: `${localParticipant.displayStatus} vs ${rival.displayStatus}`,
    };
  }

  const strokeGap = Math.abs((localParticipant.total || 0) - (rival.total || 0));
  return {
    rivalName: rival.name,
    label: localParticipant.rank === 1 ? `Ahead of ${rival.name}` : `Chasing ${rival.name}`,
    detail: `${strokeGap} ${strokeGap === 1 ? "stroke" : "strokes"} ${localParticipant.rank === 1 ? "clear" : "back"}`,
  };
}

function addRankMovement(round, currentUserId, leaderboard) {
  const lastScoredHole = getLastScoredHoleNumber(round);
  if (lastScoredHole <= 1) {
    return leaderboard.map((entry) => ({
      ...entry,
      previousRank: entry.rank,
      rankDelta: 0,
      rankTrend: "steady",
      rankTrendLabel: "Opening stretch",
    }));
  }

  const previousLeaderboard = buildLeaderboard(round, currentUserId, lastScoredHole - 1);
  const previousRanks = new Map(previousLeaderboard.map((entry) => [entry.id, entry.rank]));

  return leaderboard.map((entry) => {
    const previousRank = previousRanks.get(entry.id) ?? entry.rank;
    const rankDelta = previousRank - entry.rank;

    return {
      ...entry,
      previousRank,
      rankDelta,
      rankTrend: rankDelta > 0 ? "up" : rankDelta < 0 ? "down" : "steady",
      rankTrendLabel: rankDelta > 0
        ? `Up ${rankDelta}`
        : rankDelta < 0
          ? `Down ${Math.abs(rankDelta)}`
          : "Steady",
    };
  });
}
function getRoundSummary(round, currentUserId) {
  const leaderboard = addRankMovement(round, currentUserId, buildLeaderboard(round, currentUserId));
  const localParticipant = leaderboard.find((entry) => entry.isLocal) || leaderboard[0];
  const localTotals = localParticipant ? getParticipantTotals(round, localParticipant.id) : null;
  const holesPlayed = Math.max(...leaderboard.map((entry) => entry.thru), 0);
  const holeWinner = buildHoleWinnerSummary(round);
  const momentum = buildMomentumSummary(localTotals);
  const headToHead = buildHeadToHeadSummary(round, leaderboard, localParticipant);

  return {
    leaderboard,
    holesPlayed,
    totalHoles: round.holes.length,
    localParticipant,
    localTotals,
    roundInsights: localTotals ? buildPerformanceInsights({
      ...localTotals,
      ...summarizeHolePerformance([localTotals.holeDetails]),
    }) : [],
    holeWinner,
    momentum,
    headToHead,
    roundLabel: GAME_MODES[round.mode].label,
    averagePutts: localTotals?.averagePutts ?? null,
    completed: round.status === "completed",
    winnerLabel: leaderboard.length ? leaderboard[0].name : "No leader yet",
  };
}
function getHistoryMetrics(rounds, currentUserId) {
  const localRounds = rounds
    .filter((round) => round.status === "completed")
    .map((round) => {
      const participantId = getLocalParticipantIds(round, currentUserId)[0];
      if (!participantId) {
        return null;
      }

      return {
        roundId: round.id,
        completedAt: round.completedAt || round.updatedAt || round.createdAt,
        totals: getParticipantTotals(round, participantId),
      };
    })
    .filter(Boolean)
    .sort((left, right) => (right.completedAt || 0) - (left.completedAt || 0));

  const totalFairwaysHit = localRounds.reduce((sum, round) => sum + round.totals.fairwaysHit, 0);
  const totalFairwayOpportunities = localRounds.reduce((sum, round) => sum + round.totals.fairwayOpportunities, 0);
  const totalGreensHit = localRounds.reduce((sum, round) => sum + round.totals.greensHit, 0);
  const totalGirOpportunities = localRounds.reduce((sum, round) => sum + round.totals.girOpportunities, 0);
  const totalPutts = localRounds.reduce((sum, round) => sum + round.totals.totalPutts, 0);
  const totalPlayedHoles = localRounds.reduce((sum, round) => sum + round.totals.holesPlayed, 0);
  const totalPuttHoles = localRounds.reduce((sum, round) => sum + (round.totals.puttHolesRecorded || 0), 0);
  const totalPenalties = localRounds.reduce((sum, round) => sum + round.totals.totalPenalties, 0);
  const totalUpAndDowns = localRounds.reduce((sum, round) => sum + round.totals.upAndDownSuccesses, 0);
  const totalUpAndDownOpportunities = localRounds.reduce((sum, round) => sum + round.totals.upAndDownOpportunities, 0);
  const totalSandSaves = localRounds.reduce((sum, round) => sum + round.totals.sandSaveCount, 0);
  const recentTrend = getRecentTrend(localRounds.map((round) => ({
    totalStrokes: round.totals.totalStrokes,
  })));
  const scoringByParType = mergeParTypeScoring(localRounds.map((round) => round.totals.scoringByParType));
  const holeSummary = summarizeHolePerformance(localRounds.map((round) => round.totals.holeDetails));
  const strokesGained = ["driving", "approach", "putting"].reduce((result, key) => {
    const values = localRounds
      .map((round) => round.totals.strokesGained?.[key]?.value)
      .filter((value) => typeof value === "number");
    const averageValue = values.length ? roundValue(average(values), 1) || 0 : 0;
    result[key] = buildStrokesGainedCategory(averageValue);
    return result;
  }, {});
  const rankedStrokesGained = Object.entries(strokesGained).sort((left, right) => right[1].value - left[1].value);
  const handicapIndex = calculateHandicapScaffold(localRounds.map((round) => ({
    totalStrokes: round.totals.totalStrokes,
    totalPar: round.totals.totalPar,
  })));

  return {
    roundsPlayed: localRounds.length,
    scoringAverage: average(localRounds.map((round) => round.totals.totalStrokes || 0)),
    fairways: roundRatio(totalFairwaysHit, totalFairwayOpportunities),
    gir: roundRatio(totalGreensHit, totalGirOpportunities),
    putts: totalPuttHoles ? roundValue(totalPutts / totalPuttHoles, 2) : null,
    penaltiesAverage: localRounds.length ? roundValue(totalPenalties / localRounds.length, 2) : 0,
    upAndDownRate: roundRatio(totalUpAndDowns, totalUpAndDownOpportunities),
    sandSaveCount: totalSandSaves,
    scoringByParType,
    hardestHoles: holeSummary.hardestHoles,
    bestHoles: holeSummary.bestHoles,
    holePerformance: holeSummary.holePerformance,
    recentTrend,
    formLabel: recentTrend.label,
    trendDirection: recentTrend.delta > 0 ? "up" : recentTrend.delta < 0 ? "down" : "flat",
    handicapIndex,
    strokesGained: {
      ...strokesGained,
      total: roundValue(
        (strokesGained.driving?.value || 0)
        + (strokesGained.approach?.value || 0)
        + (strokesGained.putting?.value || 0),
        1
      ) || 0,
      bestCategory: rankedStrokesGained[0]?.[0] || "driving",
      weakestCategory: rankedStrokesGained[rankedStrokesGained.length - 1]?.[0] || "putting",
    },
    smartInsights: buildPerformanceInsights({
      fairways: roundRatio(totalFairwaysHit, totalFairwayOpportunities),
      gir: roundRatio(totalGreensHit, totalGirOpportunities),
      putts: totalPuttHoles ? roundValue(totalPutts / totalPuttHoles, 2) : null,
      penaltiesAverage: localRounds.length ? roundValue(totalPenalties / localRounds.length, 2) : 0,
      upAndDownRate: roundRatio(totalUpAndDowns, totalUpAndDownOpportunities),
      scoringByParType,
      hardestHoles: holeSummary.hardestHoles,
      recentTrend,
      formLabel: recentTrend.label,
      strokesGained: {
        ...strokesGained,
        total: roundValue(
          (strokesGained.driving?.value || 0)
          + (strokesGained.approach?.value || 0)
          + (strokesGained.putting?.value || 0),
          1
        ) || 0,
      },
    }),
  };
}
function getFrequentPartners(rounds, currentUserId) {
  const partnerMap = new Map();

  rounds.forEach((round) => {
    const localPlayers = round.players.filter((player) => player.userId === currentUserId);
    if (!localPlayers.length) {
      return;
    }

    round.players
      .filter((player) => player.userId !== currentUserId)
      .forEach((player) => {
        const previous = partnerMap.get(player.name) || { name: player.name, rounds: 0, latest: 0 };
        previous.rounds += 1;
        previous.latest = Math.max(previous.latest, round.updatedAt || round.completedAt || round.createdAt);
        partnerMap.set(player.name, previous);
      });
  });

  return [...partnerMap.values()]
    .sort((left, right) => right.rounds - left.rounds || right.latest - left.latest)
    .slice(0, 6);
}

// ---- src/domain/round-sync.js ----
const ROUND_CONFLICT_STRATEGY = "latest-write-wins";

const DEFAULT_SYNC_NOTE = "Offline-first round data with a future real-time sync path.";
const LOCAL_SAVE_NOTE = "Scores are safe on this device first and will keep trying to back up when signal returns.";
const SYNCING_NOTE = "Local changes are safe and currently backing up to the cloud.";
const SYNCED_NOTE = "All live round changes are backed up.";

function getRawPendingRoundEvents(round) {
  const events = Array.isArray(round?.eventLog) ? round.eventLog : [];
  return events.filter((event) => event.syncState !== "synced");
}

function detectActionType(patch = {}) {
  if (Object.hasOwn(patch, "strokes")) {
    return "score-set";
  }

  if (Object.hasOwn(patch, "putts")) {
    return "putts-updated";
  }

  if (Object.hasOwn(patch, "penalties")) {
    return "penalty-updated";
  }

  return "stat-toggle-changed";
}
function ensureRoundSyncScaffold(round) {
  if (!round) {
    return round;
  }

  round.eventLog = Array.isArray(round.eventLog) ? round.eventLog : [];
  round.sync = {
    state: "local",
    transport: "local",
    label: CONNECTION_COPY.local,
    lastEventAt: null,
    note: DEFAULT_SYNC_NOTE,
    hostRequired: false,
    hostOptional: true,
    saveState: round.status === "completed" ? "synced" : "saved-local",
    pendingActionCount: 0,
    lastLocalSaveAt: round.updatedAt || round.createdAt || Date.now(),
    lastSyncedAt: 0,
    lastSyncError: "",
    conflictStrategy: ROUND_CONFLICT_STRATEGY,
    ...(round.sync || {}),
  };

  round.sync.hostRequired = false;
  round.sync.hostOptional = true;
  round.sync.conflictStrategy = ROUND_CONFLICT_STRATEGY;
  round.sync.pendingActionCount = getRawPendingRoundEvents(round).length;

  if (!round.sync.lastLocalSaveAt) {
    round.sync.lastLocalSaveAt = round.updatedAt || round.createdAt || Date.now();
  }

  if (!round.sync.lastSyncedAt && round.sync.pendingActionCount === 0 && round.status === "completed") {
    round.sync.lastSyncedAt = round.completedAt || round.updatedAt || Date.now();
  }

  return round;
}
function createRoundActionEvent({
  roundId,
  participantId,
  holeNumber,
  patch,
  actorUserId = null,
  deviceId = "local-device",
  actionType,
  occurredAt = Date.now(),
} = {}) {
  const nextPatch = { ...(patch || {}) };

  return {
    id: uid("round-event"),
    roundId,
    participantId,
    holeNumber: Number(holeNumber) || 1,
    patch: nextPatch,
    fields: Object.keys(nextPatch),
    actionType: actionType || detectActionType(nextPatch),
    actorUserId,
    deviceId,
    occurredAt,
    syncState: "pending",
    syncAttempts: 0,
    lastAttemptAt: 0,
    lastError: "",
    syncedAt: 0,
    conflictStrategy: ROUND_CONFLICT_STRATEGY,
  };
}
function appendRoundAction(round, event) {
  ensureRoundSyncScaffold(round);
  round.eventLog.push(event);
  round.sync.pendingActionCount = getRawPendingRoundEvents(round).length;
  round.sync.lastLocalSaveAt = event?.occurredAt || Date.now();
  round.sync.lastEventAt = event?.occurredAt || Date.now();
  round.sync.lastSyncError = "";
  round.sync.saveState = "saved-local";
  round.sync.note = LOCAL_SAVE_NOTE;
  return event;
}
function applyRoundActionEvent(round, event) {
  ensureRoundSyncScaffold(round);

  const hole = round.holes.find((item) => item.number === Number(event?.holeNumber));
  const entry = hole?.entries.find((item) => item.participantId === event?.participantId);
  if (!hole || !entry) {
    return {
      applied: false,
      reason: "missing-entry",
      conflictStrategy: ROUND_CONFLICT_STRATEGY,
    };
  }

  const eventTimestamp = Number(event?.occurredAt) || Date.now();
  const currentTimestamp = Number(entry.updatedAt) || 0;
  if (currentTimestamp && eventTimestamp < currentTimestamp) {
    return {
      applied: false,
      reason: "stale-event",
      conflictStrategy: ROUND_CONFLICT_STRATEGY,
    };
  }

  applyHoleUpdate(round, hole.number, entry.participantId, event.patch || {}, {
    timestamp: eventTimestamp,
    eventId: event.id,
  });

  round.sync.lastEventAt = eventTimestamp;
  round.sync.lastLocalSaveAt = eventTimestamp;
  return {
    applied: true,
    conflictStrategy: ROUND_CONFLICT_STRATEGY,
  };
}
function getPendingRoundEvents(round) {
  ensureRoundSyncScaffold(round);
  return getRawPendingRoundEvents(round);
}
function markRoundEventsSyncing(round, eventIds = [], attemptedAt = Date.now()) {
  ensureRoundSyncScaffold(round);
  const idSet = new Set(eventIds);

  round.eventLog.forEach((event) => {
    if (idSet.has(event.id) && event.syncState !== "synced") {
      event.syncState = "syncing";
      event.syncAttempts = (event.syncAttempts || 0) + 1;
      event.lastAttemptAt = attemptedAt;
      event.lastError = "";
    }
  });

  round.sync.pendingActionCount = getRawPendingRoundEvents(round).length;
  round.sync.saveState = round.sync.pendingActionCount ? "syncing" : "synced";
  round.sync.lastSyncError = "";
  round.sync.note = round.sync.pendingActionCount ? SYNCING_NOTE : SYNCED_NOTE;
}
function markRoundEventsSynced(round, eventIds = [], syncedAt = Date.now()) {
  ensureRoundSyncScaffold(round);
  const idSet = new Set(eventIds);

  round.eventLog.forEach((event) => {
    if (idSet.has(event.id)) {
      event.syncState = "synced";
      event.syncedAt = syncedAt;
      event.lastError = "";
    }
  });

  round.sync.pendingActionCount = getRawPendingRoundEvents(round).length;
  round.sync.lastSyncedAt = syncedAt;
  round.sync.lastSyncError = "";
  round.sync.saveState = round.sync.pendingActionCount ? "saved-local" : "synced";
  round.sync.note = round.sync.pendingActionCount ? LOCAL_SAVE_NOTE : SYNCED_NOTE;
}
function markRoundEventsRetryNeeded(round, eventIds = [], errorMessage = "", attemptedAt = Date.now()) {
  ensureRoundSyncScaffold(round);
  const idSet = new Set(eventIds);

  round.eventLog.forEach((event) => {
    if (idSet.has(event.id) && event.syncState !== "synced") {
      event.syncState = "pending";
      event.lastAttemptAt = attemptedAt;
      event.lastError = errorMessage || "";
    }
  });

  round.sync.pendingActionCount = getRawPendingRoundEvents(round).length;
  round.sync.saveState = round.sync.pendingActionCount ? "retry-needed" : "synced";
  round.sync.lastSyncError = errorMessage || "";
  round.sync.note = round.sync.pendingActionCount
    ? "Live updates are still safe on this device. Cloud backup will retry when the connection stabilizes."
    : SYNCED_NOTE;
}
function workspaceHasPendingRoundSync(workspace) {
  const rounds = workspace?.rounds || [];

  return rounds.some((round) => {
    ensureRoundSyncScaffold(round);
    const pendingCount = getRawPendingRoundEvents(round).length;
    return pendingCount > 0
      || ["syncing", "retry-needed"].includes(round.sync.saveState);
  });
}

// ---- src/state/persistence.js ----
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
function loadPersistedState(createDefaultState) {
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
        spotify: {
          ...(fallback.session?.spotify || {}),
          ...(parsed.session?.spotify || {}),
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
        integrations: {
          ...(fallback.currentUser?.integrations || {}),
          ...(parsed.currentUser?.integrations || {}),
          spotify: {
            ...(fallback.currentUser?.integrations?.spotify || {}),
            ...(parsed.currentUser?.integrations?.spotify || {}),
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
function persistAppState(state) {
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
function persistPlatformState(platform, state) {
  const prepared = platform.data.prepareForPersistence(state);
  platform.data.persist(prepared);
  return prepared;
}
function subscribeStorePersistence({
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
function renderInitialAppState({
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

// ---- src/state/store.js ----
function createStore(initialState) {
  let state = cloneData(initialState);
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(updater, meta = {}) {
    const draft = cloneData(state);
    const nextState = typeof updater === "function" ? updater(draft) || draft : updater;
    state = nextState;
    listeners.forEach((listener) => listener(state, meta));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    getState,
    setState,
    subscribe,
  };
}

// ---- src/state/session-state.js ----
function appendActivity(draft, message, type = "product") {
  draft.social.activity.unshift(
    createActivity({
      type,
      message,
    })
  );
  draft.social.activity = draft.social.activity.slice(0, 16);
}
function setFeedback(draft, tone, title, message) {
  draft.session.feedback = {
    tone,
    title,
    message,
    updatedAt: Date.now(),
  };
  draft.session.pendingLabel = "";
}
function clearFeedback(draft) {
  draft.session.feedback = null;
  draft.session.pendingLabel = "";
}
function getDefaultCloudSyncState() {
  return {
    status: "idle",
    scope: "",
    roundId: null,
    userId: null,
    errorMessage: "",
    lastAttemptAt: 0,
    lastSuccessAt: 0,
    retryCount: 0,
  };
}
function mergeCloudSyncState(current = {}, updates = {}) {
  return {
    ...getDefaultCloudSyncState(),
    ...(current || {}),
    ...(updates || {}),
  };
}
function setCloudSyncState(draft, updates = {}) {
  draft.session.cloudSync = mergeCloudSyncState(draft.session.cloudSync, updates);
}
function resetCloudSyncState(draft) {
  draft.session.cloudSync = mergeCloudSyncState(draft.session.cloudSync, {
    status: "idle",
    scope: "",
    roundId: null,
    userId: null,
    errorMessage: "",
    retryCount: 0,
    lastSuccessAt: Date.now(),
  });
}
function getCloudSyncCopy(scope = "workspace", roundId = null) {
  if (scope === "round-finish") {
    return {
      pendingLabel: "Backing up this round to your golfer account...",
      successTitle: "Round backed up",
      successMessage: "This round is now saved to your Golfers Nation account and will restore after refresh or sign-in.",
      failureTitle: "Round saved on this device",
      failureMessage: "This round is safe on this phone, but cloud backup needs another try before it appears on restored sessions or another device.",
      retryLabel: "Retry round save",
    };
  }

  return {
    pendingLabel: "Saving your latest changes to the cloud...",
    successTitle: "Cloud save complete",
    successMessage: "Your latest account changes are backed up to this golfer.",
    failureTitle: "Saved on this device",
    failureMessage: "Your latest changes are safe on this phone, but cloud backup needs another try.",
    retryLabel: roundId ? "Retry save" : "Retry cloud save",
  };
}
function normalizeUsernameInput(value, fallbackName = "golfer") {
  const source = String(value || "").trim() || fallbackName;
  const base = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
  return base ? `@${base}` : "@golfer";
}
function normalizeAvatarLabel(value, fallbackName = "Golfer") {
  const source = String(value || "").trim().toUpperCase();
  if (source && source.length <= 2 && !source.includes(" ")) {
    return source.slice(0, 2);
  }

  const derived = (source || fallbackName)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  return derived || "GN";
}
function syncIdentityAcrossRecords(draft) {
  draft.rounds.forEach((round) => {
    round.players.forEach((player) => {
      if (player.userId === draft.currentUser.id || player.profileId === draft.currentUser.profileId) {
        player.name = draft.currentUser.name;
        player.displayName = draft.currentUser.displayName;
        player.username = draft.currentUser.username;
        player.avatarLabel = draft.currentUser.avatarLabel;
      }
    });

    round.sides.forEach((side) => {
      side.playerNames = side.playerIds.map((playerId) => {
        const player = round.players.find((item) => item.id === playerId);
        return player ? player.name : "";
      });
    });
  });

  draft.groups.forEach((group) => {
    group.members.forEach((member) => {
      if (member.userId === draft.currentUser.id || member.profileId === draft.currentUser.profileId) {
        member.displayName = draft.currentUser.name;
        member.username = draft.currentUser.username;
        member.avatarLabel = draft.currentUser.avatarLabel;
      }
    });
  });
}

// ---- src/state/round-state.js ----
function findRound(state, roundId) {
  return state.rounds.find((round) => round.id === roundId);
}
function getRoundEventSyncCopy(round, pendingCount = getPendingRoundEvents(round).length) {
  const courseName = round?.courseName || "This round";
  const baseSubject = pendingCount === 1 ? "1 live change" : `${pendingCount} live changes`;

  return {
    pendingLabel: pendingCount ? `Backing up ${baseSubject} from ${courseName}...` : "Checking live round backup...",
    successTitle: "Live round synced",
    successMessage: `${courseName} is backed up and safe to reopen on this golfer account.`,
    failureTitle: "Saved locally",
    failureMessage: pendingCount
      ? `${baseSubject} are safe on this phone, and Golfers Nation will keep retrying when the connection improves.`
      : `${courseName} is still safe on this device, and Golfers Nation will keep retrying when the connection improves.`,
    retryLabel: "Retry live sync",
  };
}
function hasPendingRoundSyncForUser(state, userId = state.auth?.activeUserId || state.currentUser?.id || null) {
  if (!userId) {
    return false;
  }

  return workspaceHasPendingRoundSync({
    rounds: state.rounds,
  });
}
function collectPendingRoundEvents(state, userId = state.auth?.activeUserId || state.currentUser?.id || null) {
  if (!userId) {
    return [];
  }

  return (state.rounds || [])
    .map((round) => ({
      round,
      events: getPendingRoundEvents(round),
    }))
    .filter(({ events }) => events.length)
    .map(({ round, events }) => ({
      roundId: round.id,
      eventIds: events.map((event) => event.id),
      pendingCount: events.length,
      events,
    }));
}
function updateRoundSyncDraft(draft, roundId, updater) {
  const round = findRound(draft, roundId);
  if (!round) {
    return null;
  }

  ensureRoundSyncScaffold(round);
  updater(round);
  return round;
}

function normalizeInviteCode(value = "") {
  return String(value || "").trim().toUpperCase();
}

function createGroupMemberFromPlayer(player, index = 0) {
  return {
    id: `member-${player.id || player.profileId || player.userId || index}`,
    playerId: player.id || null,
    profileId: player.profileId || null,
    userId: player.userId || null,
    displayName: player.displayName || player.name || "Golfer",
    username: player.username || "",
    avatarLabel: player.avatarLabel || "GN",
    role: index === 0 ? "host" : "player",
    connectionState: index === 0 ? "ready" : "connected",
  };
}
function ensureLiveRoundGroupState(draft, round, {
  inviteCode = "",
  sessionId = null,
} = {}) {
  if (!round) {
    return null;
  }

  const normalizedInviteCode = normalizeInviteCode(inviteCode || round.inviteCode);
  const nextGroup = {
    id: sessionId || round.groupId || `group-${round.id}`,
    roundId: round.id,
    title: `${round.courseName} live round`,
    inviteCode: normalizedInviteCode,
    status: "active",
    transport: round.sync?.transport || "cloud",
    hostUserId: round.players?.[0]?.userId || null,
    createdAt: round.createdAt || Date.now(),
    updatedAt: Date.now(),
    hostRequired: false,
    hostOptional: true,
    members: (round.players || []).map((player, index) => createGroupMemberFromPlayer(player, index)),
    feed: [],
  };

  if (normalizedInviteCode) {
    round.inviteCode = normalizedInviteCode;
  }
  round.groupId = nextGroup.id;
  draft.groups.unshift(nextGroup);
  return nextGroup;
}
function resolveLiveRoundSessionEntities(draft, {
  inviteCode = "",
  roundId = null,
  sessionId = null,
  createGroupIfMissing = false,
} = {}) {
  const normalizedInviteCode = normalizeInviteCode(inviteCode);
  let round = roundId ? draft.rounds.find((entry) => entry.id === roundId) || null : null;
  let group = sessionId ? draft.groups.find((entry) => entry.id === sessionId) || null : null;

  if (!group && normalizedInviteCode) {
    group = draft.groups.find((entry) => entry.inviteCode === normalizedInviteCode) || null;
  }

  if (!round && group?.roundId) {
    round = draft.rounds.find((entry) => entry.id === group.roundId) || null;
  }

  if (!round && normalizedInviteCode) {
    round = draft.rounds.find((entry) => entry.inviteCode === normalizedInviteCode) || null;
  }

  if (!group && round) {
    group = draft.groups.find((entry) =>
      entry.roundId === round.id
        || (round.groupId && entry.id === round.groupId)
    ) || null;
  }

  let createdGroup = false;
  if (!group && round && createGroupIfMissing) {
    group = ensureLiveRoundGroupState(draft, round, {
      inviteCode: normalizedInviteCode,
      sessionId,
    });
    createdGroup = Boolean(group);
  }

  if (round && normalizedInviteCode && !round.inviteCode) {
    round.inviteCode = normalizedInviteCode;
  }

  if (group) {
    if (!group.roundId && round?.id) {
      group.roundId = round.id;
    }
    if (normalizedInviteCode && !group.inviteCode) {
      group.inviteCode = normalizedInviteCode;
    }
  }

  if (round && group?.id && !round.groupId) {
    round.groupId = group.id;
  }

  return {
    round,
    group,
    createdGroup,
  };
}
function upsertLiveRoundSessionState(draft, incoming, {
  mergeRound = (existingRound, nextRound) => nextRound,
} = {}) {
  if (!incoming?.round) {
    return {
      round: null,
      group: null,
      roundIndex: -1,
      groupIndex: -1,
    };
  }

  const roundIndex = draft.rounds.findIndex((round) =>
    round.id === incoming.round.id
      || (incoming.inviteCode && round.inviteCode === incoming.inviteCode)
  );
  const existingRound = roundIndex >= 0 ? draft.rounds[roundIndex] : null;
  const nextRound = mergeRound(existingRound, incoming.round);
  const canonicalInviteCode = incoming.inviteCode
    || incoming.group?.inviteCode
    || existingRound?.inviteCode
    || "";
  const canonicalGroupId = incoming.group?.id
    || nextRound.groupId
    || existingRound?.groupId
    || null;

  if (canonicalInviteCode) {
    nextRound.inviteCode = canonicalInviteCode;
  }

  if (canonicalGroupId) {
    nextRound.groupId = canonicalGroupId;
  }

  if (roundIndex >= 0) {
    draft.rounds[roundIndex] = nextRound;
  } else {
    draft.rounds.unshift(nextRound);
  }

  let nextGroup = incoming.group || null;
  let groupIndex = -1;
  if (nextGroup) {
    groupIndex = draft.groups.findIndex((group) =>
      group.id === nextGroup.id
        || group.roundId === nextRound.id
        || (incoming.inviteCode && group.inviteCode === incoming.inviteCode)
    );

    if (groupIndex >= 0) {
      draft.groups[groupIndex] = nextGroup;
      nextGroup = draft.groups[groupIndex];
    } else {
      draft.groups.unshift(nextGroup);
      groupIndex = 0;
    }
  }

  return {
    round: nextRound,
    group: nextGroup,
    roundIndex,
    groupIndex,
  };
}
function getNextIncompleteHoleNumber(round, participantId, currentHoleNumber) {
  const orderedHoles = round.holes
    .slice(currentHoleNumber)
    .concat(round.holes.slice(0, currentHoleNumber));
  const nextHole = orderedHoles.find((hole) => {
    const entry = hole.entries.find((item) => item.participantId === participantId);
    return entry && (entry.strokes === null || entry.strokes === 0);
  });

  return nextHole ? nextHole.number : currentHoleNumber;
}
function finishRound(draft, roundId, dataGateway, setActiveView) {
  const round = draft.rounds.find((item) => item.id === roundId);
  if (!round) {
    return null;
  }

  const progress = round.holes.filter((hole) => hole.entries.some((entry) => entry.strokes && entry.strokes > 0)).length;
  if (!progress) {
    setFeedback(
      draft,
      "info",
      "Score at least one hole",
      "Enter a score before finishing so the round summary and stats have something real to save."
    );
    return null;
  }

  round.status = "completed";
  round.completedAt = Date.now();
  round.updatedAt = Date.now();
  draft.session.summaryRoundId = round.id;
  appendActivity(draft, `${round.courseName} was finished and moved into round history.`, "round");
  setFeedback(
    draft,
    "info",
    "Round finished",
    `${round.courseName} was added to ${draft.currentUser.displayName}'s history on this device. Cloud backup is finishing now.`
  );
  draft.session.activeRoundId = null;
  draft.session.selectedHole = 1;
  draft.session.selectedProfileId = draft.currentUser.profileId;
  setActiveView(draft, "stats", "tab");
  refreshProfileSnapshots(draft);
  syncCurrentUserProfile(draft);
  dataGateway.saveWorkspace(draft, draft.currentUser.id);
  return round.id;
}

// ---- src/services/storage-service.js ----
// Backward-compatible wrapper: the canonical persistence path now lives in
// src/state/persistence.js, but tests and older callers still import here.
function loadStoredState(createDefaultState) {
  return loadPersistedState(createDefaultState);
}
function persistState(state) {
  return persistAppState(state);
}

// ---- src/integrations/spotify-service.js ----
const SPOTIFY_WEB_URL = "https://open.spotify.com/";

const SPOTIFY_PREVIEW_QUEUE = [
  {
    id: "golden-hour-drive",
    title: "Golden Hour Drive",
    artist: "Fairway Echoes",
    album: "Late Tee Time",
    artworkLabel: "GH",
    artworkVariant: "forest",
    webUrl: SPOTIFY_WEB_URL,
    deepLink: "spotify://",
  },
  {
    id: "lake-charles-loop",
    title: "Lake Charles Loop",
    artist: "Pin High FM",
    album: "Local Fairways",
    artworkLabel: "LC",
    artworkVariant: "ocean",
    webUrl: SPOTIFY_WEB_URL,
    deepLink: "spotify://",
  },
  {
    id: "clubhouse-close",
    title: "Clubhouse Close",
    artist: "The Scorecards",
    album: "After the 18th",
    artworkLabel: "CC",
    artworkVariant: "sand",
    webUrl: SPOTIFY_WEB_URL,
    deepLink: "spotify://",
  },
];

function getPreviewTrackAtIndex(index = 0) {
  const safeIndex = Number.isInteger(index) ? index : 0;
  const normalizedIndex = ((safeIndex % SPOTIFY_PREVIEW_QUEUE.length) + SPOTIFY_PREVIEW_QUEUE.length) % SPOTIFY_PREVIEW_QUEUE.length;
  return {
    queueIndex: normalizedIndex,
    track: cloneData(SPOTIFY_PREVIEW_QUEUE[normalizedIndex]),
  };
}

function normalizeSpotifyTrack(track = null, fallbackIndex = 0) {
  if (!track) {
    return null;
  }

  const defaultTrack = getPreviewTrackAtIndex(fallbackIndex).track;
  return {
    id: String(track.id || defaultTrack.id),
    title: String(track.title || defaultTrack.title),
    artist: String(track.artist || defaultTrack.artist),
    album: String(track.album || defaultTrack.album),
    artworkLabel: String(track.artworkLabel || defaultTrack.artworkLabel || "SP").slice(0, 2).toUpperCase(),
    artworkVariant: String(track.artworkVariant || defaultTrack.artworkVariant || "forest"),
    webUrl: String(track.webUrl || defaultTrack.webUrl || SPOTIFY_WEB_URL),
    deepLink: String(track.deepLink || defaultTrack.deepLink || "spotify://"),
  };
}
function createSpotifyIntegrationState(overrides = {}) {
  const queueIndex = Number.isInteger(overrides.queueIndex) ? overrides.queueIndex : 0;
  const connected = overrides.status === "connected";
  const fallbackTrack = connected ? getPreviewTrackAtIndex(queueIndex).track : null;
  const nowPlaying = normalizeSpotifyTrack(
    overrides.nowPlaying || fallbackTrack,
    queueIndex
  );
  const playbackState = overrides.playbackState === "playing"
    ? "playing"
    : connected && overrides.playbackState === "paused"
      ? "paused"
      : connected
        ? "playing"
        : "idle";

  return {
    status: connected ? "connected" : "disconnected",
    previewMode: overrides.previewMode !== false,
    controlsEnabled: connected ? overrides.controlsEnabled !== false : false,
    accountLabel: String(overrides.accountLabel || ""),
    deviceName: String(overrides.deviceName || ""),
    lastConnectedAt: overrides.lastConnectedAt || null,
    lastError: String(overrides.lastError || ""),
    queueIndex,
    playbackState,
    showOnRoundScreen: overrides.showOnRoundScreen !== false,
    nowPlaying,
  };
}
function createSpotifySessionState(overrides = {}) {
  return {
    barCollapsed: overrides.barCollapsed === true,
    lastAction: String(overrides.lastAction || ""),
    lastUpdatedAt: overrides.lastUpdatedAt || 0,
  };
}
function createIntegrationSettings(overrides = {}) {
  const next = cloneData(overrides || {});
  return {
    spotify: createSpotifyIntegrationState(next.spotify || {}),
  };
}
function getSpotifyIntegration(stateOrUser = {}) {
  const source = stateOrUser?.currentUser ? stateOrUser.currentUser : stateOrUser;
  return createSpotifyIntegrationState(source?.integrations?.spotify || {});
}
function getSpotifySession(state = {}) {
  return createSpotifySessionState(state?.session?.spotify || {});
}
function isSpotifyConnected(state = {}) {
  return getSpotifyIntegration(state).status === "connected";
}
function getSpotifyOpenTarget(spotifyState = null) {
  const spotify = createSpotifyIntegrationState(spotifyState || {});
  return {
    deepLink: spotify.nowPlaying?.deepLink || "spotify://",
    webUrl: spotify.nowPlaying?.webUrl || SPOTIFY_WEB_URL,
  };
}
function connectSpotifyCompanion(current = {}, options = {}) {
  const queueIndex = Number.isInteger(current?.queueIndex) ? current.queueIndex : 0;
  const previewTrack = getPreviewTrackAtIndex(queueIndex).track;
  return createSpotifyIntegrationState({
    ...current,
    status: "connected",
    previewMode: true,
    controlsEnabled: true,
    queueIndex,
    accountLabel: options.accountLabel || current?.accountLabel || "",
    deviceName: options.deviceName || current?.deviceName || "This phone",
    lastConnectedAt: Date.now(),
    lastError: "",
    playbackState: current?.playbackState === "paused" ? "paused" : "playing",
    nowPlaying: current?.nowPlaying || previewTrack,
  });
}
function disconnectSpotifyCompanion(current = {}) {
  return createSpotifyIntegrationState({
    ...current,
    status: "disconnected",
    controlsEnabled: false,
    playbackState: "idle",
    nowPlaying: null,
    lastError: "",
  });
}
function toggleSpotifyPlayback(current = {}) {
  const spotify = createSpotifyIntegrationState(current);
  if (spotify.status !== "connected" || !spotify.controlsEnabled) {
    return spotify;
  }

  return createSpotifyIntegrationState({
    ...spotify,
    playbackState: spotify.playbackState === "playing" ? "paused" : "playing",
  });
}
function stepSpotifyQueue(current = {}, direction = 1) {
  const spotify = createSpotifyIntegrationState(current);
  if (spotify.status !== "connected" || !spotify.controlsEnabled) {
    return spotify;
  }

  const nextIndex = spotify.queueIndex + (direction >= 0 ? 1 : -1);
  const previewTrack = getPreviewTrackAtIndex(nextIndex);
  return createSpotifyIntegrationState({
    ...spotify,
    queueIndex: previewTrack.queueIndex,
    nowPlaying: previewTrack.track,
    playbackState: "playing",
  });
}
function getSpotifyConnectionSummary(spotifyState = null) {
  const spotify = createSpotifyIntegrationState(spotifyState || {});
  if (spotify.status !== "connected") {
    return {
      statusLabel: "Disconnected",
      title: "Connect Spotify",
      message: "Connect Spotify to unlock a compact Now Playing bar and quick playback actions inside Golfers Nation.",
      detail: "This first pass is a companion control scaffold only. Real Spotify OAuth, device selection, and playback transfer come next.",
    };
  }

  return {
    statusLabel: spotify.previewMode ? "Connected preview" : "Connected",
    title: spotify.playbackState === "playing" ? "Now playing in the companion bar" : "Playback ready in the companion bar",
    message: `${spotify.nowPlaying?.title || "Spotify"} / ${spotify.nowPlaying?.artist || "Connected account"} / ${spotify.deviceName || "This phone"}`,
    detail: spotify.previewMode
      ? "This scaffold preview proves the mobile control flow. Full Spotify auth, playback SDK support, and device handoff can be layered in later."
      : "Spotify is connected and ready for lightweight in-app controls.",
  };
}

// ---- src/services/account-service.js ----
const DEFAULT_PASSWORD = "fairway123";

function normalizeUsername(value) {
  const base = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16);
  return base ? `@${base}` : "@golfer";
}

function avatarFromName(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "GN";
}

function createSubscription(tier = "free") {
  return {
    tier,
    planName: tier === "premium" ? "Premium" : "Free",
    status: "active",
    billingReady: true,
    renewalAt: null,
    trialAvailable: tier !== "premium",
  };
}

function createPrivacySettings(overrides = {}) {
  return {
    showHomeCourse: true,
    showHandicap: true,
    showBio: true,
    showRecentForm: true,
    showHeadToHead: false,
    showEmail: false,
    profileVisibility: "friends",
    ...cloneData(overrides || {}),
  };
}

function createAppearanceSettings(overrides = {}) {
  return {
    colorMode: "system",
    themeId: "forest",
    textScale: "standard",
    compactMode: false,
    contrastMode: "standard",
    ...cloneData(overrides || {}),
  };
}

function createSocialSettings(overrides = {}) {
  const next = cloneData(overrides || {});
  return {
    handles: {
      instagram: "",
      x: "",
      ghin: "",
      ...(next.handles || {}),
    },
    allowFriendConnections: true,
    allowProfileSharing: true,
    allowRoundSharing: true,
    inviteFriendsReady: true,
    ...next,
  };
}

function createIntegrationsState(overrides = {}) {
  return createIntegrationSettings(overrides || {});
}

function formatRecentFormLabel(result) {
  if (!result) {
    return "First round pending";
  }

  return `${result.courseName} ${result.toPar > 0 ? `+${result.toPar}` : result.toPar}`;
}

function createDefaultRoundSetup() {
  const featuredCourse = findCourseById(FEATURED_COURSE_ID);
  const defaultTeeBox = featuredCourse ? getDefaultTeeBox(featuredCourse) : null;

  return {
    courseQuery: "",
    selectedCourseId: featuredCourse?.id || "",
    selectedTeeBoxId: defaultTeeBox?.id || "",
  };
}

function buildAccountSummary(account, workspace) {
  const completedRounds = (workspace?.rounds || [])
    .filter((round) => round.status === "completed")
    .map((round) => {
      const participant = round.players.find((entry) => entry.userId === account.id || entry.profileId === account.profileId);
      if (!participant) {
        return null;
      }

      const totals = getParticipantTotals(round, participant.id);
      if (!totals.holesPlayed) {
        return null;
      }

      return {
        courseName: round.courseName,
        completedAt: round.completedAt || round.updatedAt || round.createdAt,
        totalStrokes: totals.totalStrokes,
        toPar: totals.toPar,
      };
    })
    .filter(Boolean)
    .sort((left, right) => (right.completedAt || 0) - (left.completedAt || 0));

  return {
    roundsPlayed: completedRounds.length,
    averageScore: average(completedRounds.map((entry) => entry.totalStrokes)),
    bestRound: completedRounds.length ? Math.min(...completedRounds.map((entry) => entry.totalStrokes)) : null,
    recentFormSummary: formatRecentFormLabel(completedRounds[0] || null),
  };
}

function syncAccountSummary(account, workspace) {
  const summary = buildAccountSummary(account, workspace);
  account.roundsPlayed = summary.roundsPlayed;
  account.averageScore = summary.averageScore;
  account.bestRound = summary.bestRound;
  account.recentFormSummary = summary.recentFormSummary;
  return summary;
}

function createSeedProfile(overrides) {
  const profile = createPlayerProfile(overrides);
  if (overrides?.id) {
    profile.id = overrides.id;
  }
  return profile;
}

function profilePlayer(profile) {
  return {
    profileId: profile.id,
    userId: profile.userId,
    displayName: profile.publicProfile.displayName,
    username: profile.publicProfile.username,
    avatarLabel: profile.publicProfile.avatarLabel,
  };
}

function createSelfProfile(account) {
  return createSeedProfile({
    id: account.profileId,
    userId: account.id,
    displayName: account.displayName,
    username: account.username,
    avatarLabel: account.avatarLabel,
    email: account.email,
    homeCourse: account.homeCourse,
    handicap: account.handicap,
    bio: account.bio,
    createdAt: account.createdAt,
    premiumStatus: account.subscription.tier,
    privacy: createPrivacySettings(account.privacy),
  });
}

function createPeerProfiles() {
  return [
    createSeedProfile({
      id: "profile-maya",
      displayName: "Maya Chen",
      username: "@mayachen",
      avatarLabel: "MC",
      homeCourse: "National Pines",
      handicap: 5.2,
      bio: "Strong iron player and dependable weekend match partner.",
      publicStats: {
        roundsPlayed: 14,
        averageScore: 78.9,
        bestRound: 74,
        recentFormSummary: "Two top rounds in the last three cards",
      },
    }),
    createSeedProfile({
      id: "profile-theo",
      displayName: "Theo Grant",
      username: "@theogrant",
      avatarLabel: "TG",
      homeCourse: "Shadow Ridge",
      handicap: 9.8,
      bio: "Steady fairway finder with a strong closing stretch.",
      publicStats: {
        roundsPlayed: 11,
        averageScore: 82.3,
        bestRound: 77,
        recentFormSummary: "Trending steady across the last two weeks",
      },
    }),
    createSeedProfile({
      id: "profile-jordan",
      displayName: "Jordan Wells",
      username: "@jordanwells",
      avatarLabel: "JW",
      homeCourse: "Prairie Lake",
      handicap: 7.1,
      bio: "Competitive group golfer who loves live leaderboards.",
      publicStats: {
        roundsPlayed: 9,
        averageScore: 79.8,
        bestRound: 75,
        recentFormSummary: "Fresh off a strong scramble weekend",
      },
    }),
  ];
}

function seedRoundPerformance(round, participantId, adjustments) {
  round.holes.forEach((hole, index) => {
    const delta = adjustments[index];
    const strokes = hole.par + delta;
    const gir = delta <= 0;
    const fairwayHit = hole.par > 3 ? delta <= 0 : false;
    const penalties = delta > 0 && hole.par > 3 && index % 5 === 0 ? 1 : 0;
    const upAndDown = !gir && (delta <= 0 || index % 4 === 0);
    const sandSave = upAndDown && !gir && hole.par !== 5 && index % 6 === 0;

    applyHoleUpdate(round, hole.number, participantId, {
      strokes,
      putts: Math.max(1, Math.min(3, 2 + Math.sign(delta))),
      penalties,
      fairwayHit,
      gir,
      upAndDown: sandSave ? true : upAndDown,
      sandSave,
    });
  });
}

function createCompletedSeedRound({ currentUser, courseName, weather, mode, players, localAdjustments, remotePatterns }) {
  const round = createRound({
    currentUser,
    courseName,
    teeBox: "Blue",
    weather,
    mode,
    players,
    status: "completed",
  });

  const participants = round.mode === "stroke" ? round.players : round.sides;
  participants.forEach((participant, index) => {
    const adjustments = index === 0 ? localAdjustments : remotePatterns[(index - 1) % remotePatterns.length];
    seedRoundPerformance(round, participant.id, adjustments);
  });
  round.completedAt = Date.now() - 1000 * 60 * 60 * (participants.length + 12);
  round.updatedAt = round.completedAt;
  return round;
}

function createSeededWorkspace(account, options = {}) {
  const profiles = [createSelfProfile(account), ...createPeerProfiles()];
  const premiumMode = options.premiumMode || "stroke";
  const activeRound = createRound({
    currentUser: account,
    courseName: premiumMode === "stroke" ? "National Pines" : "North Point",
    teeBox: "Blue",
    weather: premiumMode === "stroke" ? "Windy 68F" : "Clear 70F",
    mode: premiumMode,
    players: premiumMode === "scramble"
      ? [profiles[0], profiles[3], profiles[1], profiles[2]].map(profilePlayer)
      : profiles.map(profilePlayer),
  });

  const completedStroke = createCompletedSeedRound({
    currentUser: account,
    courseName: "Shadow Ridge",
    weather: "Clear 72F",
    mode: "stroke",
    players: profiles.slice(0, 3).map(profilePlayer),
    localAdjustments: [0, -1, 0, 1, 0, -1, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0, -1, 0],
    remotePatterns: [
      [1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 0, 0, 1, 0, 0, 1, -1, 0],
      [0, 0, 1, 0, 0, -1, 0, 1, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0],
    ],
  });

  const completedScramble = createCompletedSeedRound({
    currentUser: account,
    courseName: "Prairie Lake",
    weather: "Warm 76F",
    mode: "scramble",
    players: [profiles[0], profiles[3], profiles[1], profiles[2]].map(profilePlayer),
    localAdjustments: [0, -1, -1, 0, 0, -1, 0, 0, -1, 0, -1, 0, 0, 0, -1, 0, -1, 0],
    remotePatterns: [[1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]],
  });

  return {
    profiles,
    rounds: [activeRound, completedStroke, completedScramble],
    groups: [],
    tournaments: [
      createTournament({
        name: "Great Lakes Weekend Cup",
        courseName: "National Pines",
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 8).toISOString(),
        mode: "stroke",
        fieldSize: 24,
        status: "open",
      }),
      createTournament({
        name: "Twilight Match Series",
        courseName: "North Point",
        date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
        mode: account.subscription.tier === "premium" ? "match" : "stroke",
        fieldSize: 8,
        status: "planning",
      }),
    ],
    gear: {
      items: [
        createGearItem({ category: "club", name: "TSR3 Driver", notes: "Trusted fairway finder", packed: true }),
        createGearItem({ category: "club", name: "56 Degree Wedge", notes: "Preferred bunker club", packed: true }),
        createGearItem({ category: "apparel", name: "Wind shell", notes: "Use for gusty afternoon rounds", packed: false, weatherUse: "wind" }),
        createGearItem({ category: "accessory", name: "Rangefinder", notes: "Battery charged", packed: true }),
      ],
    },
    social: {
      activity: [
        createActivity({
          type: "profile",
          message: `${account.displayName}'s account is linked to profile, stats, and round history.`,
        }),
        createActivity({
          type: "sync",
          message: "Invite code and offline-first sync are the primary phase-1 multiplayer path.",
        }),
        createActivity({
          type: "premium",
          message: account.subscription.tier === "premium"
            ? "Premium account access is active for advanced modes, stats, and tournament tools."
            : "Free account access is active. Premium tools stay cleanly locked until upgrade.",
        }),
      ],
    },
    userSession: {
      activeRoundId: activeRound.id,
      selectedHole: 1,
      summaryRoundId: completedStroke.id,
      selectedProfileId: account.profileId,
      roundSetup: createDefaultRoundSetup(),
    },
  };
}
function createEmptyWorkspace(account) {
  const selfProfile = createSelfProfile(account);

  return {
    profiles: [selfProfile],
    rounds: [],
    groups: [],
    tournaments: [],
    gear: { items: [] },
    social: {
      activity: [
        createActivity({
          type: "profile",
          message: `${account.displayName} created a Golfers Nation account.`,
        }),
      ],
    },
    userSession: {
      activeRoundId: null,
      selectedHole: 1,
      summaryRoundId: null,
      selectedProfileId: account.profileId,
      roundSetup: createDefaultRoundSetup(),
    },
  };
}

function moveAccountVaultEntry(draft, previousId, nextId) {
  if (!draft.accountVault?.[previousId] || previousId === nextId) {
    return;
  }

  draft.accountVault[nextId] = draft.accountVault[previousId];
  delete draft.accountVault[previousId];
}

function remapWorkspaceIdentity(workspace, previousId, nextAccount) {
  if (!workspace || previousId === nextAccount.id) {
    return;
  }

  const previousProfileId = `profile-${String(previousId).replace(/^user-/, "")}`;
  const nextProfileId = nextAccount.profileId;
  const nextName = nextAccount.displayName;
  const nextUsername = nextAccount.username;
  const nextAvatarLabel = nextAccount.avatarLabel;

  (workspace.profiles || []).forEach((profile) => {
    if (profile.userId === previousId || profile.id === previousProfileId) {
      profile.userId = nextAccount.id;
      profile.id = nextProfileId;
      profile.publicProfile = {
        ...(profile.publicProfile || {}),
        displayName: nextName,
        username: nextUsername,
        avatarLabel: nextAvatarLabel,
      };
    }
  });

  (workspace.rounds || []).forEach((round) => {
    (round.players || []).forEach((player) => {
      if (player.userId === previousId || player.profileId === previousProfileId) {
        player.userId = nextAccount.id;
        player.profileId = nextProfileId;
        player.name = nextName;
        player.displayName = nextName;
        player.username = nextUsername;
        player.avatarLabel = nextAvatarLabel;
      }
    });
  });

  (workspace.groups || []).forEach((group) => {
    (group.members || []).forEach((member) => {
      if (member.userId === previousId || member.profileId === previousProfileId) {
        member.userId = nextAccount.id;
        member.profileId = nextProfileId;
        member.displayName = nextName;
        member.username = nextUsername;
        member.avatarLabel = nextAvatarLabel;
      }
    });
  });

  if (workspace.userSession?.selectedProfileId === previousProfileId) {
    workspace.userSession.selectedProfileId = nextProfileId;
  }
}

function sanitizeCurrentUser(account) {
  return {
    id: account.id,
    name: account.name,
    displayName: account.displayName,
    username: account.username,
    profileId: account.profileId,
    avatarLabel: account.avatarLabel,
    avatar: account.avatarLabel,
    avatarUrl: account.avatarUrl || "",
    email: account.email,
    provider: account.provider,
    providerType: account.provider,
    homeCourse: account.homeCourse,
    handicap: account.handicap,
    handedness: account.handedness || "",
    bio: account.bio,
    seasonGoal: account.seasonGoal,
    city: account.city,
    createdAt: account.createdAt,
    premiumStatus: account.subscription.tier,
    privacy: createPrivacySettings(account.privacy),
    appearance: createAppearanceSettings(account.appearance),
    social: createSocialSettings(account.social),
    integrations: createIntegrationsState(account.integrations),
    seededDemo: Boolean(account.seededDemo),
    subscription: cloneData(account.subscription),
    roundsPlayed: account.roundsPlayed || 0,
    averageScore: account.averageScore ?? null,
    bestRound: account.bestRound ?? null,
    recentFormSummary: account.recentFormSummary || "First round pending",
  };
}

function mergeCurrentUserIntoAccount(account, currentUser, auth) {
  account.name = currentUser.name;
  account.displayName = currentUser.displayName || currentUser.name;
  account.username = currentUser.username;
  account.profileId = currentUser.profileId;
  account.avatarLabel = currentUser.avatarLabel;
  account.avatarUrl = currentUser.avatarUrl || account.avatarUrl || "";
  account.email = currentUser.email;
  account.provider = currentUser.provider || currentUser.providerType || auth?.provider || account.provider;
  account.homeCourse = currentUser.homeCourse;
  account.handicap = currentUser.handicap;
  account.handedness = currentUser.handedness || "";
  account.bio = currentUser.bio;
  account.seasonGoal = currentUser.seasonGoal;
  account.city = currentUser.city;
  account.createdAt = currentUser.createdAt;
  account.privacy = createPrivacySettings(currentUser.privacy || {});
  account.appearance = createAppearanceSettings(currentUser.appearance || account.appearance);
  account.social = createSocialSettings(currentUser.social || account.social);
  account.integrations = createIntegrationsState(currentUser.integrations || account.integrations);
  account.subscription = cloneData(currentUser.subscription || account.subscription);
  account.premiumStatus = account.subscription.tier;
  account.roundsPlayed = currentUser.roundsPlayed ?? account.roundsPlayed ?? 0;
  account.averageScore = currentUser.averageScore ?? account.averageScore ?? null;
  account.bestRound = currentUser.bestRound ?? account.bestRound ?? null;
  account.recentFormSummary = currentUser.recentFormSummary || account.recentFormSummary || "First round pending";
}

function getUserSession(state) {
  return {
    activeRoundId: state.session.activeRoundId || null,
    selectedHole: state.session.selectedHole || 1,
    summaryRoundId: state.session.summaryRoundId || null,
    selectedProfileId: state.session.selectedProfileId || state.currentUser?.profileId || null,
    roundSetup: {
      courseQuery: state.session.roundSetup?.courseQuery || "",
      selectedCourseId: state.session.roundSetup?.selectedCourseId || "",
      selectedTeeBoxId: state.session.roundSetup?.selectedTeeBoxId || "",
    },
  };
}
function createAccountRecord({
  id,
  displayName,
  email,
  password = DEFAULT_PASSWORD,
  provider = "email",
  tier = "free",
  seededDemo = false,
  city = "Chicago, IL",
  homeCourse = "",
  handicap = null,
  handedness = "",
  bio = "",
  seasonGoal = "Track better golf all season",
  createdAt = Date.now(),
  appearance = {},
  social = {},
  integrations = {},
}) {
  const safeDisplayName = String(displayName || "").trim() || "Golfer";
  const username = normalizeUsername(safeDisplayName);
  const avatarLabel = avatarFromName(safeDisplayName);
  const safeId = id || `user-${username.replace("@", "")}-${Date.now().toString(36)}`;

  return {
    id: safeId,
    name: safeDisplayName,
    displayName: safeDisplayName,
    username,
    profileId: `profile-${safeId.replace(/^user-/, "")}`,
    avatarLabel,
    avatarUrl: "",
    email: String(email || "").trim().toLowerCase(),
    password,
    provider,
    providerType: provider,
    seededDemo,
    city,
    homeCourse,
    handicap,
    handedness,
    bio,
    seasonGoal,
    createdAt,
    privacy: createPrivacySettings(),
    appearance: createAppearanceSettings(appearance),
    social: createSocialSettings(social),
    integrations: createIntegrationsState(integrations),
    subscription: createSubscription(tier),
    premiumStatus: tier,
    roundsPlayed: 0,
    averageScore: null,
    bestRound: null,
    recentFormSummary: "First round pending",
  };
}
function ensureAccountWorkspace(draft, userId) {
  const account = draft.accounts?.find((entry) => entry.id === userId);
  if (!account) {
    return null;
  }

  if (!draft.accountVault?.[userId]) {
    draft.accountVault = {
      ...(draft.accountVault || {}),
      [userId]: createEmptyWorkspace(account),
    };
  }

  syncAccountSummary(account, draft.accountVault[userId]);
  return draft.accountVault[userId];
}
function replaceAccountWorkspace(draft, userId, workspace = null) {
  const account = draft.accounts?.find((entry) => entry.id === userId);
  if (!account) {
    return null;
  }

  const fallback = createEmptyWorkspace(account);
  draft.accountVault = {
    ...(draft.accountVault || {}),
    [userId]: {
      profiles: cloneData(workspace?.profiles || fallback.profiles),
      rounds: cloneData(workspace?.rounds || fallback.rounds),
      groups: cloneData(workspace?.groups || fallback.groups),
      tournaments: cloneData(workspace?.tournaments || fallback.tournaments),
      gear: cloneData(workspace?.gear || fallback.gear),
      social: cloneData(workspace?.social || fallback.social),
      userSession: {
        ...fallback.userSession,
        ...(workspace?.userSession || {}),
        roundSetup: {
          ...fallback.userSession.roundSetup,
          ...(workspace?.userSession?.roundSetup || {}),
        },
      },
    },
  };

  syncAccountSummary(account, draft.accountVault[userId]);
  return draft.accountVault[userId];
}
function upsertRemoteAccount(draft, fields = {}) {
  const nextEmail = String(fields.email || "").trim().toLowerCase();
  if (!nextEmail || !fields.id) {
    return null;
  }

  let account = draft.accounts?.find((entry) => entry.id === fields.id)
    || draft.accounts?.find((entry) => !entry.seededDemo && entry.email === nextEmail)
    || null;

  const previousId = account?.id || null;
  const nextDisplayName = String(fields.displayName || "").trim() || account?.displayName || "Golfer";
  const nextProvider = String(fields.provider || account?.provider || "email");
  const nextCreatedAt = fields.createdAt || account?.createdAt || Date.now();
  const nextTier = fields.tier || account?.subscription?.tier || TESTER_DEFAULT_SUBSCRIPTION_TIER;

  if (!account) {
    account = createAccountRecord({
      id: fields.id,
      displayName: nextDisplayName,
      email: nextEmail,
      password: "",
      provider: nextProvider,
      tier: nextTier,
      seededDemo: false,
      city: fields.city || "",
      homeCourse: fields.homeCourse || "",
      handicap: typeof fields.handicap === "number" ? fields.handicap : null,
      handedness: fields.handedness || "",
      bio: fields.bio || "",
      seasonGoal: fields.seasonGoal || "Finish your first round",
      createdAt: nextCreatedAt,
      appearance: fields.appearance || {},
      social: fields.social || {},
      integrations: fields.integrations || {},
    });
    draft.accounts.push(account);
  } else {
    account.id = fields.id;
    account.name = nextDisplayName;
    account.displayName = nextDisplayName;
    account.email = nextEmail;
    account.provider = nextProvider;
    account.providerType = nextProvider;
    account.avatarLabel = fields.avatarLabel || avatarFromName(nextDisplayName);
    account.avatarUrl = fields.avatarUrl || account.avatarUrl || "";
    account.homeCourse = fields.homeCourse ?? account.homeCourse ?? "";
    account.handicap = typeof fields.handicap === "number" ? fields.handicap : account.handicap ?? null;
    account.handedness = fields.handedness ?? account.handedness ?? "";
    account.bio = fields.bio ?? account.bio ?? "";
    account.city = fields.city ?? account.city ?? "";
    account.seasonGoal = fields.seasonGoal ?? account.seasonGoal ?? "Finish your first round";
    account.createdAt = nextCreatedAt;
    account.appearance = createAppearanceSettings(fields.appearance || account.appearance);
    account.social = createSocialSettings(fields.social || account.social);
    account.integrations = createIntegrationsState(fields.integrations || account.integrations);
    account.privacy = createPrivacySettings(fields.privacy || account.privacy);
    account.subscription = createSubscription(nextTier);
    account.premiumStatus = nextTier;
    account.seededDemo = false;
  }

  account.profileId = `profile-${String(account.id).replace(/^user-/, "")}`;
  account.username = fields.username || normalizeUsername(nextDisplayName);
  account.avatarLabel = fields.avatarLabel || account.avatarLabel || avatarFromName(nextDisplayName);

  if (previousId && previousId !== account.id) {
    moveAccountVaultEntry(draft, previousId, account.id);
    remapWorkspaceIdentity(draft.accountVault?.[account.id], previousId, account);
    if (draft.previewAccountId === previousId) {
      draft.previewAccountId = account.id;
    }
  }

  ensureAccountWorkspace(draft, account.id);
  return account;
}
function createDefaultAccountState() {
  const freeDemo = createAccountRecord({
    id: "user-demo-free",
    displayName: "Avery Brooks",
    email: "free@golfersnation.demo",
    password: DEFAULT_PASSWORD,
    provider: "email",
    tier: "free",
    seededDemo: true,
    city: "Chicago, IL",
    homeCourse: "Whispering Pines",
    handicap: 8.4,
    bio: "Competitive weekend golfer building a better multi-state season.",
    seasonGoal: "Break 80 in three new states",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 160,
  });

  const premiumDemo = createAccountRecord({
    id: "user-demo-premium",
    displayName: "Maya Chen",
    email: "premium@golfersnation.demo",
    password: DEFAULT_PASSWORD,
    provider: "email",
    tier: "premium",
    seededDemo: true,
    city: "Seattle, WA",
    homeCourse: "National Pines",
    handicap: 5.2,
    bio: "Competitive player using premium analytics and live group tools.",
    seasonGoal: "Win three weekend events this season",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 220,
  });

  const googleDemo = createAccountRecord({
    id: "user-google-review",
    displayName: "Riley Stone",
    email: "google@golfersnation.demo",
    password: "",
    provider: "google",
    tier: "free",
    seededDemo: true,
    city: "Austin, TX",
    homeCourse: "Blue River",
    handicap: 10.1,
    bio: "Google mock sign-in account for review flows.",
  });

  const appleDemo = createAccountRecord({
    id: "user-apple-review",
    displayName: "Parker Cole",
    email: "apple@golfersnation.demo",
    password: "",
    provider: "apple",
    tier: "premium",
    seededDemo: true,
    city: "Scottsdale, AZ",
    homeCourse: "North Point",
    handicap: 6.8,
    bio: "Apple mock sign-in account with premium access for review flows.",
  });

  const accounts = [freeDemo, premiumDemo, googleDemo, appleDemo];
  const accountVault = {
    [freeDemo.id]: createSeededWorkspace(freeDemo),
    [premiumDemo.id]: createSeededWorkspace(premiumDemo, { premiumMode: "scramble" }),
    [googleDemo.id]: createEmptyWorkspace(googleDemo),
    [appleDemo.id]: createSeededWorkspace(appleDemo, { premiumMode: "match" }),
  };

  accounts.forEach((account) => {
    syncAccountSummary(account, accountVault[account.id]);
  });

  return {
    accounts,
    accountVault,
    activeAccountId: null,
    previewAccountId: freeDemo.id,
  };
}
function prepareStateForPersistence(state) {
  const snapshot = cloneData(state);
  const userId = snapshot.auth?.activeUserId || snapshot.currentUser?.id || null;

  if (snapshot.session) {
    snapshot.session.feedback = null;
    snapshot.session.pendingLabel = "";
    snapshot.session.lastScoredParticipantId = null;
    snapshot.session.lastScoredHole = null;
    snapshot.session.lastScorePulseAt = 0;
  }

  if (!userId) {
    return snapshot;
  }

  saveWorkspaceToVault(snapshot, userId);
  return snapshot;
}
function hydrateActiveAccountState(state) {
  const next = cloneData(state);
  const activeUserId = next.auth?.activeUserId;

  if (!activeUserId) {
    return next;
  }

  const restored = loadAccountIntoState(next, activeUserId);
  if (restored) {
    const activeRound = next.rounds?.find((round) => round.id === next.session?.activeRoundId) || null;
    if (activeRound?.status === "active") {
      next.session.activeView = "round";
      next.session.previousView = "round";
      next.session.transitionDirection = "steady";
      const pendingCount = getPendingRoundEvents(activeRound).length;
      next.session.feedback = {
        tone: pendingCount || activeRound.sync?.saveState === "retry-needed" ? "warning" : "info",
        title: pendingCount || activeRound.sync?.saveState === "retry-needed" ? "Round restored / local copy safe" : "Round restored",
        message: pendingCount
          ? `${activeRound.courseName} reopened from this device with ${pendingCount === 1 ? "1 local change" : `${pendingCount} local changes`} still waiting on cloud backup.`
          : `${activeRound.courseName} reopened from this device and is ready for scoring.`,
        updatedAt: Date.now(),
      };
    }
    return next;
  }

  const previewAccountId = next.previewAccountId || next.accounts?.[0]?.id || null;
  const previewAccount = next.accounts?.find((entry) => entry.id === previewAccountId) || null;
  const previewWorkspace = previewAccount ? next.accountVault?.[previewAccount.id] : null;

  if (previewAccount && previewWorkspace) {
    syncAccountSummary(previewAccount, previewWorkspace);
    next.currentUser = sanitizeCurrentUser(previewAccount);
    next.profiles = cloneData(previewWorkspace.profiles || []);
    next.rounds = cloneData(previewWorkspace.rounds || []);
    next.groups = cloneData(previewWorkspace.groups || []);
    next.tournaments = cloneData(previewWorkspace.tournaments || []);
    next.gear = cloneData(previewWorkspace.gear || { items: [] });
    next.social = cloneData(previewWorkspace.social || { activity: [] });
    next.session.activeRoundId = previewWorkspace.userSession?.activeRoundId || null;
    next.session.selectedHole = previewWorkspace.userSession?.selectedHole || 1;
    next.session.summaryRoundId = previewWorkspace.userSession?.summaryRoundId || null;
    next.session.selectedProfileId = previewWorkspace.userSession?.selectedProfileId || previewAccount.profileId;
    next.session.roundSetup = {
      ...(next.session.roundSetup || {}),
      ...(previewWorkspace.userSession?.roundSetup || {}),
    };
    next.session.spotify = createSpotifySessionState(next.session.spotify);
  }

  next.auth.activeUserId = null;
  next.auth.status = "signed_out";
  next.auth.provider = null;
  next.auth.error = "";
  next.auth.notice = "We couldn't restore your last session. Sign in again or use a demo account.";
  next.auth.mode = "login";
  next.session.activeView = "home";
  next.session.previousView = "home";
  next.session.transitionDirection = "steady";
  next.session.spotify = createSpotifySessionState(next.session.spotify);

  return next;
}
function saveWorkspaceToVault(draft, userId = draft.auth?.activeUserId || draft.currentUser?.id) {
  if (!userId) {
    return;
  }

  const account = draft.accounts?.find((entry) => entry.id === userId);
  if (!account) {
    return;
  }

  mergeCurrentUserIntoAccount(account, draft.currentUser, draft.auth);
  draft.accountVault = {
    ...(draft.accountVault || {}),
    [userId]: {
      profiles: cloneData(draft.profiles || []),
      rounds: cloneData(draft.rounds || []),
      groups: cloneData(draft.groups || []),
      tournaments: cloneData(draft.tournaments || []),
      gear: cloneData(draft.gear || { items: [] }),
      social: cloneData(draft.social || { activity: [] }),
      userSession: getUserSession(draft),
    },
  };
  const summary = syncAccountSummary(account, draft.accountVault[userId]);
  draft.currentUser.roundsPlayed = summary.roundsPlayed;
  draft.currentUser.averageScore = summary.averageScore;
  draft.currentUser.bestRound = summary.bestRound;
  draft.currentUser.recentFormSummary = summary.recentFormSummary;
}
function loadAccountIntoState(draft, userId) {
  const account = draft.accounts?.find((entry) => entry.id === userId);
  const workspace = draft.accountVault?.[userId];

  if (!account || !workspace) {
    return false;
  }

  syncAccountSummary(account, workspace);
  draft.currentUser = sanitizeCurrentUser(account);
  draft.profiles = cloneData(workspace.profiles || []);
  draft.rounds = cloneData(workspace.rounds || []);
  draft.groups = cloneData(workspace.groups || []);
  draft.tournaments = cloneData(workspace.tournaments || []);
  draft.gear = cloneData(workspace.gear || { items: [] });
  draft.social = cloneData(workspace.social || { activity: [] });
  draft.auth.activeUserId = userId;
  draft.auth.lastUserId = userId;
  draft.auth.status = "authenticated";
  draft.auth.provider = account.provider;
  draft.auth.error = "";
  draft.auth.notice = account.subscription?.tier === "premium"
    ? `${account.displayName} is ready. Premium tester access, rounds, and settings are loaded.`
    : `${account.displayName} is ready. Rounds, stats, and plan access are loaded.`;
  draft.auth.linkedProviders = [...new Set([...(draft.auth.linkedProviders || []), account.provider])];
  draft.session.activeRoundId = workspace.userSession?.activeRoundId || null;
  draft.session.selectedHole = workspace.userSession?.selectedHole || 1;
  draft.session.summaryRoundId = workspace.userSession?.summaryRoundId || null;
  draft.session.selectedProfileId = workspace.userSession?.selectedProfileId || account.profileId;
  draft.session.roundSetup = {
    ...(draft.session.roundSetup || {}),
    ...(workspace.userSession?.roundSetup || {}),
  };
  draft.session.spotify = createSpotifySessionState(draft.session.spotify);
  draft.session.activeView = "home";
  draft.session.previousView = "home";
  draft.session.transitionDirection = "steady";
  return true;
}
function signOutAccount(draft) {
  const activeUserId = draft.auth?.activeUserId || draft.currentUser?.id || null;
  const activeAccount = draft.accounts?.find((entry) => entry.id === activeUserId) || null;

  if (activeUserId) {
    saveWorkspaceToVault(draft, activeUserId);
  }

  draft.auth.lastUserId = activeUserId;
  draft.auth.activeUserId = null;
  draft.auth.status = "signed_out";
  draft.auth.provider = null;
  draft.auth.error = "";
  draft.auth.notice = activeAccount
    ? `${activeAccount.displayName} logged out. Log in below to return to your golfer account.`
    : "You were logged out. Log in below to return to your golfer account.";
  draft.auth.mode = "login";
  draft.session.activeView = "home";
  draft.session.previousView = "home";
  draft.session.transitionDirection = "steady";
  draft.session.helpReturnView = "auth";
  draft.session.settingsReturnView = "auth";
  draft.session.settingsSection = "account";
  draft.session.activeRoundId = null;
  draft.session.summaryRoundId = null;
  draft.session.selectedHole = 1;
  draft.session.selectedProfileId = null;
  draft.session.roundSetup = {
    ...(draft.session.roundSetup || {}),
    ...createDefaultRoundSetup(),
  };
  draft.session.spotify = createSpotifySessionState();
}
function findAccountByEmail(state, email) {
  const normalized = String(email || "").trim().toLowerCase();
  return state.accounts?.find((account) => account.email === normalized) || null;
}
function createEmailAccount(draft, fields) {
  const email = String(fields.email || "").trim().toLowerCase();
  const displayName = String(fields.displayName || "").trim();
  const password = String(fields.password || "");

  if (!email || !displayName || !password) {
    return { error: "Enter a name, email, and password to create an account." };
  }

  if (findAccountByEmail(draft, email)) {
    return { error: "That email already has an account. Try logging in instead." };
  }

  const account = createAccountRecord({
    displayName,
    email,
    password,
    provider: "email",
    tier: TESTER_DEFAULT_SUBSCRIPTION_TIER,
    city: "Your city",
    homeCourse: "",
    handicap: null,
    bio: "",
    seasonGoal: "Finish your first round",
  });

  draft.accounts.push(account);
  draft.accountVault[account.id] = createEmptyWorkspace(account);
  return { account };
}
function authenticateEmailAccount(state, fields) {
  const email = String(fields.email || "").trim().toLowerCase();
  const password = String(fields.password || "");
  const account = findAccountByEmail(state, email);

  if (!account || account.provider !== "email") {
    return { error: "No email account matches those details." };
  }

  if (account.password !== password) {
    return { error: "That password does not match this account." };
  }

  return { account };
}
function signInWithMockProvider(draft, provider) {
  const providerId = provider === "apple" ? "user-apple-review" : "user-google-review";
  const account = draft.accounts.find((entry) => entry.id === providerId);

  if (!account) {
    return { error: "That provider demo account is not available." };
  }

  return { account };
}
function togglePremiumAccessForUser(draft, userId = draft.auth?.activeUserId || draft.currentUser?.id) {
  if (!userId) {
    return null;
  }

  const account = draft.accounts?.find((entry) => entry.id === userId);
  if (!account) {
    return null;
  }

  const nextTier = account.subscription?.tier === "premium" ? "free" : "premium";
  account.subscription = createSubscription(nextTier);
  account.premiumStatus = nextTier;

  if (draft.currentUser?.id === userId) {
    draft.currentUser.subscription = cloneData(account.subscription);
    draft.currentUser.premiumStatus = nextTier;
  }

  const profile = draft.profiles?.find((entry) => entry.userId === userId || entry.id === account.profileId);
  if (profile) {
    profile.account = {
      ...profile.account,
      premiumStatus: nextTier,
    };
  }

  return account;
}
function getReviewAccounts(state) {
  return (state.accounts || [])
    .filter((account) => account.seededDemo && account.provider === "email")
    .map((account) => ({
      id: account.id,
      displayName: account.displayName,
      email: account.email,
      tier: account.subscription.tier,
      provider: account.provider,
    }));
}

// ---- src/services/course-library.js ----
const STATE_FULL_NAMES = {
  MA: "Massachusetts",
  GA: "Georgia",
  LA: "Louisiana",
  NV: "Nevada",
  CA: "California",
};

function roundToFive(value) {
  return Math.max(70, Math.round(value / 5) * 5);
}

function createHole(number, par, yards, {
  handicapIndex = null,
  notes = "",
} = {}) {
  return {
    number,
    par,
    yards,
    handicapIndex,
    notes,
  };
}

function createTeeBox({
  id,
  name,
  holes,
  slope = null,
  rating = null,
}) {
  return {
    id,
    name,
    totalPar: holes.reduce((sum, hole) => sum + hole.par, 0),
    totalYardage: holes.reduce((sum, hole) => sum + hole.yards, 0),
    slope,
    rating,
    holes,
  };
}

function scaleHoles(baseHoles, factor) {
  return baseHoles.map((hole) => createHole(hole.number, hole.par, roundToFive(hole.yards * factor)));
}

function createCourse({
  id,
  name,
  city,
  state,
  region,
  stateName = STATE_FULL_NAMES[state] || state,
  featured = false,
  featuredNote = "",
  priority = 100,
  aliases = [],
  keywords = [],
  latitude = null,
  longitude = null,
  architect = "",
  opened = null,
  courseType = "championship",
  source = "seeded-curated-demo",
  seeded = true,
  teeBoxes,
}) {
  return {
    id,
    name,
    city,
    state,
    stateName,
    region,
    featured,
    featuredNote,
    priority,
    aliases,
    keywords,
    latitude,
    longitude,
    architect,
    opened,
    courseType,
    source,
    seeded,
    teeBoxes,
  };
}

function createSeededCourse({
  id,
  name,
  city,
  state,
  region,
  latitude,
  longitude,
  aliases = [],
  keywords = [],
  priority = 100,
  featuredNote = "",
  architect = "",
  opened = null,
  courseType = "championship",
  basePars,
  championshipYards,
  championshipName = "Blue",
  championshipSlope = null,
  championshipRating = null,
  memberName = "White",
  memberFactor = 0.92,
  memberSlope = null,
  memberRating = null,
}) {
  const championshipHoles = basePars.map((par, index) => createHole(index + 1, par, championshipYards[index]));
  const memberHoles = scaleHoles(championshipHoles, memberFactor);

  return createCourse({
    id,
    name,
    city,
    state,
    region,
    latitude,
    longitude,
    aliases,
    keywords,
    priority,
    featuredNote,
    architect,
    opened,
    courseType,
    teeBoxes: [
      createTeeBox({
        id: `${id}-${championshipName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: championshipName,
        holes: championshipHoles,
        slope: championshipSlope,
        rating: championshipRating,
      }),
      createTeeBox({
        id: `${id}-${memberName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: memberName,
        holes: memberHoles,
        slope: memberSlope,
        rating: memberRating,
      }),
    ],
  });
}

const SEEDED_COURSES = [
  createCourse({
    id: FEATURED_COURSE_ID,
    name: "The Country Club at Golden Nugget",
    city: "Lake Charles",
    state: "LA",
    region: "Lake Charles / Louisiana",
    featured: true,
    featuredNote: "Default local tester course",
    priority: 0,
    aliases: ["Golden Nugget", "Golden Nugget Lake Charles", "Country Club at Golden Nugget"],
    keywords: ["local", "tester", "lake charles", "louisiana", "resort"],
    architect: "Todd Eckenrode",
    courseType: "resort",
    latitude: 30.1869,
    longitude: -93.2754,
    source: "https://www.goldennugget.com/lake-charles/amenities/golf/tour-the-golf-course/",
    teeBoxes: [
      createTeeBox({
        id: `${FEATURED_COURSE_ID}-tee-1`,
        name: "Tee 1",
        slope: null,
        rating: null,
        holes: [
          createHole(1, 5, 501), createHole(2, 4, 435), createHole(3, 4, 394), createHole(4, 3, 207),
          createHole(5, 5, 535), createHole(6, 4, 464), createHole(7, 3, 173), createHole(8, 4, 458),
          createHole(9, 4, 390), createHole(10, 4, 300), createHole(11, 4, 467), createHole(12, 5, 520),
          createHole(13, 4, 329), createHole(14, 3, 170), createHole(15, 4, 357), createHole(16, 3, 169),
          createHole(17, 4, 459), createHole(18, 5, 581),
        ],
      }),
      createTeeBox({
        id: `${FEATURED_COURSE_ID}-tee-2`,
        name: "Tee 2",
        slope: null,
        rating: null,
        holes: [
          createHole(1, 5, 477), createHole(2, 4, 407), createHole(3, 4, 362), createHole(4, 3, 186),
          createHole(5, 5, 506), createHole(6, 4, 404), createHole(7, 3, 147), createHole(8, 4, 432),
          createHole(9, 4, 366), createHole(10, 4, 296), createHole(11, 4, 437), createHole(12, 5, 494),
          createHole(13, 4, 304), createHole(14, 3, 163), createHole(15, 4, 326), createHole(16, 3, 154),
          createHole(17, 4, 424), createHole(18, 5, 574),
        ],
      }),
      createTeeBox({
        id: `${FEATURED_COURSE_ID}-tee-3`,
        name: "Tee 3",
        slope: null,
        rating: null,
        holes: [
          createHole(1, 5, 460), createHole(2, 4, 374), createHole(3, 4, 350), createHole(4, 3, 160),
          createHole(5, 5, 485), createHole(6, 4, 390), createHole(7, 3, 140), createHole(8, 4, 393),
          createHole(9, 4, 360), createHole(10, 4, 290), createHole(11, 4, 418), createHole(12, 5, 475),
          createHole(13, 4, 285), createHole(14, 3, 140), createHole(15, 4, 315), createHole(16, 3, 135),
          createHole(17, 4, 410), createHole(18, 5, 525),
        ],
      }),
      createTeeBox({
        id: `${FEATURED_COURSE_ID}-tee-4`,
        name: "Tee 4",
        slope: null,
        rating: null,
        holes: [
          createHole(1, 5, 423), createHole(2, 4, 317), createHole(3, 4, 290), createHole(4, 3, 113),
          createHole(5, 5, 455), createHole(6, 4, 343), createHole(7, 3, 112), createHole(8, 4, 336),
          createHole(9, 4, 318), createHole(10, 4, 241), createHole(11, 4, 390), createHole(12, 5, 435),
          createHole(13, 4, 271), createHole(14, 3, 94), createHole(15, 4, 275), createHole(16, 3, 101),
          createHole(17, 4, 357), createHole(18, 5, 445),
        ],
      }),
    ],
  }),
  createSeededCourse({
    id: "the-country-club-brookline",
    name: "The Country Club",
    city: "Brookline",
    state: "MA",
    region: "Boston / Massachusetts",
    latitude: 42.3317,
    longitude: -71.1398,
    basePars: [4, 4, 4, 3, 5, 4, 4, 4, 4, 4, 3, 4, 4, 4, 5, 3, 4, 4],
    championshipYards: [425, 392, 471, 151, 548, 179, 373, 392, 458, 502, 131, 482, 440, 465, 625, 171, 437, 443],
    championshipName: "Championship",
    championshipSlope: 145,
    championshipRating: 75.2,
    memberName: "Member",
    memberFactor: 0.915,
    memberSlope: 136,
    memberRating: 72.1,
  }),
  createSeededCourse({
    id: "granite-links-quincy",
    name: "Granite Links",
    city: "Quincy",
    state: "MA",
    region: "Boston / Massachusetts",
    latitude: 42.2281,
    longitude: -71.0204,
    basePars: [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4],
    championshipYards: [431, 189, 552, 446, 404, 202, 438, 561, 417, 409, 461, 182, 548, 423, 439, 192, 573, 431],
    championshipName: "Black",
    championshipSlope: 142,
    championshipRating: 74.6,
    memberName: "Blue",
    memberFactor: 0.925,
    memberSlope: 135,
    memberRating: 71.9,
  }),
  createSeededCourse({
    id: "boston-golf-club",
    name: "Boston Golf Club",
    city: "Hingham",
    state: "MA",
    region: "Boston / Massachusetts",
    latitude: 42.2161,
    longitude: -70.8964,
    aliases: ["BGC Hingham", "Boston GC"],
    keywords: ["boston", "private", "massachusetts"],
    priority: 32,
    architect: "Gil Hanse",
    courseType: "private",
    basePars: [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 3, 4, 5, 4],
    championshipYards: [422, 455, 182, 560, 448, 430, 212, 575, 436, 454, 571, 206, 447, 435, 210, 471, 588, 462],
    championshipName: "Back",
    championshipSlope: 146,
    championshipRating: 75.1,
    memberName: "Member",
    memberFactor: 0.912,
    memberSlope: 138,
    memberRating: 72.4,
  }),
  createSeededCourse({
    id: "east-lake-atlanta",
    name: "East Lake Golf Club",
    city: "Atlanta",
    state: "GA",
    region: "Georgia",
    latitude: 33.7454,
    longitude: -84.3184,
    basePars: [4, 3, 4, 4, 4, 5, 4, 4, 5, 4, 4, 5, 3, 4, 3, 4, 4, 5],
    championshipYards: [455, 214, 397, 479, 442, 525, 434, 235, 600, 469, 438, 547, 212, 520, 211, 435, 421, 590],
    championshipName: "Tournament",
    championshipSlope: 148,
    championshipRating: 76.1,
    memberName: "Club",
    memberFactor: 0.905,
    memberSlope: 139,
    memberRating: 72.8,
  }),
  createSeededCourse({
    id: "sea-island-seaside",
    name: "Sea Island Golf Club - Seaside Course",
    city: "St. Simons Island",
    state: "GA",
    region: "Georgia",
    latitude: 31.1544,
    longitude: -81.3916,
    basePars: [4, 4, 3, 4, 4, 4, 5, 3, 4, 4, 4, 4, 5, 4, 4, 3, 4, 5],
    championshipYards: [410, 425, 188, 472, 417, 409, 557, 204, 435, 418, 437, 429, 559, 442, 404, 168, 429, 562],
    championshipName: "Seaside",
    championshipSlope: 141,
    championshipRating: 74.5,
    memberName: "Resort",
    memberFactor: 0.91,
    memberSlope: 133,
    memberRating: 71.3,
  }),
  createSeededCourse({
    id: "atlanta-athletic-highlands",
    name: "Atlanta Athletic Club - Highlands",
    city: "Johns Creek",
    state: "GA",
    region: "Georgia",
    latitude: 34.0215,
    longitude: -84.1746,
    aliases: ["Atlanta Athletic Club", "AAC Highlands"],
    keywords: ["atlanta", "johns creek", "championship"],
    priority: 38,
    architect: "Rees Jones",
    courseType: "championship",
    basePars: [4, 4, 3, 4, 4, 5, 4, 3, 5, 4, 5, 4, 3, 4, 4, 3, 4, 5],
    championshipYards: [435, 460, 215, 487, 434, 597, 436, 213, 564, 449, 597, 444, 235, 520, 470, 226, 456, 590],
    championshipName: "Highlands",
    championshipSlope: 147,
    championshipRating: 76.0,
    memberName: "Member",
    memberFactor: 0.908,
    memberSlope: 139,
    memberRating: 72.9,
  }),
  createSeededCourse({
    id: "tpc-louisiana-avondale",
    name: "TPC Louisiana",
    city: "Avondale",
    state: "LA",
    region: "Louisiana",
    latitude: 29.9113,
    longitude: -90.1896,
    basePars: [4, 5, 3, 4, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 4, 3, 5],
    championshipYards: [441, 548, 221, 482, 476, 476, 585, 399, 207, 472, 575, 437, 215, 491, 471, 452, 215, 585],
    championshipName: "Tournament",
    championshipSlope: 149,
    championshipRating: 76.4,
    memberName: "Blue",
    memberFactor: 0.91,
    memberSlope: 140,
    memberRating: 73.2,
  }),
  createSeededCourse({
    id: "english-turn-new-orleans",
    name: "English Turn Golf & Country Club",
    city: "New Orleans",
    state: "LA",
    region: "Louisiana",
    latitude: 29.8823,
    longitude: -89.9488,
    basePars: [4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 4, 3, 5],
    championshipYards: [419, 444, 196, 541, 451, 407, 433, 212, 566, 428, 412, 557, 186, 446, 421, 439, 173, 547],
    championshipName: "Championship",
    championshipSlope: 143,
    championshipRating: 74.2,
    memberName: "Member",
    memberFactor: 0.918,
    memberSlope: 135,
    memberRating: 71.4,
  }),
  createSeededCourse({
    id: "squire-creek-choudrant",
    name: "Squire Creek Country Club",
    city: "Choudrant",
    state: "LA",
    region: "Louisiana",
    latitude: 32.5414,
    longitude: -92.4808,
    aliases: ["Squire Creek"],
    keywords: ["north louisiana", "country club", "choudrant"],
    priority: 44,
    architect: "Tom Fazio",
    courseType: "private",
    basePars: [4, 4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 3, 4, 5],
    championshipYards: [452, 401, 572, 188, 435, 443, 557, 204, 421, 446, 588, 431, 210, 468, 420, 172, 457, 593],
    championshipName: "Championship",
    championshipSlope: 145,
    championshipRating: 74.9,
    memberName: "Club",
    memberFactor: 0.914,
    memberSlope: 136,
    memberRating: 71.8,
  }),
  createSeededCourse({
    id: "shadow-creek-las-vegas",
    name: "Shadow Creek Golf Course",
    city: "North Las Vegas",
    state: "NV",
    region: "Las Vegas / Nevada",
    latitude: 36.2021,
    longitude: -115.1822,
    basePars: [4, 4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 3, 5, 4],
    championshipYards: [439, 489, 577, 209, 462, 443, 589, 196, 448, 471, 460, 576, 235, 460, 457, 183, 622, 454],
    championshipName: "Back",
    championshipSlope: 150,
    championshipRating: 77.1,
    memberName: "Member",
    memberFactor: 0.9,
    memberSlope: 142,
    memberRating: 73.9,
  }),
  createSeededCourse({
    id: "paiute-wolf-las-vegas",
    name: "Paiute Golf Resort - Wolf Course",
    city: "Las Vegas",
    state: "NV",
    region: "Las Vegas / Nevada",
    latitude: 36.3115,
    longitude: -115.3898,
    basePars: [4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4],
    championshipYards: [478, 471, 210, 603, 463, 442, 604, 241, 430, 458, 576, 485, 236, 494, 448, 193, 604, 468],
    championshipName: "Wolf",
    championshipSlope: 154,
    championshipRating: 78.0,
    memberName: "Silver",
    memberFactor: 0.89,
    memberSlope: 145,
    memberRating: 74.6,
  }),
  createSeededCourse({
    id: "cascata-boulder-city",
    name: "Cascata",
    city: "Boulder City",
    state: "NV",
    region: "Las Vegas / Nevada",
    latitude: 35.9792,
    longitude: -114.8699,
    aliases: ["Cascata Golf Club"],
    keywords: ["vegas", "desert", "mountain", "boulder city"],
    priority: 41,
    architect: "Rees Jones",
    courseType: "resort",
    basePars: [4, 3, 5, 4, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4],
    championshipYards: [488, 207, 621, 474, 459, 560, 472, 218, 447, 471, 589, 454, 202, 512, 438, 166, 612, 460],
    championshipName: "Back",
    championshipSlope: 152,
    championshipRating: 77.0,
    memberName: "Member",
    memberFactor: 0.9,
    memberSlope: 143,
    memberRating: 73.8,
  }),
  createSeededCourse({
    id: "pebble-beach-california",
    name: "Pebble Beach Golf Links",
    city: "Pebble Beach",
    state: "CA",
    region: "California",
    latitude: 36.5683,
    longitude: -121.9482,
    basePars: [4, 5, 4, 4, 3, 5, 3, 4, 4, 4, 4, 3, 4, 5, 4, 4, 3, 5],
    championshipYards: [381, 511, 390, 331, 192, 503, 106, 428, 446, 495, 390, 202, 407, 580, 396, 403, 208, 543],
    championshipName: "Championship",
    championshipSlope: 144,
    championshipRating: 75.5,
    memberName: "Resort",
    memberFactor: 0.91,
    memberSlope: 136,
    memberRating: 72.4,
  }),
  createSeededCourse({
    id: "torrey-pines-south",
    name: "Torrey Pines Golf Course - South",
    city: "La Jolla",
    state: "CA",
    region: "California",
    latitude: 32.9044,
    longitude: -117.2519,
    basePars: [4, 4, 3, 4, 4, 5, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5],
    championshipYards: [454, 389, 198, 488, 454, 564, 462, 177, 615, 454, 225, 505, 614, 437, 480, 227, 443, 570],
    championshipName: "South Tournament",
    championshipSlope: 148,
    championshipRating: 77.7,
    memberName: "South Blue",
    memberFactor: 0.9,
    memberSlope: 140,
    memberRating: 74.5,
  }),
  createSeededCourse({
    id: "riviera-country-club",
    name: "Riviera Country Club",
    city: "Pacific Palisades",
    state: "CA",
    region: "California",
    latitude: 34.0452,
    longitude: -118.5019,
    aliases: ["Riviera", "Riviera Los Angeles"],
    keywords: ["la", "los angeles", "signature", "private"],
    priority: 36,
    architect: "George C. Thomas Jr.",
    courseType: "private",
    basePars: [5, 4, 4, 3, 4, 3, 4, 4, 4, 4, 5, 4, 3, 4, 3, 4, 5, 4],
    championshipYards: [503, 471, 434, 236, 434, 199, 408, 433, 458, 315, 583, 479, 191, 434, 166, 475, 587, 458],
    championshipName: "Championship",
    championshipSlope: 146,
    championshipRating: 75.8,
    memberName: "Member",
    memberFactor: 0.914,
    memberSlope: 137,
    memberRating: 72.7,
  }),
];

function normalizeQuery(value = "") {
  return String(value || "").trim().toLowerCase();
}

function createSearchText(course) {
  return normalizeQuery([
    course.name,
    course.city,
    course.state,
    course.stateName,
    course.region,
    course.architect,
    ...(course.aliases || []),
    ...(course.keywords || []),
    ...(course.teeBoxes || []).map((teeBox) => teeBox.name),
  ].join(" "));
}

function getMatchScore(course, normalizedQuery) {
  if (!normalizedQuery) {
    return 0;
  }

  const exactTargets = [
    course.name,
    course.city,
    course.state,
    course.stateName,
    ...(course.aliases || []),
  ].map(normalizeQuery);

  if (exactTargets.includes(normalizedQuery)) {
    return 260;
  }

  const prefixTargets = [
    course.name,
    course.city,
    course.region,
    ...(course.aliases || []),
  ].map(normalizeQuery);

  if (prefixTargets.some((value) => value.startsWith(normalizedQuery))) {
    return 210;
  }

  if ((course.keywords || []).map(normalizeQuery).some((value) => value.includes(normalizedQuery))) {
    return 170;
  }

  if (createSearchText(course).includes(normalizedQuery)) {
    return 120;
  }

  return -1;
}

function compareCourses(left, right) {
  if (left.id === FEATURED_COURSE_ID && right.id !== FEATURED_COURSE_ID) {
    return -1;
  }

  if (right.id === FEATURED_COURSE_ID && left.id !== FEATURED_COURSE_ID) {
    return 1;
  }

  if ((left.priority || 100) !== (right.priority || 100)) {
    return (left.priority || 100) - (right.priority || 100);
  }

  return left.name.localeCompare(right.name);
}
function listSeededCourses() {
  return cloneData(SEEDED_COURSES);
}
function findCourseById(courseId) {
  const found = SEEDED_COURSES.find((course) => course.id === courseId);
  return found ? cloneData(found) : null;
}
function getDefaultTeeBox(course) {
  return course?.teeBoxes?.[0] ? cloneData(course.teeBoxes[0]) : null;
}
function findTeeBox(course, teeBoxId) {
  if (!course?.teeBoxes?.length) {
    return null;
  }

  const found = course.teeBoxes.find((teeBox) => teeBox.id === teeBoxId);
  return cloneData(found || course.teeBoxes[0]);
}
function searchCourseLibrary(query = "") {
  const normalized = normalizeQuery(query);
  const courses = SEEDED_COURSES.map((course) => ({
    ...course,
    searchText: createSearchText(course),
    matchScore: getMatchScore(course, normalized),
  }));

  const filtered = normalized
    ? courses.filter((course) => course.matchScore >= 0)
    : courses;

  return filtered
    .sort((left, right) => {
      if (normalized && left.matchScore !== right.matchScore) {
        return right.matchScore - left.matchScore;
      }
      return compareCourses(left, right);
    })
    .map(({ searchText, matchScore, ...course }) => cloneData(course));
}
function getCourseQuickPicks(limit = 4) {
  return searchCourseLibrary("").slice(0, limit);
}
function getRoundSetupCourses(query = "", limit = 10) {
  return searchCourseLibrary(query).slice(0, limit);
}
function createManualCourseSelection(courseName = "", teeBox = "") {
  return {
    courseId: null,
    courseName: courseName || "National Pines",
    teeBoxId: null,
    teeBoxName: teeBox || "Blue",
    holes: cloneData(COURSE_TEMPLATE),
    city: "",
    state: "",
    region: "",
    latitude: null,
    longitude: null,
    source: "manual-template",
    seeded: false,
    aliases: [],
    keywords: [],
    featured: false,
    featuredNote: "",
    architect: "",
    opened: null,
    courseType: "template",
    teeCount: 1,
    totalPar: COURSE_TEMPLATE.reduce((sum, hole) => sum + hole.par, 0),
    totalYardage: COURSE_TEMPLATE.reduce((sum, hole) => sum + hole.yards, 0),
    slope: null,
    rating: null,
  };
}
function createRoundCourseSelection(courseId, teeBoxId = "") {
  const course = findCourseById(courseId);
  if (!course) {
    return null;
  }

  const teeBox = findTeeBox(course, teeBoxId);
  if (!teeBox) {
    return null;
  }

  return {
    courseId: course.id,
    courseName: course.name,
    teeBoxId: teeBox.id,
    teeBoxName: teeBox.name,
    holes: cloneData(teeBox.holes),
    city: course.city,
    state: course.state,
    region: course.region,
    latitude: course.latitude,
    longitude: course.longitude,
    source: course.source,
    seeded: Boolean(course.seeded),
    aliases: cloneData(course.aliases || []),
    keywords: cloneData(course.keywords || []),
    featured: Boolean(course.featured),
    featuredNote: course.featuredNote || "",
    architect: course.architect || "",
    opened: course.opened ?? null,
    courseType: course.courseType || "",
    teeCount: Array.isArray(course.teeBoxes) ? course.teeBoxes.length : 0,
    totalPar: teeBox.totalPar,
    totalYardage: teeBox.totalYardage,
    slope: teeBox.slope ?? null,
    rating: teeBox.rating ?? null,
  };
}

// ---- src/services/runtime-config.js ----
function getGlobalRuntimeConfig() {
  if (typeof window !== "undefined" && window[RUNTIME_CONFIG_GLOBAL]) {
    return window[RUNTIME_CONFIG_GLOBAL];
  }

  if (typeof globalThis !== "undefined" && globalThis[RUNTIME_CONFIG_GLOBAL]) {
    return globalThis[RUNTIME_CONFIG_GLOBAL];
  }

  return {};
}
function getRuntimeConfig() {
  const runtime = getGlobalRuntimeConfig();

  return {
    supabaseUrl: String(runtime.supabaseUrl || runtime.SUPABASE_URL || "").trim(),
    supabaseAnonKey: String(runtime.supabaseAnonKey || runtime.SUPABASE_ANON_KEY || "").trim(),
    supabaseResetRedirectUrl: String(runtime.supabaseResetRedirectUrl || runtime.SUPABASE_RESET_REDIRECT_URL || "").trim(),
    siteUrl: String(runtime.siteUrl || runtime.SITE_URL || "").trim(),
  };
}
function hasSupabaseRuntimeConfig(config = getRuntimeConfig()) {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}

// ---- src/services/supabase-rest.js ----
function getBrowserStorage(storageOverride = null) {
  if (storageOverride) {
    return storageOverride;
  }

  try {
    if (typeof localStorage === "undefined") {
      return null;
    }

    return localStorage;
  } catch (error) {
    console.warn("[Golfers Nation] Supabase session storage is unavailable.", error);
    return null;
  }
}

function normalizeUrl(value = "") {
  return String(value || "").trim().replace(/\/+$/, "");
}

function parseJsonSafely(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function normalizeError(payload, response) {
  return {
    status: response?.status || 0,
    message: payload?.msg || payload?.message || payload?.error_description || payload?.error || "Request failed.",
    code: payload?.code || payload?.error || "",
  };
}

function isMissingRelationError(error) {
  const code = String(error?.code || "").toUpperCase();
  const message = String(error?.message || "").toLowerCase();
  return code === "PGRST205"
    || message.includes("could not find the table")
    || message.includes("schema cache");
}

function logMissingRelation(tableName, error) {
  console.warn(`[Golfers Nation] Supabase table ${tableName} is not ready yet. Continuing with local-safe state.`, error);
}

function normalizeSessionPayload(payload) {
  const source = payload?.session || payload || null;
  const user = payload?.user || source?.user || null;

  if (!source || (!source.access_token && !source.refresh_token)) {
    return {
      session: null,
      user,
    };
  }

  const expiresAt = source.expires_at
    || (source.expires_in ? Math.floor(Date.now() / 1000) + Number(source.expires_in) : null);

  return {
    session: {
      access_token: source.access_token,
      refresh_token: source.refresh_token,
      expires_in: source.expires_in || null,
      expires_at: expiresAt,
      token_type: source.token_type || "bearer",
      user,
    },
    user,
  };
}

function isSessionExpired(session) {
  if (!session?.expires_at) {
    return false;
  }

  return (Number(session.expires_at) * 1000) <= (Date.now() + 30_000);
}
function createSupabaseRestBridge({
  config,
  fetchImpl = typeof fetch === "function" ? fetch.bind(globalThis) : null,
  storage = null,
} = {}) {
  const runtimeConfig = {
    supabaseUrl: normalizeUrl(config?.supabaseUrl),
    supabaseAnonKey: String(config?.supabaseAnonKey || "").trim(),
    supabaseResetRedirectUrl: String(config?.supabaseResetRedirectUrl || config?.siteUrl || "").trim(),
    siteUrl: String(config?.siteUrl || "").trim(),
  };
  const storageRef = getBrowserStorage(storage);

  function isConfigured() {
    return Boolean(runtimeConfig.supabaseUrl && runtimeConfig.supabaseAnonKey && typeof fetchImpl === "function");
  }

  function readStoredSession() {
    if (!storageRef) {
      return null;
    }

    try {
      const raw = storageRef.getItem(SUPABASE_SESSION_STORAGE_KEY);
      return raw ? parseJsonSafely(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeStoredSession(session) {
    if (!storageRef) {
      return session;
    }

    try {
      storageRef.setItem(SUPABASE_SESSION_STORAGE_KEY, JSON.stringify(session || null));
    } catch (error) {
      console.warn("[Golfers Nation] Failed to store Supabase session.", error);
    }

    return session;
  }

  function clearStoredSession() {
    if (!storageRef) {
      return;
    }

    try {
      storageRef.removeItem(SUPABASE_SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn("[Golfers Nation] Failed to clear Supabase session.", error);
    }
  }

  async function request(path, {
    method = "GET",
    body = null,
    accessToken = "",
    headers = {},
  } = {}) {
    if (!isConfigured()) {
      return {
        error: {
          status: 0,
          message: "Supabase is not configured. Add the project URL and anon key first.",
          code: "supabase_not_configured",
        },
      };
    }

    const response = await fetchImpl(`${runtimeConfig.supabaseUrl}${path}`, {
      method,
      headers: {
        apikey: runtimeConfig.supabaseAnonKey,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const payloadText = await response.text();
    const payload = parseJsonSafely(payloadText);

    if (!response.ok) {
      return { error: normalizeError(payload, response) };
    }

    return { data: payload };
  }

  async function refreshStoredSession() {
    const current = readStoredSession();

    if (!current?.refresh_token) {
      return { error: { status: 401, message: "No refresh token is available.", code: "missing_refresh_token" } };
    }

    const result = await request("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: {
        refresh_token: current.refresh_token,
      },
    });

    if (result.error) {
      clearStoredSession();
      return result;
    }

    const normalized = normalizeSessionPayload(result.data);
    if (normalized.session) {
      writeStoredSession(normalized.session);
    }

    return normalized;
  }

  async function getActiveSession() {
    const stored = readStoredSession();
    if (!stored) {
      return { session: null };
    }

    if (!isSessionExpired(stored)) {
      return { session: stored };
    }

    const refreshed = await refreshStoredSession();
    if (refreshed.error) {
      return refreshed;
    }

    return { session: refreshed.session || null };
  }

  async function signUpWithEmail({ email, password, displayName }) {
    const result = await request("/auth/v1/signup", {
      method: "POST",
      body: {
        email: String(email || "").trim().toLowerCase(),
        password: String(password || ""),
        data: {
          display_name: String(displayName || "").trim(),
        },
      },
    });

    if (result.error) {
      return result;
    }

    const normalized = normalizeSessionPayload(result.data);
    if (normalized.session) {
      writeStoredSession(normalized.session);
    }

    return normalized;
  }

  async function signInWithEmail({ email, password }) {
    const result = await request("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: {
        email: String(email || "").trim().toLowerCase(),
        password: String(password || ""),
      },
    });

    if (result.error) {
      return result;
    }

    const normalized = normalizeSessionPayload(result.data);
    if (normalized.session) {
      writeStoredSession(normalized.session);
    }

    return normalized;
  }

  async function signOut() {
    const active = await getActiveSession();
    const accessToken = active.session?.access_token || "";

    if (accessToken) {
      await request("/auth/v1/logout", {
        method: "POST",
        accessToken,
      });
    }

    clearStoredSession();
    return { signedOut: true };
  }

  async function requestPasswordReset(email) {
    return request("/auth/v1/recover", {
      method: "POST",
      body: {
        email: String(email || "").trim().toLowerCase(),
        ...(runtimeConfig.supabaseResetRedirectUrl ? { redirect_to: runtimeConfig.supabaseResetRedirectUrl } : {}),
      },
    });
  }

  async function getCurrentUser() {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const result = await request("/auth/v1/user", {
      accessToken: active.session.access_token,
    });

    if (result.error) {
      if (result.error.status === 401) {
        clearStoredSession();
      }
      return result;
    }

    return {
      user: result.data,
      session: active.session,
    };
  }

  async function fetchWorkspace(userId) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const encodedUserId = encodeURIComponent(String(userId || ""));
    const [profileResult, workspaceResult] = await Promise.all([
      request(`/rest/v1/player_profiles?id=eq.${encodedUserId}&select=*`, {
        accessToken: active.session.access_token,
      }),
      request(`/rest/v1/player_workspaces?user_id=eq.${encodedUserId}&select=user_id,workspace,updated_at`, {
        accessToken: active.session.access_token,
      }),
    ]);

    if (profileResult.error && !isMissingRelationError(profileResult.error)) {
      return profileResult;
    }

    if (workspaceResult.error && !isMissingRelationError(workspaceResult.error)) {
      return workspaceResult;
    }

    if (profileResult.error && isMissingRelationError(profileResult.error)) {
      logMissingRelation("public.player_profiles", profileResult.error);
    }

    if (workspaceResult.error && isMissingRelationError(workspaceResult.error)) {
      logMissingRelation("public.player_workspaces", workspaceResult.error);
    }

    return {
      profile: profileResult.error
        ? null
        : Array.isArray(profileResult.data) ? profileResult.data[0] || null : profileResult.data || null,
      workspace: workspaceResult.error
        ? null
        : Array.isArray(workspaceResult.data) ? workspaceResult.data[0]?.workspace || null : workspaceResult.data?.workspace || null,
      session: active.session,
    };
  }

  async function upsertProfile(profileRecord) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const result = await request("/rest/v1/player_profiles?on_conflict=id", {
      method: "POST",
      accessToken: active.session.access_token,
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: profileRecord,
    });

    if (result?.error && isMissingRelationError(result.error)) {
      logMissingRelation("public.player_profiles", result.error);
      return { status: "skipped-missing-table", data: null };
    }

    return result;
  }

  async function upsertWorkspace(userId, workspace) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const result = await request("/rest/v1/player_workspaces?on_conflict=user_id", {
      method: "POST",
      accessToken: active.session.access_token,
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: {
        user_id: userId,
        workspace,
        updated_at: new Date().toISOString(),
      },
    });

    if (result?.error && isMissingRelationError(result.error)) {
      logMissingRelation("public.player_workspaces", result.error);
      return { status: "skipped-missing-table", data: null };
    }

    return result;
  }

  async function submitTesterFeedback(feedbackRecord) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "Sign in before sending tester feedback.", code: "missing_session" } };
    }

    return request(`/rest/v1/${TESTER_FEEDBACK_TABLE}`, {
      method: "POST",
      accessToken: active.session.access_token,
      headers: {
        Prefer: "return=representation",
      },
      body: feedbackRecord,
    });
  }

  async function fetchLiveRoundSessionByInviteCode(inviteCode) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const result = await request(`/rest/v1/${LIVE_ROUND_SESSIONS_TABLE}?invite_code=eq.${encodeURIComponent(String(inviteCode || "").trim().toUpperCase())}&select=*`, {
      accessToken: active.session.access_token,
    });

    if (result?.error && isMissingRelationError(result.error)) {
      logMissingRelation(`public.${LIVE_ROUND_SESSIONS_TABLE}`, result.error);
      return {
        session: null,
        missingTable: true,
      };
    }

    if (result?.error) {
      return result;
    }

    return {
      session: Array.isArray(result.data) ? result.data[0] || null : result.data || null,
      missingTable: false,
    };
  }

  async function upsertLiveRoundSession(sessionRecord) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    if (!active.session?.access_token) {
      return { error: { status: 401, message: "No active session was found.", code: "missing_session" } };
    }

    const result = await request(`/rest/v1/${LIVE_ROUND_SESSIONS_TABLE}?on_conflict=invite_code`, {
      method: "POST",
      accessToken: active.session.access_token,
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: sessionRecord,
    });

    if (result?.error && isMissingRelationError(result.error)) {
      logMissingRelation(`public.${LIVE_ROUND_SESSIONS_TABLE}`, result.error);
      return { status: "skipped-missing-table", data: null };
    }

    return result;
  }

  async function broadcastRealtimeMessage(topic, event, payload) {
    const active = await getActiveSession();
    if (active.error) {
      return active;
    }

    return request("/realtime/v1/api/broadcast", {
      method: "POST",
      accessToken: active.session?.access_token || "",
      body: {
        messages: [
          {
            topic,
            event,
            payload,
            private: false,
          },
        ],
      },
    });
  }

  return {
    mode: "supabase-rest-bridge",
    config: runtimeConfig,
    isConfigured,
    readStoredSession,
    writeStoredSession,
    clearStoredSession,
    getActiveSession,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    requestPasswordReset,
    getCurrentUser,
    fetchWorkspace,
    upsertProfile,
    upsertWorkspace,
    submitTesterFeedback,
    fetchLiveRoundSessionByInviteCode,
    upsertLiveRoundSession,
    broadcastRealtimeMessage,
  };
}

// ---- src/services/player-service.js ----
function avatarFromName(displayName) {
  return String(displayName || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "GN";
}

function normalizeUsername(displayName) {
  const base = String(displayName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 18);
  return base ? `@${base}` : "@golfer";
}

function percentage(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function roundValue(value, digits = 1) {
  return typeof value === "number" && Number.isFinite(value)
    ? Number(value.toFixed(digits))
    : null;
}

function createEmptyParType(par) {
  return {
    par,
    holes: 0,
    totalStrokes: 0,
    totalPar: 0,
    averageScore: null,
    toPar: 0,
  };
}

function mergeParTypeScoring(collection) {
  const merged = {
    3: createEmptyParType(3),
    4: createEmptyParType(4),
    5: createEmptyParType(5),
  };

  collection.forEach((entry) => {
    [3, 4, 5].forEach((par) => {
      const source = entry?.[par];
      if (!source) {
        return;
      }

      merged[par].holes += source.holes || 0;
      merged[par].totalStrokes += source.totalStrokes || 0;
      merged[par].totalPar += source.totalPar || 0;
    });
  });

  [3, 4, 5].forEach((par) => {
    const bucket = merged[par];
    bucket.averageScore = bucket.holes ? roundValue(bucket.totalStrokes / bucket.holes, 2) : null;
    bucket.toPar = bucket.totalStrokes - bucket.totalPar;
  });

  return merged;
}

function buildRecentFormSummary(recentForm) {
  return recentForm.length
    ? `${recentForm[0].courseName} ${recentForm[0].toPar > 0 ? `+${recentForm[0].toPar}` : recentForm[0].toPar}`
    : "First round pending";
}

function getScoringParticipantId(round, profileId) {
  const player = round.players.find((entry) => entry.profileId === profileId);
  if (!player) {
    return null;
  }

  if (round.mode === "stroke") {
    return player.id;
  }

  return round.sides.find((side) => side.playerIds.includes(player.id))?.id || null;
}

function mergeWithStoredProfileStats(profile, derivedStats, currentUserId) {
  const stored = profile?.publicProfile || {};
  const preferStored = Boolean(
    profile
    && profile.userId !== currentUserId
    && (stored.roundsPlayed || 0) > (derivedStats.roundsPlayed || 0)
  );

  if (preferStored) {
    return {
      ...derivedStats,
      roundsPlayed: stored.roundsPlayed ?? derivedStats.roundsPlayed,
      averageScore: stored.averageScore ?? derivedStats.averageScore,
      bestRound: stored.bestRound ?? derivedStats.bestRound,
      recentFormSummary: stored.recentFormSummary || derivedStats.recentFormSummary,
      fairwayPercentage: stored.fairwayPercentage ?? derivedStats.fairwayPercentage,
      girPercentage: stored.girPercentage ?? derivedStats.girPercentage,
      averagePutts: stored.averagePutts ?? derivedStats.averagePutts,
      penaltiesAverage: stored.penaltiesAverage ?? derivedStats.penaltiesAverage,
      upAndDownRate: stored.upAndDownRate ?? derivedStats.upAndDownRate,
      sandSaveCount: stored.sandSaveCount ?? derivedStats.sandSaveCount,
      scoringByParType: stored.scoringByParType || derivedStats.scoringByParType,
      hardestHoles: stored.hardestHoles?.length ? stored.hardestHoles : derivedStats.hardestHoles,
      bestHoles: stored.bestHoles?.length ? stored.bestHoles : derivedStats.bestHoles,
      strokesGained: stored.strokesGained || derivedStats.strokesGained,
      formLabel: stored.formLabel || derivedStats.formLabel,
      trendSummary: stored.trendSummary || derivedStats.trendSummary,
      handicapIndex: stored.handicapIndex ?? derivedStats.handicapIndex,
      smartInsights: stored.smartInsights?.length ? stored.smartInsights : derivedStats.smartInsights,
      recentForm: stored.recentForm?.length ? stored.recentForm : derivedStats.recentForm,
    };
  }

  return {
    ...derivedStats,
    fairwayPercentage: derivedStats.fairwayPercentage ?? stored.fairwayPercentage ?? 0,
    girPercentage: derivedStats.girPercentage ?? stored.girPercentage ?? 0,
    averagePutts: derivedStats.averagePutts ?? stored.averagePutts ?? null,
    penaltiesAverage: derivedStats.penaltiesAverage ?? stored.penaltiesAverage ?? 0,
    upAndDownRate: derivedStats.upAndDownRate ?? stored.upAndDownRate ?? 0,
    sandSaveCount: derivedStats.sandSaveCount ?? stored.sandSaveCount ?? 0,
    scoringByParType: derivedStats.scoringByParType || stored.scoringByParType || {},
    hardestHoles: derivedStats.hardestHoles?.length ? derivedStats.hardestHoles : (stored.hardestHoles || []),
    bestHoles: derivedStats.bestHoles?.length ? derivedStats.bestHoles : (stored.bestHoles || []),
    strokesGained: derivedStats.strokesGained || stored.strokesGained || null,
    formLabel: derivedStats.formLabel || stored.formLabel || "Stable",
    trendSummary: derivedStats.trendSummary || stored.trendSummary || "Building a trend",
    handicapIndex: derivedStats.handicapIndex ?? stored.handicapIndex ?? null,
    smartInsights: derivedStats.smartInsights?.length ? derivedStats.smartInsights : (stored.smartInsights || []),
  };
}

function buildDerivedStatsFromAppearances(appearances) {
  const totalFairwaysHit = appearances.reduce((sum, entry) => sum + entry.fairwaysHit, 0);
  const totalFairwayOpportunities = appearances.reduce((sum, entry) => sum + entry.fairwayOpportunities, 0);
  const totalGreensHit = appearances.reduce((sum, entry) => sum + entry.greensHit, 0);
  const totalGirOpportunities = appearances.reduce((sum, entry) => sum + entry.girOpportunities, 0);
  const totalPutts = appearances.reduce((sum, entry) => sum + entry.totalPutts, 0);
  const totalPlayedHoles = appearances.reduce((sum, entry) => sum + entry.holesPlayed, 0);
  const totalPenalties = appearances.reduce((sum, entry) => sum + entry.totalPenalties, 0);
  const totalUpAndDowns = appearances.reduce((sum, entry) => sum + entry.upAndDownSuccesses, 0);
  const totalUpAndDownOpportunities = appearances.reduce((sum, entry) => sum + entry.upAndDownOpportunities, 0);
  const totalSandSaves = appearances.reduce((sum, entry) => sum + entry.sandSaveCount, 0);
  const scoringByParType = mergeParTypeScoring(appearances.map((entry) => entry.scoringByParType));
  const holeMap = new Map();

  appearances.forEach((entry) => {
    (entry.holeDetails || []).forEach((hole) => {
      const existing = holeMap.get(hole.holeNumber) || {
        holeNumber: hole.holeNumber,
        par: hole.par,
        rounds: 0,
        totalToPar: 0,
        totalStrokes: 0,
      };
      existing.rounds += 1;
      existing.totalToPar += hole.toPar;
      existing.totalStrokes += hole.strokes;
      holeMap.set(hole.holeNumber, existing);
    });
  });
  const recentTrend = getRecentTrend(appearances.map((entry) => ({
    totalStrokes: entry.totalStrokes,
  })));
  const handicapIndex = calculateHandicapScaffold(appearances.map((entry) => ({
    totalStrokes: entry.totalStrokes,
    totalPar: entry.totalPar,
  })));
  const recentForm = appearances.slice(0, 3).map((entry) => ({
    roundId: entry.roundId,
    courseName: entry.courseName,
    totalStrokes: entry.totalStrokes,
    toPar: entry.toPar,
    completedAt: entry.completedAt,
  }));
  const hardestHoles = [...holeMap.values()]
    .map((entry) => ({
      holeNumber: entry.holeNumber,
      par: entry.par,
      averageScore: roundValue(entry.totalStrokes / entry.rounds, 2),
      averageToPar: roundValue(entry.totalToPar / entry.rounds, 2),
      rounds: entry.rounds,
    }))
    .sort((left, right) => (right.averageToPar ?? -999) - (left.averageToPar ?? -999) || left.holeNumber - right.holeNumber)
    .slice(0, 3);
  const bestHoles = [...holeMap.values()]
    .map((entry) => ({
      holeNumber: entry.holeNumber,
      par: entry.par,
      averageScore: roundValue(entry.totalStrokes / entry.rounds, 2),
      averageToPar: roundValue(entry.totalToPar / entry.rounds, 2),
      rounds: entry.rounds,
    }))
    .sort((left, right) => (left.averageToPar ?? 999) - (right.averageToPar ?? 999) || left.holeNumber - right.holeNumber)
    .slice(0, 3);
  const strokesGained = ["driving", "approach", "putting"].reduce((result, key) => {
    const values = appearances
      .map((entry) => entry.strokesGained?.[key]?.value)
      .filter((value) => typeof value === "number");
    const averageValue = values.length ? roundValue(average(values), 1) || 0 : 0;
    result[key] = {
      value: averageValue,
      label: averageValue >= 0.6 ? "Gaining" : averageValue <= -0.6 ? "Losing" : "Neutral",
    };
    return result;
  }, {});
  const rankedGains = Object.entries(strokesGained).sort((left, right) => right[1].value - left[1].value);

  const derived = {
    roundsPlayed: appearances.length,
    averageScore: average(appearances.map((entry) => entry.totalStrokes).filter(Boolean)),
    bestRound: appearances.length ? Math.min(...appearances.map((entry) => entry.totalStrokes).filter(Boolean)) : null,
    recentForm,
    recentFormSummary: buildRecentFormSummary(recentForm),
    fairwayPercentage: percentage(totalFairwaysHit, totalFairwayOpportunities),
    girPercentage: percentage(totalGreensHit, totalGirOpportunities),
    averagePutts: totalPlayedHoles ? roundValue(totalPutts / totalPlayedHoles, 2) : null,
    penaltiesAverage: appearances.length ? roundValue(totalPenalties / appearances.length, 2) : 0,
    upAndDownRate: percentage(totalUpAndDowns, totalUpAndDownOpportunities),
    sandSaveCount: totalSandSaves,
    scoringByParType,
    hardestHoles,
    bestHoles,
    recentTrend,
    formLabel: recentTrend.label,
    trendSummary: recentTrend.summary,
    handicapIndex,
    strokesGained: {
      ...strokesGained,
      total: roundValue(
        (strokesGained.driving?.value || 0)
        + (strokesGained.approach?.value || 0)
        + (strokesGained.putting?.value || 0),
        1
      ) || 0,
      bestCategory: rankedGains[0]?.[0] || "driving",
      weakestCategory: rankedGains[rankedGains.length - 1]?.[0] || "putting",
    },
  };

  return {
    ...derived,
    smartInsights: buildPerformanceInsights({
      fairwayPercentage: derived.fairwayPercentage,
      girPercentage: derived.girPercentage,
      averagePutts: derived.averagePutts,
      penaltiesAverage: derived.penaltiesAverage,
      upAndDownRate: derived.upAndDownRate,
      scoringByParType: derived.scoringByParType,
      hardestHoles: derived.hardestHoles,
      recentTrend: derived.recentTrend,
      formLabel: derived.formLabel,
      strokesGained: derived.strokesGained,
    }),
  };
}
function getProfileById(state, profileId) {
  return state.profiles?.find((profile) => profile.id === profileId) || null;
}
function getCurrentProfile(state) {
  return getProfileById(state, state.currentUser.profileId);
}
function getProfileForPlayer(state, player) {
  return player?.profileId ? getProfileById(state, player.profileId) : null;
}
function buildProfileRoundStats(state, profileId) {
  const profile = getProfileById(state, profileId);
  const appearances = state.rounds
    .filter((round) => round.status === "completed")
    .map((round) => {
      const participantId = getScoringParticipantId(round, profileId);
      if (!participantId) {
        return null;
      }

      const totals = getParticipantTotals(round, participantId);
      return {
        roundId: round.id,
        courseName: round.courseName,
        completedAt: round.completedAt || round.updatedAt || round.createdAt,
        totalStrokes: totals.totalStrokes,
        totalPar: totals.totalPar,
        toPar: totals.toPar,
        fairwaysHit: totals.fairwaysHit,
        fairwayOpportunities: totals.fairwayOpportunities,
        greensHit: totals.greensHit,
        girOpportunities: totals.girOpportunities,
        totalPutts: totals.totalPutts,
        holesPlayed: totals.holesPlayed,
        totalPenalties: totals.totalPenalties,
        upAndDownSuccesses: totals.upAndDownSuccesses,
        upAndDownOpportunities: totals.upAndDownOpportunities,
        sandSaveCount: totals.sandSaveCount,
        scoringByParType: totals.scoringByParType,
        holeDetails: totals.holeDetails,
        strokesGained: totals.strokesGained,
      };
    })
    .filter(Boolean)
    .sort((left, right) => (right.completedAt || 0) - (left.completedAt || 0));

  const derived = buildDerivedStatsFromAppearances(appearances);
  return profile ? mergeWithStoredProfileStats(profile, derived, state.currentUser.id) : derived;
}
function buildCompetitivePreview(state, profileId, opponentProfileId = null) {
  const profile = getProfileById(state, profileId);
  if (!profile) {
    return null;
  }

  const stats = buildProfileRoundStats(state, profileId);
  const headToHeadRounds = opponentProfileId
    ? state.rounds.filter((round) => {
        const profileIds = new Set(round.players.map((player) => player.profileId));
        return profileIds.has(profileId) && profileIds.has(opponentProfileId);
      }).length
    : 0;

  return {
    profileId: profile.id,
    displayName: profile.publicProfile.displayName,
    username: profile.publicProfile.username,
    avatarLabel: profile.publicProfile.avatarLabel,
    roundsPlayed: stats.roundsPlayed,
    averageScore: stats.averageScore,
    bestRound: stats.bestRound,
    recentFormSummary: stats.recentFormSummary,
    recentForm: profile.privateProfile.privacy.showRecentForm ? stats.recentForm : [],
    fairwayPercentage: stats.fairwayPercentage,
    girPercentage: stats.girPercentage,
    averagePutts: stats.averagePutts,
    penaltiesAverage: stats.penaltiesAverage,
    upAndDownRate: stats.upAndDownRate,
    sandSaveCount: stats.sandSaveCount,
    scoringByParType: stats.scoringByParType,
    hardestHoles: stats.hardestHoles,
    bestHoles: stats.bestHoles,
    strokesGained: stats.strokesGained,
    formLabel: stats.formLabel,
    trendSummary: stats.trendSummary,
    handicapIndex: profile.privateProfile.privacy.showHandicap ? stats.handicapIndex : null,
    smartInsights: stats.smartInsights,
    headToHeadLabel: opponentProfileId
      ? `${headToHeadRounds} shared rounds tracked`
      : "Head-to-head comparison ready",
    homeCourse: profile.privateProfile.privacy.showHomeCourse ? profile.publicProfile.homeCourse : "",
    handicap: profile.privateProfile.privacy.showHandicap ? profile.publicProfile.handicap : null,
    bio: profile.privateProfile.privacy.showBio ? profile.publicProfile.bio : "",
  };
}
function buildPlayerComparison(state, leftProfileId, rightProfileId) {
  const left = buildCompetitivePreview(state, leftProfileId, rightProfileId);
  const right = buildCompetitivePreview(state, rightProfileId, leftProfileId);

  if (!left || !right) {
    return null;
  }

  return {
    left,
    right,
    metricRows: [
      {
        label: "Average score",
        left: left.averageScore,
        right: right.averageScore,
      },
      {
        label: "Fairways",
        left: left.fairwayPercentage,
        right: right.fairwayPercentage,
      },
      {
        label: "GIR",
        left: left.girPercentage,
        right: right.girPercentage,
      },
      {
        label: "Putts",
        left: left.averagePutts,
        right: right.averagePutts,
      },
      {
        label: "Form",
        left: left.formLabel,
        right: right.formLabel,
      },
      {
        label: "Driving",
        left: left.strokesGained?.driving?.value,
        right: right.strokesGained?.driving?.value,
      },
    ],
  };
}
function syncCurrentUserProfile(draft) {
  const existing = draft.profiles.find((profile) => profile.id === draft.currentUser.profileId);
  const payload = {
    userId: draft.currentUser.id,
    displayName: draft.currentUser.displayName || draft.currentUser.name,
    username: draft.currentUser.username,
    avatarLabel: draft.currentUser.avatarLabel || draft.currentUser.avatar || avatarFromName(draft.currentUser.name),
    email: draft.currentUser.email || "",
    homeCourse: draft.currentUser.homeCourse || "",
    handicap: draft.currentUser.handicap ?? null,
    bio: draft.currentUser.bio || "",
    createdAt: draft.currentUser.createdAt,
    premiumStatus: draft.currentUser.subscription?.tier || draft.currentUser.premiumStatus || "free",
    privacy: draft.currentUser.privacy || {},
  };

  const stats = buildProfileRoundStats(draft, draft.currentUser.profileId);

  if (!existing) {
    const profile = createPlayerProfile({
      ...payload,
      publicStats: stats,
      recentForm: stats.recentForm,
    });
    profile.id = draft.currentUser.profileId;
    profile.account.authProviders = [...(draft.auth?.linkedProviders || [])];
    draft.profiles.unshift(profile);
    return profile;
  }

  existing.userId = draft.currentUser.id;
  existing.displayName = payload.displayName;
  existing.username = payload.username.startsWith("@") ? payload.username : `@${payload.username}`;
  existing.avatarLabel = payload.avatarLabel;
  existing.account = {
    ...existing.account,
    email: payload.email,
    createdAt: payload.createdAt,
    premiumStatus: payload.premiumStatus,
    authProviders: [...(draft.auth?.linkedProviders || [])],
  };
  existing.privateProfile = {
    ...existing.privateProfile,
    homeCourse: payload.homeCourse,
    handicap: payload.handicap,
    bio: payload.bio,
    privacy: {
      ...existing.privateProfile.privacy,
      ...(draft.currentUser.privacy || {}),
    },
  };
  existing.publicProfile = {
    ...existing.publicProfile,
    displayName: payload.displayName,
    username: payload.username.startsWith("@") ? payload.username : `@${payload.username}`,
    avatarLabel: payload.avatarLabel,
    homeCourse: payload.homeCourse,
    handicap: payload.handicap,
    bio: payload.bio,
    roundsPlayed: stats.roundsPlayed,
    averageScore: stats.averageScore,
    bestRound: stats.bestRound,
    recentFormSummary: stats.recentFormSummary,
    fairwayPercentage: stats.fairwayPercentage,
    girPercentage: stats.girPercentage,
    averagePutts: stats.averagePutts,
    penaltiesAverage: stats.penaltiesAverage,
    upAndDownRate: stats.upAndDownRate,
    sandSaveCount: stats.sandSaveCount,
    scoringByParType: stats.scoringByParType,
    hardestHoles: stats.hardestHoles,
    bestHoles: stats.bestHoles,
    strokesGained: stats.strokesGained,
    formLabel: stats.formLabel,
    trendSummary: stats.trendSummary,
    handicapIndex: stats.handicapIndex,
    smartInsights: stats.smartInsights,
    recentForm: stats.recentForm,
  };
  existing.updatedAt = Date.now();
  return existing;
}
function ensureProfilesForNames(draft, players) {
  return players.map((player) => {
    const displayName = String(player?.displayName || player?.name || player || "").trim();
    const currentDisplayName = draft.currentUser.displayName || draft.currentUser.name;

    if (displayName.toLowerCase() === currentDisplayName.toLowerCase()) {
      return {
        profileId: draft.currentUser.profileId,
        userId: draft.currentUser.id,
        displayName: currentDisplayName,
        username: draft.currentUser.username,
        avatarLabel: draft.currentUser.avatarLabel || draft.currentUser.avatar || avatarFromName(currentDisplayName),
      };
    }

    const existing = draft.profiles.find((profile) =>
      profile.publicProfile.displayName.toLowerCase() === displayName.toLowerCase()
      || profile.publicProfile.username.toLowerCase() === String(player?.username || normalizeUsername(displayName)).toLowerCase()
    );

    if (existing) {
      return {
        profileId: existing.id,
        userId: existing.userId,
        displayName: existing.publicProfile.displayName,
        username: existing.publicProfile.username,
        avatarLabel: existing.publicProfile.avatarLabel,
      };
    }

    const created = createPlayerProfile({
      displayName,
      username: player?.username || normalizeUsername(displayName),
      avatarLabel: player?.avatarLabel || player?.avatar || avatarFromName(displayName),
      bio: "Competitive profile ready for shared rounds and stats.",
      privacy: {
        showHomeCourse: false,
        showHandicap: false,
        showBio: true,
        showRecentForm: true,
      },
    });
    draft.profiles.push(created);

    return {
      profileId: created.id,
      userId: created.userId,
      displayName: created.publicProfile.displayName,
      username: created.publicProfile.username,
      avatarLabel: created.publicProfile.avatarLabel,
    };
  });
}
function refreshProfileSnapshots(draft) {
  draft.profiles.forEach((profile) => {
    const stats = buildProfileRoundStats(draft, profile.id);
    profile.publicProfile = {
      ...profile.publicProfile,
      roundsPlayed: stats.roundsPlayed,
      averageScore: stats.averageScore,
      bestRound: stats.bestRound,
      recentFormSummary: stats.recentFormSummary,
      fairwayPercentage: stats.fairwayPercentage,
      girPercentage: stats.girPercentage,
      averagePutts: stats.averagePutts,
      penaltiesAverage: stats.penaltiesAverage,
      upAndDownRate: stats.upAndDownRate,
      sandSaveCount: stats.sandSaveCount,
      scoringByParType: stats.scoringByParType,
      hardestHoles: stats.hardestHoles,
      bestHoles: stats.bestHoles,
      strokesGained: stats.strokesGained,
      formLabel: stats.formLabel,
      trendSummary: stats.trendSummary,
      handicapIndex: stats.handicapIndex,
      smartInsights: stats.smartInsights,
      recentForm: profile.privateProfile.privacy.showRecentForm ? stats.recentForm : [],
    };
    profile.account = {
      ...profile.account,
      premiumStatus: profile.userId === draft.currentUser.id
        ? draft.currentUser.subscription?.tier || draft.currentUser.premiumStatus || "free"
        : profile.account.premiumStatus || "free",
    };
    profile.updatedAt = Date.now();
  });
}

// ---- src/services/mock-api.js ----
const seededRooms = [
  {
    inviteCode: "WIND7",
    title: "Saturday Wind Game",
    courseName: "Lakeview Downs",
    weather: "Windy 64F",
    mode: "stroke",
    players: [
      { displayName: "Reese Hall", username: "@reesehall", avatarLabel: "RH" },
      { displayName: "Maya Chen", username: "@mayachen", avatarLabel: "MC" },
      { displayName: "Theo Grant", username: "@theogrant", avatarLabel: "TG" },
    ],
    distance: "2.8 mi",
  },
  {
    inviteCode: "MATCH9",
    title: "Twilight Match",
    courseName: "North Point",
    weather: "Clear 70F",
    mode: "match",
    players: [
      { displayName: "Jordan Wells", username: "@jordanwells", avatarLabel: "JW" },
      { displayName: "Parker Cole", username: "@parkercole", avatarLabel: "PC" },
      { displayName: "Emery Shaw", username: "@emeryshaw", avatarLabel: "ES" },
      { displayName: "Drew Cain", username: "@drewcain", avatarLabel: "DC" },
    ],
    distance: "6.1 mi",
  },
  {
    inviteCode: "SCRAM8",
    title: "Sunday Scramble",
    courseName: "Red Cedar Club",
    weather: "Warm 78F",
    mode: "scramble",
    players: [
      { displayName: "Cameron Vale", username: "@cameronvale", avatarLabel: "CV" },
      { displayName: "Skye Rivers", username: "@skyerivers", avatarLabel: "SR" },
      { displayName: "Luca Gray", username: "@lucagray", avatarLabel: "LG" },
      { displayName: "Noah Kane", username: "@noahkane", avatarLabel: "NK" },
    ],
    distance: "9.4 mi",
  },
];

function getProfileVisibility(profile) {
  return profile?.privateProfile?.privacy?.profileVisibility || "friends";
}

function isProfileDiscoverable(profile) {
  return getProfileVisibility(profile) !== "private";
}

function buildActiveRoundMap(state) {
  const activeByProfileId = new Map();

  state.groups.forEach((group) => {
    const round = state.rounds.find((item) => item.id === group.roundId);
    if (!round || round.status !== "active") {
      return;
    }

    round.players.forEach((player) => {
      if (!player.profileId) {
        return;
      }

      activeByProfileId.set(player.profileId, {
        round,
        group,
        player,
      });
    });
  });

  return activeByProfileId;
}

function generateInviteCode(existingCodes) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  while (!code || existingCodes.has(code)) {
    code = Array.from({ length: 6 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  }

  return code;
}
function hostRoundGroup({ state, round }) {
  const existingCodes = new Set(state.groups.map((group) => group.inviteCode));
  const inviteCode = generateInviteCode(existingCodes);
  const group = createGroup({
    round,
    currentUser: state.currentUser,
    inviteCode,
    transport: "invite",
    status: "hosting",
  });

  return { inviteCode, group };
}
function joinByInviteCode({ code, state }) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  const localGroup = state.groups.find((group) => group.inviteCode === normalized);
  if (localGroup) {
    const round = state.rounds.find((item) => item.id === localGroup.roundId);
    return {
      source: "local",
      group: localGroup,
      round,
      notice: `Joined ${localGroup.title} from local device storage.`,
    };
  }

  const seeded = seededRooms.find((room) => room.inviteCode === normalized);
  if (!seeded) {
    return null;
  }

  const remoteRound = createRound({
    currentUser: state.currentUser,
    courseName: seeded.courseName,
    teeBox: "Blue",
    weather: seeded.weather,
    mode: seeded.mode,
    players: ensureProfilesForNames(state, [state.currentUser.displayName || state.currentUser.name, ...seeded.players]),
    syncTransport: "cloud",
  });
  remoteRound.inviteCode = seeded.inviteCode;
  remoteRound.sync = {
    state: "connected",
    transport: "cloud",
    label: CONNECTION_COPY.cloud,
    lastEventAt: Date.now(),
    note: "Joined devices keep their own safe local card even if the original host leaves.",
    hostRequired: false,
    hostOptional: true,
    saveState: "saved-local",
    pendingActionCount: 0,
    lastLocalSaveAt: Date.now(),
    lastSyncedAt: 0,
    lastSyncError: "",
    conflictStrategy: "latest-write-wins",
  };

  const group = createGroup({
    round: remoteRound,
    currentUser: state.currentUser,
    inviteCode: seeded.inviteCode,
    transport: "cloud",
    status: "joined",
  });
  group.title = seeded.title;
  group.members.forEach((member) => {
    member.connectionState = member.role === "host" ? "connected" : "connected";
  });

  return {
    source: "seeded",
    group,
    round: remoteRound,
    notice: `Joined ${seeded.title} via invite code.`,
  };
}
function listNearbyGames(state) {
  const localCards = state.groups
    .map((group) => {
      const round = state.rounds.find((item) => item.id === group.roundId);
      if (!round || round.status !== "active") {
        return null;
      }

      return {
        inviteCode: group.inviteCode,
        title: group.title,
        courseName: round.courseName,
        modeLabel: GAME_MODES[round.mode].label,
        transport: CONNECTION_COPY[group.transport] || CONNECTION_COPY.invite,
        distance: "On device",
        source: "local",
        playerCount: round.players.length,
        hostName: group.members[0]?.displayName || round.players[0]?.name || "Host golfer",
        statusLabel: `Hole ${round.currentHole} / ${round.players.length} golfers`,
      };
    })
    .filter(Boolean);

  const seededCards = seededRooms.map((room) => ({
    inviteCode: room.inviteCode,
    title: room.title,
    courseName: room.courseName,
    modeLabel: GAME_MODES[room.mode].label,
    transport: CONNECTION_COPY.cloud,
    distance: room.distance,
    source: "seeded",
    playerCount: room.players.length,
    hostName: room.players[0]?.displayName || "Host golfer",
    statusLabel: `${room.players.length} golfers nearby`,
  }));

  return [...localCards, ...seededCards];
}
function listNearbyPlayers(state) {
  const activeRoundMap = buildActiveRoundMap(state);

  return (state.profiles || [])
    .filter((profile) => profile.id !== state.currentUser.profileId)
    .filter((profile) => isProfileDiscoverable(profile) || activeRoundMap.has(profile.id))
    .map((profile) => {
      const active = activeRoundMap.get(profile.id);
      const showHomeCourse = profile.privateProfile?.privacy?.showHomeCourse !== false;
      const showHandicap = profile.privateProfile?.privacy?.showHandicap !== false;
      const roundsPlayed = profile.publicProfile?.roundsPlayed || 0;
      const averageScore = profile.publicProfile?.averageScore;

      return {
        profileId: profile.id,
        displayName: profile.publicProfile.displayName,
        username: profile.publicProfile.username,
        avatarLabel: profile.publicProfile.avatarLabel,
        homeCourse: showHomeCourse ? profile.publicProfile.homeCourse || "" : "",
        handicap: showHandicap ? profile.publicProfile.handicap : null,
        recentFormSummary: profile.publicProfile.recentFormSummary || "Competitive profile ready",
        statsSummary: roundsPlayed
          ? `${roundsPlayed} rounds / ${typeof averageScore === "number" ? averageScore.toFixed(1) : "--"} avg`
          : "New public player card",
        statusLabel: active
          ? "In a live nearby round"
          : roundsPlayed
            ? "Recently active"
            : "Available to join",
        detail: active
          ? `${active.round.courseName} / Hole ${active.round.currentHole}`
          : profile.publicProfile.recentFormSummary || "Public profile ready",
        inviteCode: active?.group.inviteCode || active?.round.inviteCode || "",
        isLive: Boolean(active),
        updatedAt: profile.updatedAt || 0,
      };
    })
    .sort((left, right) =>
      Number(right.isLive) - Number(left.isLive)
      || (right.updatedAt || 0) - (left.updatedAt || 0)
      || right.displayName.localeCompare(left.displayName)
    );
}
function getGearRecommendations(weather) {
  const lower = String(weather || "").toLowerCase();
  const recommendations = [
    "Rangefinder",
    "Alignment sticks",
    "Microfiber towel",
  ];

  if (lower.includes("wind")) {
    recommendations.push("Wind shell", "Low-spin ball sleeve");
  }

  if (lower.includes("rain")) {
    recommendations.push("Rain gloves", "Umbrella");
  }

  if (lower.includes("cold")) {
    recommendations.push("Quarter zip", "Hand warmers");
  }

  if (lower.includes("warm") || lower.includes("hot")) {
    recommendations.push("Cooling polo", "Electrolyte bottle");
  }

  return recommendations;
}

// ---- src/services/sync-service.js ----
function createSyncService({ store }) {
  const clientId = `client-${Date.now()}`;
  let broadcastChannel = null;
  let simulationTimer = null;

  function init() {
    if ("BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("golfers-nation-sync");
      broadcastChannel.addEventListener("message", handleBroadcastMessage);
    }

    simulationTimer = window.setInterval(simulateRemoteProgress, 12000);
  }

  function teardown() {
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }

    if (simulationTimer) {
      clearInterval(simulationTimer);
      simulationTimer = null;
    }
  }

  function handleBroadcastMessage(event) {
    const payload = event.data;
    if (!payload || payload.clientId === clientId || payload.type !== "round-sync") {
      return;
    }

    store.setState((draft) => {
      const round = draft.rounds.find((item) => item.id === payload.roundId);
      if (!round) {
        return draft;
      }

      round.sync.lastEventAt = payload.at;
      round.sync.state = "connected";
      round.sync.note = "Cross-tab sync event received.";
      draft.social.activity.unshift(
        createActivity({
          type: "sync",
          message: `${round.courseName} received a shared update.`,
        })
      );
      draft.social.activity = draft.social.activity.slice(0, 16);
      return draft;
    }, { reason: "broadcast-received" });
  }

  function broadcastRoundUpdate(round) {
    if (!broadcastChannel) {
      return;
    }

    broadcastChannel.postMessage({
      type: "round-sync",
      clientId,
      roundId: round.id,
      at: Date.now(),
    });
  }

  function updateTransport(roundId, transport, stateLabel) {
    store.setState((draft) => {
      const round = draft.rounds.find((item) => item.id === roundId);
      if (!round) {
        return draft;
      }

      round.sync.transport = transport;
      round.sync.label = CONNECTION_COPY[transport] || CONNECTION_COPY.local;
      round.sync.state = stateLabel;
      round.sync.lastEventAt = Date.now();
      round.sync.note = "Sync transport changed through the current device sync layer.";

      const group = draft.groups.find((item) => item.roundId === roundId);
      if (group) {
        group.transport = transport;
        group.status = stateLabel;
        group.updatedAt = Date.now();
      }

      draft.social.activity.unshift(
        createActivity({
          type: "sync",
          message: `${round.courseName} is now using ${round.sync.label}.`,
        })
      );
      draft.social.activity = draft.social.activity.slice(0, 16);
      return draft;
    }, { reason: "transport-updated" });
  }

  function enableNearbyPrototype(roundId) {
    updateTransport(roundId, "nearby", "connected");
  }

  async function tryBluetoothPrototype(roundId) {
    if (!navigator.bluetooth) {
      updateTransport(roundId, "nearby", "connected");
      store.setState((draft) => {
        draft.social.activity.unshift(
          createActivity({
            type: "sync",
            message: "Browser Bluetooth is unavailable. Nearby sync stayed active instead.",
          })
        );
        draft.social.activity = draft.social.activity.slice(0, 16);
        return draft;
      }, { reason: "bluetooth-fallback" });
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
      });

      store.setState((draft) => {
        const round = draft.rounds.find((item) => item.id === roundId);
        if (!round) {
          return draft;
        }

        round.sync.transport = "bluetooth";
        round.sync.label = CONNECTION_COPY.bluetooth;
        round.sync.state = "connected";
        round.sync.lastEventAt = Date.now();
        round.sync.note = `${device.name || "Nearby device"} linked through browser Bluetooth.`;
        draft.social.activity.unshift(
          createActivity({
            type: "sync",
            message: `${device.name || "Nearby device"} linked for Bluetooth sync.`,
          })
        );
        draft.social.activity = draft.social.activity.slice(0, 16);
        return draft;
      }, { reason: "bluetooth-connected" });
    } catch (error) {
      updateTransport(roundId, "invite", "hosting");
      store.setState((draft) => {
        draft.social.activity.unshift(
          createActivity({
            type: "sync",
            message: "Bluetooth request canceled. Invite-code sync remains the primary path.",
          })
        );
        draft.social.activity = draft.social.activity.slice(0, 16);
        return draft;
      }, { reason: "bluetooth-canceled" });
    }
  }

  function notifyRoundUpdated(roundId) {
    const round = store.getState().rounds.find((item) => item.id === roundId);
    if (!round) {
      return;
    }

    broadcastRoundUpdate(round);
  }

  function simulateRemoteProgress() {
    const state = store.getState();
    const activeRound = state.rounds.find((round) => round.id === state.session.activeRoundId);
    if (!activeRound || activeRound.status !== "active" || activeRound.sync.transport === "local") {
      return;
    }

    const participants = getScoringParticipants(activeRound);
    const localIds = new Set(getLocalParticipantIds(activeRound, state.currentUser.id));
    const remoteParticipants = participants.filter((participant) => !localIds.has(participant.id));
    if (!remoteParticipants.length) {
      return;
    }

    const target = remoteParticipants[Math.floor(Math.random() * remoteParticipants.length)];
    const targetHole = activeRound.holes.find((hole) => {
      const entry = hole.entries.find((item) => item.participantId === target.id);
      return entry && (entry.strokes === null || entry.strokes === 0);
    });

    if (!targetHole) {
      return;
    }

    const par = targetHole.par;
    const strokes = par + [-1, 0, 0, 1][Math.floor(Math.random() * 4)];
    const putts = Math.max(1, Math.min(3, strokes - (par - 2)));

    store.setState((draft) => {
      const round = draft.rounds.find((item) => item.id === activeRound.id);
      if (!round) {
        return draft;
      }

      applyHoleUpdate(round, targetHole.number, target.id, {
        strokes,
        putts,
        fairwayHit: targetHole.par > 3 ? strokes <= par : false,
        gir: strokes <= par,
      });
      round.sync.lastEventAt = Date.now();

      const group = draft.groups.find((item) => item.roundId === round.id);
      if (group) {
        group.updatedAt = Date.now();
        group.feed.unshift(
          createActivity({
            type: "sync",
            message: `${target.name} updated hole ${targetHole.number}.`,
          })
        );
        group.feed = group.feed.slice(0, 12);
      }

      draft.social.activity.unshift(
        createActivity({
          type: "sync",
          message: `${target.name} posted a live update on hole ${targetHole.number}.`,
        })
      );
      draft.social.activity = draft.social.activity.slice(0, 16);
      return draft;
    }, { reason: "remote-progress" });
  }

  return {
    init,
    teardown,
    enableNearbyPrototype,
    tryBluetoothPrototype,
    notifyRoundUpdated,
    updateTransport,
  };
}

// ---- src/services/round-flow-service.js ----
const HOSTED_ROUND_NOTE = "Invite code is live. The original host can leave and every joined golfer still keeps a safe local card.";
const JOINED_ROUND_NOTE = "This device now carries its own safe copy of the live round, even if the original host leaves.";
function parsePlayers(value, currentUserName) {
  const names = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const deduped = [];
  const seen = new Set();

  names.forEach((name) => {
    const normalized = name.toLowerCase();
    if (seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    deduped.push(name);
  });

  if (!seen.has(currentUserName.toLowerCase())) {
    deduped.unshift(currentUserName);
    seen.add(currentUserName.toLowerCase());
  } else {
    const currentIndex = deduped.findIndex((name) => name.toLowerCase() === currentUserName.toLowerCase());
    if (currentIndex > 0) {
      const [currentName] = deduped.splice(currentIndex, 1);
      deduped.unshift(currentName);
    }
  }

  const adjustments = [];
  if (deduped.length < 2) {
    deduped.push("Maya Chen");
    adjustments.push("A second golfer was added so the round is ready for a real scorecard.");
  }

  if (deduped.length > 4) {
    deduped.length = 4;
    adjustments.push("This build keeps live rounds to four golfers, so only the first four names were used.");
  }

  return {
    names: deduped,
    note: adjustments.join(" "),
  };
}
function getDefaultRoundSetup() {
  const featuredCourse = findCourseById(FEATURED_COURSE_ID);
  const featuredTeeBox = featuredCourse ? getDefaultTeeBox(featuredCourse) : null;

  return {
    courseQuery: "",
    selectedCourseId: featuredCourse?.id || "",
    selectedTeeBoxId: featuredTeeBox?.id || "",
  };
}
function getRoundSetupState(state) {
  return {
    ...getDefaultRoundSetup(),
    ...(state.session?.roundSetup || {}),
  };
}
function resetRoundSetup(draft) {
  draft.session.roundSetup = getDefaultRoundSetup();
}
function setSelectedCourse(draft, courseId, teeBoxId = "") {
  const course = findCourseById(courseId);
  if (!course) {
    draft.session.roundSetup = {
      ...getRoundSetupState(draft),
      selectedCourseId: "",
      selectedTeeBoxId: "",
    };
    return;
  }

  const defaultTee = getDefaultTeeBox(course);
  draft.session.roundSetup = {
    ...getRoundSetupState(draft),
    selectedCourseId: course.id,
    selectedTeeBoxId: teeBoxId || defaultTee?.id || "",
  };
}
function focusRoundView(draft, roundId, profileId, setActiveView) {
  draft.session.activeRoundId = roundId;
  draft.session.selectedHole = 1;
  draft.session.selectedProfileId = profileId;
  setActiveView(draft, "round", "focus-round");
}
function upsertJoinedRoundIntoState(draft, joined) {
  if (!joined?.round) {
    return;
  }

  const roundIndex = draft.rounds.findIndex((round) =>
    round.id === joined.round.id
      || (joined.round.inviteCode && round.inviteCode === joined.round.inviteCode)
  );

  if (roundIndex >= 0) {
    draft.rounds[roundIndex] = joined.round;
  } else {
    draft.rounds.unshift(joined.round);
  }

  if (!joined.group) {
    return;
  }

  const groupIndex = draft.groups.findIndex((group) =>
    group.id === joined.group.id
      || group.roundId === joined.round.id
      || (joined.group.inviteCode && group.inviteCode === joined.group.inviteCode)
  );

  if (groupIndex >= 0) {
    draft.groups[groupIndex] = joined.group;
  } else {
    draft.groups.unshift(joined.group);
  }
}
function applyHostedRoundState(round, inviteCode) {
  round.inviteCode = inviteCode;
  round.sync.transport = "invite";
  round.sync.label = "Invite code";
  round.sync.state = "hosting";
  round.sync.lastEventAt = Date.now();
  round.sync.note = HOSTED_ROUND_NOTE;
}
function ensureHostedGroupForRound(draft, round) {
  const existing = draft.groups.find((group) => group.roundId === round.id);
  if (existing) {
    round.groupId = existing.id;
    applyHostedRoundState(round, existing.inviteCode);
    return {
      group: existing,
      created: false,
    };
  }

  const hosted = hostRoundGroup({ state: draft, round });
  round.groupId = hosted.group.id;
  applyHostedRoundState(round, hosted.inviteCode);
  draft.groups.unshift(hosted.group);

  return {
    group: hosted.group,
    created: true,
  };
}
function applyJoinedRoundConnectionState(round, source) {
  round.sync.lastEventAt = Date.now();
  round.sync.state = "connected";
  round.sync.transport = source === "local" ? "invite" : "cloud";
  round.sync.label = source === "local" ? "Invite code" : "Live cloud sync";
  round.sync.note = JOINED_ROUND_NOTE;
}

// ---- src/services/backend-models.js ----
function toIsoTimestamp(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

function normalizePrivacy(privacy = {}) {
  return {
    show_home_course: Boolean(privacy.showHomeCourse),
    show_handicap: Boolean(privacy.showHandicap),
    show_bio: Boolean(privacy.showBio),
    show_recent_form: Boolean(privacy.showRecentForm),
    show_head_to_head: Boolean(privacy.showHeadToHead),
    show_email: Boolean(privacy.showEmail),
  };
}
function toBackendAccountRecord(account) {
  if (!account) {
    return null;
  }

  return {
    id: account.id,
    profile_id: account.profileId,
    display_name: account.displayName || account.name,
    username: account.username,
    email: account.email,
    provider: account.provider || account.providerType || "email",
    avatar_label: account.avatarLabel || "GN",
    avatar_url: account.avatarUrl || null,
    city: account.city || null,
    home_course: account.homeCourse || null,
    handicap: typeof account.handicap === "number" ? account.handicap : null,
    bio: account.bio || "",
    season_goal: account.seasonGoal || "",
    subscription_tier: account.subscription?.tier || account.premiumStatus || "free",
    subscription_status: account.subscription?.status || "active",
    billing_ready: Boolean(account.subscription?.billingReady),
    rounds_played: account.roundsPlayed || 0,
    average_score: typeof account.averageScore === "number" ? account.averageScore : null,
    best_round: typeof account.bestRound === "number" ? account.bestRound : null,
    recent_form_summary: account.recentFormSummary || "First round pending",
    privacy: normalizePrivacy(account.privacy),
    appearance: cloneData(account.appearance || {}),
    social_settings: cloneData(account.social || {}),
    seeded_demo: Boolean(account.seededDemo),
    created_at: toIsoTimestamp(account.createdAt),
    updated_at: toIsoTimestamp(Date.now()),
  };
}
function toBackendProfileRecord(profile) {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    user_id: profile.userId || null,
    display_name: profile.publicProfile?.displayName || "",
    username: profile.publicProfile?.username || "",
    avatar_label: profile.publicProfile?.avatarLabel || "GN",
    home_course: profile.publicProfile?.homeCourse || null,
    handicap: typeof profile.publicProfile?.handicap === "number" ? profile.publicProfile.handicap : null,
    bio: profile.publicProfile?.bio || "",
    rounds_played: profile.publicStats?.roundsPlayed || 0,
    average_score: typeof profile.publicStats?.averageScore === "number" ? profile.publicStats.averageScore : null,
    best_round: typeof profile.publicStats?.bestRound === "number" ? profile.publicStats.bestRound : null,
    recent_form_summary: profile.publicStats?.recentFormSummary || "First round pending",
    premium_status: profile.account?.premiumStatus || "free",
    privacy: normalizePrivacy(profile.privacy),
    created_at: toIsoTimestamp(profile.account?.createdAt || profile.createdAt),
    updated_at: toIsoTimestamp(Date.now()),
  };
}
function toBackendRoundRecord(round, userId = null) {
  if (!round) {
    return null;
  }

  return {
    id: round.id,
    owner_user_id: userId,
    group_id: round.groupId || null,
    tournament_id: round.tournamentId || null,
    invite_code: round.inviteCode || null,
    course_id: round.courseId || null,
    course_name: round.courseName,
    course_city: round.courseCity || null,
    course_state: round.courseState || null,
    course_region: round.courseRegion || null,
    course_latitude: typeof round.courseLatitude === "number" ? round.courseLatitude : null,
    course_longitude: typeof round.courseLongitude === "number" ? round.courseLongitude : null,
    course_source: round.courseSource || null,
    course_seeded: Boolean(round.courseSeeded),
    tee_box: round.teeBox,
    tee_box_id: round.teeBoxId || null,
    course_rating: typeof round.courseRating === "number" ? round.courseRating : null,
    course_slope: typeof round.courseSlope === "number" ? round.courseSlope : null,
    weather: round.weather,
    mode: round.mode,
    status: round.status,
    current_hole: round.currentHole || 1,
    sync: cloneData(round.sync || {}),
    event_log: cloneData(round.eventLog || []),
    conflict_strategy: round.sync?.conflictStrategy || "latest-write-wins",
    players: cloneData(round.players || []),
    sides: cloneData(round.sides || []),
    holes: cloneData(round.holes || []),
    created_at: toIsoTimestamp(round.createdAt),
    updated_at: toIsoTimestamp(round.updatedAt),
    completed_at: toIsoTimestamp(round.completedAt),
  };
}
function toBackendGroupRecord(group, userId = null) {
  if (!group) {
    return null;
  }

  return {
    id: group.id,
    owner_user_id: userId,
    round_id: group.roundId,
    invite_code: group.inviteCode,
    transport: group.transport,
    status: group.status,
    members: cloneData(group.members || []),
    feed: cloneData(group.feed || []),
    created_at: toIsoTimestamp(group.createdAt),
    updated_at: toIsoTimestamp(group.updatedAt),
  };
}
function toBackendLiveRoundSessionRecord({
  round,
  group = null,
  userId = null,
  sessionId = null,
} = {}) {
  if (!round?.inviteCode) {
    return null;
  }

  return {
    id: sessionId || group?.id || round.groupId || `live-session-${String(round.inviteCode).toLowerCase()}`,
    invite_code: round.inviteCode,
    round_id: round.id,
    host_user_id: group?.hostUserId || userId || null,
    updated_by_user_id: userId || null,
    course_name: round.courseName,
    mode: round.mode,
    status: group?.status || round.status || "active",
    round_state: cloneData(round),
    group_state: group ? cloneData(group) : null,
    created_at: toIsoTimestamp(group?.createdAt || round.createdAt || Date.now()),
    updated_at: toIsoTimestamp(Date.now()),
  };
}
function fromBackendLiveRoundSessionRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    inviteCode: record.invite_code,
    roundId: record.round_id,
    hostUserId: record.host_user_id,
    updatedByUserId: record.updated_by_user_id,
    courseName: record.course_name,
    mode: record.mode,
    status: record.status,
    round: cloneData(record.round_state || null),
    group: cloneData(record.group_state || null),
    createdAt: record.created_at ? Date.parse(record.created_at) : Date.now(),
    updatedAt: record.updated_at ? Date.parse(record.updated_at) : Date.now(),
  };
}
function toBackendTournamentRecord(tournament, userId = null) {
  if (!tournament) {
    return null;
  }

  return {
    id: tournament.id,
    owner_user_id: userId,
    linked_round_id: tournament.linkedRoundId || null,
    name: tournament.name,
    course_name: tournament.courseName,
    mode: tournament.mode,
    field_size: tournament.fieldSize,
    status: tournament.status,
    start_date: tournament.date,
    created_at: toIsoTimestamp(tournament.createdAt),
    updated_at: toIsoTimestamp(tournament.updatedAt),
  };
}
function toBackendGearRecord(item, userId = null) {
  if (!item) {
    return null;
  }

  return {
    id: item.id,
    owner_user_id: userId,
    category: item.category,
    name: item.name,
    notes: item.notes || "",
    weather_use: item.weatherUse || "",
    packed: Boolean(item.packed),
    created_at: toIsoTimestamp(item.createdAt),
    updated_at: toIsoTimestamp(item.updatedAt),
  };
}
function toBackendWorkspaceSnapshot(state, userId = state.auth?.activeUserId || state.currentUser?.id || null) {
  const account = (state.accounts || []).find((entry) => entry.id === userId) || state.currentUser || null;

  return {
    auth_user: toBackendAccountRecord(account),
    profiles: (state.profiles || []).map((profile) => toBackendProfileRecord(profile)).filter(Boolean),
    rounds: (state.rounds || []).map((round) => toBackendRoundRecord(round, userId)).filter(Boolean),
    groups: (state.groups || []).map((group) => toBackendGroupRecord(group, userId)).filter(Boolean),
    tournaments: (state.tournaments || []).map((tournament) => toBackendTournamentRecord(tournament, userId)).filter(Boolean),
    gear_items: (state.gear?.items || []).map((item) => toBackendGearRecord(item, userId)).filter(Boolean),
    social_activity: cloneData(state.social?.activity || []),
    session: {
      active_round_id: state.session?.activeRoundId || null,
      selected_hole: state.session?.selectedHole || 1,
      summary_round_id: state.session?.summaryRoundId || null,
      selected_profile_id: state.session?.selectedProfileId || null,
      updated_at: toIsoTimestamp(Date.now()),
    },
  };
}

// ---- src/services/auth-gateway.js ----
function getProviderFromSupabaseUser(user = {}) {
  return user?.app_metadata?.provider
    || user?.identities?.[0]?.provider
    || user?.user_metadata?.provider
    || "email";
}

function mapSupabaseUserToAccountFields(user = {}, overrides = {}) {
  const metadata = user?.user_metadata || {};
  const displayName = overrides.displayName
    || metadata.display_name
    || metadata.full_name
    || String(user?.email || "").split("@")[0]
    || "Golfer";
  const provider = overrides.provider || getProviderFromSupabaseUser(user);

  return {
    id: user.id,
    displayName,
    email: user.email || overrides.email || "",
    provider,
    avatarUrl: metadata.avatar_url || "",
    createdAt: user.created_at ? Date.parse(user.created_at) : Date.now(),
    homeCourse: metadata.home_course || "",
    handicap: typeof metadata.handicap === "number" ? metadata.handicap : null,
    handedness: metadata.handedness || "",
    bio: metadata.bio || "",
    city: metadata.city || "",
    seasonGoal: metadata.season_goal || "Finish your first round",
  };
}

async function ensureResolvedUser(bridge, result) {
  if (result?.user?.id) {
    return result;
  }

  const current = await bridge.getCurrentUser();
  if (current.error) {
    return current;
  }

  return {
    ...result,
    user: current.user,
    session: result?.session || current.session || null,
  };
}
function createLocalAuthGateway() {
  return {
    mode: "local-auth-adapter",
    backendReady: true,
    oauthProviders: ["google", "apple"],
    restoreSession(state) {
      return hydrateActiveAccountState(state);
    },
    signUpWithEmail(draft, fields) {
      const result = createEmailAccount(draft, fields);
      if (result.error) {
        return { error: result.error };
      }

      loadAccountIntoState(draft, result.account.id);
      return { account: result.account };
    },
    signInWithEmail(draft, fields) {
      const result = authenticateEmailAccount(draft, fields);
      if (result.error) {
        return { error: result.error };
      }

      loadAccountIntoState(draft, result.account.id);
      return { account: result.account };
    },
    signInWithProvider(draft, provider) {
      const result = signInWithMockProvider(draft, provider);
      if (result.error) {
        return { error: result.error };
      }

      loadAccountIntoState(draft, result.account.id);
      return { account: result.account };
    },
    signOut(draft) {
      signOutAccount(draft);
      return { status: "signed_out" };
    },
    useReviewAccount(draft, userId) {
      const loaded = loadAccountIntoState(draft, userId);
      if (!loaded) {
        return { error: "That review account is unavailable." };
      }

      return {
        account: draft.accounts.find((entry) => entry.id === userId) || null,
      };
    },
    togglePremiumForTesting(draft, userId) {
      const account = togglePremiumAccessForUser(draft, userId);
      if (!account) {
        return { error: "No active account is available." };
      }

      return { account };
    },
    listReviewAccounts(state) {
      return getReviewAccounts(state);
    },
  };
}
function createSupabaseAuthGateway({ bridge, fallback = createLocalAuthGateway() } = {}) {
  return {
    ...fallback,
    mode: "supabase-auth-adapter",
    restoreSession(state) {
      const next = hydrateActiveAccountState(state);
      const storedSession = bridge?.readStoredSession?.();
      if (!storedSession?.user?.id) {
        return next;
      }

      const account = upsertRemoteAccount(next, mapSupabaseUserToAccountFields(storedSession.user));
      if (!account) {
        return next;
      }

      ensureAccountWorkspace(next, account.id);
      loadAccountIntoState(next, account.id);
      next.auth.notice = `${account.displayName} restored from secure sign-in.`;
      return next;
    },
    async signUpWithEmailAsync(state, fields) {
      const result = await bridge.signUpWithEmail(fields);
      if (result.error) {
        return {
          error: result.error.message || "Account creation failed.",
        };
      }

      const resolved = await ensureResolvedUser(bridge, result);
      if (resolved.error) {
        return {
          error: resolved.error.message || "Account creation failed.",
        };
      }

      return {
        accountFields: mapSupabaseUserToAccountFields(resolved.user, {
          displayName: fields.displayName,
          email: fields.email,
          provider: "email",
        }),
        requiresConfirmation: !resolved.session,
        notice: resolved.session
          ? ""
          : "Account created. Check your email to confirm the account before logging in, or disable email confirmations in Supabase for tester builds.",
      };
    },
    async signInWithEmailAsync(state, fields) {
      const result = await bridge.signInWithEmail(fields);
      if (result.error) {
        return {
          error: result.error.message || "Login failed.",
        };
      }

      const resolved = await ensureResolvedUser(bridge, result);
      if (resolved.error) {
        return {
          error: resolved.error.message || "Login failed.",
        };
      }

      return {
        accountFields: mapSupabaseUserToAccountFields(resolved.user, {
          email: fields.email,
          provider: "email",
        }),
        requiresConfirmation: false,
        notice: "",
      };
    },
    commitAuthResult(draft, result) {
      if (result?.error) {
        return { error: result.error };
      }

      if (result?.requiresConfirmation) {
        draft.auth.mode = "login";
        draft.auth.error = "";
        draft.auth.notice = result.notice;
        return { account: null, requiresConfirmation: true };
      }

      const account = upsertRemoteAccount(draft, result.accountFields);
      if (!account) {
        return { error: "We could not prepare the signed-in golfer account." };
      }

      ensureAccountWorkspace(draft, account.id);
      loadAccountIntoState(draft, account.id);
      return { account };
    },
    async requestPasswordResetAsync(email) {
      const result = await bridge.requestPasswordReset(email);
      if (result.error) {
        return {
          error: result.error.message || "Password reset could not be started.",
        };
      }

      return {
        status: "sent",
      };
    },
    async signOutAsync() {
      const result = await bridge.signOut();
      if (result?.error) {
        return { error: result.error.message || "Sign out failed." };
      }

      return { status: "signed_out" };
    },
  };
}

// ---- src/services/data-gateway.js ----
function getSnapshotUserId(snapshot) {
  return snapshot.auth?.activeUserId || snapshot.currentUser?.id || null;
}
function createLocalDataGateway() {
  return {
    mode: "local-device-adapter",
    backendReady: true,
    loadInitialState(createDefaultState) {
      return loadPersistedState(createDefaultState);
    },
    prepareForPersistence(state) {
      return prepareStateForPersistence(state);
    },
    persist(snapshot) {
      persistAppState(snapshot);
      return snapshot;
    },
    saveWorkspace(draft, userId) {
      saveWorkspaceToVault(draft, userId);
      return draft;
    },
    exportWorkspaceSnapshot(state, userId) {
      return toBackendWorkspaceSnapshot(state, userId);
    },
    async submitTesterFeedbackAsync() {
      return {
        error: {
          status: 0,
          message: "Tester feedback needs the cloud data connection to be active first.",
          code: "feedback_not_configured",
        },
      };
    },
  };
}
function createSupabaseDataGateway({ bridge, fallback = createLocalDataGateway() } = {}) {
  let syncTimer = null;
  let pendingSync = null;

  async function writeRemoteSnapshot(snapshot, userId) {
    if (!bridge?.isConfigured?.() || !userId) {
      return { status: "skipped" };
    }

    const account = (snapshot.accounts || []).find((entry) => entry.id === userId) || snapshot.currentUser || null;
    const workspace = snapshot.accountVault?.[userId] || null;

    if (!account || !workspace) {
      return { status: "skipped" };
    }

    const profileResult = await bridge.upsertProfile(toBackendAccountRecord(account));
    if (profileResult?.error) {
      return profileResult;
    }

    const workspaceResult = await bridge.upsertWorkspace(userId, workspace);
    if (workspaceResult?.error) {
      return workspaceResult;
    }

    return { status: "synced" };
  }

  function scheduleRemoteSync(snapshot, userId = getSnapshotUserId(snapshot)) {
    if (!bridge?.isConfigured?.() || !userId) {
      return;
    }

    pendingSync = {
      snapshot,
      userId,
    };

    if (syncTimer) {
      return;
    }

    syncTimer = setTimeout(async () => {
      const queued = pendingSync;
      pendingSync = null;
      syncTimer = null;

      if (!queued) {
        return;
      }

      const result = await writeRemoteSnapshot(queued.snapshot, queued.userId);
      if (result?.error) {
        console.warn("[Golfers Nation] Supabase workspace sync failed.", result.error);
      }
    }, 350);
  }

  return {
    mode: "supabase-cloud-adapter",
    backendReady: true,
    loadInitialState(createDefaultState) {
      return fallback.loadInitialState(createDefaultState);
    },
    prepareForPersistence(state) {
      return fallback.prepareForPersistence(state);
    },
    persist(snapshot) {
      fallback.persist(snapshot);
      scheduleRemoteSync(snapshot);
      return snapshot;
    },
    saveWorkspace(draft, userId) {
      fallback.saveWorkspace(draft, userId);
      scheduleRemoteSync(fallback.prepareForPersistence(draft), userId);
      return draft;
    },
    exportWorkspaceSnapshot(state, userId) {
      return fallback.exportWorkspaceSnapshot(state, userId);
    },
    async submitTesterFeedbackAsync(state, payload) {
      if (!bridge?.isConfigured?.()) {
        return fallback.submitTesterFeedbackAsync?.(state, payload);
      }

      const userId = state?.auth?.activeUserId || state?.currentUser?.id || null;
      const response = await bridge.submitTesterFeedback({
        user_id: userId,
        tester_name: payload.testerName,
        email: payload.email,
        feedback_area: payload.feedbackArea,
        rating: Number(payload.rating) || 3,
        feedback_message: payload.feedbackMessage,
        app_version: payload.appVersion,
        plan_tier: payload.planTier,
        install_state: payload.installState,
        appearance_mode: payload.appearanceMode,
        theme_id: payload.themeId,
        context_view: payload.contextView,
        recent_activity: payload.recentActivity,
        user_agent: payload.userAgent,
        created_at: new Date().toISOString(),
      });

      if (response?.error) {
        return response;
      }

      return {
        status: "submitted",
        record: Array.isArray(response?.data) ? response.data[0] || null : response?.data || null,
      };
    },
    async hydrateAccountAsync(store, userId = store.getState().auth?.activeUserId || store.getState().currentUser?.id) {
      if (!bridge?.isConfigured?.() || !userId) {
        return { status: "skipped" };
      }

      const remote = await bridge.fetchWorkspace(userId);
      if (remote?.error) {
        return remote;
      }

      const currentState = store.getState();
      const pendingCloudSync = currentState.session?.cloudSync || {};
      const preserveLocalWorkspace = pendingCloudSync.userId === userId
        && ["syncing", "failed"].includes(pendingCloudSync.status)
        || workspaceHasPendingRoundSync({
          rounds: currentState.rounds,
        });

      store.setState((draft) => {
        if (remote.profile) {
          upsertRemoteAccount(draft, {
            id: remote.profile.id,
            displayName: remote.profile.display_name,
            username: remote.profile.username,
            email: remote.profile.email,
            provider: remote.profile.provider,
            avatarLabel: remote.profile.avatar_label,
            avatarUrl: remote.profile.avatar_url,
            city: remote.profile.city,
            homeCourse: remote.profile.home_course,
            handicap: typeof remote.profile.handicap === "number" ? remote.profile.handicap : null,
            bio: remote.profile.bio,
            seasonGoal: remote.profile.season_goal,
            createdAt: remote.profile.created_at ? Date.parse(remote.profile.created_at) : Date.now(),
            tier: remote.profile.subscription_tier || "free",
            appearance: remote.profile.appearance || {},
            social: remote.profile.social_settings || {},
            privacy: remote.profile.privacy || {},
          });
        } else {
          ensureAccountWorkspace(draft, userId);
        }

        if (preserveLocalWorkspace) {
          saveWorkspaceToVault(draft, userId);
        }

        if (remote.workspace && !preserveLocalWorkspace) {
          replaceAccountWorkspace(draft, userId, remote.workspace);
        } else {
          ensureAccountWorkspace(draft, userId);
        }

        loadAccountIntoState(draft, userId);
        return draft;
      }, { reason: "hydrate-supabase-account" });

      let syncWarning = null;
      if (!remote.workspace || preserveLocalWorkspace) {
        const bootstrapSync = await this.flushSyncAsync(store.getState(), userId);
        if (bootstrapSync?.error) {
          syncWarning = bootstrapSync.error;
        }
      }

      return syncWarning
        ? { status: "ready", syncWarning, preservedLocalWorkspace: preserveLocalWorkspace }
        : { status: "ready", preservedLocalWorkspace: preserveLocalWorkspace };
    },
    async flushSyncAsync(state, userId = getSnapshotUserId(state)) {
      if (syncTimer) {
        clearTimeout(syncTimer);
        syncTimer = null;
      }

      if (pendingSync && !state) {
        const queued = pendingSync;
        pendingSync = null;
        return writeRemoteSnapshot(queued.snapshot, queued.userId);
      }

      const prepared = state ? fallback.prepareForPersistence(state) : null;
      pendingSync = null;
      return writeRemoteSnapshot(prepared, userId);
    },
  };
}

// ---- src/services/realtime-gateway.js ----
const CHANNEL_PREFIX = "gn-live-round";
const SOCKET_PROTOCOL_VERSION = "1.0.0";
const HEARTBEAT_INTERVAL_MS = 20_000;
const RECONNECT_DELAY_MS = 1_500;
const SESSION_RECONCILE_INTERVAL_MS = 2_500;

function now() {
  return Date.now();
}

function normalizeInviteCode(value = "") {
  return String(value || "").trim().toUpperCase();
}

function normalizeComparable(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9]+/g, "");
}

function createRealtimeTopic(inviteCode) {
  return `${CHANNEL_PREFIX}:${normalizeInviteCode(inviteCode)}`;
}

function createRealtimeSocketUrl(config = {}) {
  const supabaseUrl = String(config.supabaseUrl || "").trim();
  const supabaseAnonKey = String(config.supabaseAnonKey || "").trim();
  if (!supabaseUrl || !supabaseAnonKey) {
    return "";
  }

  const url = new URL(supabaseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/realtime/v1/websocket";
  url.search = "";
  url.searchParams.set("apikey", supabaseAnonKey);
  url.searchParams.set("vsn", SOCKET_PROTOCOL_VERSION);
  return url.toString();
}

function getRoundById(state, roundId) {
  return (state?.rounds || []).find((round) => round.id === roundId) || null;
}

function getGroupForRound(state, round) {
  if (!round) {
    return null;
  }

  return (state?.groups || []).find((group) =>
    group.roundId === round.id
      || (round.groupId && group.id === round.groupId)
      || (round.inviteCode && group.inviteCode === round.inviteCode)
  ) || null;
}

function markRoundConnected(round, {
  transport = "cloud",
  state = "connected",
  note = "Live round updates are flowing between connected devices.",
  at = now(),
} = {}) {
  ensureRoundSyncScaffold(round);
  round.sync.transport = transport;
  round.sync.label = CONNECTION_COPY[transport] || CONNECTION_COPY.cloud;
  round.sync.state = state;
  round.sync.lastEventAt = at;
  round.sync.note = note;
}

function createStrokeEntry(participantId) {
  return {
    participantId,
    strokes: null,
    putts: null,
    penalties: 0,
    fairwayHit: false,
    gir: false,
    upAndDown: false,
    sandSave: false,
    updatedAt: null,
    lastEventId: null,
  };
}

function createPlayerRecord(currentUser) {
  return {
    id: uid("player"),
    profileId: currentUser.profileId || null,
    userId: currentUser.id,
    name: currentUser.displayName || currentUser.name,
    displayName: currentUser.displayName || currentUser.name,
    username: currentUser.username || normalizeComparable(currentUser.displayName || currentUser.name),
    avatarLabel: currentUser.avatarLabel || "GN",
    role: "guest",
  };
}

function ensureMemberOnRound(round, member) {
  if (!round || !member) {
    return { participantId: null, added: false };
  }

  const normalizedName = normalizeComparable(member.displayName);
  const normalizedUsername = normalizeComparable(member.username);
  let participant = (round.players || []).find((player) =>
    player.id === member.playerId
      || player.userId === member.userId
      || player.profileId === member.profileId
  ) || null;

  if (!participant) {
    participant = (round.players || []).find((player) => {
      const playerName = normalizeComparable(player.displayName || player.name);
      const playerUsername = normalizeComparable(player.username);
      return (!player.userId && !player.profileId)
        && (playerName === normalizedName || (normalizedUsername && playerUsername === normalizedUsername));
    }) || null;
  }

  let added = false;

  if (!participant) {
    participant = {
      id: member.playerId || uid("player"),
      profileId: member.profileId || null,
      userId: member.userId || null,
      name: member.displayName || "Golfer",
      displayName: member.displayName || "Golfer",
      username: member.username || normalizeComparable(member.displayName || "golfer"),
      avatarLabel: member.avatarLabel || "GN",
      role: member.role === "host" ? "owner" : "guest",
    };
    round.players = Array.isArray(round.players) ? round.players : [];
    round.players.push(participant);
    added = true;

    if (round.mode === "stroke") {
      round.holes.forEach((hole) => {
        hole.entries = Array.isArray(hole.entries) ? hole.entries : [];
        hole.entries.push(createStrokeEntry(participant.id));
      });
    } else if (Array.isArray(round.sides) && round.sides.length) {
      const targetSide = [...round.sides].sort((left, right) => left.playerIds.length - right.playerIds.length)[0];
      if (targetSide) {
        targetSide.playerIds.push(participant.id);
        targetSide.playerNames = targetSide.playerIds
          .map((playerId) => round.players.find((player) => player.id === playerId)?.name || "")
          .filter(Boolean);
      }
    }
  }

  participant.id = member.playerId || participant.id;
  participant.profileId = member.profileId || participant.profileId || null;
  participant.userId = member.userId || participant.userId || null;
  participant.name = member.displayName || participant.name;
  participant.displayName = member.displayName || participant.displayName || participant.name;
  participant.username = member.username || participant.username;
  participant.avatarLabel = member.avatarLabel || participant.avatarLabel || "GN";

  if (Array.isArray(round.sides)) {
    round.sides.forEach((side) => {
      side.playerNames = side.playerIds
        .map((playerId) => round.players.find((player) => player.id === playerId)?.name || "")
        .filter(Boolean);
    });
  }

  return {
    participantId: participant.id,
    added,
  };
}

function ensureCurrentUserOnRound(round, group, currentUser) {
  if (!round || !currentUser?.id) {
    return { round, group, participantId: null, added: false };
  }

  const displayName = currentUser.displayName || currentUser.name;
  const normalizedName = normalizeComparable(displayName);
  const normalizedUsername = normalizeComparable(currentUser.username);
  let participant = (round.players || []).find((player) =>
    player.userId === currentUser.id || player.profileId === currentUser.profileId
  ) || null;

  if (!participant) {
    participant = (round.players || []).find((player) => {
      const playerName = normalizeComparable(player.displayName || player.name);
      const playerUsername = normalizeComparable(player.username);
      return (!player.userId && !player.profileId)
        && (playerName === normalizedName || (normalizedUsername && playerUsername === normalizedUsername));
    }) || null;
  }

  let added = false;

  if (!participant) {
    participant = createPlayerRecord(currentUser);
    round.players = Array.isArray(round.players) ? round.players : [];
    round.players.push(participant);
    added = true;

    if (round.mode === "stroke") {
      round.holes.forEach((hole) => {
        hole.entries = Array.isArray(hole.entries) ? hole.entries : [];
        hole.entries.push(createStrokeEntry(participant.id));
      });
    } else if (Array.isArray(round.sides) && round.sides.length) {
      const targetSide = [...round.sides].sort((left, right) => left.playerIds.length - right.playerIds.length)[0];
      if (targetSide) {
        targetSide.playerIds.push(participant.id);
        targetSide.playerNames = targetSide.playerIds
          .map((playerId) => round.players.find((player) => player.id === playerId)?.name || "")
          .filter(Boolean);
      }
    }
  }

  participant.userId = currentUser.id;
  participant.profileId = currentUser.profileId || participant.profileId || null;
  participant.name = displayName;
  participant.displayName = displayName;
  participant.username = currentUser.username || participant.username;
  participant.avatarLabel = currentUser.avatarLabel || participant.avatarLabel || "GN";

  if (Array.isArray(round.sides)) {
    round.sides.forEach((side) => {
      side.playerNames = side.playerIds
        .map((playerId) => round.players.find((player) => player.id === playerId)?.name || "")
        .filter(Boolean);
    });
  }

  if (group) {
    group.members = Array.isArray(group.members) ? group.members : [];
    let member = group.members.find((item) =>
      item.userId === currentUser.id || item.profileId === currentUser.profileId || item.playerId === participant.id
    ) || null;

    if (!member) {
      member = {
        id: uid("member"),
        playerId: participant.id,
        profileId: participant.profileId,
        userId: currentUser.id,
        displayName: participant.name,
        username: participant.username,
        avatarLabel: participant.avatarLabel,
        role: group.members.length ? "player" : "host",
        connectionState: "connected",
      };
      group.members.push(member);
    }

    member.playerId = participant.id;
    member.profileId = participant.profileId;
    member.userId = currentUser.id;
    member.displayName = participant.name;
    member.username = participant.username;
    member.avatarLabel = participant.avatarLabel;
    member.connectionState = "connected";
    group.updatedAt = now();
  }

  return {
    round,
    group,
    participantId: participant.id,
    added,
  };
}

function mergeIncomingRound(existingRound, incomingRound) {
  if (!existingRound) {
    return incomingRound;
  }

  const localPendingEvents = getPendingRoundEvents(existingRound).map((event) => cloneData(event));
  const mergedRound = incomingRound;

  localPendingEvents
    .sort((left, right) => (left.occurredAt || 0) - (right.occurredAt || 0))
    .forEach((event) => {
      if (mergedRound.eventLog?.some((entry) => entry.id === event.id)) {
        return;
      }

      const applied = applyRoundActionEvent(mergedRound, event);
      if (!applied.applied) {
        return;
      }

      appendRoundAction(mergedRound, cloneData(event));
    });

  return mergedRound;
}

function resolveBroadcastEnvelope(message) {
  if (!message || message.event !== "broadcast") {
    return null;
  }

  const envelope = message.payload || {};
  return {
    name: envelope.event || "",
    payload: envelope.payload || null,
  };
}
function createLocalRealtimeGatewayFactory() {
  return {
    mode: "device-realtime-adapter",
    backendReady: true,
    createSession({ store }) {
      const service = createSyncService({ store });

      return {
        mode: "device-realtime-session",
        connect() {
          service.init();
        },
        disconnect() {
          service.teardown();
        },
        publishRoundUpdate(roundId) {
          service.notifyRoundUpdated(roundId);
        },
        enableNearbySync(roundId) {
          service.enableNearbyPrototype(roundId);
        },
        enableBluetoothSync(roundId) {
          return service.tryBluetoothPrototype(roundId);
        },
        updateTransport(roundId, transport, stateLabel) {
          service.updateTransport(roundId, transport, stateLabel);
        },
        async hostRoundSession() {
          return { status: "unsupported-local" };
        },
        async joinRoundSession() {
          return null;
        },
      };
    },
  };
}
function createSupabaseRealtimeGatewayFactory({
  bridge,
  fallback = createLocalRealtimeGatewayFactory(),
  WebSocketFactory = typeof WebSocket === "function" ? WebSocket : null,
  setIntervalFn = typeof setInterval === "function" ? setInterval : null,
  clearIntervalFn = typeof clearInterval === "function" ? clearInterval : null,
  setTimeoutFn = typeof setTimeout === "function" ? setTimeout : null,
  clearTimeoutFn = typeof clearTimeout === "function" ? clearTimeout : null,
  windowRef = typeof window !== "undefined" ? window : null,
} = {}) {
  if (!bridge?.isConfigured?.() || !WebSocketFactory) {
    return fallback;
  }

  return {
    mode: "supabase-realtime-adapter",
    backendReady: true,
    createSession({ store }) {
      let socket = null;
      let heartbeatTimer = null;
      let reconnectTimer = null;
      let reconnectBound = false;
      let socketReadyPromise = null;
      let currentChannel = null;
      let currentJoinRef = null;
      let currentSessionMeta = null;
      let sessionReconcileTimer = null;
      let pendingFollowupReconcile = null;
      let manualDisconnect = false;
      let refCounter = 0;
      const pendingReplies = new Map();
      const publishedEventIds = new Set();
      const localDeviceId = `realtime-device-${now()}`;

      async function getRealtimeAccessToken() {
        if (typeof bridge?.getActiveSession !== "function") {
          return "";
        }

        try {
          const active = await bridge.getActiveSession();
          return active?.session?.access_token || "";
        } catch (error) {
          return "";
        }
      }

      function nextRef() {
        refCounter += 1;
        return String(refCounter);
      }

      function setRoundRealtimeState(roundId, updater, reason = "realtime-state") {
        store.setState((draft) => {
          const round = getRoundById(draft, roundId);
          if (!round) {
            return draft;
          }

          updater(round, draft);
          return draft;
        }, { reason });
      }

      function clearSessionReconcileTimer() {
        if (sessionReconcileTimer && clearIntervalFn) {
          clearIntervalFn(sessionReconcileTimer);
          sessionReconcileTimer = null;
        }
      }

      function clearFollowupReconcileTimer() {
        if (pendingFollowupReconcile && clearTimeoutFn) {
          clearTimeoutFn(pendingFollowupReconcile);
          pendingFollowupReconcile = null;
        }
      }

      function activateSessionMeta(meta = {}) {
        const previousInviteCode = currentSessionMeta?.inviteCode || "";
        currentSessionMeta = createLiveSessionMeta({
          ...(currentSessionMeta || {}),
          ...meta,
        });
        if (previousInviteCode && currentSessionMeta.inviteCode && previousInviteCode !== currentSessionMeta.inviteCode) {
          publishedEventIds.clear();
        }
        return currentSessionMeta;
      }

      function cleanupPendingReplies() {
        pendingReplies.forEach((pending) => {
          if (pending.timeoutId && clearTimeoutFn) {
            clearTimeoutFn(pending.timeoutId);
          }
          pending.reject(new Error("Realtime channel closed before the request completed."));
        });
        pendingReplies.clear();
      }

      function teardownSocket() {
        if (heartbeatTimer && clearIntervalFn) {
          clearIntervalFn(heartbeatTimer);
          heartbeatTimer = null;
        }

        clearSessionReconcileTimer();
        clearFollowupReconcileTimer();

        if (socket) {
          try {
            socket.close();
          } catch (error) {
            // Ignore socket close failures during teardown.
          }
        }

        socket = null;
        socketReadyPromise = null;
        currentChannel = null;
        currentJoinRef = null;
        cleanupPendingReplies();
      }

      function scheduleFollowupReconcile(reason = "realtime-followup-reconcile", delayMs = 350) {
        if (!setTimeoutFn || !currentSessionMeta?.inviteCode) {
          return;
        }

        clearFollowupReconcileTimer();
        pendingFollowupReconcile = setTimeoutFn(() => {
          pendingFollowupReconcile = null;
          void reconcileCurrentSession({
            force: false,
            reason,
          }).catch((error) => {
            console.warn("[Golfers Nation] Follow-up live session reconcile failed.", error);
          });
        }, delayMs);
      }

      function scheduleReconnect() {
        if (manualDisconnect || reconnectTimer || !currentSessionMeta || !setTimeoutFn) {
          return;
        }

        reconnectTimer = setTimeoutFn(async () => {
          reconnectTimer = null;
          try {
            await ensureChannel(currentSessionMeta);
            startSessionReconcileLoop();
            await reconcileCurrentSession({
              force: true,
              reason: "realtime-reconnect-bootstrap",
            });
            if (currentSessionMeta?.roundId) {
              await syncRoundSessionSnapshot(currentSessionMeta.roundId, {
                broadcast: true,
                eventName: "round-snapshot",
              });
            }
          } catch (error) {
            console.warn("[Golfers Nation] Realtime reconnect failed.", error);
            scheduleReconnect();
          }
        }, RECONNECT_DELAY_MS);
      }

      function sendSocketMessage(message) {
        if (!socket || socket.readyState !== 1) {
          return false;
        }

        socket.send(JSON.stringify(message));
        return true;
      }

      function startHeartbeat() {
        if (!setIntervalFn || heartbeatTimer) {
          return;
        }

        heartbeatTimer = setIntervalFn(() => {
          sendSocketMessage({
            topic: "phoenix",
            event: "heartbeat",
            payload: {},
            ref: nextRef(),
          });
        }, HEARTBEAT_INTERVAL_MS);
      }

      async function ensureSocket() {
        if (socket && socket.readyState === 1) {
          return socket;
        }

        if (socketReadyPromise) {
          return socketReadyPromise;
        }

        socketReadyPromise = new Promise((resolve, reject) => {
          const socketUrl = createRealtimeSocketUrl(bridge.config);
          socket = new WebSocketFactory(socketUrl);

          socket.addEventListener("open", () => {
            startHeartbeat();
            resolve(socket);
          }, { once: true });

          socket.addEventListener("message", handleSocketMessage);

          socket.addEventListener("close", () => {
            socketReadyPromise = null;
            socket = null;
            currentChannel = null;
            currentJoinRef = null;
            cleanupPendingReplies();
            scheduleReconnect();
          });

          socket.addEventListener("error", (error) => {
            reject(error);
          }, { once: true });
        });

        return socketReadyPromise;
      }

      function registerReply(ref, resolve, reject) {
        const timeoutId = setTimeoutFn
          ? setTimeoutFn(() => {
              pendingReplies.delete(ref);
              reject(new Error("Realtime channel request timed out."));
            }, 6_000)
          : null;

        pendingReplies.set(ref, { resolve, reject, timeoutId });
      }

      function leaveCurrentChannel() {
        if (!currentChannel || !currentJoinRef) {
          return;
        }

        sendSocketMessage({
          topic: currentChannel,
          event: "phx_leave",
          payload: {},
          ref: nextRef(),
          join_ref: currentJoinRef,
        });

        currentChannel = null;
        currentJoinRef = null;
      }

      async function joinChannel(meta) {
        await ensureSocket();

        const nextChannel = `realtime:${createRealtimeTopic(meta.inviteCode)}`;
        if (currentChannel === nextChannel && currentJoinRef) {
          return {
            channel: currentChannel,
            joinRef: currentJoinRef,
          };
        }

        if (currentChannel && currentChannel !== nextChannel) {
          leaveCurrentChannel();
        }

        const accessToken = await getRealtimeAccessToken();
        const attemptJoin = async (isPrivate) => {
          const joinRef = nextRef();

          const joined = new Promise((resolve, reject) => {
            registerReply(joinRef, resolve, reject);
          });

          sendSocketMessage({
            topic: nextChannel,
            event: "phx_join",
            payload: {
              config: {
                broadcast: {
                  ack: false,
                  self: true,
                },
                presence: {
                  enabled: false,
                },
                private: isPrivate,
              },
              ...(accessToken ? { access_token: accessToken } : {}),
            },
            ref: joinRef,
            join_ref: joinRef,
          });

          await joined;
          currentChannel = nextChannel;
          currentJoinRef = joinRef;
          return {
            channel: currentChannel,
            joinRef,
          };
        };

        try {
          return await attemptJoin(false);
        } catch (publicError) {
          if (!accessToken) {
            throw publicError;
          }

          try {
            return await attemptJoin(true);
          } catch (privateError) {
            throw new Error(
              "Realtime channel join failed. Check Supabase Realtime public access or add authenticated policies on realtime.messages."
            );
          }
        }
      }

      async function ensureChannel(meta) {
        activateSessionMeta(meta);
        return joinChannel(meta);
      }

      function applyLiveSessionSnapshot(incoming, reason = "realtime-round-snapshot", { force = false } = {}) {
        if (!incoming?.round || !incoming?.inviteCode) {
          return false;
        }

        if (!shouldApplyLiveSessionSnapshot(currentSessionMeta, incoming, { force })) {
          return false;
        }

        console.info("[Golfers Nation] Incoming round-snapshot received.", {
          inviteCode: incoming.inviteCode,
          roundId: incoming.round?.id || null,
          sessionId: incoming.id || null,
          reason,
        });

        store.setState((draft) => {
          const nextRound = mergeIncomingRound(
            (draft.rounds || []).find((round) => round.id === incoming.round.id || round.inviteCode === incoming.inviteCode) || null,
            ensureRoundSyncScaffold(cloneData(incoming.round))
          );
          markRoundConnected(nextRound, {
            at: incoming.updatedAt || now(),
          });

          upsertLiveRoundSessionState(draft, {
            inviteCode: incoming.inviteCode,
            round: nextRound,
            group: incoming.group ? cloneData(incoming.group) : null,
          });
          return draft;
        }, { reason });

        activateSessionMeta({
          inviteCode: incoming.inviteCode,
          roundId: incoming.round?.id || null,
          sessionId: incoming.id || null,
          updatedAt: incoming.updatedAt || now(),
        });
        return true;
      }

      async function reconcileCurrentSession({ force = false, reason = "realtime-session-reconcile" } = {}) {
        if (!currentSessionMeta?.inviteCode || typeof bridge.fetchLiveRoundSessionByInviteCode !== "function") {
          return { status: "skipped" };
        }

        const response = await bridge.fetchLiveRoundSessionByInviteCode(currentSessionMeta.inviteCode);
        if (response?.error || response?.missingTable || !response?.session) {
          return response || { status: "missing-session" };
        }

        const liveSession = fromBackendLiveRoundSessionRecord(response.session);
        if (!liveSession?.round) {
          return { status: "missing-round" };
        }

        const applied = applyLiveSessionSnapshot({
          id: liveSession.id,
          inviteCode: liveSession.inviteCode,
          round: liveSession.round,
          group: liveSession.group,
          updatedAt: liveSession.updatedAt,
        }, reason, { force });

        return {
          status: applied ? "reconciled" : "unchanged",
          session: liveSession,
        };
      }

      function startSessionReconcileLoop() {
        clearSessionReconcileTimer();
        if (!setIntervalFn || !currentSessionMeta?.inviteCode) {
          return;
        }

        sessionReconcileTimer = setIntervalFn(() => {
          void reconcileCurrentSession({
            force: false,
            reason: "realtime-session-reconcile",
          }).catch((error) => {
            console.warn("[Golfers Nation] Live session reconcile failed.", error);
          });
        }, SESSION_RECONCILE_INTERVAL_MS);
      }

      function handleSocketMessage(event) {
        let message = null;

        try {
          message = JSON.parse(event.data);
        } catch (error) {
          return;
        }

        if (!message) {
          return;
        }

        if (message.event === "phx_reply" && message.ref) {
          const pending = pendingReplies.get(message.ref);
          if (pending) {
            pendingReplies.delete(message.ref);
            if (pending.timeoutId && clearTimeoutFn) {
              clearTimeoutFn(pending.timeoutId);
            }

            if (message.payload?.status === "ok") {
              pending.resolve(message.payload?.response || {});
            } else {
              pending.reject(new Error(message.payload?.response?.reason || message.payload?.status || "Realtime join failed."));
            }
          }
          return;
        }

        const broadcast = resolveBroadcastEnvelope(message);
        if (!broadcast?.name || !broadcast.payload) {
          return;
        }

        if (broadcast.name === "round-event") {
          applyIncomingRoundEvent(broadcast.payload);
          return;
        }

        if (broadcast.name === "round-snapshot") {
          applyIncomingRoundSnapshot(broadcast.payload);
          return;
        }

        if (broadcast.name === "member-state") {
          applyIncomingMemberState(broadcast.payload);
        }
      }

      function applyIncomingMemberState(payload) {
        if (!payload?.inviteCode || !payload?.member) {
          return;
        }

        const resolvedInviteCode = normalizeInviteCode(payload.inviteCode);

        console.info("[Golfers Nation] Incoming member-state event received.", {
          inviteCode: resolvedInviteCode,
          userId: payload.member.userId || null,
          profileId: payload.member.profileId || null,
          roundId: payload.roundId || null,
          sessionId: payload.sessionId || null,
        });

        store.setState((draft) => {
          const resolved = resolveLiveRoundSessionEntities(draft, {
            inviteCode: resolvedInviteCode,
            roundId: payload.roundId || currentSessionMeta?.roundId || null,
            sessionId: payload.sessionId || currentSessionMeta?.sessionId || null,
            createGroupIfMissing: true,
          });
          const group = resolved.group;
          const round = resolved.round;

          console.info("[Golfers Nation] Host member-state lookup result.", {
            inviteCode: resolvedInviteCode,
            lookupRoundId: payload.roundId || currentSessionMeta?.roundId || null,
            lookupSessionId: payload.sessionId || currentSessionMeta?.sessionId || null,
            foundRound: Boolean(round),
            foundGroup: Boolean(group),
            createdGroup: resolved.createdGroup,
            resolvedRoundId: round?.id || null,
            resolvedGroupId: group?.id || null,
          });

          if (!round) {
            console.warn("[Golfers Nation] Host member-state lookup missed the local round. Scheduling a forced reconcile.", {
              inviteCode: resolvedInviteCode,
              lookupRoundId: payload.roundId || currentSessionMeta?.roundId || null,
              lookupSessionId: payload.sessionId || currentSessionMeta?.sessionId || null,
            });
            void reconcileCurrentSession({
              force: true,
              reason: "realtime-member-state-reconcile",
            }).catch((error) => {
              console.warn("[Golfers Nation] Failed to hydrate the latest live session after a member-state event.", error);
            });
            return draft;
          }

          const beforeMemberCount = group?.members?.length || 0;
          const beforePlayerCount = round?.players?.length || 0;

          if (group) {
            group.members = Array.isArray(group.members) ? group.members : [];
          }
          let member = group?.members?.find((entry) =>
            entry.id === payload.member.id
              || entry.playerId === payload.member.playerId
              || entry.userId === payload.member.userId
              || entry.profileId === payload.member.profileId
          ) || null;

          if (!member) {
            member = {
              id: payload.member.id || uid("member"),
              playerId: payload.member.playerId || null,
              profileId: payload.member.profileId || null,
              userId: payload.member.userId || null,
              displayName: payload.member.displayName || "Golfer",
              username: payload.member.username || "",
              avatarLabel: payload.member.avatarLabel || "GN",
              role: payload.member.role || "player",
              connectionState: payload.member.connectionState || "connected",
            };
            group?.members?.push(member);
          } else {
            Object.assign(member, payload.member);
          }

          if (group) {
            group.updatedAt = now();
          }

          const ensuredMember = ensureMemberOnRound(round, {
            ...payload.member,
            playerId: payload.member.playerId || member?.playerId || null,
          });
          if (member && ensuredMember.participantId && member.playerId !== ensuredMember.participantId) {
            member.playerId = ensuredMember.participantId;
          }

          if (round) {
            markRoundConnected(round, {
              at: now(),
              note: `${payload.member.displayName || "A golfer"} joined the live round.`,
            });
          }

          console.info("[Golfers Nation] Host participant merge after member-state.", {
            inviteCode: resolvedInviteCode,
            membersBefore: beforeMemberCount,
            membersAfter: group?.members?.length || 0,
            playersBefore: beforePlayerCount,
            playersAfter: round?.players?.length || 0,
          });
          return draft;
        }, { reason: "realtime-member-state" });

        activateSessionMeta({
          inviteCode: resolvedInviteCode,
          roundId: payload.roundId || store.getState().session?.activeRoundId || currentSessionMeta?.roundId || null,
          sessionId: payload.sessionId || currentSessionMeta?.sessionId || null,
        });
        scheduleFollowupReconcile("realtime-member-state-followup");
      }

      function applyIncomingRoundEvent(payload) {
        const incomingEvent = cloneData(payload?.event || null);
        if (!incomingEvent?.id || !payload?.roundId) {
          return;
        }

        console.info("[Golfers Nation] Incoming round-event received.", {
          inviteCode: payload.inviteCode || "",
          roundId: payload.roundId,
          eventId: incomingEvent.id,
          actionType: incomingEvent.actionType,
        });

        store.setState((draft) => {
          const round = getRoundById(draft, payload.roundId);
          if (!round) {
            if (payload?.inviteCode) {
              void reconcileCurrentSession({
                force: true,
                reason: "realtime-round-event-reconcile",
              }).catch((error) => {
                console.warn("[Golfers Nation] Failed to hydrate the latest live session after a missing round event.", error);
              });
            }
            return draft;
          }

          ensureRoundSyncScaffold(round);
          if (round.eventLog.some((entry) => entry.id === incomingEvent.id)) {
            markRoundConnected(round, {
              at: incomingEvent.occurredAt || now(),
            });
            return draft;
          }

          const applied = applyRoundActionEvent(round, incomingEvent);
          if (!applied.applied) {
            if (applied.reason === "missing-entry" && payload?.inviteCode) {
              void reconcileCurrentSession({
                force: true,
                reason: "realtime-round-event-reconcile",
              })
                .catch((error) => {
                  console.warn("[Golfers Nation] Failed to hydrate the latest live session after a missing-entry event.", error);
                });
            }
            return draft;
          }

          const storedEvent = {
            ...incomingEvent,
            syncState: "synced",
            syncedAt: payload.sentAt || now(),
            lastError: "",
          };

          round.eventLog.push(storedEvent);
          markRoundConnected(round, {
            at: incomingEvent.occurredAt || now(),
          });

          const group = getGroupForRound(draft, round);
          if (group) {
            group.updatedAt = now();
          }

          return draft;
        }, { reason: "realtime-round-event" });

        activateSessionMeta({
          inviteCode: payload.inviteCode || currentSessionMeta?.inviteCode || "",
          roundId: payload.roundId,
        });
        scheduleFollowupReconcile("realtime-round-event-followup");
      }

      function applyIncomingRoundSnapshot(payload) {
        const incoming = cloneData(payload?.session || null);
        if (!incoming?.round || !incoming?.inviteCode) {
          return;
        }

        applyLiveSessionSnapshot(incoming, "realtime-round-snapshot", { force: true });
      }

      async function upsertLiveSessionFromRound(round, group, {
        broadcast = false,
        eventName = "round-snapshot",
      } = {}) {
        if (!round?.inviteCode) {
          return { status: "skipped" };
        }

        console.info("[Golfers Nation] Syncing live round session.", {
          inviteCode: round.inviteCode,
          roundId: round.id,
          broadcast,
          eventName,
        });

        const sessionRecord = toBackendLiveRoundSessionRecord({
          round,
          group,
          userId: store.getState().currentUser?.id || store.getState().auth?.activeUserId || null,
          sessionId: currentSessionMeta?.sessionId || group?.id || round.groupId || null,
        });

        const upsert = await bridge.upsertLiveRoundSession(sessionRecord);
        if (upsert?.error) {
          return upsert;
        }

        const liveSession = fromBackendLiveRoundSessionRecord(
          Array.isArray(upsert?.data) ? upsert.data[0] || sessionRecord : upsert?.data || sessionRecord
        ) || {
          id: sessionRecord.id,
          inviteCode: round.inviteCode,
          round,
          group,
          updatedAt: now(),
        };

        activateSessionMeta({
          sessionId: liveSession.id,
          inviteCode: liveSession.inviteCode,
          roundId: liveSession.round?.id || round.id,
          updatedAt: liveSession.updatedAt || now(),
        });

        if (broadcast) {
          const topic = createRealtimeTopic(liveSession.inviteCode);
          const broadcastResult = await bridge.broadcastRealtimeMessage(topic, eventName, {
            session: {
              id: liveSession.id,
              inviteCode: liveSession.inviteCode,
              round: liveSession.round || round,
              group: liveSession.group || group,
              updatedAt: liveSession.updatedAt || now(),
            },
            deviceId: localDeviceId,
          });
          if (broadcastResult?.error) {
            return broadcastResult;
          }
        }

        return {
          status: upsert?.status || "synced",
          session: liveSession,
        };
      }

      async function syncRoundSessionSnapshot(roundId, options = {}) {
        const state = store.getState();
        const round = getRoundById(state, roundId);
        const group = getGroupForRound(state, round);
        return upsertLiveSessionFromRound(round, group, options);
      }

      async function publishRoundUpdate(roundId) {
        const state = store.getState();
        const round = getRoundById(state, roundId);
        if (!round?.inviteCode) {
          return;
        }

        const latestEvent = Array.isArray(round.eventLog) ? round.eventLog[round.eventLog.length - 1] || null : null;
        await ensureChannel({
          sessionId: currentSessionMeta?.sessionId || round.groupId || null,
          inviteCode: round.inviteCode,
          roundId: round.id,
        });

        if (!latestEvent || publishedEventIds.has(latestEvent.id)) {
          return;
        }

        const topic = createRealtimeTopic(round.inviteCode);
        const broadcastResult = await bridge.broadcastRealtimeMessage(topic, "round-event", {
          inviteCode: round.inviteCode,
          roundId: round.id,
          event: latestEvent,
          deviceId: localDeviceId,
          sentAt: now(),
        });

        if (broadcastResult?.error) {
          console.warn("[Golfers Nation] Realtime round update broadcast failed.", broadcastResult.error);
          setRoundRealtimeState(round.id, (draftRound) => {
            markRoundConnected(draftRound, {
              state: "retry-needed",
              note: "Live updates are safe on this phone and will retry when the connection returns.",
            });
          }, "realtime-broadcast-failed");
          return;
        }

        publishedEventIds.add(latestEvent.id);
        setRoundRealtimeState(round.id, (draftRound) => {
          markRoundConnected(draftRound, {
            state: "connected",
            note: "Live round changes are moving between connected phones.",
          });
        }, "realtime-broadcast-sent");
        await syncRoundSessionSnapshot(roundId, {
          broadcast: false,
        });
      }

      async function hostRoundSession(roundId) {
        const state = store.getState();
        const round = getRoundById(state, roundId);
        if (!round?.inviteCode) {
          return { error: { message: "Create an invite code before hosting this round.", code: "missing_invite_code" } };
        }

        const ensured = await syncRoundSessionSnapshot(roundId, {
          broadcast: false,
        });
        if (ensured?.status === "skipped-missing-table") {
          return {
            error: {
              code: "missing_live_round_sessions_table",
              message: "Supabase table public.live_round_sessions is missing. Run the multiplayer SQL setup first.",
            },
          };
        }
        if (ensured?.error) {
          return ensured;
        }

        try {
          await ensureChannel({
            sessionId: ensured.session?.id || round.groupId || null,
            inviteCode: round.inviteCode,
            roundId: round.id,
          });
          console.info("[Golfers Nation] Live host subscription ready.", {
            inviteCode: round.inviteCode,
            roundId: round.id,
            sessionId: ensured.session?.id || null,
          });
        } catch (error) {
          return {
            error: {
              code: "realtime_channel_join_failed",
              message: error?.message || "Realtime channel join failed.",
            },
          };
        }

        startSessionReconcileLoop();
        await reconcileCurrentSession({
          force: true,
          reason: "realtime-host-bootstrap",
        }).catch((error) => {
          console.warn("[Golfers Nation] Host reconcile bootstrap failed.", error);
        });

        await syncRoundSessionSnapshot(roundId, {
          broadcast: true,
        });

        return {
          status: "hosted",
          inviteCode: round.inviteCode,
          sessionId: currentSessionMeta?.sessionId || ensured.session?.id || null,
        };
      }

      async function joinRoundSession(inviteCode) {
        const normalizedCode = normalizeInviteCode(inviteCode);
        if (!normalizedCode) {
          return null;
        }

        const response = await bridge.fetchLiveRoundSessionByInviteCode(normalizedCode);
        if (response?.error) {
          return response;
        }

        if (response?.missingTable) {
          return {
            error: {
              code: "missing_live_round_sessions_table",
              message: "Supabase table public.live_round_sessions is missing. Run the multiplayer SQL setup first.",
            },
          };
        }

        if (!response?.session) {
          return null;
        }

        const liveSession = fromBackendLiveRoundSessionRecord(response.session);
        if (!liveSession?.round) {
          return null;
        }

        console.info("[Golfers Nation] Live join resolved session.", {
          inviteCode: normalizedCode,
          sessionId: liveSession.id,
          roundId: liveSession.round?.id || null,
        });

        const round = ensureRoundSyncScaffold(cloneData(liveSession.round));
        const group = liveSession.group ? cloneData(liveSession.group) : null;
        const ensuredIdentity = ensureCurrentUserOnRound(round, group, store.getState().currentUser);
        markRoundConnected(round, {
          state: "connected",
          note: "This phone now has its own safe live copy of the shared round.",
        });

        activateSessionMeta({
          sessionId: liveSession.id,
          inviteCode: liveSession.inviteCode,
          roundId: round.id,
          updatedAt: liveSession.updatedAt || now(),
        });

        try {
          await ensureChannel(currentSessionMeta);
          console.info("[Golfers Nation] Live join subscription ready.", {
            inviteCode: liveSession.inviteCode,
            roundId: round.id,
            participantAdded: ensuredIdentity.added,
          });
        } catch (error) {
          return {
            error: {
              code: "realtime_channel_join_failed",
              message: error?.message || "Realtime channel join failed.",
            },
          };
        }

        startSessionReconcileLoop();
        await reconcileCurrentSession({
          force: true,
          reason: "realtime-join-bootstrap",
        }).catch((error) => {
          console.warn("[Golfers Nation] Join reconcile bootstrap failed.", error);
        });

        if (ensuredIdentity.added) {
          const joiningMember = group?.members?.find((member) => member.userId === store.getState().currentUser.id)
            || {
              id: uid("member"),
              playerId: ensuredIdentity.participantId,
              profileId: store.getState().currentUser.profileId,
              userId: store.getState().currentUser.id,
              displayName: store.getState().currentUser.displayName || store.getState().currentUser.name,
              username: store.getState().currentUser.username,
              avatarLabel: store.getState().currentUser.avatarLabel,
              role: "player",
                connectionState: "connected",
              };
          const topic = createRealtimeTopic(liveSession.inviteCode);
          await upsertLiveSessionFromRound(round, group, {
            broadcast: true,
          });
          const memberBroadcast = await bridge.broadcastRealtimeMessage(topic, "member-state", {
            inviteCode: liveSession.inviteCode,
            roundId: round.id,
            sessionId: currentSessionMeta?.sessionId || liveSession.id,
            member: joiningMember,
          });
          if (!memberBroadcast?.error) {
            console.info("[Golfers Nation] Joiner member-state broadcast sent.", {
              inviteCode: liveSession.inviteCode,
              roundId: round.id,
              sessionId: currentSessionMeta?.sessionId || liveSession.id,
              participantId: ensuredIdentity.participantId,
            });
          }
        } else {
          const topic = createRealtimeTopic(liveSession.inviteCode);
          await upsertLiveSessionFromRound(round, group, {
            broadcast: false,
          });
          const memberBroadcast = await bridge.broadcastRealtimeMessage(topic, "member-state", {
            inviteCode: liveSession.inviteCode,
            roundId: round.id,
            sessionId: currentSessionMeta?.sessionId || liveSession.id,
            member: group?.members?.find((member) => member.userId === store.getState().currentUser.id)
              || {
                id: uid("member"),
                playerId: ensuredIdentity.participantId,
                profileId: store.getState().currentUser.profileId,
                userId: store.getState().currentUser.id,
                displayName: store.getState().currentUser.displayName || store.getState().currentUser.name,
                username: store.getState().currentUser.username,
                avatarLabel: store.getState().currentUser.avatarLabel,
                role: "player",
                connectionState: "connected",
              },
          });
          if (!memberBroadcast?.error) {
            console.info("[Golfers Nation] Joiner member-state broadcast sent.", {
              inviteCode: liveSession.inviteCode,
              roundId: round.id,
              sessionId: currentSessionMeta?.sessionId || liveSession.id,
              participantId: ensuredIdentity.participantId,
            });
          }
        }

        return {
          source: "supabase",
          round,
          group,
          notice: `Joined ${round.courseName} via live invite code.`,
        };
      }

      function connect() {
        manualDisconnect = false;

        if (windowRef && !reconnectBound) {
          reconnectBound = true;
          if (typeof windowRef.addEventListener === "function") {
            windowRef.addEventListener("online", scheduleReconnect);
          }
        }

        const state = store.getState();
        const round = getRoundById(state, state.session?.activeRoundId);
        if (round?.inviteCode) {
          activateSessionMeta({
            sessionId: round.groupId || null,
            inviteCode: round.inviteCode,
            roundId: round.id,
            updatedAt: round.updatedAt || round.createdAt || now(),
          });
          startSessionReconcileLoop();
          void ensureChannel({
            sessionId: round.groupId || null,
            inviteCode: round.inviteCode,
            roundId: round.id,
          }).catch((error) => {
            console.warn("[Golfers Nation] Realtime channel connect fell back to local-only mode.", error);
          });
        }
      }

      function disconnect() {
        manualDisconnect = true;
        if (reconnectTimer && clearTimeoutFn) {
          clearTimeoutFn(reconnectTimer);
          reconnectTimer = null;
        }
        clearSessionReconcileTimer();
        clearFollowupReconcileTimer();
        teardownSocket();
      }

      function updateTransport(roundId, transport, stateLabel) {
        setRoundRealtimeState(roundId, (round) => {
          ensureRoundSyncScaffold(round);
          round.sync.transport = transport;
          round.sync.label = CONNECTION_COPY[transport] || CONNECTION_COPY.local;
          round.sync.state = stateLabel;
          round.sync.lastEventAt = now();
          round.sync.note = "Live round transport was updated from the current device.";
        }, "realtime-transport-updated");
      }

      function enableNearbySync(roundId) {
        updateTransport(roundId, "nearby", "connected");
      }

      async function enableBluetoothSync(roundId) {
        const canUseBluetooth = typeof navigator !== "undefined" && Boolean(navigator.bluetooth);
        updateTransport(roundId, canUseBluetooth ? "bluetooth" : "nearby", "connected");
      }

      return {
        mode: "supabase-realtime-session",
        connect,
        disconnect,
        publishRoundUpdate,
        enableNearbySync,
        enableBluetoothSync,
        updateTransport,
        hostRoundSession,
        joinRoundSession,
      };
    },
  };
}

// ---- src/services/realtime-session-service.js ----
function describeLiveRoomFailure(result) {
  const code = String(result?.error?.code || result?.code || "");
  const message = String(result?.error?.message || result?.message || "");

  if (code === "missing_live_round_sessions_table") {
    return "Live rooms are not ready in Supabase yet. Create the public.live_round_sessions table first.";
  }

  if (code === "realtime_channel_join_failed") {
    return "Supabase Realtime rejected the room connection. Check Realtime public access or add authenticated realtime.messages policies.";
  }

  return message || "The live sync connection is not ready yet.";
}
function createLiveSessionMeta({
  inviteCode = "",
  roundId = null,
  sessionId = null,
  updatedAt = 0,
  source = "live",
} = {}) {
  return {
    inviteCode: String(inviteCode || "").trim().toUpperCase(),
    roundId: roundId || null,
    sessionId: sessionId || null,
    updatedAt: Number(updatedAt) || 0,
    source,
  };
}
function shouldApplyLiveSessionSnapshot(currentMeta, incomingSession, { force = false } = {}) {
  if (force) {
    return true;
  }

  if (!incomingSession?.inviteCode) {
    return false;
  }

  if (!currentMeta?.inviteCode) {
    return true;
  }

  if (currentMeta.inviteCode !== String(incomingSession.inviteCode || "").trim().toUpperCase()) {
    return true;
  }

  const incomingUpdatedAt = Number(incomingSession.updatedAt) || 0;
  const currentUpdatedAt = Number(currentMeta.updatedAt) || 0;
  return incomingUpdatedAt > currentUpdatedAt;
}
function publishLiveRoundUpdate(realtimeSession, roundId) {
  if (!roundId) {
    return;
  }

  return Promise.resolve(realtimeSession.publishRoundUpdate(roundId))
    .catch((error) => {
      console.warn("[Golfers Nation] Live round publish failed. Continuing with local-safe state.", error);
    });
}
async function hostLiveRoundSession(realtimeSession, roundId) {
  if (!roundId || typeof realtimeSession.hostRoundSession !== "function") {
    return null;
  }

  try {
    return await realtimeSession.hostRoundSession(roundId);
  } catch (error) {
    console.warn("[Golfers Nation] Live host setup failed. Keeping the round on this device only.", error);
    return {
      error: {
        message: "Live hosting is unavailable right now.",
      },
    };
  }
}
async function joinLiveRoundSession(realtimeSession, code, warningPrefix = "[Golfers Nation] Live join failed.") {
  if (!code || typeof realtimeSession.joinRoundSession !== "function") {
    return null;
  }

  try {
    return await realtimeSession.joinRoundSession(code);
  } catch (error) {
    console.warn(warningPrefix, error);
    return {
      error: {
        message: "Live join is unavailable right now.",
      },
    };
  }
}

// ---- src/state/default-state.js ----
function createDefaultState() {
  const seeded = createDefaultAccountState();
  const activeWorkspace = seeded.accountVault[seeded.previewAccountId];
  const currentAccount = seeded.accounts.find((account) => account.id === seeded.previewAccountId);

  return {
    version: 3,
    currentUser: {
      id: currentAccount.id,
      name: currentAccount.name,
      displayName: currentAccount.displayName,
      username: currentAccount.username,
      profileId: currentAccount.profileId,
      avatarLabel: currentAccount.avatarLabel,
      avatar: currentAccount.avatarLabel,
      avatarUrl: currentAccount.avatarUrl || "",
      email: currentAccount.email,
      provider: currentAccount.provider,
      providerType: currentAccount.provider,
      homeCourse: currentAccount.homeCourse,
      handicap: currentAccount.handicap,
      handedness: currentAccount.handedness || "",
      bio: currentAccount.bio,
      seasonGoal: currentAccount.seasonGoal,
      city: currentAccount.city,
      createdAt: currentAccount.createdAt,
      premiumStatus: currentAccount.subscription.tier,
      privacy: cloneData(currentAccount.privacy),
      appearance: cloneData(currentAccount.appearance),
      social: cloneData(currentAccount.social),
      integrations: cloneData(currentAccount.integrations),
      seededDemo: currentAccount.seededDemo,
      subscription: cloneData(currentAccount.subscription),
      roundsPlayed: currentAccount.roundsPlayed || 0,
      averageScore: currentAccount.averageScore ?? null,
      bestRound: currentAccount.bestRound ?? null,
      recentFormSummary: currentAccount.recentFormSummary || "First round pending",
    },
    accounts: seeded.accounts,
    accountVault: seeded.accountVault,
    previewAccountId: seeded.previewAccountId,
    auth: {
      status: "signed_out",
      activeUserId: null,
      lastUserId: null,
      provider: null,
      linkedProviders: ["email", "google", "apple"],
      lastIntent: null,
      lastIntentAt: null,
      mode: "login",
      notice: "Sign in with email, create a free golfer account, or use a demo account below for review access.",
      error: "",
    },
    profiles: cloneData(activeWorkspace.profiles),
    rounds: cloneData(activeWorkspace.rounds),
    groups: cloneData(activeWorkspace.groups),
    tournaments: cloneData(activeWorkspace.tournaments),
    gear: cloneData(activeWorkspace.gear),
    social: cloneData(activeWorkspace.social),
    session: {
      activeView: "home",
      previousView: "home",
      transitionDirection: "steady",
      standaloneMode: false,
      installPromptAvailable: false,
      installState: "browser",
      installHintDismissed: false,
      helpSection: "getting-started",
      helpReturnView: "home",
      settingsSection: "account",
      settingsReturnView: "stats",
      activeRoundId: activeWorkspace.userSession.activeRoundId,
      selectedProfileId: activeWorkspace.userSession.selectedProfileId,
      selectedHole: activeWorkspace.userSession.selectedHole,
      summaryRoundId: activeWorkspace.userSession.summaryRoundId,
      lastScoredParticipantId: null,
      lastScoredHole: null,
      lastScorePulseAt: 0,
      feedback: null,
      pendingLabel: "",
      cloudSync: {
        status: "idle",
        scope: "",
        roundId: null,
        userId: null,
        errorMessage: "",
        lastAttemptAt: 0,
        lastSuccessAt: 0,
        retryCount: 0,
      },
      roundSetup: {
        courseQuery: "",
        selectedCourseId: "",
        selectedTeeBoxId: "",
      },
      spotify: createSpotifySessionState(),
    },
  };
}

// ---- src/ui/spotify-controls.js ----
function renderArtworkThumb(track) {
  return `
    <div class="spotify-artwork-thumb" data-artwork-variant="${escapeHtml(track?.artworkVariant || "forest")}" aria-hidden="true">
      <span>${escapeHtml(track?.artworkLabel || "SP")}</span>
    </div>
  `;
}

function renderSpotifyControlButton({ action, label, ariaLabel, disabled = false, tone = "subtle" }) {
  return `
    <button
      class="spotify-control-button spotify-control-button--${tone}"
      type="button"
      data-action="${escapeHtml(action)}"
      aria-label="${escapeHtml(ariaLabel || label)}"
      ${disabled ? "disabled" : ""}
    >
      ${escapeHtml(label)}
    </button>
  `;
}
function renderSpotifySettingsPanel(state) {
  const spotify = getSpotifyIntegration(state);
  const summary = getSpotifyConnectionSummary(spotify);
  const connected = spotify.status === "connected";
  const connectedAt = spotify.lastConnectedAt ? formatRelativeSync(spotify.lastConnectedAt) : "Not connected yet";

  return `
    <article class="settings-support-panel spotify-settings-panel">
      <div class="spotify-settings-header">
        <div>
          <span class="mini-label">Spotify companion</span>
          <strong>${escapeHtml(summary.title)}</strong>
        </div>
        <span class="status-pill ${connected ? "is-live" : ""}">${escapeHtml(summary.statusLabel)}</span>
      </div>
      <p>${escapeHtml(summary.message)}</p>
      <p class="spotify-settings-detail">${escapeHtml(summary.detail)}</p>
      <div class="summary-grid compact spotify-settings-meta">
        <article>
          <span>Connection</span>
          <strong>${escapeHtml(connected ? "Ready for in-app controls" : "Not connected")}</strong>
        </article>
        <article>
          <span>Last update</span>
          <strong>${escapeHtml(connectedAt)}</strong>
        </article>
      </div>
      ${connected && spotify.nowPlaying ? `
        <div class="spotify-settings-preview">
          ${renderArtworkThumb(spotify.nowPlaying)}
          <div class="spotify-settings-preview-copy">
            <span class="mini-label">${escapeHtml(spotify.previewMode ? "Preview track" : "Now playing")}</span>
            <strong>${escapeHtml(spotify.nowPlaying.title)}</strong>
            <p>${escapeHtml(spotify.nowPlaying.artist)} / ${escapeHtml(spotify.deviceName || "This phone")}</p>
          </div>
        </div>
      ` : ""}
      <div class="row-actions spotify-settings-actions">
        <button class="button primary" type="button" data-action="${connected ? "disconnect-spotify" : "connect-spotify"}">
          ${connected ? "Disconnect Spotify" : "Connect Spotify"}
        </button>
        <button class="button secondary" type="button" data-action="spotify-open">
          Open Spotify
        </button>
      </div>
    </article>
  `;
}
function renderSpotifyNowPlayingBar(state) {
  if (!isSpotifyConnected(state)) {
    return "";
  }

  const spotify = getSpotifyIntegration(state);
  const session = getSpotifySession(state);
  const track = spotify.nowPlaying;
  if (state.session?.activeView === "round" && spotify.showOnRoundScreen === false) {
    return "";
  }
  if (!track) {
    return "";
  }

  const isRoundView = state.session?.activeView === "round";
  const collapsed = isRoundView && session.barCollapsed;
  const statusLabel = spotify.playbackState === "playing" ? "Playing" : "Paused";

  if (collapsed) {
    return `
      <section class="spotify-shell spotify-shell--collapsed" aria-label="Spotify now playing">
        <button class="spotify-minibar" type="button" data-action="toggle-spotify-bar" aria-expanded="false">
          ${renderArtworkThumb(track)}
          <span class="spotify-minibar-copy">
            <strong>${escapeHtml(track.title)}</strong>
            <span>${escapeHtml(track.artist)}</span>
          </span>
          <span class="spotify-minibar-status">${escapeHtml(statusLabel)}</span>
        </button>
      </section>
    `;
  }

  return `
    <section class="spotify-shell" aria-label="Spotify now playing">
      <article class="spotify-now-playing-bar">
        <div class="spotify-now-playing-main">
          ${renderArtworkThumb(track)}
          <div class="spotify-track-copy">
            <div class="spotify-track-copy-top">
              <span class="mini-label">Now Playing</span>
              <span class="spotify-preview-badge">${escapeHtml(spotify.previewMode ? "Companion preview" : "Connected")}</span>
            </div>
            <strong>${escapeHtml(track.title)}</strong>
            <p>${escapeHtml(track.artist)} / ${escapeHtml(statusLabel)} / ${escapeHtml(spotify.deviceName || "This phone")}</p>
          </div>
        </div>
        <div class="spotify-control-row">
          ${renderSpotifyControlButton({ action: "spotify-prev", label: "Prev", ariaLabel: "Previous track", disabled: !spotify.controlsEnabled })}
          ${renderSpotifyControlButton({
            action: "spotify-play-pause",
            label: spotify.playbackState === "playing" ? "Pause" : "Play",
            ariaLabel: spotify.playbackState === "playing" ? "Pause playback" : "Resume playback",
            tone: "primary",
            disabled: !spotify.controlsEnabled,
          })}
          ${renderSpotifyControlButton({ action: "spotify-next", label: "Next", ariaLabel: "Next track", disabled: !spotify.controlsEnabled })}
          ${renderSpotifyControlButton({ action: "spotify-open", label: "Open Spotify", ariaLabel: "Open Spotify", tone: "secondary" })}
          ${isRoundView
            ? renderSpotifyControlButton({ action: "toggle-spotify-bar", label: "Minimize", ariaLabel: "Minimize Spotify controls" })
            : ""}
        </div>
      </article>
    </section>
  `;
}

// ---- src/ui/templates.js ----
const PREMIUM_FEATURES = new Set([
  "advanced-stats",
  "round-insights",
  "enhanced-live",
  "player-comparison",
  "tournament-tools",
  "premium-modes",
  "premium-dashboards",
  "future-integrations",
]);

const SCREEN_COPY = {
  home: {
    eyebrow: "Welcome back",
    title: "Simple golf flow, polished enough to trust during a real round.",
    description: "Start quickly, find your active game fast, and keep the dashboard calm enough for every golfer to understand.",
  },
  round: {
    eyebrow: "Live round companion",
    title: "Fast score entry, clear hole movement, and a leaderboard that stays readable on the course.",
    description: "The round workspace is built mobile-first so scoring, syncing, and finishing a card feel fast instead of fiddly.",
  },
  stats: {
    eyebrow: "Player progress",
    title: "Useful free stats today, premium insights ready when subscriptions arrive.",
    description: "Season progress, round summaries, and locked advanced analytics all live in one structured player history.",
  },
  community: {
    eyebrow: "Group play",
    title: "Invite rounds, social groups, and tournament entry points without the placeholder feel.",
    description: "Community keeps live group play and event tools organized, with clear upgrade paths for premium league features.",
  },
  premium: {
    eyebrow: "Premium and shop",
    title: "A high-end upgrade path with billing-ready structure and future gear expansion.",
    description: "Premium shows why the paid tier matters without feeling pushy, and the shop scaffolding stays useful for round prep.",
  },
  help: {
    eyebrow: "Help and guide",
    title: "Short, plain-language answers that make the app easier to use.",
    description: "Open help when you need a fast answer, then jump right back into the round, stats, or account flow.",
  },
  settings: {
    eyebrow: "Profile and settings",
    title: "A clean place to manage your account, golf identity, appearance, and support tools.",
    description: "Settings keeps personal details, theme choices, and light social actions together without cluttering the rest of the app.",
  },
};

const HELP_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "The quickest way to understand the app on your first visit.",
    items: [
      { title: "Start here", body: "Sign in, then tap Start round on Home if you want the fastest path into the app." },
      { title: "Where things live", body: "Home keeps next actions simple. Round is live scoring. Stats is your history. Community is for group play." },
      { title: "Will my data stay saved?", body: "Yes. Rounds, stats, and profile details stay attached to the signed-in golfer on this device." },
    ],
  },
  {
    id: "accounts-profiles",
    title: "Accounts & Profiles",
    description: "Short answers for sign-in, profile setup, and switching golfers.",
    items: [
      { title: "Why create an account?", body: "Your rounds, stats, and plan access stay tied to one golfer instead of staying anonymous." },
      { title: "How do I switch golfers?", body: "Open Profile & settings, choose Sign Out, then sign in with another golfer or one of the demo accounts." },
      { title: "What is public?", body: "Other golfers only see your competitive profile. Email and account details stay private." },
    ],
  },
  {
    id: "playing-round",
    title: "Playing a Round",
    description: "How to start, join, score, and finish a round without getting lost.",
    items: [
      { title: "How do I start a round?", body: "Open Round, keep Golden Nugget loaded if you want the fastest path, and tap Start round." },
      { title: "How do invite codes work?", body: "Ask the host for the round code, open Community, then enter the code to join." },
      { title: "How should I score?", body: "Tap the large score buttons first. Use fairway, GIR, putts, and penalties for deeper stats." },
    ],
  },
  {
    id: "stats-competition",
    title: "Stats & Competition",
    description: "Quick definitions for the numbers and public player views.",
    items: [
      { title: "What do fairways and GIR mean?", body: "Fairways count tee shots in play on par 4 and 5 holes. GIR shows greens hit in regulation." },
      { title: "What is a competitive profile?", body: "It is your public golf card with safe stats that other players can view during group play." },
      { title: "Why are some numbers locked?", body: "Advanced analytics, insights, and detailed player comparisons are premium features." },
    ],
  },
  {
    id: "premium-features",
    title: "Premium Features",
    description: "What premium adds on top of the free round and stats flow.",
    items: [
      { title: "What unlocks with premium?", body: "Premium opens advanced analytics, deeper insights, player comparisons, and richer live tools." },
      { title: "Can I test premium now?", body: "Yes. Use the premium demo golfer, or use the hidden tester toggle after sign-in." },
      { title: "Is free still useful?", body: "Yes. Free keeps score tracking, round history, simple stats, and join-by-code working well." },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Quick fixes when something feels stuck or unclear.",
    items: [
      { title: "The round will not sync", body: "Check the sync card in Round. You can keep scoring locally, then host or reconnect again." },
      { title: "The app looks old", body: "Open App & Support and tap Refresh app. If the home-screen app still looks old after that, close and reopen it or reinstall once." },
      { title: "I am not sure what to do next", body: "Use the small Help links on each screen. They open the most relevant section first." },
    ],
  },
];

const SETTINGS_SECTIONS = [
  { id: "account", label: "Account" },
  { id: "golf-profile", label: "Golf Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "social", label: "Social" },
  { id: "app-support", label: "App & Support" },
];

const NAV_ICONS = {
  home: `
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V19h11v-8.5" />
    </svg>
  `,
  round: `
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="M6 4v16" />
      <path d="M6 5c2.2 0 3.2 1.4 5.2 1.4S14 5 16 5s2 .8 2 2.2c0 1.8-1 2.7-2.9 2.7S12.5 8.5 10.7 8.5 8 9.9 6 9.9" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  `,
  stats: `
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="M5 19V11" />
      <path d="M12 19V7" />
      <path d="M19 19v-5" />
      <path d="M4 19h16" />
    </svg>
  `,
  community: `
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <circle cx="8" cy="9" r="2.5" />
      <circle cx="16.5" cy="8.5" r="2" />
      <path d="M3.5 18c.8-2.6 2.8-4 4.5-4s3.7 1.4 4.5 4" />
      <path d="M13.5 17c.6-1.9 2.1-2.9 3.6-2.9 1.3 0 2.5.7 3.4 2.1" />
    </svg>
  `,
  premium: `
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="m5 16 2-8 5 5 5-7 2 10H5Z" />
      <path d="M7 19h10" />
    </svg>
  `,
};

function getActiveRound(state) {
  return state.rounds.find((round) => round.id === state.session.activeRoundId) || null;
}

function getSummaryRound(state) {
  return state.rounds.find((round) => round.id === state.session.summaryRoundId) || null;
}

function getActiveGroup(state, round) {
  if (!round) {
    return null;
  }

  return state.groups.find((group) => group.roundId === round.id) || null;
}

function getCompletedRounds(state) {
  return state.rounds
    .filter((round) => round.status === "completed")
    .sort((left, right) => (right.completedAt || 0) - (left.completedAt || 0));
}

function getSubscription(state) {
  return state.currentUser.subscription || {
    tier: "free",
    planName: "Free",
    status: "active",
    billingReady: true,
  };
}

function getNavActiveView(state) {
  const activeView = state.session.activeView || "home";
  if (VIEW_ORDER.some((view) => view.id === activeView)) {
    return activeView;
  }

  if (activeView === "settings") {
    const fallback = state.session.settingsReturnView || state.session.previousView || "stats";
    return VIEW_ORDER.some((view) => view.id === fallback) ? fallback : "stats";
  }

  if (activeView === "help") {
    const fallback = state.session.helpReturnView || state.session.previousView || "home";
    if (fallback === "auth") {
      return "home";
    }
    return VIEW_ORDER.some((view) => view.id === fallback) ? fallback : "home";
  }

  return "home";
}

function formatAverageScore(value) {
  return typeof value === "number" ? value.toFixed(1) : "--";
}

function formatSignedValue(value) {
  return typeof value === "number"
    ? `${value > 0 ? "+" : ""}${value.toFixed(1)}`
    : "--";
}

function formatPercent(value) {
  return typeof value === "number" ? `${value}%` : "--";
}

function formatToParValue(value) {
  if (typeof value !== "number") {
    return "--";
  }

  return value === 0 ? "E" : `${value > 0 ? "+" : ""}${value}`;
}

function formatHandicap(value) {
  return typeof value === "number" ? value.toFixed(1) : "--";
}

function formatComparisonMetric(label, value) {
  if (label === "Average score" || label === "Putts") {
    return formatAverageScore(value);
  }

  if (label === "Fairways" || label === "GIR") {
    return formatPercent(value);
  }

  if (label === "Driving") {
    return formatSignedValue(value);
  }

  return escapeHtml(String(value ?? "--"));
}

function renderRecentRoundRows(recentForm = []) {
  if (!recentForm.length) {
    return "";
  }

  return `
    <div class="competitive-recent-list">
      ${recentForm.slice(0, 3).map((entry) => `
        <article class="competitive-recent-row">
          <div>
            <strong>${escapeHtml(entry.courseName)}</strong>
            <p>${formatDate(entry.completedAt)}</p>
          </div>
          <span class="status-pill">${escapeHtml(formatToParValue(entry.toPar))}</span>
        </article>
      `).join("")}
    </div>
  `;
}

function renderHolePerformanceList(title, holes) {
  if (!holes?.length) {
    return `
      <article class="plan-card">
        <span class="mini-label">${escapeHtml(title)}</span>
        <strong>No rounds yet</strong>
        <p class="body-copy compact-copy">Finish more rounds to identify where scoring is strongest and weakest.</p>
      </article>
    `;
  }

  return `
    <article class="plan-card">
      <span class="mini-label">${escapeHtml(title)}</span>
      <div class="stack-list compact-stack">
        ${holes.map((hole) => `
          <div class="feature-row">Hole ${hole.holeNumber} / Par ${hole.par} / ${formatSignedValue(hole.averageToPar)} to par</div>
        `).join("")}
      </div>
    </article>
  `;
}

function renderHelpLink(label, sectionId, compact = false) {
  return `
    <button
      class="button subtle help-inline-button ${compact ? "is-compact" : ""}"
      type="button"
      data-action="open-help-section"
      data-section="${sectionId}"
    >
      <span class="help-inline-icon" aria-hidden="true">i</span>
      <span>${escapeHtml(label)}</span>
    </button>
  `;
}

function shouldShowFirstRoundGuide(state) {
  return state.auth?.status === "authenticated"
    && !state.currentUser?.seededDemo
    && getCompletedRounds(state).length === 0;
}

function renderFirstRoundGuide(state, placement) {
  if (!shouldShowFirstRoundGuide(state)) {
    return "";
  }

  const activeRound = getActiveRound(state);
  const activeRoundProgress = activeRound ? getRoundProgress(activeRound) : null;

  if (placement === "home") {
    if (activeRound) {
      return "";
    }

    return `
      <article class="card onboarding-card card-span-3">
        <div class="section-heading">
          <div>
            <p class="eyebrow">First round guide</p>
            <h3>Step 1 of 3: start your first round</h3>
          </div>
          <span class="status-pill">New golfer</span>
        </div>
        <p class="body-copy">Use the highlighted Start round button. Golden Nugget Lake Charles is already loaded so you can get into scoring quickly.</p>
        <div class="summary-grid onboarding-list">
          <article>
            <strong>1</strong>
            <p>Tap <strong>Start round</strong> on Home.</p>
          </article>
          <article>
            <strong>2</strong>
            <p>Keep Golden Nugget selected and press <strong>Start round</strong>.</p>
          </article>
          <article>
            <strong>3</strong>
            <p>Use the big score buttons, then finish the round to build Stats.</p>
          </article>
        </div>
        <div class="row-actions">
          <button class="button primary guided-action" type="button" data-action="nav-view" data-view="round">Start round now</button>
          ${renderHelpLink("Open Help Center", "getting-started", true)}
        </div>
      </article>
    `;
  }

  if (placement === "round-setup") {
    return `
      <article class="card onboarding-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">First round guide</p>
            <h3>Step 2 of 3: create the round</h3>
          </div>
          <span class="status-pill">Keep it simple</span>
        </div>
        <p class="body-copy compact-copy">For the easiest first round, keep stroke play selected, leave Golden Nugget loaded, and tap the highlighted <strong>Start round</strong> button.</p>
      </article>
    `;
  }

  if (placement === "round-live") {
    if (activeRoundProgress?.completedHoles > 0) {
      return "";
    }

    return `
      <article class="card onboarding-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">First round guide</p>
            <h3>Step 3 of 3: score a few holes</h3>
          </div>
          <span class="status-pill">Live scoring</span>
        </div>
        <p class="body-copy compact-copy">Tap your own large score buttons first, use Save & next to keep moving, and only open Advanced hole stats if you want the deeper numbers.</p>
      </article>
    `;
  }

  return "";
}

function renderHelpCenterCard() {
  return `
    <article class="card stats-quiet-card help-center-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Help Center</p>
          <h3>Short guides, not a giant FAQ</h3>
        </div>
      </div>
      <p class="body-copy compact-copy">Open the help center from your account area whenever you need a quick answer about sign-in, rounds, stats, premium, or troubleshooting.</p>
      <div class="stack-list help-center-list">
        <div class="feature-row">Getting Started</div>
        <div class="feature-row">Accounts & Profiles</div>
        <div class="feature-row">Playing a Round</div>
        <div class="feature-row">Stats & Competition</div>
      </div>
      <div class="row-actions">
        <button class="button primary" type="button" data-action="open-help-section" data-section="getting-started">Open Help Center</button>
        <button class="button subtle" type="button" data-action="open-help-section" data-section="troubleshooting">Troubleshooting</button>
      </div>
    </article>
  `;
}

function getOrderedHelpSections(selectedId) {
  if (!selectedId || !HELP_SECTIONS.some((section) => section.id === selectedId)) {
    return HELP_SECTIONS;
  }

  const selected = HELP_SECTIONS.find((section) => section.id === selectedId);
  return [selected, ...HELP_SECTIONS.filter((section) => section.id !== selectedId)];
}

function findParticipantProfileId(round, participantId) {
  if (round.mode === "stroke") {
    return round.players.find((player) => player.id === participantId)?.profileId || null;
  }

  const side = round.sides.find((entry) => entry.id === participantId);
  const leadPlayerId = side?.playerIds?.[0];
  return round.players.find((player) => player.id === leadPlayerId)?.profileId || null;
}

function isPremiumSubscription(subscription) {
  return (typeof subscription === "string" ? subscription : subscription?.tier) === "premium";
}
function isModeLocked(modeId, subscription) {
  return PREMIUM_MODE_IDS.includes(modeId) && !isPremiumSubscription(subscription);
}
function getFeatureGate(featureId, subscription) {
  const premium = isPremiumSubscription(subscription);
  const locked = PREMIUM_FEATURES.has(featureId) && !premium;

  return {
    featureId,
    locked,
    badge: locked ? "Premium" : premium ? "Included" : "Free",
    tone: locked ? "locked" : premium ? "premium" : "free",
  };
}

function getRoundProgress(round) {
  const completedHoles = round.holes.filter((hole) => hole.entries.some((entry) => entry.strokes && entry.strokes > 0)).length;
  const frontNine = round.holes
    .slice(0, 9)
    .filter((hole) => hole.entries.some((entry) => entry.strokes && entry.strokes > 0)).length;
  const backNine = round.holes
    .slice(9)
    .filter((hole) => hole.entries.some((entry) => entry.strokes && entry.strokes > 0)).length;

  return {
    completedHoles,
    remainingHoles: round.holes.length - completedHoles,
    frontNine,
    backNine,
  };
}

function getHoleCompletionStats(round, holeNumber) {
  const hole = round?.holes?.find((item) => item.number === holeNumber);
  if (!hole) {
    return { scored: 0, total: 0 };
  }

  const scored = hole.entries.filter((entry) => entry.strokes !== null && entry.strokes > 0).length;
  return {
    scored,
    total: hole.entries.length,
  };
}
function getNextOpenHole(round, selectedHole = 1) {
  if (!round?.holes?.length) {
    return selectedHole;
  }

  const afterSelected = round.holes.slice(selectedHole).concat(round.holes.slice(0, selectedHole));
  const nextHole = afterSelected.find((hole) => hole.entries.some((entry) => entry.strokes === null || entry.strokes === 0));

  return nextHole ? nextHole.number : selectedHole;
}
function getSyncPresentation(round, group) {
  const pendingCount = getPendingRoundEvents(round).length;
  const saveState = round?.sync?.saveState || "saved-local";
  const transport = round?.sync?.transport || "local";
  const stateLabel = round?.sync?.state || "local";
  const lastEventAt = round?.sync?.lastEventAt || null;
  const inviteCode = group?.inviteCode || round?.inviteCode || null;
  const stale = transport !== "local" && transport !== "nearby" ? Boolean(lastEventAt && Date.now() - lastEventAt > 45000) : false;

  if (saveState === "retry-needed") {
    return {
      tone: "warning",
      title: "Saved locally / retry needed",
      message: `${pendingCount === 1 ? "1 change is" : `${pendingCount} changes are`} still safe on this phone. Golfers Nation will retry cloud backup when service returns, and any joined golfer can keep scoring locally even if the original host leaves.`,
    };
  }

  if (saveState === "syncing") {
    return {
      tone: "success",
      title: "Syncing live changes",
      message: `${pendingCount === 1 ? "1 local update is" : `${pendingCount} local updates are`} already safe on this phone and are backing up now.`,
    };
  }

  if (transport === "local") {
    return {
      tone: "quiet",
      title: "Local score mode",
      message: pendingCount
        ? `${pendingCount === 1 ? "1 change is" : `${pendingCount} changes are`} saved locally already. Host with an invite code when the rest of the group is ready.`
        : "Scores are safe on this phone. Host with an invite code when the rest of the group is ready.",
    };
  }

  if (stale) {
    return {
      tone: "warning",
      title: "Reconnect check",
      message: `No live update since ${formatRelativeSync(lastEventAt)}. Re-host with ${inviteCode || "your invite code"} or fall back to nearby sync if the room feels stuck.`,
    };
  }

  if (stateLabel === "hosting") {
    return {
      tone: "success",
      title: "Live room open",
      message: `Invite code ${inviteCode || "pending"} is ready. The original host can leave later because every joined golfer keeps a safe local card.`,
    };
  }

  if (stateLabel === "connected") {
    return {
      tone: "success",
      title: "Sync healthy",
      message: `Shared updates are flowing through ${escapeHtml(round.sync.label)}. Last activity: ${formatRelativeSync(lastEventAt)}. Every joined device still saves locally first.`,
    };
  }

  return {
    tone: "quiet",
    title: "Sync standing by",
    message: "This round is ready to reconnect whenever you enable hosting, nearby, or future cloud-backed sync.",
  };
}

function getCloudSyncStatusTitle(cloudSync = {}) {
  if (cloudSync.scope === "round-finish") {
    return "Saving finished round";
  }

  if (cloudSync.scope === "round-live") {
    return "Syncing live round";
  }

  return "Saving changes";
}

function getRoundSavePresentation(round) {
  const pendingCount = getPendingRoundEvents(round).length;
  const saveState = round?.sync?.saveState || "saved-local";
  const lastLocalSaveAt = round?.sync?.lastLocalSaveAt || round?.updatedAt || round?.createdAt || 0;
  const lastSyncedAt = round?.sync?.lastSyncedAt || 0;
  const lastSyncError = round?.sync?.lastSyncError || "";

  if (saveState === "retry-needed") {
    return {
      tone: "warning",
      title: "Retry needed",
      badge: "Saved locally",
      detail: `${pendingCount === 1 ? "1 change is" : `${pendingCount} changes are`} still safe on this phone. Keep scoring now and retry cloud backup when service improves.`,
      meta: `Saved here ${formatRelativeSync(lastLocalSaveAt)}`,
      submeta: lastSyncError ? `Latest cloud issue: ${lastSyncError}` : "Cloud backup will keep retrying in the background.",
      showRetry: true,
    };
  }

  if (saveState === "syncing") {
    return {
      tone: "success",
      title: "Syncing",
      badge: pendingCount ? `${pendingCount} waiting` : "Backing up",
      detail: `${pendingCount === 1 ? "1 change is" : `${pendingCount} changes are`} already saved locally and are backing up now.`,
      meta: `Saved here ${formatRelativeSync(lastLocalSaveAt)}`,
      submeta: "You can keep scoring while backup finishes.",
      showRetry: false,
    };
  }

  if (saveState === "synced") {
    return {
      tone: "success",
      title: "Synced",
      badge: "Cloud backup complete",
      detail: round?.status === "completed"
        ? "This finished round is backed up and will reload with this golfer account."
        : "Scores are safe on this phone and backed up to your golfer account.",
      meta: `Cloud backup ${formatRelativeSync(lastSyncedAt || lastLocalSaveAt)}`,
      submeta: "Refresh or reopen later and this round stays attached to this golfer.",
      showRetry: false,
    };
  }

  return {
    tone: "quiet",
    title: "Saved locally",
    badge: pendingCount ? `${pendingCount} waiting` : "Local-first",
    detail: pendingCount
      ? `${pendingCount === 1 ? "1 change is" : `${pendingCount} changes are`} stored safely on this phone first and waiting for cloud backup.`
      : "This phone has the latest score changes even if signal drops for a while.",
    meta: `Saved here ${formatRelativeSync(lastLocalSaveAt)}`,
    submeta: "Cloud backup resumes automatically when the connection is ready.",
    showRetry: false,
  };
}

function renderNav(state) {
  const navActiveView = getNavActiveView(state);
  return VIEW_ORDER.map((view) => {
    const isActive = navActiveView === view.id;
    const activeClass = isActive ? "is-active" : "";
    const currentAttr = isActive ? 'aria-current="page"' : "";
    const selectedAttr = isActive ? "true" : "false";
    return `
      <button
        id="tab-${view.id}"
        class="nav-item ${activeClass}"
        data-action="nav-view"
        data-view="${view.id}"
        type="button"
        role="tab"
        aria-selected="${selectedAttr}"
        aria-controls="app-screen-${view.id}"
        aria-label="${escapeHtml(view.label)}"
        ${currentAttr}
      >
        <span class="nav-icon">${NAV_ICONS[view.id] || ""}</span>
        <strong class="nav-label">${escapeHtml(view.label)}</strong>
        <span class="nav-indicator" aria-hidden="true"></span>
      </button>
    `;
  }).join("");
}

function renderAppShellHeader(state, activeRound, subscription) {
  const viewId = state.session.activeView || "home";
  const currentView = VIEW_ORDER.find((view) => view.id === viewId);
  const firstName = state.currentUser.name?.split(" ")[0] || "Golfer";
  let title = currentView?.label || "Home";
  let subtitle = subscription.tier === "premium" ? "Premium golfer" : "Free golfer";
  let headerClass = "app-header-card--utility";
  let contextClass = "app-header-context--utility";

  if (viewId === "home") {
    headerClass = "app-header-card--home";
    contextClass = "app-header-context--home";
    title = "Home";
    subtitle = activeRound
      ? `Welcome back, ${firstName}. Resume ${activeRound.courseName} on hole ${state.session.selectedHole}.`
      : `Welcome back, ${firstName}. Start a round quickly and keep the rest of the app in sync.`;
  } else if (viewId === "round") {
    headerClass = "app-header-card--round";
    contextClass = "app-header-context--round";
    title = activeRound ? `Hole ${state.session.selectedHole}` : "Round";
    subtitle = activeRound
      ? `${activeRound.courseName} / ${activeRound.players.length} golfers`
      : "Start a local or invite round to begin scoring.";
  } else if (viewId === "stats") {
    title = "Stats";
    subtitle = `${state.currentUser.roundsPlayed || 0} rounds saved${typeof state.currentUser.averageScore === "number" ? ` / ${state.currentUser.averageScore.toFixed(1)} avg` : ""}`;
  } else if (viewId === "community") {
    title = "Community";
    subtitle = activeRound
      ? `Invite ${activeRound.inviteCode || "ready when hosted"} / ${activeRound.sync.label}`
      : "Join by code, host a round, or enter event play.";
  } else if (viewId === "premium") {
    title = "Premium";
    subtitle = subscription.tier === "premium"
      ? "Advanced stats and live tools are unlocked on this account."
      : "See what premium adds without losing the simple free flow.";
  } else if (viewId === "settings") {
    title = "Profile & settings";
    subtitle = "Account, golf profile, appearance, and support tools.";
  } else if (viewId === "help") {
    title = "Help Center";
    subtitle = "Short answers that get golfers back to the round quickly.";
  }

  return `
    <header class="app-header-card ${headerClass}" data-view="${escapeHtml(viewId)}">
      <div class="app-header-context ${contextClass}">
        ${viewId === "home"
          ? `
            <button
              class="brand-mark brand-mark--compact"
              type="button"
              data-action="admin-secret-tap"
              aria-label="Golfers Nation admin toggle"
            >
              GN
            </button>
          `
          : ""}
        <div class="app-header-copy">
          ${viewId === "home" ? '<span class="mini-label app-header-overline">Golfers Nation</span>' : ""}
          <strong class="app-header-title">${escapeHtml(title)}</strong>
          <p class="app-header-subtitle">${escapeHtml(subtitle)}</p>
        </div>
      </div>
      <button
        class="account-trigger"
        type="button"
        data-action="open-settings"
        data-section="account"
        aria-label="Profile and settings"
      >
        ${renderAvatarChip(state.currentUser.avatarLabel || firstName, "is-header")}
        <span class="account-trigger-copy">
          <span class="mini-label">Profile & settings</span>
          <strong>${escapeHtml(firstName)}</strong>
        </span>
      </button>
    </header>
  `;
}

function renderScreenHeader(state, activeRound) {
  if (["round", "stats", "community", "premium"].includes(state.session.activeView)) {
    return "";
  }

  const copy = SCREEN_COPY[state.session.activeView] || SCREEN_COPY.home;
  const subscription = getSubscription(state);
  const premium = isPremiumSubscription(subscription);
  const hasActiveRound = Boolean(activeRound);
  const nextOpenHole = activeRound ? getNextOpenHole(activeRound, state.session.selectedHole) : 1;
  const summaryRound = getSummaryRound(state);
  const metrics = getHistoryMetrics(state.rounds, state.currentUser.id);

  if (state.session.activeView === "home") {
    const guided = shouldShowFirstRoundGuide(state) && !hasActiveRound;
    const actionMarkup = `
      <button
        class="button primary hero-action-button ${guided ? "guided-action" : ""}"
        type="button"
        ${hasActiveRound ? `data-action="resume-round" data-round-id="${activeRound.id}"` : 'data-action="nav-view" data-view="round"'}
      >
        ${hasActiveRound ? "Continue round" : "Start round"}
      </button>
    `;

    return `
      <header class="screen-hero screen-hero--home">
        <div class="screen-hero-main">
          <div class="screen-copy">
            <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
            <h2>${escapeHtml(`Ready for the next clean round, ${state.currentUser.name.split(" ")[0]}?`)}</h2>
            <p class="hero-copy">${escapeHtml(copy.description)}</p>
          </div>
          <div class="screen-hero-actions">
            ${actionMarkup}
            <p class="hero-support-copy">${hasActiveRound ? `Live at ${escapeHtml(activeRound.courseName)} and ready to resume.` : "Start one round and the app history, stats, and group tools all build from there."}</p>
          </div>
        </div>
        <div class="screen-meta">
          <span class="top-chip">${escapeHtml(state.currentUser.city)}</span>
          <span class="top-chip">${premium ? "Premium access" : "Free plan"}</span>
          <span class="top-chip">${hasActiveRound ? `Live on ${escapeHtml(activeRound.courseName)}` : "No round in play"}</span>
        </div>
      </header>
    `;
  }

  let title = copy.eyebrow;
  let description = copy.description;
  let actionMarkup = "";
  let metaItems = [];

  if (state.session.activeView === "round") {
    title = hasActiveRound ? `Hole ${state.session.selectedHole}` : "Round setup";
    description = hasActiveRound
      ? `${activeRound.courseName} / ${GAME_MODES[activeRound.mode].label} / ${activeRound.players.length} golfers`
      : "Start a round to unlock the live scoring companion.";
    actionMarkup = hasActiveRound
      ? `
        <button class="button primary utility-header-button" type="button" data-action="jump-next-open" data-hole="${nextOpenHole}">
          Next open
        </button>
      `
      : "";
    metaItems = [
      hasActiveRound ? `Sync ${activeRound.sync.label}` : "Local ready",
      hasActiveRound ? `Invite ${activeRound.inviteCode || "Ready when hosted"}` : "Invite later",
    ];
  } else if (state.session.activeView === "stats") {
    title = "Player progress";
    description = summaryRound
      ? `Latest card saved from ${summaryRound.courseName}.`
      : "Finish a round and this becomes your clean player archive.";
    actionMarkup = summaryRound
      ? `
        <button class="button primary utility-header-button" type="button" data-action="view-summary" data-round-id="${summaryRound.id}">
          Latest summary
        </button>
      `
      : `
        <button
          class="button primary utility-header-button"
          type="button"
          ${hasActiveRound ? `data-action="resume-round" data-round-id="${activeRound.id}"` : 'data-action="nav-view" data-view="round"'}
        >
          ${hasActiveRound ? "Resume round" : "Start a round"}
        </button>
      `;
    metaItems = [
      `Rounds: ${metrics.roundsPlayed}`,
      `Average: ${metrics.scoringAverage ? metrics.scoringAverage.toFixed(1) : "--"}`,
      premium ? "Premium insights included" : "Advanced insights locked",
    ];
  } else if (state.session.activeView === "community") {
    title = "Group play";
    description = hasActiveRound
      ? "Host the current round, share a code, or manage nearby play."
      : "Join by code, host later, or keep event tools organized.";
    actionMarkup = hasActiveRound
      ? `
        <button class="button primary utility-header-button" type="button" data-action="host-active-round">
          Host active round
        </button>
      `
      : `
        <button class="button primary utility-header-button" type="button" data-action="nav-view" data-view="round">
          Start a round first
        </button>
      `;
    metaItems = [
      hasActiveRound ? `Room ${activeRound.inviteCode || "Not hosted"}` : "Room not live",
      hasActiveRound ? `Transport ${activeRound.sync.label}` : "Transport local",
      `${state.tournaments.length} events`,
    ];
  } else if (state.session.activeView === "premium") {
    title = premium ? "Premium access" : "Premium upgrade";
    description = premium
      ? "Advanced analytics, comparison, and live tools are ready on this golfer."
      : "See the premium layer without interrupting the free round flow.";
    actionMarkup = `
      <button class="button primary utility-header-button" type="button" data-action="nav-view" data-view="stats">
        ${premium ? "Use premium stats" : "See locked stats"}
      </button>
    `;
    metaItems = [
      `${subscription.planName || (premium ? "Premium" : "Free")} plan`,
      `Billing ${subscription.billingReady ? "ready" : "later"}`,
      `${state.currentUser.providerType || state.currentUser.provider || "email"} account`,
    ];
  } else if (state.session.activeView === "help") {
    title = "Help and guide";
    description = "Short answers for sign-in, rounds, score entry, stats, premium, and troubleshooting.";
    actionMarkup = `
      <button class="button primary utility-header-button" type="button" data-action="close-help">
        Back to ${escapeHtml(VIEW_ORDER.find((view) => view.id === state.session.helpReturnView)?.label || (state.session.helpReturnView === "auth" ? "sign in" : "home"))}
      </button>
    `;
    metaItems = [
      "Short help cards",
      "Mobile-friendly answers",
      "Context links throughout the app",
    ];
  } else if (state.session.activeView === "settings") {
    title = "Profile and settings";
    description = "Manage account details, golf identity, appearance, and support tools.";
    actionMarkup = `
      <button class="button secondary utility-header-button" type="button" data-action="close-settings">
        Back
      </button>
    `;
    metaItems = [
      `${state.currentUser.subscription?.tier === "premium" ? "Premium" : "Free"} golfer`,
      state.currentUser.providerType || state.currentUser.provider || "email",
    ];
  }

  return `
    <header class="screen-utility-bar screen-utility-bar--${state.session.activeView}">
      <div class="screen-utility-main">
        <div class="screen-copy utility-copy-group">
          <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
          <h2 class="utility-heading">${escapeHtml(title)}</h2>
          <p class="hero-copy utility-copy">${escapeHtml(description)}</p>
        </div>
        <div class="screen-utility-actions">
          ${actionMarkup}
        </div>
      </div>
      ${metaItems.length
        ? `
          <div class="screen-meta screen-meta--utility">
            ${metaItems.map((item) => `<span class="top-chip">${escapeHtml(item)}</span>`).join("")}
          </div>
        `
        : ""}
    </header>
  `;
}

function renderPlanPill(state) {
  const subscription = getSubscription(state);
  const premium = isPremiumSubscription(subscription);

  return `
    <article class="rail-card tier-card ${premium ? "is-premium" : ""}">
      <span class="mini-label">Membership</span>
      <strong>${escapeHtml(subscription.planName || (premium ? "Premium" : "Free"))}</strong>
      <p>${premium ? "Advanced analytics and group tools are unlocked for this account." : "Basic scoring is active. Advanced insights stay neatly locked until premium access is active."}</p>
      <button class="button ${premium ? "secondary" : "primary"}" type="button" data-action="nav-view" data-view="premium">
        ${premium ? "Manage premium" : "See premium"}
      </button>
    </article>
  `;
}

function renderSummarySpotlight(state, summaryRound) {
  if (!summaryRound) {
    return "";
  }

  const summary = getRoundSummary(summaryRound, state.currentUser.id);
  const premiumInsights = !getFeatureGate("round-insights", getSubscription(state)).locked
    ? summary.roundInsights.slice(0, 2)
    : [];
  return `
    <section class="summary-spotlight card premium-summary-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Recent finish</p>
          <h3>${escapeHtml(summaryRound.courseName)} / ${escapeHtml(summary.roundLabel)}</h3>
        </div>
        <div class="row-actions">
          <button class="button subtle" type="button" data-action="dismiss-summary">Hide</button>
          <button class="button secondary" type="button" data-action="view-summary" data-round-id="${summaryRound.id}">Open summary</button>
        </div>
      </div>
      <div class="summary-grid">
        <article>
          <span>Winner</span>
          <strong>${escapeHtml(summary.winnerLabel)}</strong>
        </article>
        <article>
          <span>Your finish</span>
          <strong>${escapeHtml(summary.localParticipant?.displayStatus || "--")}</strong>
        </article>
        <article>
          <span>Holes played</span>
          <strong>${summary.holesPlayed}/${summary.totalHoles}</strong>
        </article>
        <article>
          <span>Average putts</span>
          <strong>${summary.localTotals?.averagePutts ? summary.localTotals.averagePutts.toFixed(1) : "--"}</strong>
        </article>
      </div>
      <div class="summary-detail-list">
        ${summary.leaderboard
          .slice(0, 3)
          .map(
            (entry) => `
              <article class="summary-detail-row ${entry.isLocal ? "is-local" : ""}">
                <div>
                  <span>Rank ${entry.rank}</span>
                  <strong>${escapeHtml(entry.name)}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>${escapeHtml(entry.displayStatus)}</strong>
                </div>
                <div>
                  <span>${summaryRound.mode === "match" ? "Holes won" : "Total"}</span>
                  <strong>${entry.total || 0}</strong>
                </div>
              </article>
            `
          )
          .join("")}
      </div>
      ${premiumInsights.length
        ? `
          <div class="stack-list compact-stack">
            ${premiumInsights.map((insight) => `<div class="feature-row">${escapeHtml(insight)}</div>`).join("")}
          </div>
        `
        : ""}
    </section>
  `;
}

function renderAvatarChip(label, sizeClass = "") {
  const source = String(label || "GN").trim();
  const compact = source.length <= 2 && !source.includes(" ")
    ? source.toUpperCase()
    : source
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("")
        .slice(0, 2) || "GN";
  return `<span class="avatar-chip ${sizeClass}">${escapeHtml(compact)}</span>`;
}

function renderAuthEntryCard(state) {
  const auth = state.auth || {};
  const connected = auth.status === "authenticated";

  if (!connected) {
    return "";
  }

  return `
    <article class="card account-access-card stats-quiet-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Account status</p>
          <h3>Signed in and saving to this golfer</h3>
        </div>
        <span class="status-pill">Ready</span>
      </div>
      <p class="body-copy">Your rounds, stats, and premium access now follow this account. Open Profile & settings any time you want to manage the golfer on this device.</p>
      <div class="account-access-meta">
        <span class="top-chip">Primary: ${escapeHtml(auth.provider || "email")}</span>
        <span class="top-chip">Linked: ${escapeHtml((auth.linkedProviders || []).join(", ") || "none")}</span>
        <span class="top-chip">${escapeHtml(state.currentUser.subscription?.tier === "premium" ? "Premium tester access" : "Free plan")}</span>
      </div>
      <p class="body-copy compact-copy">Use the small avatar button in the top-right to manage this golfer, change appearance, or sign out.</p>
      <div class="row-actions">
        <button class="button subtle" type="button" data-action="open-help-section" data-section="accounts-profiles">Help Center</button>
      </div>
    </article>
  `;
}

function renderPlayerProfileCard(state) {
  const profile = getCurrentProfile(state);
  const publicPreview = buildCompetitivePreview(state, state.currentUser.profileId, state.currentUser.profileId);
  const visibilityLabel = PROFILE_VISIBILITY_OPTIONS.find((option) => option.id === state.currentUser.privacy?.profileVisibility)?.label || "Friends only";

  if (!profile) {
    return "";
  }

  return `
    <article class="card player-profile-card card-span-2">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Player profile</p>
          <h3>Player details and privacy</h3>
        </div>
        <span class="status-pill">${escapeHtml(state.currentUser.subscription?.tier === "premium" ? "Premium" : "Free")}</span>
      </div>
      <div class="profile-identity-row">
        ${renderAvatarChip(profile.publicProfile.avatarLabel, "is-large")}
        <div>
          <strong>${escapeHtml(profile.publicProfile.displayName)}</strong>
          <p>${escapeHtml(profile.publicProfile.username)} / Joined ${formatDate(profile.account.createdAt)} / ${publicPreview?.roundsPlayed || 0} rounds / ${escapeHtml(visibilityLabel)}</p>
        </div>
      </div>
      <div class="profile-visibility-grid">
        <article class="visibility-card">
          <span>Only you can see</span>
          <strong>${escapeHtml(state.currentUser.email || "Email ready")}</strong>
          <p>Account email, provider details, and privacy settings stay private.</p>
        </article>
        <article class="visibility-card">
          <span>Other golfers can see</span>
          <strong>${publicPreview ? `${publicPreview.roundsPlayed} rounds / ${formatAverageScore(publicPreview.averageScore)} avg` : "Public profile ready"}</strong>
          <p>Name, avatar, selected stats, and anything you allow through privacy settings.</p>
        </article>
      </div>
      <div class="summary-grid compact">
        <article>
          <span>Rounds played</span>
          <strong>${publicPreview?.roundsPlayed || 0}</strong>
        </article>
        <article>
          <span>Average score</span>
          <strong>${formatAverageScore(publicPreview?.averageScore)}</strong>
        </article>
        <article>
          <span>Best round</span>
          <strong>${publicPreview?.bestRound || "--"}</strong>
        </article>
        <article>
          <span>Fairways</span>
          <strong>${formatPercent(publicPreview?.fairwayPercentage)}</strong>
        </article>
        <article>
          <span>GIR</span>
          <strong>${formatPercent(publicPreview?.girPercentage)}</strong>
        </article>
        <article>
          <span>Form</span>
          <strong>${escapeHtml(publicPreview?.formLabel || "Stable")}</strong>
        </article>
      </div>
      <p class="body-copy compact-copy">Your account and golf identity now have a dedicated settings area. Update profile details, appearance, privacy, and light social preferences there instead of editing them inside Stats.</p>
      <div class="row-actions help-row">
        ${renderHelpLink("Profile and account help", "accounts-profiles", true)}
      </div>
    </article>
  `;
}

function renderCompetitivePreviewCard(state, profileId, title = "Competitive preview") {
  const preview = buildCompetitivePreview(state, profileId, state.currentUser.profileId);
  if (!preview) {
    return "";
  }

  const comparison = profileId !== state.currentUser.profileId
    ? buildPlayerComparison(state, state.currentUser.profileId, profileId)
    : null;
  const advancedGate = getFeatureGate("advanced-stats", getSubscription(state));
  const comparisonGate = getFeatureGate("player-comparison", getSubscription(state));
  const isCurrentUser = profileId === state.currentUser.profileId;

  if (comparison && !comparisonGate.locked) {
    return `
      <article class="card competitive-preview-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Player comparison</p>
            <h3>${escapeHtml(title)}</h3>
          </div>
          <span class="status-pill">${escapeHtml(comparison.right.formLabel)}</span>
        </div>
        <div class="comparison-grid comparison-player-grid">
          <article class="comparison-player-card">
            <div class="profile-identity-row compact-profile-row">
              ${renderAvatarChip(comparison.left.avatarLabel, "is-large")}
              <div>
                <strong>${escapeHtml(comparison.left.displayName)}</strong>
                <p>${escapeHtml(comparison.left.username)} / You</p>
              </div>
            </div>
          </article>
          <article class="comparison-player-card">
            <div class="profile-identity-row compact-profile-row">
              ${renderAvatarChip(comparison.right.avatarLabel, "is-large")}
              <div>
                <strong>${escapeHtml(comparison.right.displayName)}</strong>
                <p>${escapeHtml(comparison.right.username)} / ${escapeHtml(comparison.right.headToHeadLabel)}</p>
              </div>
            </div>
          </article>
        </div>
        <div class="comparison-metric-list">
          ${comparison.metricRows.map((row) => `
            <article class="comparison-metric-row">
              <strong>${formatComparisonMetric(row.label, row.left)}</strong>
              <span>${escapeHtml(row.label)}</span>
              <strong>${formatComparisonMetric(row.label, row.right)}</strong>
            </article>
          `).join("")}
        </div>
        <div class="summary-grid compact comparison-summary-grid">
          <article>
            <span>Best round</span>
            <strong>${comparison.left.bestRound || "--"} / ${comparison.right.bestRound || "--"}</strong>
          </article>
          <article>
            <span>Handicap</span>
            <strong>${advancedGate.locked ? "Premium" : `${formatHandicap(comparison.left.handicapIndex)} / ${formatHandicap(comparison.right.handicapIndex)}`}</strong>
          </article>
          <article>
            <span>Home course</span>
            <strong>${escapeHtml(comparison.left.homeCourse || "Private")} / ${escapeHtml(comparison.right.homeCourse || "Private")}</strong>
          </article>
        </div>
        <div class="competitive-section-block">
          <p class="mini-label">Recent rounds</p>
          <div class="comparison-grid comparison-recent-grid">
            <div>${renderRecentRoundRows(comparison.left.recentForm)}</div>
            <div>${renderRecentRoundRows(comparison.right.recentForm)}</div>
          </div>
        </div>
        ${advancedGate.locked
          ? `
            <div class="feature-row comparison-callout">
              Premium unlocks handicap scaffolding, par-type breakdowns, and smarter side-by-side insight.
            </div>
          `
          : `
            <div class="stack-list compact-stack">
              <div class="feature-row">Trend: ${escapeHtml(comparison.left.trendSummary)} / ${escapeHtml(comparison.right.trendSummary)}</div>
              <div class="feature-row">Par 5 scoring: ${formatAverageScore(comparison.left.scoringByParType?.[5]?.averageScore)} / ${formatAverageScore(comparison.right.scoringByParType?.[5]?.averageScore)}</div>
              <div class="feature-row">Driving SG: ${formatSignedValue(comparison.left.strokesGained?.driving?.value)} / ${formatSignedValue(comparison.right.strokesGained?.driving?.value)}</div>
              <div class="feature-row">Toughest hole: ${comparison.left.hardestHoles?.[0] ? `Hole ${comparison.left.hardestHoles[0].holeNumber}` : "--"} / ${comparison.right.hardestHoles?.[0] ? `Hole ${comparison.right.hardestHoles[0].holeNumber}` : "--"}</div>
            </div>
          `}
        <div class="row-actions competitive-action-row">
          <button class="button subtle" type="button" data-action="share-profile-placeholder">Share your card</button>
          <button class="button subtle" type="button" data-action="share-round-summary-placeholder">Share round summary</button>
        </div>
      </article>
    `;
  }

  return `
    <article class="card competitive-preview-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Competitive profile</p>
          <h3>${escapeHtml(title)}</h3>
        </div>
      </div>
      <div class="profile-identity-row">
        ${renderAvatarChip(preview.avatarLabel, "is-large")}
        <div>
          <strong>${escapeHtml(preview.displayName)}</strong>
          <p>${escapeHtml(preview.username)} / ${escapeHtml(preview.headToHeadLabel)}</p>
        </div>
      </div>
      <div class="summary-grid compact">
        <article>
          <span>Rounds played</span>
          <strong>${preview.roundsPlayed}</strong>
        </article>
        <article>
          <span>Average score</span>
          <strong>${formatAverageScore(preview.averageScore)}</strong>
        </article>
        <article>
          <span>Best round</span>
          <strong>${preview.bestRound || "--"}</strong>
        </article>
        <article>
          <span>Form</span>
          <strong>${escapeHtml(preview.formLabel)}</strong>
        </article>
        <article>
          <span>Fairways</span>
          <strong>${formatPercent(preview.fairwayPercentage)}</strong>
        </article>
        <article>
          <span>GIR</span>
          <strong>${formatPercent(preview.girPercentage)}</strong>
        </article>
        <article>
          <span>Putts</span>
          <strong>${formatAverageScore(preview.averagePutts)}</strong>
        </article>
      </div>
      ${(preview.homeCourse || preview.handicap !== null && preview.handicap !== undefined)
        ? `
          <div class="competitive-public-strip">
            ${preview.homeCourse ? `<span>Home course ${escapeHtml(preview.homeCourse)}</span>` : ""}
            ${preview.handicap !== null && preview.handicap !== undefined ? `<span>Handicap ${escapeHtml(String(preview.handicap))}</span>` : ""}
          </div>
        `
        : ""}
      ${preview.recentForm?.length
        ? `
          <div class="competitive-section-block">
            <p class="mini-label">Recent rounds</p>
            ${renderRecentRoundRows(preview.recentForm)}
          </div>
        `
        : ""}
      <div class="stack-list compact-stack">
        <div class="feature-row">Recent form: ${escapeHtml(preview.recentFormSummary)}</div>
        ${preview.homeCourse ? `<div class="feature-row">Home course: ${escapeHtml(preview.homeCourse)}</div>` : ""}
        ${preview.handicap !== null && preview.handicap !== undefined ? `<div class="feature-row">Handicap: ${escapeHtml(String(preview.handicap))}</div>` : ""}
        ${!advancedGate.locked && preview.handicapIndex !== null ? `<div class="feature-row">Handicap scaffold: ${formatHandicap(preview.handicapIndex)}</div>` : ""}
        ${!advancedGate.locked ? `<div class="feature-row">Trend: ${escapeHtml(preview.trendSummary)}</div>` : ""}
        ${!advancedGate.locked && preview.strokesGained ? `<div class="feature-row">Driving SG: ${formatSignedValue(preview.strokesGained.driving?.value)} / Approach SG: ${formatSignedValue(preview.strokesGained.approach?.value)} / Putting SG: ${formatSignedValue(preview.strokesGained.putting?.value)}</div>` : ""}
        ${preview.bio ? `<div class="feature-row">${escapeHtml(preview.bio)}</div>` : ""}
        <div class="feature-row">Head-to-head: ${escapeHtml(preview.headToHeadLabel)}</div>
        ${comparison && comparisonGate.locked
          ? `<div class="feature-row comparison-callout">Premium unlocks side-by-side comparison, strokes gained, and hardest-hole trends between players.</div>`
          : ""}
        ${!advancedGate.locked && preview.smartInsights?.length
          ? preview.smartInsights.map((insight) => `<div class="feature-row">${escapeHtml(insight)}</div>`).join("")
          : ""}
      </div>
      ${isCurrentUser
        ? `
          <div class="row-actions competitive-action-row">
            <button class="button subtle" type="button" data-action="share-profile-placeholder">Share profile</button>
            <button class="button subtle" type="button" data-action="share-round-summary-placeholder">Round brag card</button>
          </div>
        `
        : ""}
    </article>
  `;
}

function renderNearbyRoundRows(nearbyGames, {
  compact = false,
  actionLabel = "Join now",
} = {}) {
  if (!nearbyGames.length) {
    return "";
  }

  return nearbyGames.map((game) => `
    <article class="list-row ${compact ? "" : "large"} ${compact ? "" : "discovery-list-row"}">
      <div>
        <strong>${escapeHtml(game.title)}</strong>
        <p>${escapeHtml(game.courseName)} / ${escapeHtml(game.modeLabel)} / ${escapeHtml(game.statusLabel || `${game.playerCount || 0} golfers`)}</p>
      </div>
      <div class="list-metrics ${compact ? "" : "discovery-list-metrics"}">
        <span>${escapeHtml(game.distance)}</span>
        ${compact ? "" : `<span>${escapeHtml(game.transport)}</span>`}
        <span>${escapeHtml(game.inviteCode)}</span>
        <button class="button subtle" type="button" data-action="quick-join-code" data-code="${game.inviteCode}">${escapeHtml(actionLabel)}</button>
      </div>
    </article>
  `).join("");
}

function renderNearbyPlayerRows(nearbyPlayers) {
  if (!nearbyPlayers.length) {
    return `
      <div class="empty-state compact-empty-state">
        <strong>No nearby golfers visible yet.</strong>
        <p>As more testers join and host rounds, their public cards will appear here when privacy allows it.</p>
      </div>
    `;
  }

  return nearbyPlayers.slice(0, 5).map((player) => `
    <article class="nearby-player-row">
      <div class="nearby-player-main">
        ${renderAvatarChip(player.avatarLabel)}
        <div>
          <strong>${escapeHtml(player.displayName)}</strong>
          <p>${escapeHtml(player.username)} / ${escapeHtml(player.statusLabel)}</p>
        </div>
      </div>
      <div class="nearby-player-support">
        <span>${escapeHtml(player.detail)}</span>
        <span>${escapeHtml(player.statsSummary)}</span>
        ${player.homeCourse ? `<span>${escapeHtml(player.homeCourse)}</span>` : ""}
        ${player.handicap !== null && player.handicap !== undefined ? `<span>Hdcp ${escapeHtml(String(player.handicap))}</span>` : ""}
      </div>
      <div class="row-actions nearby-player-actions">
        <button class="button subtle" type="button" data-action="select-profile-preview" data-profile-id="${escapeHtml(player.profileId)}">${player.isLive ? "View live card" : "View card"}</button>
        ${player.inviteCode ? `<button class="button secondary" type="button" data-action="quick-join-code" data-code="${player.inviteCode}">Join round</button>` : ""}
      </div>
    </article>
  `).join("");
}

function renderPrimaryActions(state, activeRound) {
  const hasActiveRound = Boolean(activeRound && activeRound.status === "active");
  const guided = shouldShowFirstRoundGuide(state) && !hasActiveRound;
  return `
    <div class="cta-row">
      <button class="button primary hero-button ${guided ? "guided-action" : ""}" type="button" data-action="nav-view" data-view="round">Start round</button>
      <button class="button secondary hero-button" type="button" data-action="nav-view" data-view="community">Join by code</button>
      <button
        class="button subtle hero-button"
        type="button"
        ${hasActiveRound ? `data-action="resume-round" data-round-id="${activeRound.id}"` : "disabled"}
      >
        Continue round
      </button>
    </div>
  `;
}

function renderJoinRoundQuickCard(state, options = {}) {
  const {
    compact = false,
    showNearby = false,
    activeRound = null,
  } = options;
  const activeGroup = getActiveGroup(state, activeRound);
  const inviteCode = activeGroup?.inviteCode || activeRound?.inviteCode || "";
  const nearbyGames = showNearby ? listNearbyGames(state).slice(0, 3) : [];

  return `
    <article class="card ${compact ? "join-round-card--compact" : "join-round-card"}">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Join round</p>
          <h3>Enter a code and get into scoring fast</h3>
        </div>
        ${inviteCode ? `<span class="status-pill">Active code ${escapeHtml(inviteCode)}</span>` : ""}
      </div>
      <p class="body-copy compact-copy">Ask the host for the round code, type it once, and Golfers Nation will open your local score view for that shared round.</p>
      <form class="inline-form round-join-form" data-form="join-code">
        <label class="inline-grow">
          Invite code
          <input name="inviteCode" type="text" placeholder="Enter code" />
        </label>
        <button class="button primary" type="submit">Join by code</button>
      </form>
      <div class="row-actions join-round-actions">
        <button class="button secondary" type="button" data-action="nav-view" data-view="round">Start a new round</button>
        ${renderHelpLink("How invite codes work", "playing-round", true)}
      </div>
      ${nearbyGames.length
        ? `
          <div class="stack-list compact-stack nearby-preview-list">
            <p class="mini-label">Nearby and discoverable right now</p>
            ${renderNearbyRoundRows(nearbyGames, { compact: true })}
          </div>
        `
        : ""}
    </article>
  `;
}

function renderInstallCard(state) {
  if (state.session.installHintDismissed) {
    return "";
  }

  if (state.session.standaloneMode) {
    return `
      <article class="card install-card install-card--installed">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Installed app</p>
            <h3>Built for the home screen now</h3>
          </div>
          <span class="status-pill">Standalone</span>
        </div>
        <p class="body-copy">Golfers Nation is running in standalone mode with offline shell support, safer screen spacing, and a more native bottom navigation feel.</p>
        <div class="row-actions">
          <button class="button secondary" type="button" data-action="refresh-app">Refresh app</button>
        </div>
      </article>
    `;
  }

  if (state.session.installPromptAvailable) {
    return `
      <article class="card install-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Install app</p>
            <h3>Add Golfers Nation to your phone</h3>
          </div>
          <button class="button subtle" type="button" data-action="dismiss-install-card">Not now</button>
        </div>
        <p class="body-copy">Install the app for a cleaner, full-screen golf companion with faster relaunching and offline shell support.</p>
        <div class="row-actions">
          <button class="button primary" type="button" data-action="prompt-install">Install app</button>
        </div>
      </article>
    `;
  }

  if (state.session.installState === "ios-share") {
    return `
      <article class="card install-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Add to Home Screen</p>
            <h3>Install from Safari on iPhone</h3>
          </div>
          <button class="button subtle" type="button" data-action="dismiss-install-card">Not now</button>
        </div>
        <p class="body-copy">Use Safari Share, then tap <strong>Add to Home Screen</strong> for the cleaner standalone version of Golfers Nation.</p>
      </article>
    `;
  }

  return "";
}

function renderGlobalFeedback(state) {
  const feedback = state.session?.feedback;
  const pendingLabel = state.session?.pendingLabel;
  const cloudSync = state.session?.cloudSync || {};
  const cloudSyncVisible = state.auth?.status === "authenticated"
    && cloudSync.userId
    && cloudSync.userId === state.currentUser?.id
    && ["syncing", "failed"].includes(cloudSync.status);

  if (!feedback && !pendingLabel && !cloudSyncVisible) {
    return "";
  }

  return `
    <section class="global-feedback-stack" aria-live="polite">
      ${pendingLabel ? `
        <article class="global-feedback is-loading">
          <div>
            <strong>${escapeHtml(getCloudSyncStatusTitle(cloudSync))}</strong>
            <p>${escapeHtml(pendingLabel)}</p>
          </div>
        </article>
      ` : ""}
      ${cloudSyncVisible && cloudSync.status === "failed" ? `
        <article class="global-feedback is-warning">
          <div>
            <strong>Saved locally / retry needed</strong>
            <p>${escapeHtml(cloudSync.errorMessage || "Your latest round changes are still safe on this device, but the cloud copy has not completed yet.")}</p>
          </div>
          <button class="button subtle compact-feedback-button" type="button" data-action="retry-cloud-save">Retry save</button>
        </article>
      ` : ""}
      ${feedback ? `
        <article class="global-feedback is-${feedback.tone || "info"}">
          <div>
            <strong>${escapeHtml(feedback.title || "Update")}</strong>
            <p>${escapeHtml(feedback.message || "")}</p>
          </div>
          <button class="button subtle compact-feedback-button" type="button" data-action="dismiss-feedback">Dismiss</button>
        </article>
      ` : ""}
    </section>
  `;
}

function getLastUsedAccount(state) {
  const lastUserId = state.auth?.lastUserId;
  if (!lastUserId) {
    return null;
  }

  return (state.accounts || []).find((account) => account.id === lastUserId) || null;
}

function getAppearanceSettings(state) {
  return {
    colorMode: state.currentUser?.appearance?.colorMode || "system",
    themeId: state.currentUser?.appearance?.themeId || "forest",
    textScale: state.currentUser?.appearance?.textScale || "standard",
    compactMode: state.currentUser?.appearance?.compactMode === true,
    contrastMode: state.currentUser?.appearance?.contrastMode === "high" ? "high" : "standard",
  };
}

function getSocialSettings(state) {
  return {
    handles: {
      instagram: state.currentUser?.social?.handles?.instagram || "",
      x: state.currentUser?.social?.handles?.x || "",
      ghin: state.currentUser?.social?.handles?.ghin || "",
    },
    allowFriendConnections: state.currentUser?.social?.allowFriendConnections !== false,
    allowProfileSharing: state.currentUser?.social?.allowProfileSharing !== false,
    allowRoundSharing: state.currentUser?.social?.allowRoundSharing !== false,
  };
}

function getRoundSetup(state) {
  return {
    courseQuery: state.session?.roundSetup?.courseQuery || "",
    selectedCourseId: state.session?.roundSetup?.selectedCourseId || "",
    selectedTeeBoxId: state.session?.roundSetup?.selectedTeeBoxId || "",
  };
}

function getOrderedSettingsSections(selectedId) {
  if (!selectedId || !SETTINGS_SECTIONS.some((section) => section.id === selectedId)) {
    return SETTINGS_SECTIONS;
  }

  const selected = SETTINGS_SECTIONS.find((section) => section.id === selectedId);
  return [selected, ...SETTINGS_SECTIONS.filter((section) => section.id !== selectedId)];
}

function renderAuthScreen(state) {
  const auth = state.auth || {};
  const loginMode = auth.mode !== "signup";
  const reviewAccounts = getReviewAccounts(state);
  const lastUsedAccount = getLastUsedAccount(state);

  return `
    <section class="auth-shell">
      <article class="card auth-hero-card">
        <p class="eyebrow">Golfers Nation</p>
        <h2>Enter the app quickly and understand what happens next.</h2>
        <p class="hero-copy">Create a golfer account, restore a saved session, or use the free and premium demo golfers below to review the product without setup friction.</p>
        <div class="auth-benefit-grid">
          <article>
            <span>Player accounts</span>
            <strong>Persistent profile and history</strong>
          </article>
          <article>
            <span>Rounds and stats</span>
            <strong>Saved to the signed-in golfer</strong>
          </article>
          <article>
            <span>PWA ready</span>
            <strong>Installable on your phone</strong>
          </article>
        </div>
        <div class="auth-helper-note">
          <strong>Fastest review path</strong>
          <p>Use the free demo golfer first to see locked states, then switch to the premium demo golfer to review the unlocked version.</p>
          <div class="row-actions help-row">
            ${renderHelpLink("Need help signing in?", "accounts-profiles", true)}
          </div>
        </div>
      </article>
      <article class="card auth-panel-card">
        <div class="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
          <button class="button ${loginMode ? "primary" : "subtle"}" type="button" data-action="set-auth-mode" data-mode="login">Log in</button>
          <button class="button ${loginMode ? "subtle" : "primary"}" type="button" data-action="set-auth-mode" data-mode="signup">Sign up</button>
        </div>
        ${renderGlobalFeedback(state)}
        ${auth.error ? `<div class="auth-message is-error">${escapeHtml(auth.error)}</div>` : ""}
        ${auth.notice ? `<div class="auth-message">${escapeHtml(auth.notice)}</div>` : ""}
        ${lastUsedAccount ? `
          <div class="auth-helper-note auth-helper-note--compact">
            <strong>Last golfer on this device</strong>
            <p>${escapeHtml(lastUsedAccount.displayName)} / ${escapeHtml(lastUsedAccount.email)} / ${escapeHtml(lastUsedAccount.subscription?.tier === "premium" ? "Premium" : "Free")}</p>
          </div>
        ` : ""}
        <div class="auth-helper-note auth-helper-note--compact">
          <strong>${loginMode ? "Returning golfer" : "New golfer"}</strong>
          <p>${loginMode ? "Log in with your own email to restore your rounds, stats, and plan." : "Create your golfer account with your own email. New tester accounts get full access right away, then the app guides you straight into your first round."}</p>
        </div>
        ${!loginMode ? `
          <div class="summary-grid onboarding-list auth-onboarding-list">
            <article>
              <strong>1</strong>
              <p>Create your golfer account.</p>
            </article>
            <article>
              <strong>2</strong>
              <p>Home will highlight <strong>Start round</strong> next.</p>
            </article>
            <article>
              <strong>3</strong>
              <p>Golden Nugget Lake Charles will be ready as your first course.</p>
            </article>
          </div>
        ` : ""}
        ${loginMode
          ? `
            <form class="stack-form" data-form="auth-login">
              <label>
                Email
                <input name="email" type="email" placeholder="you@example.com" required autofocus />
              </label>
              <label>
                Password
                <input name="password" type="password" placeholder="Password" required />
              </label>
              <button class="button primary" type="submit">Log in</button>
            </form>
            <form class="stack-form auth-reset-form" data-form="auth-password-reset">
              <label>
                Need a reset link?
                <input name="email" type="email" placeholder="your account email" />
              </label>
              <button class="button subtle" type="submit">Send password reset email</button>
            </form>
          `
          : `
            <form class="stack-form" data-form="auth-signup">
              <label>
                Display name
                <input name="displayName" type="text" placeholder="Your name" required />
              </label>
              <label>
                Email
                <input name="email" type="email" placeholder="you@example.com" required />
              </label>
              <label>
                Password
                <input name="password" type="password" placeholder="Create a password" required />
              </label>
              <button class="button primary" type="submit">Create account</button>
            </form>
          `}
        <div class="section-divider"></div>
        <div class="auth-provider-stack">
          <button class="auth-provider-button" type="button" disabled>
            <strong>Google sign-in</strong>
            <span>Coming soon. Email is the fastest way to start right now.</span>
          </button>
          <button class="auth-provider-button" type="button" disabled>
            <strong>Apple sign-in</strong>
            <span>Coming soon. Email keeps the first-round flow simple today.</span>
          </button>
        </div>
      </article>
      <article class="card auth-review-card">
        <details class="auth-example-details">
          <summary>
            <span class="eyebrow">Quick preview</span>
            <strong>Use an example golfer instead</strong>
          </summary>
          <p class="body-copy compact-copy">If you only want a fast walkthrough, these built-in golfers already have saved rounds and stats.</p>
          <div class="stack-list">
            ${reviewAccounts.map((account) => `
              <article class="list-row large review-account-row">
                <div>
                  <strong>${escapeHtml(account.displayName)}</strong>
                  <p>${escapeHtml(account.email)} / ${escapeHtml(account.tier === "premium" ? "Premium" : "Free")}</p>
                </div>
                <div class="list-metrics">
                  <span>${account.tier === "premium" ? "Premium unlocked" : "Shows the free experience"}</span>
                  <span>Password: fairway123</span>
                  <button class="button subtle" type="button" data-action="use-review-account" data-user-id="${account.id}">Open account</button>
                </div>
              </article>
            `).join("")}
          </div>
        </details>
      </article>
    </section>
  `;
}

function renderSettingsSectionNav(state) {
  const selected = state.session.settingsSection || "account";
  return `
    <div class="settings-section-nav" role="tablist" aria-label="Settings sections">
      ${SETTINGS_SECTIONS.map((section) => `
        <button
          class="settings-section-pill ${selected === section.id ? "is-active" : ""}"
          type="button"
          data-action="set-settings-section"
          data-section="${section.id}"
          role="tab"
          aria-selected="${selected === section.id ? "true" : "false"}"
        >
          ${escapeHtml(section.label)}
        </button>
      `).join("")}
    </div>
  `;
}

function renderSettingsTopCard(state) {
  const subscription = getSubscription(state);
  const provider = state.currentUser.providerType || state.currentUser.provider || "email";
  const returnView = state.session.settingsReturnView || "stats";
  const returnLabel = VIEW_ORDER.find((view) => view.id === returnView)?.label || "Stats";
  const shortSummary = state.currentUser.bio
    ? state.currentUser.bio
    : `${state.currentUser.homeCourse ? `${state.currentUser.homeCourse} home course` : "Golf identity ready"} / ${subscription.tier === "premium" ? "Premium access active" : "Free plan active"} / ${provider} sign-in`;

  return `
    <article class="card settings-top-card card-span-3">
      <div class="profile-identity-row">
        ${renderAvatarChip(state.currentUser.avatarLabel || state.currentUser.avatar, "is-large")}
        <div>
          <p class="eyebrow">Profile and settings</p>
          <h3>${escapeHtml(state.currentUser.displayName || state.currentUser.name)}</h3>
          <p>${escapeHtml(state.currentUser.username || "@golfer")} / ${escapeHtml(state.currentUser.email || "Email ready")} / ${escapeHtml(subscription.tier === "premium" ? "Premium access" : "Free plan")}</p>
        </div>
      </div>
      <div class="summary-grid compact">
        <article>
          <span>Provider</span>
          <strong>${escapeHtml(provider)}</strong>
        </article>
        <article>
          <span>Member since</span>
          <strong>${formatDate(state.currentUser.createdAt)}</strong>
        </article>
        <article>
          <span>Rounds played</span>
          <strong>${state.currentUser.roundsPlayed || 0}</strong>
        </article>
        <article>
          <span>Best round</span>
          <strong>${state.currentUser.bestRound || "--"}</strong>
        </article>
      </div>
      <p class="body-copy compact-copy">This settings area keeps account details, golf identity, theme preferences, social scaffolding, and support access together in one clean place.</p>
      <p class="body-copy compact-copy">${escapeHtml(shortSummary)}</p>
      <div class="row-actions">
        <button class="button secondary" type="button" data-action="close-settings">Back to ${escapeHtml(returnLabel)}</button>
        <button class="button primary" type="button" data-action="sign-out">Log out account</button>
        ${renderHelpLink("Settings help", "accounts-profiles", true)}
      </div>
    </article>
  `;
}

function renderAccountSettingsCard(state) {
  const provider = state.currentUser.providerType || state.currentUser.provider || "email";
  const subscription = getSubscription(state);
  const passwordScaffold = provider === "email"
    ? `
      <form class="stack-form compact-form" data-form="change-password-settings">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Password</p>
            <h4>Change password</h4>
          </div>
        </div>
        <div class="split-inputs">
          <label>
            Current password
            <input name="currentPassword" type="password" placeholder="Current password" />
          </label>
          <label>
            New password
            <input name="newPassword" type="password" placeholder="New password" />
          </label>
        </div>
        <label>
          Confirm new password
          <input name="confirmPassword" type="password" placeholder="Confirm new password" />
        </label>
        <button class="button secondary" type="submit">Update password</button>
      </form>
    `
    : `
      <article class="settings-support-panel">
        <span class="mini-label">Password</span>
        <strong>Password is managed by ${escapeHtml(provider)}</strong>
        <p class="body-copy compact-copy">This account uses ${escapeHtml(provider)} sign-in, so password changes will live in the real provider flow when backend auth is connected.</p>
      </article>
    `;

  return `
    <article class="card settings-card" data-settings-card="account">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Account</p>
          <h3>Identity and access</h3>
        </div>
        <span class="status-pill">${escapeHtml(subscription.tier === "premium" ? "Premium" : "Free")}</span>
      </div>
      <form class="stack-form" data-form="save-account-settings">
        <div class="split-inputs">
          <label>
            Display Name
            <input name="displayName" type="text" value="${escapeHtml(state.currentUser.displayName || state.currentUser.name)}" />
          </label>
          <label>
            Username
            <input name="username" type="text" value="${escapeHtml(state.currentUser.username || "")}" />
          </label>
        </div>
        <div class="split-inputs">
          <label>
            Email
            <input name="email" type="email" value="${escapeHtml(state.currentUser.email || "")}" />
          </label>
          <label>
            Avatar
            <input name="avatarLabel" type="text" maxlength="2" value="${escapeHtml(state.currentUser.avatarLabel || "GN")}" />
          </label>
        </div>
        <div class="summary-grid compact">
          <article>
            <span>Provider</span>
            <strong>${escapeHtml(provider)}</strong>
          </article>
          <article>
            <span>Member since</span>
            <strong>${formatDate(state.currentUser.createdAt)}</strong>
          </article>
          <article>
            <span>Premium status</span>
            <strong>${escapeHtml(subscription.tier === "premium" ? "Premium access active" : "Free plan active")}</strong>
          </article>
        </div>
        <div class="row-actions">
          <button class="button primary" type="submit">Save account</button>
        </div>
      </form>
      ${renderSpotifySettingsPanel(state)}
      ${passwordScaffold}
    </article>
  `;
}

function renderGolfProfileSettingsCard(state) {
  return `
    <article class="card settings-card" data-settings-card="golf-profile">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Golf Profile</p>
          <h3>Golf identity and privacy</h3>
        </div>
      </div>
      <form class="stack-form" data-form="save-golf-profile">
        <label>
          Home Course
          <input name="homeCourse" type="text" value="${escapeHtml(state.currentUser.homeCourse || "")}" />
        </label>
        <div class="split-inputs">
          <label>
            Handicap / Skill Level
            <input name="handicap" type="number" step="0.1" value="${state.currentUser.handicap ?? ""}" />
          </label>
          <label>
            Handedness
            <select name="handedness">
              ${["", "Right-handed", "Left-handed", "Switch"].map((option) => `
                <option value="${option}" ${state.currentUser.handedness === option ? "selected" : ""}>${option || "Prefer not to say"}</option>
              `).join("")}
            </select>
          </label>
        </div>
        <label>
          Bio
          <textarea name="bio" rows="3">${escapeHtml(state.currentUser.bio || "")}</textarea>
        </label>
        <label>
          Profile Visibility
          <select name="profileVisibility">
            ${PROFILE_VISIBILITY_OPTIONS.map((option) => `
              <option value="${option.id}" ${state.currentUser.privacy?.profileVisibility === option.id ? "selected" : ""}>${escapeHtml(option.label)}</option>
            `).join("")}
          </select>
        </label>
        <div class="privacy-grid">
          ${PRIVACY_CONTROL_OPTIONS.map((option) => `
            <label class="privacy-option">
              <input type="checkbox" name="${option.id}" ${state.currentUser.privacy?.[option.id] ? "checked" : ""} />
              <span>${escapeHtml(option.label)}</span>
            </label>
          `).join("")}
        </div>
        <button class="button primary" type="submit">Save golf profile</button>
      </form>
    </article>
  `;
}

function renderAppearanceSettingsCard(state) {
  const appearance = getAppearanceSettings(state);
  const activeTheme = THEME_PRESET_OPTIONS.find((theme) => theme.id === appearance.themeId) || THEME_PRESET_OPTIONS[0];
  const activeMode = APPEARANCE_MODE_OPTIONS.find((mode) => mode.id === appearance.colorMode) || APPEARANCE_MODE_OPTIONS[0];
  const textScale = TEXT_SCALE_OPTIONS.find((option) => option.id === appearance.textScale) || TEXT_SCALE_OPTIONS[0];

  return `
    <article class="card settings-card" data-settings-card="appearance">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Appearance</p>
          <h3>App look and feel</h3>
        </div>
      </div>
      <form class="stack-form" data-form="save-appearance-settings">
        <div class="settings-option-group">
          <span class="mini-label">Appearance Mode</span>
          <div class="settings-choice-grid">
            ${APPEARANCE_MODE_OPTIONS.map((option) => `
              <label class="settings-choice-card ${appearance.colorMode === option.id ? "is-selected" : ""}">
                <input type="radio" name="colorMode" value="${option.id}" data-appearance-input="true" ${appearance.colorMode === option.id ? "checked" : ""} />
                <strong>${escapeHtml(option.label)}</strong>
                <p>${escapeHtml(option.description)}</p>
              </label>
            `).join("")}
          </div>
        </div>
        <div class="settings-option-group">
          <span class="mini-label">Theme Style</span>
          <div class="theme-current-card" data-active-theme-card="true" data-theme-preview="${escapeHtml(activeTheme.id)}">
            <div class="theme-current-copy" aria-live="polite">
              <span class="theme-current-eyebrow">Live preview</span>
              <strong data-active-theme-name="true">${escapeHtml(activeTheme.label)}</strong>
              <p data-active-theme-description="true">${escapeHtml(activeTheme.description)}</p>
            </div>
            <div class="theme-preview-swatches theme-preview-swatches--hero" aria-hidden="true">
              <span class="theme-preview-swatch theme-preview-swatch--bg"></span>
              <span class="theme-preview-swatch theme-preview-swatch--surface"></span>
              <span class="theme-preview-swatch theme-preview-swatch--accent"></span>
            </div>
          </div>
          <div class="appearance-active-strip">
            <strong>Saved to this golfer</strong>
            <p>${escapeHtml(activeMode.label)} / ${escapeHtml(textScale.label)} / ${appearance.compactMode ? "Compact layout" : "Comfortable layout"} / ${appearance.contrastMode === "high" ? "Higher contrast" : "Standard contrast"}</p>
          </div>
          <p class="body-copy compact-copy">Themes update the background, cards, buttons, header glow, and nav highlight right away. Tap a card to preview it live.</p>
          <div class="theme-choice-grid">
            ${THEME_PRESET_OPTIONS.map((theme) => `
              <label class="theme-choice-card ${appearance.themeId === theme.id ? "is-selected" : ""}" data-theme-preview="${theme.id}">
                <input type="radio" name="themeId" value="${theme.id}" data-theme-label="${escapeHtml(theme.label)}" data-theme-description="${escapeHtml(theme.description)}" data-appearance-input="true" ${appearance.themeId === theme.id ? "checked" : ""} />
                <div class="theme-preview-swatches" aria-hidden="true">
                  <span class="theme-preview-swatch theme-preview-swatch--bg"></span>
                  <span class="theme-preview-swatch theme-preview-swatch--surface"></span>
                  <span class="theme-preview-swatch theme-preview-swatch--accent"></span>
                </div>
                <div class="theme-choice-meta">
                  <strong>${escapeHtml(theme.label)}</strong>
                  <span class="theme-choice-badge">Previewing</span>
                </div>
                <p>${escapeHtml(theme.description)}</p>
              </label>
            `).join("")}
          </div>
        </div>
        <div class="settings-option-group">
          <span class="mini-label">Display Comfort</span>
          <div class="settings-choice-grid settings-choice-grid--dual">
            ${TEXT_SCALE_OPTIONS.map((option) => `
              <label class="settings-choice-card ${appearance.textScale === option.id ? "is-selected" : ""}">
                <input type="radio" name="textScale" value="${option.id}" data-appearance-input="true" ${appearance.textScale === option.id ? "checked" : ""} />
                <strong>${escapeHtml(option.label)}</strong>
                <p>${escapeHtml(option.description)}</p>
              </label>
            `).join("")}
          </div>
          <div class="settings-toggle-grid">
            <label class="settings-toggle-card ${appearance.compactMode ? "is-selected" : ""}">
              <input type="checkbox" name="compactMode" data-appearance-input="true" ${appearance.compactMode ? "checked" : ""} />
              <strong>Compact layout</strong>
              <p>Tightens vertical spacing for quicker one-handed use.</p>
            </label>
            <label class="settings-toggle-card ${appearance.contrastMode === "high" ? "is-selected" : ""}">
              <input type="checkbox" name="contrastMode" value="high" data-appearance-input="true" ${appearance.contrastMode === "high" ? "checked" : ""} />
              <strong>Higher contrast</strong>
              <p>Strengthens text and surface separation without changing the theme.</p>
            </label>
          </div>
        </div>
        <p class="body-copy compact-copy">Theme selections preview right away. Save appearance to keep them on this golfer account.</p>
        <button class="button primary" type="submit">Save appearance</button>
      </form>
    </article>
  `;
}

function renderSocialSettingsCard(state) {
  const social = getSocialSettings(state);

  return `
    <article class="card settings-card" data-settings-card="social">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Social</p>
          <h3>Light community settings</h3>
        </div>
      </div>
      <p class="body-copy compact-copy">These tools are intentionally lightweight for this stage: invite friends, share your profile or latest round, and keep a few golf-related handles connected.</p>
      <div class="row-actions settings-social-actions">
        <button class="button primary" type="button" data-action="invite-friends">Invite Friends</button>
        <button class="button secondary" type="button" data-action="share-profile-placeholder">Share Profile</button>
        <button class="button subtle" type="button" data-action="share-round-summary-placeholder">Share Round Summary</button>
      </div>
      <form class="stack-form" data-form="save-social-settings">
        <div class="split-inputs">
          <label>
            Instagram
            <input name="instagram" type="text" value="${escapeHtml(social.handles.instagram)}" placeholder="@yourhandle" />
          </label>
          <label>
            X / Twitter
            <input name="x" type="text" value="${escapeHtml(social.handles.x)}" placeholder="@yourhandle" />
          </label>
        </div>
        <label>
          GHIN / golf profile handle
          <input name="ghin" type="text" value="${escapeHtml(social.handles.ghin)}" placeholder="Optional player handle" />
        </label>
        <div class="privacy-grid">
          <label class="privacy-option">
            <input type="checkbox" name="allowFriendConnections" ${social.allowFriendConnections ? "checked" : ""} />
            <span>Allow follow / friend connection placeholders</span>
          </label>
          <label class="privacy-option">
            <input type="checkbox" name="allowProfileSharing" ${social.allowProfileSharing ? "checked" : ""} />
            <span>Allow profile sharing</span>
          </label>
          <label class="privacy-option">
            <input type="checkbox" name="allowRoundSharing" ${social.allowRoundSharing ? "checked" : ""} />
            <span>Allow round summary sharing</span>
          </label>
        </div>
        <button class="button primary" type="submit">Save social settings</button>
      </form>
    </article>
  `;
}

function renderAppSupportSettingsCard(state) {
  const recentActivity = (state.social?.activity || [])
    .slice(0, 3)
    .map((entry) => entry.message)
    .join(" | ");
  const contextView = state.session.settingsReturnView || state.session.previousView || "stats";

  return `
    <article class="card settings-card" data-settings-card="app-support">
      <div class="section-heading">
        <div>
          <p class="eyebrow">App & Support</p>
          <h3>Help, policy, and device support</h3>
        </div>
      </div>
      <div class="stack-list settings-support-list">
        <button class="list-row large settings-link-row" type="button" data-action="refresh-app">
          <div>
            <strong>Refresh App</strong>
            <p>Pull the latest deployed build on this phone after a new tester update goes live.</p>
          </div>
          <span>Reload</span>
        </button>
        <button class="list-row large settings-link-row" type="button" data-action="open-help-section" data-section="getting-started">
          <div>
            <strong>Help Center</strong>
            <p>Short guides for sign-in, rounds, stats, and premium features.</p>
          </div>
          <span>Open</span>
        </button>
        <button class="list-row large settings-link-row" type="button" data-action="show-policy-placeholder" data-doc="privacy">
          <div>
            <strong>Privacy Policy</strong>
            <p>Placeholder entry for the production legal flow.</p>
          </div>
          <span>View</span>
        </button>
        <button class="list-row large settings-link-row" type="button" data-action="show-policy-placeholder" data-doc="terms">
          <div>
            <strong>Terms of Service</strong>
            <p>Placeholder entry for subscription and account terms.</p>
          </div>
          <span>View</span>
        </button>
        <button class="list-row large settings-link-row" type="button" data-action="contact-support-placeholder">
          <div>
            <strong>Contact Support</strong>
            <p>Placeholder support flow for real device testing and account help.</p>
          </div>
          <span>Email</span>
        </button>
      </div>
      <article class="settings-support-panel">
        <span class="mini-label">Tester feedback</span>
        <strong>Send field-test notes without leaving the app</strong>
        <p class="body-copy compact-copy">Feedback sends with device, plan, and screen context attached so the Golfers Nation team can review real field notes.</p>
        <form
          class="stack-form compact-form"
          data-form="submit-tester-feedback"
        >
          <input type="hidden" name="appVersion" value="${escapeHtml(APP_VERSION)}" />
          <input type="hidden" name="planTier" value="${escapeHtml(state.currentUser.subscription?.tier || "free")}" />
          <input type="hidden" name="installState" value="${escapeHtml(state.session.installState || "browser")}" />
          <input type="hidden" name="appearanceMode" value="${escapeHtml(state.currentUser.appearance?.colorMode || "system")}" />
          <input type="hidden" name="themeId" value="${escapeHtml(state.currentUser.appearance?.themeId || "forest")}" />
          <input type="hidden" name="contextView" value="${escapeHtml(contextView)}" />
          <input type="hidden" name="recentActivity" value="${escapeHtml(recentActivity)}" />
          <input type="hidden" name="userAgent" value="${escapeHtml(typeof navigator === "undefined" ? "" : navigator.userAgent || "")}" />
          <div class="split-inputs">
            <label>
              Tester name
              <input name="testerName" type="text" value="${escapeHtml(state.currentUser.displayName || state.currentUser.name)}" />
            </label>
            <label>
              Contact email
              <input name="email" type="email" value="${escapeHtml(state.currentUser.email || "")}" />
            </label>
          </div>
          <div class="split-inputs">
            <label>
              Feedback area
              <select name="feedbackArea">
                ${TESTER_FEEDBACK_AREAS.map((option) => `
                  <option value="${option.id}" ${option.id === "other" ? "selected" : ""}>${escapeHtml(option.label)}</option>
                `).join("")}
              </select>
            </label>
            <label>
              Overall feel
              <select name="rating">
                <option value="5">5 / Great</option>
                <option value="4">4 / Good</option>
                <option value="3" selected>3 / Okay</option>
                <option value="2">2 / Rough</option>
                <option value="1">1 / Broken</option>
              </select>
            </label>
          </div>
          <label>
            What happened, or what would improve it?
            <textarea name="feedbackMessage" rows="4" placeholder="Short note about what worked, what felt confusing, or what should change next."></textarea>
          </label>
          <button class="button primary" type="submit">Send tester feedback</button>
        </form>
      </article>
      <div class="summary-grid compact">
        <article>
          <span>App version</span>
          <strong>${escapeHtml(APP_VERSION)}</strong>
        </article>
        <article>
          <span>Install state</span>
          <strong>${escapeHtml(state.session.standaloneMode ? "Installed" : "Browser / web link")}</strong>
        </article>
      </div>
      <div class="row-actions">
        <button class="button subtle" type="button" data-action="reset-local-data">Reset local app data</button>
      </div>
    </article>
  `;
}

function renderSettingsView(state) {
  const orderedSections = getOrderedSettingsSections(state.session.settingsSection || "account");
  const cards = {
    account: renderAccountSettingsCard(state),
    "golf-profile": renderGolfProfileSettingsCard(state),
    appearance: renderAppearanceSettingsCard(state),
    social: renderSocialSettingsCard(state),
    "app-support": renderAppSupportSettingsCard(state),
  };

  return `
    <section class="view-grid settings-grid">
      ${renderSettingsTopCard(state)}
      <article class="card settings-nav-card card-span-3">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Settings sections</p>
            <h3>Everything important, grouped simply</h3>
          </div>
        </div>
        ${renderSettingsSectionNav(state)}
      </article>
      ${orderedSections.map((section) => cards[section.id]).join("")}
    </section>
  `;
}

function renderHelpView(state, { standalone = false } = {}) {
  const selectedSection = state.session.helpSection || "getting-started";
  const sections = getOrderedHelpSections(selectedSection);
  const returnView = state.session.helpReturnView || "home";
  const returnLabel = returnView === "auth"
    ? "Sign in"
    : VIEW_ORDER.find((view) => view.id === returnView)?.label || "Home";
  const helpContent = `
    <section class="view-grid help-grid">
      <article class="card help-overview-card card-span-2">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Help</p>
            <h3>Help Center for quick answers</h3>
          </div>
          <button class="button subtle" type="button" data-action="close-help">Back to ${escapeHtml(returnLabel)}</button>
        </div>
        <p class="body-copy">Use the quick links below, or scan the first section. When help opens from another screen, the most relevant section moves to the top.</p>
        <div class="help-jump-grid">
          ${HELP_SECTIONS.map((section) => `
            <button
              class="help-jump-pill ${selectedSection === section.id ? "is-active" : ""}"
              type="button"
              data-action="open-help-section"
              data-section="${section.id}"
            >
              ${escapeHtml(section.title)}
            </button>
          `).join("")}
        </div>
      </article>
      ${sections.map((section) => `
        <article class="card help-section-card ${section.id === selectedSection ? "is-selected" : ""}">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Guide</p>
              <h3>${escapeHtml(section.title)}</h3>
            </div>
          </div>
          <p class="body-copy compact-copy">${escapeHtml(section.description)}</p>
          <div class="help-item-list">
            ${section.items.map((item) => `
              <article class="help-item">
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.body)}</p>
              </article>
            `).join("")}
          </div>
        </article>
      `).join("")}
    </section>
  `;

  if (!standalone) {
    return helpContent;
  }

  return `
    <section class="auth-shell">
      <article class="card auth-hero-card">
        <p class="eyebrow">Golfers Nation help</p>
        <h2>Answers that keep the app easy to understand.</h2>
        <p class="hero-copy">Open a section, read a short answer, then go right back to signing in or reviewing the app.</p>
        <div class="row-actions help-row">
          <button class="button primary" type="button" data-action="close-help">Back to sign in</button>
        </div>
      </article>
      ${helpContent}
    </section>
  `;
}

function renderHomeView(state) {
  const activeRound = getActiveRound(state);
  const summaryRound = getSummaryRound(state);
  const metrics = getHistoryMetrics(state.rounds, state.currentUser.id);
  const completedRounds = getCompletedRounds(state);
  const recentActivity = state.social.activity.slice(0, 4);
  const subscription = getSubscription(state);
  const premium = isPremiumSubscription(subscription);
  const firstName = state.currentUser.name.split(" ")[0];

  return `
    <section class="view-grid home-grid">
      <article class="card hero-home-card card-span-2">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Home</p>
            <h3>${escapeHtml(`Welcome, ${firstName}`)}</h3>
          </div>
          <span class="status-pill">${premium ? "Premium access" : "Free membership"}</span>
        </div>
        <p class="body-copy">Open the app, start a round or join by code, and get into scoring without digging through extra screens.</p>
        ${renderPrimaryActions(state, activeRound)}
        <div class="hero-status-grid home-core-strip">
          <article>
            <span>Live round</span>
            <strong>${escapeHtml(activeRound ? activeRound.courseName : "No round in progress")}</strong>
            <p>${activeRound ? `Hole ${activeRound.currentHole} / ${escapeHtml(GAME_MODES[activeRound.mode].label)}` : "Golden Nugget is already loaded as the easiest first test course."}</p>
          </article>
          <article>
            <span>Quick join</span>
            <strong>${escapeHtml(activeRound?.inviteCode || "Use Join by code")}</strong>
            <p>${activeRound?.inviteCode ? "Share this code if your group wants to join the live round." : "Enter a host code when another golfer already started the round."}</p>
          </article>
          <article>
            <span>Recent finish</span>
            <strong>${escapeHtml(summaryRound ? summaryRound.courseName : "No recent finish")}</strong>
            <p>${summaryRound ? `${formatDate(summaryRound.completedAt)} / Summary saved` : "Finish one round and your history shows up here automatically."}</p>
          </article>
        </div>
        <div class="row-actions help-row">
          ${renderHelpLink("Need help getting started?", "getting-started", true)}
        </div>
      </article>
      ${renderFirstRoundGuide(state, "home")}
      <article class="card home-snapshot-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Your golfer</p>
            <h3>Small profile summary</h3>
          </div>
          <button class="button subtle" type="button" data-action="open-current-profile">Open profile</button>
        </div>
        <div class="profile-identity-row compact-profile-row">
          ${renderAvatarChip(state.currentUser.avatarLabel || state.currentUser.avatar, "is-large")}
          <div>
            <strong>${escapeHtml(state.currentUser.displayName || state.currentUser.name)}</strong>
            <p>${escapeHtml(state.currentUser.username || "")} / ${escapeHtml(state.currentUser.email || "Email ready for auth")}</p>
          </div>
        </div>
        <div class="summary-grid">
          <article>
            <span>Rounds</span>
            <strong>${metrics.roundsPlayed}</strong>
          </article>
          <article>
            <span>Average</span>
            <strong>${metrics.scoringAverage ? metrics.scoringAverage.toFixed(1) : "--"}</strong>
          </article>
          <article>
            <span>Fairways</span>
            <strong>${metrics.fairways}%</strong>
          </article>
          <article>
            <span>GIR</span>
            <strong>${metrics.gir}%</strong>
          </article>
        </div>
      </article>
      ${renderInstallCard(state)}
      <article class="card card-span-2">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Recent rounds</p>
            <h3>Simple history</h3>
          </div>
        </div>
        ${completedRounds.length
          ? `
            <div class="stack-list">
              ${completedRounds
                .slice(0, 2)
                .map((round) => {
                  const summary = getRoundSummary(round, state.currentUser.id);
                  return `
                    <article class="list-row large">
                      <div>
                        <strong>${escapeHtml(round.courseName)}</strong>
                        <p>${escapeHtml(summary.roundLabel)} / ${formatDate(round.completedAt)}</p>
                      </div>
                      <div class="list-metrics">
                        <span>${escapeHtml(summary.localParticipant?.displayStatus || "--")}</span>
                        <span>${summary.holesPlayed} holes</span>
                        <button class="button subtle" type="button" data-action="view-summary" data-round-id="${round.id}">View summary</button>
                      </div>
                    </article>
                  `;
                })
                .join("")}
            </div>
          `
          : `
            <div class="empty-state onboarding-state">
              <strong>New golfer? The home screen stays simple on purpose.</strong>
              <p>Start one local round, finish it, and this area will turn into your round archive and progress snapshot.</p>
              <div class="row-actions empty-state-actions">
                <button class="button primary" type="button" data-action="nav-view" data-view="round">Start your first round</button>
                <button class="button subtle" type="button" data-action="open-settings" data-section="app-support">Send feedback</button>
                ${renderHelpLink("What happens next?", "getting-started", true)}
              </div>
            </div>
          `}
      </article>
      ${recentActivity.length
        ? `
          <article class="card">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Recent activity</p>
                <h3>Last few updates</h3>
              </div>
            </div>
            <div class="stack-list">
              ${recentActivity
                .slice(0, 3)
                .map(
                  (entry) => `
                    <article class="feed-row">
                      <time>${formatDateTime(entry.createdAt)}</time>
                      <p>${escapeHtml(entry.message)}</p>
                    </article>
                  `
                )
                .join("")}
            </div>
          </article>
        `
        : renderJoinRoundQuickCard(state, { compact: true, showNearby: true, activeRound })}
    </section>
  `;
}

function renderModeNotes(state, mode) {
  const subscription = getSubscription(state);
  const premiumModes = PREMIUM_MODE_IDS.map((modeId) => GAME_MODES[modeId].label).join(" and ");

  return `
    <div class="mode-strip">
      <span class="status-pill">Mode in play: ${escapeHtml(GAME_MODES[mode].label)}</span>
      <span class="status-pill">${isPremiumSubscription(subscription) ? "Premium modes unlocked" : `${escapeHtml(premiumModes)} unlock with Premium`}</span>
    </div>
  `;
}

function renderCoursePicker(state) {
  const roundSetup = getRoundSetup(state);
  const matchingCourses = getRoundSetupCourses(roundSetup.courseQuery, roundSetup.courseQuery ? 10 : 8);
  const quickPicks = roundSetup.courseQuery ? [] : getCourseQuickPicks(4);
  const selectedCourse = roundSetup.selectedCourseId ? findCourseById(roundSetup.selectedCourseId) : null;
  const defaultTeeBox = selectedCourse ? getDefaultTeeBox(selectedCourse) : null;
  const selectedTeeBox = selectedCourse ? findTeeBox(selectedCourse, roundSetup.selectedTeeBoxId || defaultTeeBox?.id || "") : null;

  return `
    <div class="stack-list course-picker-block">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Course library</p>
          <h4>Use a real course</h4>
        </div>
      </div>
      <p class="body-copy compact-copy">Search by course name, city, state, or a well-known nickname. Golden Nugget stays first so the fastest local tester path is still one tap away.</p>
      ${quickPicks.length
        ? `
          <div class="course-quick-picks" aria-label="Quick course picks">
            ${quickPicks.map((course) => {
              const featuredTee = getDefaultTeeBox(course);
              const isSelected = course.id === selectedCourse?.id;
              return `
                <button class="button subtle course-quick-pick ${isSelected ? "is-selected" : ""}" type="button" data-action="select-course" data-course-id="${course.id}" data-tee-box-id="${featuredTee?.id || ""}">
                  <span>${escapeHtml(course.name)}</span>
                  <small>${escapeHtml(course.city)}, ${escapeHtml(course.state)}</small>
                </button>
              `;
            }).join("")}
          </div>
        `
        : ""}
      <div class="course-search-shell" data-course-search-shell="true">
        <label class="course-search-field">
          <span>Search courses</span>
          <input data-course-search-input="true" type="search" value="${escapeHtml(roundSetup.courseQuery)}" placeholder="Golden Nugget, Lake Charles, Boston, Pebble" />
        </label>
        <div class="row-actions course-search-actions">
          <button class="button secondary" type="button" data-action="apply-course-search">Search</button>
          <button class="button subtle" type="button" data-action="clear-course-search">Clear</button>
        </div>
      </div>
      <div class="course-results-list">
        ${matchingCourses.length
          ? matchingCourses.map((course) => {
              const featuredTee = getDefaultTeeBox(course);
              const isSelected = course.id === selectedCourse?.id;
              return `
                <button class="course-result-card ${isSelected ? "is-selected" : ""}" type="button" data-action="select-course" data-course-id="${course.id}" data-tee-box-id="${featuredTee?.id || ""}">
                  <div class="course-result-copy">
                    <strong>${escapeHtml(course.name)}</strong>
                    <p>${escapeHtml(course.city)}, ${escapeHtml(course.state)} / ${escapeHtml(course.region)}</p>
                  </div>
                  <div class="course-result-meta">
                    ${course.featured ? `<span class="status-pill">${escapeHtml(course.featuredNote || "Featured local course")}</span>` : ""}
                    <span>${escapeHtml(featuredTee?.name || "Primary tee")}</span>
                    <span>${featuredTee?.totalYardage || "--"} yds / Par ${featuredTee?.totalPar || "--"}</span>
                    <span>${course.teeBoxes.length} tee${course.teeBoxes.length === 1 ? "" : "s"}</span>
                    ${course.architect ? `<span>${escapeHtml(course.architect)}</span>` : ""}
                  </div>
                </button>
              `;
            }).join("")
          : `
            <div class="empty-state compact-empty-state">
              <strong>No seeded courses matched that search.</strong>
              <p>Try a city, state, or nickname instead, or leave course selection empty and use the quick custom template below.</p>
            </div>
          `}
      </div>
      ${selectedCourse && selectedTeeBox
        ? `
          <article class="course-selected-card" data-selected-course="true">
            <div class="course-selected-copy">
              <span class="mini-label">Selected course</span>
              <strong>${escapeHtml(selectedCourse.name)}</strong>
              <p>${escapeHtml(selectedCourse.city)}, ${escapeHtml(selectedCourse.state)} / ${escapeHtml(selectedCourse.region)}</p>
            </div>
            <div class="summary-grid compact">
              <article>
                <span>Tee</span>
                <strong>${escapeHtml(selectedTeeBox.name)}</strong>
              </article>
              <article>
                <span>Yardage</span>
                <strong>${selectedTeeBox.totalYardage}</strong>
              </article>
              <article>
                <span>Par</span>
                <strong>${selectedTeeBox.totalPar}</strong>
              </article>
              <article>
                <span>Rating / slope</span>
                <strong>${selectedTeeBox.rating ?? "--"} / ${selectedTeeBox.slope ?? "--"}</strong>
              </article>
              <article>
                <span>Course info</span>
                <strong>${escapeHtml(selectedCourse.courseType || "Course")} / ${selectedCourse.teeBoxes.length} tee${selectedCourse.teeBoxes.length === 1 ? "" : "s"}</strong>
              </article>
            </div>
            <div class="split-inputs course-selected-actions">
              <label>
                Tee box
                <select name="selectedTeeBoxId" form="create-round-form" data-course-tee-select="true">
                  ${selectedCourse.teeBoxes.map((teeBox) => `
                    <option value="${teeBox.id}" ${teeBox.id === selectedTeeBox.id ? "selected" : ""}>
                      ${escapeHtml(teeBox.name)} / ${teeBox.totalYardage} yds / Par ${teeBox.totalPar}
                    </option>
                  `).join("")}
                </select>
              </label>
              <div class="course-selected-actions-buttons">
                <button class="button subtle" type="button" data-action="clear-selected-course">Use quick custom course instead</button>
              </div>
            </div>
          </article>
        `
        : `
          <div class="empty-state compact-empty-state">
            <strong>No real course selected yet.</strong>
            <p>Select a seeded course above, or keep the quick custom course fields below for a fast local demo round.</p>
          </div>
        `}
    </div>
  `;
}

function renderCreateRoundCard(state, activeRound) {
  const subscription = getSubscription(state);
  const playerValue = activeRound ? activeRound.players.map((player) => player.name).join(", ") : state.currentUser.name;
  const guided = shouldShowFirstRoundGuide(state) && !activeRound;
  const roundSetup = getRoundSetup(state);
  const selectedCourse = roundSetup.selectedCourseId ? findCourseById(roundSetup.selectedCourseId) : null;
  const selectedTeeBox = selectedCourse ? findTeeBox(selectedCourse, roundSetup.selectedTeeBoxId || getDefaultTeeBox(selectedCourse)?.id || "") : null;
  const manualCourse = createManualCourseSelection(activeRound?.courseName || "National Pines", activeRound?.teeBox || "Blue");
  const premiumModesLabel = PREMIUM_MODE_IDS.map((modeId) => GAME_MODES[modeId].label).join(" and ");

  return `
    <article class="card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Round setup</p>
          <h3>Start a round quickly</h3>
        </div>
      </div>
      <p class="body-copy compact-copy">Keep Golden Nugget selected for the fastest test path. Search updates as you type, and quick picks keep the most useful real courses one tap away.</p>
      ${renderCoursePicker(state)}
      <form class="stack-form" data-form="create-round" id="create-round-form">
        <input type="hidden" name="selectedCourseId" value="${escapeHtml(selectedCourse?.id || "")}" />
        <input type="hidden" name="weather" value="${escapeHtml(activeRound?.weather || "Calm 72F")}" />
        ${selectedCourse && selectedTeeBox
          ? `
            <div class="selected-course-summary-strip">
              <span class="status-pill">Real course selected</span>
              <span class="status-pill">${escapeHtml(selectedCourse.name)} / ${escapeHtml(selectedTeeBox.name)} / ${selectedTeeBox.totalYardage} yds</span>
            </div>
          `
          : `
            <label>
              Course
              <input name="courseName" type="text" value="${escapeHtml(manualCourse.courseName)}" required />
            </label>
            <div class="split-inputs">
              <label>
                Tee
                <input name="teeBox" type="text" value="${escapeHtml(manualCourse.teeBoxName)}" required />
              </label>
              <label>
                Template
                <input value="18 holes / ${manualCourse.totalYardage} yds / Par ${manualCourse.totalPar}" readonly />
              </label>
            </div>
          `}
        <div class="split-inputs">
          <label>
            Scoring mode
            <select name="mode">
              ${Object.values(GAME_MODES)
                .filter((gameMode) => !isModeLocked(gameMode.id, subscription))
                .map(
                  (gameMode) => `
                    <option value="${gameMode.id}" ${activeRound?.mode === gameMode.id ? "selected" : ""}>
                      ${escapeHtml(gameMode.label)}
                    </option>
                  `
                )
                .join("")}
            </select>
          </label>
          <label>
            Group names
            <input name="players" type="text" value="${escapeHtml(playerValue)}" />
          </label>
        </div>
        <p class="body-copy compact-copy">Enter names separated by commas. Leave only your own name if everyone will join from their own phone. Add extra names only if this device will score for them too.</p>
        <div class="row-actions">
          <button class="button primary ${guided ? "guided-action" : ""}" type="submit" name="intent" value="local">Start round</button>
          <button class="button secondary" type="submit" name="intent" value="host">Host with code</button>
        </div>
        <div class="round-setup-note">
          <span class="status-pill">${isPremiumSubscription(subscription) ? "All modes unlocked" : `${escapeHtml(premiumModesLabel)} stay premium`}</span>
          <span class="status-pill">${selectedCourse?.featured ? "Golden Nugget loaded" : "Pick any seeded course"}</span>
        </div>
      </form>
    </article>
  `;
}

function renderHoleNavigator(round, selectedHole) {
  const progress = getRoundProgress(round);
  const nextOpenHole = getNextOpenHole(round, selectedHole);
  const completion = getHoleCompletionStats(round, selectedHole);
  const selected = round.holes.find((hole) => hole.number === selectedHole) || round.holes[0];
  return `
    <div class="hole-nav">
      <button class="button subtle hole-stepper" type="button" data-action="step-hole" data-direction="-1" aria-label="Previous hole">Prev</button>
      <div class="hole-pills">
        ${round.holes
          .map((hole) => {
            const activeClass = selectedHole === hole.number ? "is-active" : "";
            const completeClass = hole.entries.some((entry) => entry.strokes && entry.strokes > 0) ? "is-complete" : "";
            return `
              <button class="hole-pill ${activeClass} ${completeClass}" type="button" data-action="select-hole" data-hole="${hole.number}">
                <span>${hole.number}</span>
                <strong>Par ${hole.par}</strong>
              </button>
            `;
          })
          .join("")}
      </div>
      <button class="button subtle hole-stepper" type="button" data-action="step-hole" data-direction="1" aria-label="Next hole">Next</button>
    </div>
    <div class="hole-utility-row">
      <span class="hole-utility-chip hole-utility-chip--primary">Par ${selected.par} / ${selected.yards} yds</span>
      <span class="hole-utility-chip">${completion.scored}/${completion.total} scored</span>
      <span class="hole-utility-chip">${progress.completedHoles}/18 played</span>
      <button class="button primary hole-next-button" type="button" data-action="jump-next-open" data-hole="${nextOpenHole}">
        Next hole ${nextOpenHole}
      </button>
    </div>
  `;
}

function formatCompetitiveDelta(value) {
  const magnitude = Math.abs(value);
  return Number.isInteger(magnitude) ? String(magnitude) : magnitude.toFixed(1).replace(/\.0$/, "");
}

function renderCompetitiveSpotlights(summary) {
  const highlights = [
    summary?.holeWinner
      ? {
          label: "Hole winner",
          value: summary.holeWinner.label,
          tone: summary.holeWinner.tied ? "steady" : "up",
        }
      : null,
    summary?.momentum
      ? {
          label: "Momentum",
          value: summary.momentum.label,
          tone: summary.momentum.tone || "steady",
        }
      : null,
    summary?.headToHead
      ? {
          label: "Head to head",
          value: summary.headToHead.label,
          tone: summary?.localParticipant?.rank === 1 ? "up" : "steady",
        }
      : null,
  ].filter(Boolean);

  if (!highlights.length) {
    return "";
  }

  return `
    <div class="competitive-spotlight-strip">
      ${highlights.map((item) => `
        <article class="competitive-spotlight-pill is-${item.tone}">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </article>
      `).join("")}
    </div>
  `;
}

function getCompetitiveFeedback(round, summary, participantId) {
  const leaderboard = summary?.leaderboard || [];
  const entry = leaderboard.find((item) => item.id === participantId);
  const leader = leaderboard[0];

  if (!entry || entry.thru === 0) {
    return {
      headline: "Waiting to score",
      detail: "No strokes posted yet",
    };
  }

  if (round.mode === "match") {
    return {
      headline: entry.id === leader?.id ? "Leading match" : "Chasing match",
      detail: entry.displayStatus,
    };
  }

  const scoredEntries = leaderboard.filter((item) => item.thru > 0 && typeof item.toPar === "number");
  const groupAverage = scoredEntries.length
    ? scoredEntries.reduce((sum, item) => sum + item.toPar, 0) / scoredEntries.length
    : null;

  const headline = entry.id === leader?.id
    ? "Leading"
    : `${formatCompetitiveDelta((entry.total || 0) - (leader?.total || 0))} back`;

  if (groupAverage === null) {
    return {
      headline,
      detail: "Group average still building",
    };
  }

  const versusGroup = entry.toPar - groupAverage;
  const detail = Math.abs(versusGroup) < 0.15
    ? "Level with group"
    : `${formatCompetitiveDelta(versusGroup)} ${versusGroup < 0 ? "better than group" : "behind group"}`;

  return {
    headline,
    detail,
  };
}

function completionLabel(hole, participantCount) {
  const scoredEntries = hole.entries.filter((entry) => entry.strokes !== null && entry.strokes > 0).length;
  return `${scoredEntries}/${participantCount} scored`;
}

function renderHoleEditor(state, round) {
  const selectedHole = state.session.selectedHole;
  const hole = round.holes.find((item) => item.number === selectedHole) || round.holes[0];
  const participants = getScoringParticipants(round);
  const summary = getRoundSummary(round, state.currentUser.id);
  const progress = getRoundProgress(round);
  const roundSafety = getRoundSavePresentation(round);
  const localParticipantId = summary.localParticipant?.id;
  const leadParticipantId = summary.leaderboard[0]?.id;
  const nextOpenHole = getNextOpenHole(round, selectedHole);
  const showInlineHelp = shouldShowFirstRoundGuide(state) && progress.completedHoles === 0;
  const orderedParticipants = [...participants].sort((left, right) => {
    const leftScore = left.id === localParticipantId ? -2 : left.id === leadParticipantId ? -1 : 0;
    const rightScore = right.id === localParticipantId ? -2 : right.id === leadParticipantId ? -1 : 0;
    return leftScore - rightScore;
  });
  const primaryParticipant = orderedParticipants.find((participant) => participant.id === localParticipantId) || orderedParticipants[0];
  const secondaryParticipants = orderedParticipants.filter((participant) => participant.id !== primaryParticipant?.id);

  function buildParticipantContext(participant) {
    const entry = hole.entries.find((item) => item.participantId === participant.id);
    const participantTotals = getParticipantTotals(round, participant.id);
    const label = round.mode === "stroke" ? "Player" : "Side";
    const previewProfileId = findParticipantProfileId(round, participant.id);
    const previewProfile = previewProfileId ? getProfileById(state, previewProfileId) : null;
    const feedback = getCompetitiveFeedback(round, summary, participant.id);
    const leaderboardEntry = summary.leaderboard.find((item) => item.id === participant.id);
    const advancedSummary = [
      `Putts ${entry?.putts ?? "--"}`,
      `Pens ${entry?.penalties ?? 0}`,
      hole.par > 3 ? `Fairway ${entry?.fairwayHit ? "Yes" : "No"}` : null,
      `GIR ${entry?.gir ? "Yes" : "No"}`,
      `Up/down ${entry?.upAndDown ? "Yes" : "No"}`,
    ].filter(Boolean).join(" / ");

    return {
      entry,
      participantTotals,
      label,
      previewProfileId,
      previewProfile,
      feedback,
      leaderboardEntry,
      advancedSummary,
      isLocal: participant.id === localParticipantId,
      isLeader: participant.id === leadParticipantId,
      isRecent: participant.id === state.session.lastScoredParticipantId,
    };
  }

  function renderEditableParticipant(participant, options = {}) {
    const context = buildParticipantContext(participant);
    const { secondary = false } = options;
    const cardClasses = [
      "participant-card",
      secondary ? "participant-card--secondary-entry" : "",
      !secondary ? "participant-card--primary-entry" : "",
      context.isLocal ? "is-local" : "",
      context.isLeader ? "is-leader" : "",
      context.isRecent ? "is-recent-score" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return `
      <article class="${cardClasses}">
        <div class="participant-heading participant-heading--score">
          <div class="participant-heading-main">
            ${renderAvatarChip(context.previewProfile?.publicProfile.avatarLabel || participant.avatarLabel)}
            <div>
              <span>${secondary ? "Extra card entry" : context.isLocal ? "Your score entry" : context.label}</span>
              <strong>${escapeHtml(participant.name)}</strong>
              <p class="participant-subcopy">${escapeHtml(participant.playerNames ? participant.playerNames.join(", ") : "Individual scorecard")}</p>
            </div>
          </div>
          <div class="participant-heading-tools">
            ${context.isLocal ? `<span class="player-badge is-local">You</span>` : ""}
            ${context.isLeader ? `<span class="player-badge is-leader">Leader</span>` : ""}
            ${context.previewProfileId
              ? `<button class="button subtle profile-preview-button profile-preview-button--inline" type="button" data-action="select-profile-preview" data-profile-id="${context.previewProfileId}" data-preview-view="community">View card</button>`
              : ""}
          </div>
        </div>
        <div class="competitive-note competitive-note--tight">
          <span class="competitive-pill ${context.isLeader ? "is-leading" : ""}">${escapeHtml(context.feedback.headline)}</span>
          <span>${escapeHtml(context.feedback.detail)}</span>
        </div>
        ${secondary
          ? `
            <p class="body-copy compact-copy participant-helper-copy">Use this extra editor only if one phone really needs to score for another golfer too.</p>
            <div class="participant-compact-stats">
              <span>Status ${escapeHtml(context.leaderboardEntry?.displayStatus || "--")}</span>
              <span>${escapeHtml(context.leaderboardEntry?.rankTrendLabel || "Opening stretch")}</span>
              <span>FW ${context.participantTotals.fairwaysHit}/${context.participantTotals.fairwayOpportunities} / GIR ${context.participantTotals.greensHit}/${context.participantTotals.girOpportunities}</span>
              <span>Putts ${context.participantTotals.averagePutts ?? "--"}</span>
            </div>
          `
          : ""}
        <div class="score-primary-block">
          <div class="quick-score-row">
            <button
              class="score-chip"
              type="button"
              data-action="quick-score"
              data-hole="${hole.number}"
              data-participant-id="${participant.id}"
              data-strokes="${Math.max(1, hole.par - 2)}"
            >
              <span>Eagle</span>
              <strong>${Math.max(1, hole.par - 2)}</strong>
            </button>
            <button
              class="score-chip"
              type="button"
              data-action="quick-score"
              data-hole="${hole.number}"
              data-participant-id="${participant.id}"
              data-strokes="${Math.max(1, hole.par - 1)}"
            >
              <span>Birdie</span>
              <strong>${Math.max(1, hole.par - 1)}</strong>
            </button>
            <button
              class="score-chip is-primary"
              type="button"
              data-action="quick-score"
              data-hole="${hole.number}"
              data-participant-id="${participant.id}"
              data-strokes="${hole.par}"
            >
              <span>Par</span>
              <strong>${hole.par}</strong>
            </button>
            <button
              class="score-chip"
              type="button"
              data-action="quick-score"
              data-hole="${hole.number}"
              data-participant-id="${participant.id}"
              data-strokes="${hole.par + 1}"
            >
              <span>Bogey</span>
              <strong>${hole.par + 1}</strong>
            </button>
          </div>
          <div class="score-manual-row">
            <button class="button primary score-next-button" type="button" data-action="jump-next-open" data-hole="${nextOpenHole}">
              Next hole ${nextOpenHole}
            </button>
            <label class="score-inline-field">
              <span>Other score</span>
              <input
                type="number"
                min="1"
                max="12"
                value="${context.entry?.strokes ?? ""}"
                inputmode="numeric"
                enterkeyhint="next"
                data-score-field="strokes"
                data-hole="${hole.number}"
                data-participant-id="${participant.id}"
              />
            </label>
          </div>
        </div>
        <details class="advanced-hole-stats">
          <summary>
            <span>Advanced hole stats</span>
            <strong>${escapeHtml(context.advancedSummary)}</strong>
          </summary>
          <div class="advanced-hole-stats-body">
            <div class="split-inputs score-secondary-grid">
              <label>
                Putts
                <input
                  type="number"
                  min="0"
                  max="6"
                  value="${context.entry?.putts ?? ""}"
                  inputmode="numeric"
                  enterkeyhint="next"
                  data-score-field="putts"
                  data-hole="${hole.number}"
                  data-participant-id="${participant.id}"
                />
              </label>
              <label>
                Penalties
                <input
                  type="number"
                  min="0"
                  max="4"
                  value="${context.entry?.penalties ?? 0}"
                  inputmode="numeric"
                  enterkeyhint="done"
                  data-score-field="penalties"
                  data-hole="${hole.number}"
                  data-participant-id="${participant.id}"
                />
              </label>
            </div>
            <div class="toggle-row toggle-row-advanced">
              <button
                class="toggle-pill ${context.entry?.fairwayHit ? "is-on" : ""}"
                type="button"
                data-action="toggle-flag"
                data-field="fairwayHit"
                data-hole="${hole.number}"
                data-participant-id="${participant.id}"
              >
                Fairway
              </button>
              <button
                class="toggle-pill ${context.entry?.gir ? "is-on" : ""}"
                type="button"
                data-action="toggle-flag"
                data-field="gir"
                data-hole="${hole.number}"
                data-participant-id="${participant.id}"
              >
                GIR
              </button>
              <button
                class="toggle-pill ${context.entry?.upAndDown ? "is-on" : ""}"
                type="button"
                data-action="toggle-flag"
                data-field="upAndDown"
                data-hole="${hole.number}"
                data-participant-id="${participant.id}"
              >
                Up and down
              </button>
              <button
                class="toggle-pill ${context.entry?.sandSave ? "is-on" : ""}"
                type="button"
                data-action="toggle-flag"
                data-field="sandSave"
                data-hole="${hole.number}"
                data-participant-id="${participant.id}"
              >
                Sand save
              </button>
            </div>
          </div>
        </details>
      </article>
    `;
  }

  function renderSharedParticipantRow(participant) {
    const context = buildParticipantContext(participant);

    return `
      <article class="shared-round-row ${context.isLeader ? "is-leader" : ""}">
        <div class="shared-round-row-main">
          ${renderAvatarChip(context.previewProfile?.publicProfile.avatarLabel || participant.avatarLabel)}
          <div>
            <strong>${escapeHtml(participant.name)}</strong>
            <p>${escapeHtml(context.feedback.headline)} / ${escapeHtml(context.leaderboardEntry?.displayStatus || "Waiting")}</p>
          </div>
        </div>
        <div class="shared-round-row-metrics">
          <span>Hole ${hole.number}</span>
          <strong>${context.entry?.strokes ?? "--"}</strong>
          ${context.previewProfileId
            ? `<button class="button subtle profile-preview-button" type="button" data-action="select-profile-preview" data-profile-id="${context.previewProfileId}" data-preview-view="community">View card</button>`
            : ""}
        </div>
      </article>
    `;
  }

  return `
    <article class="card round-card round-score-shell">
      <div class="round-score-heading">
        <div>
          <p class="eyebrow">Live scoring</p>
          <h3>Hole ${hole.number}</h3>
          <p class="body-copy compact-copy round-score-subcopy">Par ${hole.par} / ${hole.yards} yds / ${escapeHtml(round.courseName)} / ${escapeHtml(round.teeBox)} tees</p>
        </div>
        <div class="round-score-status">
          <span class="status-pill">${escapeHtml(summary.localParticipant?.displayStatus || "--")}</span>
          <span class="status-pill">${escapeHtml(roundSafety.title)}</span>
        </div>
      </div>
      ${renderHoleNavigator(round, selectedHole)}
      <div class="round-save-strip is-${roundSafety.tone}">
        <div class="round-save-copy">
          <strong>${escapeHtml(roundSafety.badge)}</strong>
          <p>${escapeHtml(roundSafety.detail)}</p>
        </div>
        <div class="round-save-actions">
          <span class="status-pill">${escapeHtml(roundSafety.meta)}</span>
          ${roundSafety.showRetry ? `<button class="button subtle round-retry-inline" type="button" data-action="retry-cloud-save">Retry save</button>` : ""}
          <button class="button subtle round-continue-inline" type="button" data-action="jump-next-open" data-hole="${nextOpenHole}">Next hole</button>
        </div>
      </div>
      <p class="body-copy compact-copy round-save-subcopy">${escapeHtml(roundSafety.submeta)}</p>
      ${showInlineHelp ? `
        <div class="row-actions help-row round-help-row">
          ${renderHelpLink("Need help with score entry?", "playing-round", true)}
        </div>
      ` : ""}
      <p class="body-copy compact-copy round-entry-focus">Your score entry opens first. The shared round stays visible below without forcing you to score everyone else.</p>
      ${renderCompetitiveSpotlights(summary)}
      <div class="participant-grid participant-grid--single">
        ${primaryParticipant ? renderEditableParticipant(primaryParticipant) : ""}
      </div>
      ${secondaryParticipants.length
        ? `
          <div class="round-shared-group">
            <div class="section-heading section-heading--compact">
              <div>
                <p class="eyebrow">Shared round</p>
                <h4>Everyone else at a glance</h4>
              </div>
            </div>
            <p class="body-copy compact-copy">By default, each golfer only enters their own score. Use this list to follow the group without digging through more inputs.</p>
            <div class="stack-list compact-stack shared-round-list">
              ${secondaryParticipants.map((participant) => renderSharedParticipantRow(participant)).join("")}
            </div>
            <details class="round-secondary-entry">
              <summary>
                <span>Need to score another golfer on this phone?</span>
                <strong>${secondaryParticipants.length} extra ${secondaryParticipants.length === 1 ? "card" : "cards"}</strong>
              </summary>
              <div class="stack-list round-secondary-entry-list">
                ${secondaryParticipants.map((participant) => renderEditableParticipant(participant, { secondary: true })).join("")}
              </div>
            </details>
          </div>
        `
        : ""}
    </article>
  `;
}

function renderLeaderboardCard(state, round) {
  const summary = getRoundSummary(round, state.currentUser.id);
  const leader = summary.leaderboard[0];
  const localEntry = summary.leaderboard.find((entry) => entry.isLocal);

  return `
    <article class="card live-leaderboard-card round-support-card live-leaderboard-card--compact">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Leaderboard</p>
          <h3>Compact live view</h3>
        </div>
      </div>
      <div class="round-subtle-strip">
        <span class="mini-label">${leader ? `Leader ${leader.name}` : "Leaderboard"}</span>
        <strong>${localEntry ? `You #${localEntry.rank} / ${localEntry.displayStatus}` : leader ? leader.displayStatus : "Waiting on scores"}</strong>
      </div>
      ${renderCompetitiveSpotlights(summary)}
      <div class="leaderboard-list leaderboard-list--compact">
        ${summary.leaderboard
          .map((entry) => {
            const gapLabel = !leader || entry.id === leader.id
              ? "Leader"
              : round.mode === "match"
                ? "Chasing"
                : `${Math.max(0, entry.toPar - leader.toPar)} back`;
            const previewProfileId = findParticipantProfileId(round, entry.id);
            const previewProfile = previewProfileId ? getProfileById(state, previewProfileId) : null;

            return `
              <article class="leader-row leader-row--compact ${entry.isLocal ? "is-local" : ""} ${entry.id === leader?.id ? "is-leader" : ""}">
                <div class="leader-row-main">
                  <span class="rank-pill">#${entry.rank}</span>
                  ${renderAvatarChip(previewProfile?.publicProfile.avatarLabel || entry.name)}
                  <div class="leader-name-row">
                    <div>
                      <strong>${escapeHtml(entry.name)}</strong>
                      <p>${escapeHtml(entry.subtitle)}</p>
                    </div>
                  </div>
                </div>
                <div class="leader-row-trailing">
                  <span>Thru ${entry.thru}</span>
                  <strong>${escapeHtml(entry.displayStatus)}</strong>
                  <span>${escapeHtml(gapLabel)}</span>
                  <span class="leader-trend-pill is-${escapeHtml(entry.rankTrend || "steady")}">${escapeHtml(entry.rankTrendLabel || "Steady")}</span>
                  ${previewProfileId
                    ? `<button class="button subtle leaderboard-preview-button" type="button" data-action="select-profile-preview" data-profile-id="${previewProfileId}" data-preview-view="community">View card</button>`
                    : ""}
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    </article>
  `;
}

function renderLiveStateCard(state, round, group) {
  const sync = getSyncPresentation(round, group);
  const safety = getRoundSavePresentation(round);
  const inviteCode = group?.inviteCode || round?.inviteCode || "";

  return `
    <article class="card round-support-card sync-control-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Connection</p>
          <h3>Sync and room</h3>
        </div>
      </div>
      <div class="sync-banner is-${sync.tone}">
        <strong>${escapeHtml(sync.title)}</strong>
        <p>${sync.message}</p>
      </div>
      <div class="summary-grid compact">
        <article>
          <span>Transport</span>
          <strong>${escapeHtml(round.sync.label || CONNECTION_COPY.local)}</strong>
        </article>
        <article>
          <span>Round code</span>
          <strong>${escapeHtml(inviteCode || "Host to get code")}</strong>
        </article>
        <article>
          <span>Round safety</span>
          <strong>${escapeHtml(safety.title)}</strong>
        </article>
        <article>
          <span>Saved on this phone</span>
          <strong>${escapeHtml(formatRelativeSync(round.sync.lastLocalSaveAt))}</strong>
        </article>
        <article>
          <span>Cloud backup</span>
          <strong>${escapeHtml(round.sync?.saveState === "synced" ? formatRelativeSync(round.sync?.lastSyncedAt) : safety.badge)}</strong>
        </article>
      </div>
      <p class="body-copy compact-copy">${escapeHtml(safety.detail)}</p>
      <div class="row-actions connection-actions compact-actions">
        <button class="button primary" type="button" data-action="host-active-round">${inviteCode ? "Refresh code" : "Host round"}</button>
        ${inviteCode ? `<button class="button secondary" type="button" data-action="copy-invite-code" data-code="${inviteCode}">Copy code</button>` : ""}
        <button class="button secondary" type="button" data-action="enable-nearby">Nearby sync</button>
        <button class="button subtle" type="button" data-action="enable-bluetooth">Bluetooth sync</button>
      </div>
    </article>
  `;
}

function renderRoundControlCard(state, round) {
  const progress = getRoundProgress(round);
  const summary = getRoundSummary(round, state.currentUser.id);
  const canFinish = progress.completedHoles > 0;
  const saveInProgress = state.session?.cloudSync?.status === "syncing"
    && state.session?.cloudSync?.scope === "round-finish"
    && state.session?.cloudSync?.roundId === round.id;
  const pendingCount = getPendingRoundEvents(round).length;
  const saveCopy = saveInProgress
    ? "Your round is already finishing and backing up to your golfer account. Stay here for a moment instead of tapping again."
    : round.sync?.saveState === "retry-needed"
      ? `This round is already safe on this phone. ${pendingCount === 1 ? "1 live change is" : `${pendingCount} live changes are`} still waiting for cloud backup.`
      : canFinish
        ? "Finish once the group is in. The round moves into history immediately, stays safe on this phone first, and then backs up to this golfer account."
        : "Score at least one hole first. That keeps accidental taps from saving an empty round into history.";

  return `
    <article class="card premium-finish-card round-support-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Finish flow</p>
          <h3>Close the card</h3>
        </div>
      </div>
      <div class="summary-grid">
        <article>
          <span>Your status</span>
          <strong>${escapeHtml(summary.localParticipant?.displayStatus || "--")}</strong>
        </article>
        <article>
          <span>Completed</span>
          <strong>${progress.completedHoles}/18</strong>
        </article>
        <article>
          <span>Remaining</span>
          <strong>${progress.remainingHoles}</strong>
        </article>
        <article>
          <span>Projected leader</span>
          <strong>${escapeHtml(summary.winnerLabel)}</strong>
        </article>
      </div>
      <p class="body-copy">${saveCopy}</p>
      <div class="finish-actions">
        <button class="button primary finish-button" type="button" data-action="finish-round" data-round-id="${round.id}" ${canFinish && !saveInProgress ? "" : "disabled"}>${saveInProgress ? "Saving..." : "Finish round"}</button>
        <button class="button subtle" type="button" data-action="nav-view" data-view="stats">${round.sync?.saveState === "retry-needed" ? "Check round history" : "Review stats first"}</button>
      </div>
    </article>
  `;
}

function renderRoundView(state) {
  const activeRound = getActiveRound(state);
  const activeGroup = getActiveGroup(state, activeRound);

  if (!activeRound) {
    return `
      <section class="view-grid round-grid">
        ${renderCreateRoundCard(state, null)}
        ${renderJoinRoundQuickCard(state, { showNearby: true })}
        ${renderFirstRoundGuide(state, "round-setup")}
      </section>
    `;
  }

  const progress = getRoundProgress(activeRound);
  const summary = getRoundSummary(activeRound, state.currentUser.id);

  return `
    <section class="view-grid round-grid round-grid-live">
      <div class="round-main-column">
        ${renderHoleEditor(state, activeRound)}
        <article class="card round-live-pulse">
          <div class="summary-grid round-live-summary">
            <article>
              <span>Leader</span>
              <strong>${escapeHtml(summary.winnerLabel)}</strong>
            </article>
            <article>
              <span>Your status</span>
              <strong>${escapeHtml(getCompetitiveFeedback(activeRound, summary, summary.localParticipant?.id).headline)}</strong>
            </article>
            <article>
              <span>Played</span>
              <strong>${progress.completedHoles}/18</strong>
            </article>
            <article>
              <span>Vs group</span>
              <strong>${escapeHtml(getCompetitiveFeedback(activeRound, summary, summary.localParticipant?.id).detail)}</strong>
            </article>
          </div>
          ${renderModeNotes(state, activeRound.mode)}
        </article>
        ${renderFirstRoundGuide(state, "round-live")}
      </div>
      <div class="round-side-column">
        <div class="round-support-stack">
          ${renderLiveStateCard(state, activeRound, activeGroup)}
          ${renderLeaderboardCard(state, activeRound)}
          ${renderRoundControlCard(state, activeRound)}
        </div>
        ${renderCompetitivePreviewCard(
          state,
          state.session.selectedProfileId
            || activeRound.players.find((player) => !player.userId)?.profileId
            || state.currentUser.profileId,
          "Selected player matchup"
        )}
      </div>
    </section>
  `;
}

function renderFreeStatsCards(metrics, currentPreview) {
  return `
    <div class="summary-grid">
      <article>
        <span>Rounds played</span>
        <strong>${metrics.roundsPlayed}</strong>
      </article>
      <article>
        <span>Scoring average</span>
        <strong>${metrics.scoringAverage ? metrics.scoringAverage.toFixed(1) : "--"}</strong>
      </article>
      <article>
        <span>Fairways</span>
        <strong>${metrics.fairways}%</strong>
      </article>
      <article>
        <span>GIR</span>
        <strong>${metrics.gir}%</strong>
      </article>
      <article>
        <span>Average putts</span>
        <strong>${formatAverageScore(metrics.putts)}</strong>
      </article>
      <article>
        <span>Best round</span>
        <strong>${currentPreview?.bestRound || "--"}</strong>
      </article>
      <article>
        <span>Recent form</span>
        <strong>${escapeHtml(currentPreview?.recentFormSummary || "Building")}</strong>
      </article>
    </div>
  `;
}

function renderPremiumInsights(state, metrics, completedRounds, partners, currentPreview, recentSummary) {
  const gate = getFeatureGate("advanced-stats", getSubscription(state));
  const strokesGained = currentPreview?.strokesGained || metrics.strokesGained;
  const hardestHoles = currentPreview?.hardestHoles || metrics.hardestHoles;
  const bestHoles = currentPreview?.bestHoles || metrics.bestHoles;

  if (gate.locked) {
    return `
      <article class="card premium-lock-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Premium insights</p>
            <h3>Advanced analytics are ready when you upgrade</h3>
          </div>
          <span class="premium-badge">Locked</span>
        </div>
        <div class="locked-insight-grid">
          <article class="locked-insight">
            <strong>Round-to-round trendline</strong>
            <p>Track form, scoring trend, and handicap scaffolding instead of checking one scorecard at a time.</p>
          </article>
          <article class="locked-insight">
            <strong>Par-type breakdowns</strong>
            <p>See whether par 3s, par 4s, or par 5s are driving scoring outcomes.</p>
          </article>
          <article class="locked-insight">
            <strong>Smart performance tools</strong>
            <p>Unlock strokes gained, hardest-hole trends, and short insight cards that point to where scoring can improve.</p>
          </article>
        </div>
        <button class="button primary" type="button" data-action="nav-view" data-view="premium">See premium benefits</button>
      </article>
    `;
  }

  return `
    <article class="card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Premium insights</p>
          <h3>Advanced analytics unlocked</h3>
        </div>
        <span class="premium-badge is-live">Included</span>
      </div>
      <div class="summary-grid">
        <article>
          <span>Form</span>
          <strong>${escapeHtml(currentPreview?.formLabel || metrics.formLabel || "Stable")}</strong>
        </article>
        <article>
          <span>Handicap scaffold</span>
          <strong>${formatHandicap(currentPreview?.handicapIndex ?? metrics.handicapIndex)}</strong>
        </article>
        <article>
          <span>Up and down</span>
          <strong>${formatPercent(currentPreview?.upAndDownRate ?? metrics.upAndDownRate)}</strong>
        </article>
        <article>
          <span>Penalty avg</span>
          <strong>${formatAverageScore(currentPreview?.penaltiesAverage ?? metrics.penaltiesAverage)}</strong>
        </article>
        <article>
          <span>Total SG</span>
          <strong>${formatSignedValue(strokesGained?.total)}</strong>
        </article>
      </div>
      <div class="comparison-grid insight-breakdown-grid">
        <article class="plan-card">
          <span class="mini-label">Scoring by par type</span>
          <div class="stack-list compact-stack">
            <div class="feature-row">Par 3 avg: ${formatAverageScore(currentPreview?.scoringByParType?.[3]?.averageScore)}</div>
            <div class="feature-row">Par 4 avg: ${formatAverageScore(currentPreview?.scoringByParType?.[4]?.averageScore)}</div>
            <div class="feature-row">Par 5 avg: ${formatAverageScore(currentPreview?.scoringByParType?.[5]?.averageScore)}</div>
          </div>
        </article>
        <article class="plan-card">
          <span class="mini-label">Recent trend</span>
          <strong>${escapeHtml(currentPreview?.trendSummary || metrics.recentTrend?.summary || "Building a trend")}</strong>
          <p class="body-copy compact-copy">${recentSummary?.roundInsights?.[0] || currentPreview?.smartInsights?.[0] || "Complete more rounds to sharpen the insight engine."}</p>
        </article>
      </div>
      <div class="comparison-grid insight-breakdown-grid">
        <article class="plan-card">
          <span class="mini-label">Simplified strokes gained</span>
          <div class="stack-list compact-stack">
            <div class="feature-row">Driving: ${formatSignedValue(strokesGained?.driving?.value)} / ${escapeHtml(strokesGained?.driving?.label || "Neutral")}</div>
            <div class="feature-row">Approach: ${formatSignedValue(strokesGained?.approach?.value)} / ${escapeHtml(strokesGained?.approach?.label || "Neutral")}</div>
            <div class="feature-row">Putting: ${formatSignedValue(strokesGained?.putting?.value)} / ${escapeHtml(strokesGained?.putting?.label || "Neutral")}</div>
          </div>
        </article>
        <article class="plan-card">
          <span class="mini-label">Hole tendencies</span>
          <div class="stack-list compact-stack">
            <div class="feature-row">Toughest: ${hardestHoles?.[0] ? `Hole ${hardestHoles[0].holeNumber} / ${formatSignedValue(hardestHoles[0].averageToPar)}` : "Need more rounds"}</div>
            <div class="feature-row">Best: ${bestHoles?.[0] ? `Hole ${bestHoles[0].holeNumber} / ${formatSignedValue(bestHoles[0].averageToPar)}` : "Need more rounds"}</div>
            <div class="feature-row">Best category: ${escapeHtml(strokesGained?.bestCategory || "Driving")}</div>
          </div>
        </article>
      </div>
      <div class="comparison-grid insight-breakdown-grid">
        ${renderHolePerformanceList("Hardest holes", hardestHoles)}
        ${renderHolePerformanceList("Best holes", bestHoles)}
      </div>
      <div class="stack-list compact-stack">
        ${(recentSummary?.roundInsights?.length ? recentSummary.roundInsights : currentPreview?.smartInsights || [])
          .map((insight) => `<div class="feature-row">${escapeHtml(insight)}</div>`)
          .join("")}
        <div class="feature-row">Playing partners tracked: ${partners.length} / Completed cards: ${completedRounds.length} / Sand saves: ${currentPreview?.sandSaveCount ?? metrics.sandSaveCount ?? 0}</div>
      </div>
    </article>
  `;
}

function renderStatsView(state) {
  const metrics = getHistoryMetrics(state.rounds, state.currentUser.id);
  const partners = getFrequentPartners(state.rounds, state.currentUser.id);
  const completedRounds = getCompletedRounds(state);
  const summaryRound = getSummaryRound(state);
  const selectedSummary = summaryRound ? getRoundSummary(summaryRound, state.currentUser.id) : null;
  const selectedProfileId = state.session.selectedProfileId || state.currentUser.profileId;
  const currentCompetitivePreview = buildCompetitivePreview(state, state.currentUser.profileId, state.currentUser.profileId);
  const showingOtherProfile = selectedProfileId && selectedProfileId !== state.currentUser.profileId;
  const selectedPreview = showingOtherProfile
    ? buildCompetitivePreview(state, selectedProfileId, state.currentUser.profileId)
    : currentCompetitivePreview;

  return `
    <section class="view-grid stats-grid">
      <article class="card stats-overview-card card-span-3 stats-primary-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Stats</p>
            <h3>At a glance</h3>
          </div>
          <button class="button subtle" type="button" data-action="open-current-profile">Open player profile</button>
        </div>
        <p class="body-copy">This page keeps the important numbers first. You can check your progress, open your latest round, and update your player profile without digging through extra layers.</p>
        <div class="row-actions help-row">
          ${renderHelpLink("How to read stats", "stats-competition", true)}
        </div>
        <div class="summary-grid compact metric-help-grid">
          <article>
            <span>Fairways</span>
            <strong>Tee shots in play on par 4 and 5 holes</strong>
          </article>
          <article>
            <span>GIR</span>
            <strong>Greens reached in regulation</strong>
          </article>
          <article>
            <span>Form</span>
            <strong>How recent rounds compare with the prior stretch</strong>
          </article>
        </div>
        <div class="summary-grid">
          <article>
            <span>Rounds played</span>
            <strong>${metrics.roundsPlayed}</strong>
          </article>
          <article>
            <span>Average score</span>
            <strong>${metrics.scoringAverage ? metrics.scoringAverage.toFixed(1) : "--"}</strong>
          </article>
          <article>
            <span>Best round</span>
            <strong>${currentCompetitivePreview?.bestRound || "--"}</strong>
          </article>
          <article>
            <span>Fairways hit</span>
            <strong>${metrics.fairways}%</strong>
          </article>
          <article>
            <span>GIR</span>
            <strong>${metrics.gir}%</strong>
          </article>
        </div>
      </article>
      ${renderPlayerProfileCard(state)}
      ${renderAuthEntryCard(state)}
      ${renderHelpCenterCard()}
      ${showingOtherProfile ? renderCompetitivePreviewCard(state, selectedProfileId, "Selected player preview") : ""}
      <article class="card stats-quiet-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Simple stats</p>
            <h3>Easy to read numbers</h3>
          </div>
        </div>
        ${renderFreeStatsCards(metrics, currentCompetitivePreview)}
      </article>
      ${summaryRound && selectedSummary
        ? `
          <article class="card card-span-2 stats-primary-card">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Latest round</p>
                <h3>${escapeHtml(summaryRound.courseName)} / ${escapeHtml(selectedSummary.roundLabel)}</h3>
              </div>
              <button class="button subtle" type="button" data-action="view-summary" data-round-id="${summaryRound.id}">Open full summary</button>
            </div>
            <div class="summary-grid">
              <article>
                <span>Your result</span>
                <strong>${escapeHtml(selectedSummary.localParticipant?.displayStatus || "--")}</strong>
              </article>
              <article>
                <span>Fairways</span>
                <strong>${selectedSummary.localTotals?.fairwaysHit || 0}/${selectedSummary.localTotals?.fairwayOpportunities || 0}</strong>
              </article>
              <article>
                <span>GIR</span>
                <strong>${selectedSummary.localTotals?.greensHit || 0}/${selectedSummary.localTotals?.girOpportunities || 0}</strong>
              </article>
              <article>
                <span>Average putts</span>
                <strong>${selectedSummary.localTotals?.averagePutts ? selectedSummary.localTotals.averagePutts.toFixed(1) : "--"}</strong>
              </article>
              <article>
                <span>Penalties</span>
                <strong>${selectedSummary.localTotals?.totalPenalties || 0}</strong>
              </article>
            </div>
            ${!getFeatureGate("round-insights", getSubscription(state)).locked && selectedSummary.roundInsights.length
              ? `
                <div class="stack-list compact-stack">
                  ${selectedSummary.roundInsights.slice(0, 2).map((insight) => `<div class="feature-row">${escapeHtml(insight)}</div>`).join("")}
                </div>
              `
              : ""}
          </article>
        `
        : ""}
      <article class="card stats-quiet-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Playing partners</p>
            <h3>People you golf with most</h3>
          </div>
        </div>
        <div class="stack-list">
          ${partners.length
            ? partners
                .map(
                  (partner) => `
                    <article class="list-row">
                      <div>
                        <strong>${escapeHtml(partner.name)}</strong>
                        <p>${partner.rounds} rounds together</p>
                      </div>
                      <span>${formatDateTime(partner.latest)}</span>
                    </article>
                  `
                )
                .join("")
            : `
              <div class="empty-state onboarding-state">
                <strong>Partner trends appear after shared rounds.</strong>
                <p>Join or host a group round and Golfers Nation will start surfacing who you play with most.</p>
                <div class="row-actions empty-state-actions">
                  <button class="button primary" type="button" data-action="nav-view" data-view="community">Open community</button>
                  ${renderHelpLink("How shared rounds work", "playing-round", true)}
                </div>
              </div>`}
        </div>
      </article>
      ${renderPremiumInsights(state, metrics, completedRounds, partners, selectedPreview, selectedSummary)}
      <article class="card card-span-3">
        <div class="section-heading">
          <div>
            <p class="eyebrow">History</p>
            <h3>Round archive</h3>
          </div>
        </div>
        ${completedRounds.length
          ? `
            <div class="stack-list">
              ${completedRounds
                .map((round) => {
                  const summary = getRoundSummary(round, state.currentUser.id);
                  return `
                    <article class="list-row large">
                      <div>
                        <strong>${escapeHtml(round.courseName)}</strong>
                        <p>${escapeHtml(summary.roundLabel)} / ${formatDate(round.completedAt)}</p>
                      </div>
                      <div class="list-metrics">
                        <span>${escapeHtml(summary.localParticipant?.displayStatus || "--")}</span>
                        <span>${summary.holesPlayed} holes</span>
                        <button class="button subtle" type="button" data-action="view-summary" data-round-id="${round.id}">View summary</button>
                      </div>
                    </article>
                  `;
                })
                .join("")}
            </div>
          `
          : `
            <div class="empty-state onboarding-state">
              <strong>Your stats screen will build itself from real rounds.</strong>
              <div class="row-actions empty-state-actions">
                <button class="button primary" type="button" data-action="nav-view" data-view="round">Start round</button>
                <button class="button subtle" type="button" data-action="open-settings" data-section="app-support">Send feedback</button>
                ${renderHelpLink("How stats build", "stats-competition", true)}
              </div>
              <p>Finish one round and you’ll start seeing history, summaries, and player trends here.</p>
            </div>
          `}
      </article>
    </section>
  `;
}

function renderTournamentModule(state) {
  const gate = getFeatureGate("tournament-tools", getSubscription(state));

  if (gate.locked) {
    return `
      <article class="card premium-lock-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Tournament tools</p>
            <h3>Leagues and tournament controls are a premium workspace</h3>
          </div>
          <span class="premium-badge">Premium</span>
        </div>
        <p class="body-copy">The free experience keeps community focused on joining rounds and simple group play. Premium unlocks tournament setup, league management, and richer event ops.</p>
        <button class="button primary" type="button" data-action="nav-view" data-view="premium">Explore premium</button>
      </article>
    `;
  }

  return `
    <article class="card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Tournament tools</p>
          <h3>Create an event</h3>
        </div>
      </div>
      <form class="stack-form" data-form="create-tournament">
        <label>
          Event name
          <input name="name" type="text" placeholder="Weekend Cup" required />
        </label>
        <label>
          Course
          <input name="courseName" type="text" placeholder="National Pines" required />
        </label>
        <div class="split-inputs">
          <label>
            Date
            <input name="date" type="date" required />
          </label>
          <label>
            Format
            <select name="mode">
              ${Object.values(GAME_MODES)
                .filter((mode) => !isModeLocked(mode.id, getSubscription(state)))
                .map((mode) => `<option value="${mode.id}">${escapeHtml(mode.label)}</option>`)
                .join("")}
            </select>
          </label>
        </div>
        <label>
          Field size
          <input name="fieldSize" type="number" min="4" max="128" value="16" />
        </label>
        <button class="button primary" type="submit">Create tournament</button>
      </form>
    </article>
  `;
}

function renderCommunityView(state) {
  const activeRound = getActiveRound(state);
  const activeGroup = getActiveGroup(state, activeRound);
  const nearbyGames = listNearbyGames(state);
  const nearbyPlayers = listNearbyPlayers(state);
  const featuredProfileId = state.session.selectedProfileId
    || activeRound?.players.find((player) => !player.userId)?.profileId
    || nearbyPlayers[0]?.profileId
    || state.currentUser.profileId;
  const inviteCode = activeGroup?.inviteCode || activeRound?.inviteCode || "";

  return `
    <section class="view-grid community-grid">
      <article class="card community-hero-card card-span-2">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Community</p>
            <h3>Join fast and keep golfers visible</h3>
          </div>
          <span class="status-pill">${escapeHtml(inviteCode || "No code yet")}</span>
        </div>
        <p class="body-copy">Use nearby discovery when the group is already around you, or fall back to invite code when someone texts it over. Both paths open straight into the same shared round flow.</p>
        <div class="row-actions help-row">
          ${renderHelpLink("Need help joining a round?", "playing-round", true)}
        </div>
        <form class="inline-form round-join-form" data-form="join-code">
          <label class="inline-grow">
            Join by invite code
            <input name="inviteCode" type="text" placeholder="Enter code" />
          </label>
          <button class="button primary" type="submit">Join round</button>
        </form>
        <p class="body-copy compact-copy join-helper-copy">Ask the host for the invite code. When you join, your own golfer account opens into that round and keeps your score safely on this phone first.</p>
        <div class="row-actions">
          <button class="button secondary" type="button" data-action="host-active-round" ${activeRound ? "" : "disabled"}>Host active round</button>
          ${inviteCode ? `<button class="button secondary" type="button" data-action="copy-invite-code" data-code="${inviteCode}">Copy code</button>` : ""}
          <button class="button subtle" type="button" data-action="enable-nearby" ${activeRound ? "" : "disabled"}>Nearby sync</button>
          <button class="button subtle" type="button" data-action="enable-bluetooth" ${activeRound ? "" : "disabled"}>Bluetooth sync</button>
        </div>
      </article>
      <article class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Live room</p>
            <h3>Current shared round</h3>
          </div>
        </div>
        ${activeRound
          ? `
            <div class="summary-grid compact">
              <article>
                <span>Round</span>
                <strong>${escapeHtml(activeRound.courseName)}</strong>
              </article>
              <article>
                <span>Mode</span>
                <strong>${escapeHtml(GAME_MODES[activeRound.mode].label)}</strong>
              </article>
              <article>
                <span>Invite</span>
                <strong>${escapeHtml(inviteCode || "Not live yet")}</strong>
              </article>
              <article>
                <span>Sync</span>
                <strong>${escapeHtml(activeRound.sync.label)}</strong>
              </article>
            </div>
          `
          : `
            <div class="empty-state onboarding-state">
              <strong>No live room yet.</strong>
              <p>Start a round if you are the first golfer, or join by code if someone else already opened the round.</p>
              <div class="row-actions empty-state-actions">
                <button class="button primary" type="button" data-action="nav-view" data-view="round">Start round</button>
                ${renderHelpLink("Joining and hosting guide", "playing-round", true)}
              </div>
            </div>`}
      </article>
      ${activeRound
        ? `
          <article class="card">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Group golfers</p>
                <h3>Who is in this round</h3>
              </div>
            </div>
            <p class="body-copy compact-copy">Tap any golfer to open their public competitive card. The selected card stays below so you can compare the group without losing your place.</p>
            <div class="participant-preview-row">
              ${activeRound.players.map((player) => `
                <button class="player-preview-pill" type="button" data-action="select-profile-preview" data-profile-id="${escapeHtml(player.profileId || "")}">
                  ${renderAvatarChip(getProfileForPlayer(state, player)?.publicProfile.avatarLabel || player.avatarLabel)}
                  <span>${escapeHtml(player.name)}</span>
                </button>
              `).join("")}
            </div>
          </article>
        `
        : ""}
      ${renderCompetitivePreviewCard(state, featuredProfileId, featuredProfileId === state.currentUser.profileId ? "Your public matchup card" : "Selected golfer preview")}
      <article class="card card-span-2 discovery-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Nearby and discover</p>
            <h3>Open rounds and active golfers</h3>
          </div>
        </div>
        <p class="body-copy compact-copy">This is the low-friction path real testers asked for: spot a live round, tap once to join, or open another golfer's card before the first tee.</p>
        <div class="community-discovery-grid">
          <div class="stack-list discovery-column">
            <p class="mini-label">Discoverable rounds</p>
            ${nearbyGames.length
              ? renderNearbyRoundRows(nearbyGames.slice(0, 4))
              : `
                <div class="empty-state compact-empty-state">
                  <strong>No nearby rounds yet.</strong>
                  <p>Host the active round or keep code-based join as the fallback.</p>
                </div>
              `}
          </div>
          <div class="stack-list discovery-column">
            <p class="mini-label">Nearby golfers</p>
            ${renderNearbyPlayerRows(nearbyPlayers)}
          </div>
        </div>
      </article>
      <article class="card card-span-2">
        <div class="summary-grid compact">
          <article>
            <span>Fallback path</span>
            <strong>Join by code</strong>
          </article>
          <article>
            <span>Fast path</span>
            <strong>Discover nearby</strong>
          </article>
          <article>
            <span>Player visibility</span>
            <strong>Tap to view cards</strong>
          </article>
        </div>
        <p class="body-copy compact-copy">Community is now built around fast joining, visible golfers, and easy shared-round confidence. The invite code path still stays ready anytime nearby discovery is not enough.</p>
        <div class="row-actions empty-state-actions">
          <button class="button primary" type="button" data-action="nav-view" data-view="round">Back to round</button>
          ${renderHelpLink("Shared round guide", "playing-round", true)}
        </div>
      </article>
    </section>
  `;
}

function renderPlanComparison(state) {
  const subscription = getSubscription(state);
  const premium = isPremiumSubscription(subscription);

  return `
    <article class="card card-span-2">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Plan comparison</p>
          <h3>Free vs Premium</h3>
        </div>
      </div>
      <div class="comparison-grid">
        ${SUBSCRIPTION_PLANS.map(
          (plan) => `
            <article class="plan-card ${plan.id === "premium" ? "is-premium" : ""} ${subscription.tier === plan.id ? "is-current" : ""}">
              <span class="mini-label">${escapeHtml(plan.label)}</span>
              <strong>${escapeHtml(plan.priceLabel)}</strong>
              <p>${escapeHtml(plan.billingLabel)}</p>
              <p class="body-copy compact-copy">${escapeHtml(plan.highlight)}</p>
              <div class="stack-list">
                ${plan.features.map((feature) => `<div class="feature-row">${escapeHtml(feature)}</div>`).join("")}
              </div>
            </article>
          `
        ).join("")}
      </div>
      <div class="row-actions">
        <button class="button ${premium ? "secondary" : "primary"}" type="button" data-action="nav-view" data-view="stats">
          ${premium ? "Open premium stats" : "See locked stats"}
        </button>
        <span class="status-pill">Billing-ready structure: ${subscription.billingReady ? "Yes" : "Not yet"}</span>
      </div>
    </article>
  `;
}

function renderGearSection(state) {
  const activeRound = getActiveRound(state);
  const recommendations = getGearRecommendations(activeRound?.weather || "");

  return `
    <article class="card card-span-2">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Shop and gear</p>
          <h3>Round prep, apparel, and add-on structure</h3>
        </div>
      </div>
      <div class="tag-row">
        ${recommendations.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}
      </div>
      <div class="premium-shop-grid">
        <form class="stack-form" data-form="add-gear">
          <label>
            Category
            <select name="category">
              ${GEAR_CATEGORIES.map((category) => `<option value="${category}">${escapeHtml(category)}</option>`).join("")}
            </select>
          </label>
          <label>
            Item
            <input name="name" type="text" placeholder="Quarter zip" required />
          </label>
          <label>
            Notes
            <input name="notes" type="text" placeholder="Cold morning layer" />
          </label>
          <label>
            Weather use
            <input name="weatherUse" type="text" placeholder="wind, rain, cold" />
          </label>
          <button class="button primary" type="submit">Add to kit</button>
        </form>
        <div class="stack-list">
          ${state.gear.items
            .map(
              (item) => `
                <article class="list-row large">
                  <div>
                    <strong>${escapeHtml(item.name)}</strong>
                    <p>${escapeHtml(item.category)} / ${escapeHtml(item.notes || "No note yet")}</p>
                  </div>
                  <div class="list-metrics">
                    <span>${escapeHtml(item.weatherUse || "all weather")}</span>
                    <button class="button subtle" type="button" data-action="toggle-gear-packed" data-gear-id="${item.id}">
                      ${item.packed ? "Packed" : "Not packed"}
                    </button>
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
    </article>
  `;
}

function renderPremiumView(state) {
  const subscription = getSubscription(state);
  const premium = isPremiumSubscription(subscription);
  const planLabel = premium
    ? "Premium access is active, with deeper performance feedback and stronger live-play tools ready across the app."
    : "Premium adds deeper performance insight, smarter round review, and stronger group tools when golf becomes more than simple scorekeeping.";

  return `
    <section class="view-grid premium-grid">
      <article class="card premium-hero-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Premium</p>
            <h3>Premium membership for a real player platform</h3>
          </div>
          <span class="premium-badge ${premium ? "is-live" : ""}">${premium ? "Access active" : "Upgrade path"}</span>
        </div>
        <p class="body-copy">${escapeHtml(planLabel)}</p>
        <div class="summary-grid compact">
          <article>
            <span>Current plan</span>
            <strong>${escapeHtml(subscription.planName || (premium ? "Premium" : "Free"))}</strong>
          </article>
          <article>
            <span>Billing ready</span>
            <strong>${subscription.billingReady ? "Yes" : "Not yet"}</strong>
          </article>
        </div>
        <div class="row-actions">
          <button class="button primary" type="button" data-action="nav-view" data-view="stats">${premium ? "Use premium stats" : "See locked stats"}</button>
          ${renderHelpLink("What premium adds", "premium-features", true)}
        </div>
        <p class="hero-support-copy">${premium ? "This golfer already has premium access, so advanced stats, smarter round takeaways, and premium group tools are live across the app." : "Premium is built for golfers who want deeper feedback, more competitive context, and stronger live group play without losing the clean core flow."}</p>
        <p class="body-copy compact-copy">${premium ? "Keep using Stats and Community to see the added depth in real round history and live play." : "Locked cards stay visible so free golfers can understand the value before upgrading."}</p>
      </article>
      <article class="card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Future integrations</p>
            <h3>Subscription-ready feature stack</h3>
          </div>
        </div>
        <div class="stack-list">
          <div class="feature-row">Advanced stats and analytics</div>
          <div class="feature-row">Premium round insights</div>
          <div class="feature-row">Enhanced live group features</div>
          <div class="feature-row">Tournament and league tools</div>
          <div class="feature-row">GPS, watch, and smart gear integrations</div>
          <div class="feature-row">Course intelligence and premium dashboards</div>
        </div>
      </article>
      ${renderPlanComparison(state)}
      ${renderGearSection(state)}
    </section>
  `;
}

function renderCurrentView(state) {
  switch (state.session.activeView) {
    case "help":
      return renderHelpView(state);
    case "settings":
      return renderSettingsView(state);
    case "round":
      return renderRoundView(state);
    case "stats":
      return renderStatsView(state);
    case "community":
      return renderCommunityView(state);
    case "premium":
      return renderPremiumView(state);
    case "home":
    default:
      return renderHomeView(state);
  }
}
function renderAppTemplate(state) {
  if (state.auth?.status !== "authenticated") {
    if (state.session.activeView === "help") {
      return renderHelpView(state, { standalone: true });
    }

    return renderAuthScreen(state);
  }

  const activeRound = getActiveRound(state);
  const summaryRound = getSummaryRound(state);
  const subscription = getSubscription(state);
  const appearance = getAppearanceSettings(state);
  const activeViewLabel = state.session.activeView === "help"
    ? "Help"
    : state.session.activeView === "settings"
      ? "Settings"
    : VIEW_ORDER.find((view) => view.id === state.session.activeView)?.label || "Home";
  const activeTab = VIEW_ORDER.find((view) => view.id === state.session.activeView);
  const transitionClass = `transition-${state.session.transitionDirection || "steady"}`;
  const shellClasses = ["app-shell", state.session.standaloneMode ? "is-standalone" : ""].filter(Boolean).join(" ");
  const screenStageClasses = ["screen-stage", state.session.activeView !== "home" ? "screen-stage--compact" : "", state.session.activeView === "round" ? "screen-stage--round" : ""]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="${shellClasses}" data-theme="${escapeHtml(appearance.themeId)}" data-color-mode="${escapeHtml(appearance.colorMode)}">
      <aside class="side-rail">
        <div class="brand-block">
          <div class="brand-mark" data-action="admin-secret-tap">GN</div>
          <div>
            <p class="eyebrow">Premium social golf</p>
            <h1>Golfers Nation</h1>
          </div>
        </div>
        <div class="nav-stack">
          ${renderNav(state)}
        </div>
        ${renderPlanPill(state)}
        <article class="rail-card">
          <span class="mini-label">Sync layer</span>
          <strong>${escapeHtml(activeRound?.sync.label || CONNECTION_COPY.local)}</strong>
          <p>${escapeHtml(activeRound?.sync.note || "Offline-first local data foundation.")}</p>
        </article>
      </aside>
      <main class="content-shell">
        ${renderAppShellHeader(state, activeRound, subscription)}
        <section class="app-stage">
          ${renderGlobalFeedback(state)}
          ${renderSpotifyNowPlayingBar(state)}
          ${renderScreenHeader(state, activeRound)}
          ${summaryRound && state.session.activeView !== "round" ? renderSummarySpotlight(state, summaryRound) : ""}
          <section
            class="${screenStageClasses}"
            id="app-screen-${state.session.activeView}"
            role="tabpanel"
            ${activeTab ? `aria-labelledby="tab-${state.session.activeView}"` : `aria-label="${escapeHtml(activeViewLabel)}"`}
            data-view="${state.session.activeView}"
          >
            <div class="screen-panel view-shell ${transitionClass}" data-view="${state.session.activeView}" data-from-view="${state.session.previousView || state.session.activeView}">
              ${renderCurrentView(state)}
            </div>
          </section>
        </section>
      </main>
      <nav class="mobile-nav" aria-label="Primary" role="tablist">
        ${renderNav(state)}
      </nav>
    </div>
  `;
}

// ---- src/ui/render.js ----
function createRenderer(root) {
  return function render(state) {
    root.innerHTML = renderAppTemplate(state);
  };
}

// ---- src/ui/view-controller.js ----
function getViewIndex(viewId) {
  return VIEW_ORDER.findIndex((view) => view.id === viewId);
}
function setActiveView(draft, nextView, transitionKind = "tab") {
  const previousView = draft.session.activeView || "home";
  const previousIndex = getViewIndex(previousView);
  const nextIndex = getViewIndex(nextView);

  draft.session.previousView = previousView;
  draft.session.activeView = nextView;

  if (transitionKind === "focus-round") {
    draft.session.transitionDirection = "focus";
    return;
  }

  if (transitionKind === "return") {
    draft.session.transitionDirection = "return";
    return;
  }

  if (previousIndex !== -1 && nextIndex !== -1) {
    draft.session.transitionDirection = nextIndex >= previousIndex ? "forward" : "backward";
    return;
  }

  draft.session.transitionDirection = "steady";
}
function openHelpView(draft, sectionId = "getting-started") {
  const currentView = draft.session.activeView || "home";
  draft.session.helpReturnView = draft.auth?.status === "authenticated"
    ? (currentView === "help" ? draft.session.helpReturnView || "home" : currentView)
    : "auth";
  draft.session.helpSection = sectionId || draft.session.helpSection || "getting-started";
  setActiveView(draft, "help", "focus");
}
function closeHelpView(draft) {
  const returnView = draft.session.helpReturnView || "home";
  setActiveView(draft, returnView === "auth" ? "home" : returnView, "return");
}
function openSettingsView(draft, sectionId = "account") {
  const currentView = draft.session.activeView || "stats";
  draft.session.settingsReturnView = currentView === "settings"
    ? (draft.session.settingsReturnView || "stats")
    : currentView;
  draft.session.settingsSection = sectionId || draft.session.settingsSection || "account";
  setActiveView(draft, "settings", "focus");
}
function closeSettingsView(draft) {
  const returnView = draft.session.settingsReturnView || "stats";
  setActiveView(draft, returnView, "return");
}
function applyJoinedRoundState(draft, joined, successTitle, successMessage) {
  upsertJoinedRoundIntoState(draft, joined);
  applyJoinedRoundConnectionState(joined.round, joined.source);
  focusRoundView(draft, joined.round.id, draft.currentUser.profileId, setActiveView);
  refreshProfileSnapshots(draft);
  appendActivity(draft, joined.notice, "sync");
  setFeedback(draft, "success", successTitle, successMessage);
}

// ---- src/bootstrap/startup-recovery.js ----
function createBootErrorMessage(stage, error) {
  const stageLabel = String(stage || "startup")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const message = error instanceof Error ? error.message : String(error || "Unknown startup error.");
  return {
    stageLabel,
    message: message || "Unknown startup error.",
  };
}
function renderStartupShell(root, caption = "Preparing live rounds, player profiles, and your mobile app shell.") {
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="app-loading-shell" aria-label="Loading Golfers Nation">
      <div class="loading-card">
        <div class="loading-brand">
          <img src="/icons/icon-192.png" alt="" width="56" height="56" />
          <div class="loading-brand-copy">
            <p class="eyebrow">Golfers Nation</p>
            <strong class="loading-title">Opening your golf app</strong>
          </div>
        </div>
        <div class="loading-bar" aria-hidden="true">
          <span></span>
        </div>
        <p class="loading-caption">${caption}</p>
      </div>
    </div>
  `;
}
function showBootRecoveryScreen(root, {
  stage,
  error,
  locationRef = typeof window !== "undefined" ? window.location : null,
  storage = null,
  onRetry = null,
} = {}) {
  const detail = createBootErrorMessage(stage, error);
  console.error(`[Golfers Nation] Startup failed during ${stage || "startup"}.`, error);
  let availableStorage = storage;
  if (availableStorage === null) {
    try {
      availableStorage = typeof localStorage === "undefined" ? null : localStorage;
    } catch (storageError) {
      availableStorage = null;
    }
  }

  root.innerHTML = `
    <section class="boot-recovery-shell" aria-live="polite">
      <article class="boot-recovery-card" role="alert">
        <p class="eyebrow">Golfers Nation</p>
        <h1>We couldn't finish opening the app.</h1>
        <p class="body-copy">A startup step failed before the product shell was ready. Try launching again, or reset local app data on this device for testing.</p>
        <div class="boot-recovery-detail">
          <strong>${detail.stageLabel}</strong>
          <span>${detail.message}</span>
        </div>
        <div class="boot-recovery-actions">
          <button type="button" class="button button-primary" data-boot-action="retry">Retry</button>
          <button type="button" class="button button-secondary" data-boot-action="reset">Reset local app data</button>
        </div>
      </article>
    </section>
  `;

  root.querySelector('[data-boot-action="retry"]')?.addEventListener("click", () => {
    if (typeof onRetry === "function") {
      renderStartupShell(root, "Trying startup again with a safe local handoff.");
      try {
        onRetry();
        return;
      } catch (retryError) {
        console.error("[Golfers Nation] Retry failed immediately.", retryError);
      }
    }

    if (locationRef && typeof locationRef.reload === "function") {
      locationRef.reload();
    }
  });

  root.querySelector('[data-boot-action="reset"]')?.addEventListener("click", () => {
    try {
      availableStorage?.removeItem(STORAGE_KEY);
    } catch (storageError) {
      console.warn("[Golfers Nation] Failed to clear local app data.", storageError);
    }

    if (typeof onRetry === "function") {
      renderStartupShell(root, "Resetting local data and reopening Golfers Nation.");
      try {
        onRetry();
        return;
      } catch (retryError) {
        console.error("[Golfers Nation] Reset-and-retry failed immediately.", retryError);
      }
    }

    if (locationRef && typeof locationRef.reload === "function") {
      locationRef.reload();
    }
  });
}
function applyStartupWarning(state, title, message) {
  if (!state?.session || !state?.auth) {
    return state;
  }

  state.session.feedback = {
    tone: "warning",
    title,
    message,
    updatedAt: Date.now(),
  };
  state.auth.notice = message;
  return state;
}

// ---- src/bootstrap/app-bootstrap.js ----
const APP_SHELL_CACHE_PREFIX = "golfers-nation-shell-";
function getInstallEnvironment(hasDeferredPrompt = false) {
  if (typeof window === "undefined") {
    return {
      standaloneMode: false,
      installPromptAvailable: false,
      installState: "browser",
    };
  }

  const standaloneMode = (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches)
    || window.navigator.standalone === true;
  const userAgent = window.navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);

  return {
    standaloneMode,
    installPromptAvailable: hasDeferredPrompt && !standaloneMode,
    installState: standaloneMode
      ? "installed"
      : hasDeferredPrompt
        ? "prompt"
        : isIOS && isSafari
          ? "ios-share"
          : "browser",
  };
}
function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  if (window.location.protocol === "file:") {
    return;
  }

  const secureContext = window.location.protocol === "https:"
    || window.location.hostname === "localhost"
    || window.location.hostname === "127.0.0.1";

  if (!secureContext) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js", { scope: "/" }).catch(() => {});
  }, { once: true });
}
async function clearAppShellCaches() {
  if (typeof caches === "undefined" || typeof caches.keys !== "function") {
    return;
  }

  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(APP_SHELL_CACHE_PREFIX))
      .map((key) => caches.delete(key))
  );
}
async function refreshAppBuild({
  locationRef = typeof window !== "undefined" ? window.location : null,
  serviceWorkerContainer = typeof navigator !== "undefined" ? navigator.serviceWorker : null,
} = {}) {
  let controllerChangeHandler = null;
  let fallbackTimer = null;

  const triggerReload = () => {
    if (controllerChangeHandler && serviceWorkerContainer?.removeEventListener) {
      try {
        serviceWorkerContainer.removeEventListener("controllerchange", controllerChangeHandler);
      } catch {}
      controllerChangeHandler = null;
    }

    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }

    if (locationRef && typeof locationRef.reload === "function") {
      locationRef.reload();
    }
  };

  if (serviceWorkerContainer?.addEventListener) {
    controllerChangeHandler = () => triggerReload();
    serviceWorkerContainer.addEventListener("controllerchange", controllerChangeHandler, { once: true });
    fallbackTimer = setTimeout(triggerReload, 1200);
  }

  try {
    if (serviceWorkerContainer?.getRegistration) {
      const registration = await serviceWorkerContainer.getRegistration("./")
        .catch(() => serviceWorkerContainer.getRegistration());

      if (registration?.update) {
        await registration.update().catch(() => {});
      }

      if (registration?.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    }

    await clearAppShellCaches();
  } catch (error) {
    console.warn("[Golfers Nation] App refresh could not fully clear cached shell files.", error);
  }

  if (!serviceWorkerContainer?.addEventListener) {
    triggerReload();
  }
}
function applyAppearanceSelectionToDocument(appearance = {}) {
  if (typeof document === "undefined") {
    return;
  }

  const colorMode = appearance.colorMode || "system";
  const themeId = appearance.themeId || "forest";
  const textScale = appearance.textScale || "standard";
  const contrastMode = appearance.contrastMode === "high" ? "high" : "standard";
  const compactMode = appearance.compactMode === true;
  let resolvedMode = colorMode;

  if (colorMode === "system") {
    resolvedMode = typeof window !== "undefined"
      && typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }

  document.body.dataset.colorMode = colorMode;
  document.body.dataset.resolvedMode = resolvedMode === "light" ? "light" : "dark";
  document.body.dataset.theme = themeId;
  document.body.dataset.textScale = textScale === "large" ? "large" : "standard";
  document.body.dataset.contrast = contrastMode;
  document.body.dataset.density = compactMode ? "compact" : "comfortable";
  document.body.style.colorScheme = resolvedMode === "light" ? "light" : "dark";
}
function applyAppearanceToDocument(state) {
  applyAppearanceSelectionToDocument(state.currentUser?.appearance || {});
}
function applyShellModeToDocument(state) {
  if (typeof document === "undefined") {
    return;
  }

  document.body.dataset.appShellMode = state.session?.standaloneMode ? "standalone" : "browser";
}
function syncAppearancePreviewSummary(form) {
  if (!form) {
    return;
  }

  const selectedTheme = form.querySelector('input[name="themeId"]:checked');
  const activeThemeName = form.querySelector('[data-active-theme-name]');
  const activeThemeDescription = form.querySelector('[data-active-theme-description]');
  const activeThemeCard = form.querySelector('[data-active-theme-card]');

  if (!selectedTheme) {
    return;
  }

  const nextThemeId = String(selectedTheme.value || "forest");

  if (activeThemeName) {
    activeThemeName.textContent = selectedTheme.dataset.themeLabel || nextThemeId;
  }

  if (activeThemeDescription) {
    activeThemeDescription.textContent = selectedTheme.dataset.themeDescription || "";
  }

  if (activeThemeCard) {
    activeThemeCard.dataset.themePreview = nextThemeId;
  }
}
function previewAppearanceFromForm(form) {
  if (!form) {
    return;
  }

  const formData = new FormData(form);
  applyAppearanceSelectionToDocument({
    colorMode: String(formData.get("colorMode") || "system"),
    themeId: String(formData.get("themeId") || "forest"),
    textScale: String(formData.get("textScale") || "standard"),
    compactMode: formData.get("compactMode") === "on",
    contrastMode: formData.get("contrastMode") === "high" ? "high" : "standard",
  });
  syncAppearancePreviewSummary(form);
}
function createNoopRealtimeSession() {
  return {
    connect() {},
    disconnect() {},
    publishRoundUpdate() {
      return Promise.resolve();
    },
    enableNearbySync() {},
    enableBluetoothSync() {
      return Promise.resolve();
    },
    updateTransport() {},
    hostRoundSession() {
      return Promise.resolve({ status: "local-only" });
    },
    joinRoundSession() {
      return Promise.resolve(null);
    },
  };
}

// ---- src/services/product-platform.js ----
function createProductPlatform({
  auth = null,
  data = null,
  realtime = null,
} = {}) {
  const runtimeConfig = getRuntimeConfig();
  const localAuth = createLocalAuthGateway();
  const localData = createLocalDataGateway();
  const localRealtime = createLocalRealtimeGatewayFactory();
  const supabaseBridge = hasSupabaseRuntimeConfig(runtimeConfig)
    ? createSupabaseRestBridge({ config: runtimeConfig })
    : null;
  const resolvedAuth = auth || (supabaseBridge ? createSupabaseAuthGateway({ bridge: supabaseBridge, fallback: localAuth }) : localAuth);
  const resolvedData = data || (supabaseBridge ? createSupabaseDataGateway({ bridge: supabaseBridge, fallback: localData }) : localData);
  const resolvedRealtime = realtime || (supabaseBridge
    ? createSupabaseRealtimeGatewayFactory({ bridge: supabaseBridge, fallback: localRealtime })
    : localRealtime);

  return {
    auth: resolvedAuth,
    data: resolvedData,
    realtime: resolvedRealtime,
    capabilities: {
      authMode: resolvedAuth.mode,
      dataMode: resolvedData.mode,
      realtimeMode: resolvedRealtime.mode,
      backendReady: Boolean(resolvedAuth.backendReady && resolvedData.backendReady && resolvedRealtime.backendReady),
      supabaseEnabled: Boolean(supabaseBridge?.isConfigured?.()),
    },
  };
}

// ---- src/main.js ----
function bootstrapApp({
  root = typeof document !== "undefined" ? document.querySelector("#app") : null,
  platformFactory = createProductPlatform,
  createDefaultStateFn = createDefaultState,
  rendererFactory = createRenderer,
  timeoutMs = 4000,
  locationRef = typeof window !== "undefined" ? window.location : null,
  storage = null,
} = {}) {
  if (!root) {
    return { status: "missing-root" };
  }

  if (typeof window !== "undefined") {
    window.__GN_APP_BOOT_STARTED__ = true;
  }

  renderStartupShell(root);

  let availableStorage = storage;
  if (availableStorage === null) {
    try {
      availableStorage = typeof localStorage === "undefined" ? null : localStorage;
    } catch (error) {
      availableStorage = null;
    }
  }

  let bootFailed = false;
  let bootSettled = false;
  let bootWatchdog = null;
  let scorePulseTimer = null;
  let roundSyncRetryTimer = null;
  let roundSyncHeartbeatTimer = null;
  let roundSyncRequest = null;
  let realtimeSession = createNoopRealtimeSession();
  let removeBeforeUnload = () => {};
  let removeAppearanceListener = () => {};
  const removeStartupGuards = [];
  const removeRuntimeListeners = [];
  const localDeviceId = `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const cleanupRuntime = () => {
    if (scorePulseTimer) {
      clearTimeout(scorePulseTimer);
      scorePulseTimer = null;
    }

    if (roundSyncRetryTimer) {
      clearTimeout(roundSyncRetryTimer);
      roundSyncRetryTimer = null;
    }

    if (roundSyncHeartbeatTimer) {
      clearInterval(roundSyncHeartbeatTimer);
      roundSyncHeartbeatTimer = null;
    }

    while (removeRuntimeListeners.length) {
      const remove = removeRuntimeListeners.pop();
      try {
        remove?.();
      } catch (error) {
        console.warn("[Golfers Nation] Failed to remove a runtime listener cleanly.", error);
      }
    }

    try {
      realtimeSession.disconnect();
    } catch (error) {
      console.warn("[Golfers Nation] Failed to disconnect realtime session cleanly.", error);
    }
  };

  const clearBootGuards = () => {
    if (bootWatchdog) {
      clearTimeout(bootWatchdog);
      bootWatchdog = null;
    }

    while (removeStartupGuards.length) {
      const remove = removeStartupGuards.pop();
      try {
        remove?.();
      } catch (error) {
        console.warn("[Golfers Nation] Failed to remove a startup guard cleanly.", error);
      }
    }
  };

  const finalizeBoot = () => {
    bootSettled = true;
    clearBootGuards();
  };

  const failBoot = (stage, error) => {
    if (bootFailed) {
      return { status: "failed", stage, error };
    }

    bootFailed = true;
    clearBootGuards();
    removeBeforeUnload();
    cleanupRuntime();
    showBootRecoveryScreen(root, {
      stage,
      error,
      locationRef,
      storage: availableStorage,
      onRetry: () => bootstrapApp({
        root,
        platformFactory,
        createDefaultStateFn,
        rendererFactory,
        timeoutMs,
        locationRef,
        storage: availableStorage,
      }),
    });
    return { status: "failed", stage, error };
  };

  if (typeof window !== "undefined") {
    const handleStartupError = (event) => {
      if (!bootSettled && !bootFailed) {
        failBoot("window-error", event?.error || new Error(event?.message || "Unhandled startup error."));
      }
    };
    const handleStartupRejection = (event) => {
      if (!bootSettled && !bootFailed) {
        const reason = event?.reason instanceof Error
          ? event.reason
          : new Error(String(event?.reason || "Unhandled startup rejection."));
        failBoot("unhandled-rejection", reason);
      }
    };

    window.addEventListener("error", handleStartupError);
    window.addEventListener("unhandledrejection", handleStartupRejection);
    removeStartupGuards.push(() => window.removeEventListener("error", handleStartupError));
    removeStartupGuards.push(() => window.removeEventListener("unhandledrejection", handleStartupRejection));

    if (timeoutMs > 0) {
      bootWatchdog = window.setTimeout(() => {
        if (!bootSettled && !bootFailed) {
          failBoot("startup-timeout", new Error("Startup took too long to finish."));
        }
      }, timeoutMs);
    }
  }

  let platform;
  try {
    platform = platformFactory();
  } catch (error) {
    return failBoot("platform-init", error);
  }

  let initialState;
  try {
    initialState = platform.data.loadInitialState(createDefaultStateFn);
  } catch (error) {
    console.error("[Golfers Nation] Failed to load stored app state.", error);
    initialState = applyStartupWarning(
      createDefaultStateFn(),
      "Started with safe defaults",
      "Saved app data could not be loaded, so Golfers Nation opened with a fresh local state."
    );
  }

  try {
    initialState = platform.auth.restoreSession(initialState);
  } catch (error) {
    console.error("[Golfers Nation] Failed to restore the last session.", error);
    initialState = applyStartupWarning(
      createDefaultStateFn(),
      "Session restore skipped",
      "Your last session could not be restored, so Golfers Nation opened at sign in."
    );
  }

  const restoredActiveRound = initialState?.rounds?.find((round) => round.id === initialState?.session?.activeRoundId) || null;
  if (initialState?.auth?.activeUserId && restoredActiveRound?.status === "active") {
    initialState.session.activeView = "round";
    initialState.session.previousView = "round";
    initialState.session.transitionDirection = "steady";
  }

  let store;
  try {
    store = createStore(initialState);
  } catch (error) {
    return failBoot("store-init", error);
  }

  let render;
  try {
    render = rendererFactory(root);
  } catch (error) {
    return failBoot("renderer-init", error);
  }

  const safeRender = (state, stage = "render") => {
    try {
      render(state);
      return true;
    } catch (error) {
      failBoot(stage, error);
      return false;
    }
  };

  try {
    const createdSession = platform.realtime.createSession({ store });
    if (createdSession) {
      realtimeSession = {
        ...createNoopRealtimeSession(),
        ...createdSession,
      };
    }
  } catch (error) {
    console.error("[Golfers Nation] Failed to initialize realtime services.", error);
    initialState = applyStartupWarning(
      store.getState(),
      "Live sync unavailable",
      "Golfers Nation opened without live sync. Scoring and history still work on this device."
    );
  }

  let deferredInstallPrompt = null;
  let adminTapCount = 0;
  let adminTapAt = 0;

  const pulseScoreFeedback = (participantId, holeNumber) => {
    if (!participantId) {
      return;
    }

    store.setState((draft) => {
      draft.session.lastScoredParticipantId = participantId;
      draft.session.lastScoredHole = holeNumber || draft.session.selectedHole || 1;
      draft.session.lastScorePulseAt = Date.now();
      return draft;
    }, { reason: "score-pulse" });

    if (scorePulseTimer) {
      clearTimeout(scorePulseTimer);
    }

    scorePulseTimer = window.setTimeout(() => {
      store.setState((draft) => {
        draft.session.lastScoredParticipantId = null;
        draft.session.lastScoredHole = null;
        draft.session.lastScorePulseAt = 0;
        return draft;
      }, { reason: "score-pulse-clear" });
      scorePulseTimer = null;
    }, 850);
  };

  const captureRoundAction = (draft, round, {
    holeNumber,
    participantId,
    patch,
    actionType = "",
  }) => {
    if (!round) {
      return null;
    }

    ensureRoundSyncScaffold(round);
    const event = createRoundActionEvent({
      roundId: round.id,
      participantId,
      holeNumber,
      patch,
      actionType,
      actorUserId: draft.currentUser?.id || null,
      deviceId: localDeviceId,
    });
    const applied = applyRoundActionEvent(round, event);
    if (!applied.applied) {
      return null;
    }

    appendRoundAction(round, event);
    round.sync.state = round.sync.transport === "local" ? "local" : (round.sync.state || "connected");
    round.sync.note = round.sync.transport === "local"
      ? "Scores are safe on this device first. If the original host leaves, any joined golfer can keep scoring on their copy."
      : round.sync.note;
    return event;
  };

  const requestRealtimeRoundUpdate = (roundId) => {
    publishLiveRoundUpdate(realtimeSession, roundId);
  };

  const finalizeHostedRoundSession = async (roundId) => {
    if (!roundId) {
      return;
    }

    const result = await hostLiveRoundSession(realtimeSession, roundId);
    if (!result?.error && result?.status !== "skipped-missing-table") {
      return;
    }

    console.warn("[Golfers Nation] Live room host setup fell back to local-only mode.", result);

    store.setState((draft) => {
      const round = findRound(draft, roundId);
      if (round) {
        round.sync.transport = "local";
        round.sync.label = "Local only";
        round.sync.state = "local";
        round.sync.note = "Live hosting could not reach the shared backend, so this phone stayed in local-safe mode.";
      }

      setFeedback(
        draft,
        "warning",
        "Live room unavailable",
        describeLiveRoomFailure(result)
      );
      return draft;
    }, { reason: "host-live-round-fallback" });
  };

  const resolveLiveJoinResult = async (code, warningPrefix) => {
    return joinLiveRoundSession(realtimeSession, code, warningPrefix);
  };

  subscribeStorePersistence({
    store,
    platform,
    safeRender,
    applyAppearanceToDocument,
    applyShellModeToDocument,
  });

  if (!renderInitialAppState({
    store,
    safeRender,
    applyAppearanceToDocument,
    applyShellModeToDocument,
  })) {
    return { status: "failed", stage: "initial-render" };
  }

  try {
    registerServiceWorker();
  } catch (error) {
    console.warn("[Golfers Nation] Service worker registration could not be started.", error);
  }

  try {
    realtimeSession.connect();
  } catch (error) {
    console.error("[Golfers Nation] Realtime connect failed. Continuing in local-only mode.", error);
    realtimeSession = createNoopRealtimeSession();
    store.setState((draft) => {
      setFeedback(
        draft,
        "warning",
        "Live sync unavailable",
        "Golfers Nation started in local-only mode. Scoring and round history still work on this device."
      );
      return draft;
    }, { reason: "realtime-connect-failed" });
  }

  finalizeBoot();

  const syncInstallState = () => {
    const next = getInstallEnvironment(Boolean(deferredInstallPrompt));
    store.setState((draft) => {
      draft.session.standaloneMode = next.standaloneMode;
      draft.session.installPromptAvailable = next.installPromptAvailable;
      draft.session.installState = next.installState;
      return draft;
    }, { reason: "install-state-sync" });
  };

  syncInstallState();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    syncInstallState();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    store.setState((draft) => {
      draft.session.installHintDismissed = true;
      appendActivity(draft, "Golfers Nation was installed and is ready from the home screen.", "product");
      setFeedback(draft, "success", "Installed", "Golfers Nation is now available from your home screen.");
      return draft;
    }, { reason: "app-installed" });
    syncInstallState();
  });

  const displayModeMedia = typeof window.matchMedia === "function"
    ? window.matchMedia("(display-mode: standalone)")
    : null;
  if (displayModeMedia && typeof displayModeMedia.addEventListener === "function") {
    displayModeMedia.addEventListener("change", syncInstallState);
  }

  const appearanceMedia = typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-color-scheme: light)")
    : null;
  if (appearanceMedia && typeof appearanceMedia.addEventListener === "function") {
    const handleAppearanceChange = () => applyAppearanceToDocument(store.getState());
    appearanceMedia.addEventListener("change", handleAppearanceChange);
    removeAppearanceListener = () => appearanceMedia.removeEventListener("change", handleAppearanceChange);
  }

  const hydrateRemoteAccount = async (userId, {
    pendingLabel = "",
    warningTitle = "Cloud sync unavailable",
    warningMessage = "Your local cache is still available, but the cloud workspace could not be refreshed right now.",
  } = {}) => {
    if (!platform.data.hydrateAccountAsync || !userId) {
      return { status: "skipped" };
    }

    if (pendingLabel) {
      store.setState((draft) => {
        draft.session.pendingLabel = pendingLabel;
        return draft;
      }, { reason: "hydrate-remote-pending" });
    }

    const result = await platform.data.hydrateAccountAsync(store, userId);
    if (result?.error) {
      console.warn("[Golfers Nation] Cloud workspace refresh failed.", result.error);
      store.setState((draft) => {
        draft.session.pendingLabel = "";
        if (!draft.session.feedback || draft.session.feedback.tone !== "error") {
          setFeedback(draft, "warning", warningTitle, warningMessage);
        }
        return draft;
      }, { reason: "hydrate-remote-warning" });
      return result;
    }

    store.setState((draft) => {
      draft.session.pendingLabel = "";
      if (result?.syncWarning && (!draft.session.feedback || draft.session.feedback.tone !== "error")) {
        setFeedback(draft, "warning", warningTitle, warningMessage);
      }
      return draft;
    }, { reason: "hydrate-remote-complete" });
    return result;
  };

  const scheduleRoundSyncRetry = (delayMs = 5000) => {
    if (roundSyncRetryTimer || typeof window === "undefined" || !window.setTimeout) {
      return;
    }

    roundSyncRetryTimer = window.setTimeout(async () => {
      roundSyncRetryTimer = null;
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        scheduleRoundSyncRetry(5000);
        return;
      }

      await runPendingRoundSync({ successFeedback: false });
    }, delayMs);
  };

  const runPendingRoundSync = async ({
    successFeedback = false,
    userId = store.getState().auth.activeUserId || store.getState().currentUser?.id || null,
  } = {}) => {
    if (!platform.data.flushSyncAsync || !userId) {
      return { status: "skipped" };
    }

    const pendingRounds = collectPendingRoundEvents(store.getState(), userId);
    if (!pendingRounds.length) {
      const cloudSync = store.getState().session?.cloudSync || {};
      if (cloudSync.scope === "round-live" && cloudSync.userId === userId) {
        store.setState((draft) => {
          draft.session.pendingLabel = "";
          resetCloudSyncState(draft);
          return draft;
        }, { reason: "round-live-sync-idle" });
      }
      return { status: "idle" };
    }

    if (roundSyncRequest) {
      roundSyncRequest.needsAnotherPass = true;
      return { status: "already-syncing" };
    }

    const syncStartedAt = Date.now();
    const copy = getRoundEventSyncCopy(
      pendingRounds.length === 1 ? findRound(store.getState(), pendingRounds[0].roundId) : null,
      pendingRounds.reduce((sum, item) => sum + item.pendingCount, 0)
    );
    const queuedEventIds = pendingRounds.flatMap((item) => item.eventIds);
    const queuedRoundIds = pendingRounds.map((item) => item.roundId);
    const primaryRoundId = queuedRoundIds.length === 1 ? queuedRoundIds[0] : store.getState().session.activeRoundId || null;
    roundSyncRequest = {
      eventIds: queuedEventIds,
      roundIds: queuedRoundIds,
      userId,
      needsAnotherPass: false,
    };

    store.setState((draft) => {
      queuedRoundIds.forEach((roundId) => {
        updateRoundSyncDraft(draft, roundId, (round) => {
          markRoundEventsSyncing(
            round,
            pendingRounds.find((item) => item.roundId === roundId)?.eventIds || [],
            syncStartedAt
          );
        });
      });
      draft.session.pendingLabel = copy.pendingLabel;
      setCloudSyncState(draft, {
        status: "syncing",
        scope: "round-live",
        roundId: primaryRoundId,
        userId,
        errorMessage: "",
        lastAttemptAt: syncStartedAt,
      });
      return draft;
    }, { reason: "round-live-sync-pending" });

    const syncResult = await platform.data.flushSyncAsync(store.getState(), userId);
    const finishedRequest = roundSyncRequest;
    roundSyncRequest = null;

    store.setState((draft) => {
      draft.session.pendingLabel = "";

      if (syncResult?.error) {
        finishedRequest.roundIds.forEach((roundId) => {
          updateRoundSyncDraft(draft, roundId, (round) => {
            markRoundEventsRetryNeeded(
              round,
              finishedRequest.eventIds.filter((eventId) => round.eventLog.some((event) => event.id === eventId)),
              syncResult.error.message || copy.failureMessage,
              Date.now()
            );
          });
        });
        setCloudSyncState(draft, {
          status: "failed",
          scope: "round-live",
          roundId: finishedRequest.roundIds.length === 1 ? finishedRequest.roundIds[0] : primaryRoundId,
          userId,
          errorMessage: syncResult.error.message || copy.failureMessage,
          lastAttemptAt: Date.now(),
          retryCount: (draft.session.cloudSync?.retryCount || 0) + 1,
        });
        setFeedback(
          draft,
          "warning",
          copy.failureTitle,
          `${copy.failureMessage} ${syncResult.error.message ? `Latest error: ${syncResult.error.message}` : ""}`.trim()
        );
        return draft;
      }

      finishedRequest.roundIds.forEach((roundId) => {
        updateRoundSyncDraft(draft, roundId, (round) => {
          markRoundEventsSynced(
            round,
            finishedRequest.eventIds.filter((eventId) => round.eventLog.some((event) => event.id === eventId)),
            Date.now()
          );
        });
      });
      resetCloudSyncState(draft);
      if (successFeedback) {
        setFeedback(draft, "success", copy.successTitle, copy.successMessage);
      }
      return draft;
    }, { reason: "round-live-sync-complete" });

    if (syncResult?.error) {
      scheduleRoundSyncRetry();
      return syncResult;
    }

    if (finishedRequest.needsAnotherPass || hasPendingRoundSyncForUser(store.getState(), userId)) {
      await runPendingRoundSync({ successFeedback: false, userId });
    }

    return syncResult;
  };

  const runCloudSave = async ({
    scope = "workspace",
    roundId = null,
    userId = store.getState().auth.activeUserId || store.getState().currentUser?.id || null,
    successFeedback = false,
  } = {}) => {
    if (!platform.data.flushSyncAsync || !userId) {
      return { status: "skipped" };
    }

    const existingSync = store.getState().session?.cloudSync || {};
    if (existingSync.status === "syncing"
      && existingSync.userId === userId
      && existingSync.scope === scope
      && (existingSync.roundId || null) === (roundId || null)) {
      return { status: "already-syncing" };
    }

    const copy = getCloudSyncCopy(scope, roundId);

    store.setState((draft) => {
      draft.session.pendingLabel = copy.pendingLabel;
      setCloudSyncState(draft, {
        status: "syncing",
        scope,
        roundId,
        userId,
        errorMessage: "",
        lastAttemptAt: Date.now(),
      });
      return draft;
    }, { reason: `${scope}-cloud-save-pending` });

    const syncResult = await platform.data.flushSyncAsync(store.getState(), userId);

    store.setState((draft) => {
      draft.session.pendingLabel = "";
      if (syncResult?.error) {
        const nextRetryCount = (draft.session.cloudSync?.retryCount || 0) + 1;
        if (scope === "round-finish" && roundId) {
          updateRoundSyncDraft(draft, roundId, (round) => {
            markRoundEventsRetryNeeded(
              round,
              getPendingRoundEvents(round).map((event) => event.id),
              syncResult.error.message || copy.failureMessage,
              Date.now()
            );
          });
        }
        setCloudSyncState(draft, {
          status: "failed",
          scope,
          roundId,
          userId,
          errorMessage: syncResult.error.message || copy.failureMessage,
          lastAttemptAt: Date.now(),
          retryCount: nextRetryCount,
        });
        setFeedback(
          draft,
          "warning",
          copy.failureTitle,
          `${copy.failureMessage} ${syncResult.error.message ? `Latest error: ${syncResult.error.message}` : ""}`.trim()
        );
        return draft;
      }

      if (scope === "round-finish" && roundId) {
        updateRoundSyncDraft(draft, roundId, (round) => {
          markRoundEventsSynced(round, getPendingRoundEvents(round).map((event) => event.id), Date.now());
          round.sync.saveState = "synced";
          round.sync.note = "The finished round is safe on this device and backed up to your account.";
        });
      }

      resetCloudSyncState(draft);
      if (successFeedback) {
        setFeedback(draft, "success", copy.successTitle, copy.successMessage);
      }
      return draft;
    }, { reason: `${scope}-cloud-save-complete` });

    return syncResult;
  };

  const retryPendingCloudSave = async (successFeedback = true) => {
    const cloudSync = store.getState().session?.cloudSync || {};
    if (cloudSync.scope === "round-live" || hasPendingRoundSyncForUser(store.getState(), cloudSync.userId || undefined)) {
      return runPendingRoundSync({
        successFeedback,
        userId: cloudSync.userId || store.getState().auth.activeUserId || null,
      });
    }

    if (!["failed", "syncing"].includes(cloudSync.status) || !cloudSync.userId) {
      return { status: "skipped" };
    }

    return runCloudSave({
      scope: cloudSync.scope || "workspace",
      roundId: cloudSync.roundId || null,
      userId: cloudSync.userId,
      successFeedback,
    });
  };

  if (typeof window !== "undefined") {
    const handleOnline = () => {
      void runPendingRoundSync({ successFeedback: false });
    };

    const handleOffline = () => {
      const activeRoundId = store.getState().session?.activeRoundId || null;
      if (!activeRoundId) {
        return;
      }

      store.setState((draft) => {
        updateRoundSyncDraft(draft, activeRoundId, (round) => {
          ensureRoundSyncScaffold(round);
          if (round.sync.pendingActionCount > 0) {
            round.sync.saveState = "retry-needed";
            round.sync.note = "Connection dropped. This live round is still safe on this device and will retry when service returns.";
          } else {
            round.sync.note = "Connection dropped. This live round is still safe on this device.";
          }
        });
        return draft;
      }, { reason: "network-offline" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    removeRuntimeListeners.push(() => window.removeEventListener("online", handleOnline));
    removeRuntimeListeners.push(() => window.removeEventListener("offline", handleOffline));

    if (window.setInterval) {
      roundSyncHeartbeatTimer = window.setInterval(() => {
        if ((typeof navigator === "undefined" || navigator.onLine !== false) && hasPendingRoundSyncForUser(store.getState())) {
          void runPendingRoundSync({ successFeedback: false });
        }
      }, 15000);
    }
  }

  const mutateSpotifyState = (draft, updater) => {
    draft.currentUser.integrations = {
      ...(draft.currentUser.integrations || {}),
      spotify: updater(getSpotifyIntegration(draft)),
    };
    draft.session.spotify = createSpotifySessionState(draft.session.spotify);
  };

  const openSpotifyDestination = () => {
    const target = getSpotifyOpenTarget(getSpotifyIntegration(store.getState()));
    if (typeof window === "undefined") {
      return false;
    }

    try {
      if (typeof window.open === "function") {
        const opened = window.open(target.webUrl, "_blank", "noopener");
        return Boolean(opened) || typeof opened === "undefined";
      }
    } catch (error) {
      console.warn("[Golfers Nation] Spotify open request failed.", error);
    }

    return false;
  };

  const handleAsyncEmailSignUp = async (form, data) => {
    store.setState((draft) => {
      draft.auth.error = "";
      draft.auth.notice = "";
      draft.session.pendingLabel = "Creating your secure golfer account...";
      return draft;
    }, { reason: "auth-signup-pending" });

    const result = await platform.auth.signUpWithEmailAsync(store.getState(), {
      displayName: data.get("displayName"),
      email: data.get("email"),
      password: data.get("password"),
    });

    let committedAccountId = null;
    store.setState((draft) => {
      draft.session.pendingLabel = "";

      if (result.error) {
        draft.auth.error = result.error;
        draft.auth.notice = "";
        return draft;
      }

      const committed = platform.auth.commitAuthResult(draft, result);
      if (committed.error) {
        draft.auth.error = committed.error;
        draft.auth.notice = "";
        return draft;
      }

      if (committed.requiresConfirmation) {
        setFeedback(draft, "info", "Check your email", result.notice || "Confirm your email, then sign in.");
        return draft;
      }

      committedAccountId = committed.account.id;
      draft.auth.mode = "login";
      appendActivity(draft, `${draft.currentUser.displayName} created a new secure email account.`, "profile");
      setFeedback(
        draft,
        "success",
        "Account created",
        `${draft.currentUser.displayName} is signed in with premium tester access, and Golden Nugget is ready as the easiest first course.`
      );
      return draft;
    }, { reason: "auth-signup-async" });

    form.reset();

    if (committedAccountId) {
      await hydrateRemoteAccount(committedAccountId, {
        pendingLabel: "Loading your cloud workspace...",
        warningTitle: "Cloud setup still finishing",
        warningMessage: "Your golfer account is ready on this device. Cloud storage can retry automatically if the first sync takes a moment.",
      });
    }
  };

  const handleAsyncEmailLogin = async (form, data) => {
    store.setState((draft) => {
      draft.auth.error = "";
      draft.auth.notice = "";
      draft.session.pendingLabel = "Signing in and restoring your rounds...";
      return draft;
    }, { reason: "auth-login-pending" });

    const result = await platform.auth.signInWithEmailAsync(store.getState(), {
      email: data.get("email"),
      password: data.get("password"),
    });

    let committedAccountId = null;
    store.setState((draft) => {
      draft.session.pendingLabel = "";

      if (result.error) {
        draft.auth.error = result.error;
        draft.auth.notice = "";
        return draft;
      }

      const committed = platform.auth.commitAuthResult(draft, result);
      if (committed.error) {
        draft.auth.error = committed.error;
        draft.auth.notice = "";
        return draft;
      }

      committedAccountId = committed.account.id;
      appendActivity(draft, `${draft.currentUser.displayName} signed in with secure email auth.`, "profile");
      setFeedback(
        draft,
        "success",
        "Welcome back",
        `${draft.currentUser.displayName}'s rounds, settings, and saved course history are restoring for this account.`
      );
      return draft;
    }, { reason: "auth-login-async" });

    form.reset();

    if (committedAccountId) {
      await hydrateRemoteAccount(committedAccountId, {
        pendingLabel: "Refreshing your cloud rounds and stats...",
        warningTitle: "Cloud restore delayed",
        warningMessage: "You are signed in, and this device cache is ready. Cloud history can retry automatically if the network is slow.",
      });
    }
  };

  const handlePasswordReset = async (form, data) => {
    const email = String(data.get("email") || "").trim().toLowerCase();
    if (!email) {
      store.setState((draft) => {
        setFeedback(draft, "info", "Add your email first", "Enter the email tied to your golfer account, then send the reset link.");
        return draft;
      }, { reason: "auth-reset-missing-email" });
      return;
    }

    store.setState((draft) => {
      draft.auth.error = "";
      draft.session.pendingLabel = "Sending your password reset email...";
      return draft;
    }, { reason: "auth-reset-pending" });

    const result = await platform.auth.requestPasswordResetAsync(email);
    store.setState((draft) => {
      draft.session.pendingLabel = "";
      if (result?.error) {
        setFeedback(draft, "error", "Reset email failed", result.error);
        return draft;
      }

      setFeedback(draft, "success", "Reset email sent", "Check your inbox for the Supabase password reset link.");
      return draft;
    }, { reason: "auth-reset-complete" });

    form.reset();
  };

  const handleAsyncSignOut = async () => {
    const activeUserId = store.getState().auth.activeUserId || null;
    store.setState((draft) => {
      draft.session.pendingLabel = "Signing out...";
      return draft;
    }, { reason: "sign-out-pending" });

    try {
      await platform.data.flushSyncAsync?.(store.getState(), activeUserId);
    } catch (error) {
      console.warn("[Golfers Nation] Final cloud sync before sign out failed.", error);
    }

    let remoteError = "";
    try {
      const result = await platform.auth.signOutAsync(store.getState());
      remoteError = result?.error || "";
    } catch (error) {
      remoteError = error?.message || "The cloud session could not be cleared cleanly.";
    }

    store.setState((draft) => {
      clearFeedback(draft);
      draft.session.pendingLabel = "";
      platform.auth.signOut(draft);
      if (remoteError) {
        setFeedback(draft, "warning", "Signed out on this device", "The remote session could not be cleared cleanly, but this tester device is signed out.");
      }
      return draft;
    }, { reason: "sign-out-async" });
  };

  const bootActiveUserId = store.getState().auth.activeUserId;
  if (bootActiveUserId) {
    (async () => {
      try {
        await hydrateRemoteAccount(bootActiveUserId, {
          pendingLabel: "",
          warningTitle: "Cloud restore paused",
          warningMessage: "Your local account cache opened normally, but the live Supabase workspace could not be refreshed yet.",
        });
        await retryPendingCloudSave(false);
      } catch (error) {
        console.warn("[Golfers Nation] Background cloud restore failed.", error);
      }
    })();
  }

  root.addEventListener("click", async (event) => {
    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) {
      return;
    }

    const action = actionElement.dataset.action;

    if (action === "nav-view") {
      store.setState((draft) => {
        const nextView = actionElement.dataset.view;
        if (nextView === "help") {
          openHelpView(draft, actionElement.dataset.section);
          return draft;
        }

        setActiveView(draft, nextView, "tab");
        return draft;
      }, { reason: "nav-view" });
      return;
    }

    if (action === "open-help-section") {
      store.setState((draft) => {
        openHelpView(draft, actionElement.dataset.section);
        return draft;
      }, { reason: "open-help-section" });
      return;
    }

    if (action === "close-help") {
      store.setState((draft) => {
        closeHelpView(draft);
        return draft;
      }, { reason: "close-help" });
      return;
    }

    if (action === "open-settings") {
      store.setState((draft) => {
        openSettingsView(draft, actionElement.dataset.section);
        return draft;
      }, { reason: "open-settings" });
      return;
    }

    if (action === "close-settings") {
      store.setState((draft) => {
        closeSettingsView(draft);
        return draft;
      }, { reason: "close-settings" });
      return;
    }

    if (action === "set-settings-section") {
      store.setState((draft) => {
        draft.session.settingsSection = actionElement.dataset.section || draft.session.settingsSection || "account";
        return draft;
      }, { reason: "set-settings-section" });
      return;
    }

    if (action === "connect-spotify") {
      store.setState((draft) => {
        mutateSpotifyState(draft, (currentSpotify) => connectSpotifyCompanion(currentSpotify, {
          accountLabel: draft.currentUser.displayName || draft.currentUser.name,
          deviceName: draft.session.standaloneMode ? "This installed app" : "This browser",
        }));
        draft.session.spotify = createSpotifySessionState({
          ...draft.session.spotify,
          barCollapsed: false,
          lastAction: "connect",
          lastUpdatedAt: Date.now(),
        });
        appendActivity(draft, `${draft.currentUser.displayName} connected the Spotify companion preview.`, "product");
        setFeedback(
          draft,
          "success",
          "Spotify companion connected",
          "The compact Now Playing bar is ready in the app. Real Spotify auth and playback device control can be layered in next."
        );
        return draft;
      }, { reason: "connect-spotify" });
      return;
    }

    if (action === "disconnect-spotify") {
      store.setState((draft) => {
        mutateSpotifyState(draft, (currentSpotify) => disconnectSpotifyCompanion(currentSpotify));
        draft.session.spotify = createSpotifySessionState({
          barCollapsed: false,
          lastAction: "disconnect",
          lastUpdatedAt: Date.now(),
        });
        appendActivity(draft, `${draft.currentUser.displayName} disconnected the Spotify companion preview.`, "product");
        setFeedback(
          draft,
          "info",
          "Spotify disconnected",
          "Spotify controls are hidden again. The golf app stays fully usable without the music companion."
        );
        return draft;
      }, { reason: "disconnect-spotify" });
      return;
    }

    if (action === "toggle-spotify-bar") {
      store.setState((draft) => {
        draft.session.spotify = createSpotifySessionState({
          ...draft.session.spotify,
          barCollapsed: !draft.session.spotify?.barCollapsed,
          lastAction: "toggle",
          lastUpdatedAt: Date.now(),
        });
        return draft;
      }, { reason: "toggle-spotify-bar" });
      return;
    }

    if (action === "spotify-play-pause") {
      store.setState((draft) => {
        mutateSpotifyState(draft, (currentSpotify) => toggleSpotifyPlayback(currentSpotify));
        draft.session.spotify = createSpotifySessionState({
          ...draft.session.spotify,
          lastAction: "play-pause",
          lastUpdatedAt: Date.now(),
        });
        return draft;
      }, { reason: "spotify-play-pause" });
      return;
    }

    if (action === "spotify-next" || action === "spotify-prev") {
      const direction = action === "spotify-next" ? 1 : -1;
      store.setState((draft) => {
        mutateSpotifyState(draft, (currentSpotify) => stepSpotifyQueue(currentSpotify, direction));
        draft.session.spotify = createSpotifySessionState({
          ...draft.session.spotify,
          lastAction: action === "spotify-next" ? "next" : "prev",
          lastUpdatedAt: Date.now(),
        });
        return draft;
      }, { reason: action });
      return;
    }

    if (action === "spotify-open") {
      const opened = openSpotifyDestination();
      if (!opened) {
        store.setState((draft) => {
          setFeedback(
            draft,
            "info",
            "Open Spotify",
            "Spotify will open through the browser or installed app once the device allows external app handoff."
          );
          return draft;
        }, { reason: "spotify-open-fallback" });
      }
      return;
    }

    if (action === "apply-course-search") {
      const searchShell = actionElement.closest("[data-course-search-shell]");
      const searchInput = searchShell?.querySelector('[data-course-search-input]');
      const nextQuery = String(searchInput?.value || "").trim();

      store.setState((draft) => {
        draft.session.roundSetup = {
          ...getRoundSetupState(draft),
          courseQuery: nextQuery,
        };
        return draft;
      }, { reason: "apply-course-search" });
      return;
    }

    if (action === "clear-course-search") {
      store.setState((draft) => {
        draft.session.roundSetup = {
          ...getDefaultRoundSetup(),
        };
        return draft;
      }, { reason: "clear-course-search" });
      return;
    }

    if (action === "select-course") {
      store.setState((draft) => {
        setSelectedCourse(draft, actionElement.dataset.courseId, actionElement.dataset.teeBoxId || "");
        return draft;
      }, { reason: "select-course" });
      return;
    }

    if (action === "clear-selected-course") {
      store.setState((draft) => {
        draft.session.roundSetup = {
          ...getRoundSetupState(draft),
          selectedCourseId: "",
          selectedTeeBoxId: "",
        };
        return draft;
      }, { reason: "clear-selected-course" });
      return;
    }

    if (action === "admin-secret-tap") {
      const now = Date.now();
      adminTapCount = now - adminTapAt > 1400 ? 1 : adminTapCount + 1;
      adminTapAt = now;

      if (adminTapCount < 5) {
        return;
      }

      adminTapCount = 0;
      store.setState((draft) => {
        const result = platform.auth.togglePremiumForTesting(draft);
        if (result.error) {
          draft.auth.notice = "Sign in first, then use the hidden admin toggle again.";
          return draft;
        }
        const account = result.account;

        syncCurrentUserProfile(draft);
        refreshProfileSnapshots(draft);
        appendActivity(draft, `${draft.currentUser.displayName} switched to ${account.subscription.tier} access through the hidden admin toggle.`, "premium");
        setFeedback(
          draft,
          "success",
          "Plan switched",
          `${draft.currentUser.displayName} now has ${account.subscription.tier} access for testing.`
        );
        return draft;
      }, { reason: "admin-secret-toggle" });
      return;
    }

    if (action === "dismiss-feedback") {
      store.setState((draft) => {
        clearFeedback(draft);
        return draft;
      }, { reason: "dismiss-feedback" });
      return;
    }

    if (action === "retry-cloud-save") {
      await retryPendingCloudSave(true);
      return;
    }

    if (action === "select-hole") {
      store.setState((draft) => {
        draft.session.selectedHole = Number(actionElement.dataset.hole);
        return draft;
      }, { reason: "select-hole" });
      return;
    }

    if (action === "step-hole") {
      store.setState((draft) => {
        const current = draft.session.selectedHole;
        const direction = Number(actionElement.dataset.direction);
        draft.session.selectedHole = Math.max(1, Math.min(18, current + direction));
        return draft;
      }, { reason: "step-hole" });
      return;
    }

    if (action === "jump-next-open") {
      store.setState((draft) => {
        draft.session.selectedHole = Number(actionElement.dataset.hole) || draft.session.selectedHole;
        return draft;
      }, { reason: "jump-next-open" });
      return;
    }

    if (action === "quick-score") {
      let pulseParticipantId = null;
      let pulseHoleNumber = null;
      store.setState((draft) => {
        const round = findRound(draft, draft.session.activeRoundId);
        if (!round) {
          return draft;
        }

        const holeNumber = Number(actionElement.dataset.hole);
        const participantId = actionElement.dataset.participantId;
        const strokes = Number(actionElement.dataset.strokes);
        const hole = round.holes.find((item) => item.number === holeNumber);
        if (!hole) {
          return draft;
        }

        pulseParticipantId = participantId;
        pulseHoleNumber = holeNumber;

        const defaultPutts = Math.max(1, Math.min(3, strokes - (hole.par - 2)));
        captureRoundAction(draft, round, {
          holeNumber,
          participantId,
          actionType: "score-set",
          patch: {
          strokes,
          putts: defaultPutts,
          fairwayHit: hole.par > 3 ? strokes <= hole.par : false,
          gir: strokes <= hole.par,
          },
        });
        draft.session.selectedHole = getNextIncompleteHoleNumber(round, participantId, holeNumber);
        appendActivity(draft, `${round.courseName} quick-scored hole ${holeNumber}.`, "round");
        return draft;
      }, { reason: "quick-score" });
      pulseScoreFeedback(pulseParticipantId, pulseHoleNumber);
      requestRealtimeRoundUpdate(store.getState().session.activeRoundId);
      void runPendingRoundSync({ successFeedback: false });
      return;
    }

    if (action === "toggle-flag") {
      store.setState((draft) => {
        const round = findRound(draft, draft.session.activeRoundId);
        if (!round) {
          return draft;
        }

        const holeNumber = Number(actionElement.dataset.hole);
        const participantId = actionElement.dataset.participantId;
        const field = actionElement.dataset.field;
        const hole = round.holes.find((item) => item.number === holeNumber);
        const entry = hole?.entries.find((item) => item.participantId === participantId);
        if (!entry) {
          return draft;
        }

        captureRoundAction(draft, round, {
          holeNumber,
          participantId,
          actionType: "stat-toggle-changed",
          patch: {
            [field]: !entry[field],
          },
        });
        appendActivity(draft, `${round.courseName} updated hole ${holeNumber}.`, "round");
        return draft;
      }, { reason: "toggle-flag" });
      requestRealtimeRoundUpdate(store.getState().session.activeRoundId);
      void runPendingRoundSync({ successFeedback: false });
      return;
    }

    if (action === "finish-round") {
      const currentSync = store.getState().session?.cloudSync || {};
      const requestedRoundId = actionElement.dataset.roundId || null;
      if (currentSync.status === "syncing"
        && currentSync.scope === "round-finish"
        && (currentSync.roundId || null) === requestedRoundId) {
        store.setState((draft) => {
          setFeedback(
            draft,
            "info",
            "Save already in progress",
            "Stay on this screen for a moment while Golfers Nation finishes backing up the round."
          );
          return draft;
        }, { reason: "finish-round-duplicate-blocked" });
        return;
      }

      let completedRoundId = null;
      store.setState((draft) => {
        completedRoundId = finishRound(draft, actionElement.dataset.roundId, platform.data);
        return draft;
      }, { reason: "finish-round" });

      if (completedRoundId && platform.data.flushSyncAsync) {
        await runCloudSave({
          scope: "round-finish",
          roundId: completedRoundId,
          successFeedback: true,
        });
      }
      return;
    }

    if (action === "copy-invite-code") {
      const code = String(actionElement.dataset.code || "").trim().toUpperCase();
      if (!code) {
        store.setState((draft) => {
          setFeedback(draft, "info", "No code yet", "Host the round first, then copy the invite code from here.");
          return draft;
        }, { reason: "copy-invite-code-missing" });
        return;
      }

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(code)
          .then(() => {
            store.setState((draft) => {
              setFeedback(draft, "success", "Invite code copied", `${code} is ready to share with the group.`);
              return draft;
            }, { reason: "copy-invite-code-success" });
          })
          .catch(() => {
            store.setState((draft) => {
              setFeedback(draft, "info", "Share this code", `Copy and share invite code ${code} with the group.`);
              return draft;
            }, { reason: "copy-invite-code-fallback" });
          });
      } else {
        store.setState((draft) => {
          setFeedback(draft, "info", "Share this code", `Copy and share invite code ${code} with the group.`);
          return draft;
        }, { reason: "copy-invite-code-unsupported" });
      }
      return;
    }

    if (action === "host-active-round") {
      let hostedRoundId = null;
      store.setState((draft) => {
        const round = findRound(draft, draft.session.activeRoundId);
        if (!round) {
          setFeedback(draft, "info", "Start a round first", "Create or join a round before trying to host a live room.");
          return draft;
        }

        const hosted = ensureHostedGroupForRound(draft, round);
        appendActivity(
          draft,
          hosted.created
            ? `${round.courseName} is now hosted with invite code ${hosted.group.inviteCode}.`
            : `${round.courseName} is already live with code ${hosted.group.inviteCode}.`,
          "sync"
        );
        setFeedback(
          draft,
          hosted.created ? "success" : "info",
          hosted.created ? "Round hosted" : "Invite code ready",
          hosted.created
            ? `Invite code ${hosted.group.inviteCode} is ready to share.`
            : `This round is already hosted. Share code ${hosted.group.inviteCode} with the group.`
        );
        hostedRoundId = round.id;
        return draft;
      }, { reason: "host-active-round" });
      await finalizeHostedRoundSession(hostedRoundId);
      return;
    }

    if (action === "enable-nearby") {
      const { session } = store.getState();
      const roundId = session.activeRoundId;
      if (!roundId) {
        store.setState((draft) => {
          setFeedback(draft, "info", "No round to sync", "Start or join a round before turning on nearby sync.");
          return draft;
        }, { reason: "enable-nearby-missing-round" });
        return;
      }
      realtimeSession.enableNearbySync(roundId);
      return;
    }

    if (action === "enable-bluetooth") {
      const { session } = store.getState();
      const roundId = session.activeRoundId;
      if (!roundId) {
        store.setState((draft) => {
          setFeedback(draft, "info", "No round to sync", "Start or join a round before testing Bluetooth sync.");
          return draft;
        }, { reason: "enable-bluetooth-missing-round" });
        return;
      }
      await realtimeSession.enableBluetoothSync(roundId);
      return;
    }

    if (action === "view-summary") {
      store.setState((draft) => {
        draft.session.summaryRoundId = actionElement.dataset.roundId;
        setActiveView(draft, "stats", "tab");
        return draft;
      }, { reason: "view-summary" });
      return;
    }

    if (action === "dismiss-summary") {
      store.setState((draft) => {
        draft.session.summaryRoundId = null;
        return draft;
      }, { reason: "dismiss-summary" });
      return;
    }

    if (action === "resume-round") {
      store.setState((draft) => {
        focusRoundView(draft, actionElement.dataset.roundId, draft.currentUser.profileId, setActiveView);
        return draft;
      }, { reason: "resume-round" });
      return;
    }

    if (action === "quick-join-code") {
      const code = actionElement.dataset.code;
      const liveJoinResult = await resolveLiveJoinResult(code, "[Golfers Nation] Live join failed. Checking local-safe fallbacks.");
      store.setState((draft) => {
        const joined = liveJoinResult?.round
          ? liveJoinResult
          : joinByInviteCode({ code, state: draft });
        if (!joined) {
          appendActivity(draft, `Invite code ${code} was not found.`, "sync");
          setFeedback(
            draft,
            liveJoinResult?.error ? "warning" : "error",
            liveJoinResult?.error ? "Live join unavailable" : "Code not found",
            liveJoinResult?.error
              ? describeLiveRoomFailure(liveJoinResult)
              : `Invite code ${code} did not match an active round.`
          );
          return draft;
        }

        applyJoinedRoundState(
          draft,
          joined,
          "Round joined",
          `${joined.round.courseName} is now open and ready for scoring.`
        );
        return draft;
      }, { reason: "quick-join" });
      return;
    }

    if (action === "start-tournament-round") {
      store.setState((draft) => {
        const tournament = draft.tournaments.find((item) => item.id === actionElement.dataset.tournamentId);
        if (!tournament) {
          return draft;
        }

        const round = createRound({
          currentUser: draft.currentUser,
          courseName: tournament.courseName,
          teeBox: "Blue",
          weather: "Tournament setup",
          mode: tournament.mode,
          players: ensureProfilesForNames(draft, [draft.currentUser.name, "Maya Chen", "Theo Grant", "Jordan Wells"]),
          tournamentId: tournament.id,
        });
        draft.rounds.unshift(round);
        tournament.linkedRoundId = round.id;
        tournament.status = "live";
        draft.session.activeRoundId = round.id;
        draft.session.selectedProfileId = draft.currentUser.profileId;
        setActiveView(draft, "round", "focus-round");
        draft.session.selectedHole = 1;
        refreshProfileSnapshots(draft);
        appendActivity(draft, `${tournament.name} launched a linked round at ${round.courseName}.`, "tournament");
        setFeedback(draft, "success", "Tournament round started", `${tournament.name} is now live at ${round.courseName}.`);
        return draft;
      }, { reason: "start-tournament-round" });
      return;
    }

    if (action === "toggle-gear-packed") {
      store.setState((draft) => {
        const item = draft.gear.items.find((gear) => gear.id === actionElement.dataset.gearId);
        if (!item) {
          return draft;
        }

        item.packed = !item.packed;
        appendActivity(draft, `${item.name} marked as ${item.packed ? "packed" : "not packed"}.`, "gear");
        return draft;
      }, { reason: "toggle-gear-packed" });
      return;
    }

    if (action === "select-profile-preview") {
      store.setState((draft) => {
        draft.session.selectedProfileId = actionElement.dataset.profileId || draft.session.selectedProfileId;
        if (actionElement.dataset.previewView) {
          setActiveView(draft, actionElement.dataset.previewView, "tab");
        }
        return draft;
      }, { reason: "select-profile-preview" });
      return;
    }

    if (action === "open-current-profile") {
      store.setState((draft) => {
        draft.session.selectedProfileId = draft.currentUser.profileId;
        setActiveView(draft, "stats", "tab");
        return draft;
      }, { reason: "open-current-profile" });
      return;
    }

    if (action === "set-auth-mode") {
      store.setState((draft) => {
        draft.auth.mode = actionElement.dataset.mode || "login";
        draft.auth.error = "";
        draft.auth.notice = "";
        return draft;
      }, { reason: "set-auth-mode" });
      return;
    }

    if (action === "use-review-account") {
      store.setState((draft) => {
        if (draft.auth.activeUserId) {
          platform.data.saveWorkspace(draft, draft.auth.activeUserId);
        }

        const accountId = actionElement.dataset.userId;
        const result = platform.auth.useReviewAccount(draft, accountId);
        if (result.error) {
          draft.auth.error = result.error;
          return draft;
        }

        appendActivity(draft, `${draft.currentUser.displayName} signed in through review access.`, "profile");
        setFeedback(
          draft,
          "success",
          "Signed in",
          `${draft.currentUser.displayName} is ready with ${draft.currentUser.subscription?.tier === "premium" ? "premium" : "free"} access.`
        );
        return draft;
      }, { reason: "use-review-account" });
      return;
    }

    if (action === "continue-provider-login") {
      store.setState((draft) => {
        if (draft.auth.activeUserId) {
          platform.data.saveWorkspace(draft, draft.auth.activeUserId);
        }

        const result = platform.auth.signInWithProvider(draft, actionElement.dataset.provider);
        if (result.error) {
          draft.auth.error = result.error;
          return draft;
        }

        appendActivity(draft, `${draft.currentUser.displayName} signed in with ${result.account.provider}.`, "profile");
        setFeedback(draft, "success", "Signed in", `${draft.currentUser.displayName} entered through ${result.account.provider}.`);
        return draft;
      }, { reason: "continue-provider-login" });
      return;
    }

    if (action === "sign-out") {
      if (platform.auth.signOutAsync) {
        await handleAsyncSignOut();
        return;
      }

      store.setState((draft) => {
        clearFeedback(draft);
        platform.auth.signOut(draft);
        return draft;
      }, { reason: "sign-out" });
      return;
    }

    if (action === "prompt-install") {
      store.setState((draft) => {
        draft.session.pendingLabel = "Opening your install prompt...";
        return draft;
      }, { reason: "prompt-install-pending" });
      if (deferredInstallPrompt) {
        await deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice.catch(() => null);
        deferredInstallPrompt = null;
        store.setState((draft) => {
          draft.session.installHintDismissed = Boolean(choice && choice.outcome === "dismissed");
          if (choice?.outcome === "accepted") {
            appendActivity(draft, "Install started from the in-app prompt.", "product");
            setFeedback(draft, "success", "Install started", "Use your browser or phone prompt to finish adding Golfers Nation to your home screen.");
          } else {
            draft.session.pendingLabel = "";
          }
          return draft;
        }, { reason: "prompt-install" });
        syncInstallState();
        return;
      }

      store.setState((draft) => {
        draft.session.installHintDismissed = false;
        draft.session.pendingLabel = "";
        return draft;
      }, { reason: "prompt-install-fallback" });
      return;
    }

    if (action === "dismiss-install-card") {
      store.setState((draft) => {
        draft.session.installHintDismissed = true;
        draft.session.pendingLabel = "";
        return draft;
      }, { reason: "dismiss-install-card" });
      return;
    }

    if (action === "refresh-app") {
      store.setState((draft) => {
        draft.session.pendingLabel = "Checking for the latest build and refreshing this phone...";
        setFeedback(
          draft,
          "info",
          "Refreshing app",
          "Golfers Nation will clear the cached app shell and reopen with the newest deployed build."
        );
        return draft;
      }, { reason: "refresh-app-pending" });

      try {
        await refreshAppBuild({
          locationRef,
          serviceWorkerContainer: typeof navigator !== "undefined" ? navigator.serviceWorker : null,
        });
      } catch (error) {
        console.warn("[Golfers Nation] App refresh failed.", error);
        store.setState((draft) => {
          draft.session.pendingLabel = "";
          setFeedback(
            draft,
            "warning",
            "Refresh didn't complete",
            "Close and reopen the app once, or reinstall the home-screen app if it still looks old."
          );
          return draft;
        }, { reason: "refresh-app-error" });
      }
      return;
    }

    if (action === "invite-friends") {
      store.setState((draft) => {
        setFeedback(
          draft,
          "success",
          "Invite flow ready",
          "Invite-code rounds are the current friend path. Start or host a round, then share the code with your group."
        );
        return draft;
      }, { reason: "invite-friends" });
      return;
    }

    if (action === "share-profile-placeholder") {
      store.setState((draft) => {
        if (draft.currentUser.social?.allowProfileSharing === false) {
          setFeedback(draft, "info", "Profile sharing is off", "Turn on profile sharing in Social settings first if you want this account to share a public player card.");
          return draft;
        }

        setFeedback(
          draft,
          "success",
          "Profile share scaffold",
          `${draft.currentUser.displayName}'s public player card is ready for future share links and in-app profile sends.`
        );
        return draft;
      }, { reason: "share-profile-placeholder" });
      return;
    }

    if (action === "share-round-summary-placeholder") {
      store.setState((draft) => {
        if (draft.currentUser.social?.allowRoundSharing === false) {
          setFeedback(draft, "info", "Round sharing is off", "Turn on round sharing in Social settings first if you want to share finished round summaries.");
          return draft;
        }

        const completedRound = draft.rounds.find((round) => round.id === draft.session.summaryRoundId)
          || draft.rounds.find((round) => round.status === "completed");

        if (!completedRound) {
          setFeedback(draft, "info", "Finish a round first", "Round summary sharing becomes useful after you finish at least one round on this account.");
          return draft;
        }

        setFeedback(
          draft,
          "success",
          "Round summary ready",
          `${completedRound.courseName} is ready for future sharing links and mobile share sheets.`
        );
        return draft;
      }, { reason: "share-round-summary-placeholder" });
      return;
    }

    if (action === "show-policy-placeholder") {
      const docLabel = actionElement.dataset.doc === "terms" ? "Terms of Service" : "Privacy Policy";
      store.setState((draft) => {
        setFeedback(
          draft,
          "info",
          docLabel,
          `${docLabel} is scaffolded for production submission. Replace this placeholder with the hosted legal document when launch materials are ready.`
        );
        return draft;
      }, { reason: "show-policy-placeholder" });
      return;
    }

    if (action === "contact-support-placeholder") {
      store.setState((draft) => {
        setFeedback(
          draft,
          "info",
          "Support placeholder",
          "Support will route through a real help email or ticket flow in production. For now, use Help Center and demo accounts for testing."
        );
        return draft;
      }, { reason: "contact-support-placeholder" });
      return;
    }

    if (action === "reset-local-data") {
      try {
        availableStorage?.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn("[Golfers Nation] Failed to reset local app data.", error);
      }

      renderStartupShell(root, "Resetting local app data and reopening Golfers Nation.");
      if (locationRef && typeof locationRef.reload === "function") {
        locationRef.reload();
      }
      return;
    }
  });

  root.addEventListener("change", (event) => {
    const appearanceInput = event.target.closest('[data-appearance-input]');
    if (appearanceInput) {
      previewAppearanceFromForm(appearanceInput.form);
      return;
    }

    const courseTeeInput = event.target.closest("[data-course-tee-select]");
    if (courseTeeInput) {
      store.setState((draft) => {
        draft.session.roundSetup = {
          ...getRoundSetupState(draft),
          selectedTeeBoxId: String(courseTeeInput.value || ""),
        };
        return draft;
      }, { reason: "select-course-tee" });
      return;
    }

    const input = event.target.closest("[data-score-field]");
    if (!input) {
      return;
    }

    const participantId = input.dataset.participantId;
    const holeNumber = Number(input.dataset.hole);
    store.setState((draft) => {
      const round = findRound(draft, draft.session.activeRoundId);
      if (!round) {
        return draft;
      }

      captureRoundAction(draft, round, {
        holeNumber,
        participantId,
        patch: {
          [input.dataset.scoreField]: input.value === "" ? null : Number(input.value),
        },
      });
      round.sync.lastEventAt = Date.now();
      return draft;
    }, { reason: "score-change" });
    pulseScoreFeedback(participantId, holeNumber);
    requestRealtimeRoundUpdate(store.getState().session.activeRoundId);
    void runPendingRoundSync({ successFeedback: false });
  });

  root.addEventListener("input", (event) => {
    const courseSearchInput = event.target.closest("[data-course-search-input]");
    if (!courseSearchInput) {
      return;
    }

    store.setState((draft) => {
      draft.session.roundSetup = {
        ...getRoundSetupState(draft),
        courseQuery: String(courseSearchInput.value || "").trim(),
      };
      return draft;
    }, { reason: "course-search-input" });
  });

  root.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-form]");
    if (!form) {
      return;
    }

    event.preventDefault();
    const data = new FormData(form);
    const formName = form.dataset.form;

    if (formName === "auth-signup") {
      if (platform.auth.signUpWithEmailAsync && platform.auth.commitAuthResult) {
        await handleAsyncEmailSignUp(form, data);
        return;
      }

      store.setState((draft) => {
        const result = platform.auth.signUpWithEmail(draft, {
          displayName: data.get("displayName"),
          email: data.get("email"),
          password: data.get("password"),
        });

        if (result.error) {
          draft.auth.error = result.error;
          draft.auth.notice = "";
          return draft;
        }

        draft.auth.mode = "login";
        draft.auth.notice = `${draft.currentUser.displayName} created an account and entered the app.`;
        appendActivity(draft, `${draft.currentUser.displayName} created a new email account.`, "profile");
        setFeedback(
          draft,
          "success",
          "Account created",
          `${draft.currentUser.displayName} is signed in with premium tester access, and Golden Nugget is ready as the easiest first course.`
        );
        return draft;
      }, { reason: "auth-signup" });
      form.reset();
      return;
    }

    if (formName === "auth-login") {
      if (platform.auth.signInWithEmailAsync && platform.auth.commitAuthResult) {
        await handleAsyncEmailLogin(form, data);
        return;
      }

      store.setState((draft) => {
        if (draft.auth.activeUserId) {
          platform.data.saveWorkspace(draft, draft.auth.activeUserId);
        }

        const result = platform.auth.signInWithEmail(draft, {
          email: data.get("email"),
          password: data.get("password"),
        });

        if (result.error) {
          draft.auth.error = result.error;
          draft.auth.notice = "";
          return draft;
        }

        appendActivity(draft, `${draft.currentUser.displayName} signed in with email.`, "profile");
        setFeedback(
          draft,
          "success",
          "Welcome back",
          `${draft.currentUser.displayName}'s rounds, settings, and saved course history are restored for this account.`
        );
        return draft;
      }, { reason: "auth-login" });
      form.reset();
      return;
    }

    if (formName === "auth-password-reset") {
      if (platform.auth.requestPasswordResetAsync) {
        await handlePasswordReset(form, data);
        return;
      }

      store.setState((draft) => {
        setFeedback(draft, "info", "Password reset placeholder", "Password reset email will be available when cloud auth is connected.");
        return draft;
      }, { reason: "auth-password-reset-placeholder" });
      form.reset();
      return;
    }

    if (formName === "save-account-settings") {
      store.setState((draft) => {
        const nextDisplayName = String(data.get("displayName") || "").trim() || draft.currentUser.displayName || draft.currentUser.name;
        const nextEmail = String(data.get("email") || "").trim().toLowerCase() || draft.currentUser.email;
        const conflictingAccount = draft.accounts.find((account) => account.email === nextEmail && account.id !== draft.currentUser.id);

        if (conflictingAccount) {
          setFeedback(draft, "error", "Email already in use", "That email is already attached to another golfer account on this device.");
          return draft;
        }

        const previousName = draft.currentUser.name;
        draft.currentUser.name = nextDisplayName;
        draft.currentUser.displayName = nextDisplayName;
        draft.currentUser.username = normalizeUsernameInput(data.get("username"), nextDisplayName);
        draft.currentUser.email = nextEmail;
        draft.currentUser.avatarLabel = normalizeAvatarLabel(data.get("avatarLabel"), nextDisplayName);

        syncIdentityAcrossRecords(draft);
        syncCurrentUserProfile(draft);
        refreshProfileSnapshots(draft);

        if (previousName !== draft.currentUser.name) {
          appendActivity(draft, `Account identity updated from ${previousName} to ${draft.currentUser.name}.`, "profile");
        }

        appendActivity(draft, `${draft.currentUser.name}'s account settings were updated.`, "profile");
        setFeedback(draft, "success", "Account saved", "Display name, username, email, and avatar are updated for this golfer.");
        return draft;
      }, { reason: "save-account-settings" });
      return;
    }

    if (formName === "change-password-settings") {
      store.setState((draft) => {
        const account = draft.accounts.find((entry) => entry.id === draft.currentUser.id);
        const provider = draft.currentUser.providerType || draft.currentUser.provider || "email";
        if (!account || provider !== "email") {
          setFeedback(draft, "info", "Password managed by provider", `${provider} sign-in accounts will use the real provider flow when backend auth is connected.`);
          return draft;
        }

        const currentPassword = String(data.get("currentPassword") || "");
        const newPassword = String(data.get("newPassword") || "");
        const confirmPassword = String(data.get("confirmPassword") || "");

        if (!currentPassword || !newPassword || !confirmPassword) {
          setFeedback(draft, "info", "Complete all password fields", "Enter the current password plus the new password twice to update it.");
          return draft;
        }

        if (account.password !== currentPassword) {
          setFeedback(draft, "error", "Current password is incorrect", "The current password did not match this email account.");
          return draft;
        }

        if (newPassword.length < 6) {
          setFeedback(draft, "error", "Choose a stronger password", "Use at least 6 characters for the new password in this local test build.");
          return draft;
        }

        if (newPassword !== confirmPassword) {
          setFeedback(draft, "error", "Passwords do not match", "Make sure the new password and confirmation match exactly.");
          return draft;
        }

        account.password = newPassword;
        appendActivity(draft, `${draft.currentUser.displayName} updated the local password scaffold.`, "profile");
        setFeedback(draft, "success", "Password updated", "The email password scaffold has been updated for this golfer on this device.");
        return draft;
      }, { reason: "change-password-settings" });
      form.reset();
      return;
    }

    if (formName === "save-golf-profile") {
      store.setState((draft) => {
        const handicapValue = String(data.get("handicap") || "").trim();
        draft.currentUser.homeCourse = String(data.get("homeCourse") || "").trim() || "";
        draft.currentUser.handicap = handicapValue === "" || Number.isNaN(Number(handicapValue))
          ? null
          : Number(handicapValue);
        draft.currentUser.handedness = String(data.get("handedness") || "").trim();
        draft.currentUser.bio = String(data.get("bio") || "").trim();
        draft.currentUser.privacy = {
          ...(draft.currentUser.privacy || {}),
          profileVisibility: String(data.get("profileVisibility") || "friends"),
          showHomeCourse: data.get("showHomeCourse") === "on",
          showHandicap: data.get("showHandicap") === "on",
          showBio: data.get("showBio") === "on",
          showRecentForm: data.get("showRecentForm") === "on",
          showHeadToHead: data.get("showHeadToHead") === "on",
        };

        syncCurrentUserProfile(draft);
        refreshProfileSnapshots(draft);
        appendActivity(draft, `${draft.currentUser.displayName}'s golf profile was updated.`, "profile");
        setFeedback(draft, "success", "Golf profile saved", "Home course, handicap, bio, handedness, and visibility are updated.");
        return draft;
      }, { reason: "save-golf-profile" });
      return;
    }

    if (formName === "save-appearance-settings") {
      store.setState((draft) => {
        draft.currentUser.appearance = {
          ...(draft.currentUser.appearance || {}),
          colorMode: String(data.get("colorMode") || "system"),
          themeId: String(data.get("themeId") || "forest"),
          textScale: String(data.get("textScale") || "standard"),
          compactMode: data.get("compactMode") === "on",
          contrastMode: data.get("contrastMode") === "high" ? "high" : "standard",
        };
        appendActivity(draft, `${draft.currentUser.displayName} updated appearance preferences.`, "product");
        setFeedback(draft, "success", "Appearance saved", "Theme and appearance mode now follow this golfer account.");
        return draft;
      }, { reason: "save-appearance-settings" });
      return;
    }

    if (formName === "save-social-settings") {
      store.setState((draft) => {
        draft.currentUser.social = {
          ...(draft.currentUser.social || {}),
          handles: {
            ...(draft.currentUser.social?.handles || {}),
            instagram: String(data.get("instagram") || "").trim(),
            x: String(data.get("x") || "").trim(),
            ghin: String(data.get("ghin") || "").trim(),
          },
          allowFriendConnections: data.get("allowFriendConnections") === "on",
          allowProfileSharing: data.get("allowProfileSharing") === "on",
          allowRoundSharing: data.get("allowRoundSharing") === "on",
        };
        appendActivity(draft, `${draft.currentUser.displayName} updated social settings.`, "profile");
        setFeedback(draft, "success", "Social settings saved", "Invite, sharing, and handle preferences are saved for this golfer.");
        return draft;
      }, { reason: "save-social-settings" });
      return;
    }

    if (formName === "submit-tester-feedback") {
      const currentState = store.getState();
      const payload = {
        testerName: String(data.get("testerName") || currentState.currentUser?.displayName || "").trim(),
        email: String(data.get("email") || currentState.currentUser?.email || "").trim(),
        feedbackArea: String(data.get("feedbackArea") || "other"),
        rating: String(data.get("rating") || "3"),
        feedbackMessage: String(data.get("feedbackMessage") || "").trim(),
        appVersion: String(data.get("appVersion") || APP_VERSION),
        planTier: String(data.get("planTier") || currentState.currentUser?.subscription?.tier || "free"),
        installState: String(data.get("installState") || currentState.session?.installState || "browser"),
        appearanceMode: String(data.get("appearanceMode") || currentState.currentUser?.appearance?.colorMode || "system"),
        themeId: String(data.get("themeId") || currentState.currentUser?.appearance?.themeId || "forest"),
        contextView: String(data.get("contextView") || currentState.session?.settingsReturnView || currentState.session?.activeView || "settings"),
        recentActivity: String(data.get("recentActivity") || ""),
        userAgent: String(data.get("userAgent") || (typeof navigator === "undefined" ? "" : navigator.userAgent || "")),
      };

      if (!payload.feedbackMessage) {
        store.setState((draft) => {
          setFeedback(draft, "info", "Add a quick note", "Type a short message so the tester feedback has something useful to review.");
          return draft;
        }, { reason: "submit-tester-feedback-empty" });
        return;
      }

      store.setState((draft) => {
        draft.session.pendingLabel = "Sending tester feedback...";
        return draft;
      }, { reason: "submit-tester-feedback-pending" });

      if (!platform.data.submitTesterFeedbackAsync) {
        store.setState((draft) => {
          setFeedback(draft, "info", "Feedback unavailable", "Tester feedback needs the cloud connection to be active before notes can be sent from the app.");
          return draft;
        }, { reason: "submit-tester-feedback-unavailable" });
        return;
      }

      platform.data.submitTesterFeedbackAsync(currentState, payload)
        .then((result) => {
          if (result?.error) {
            throw result.error;
          }

          store.setState((draft) => {
            appendActivity(draft, `Tester feedback was sent from ${payload.contextView}.`, "product");
            setFeedback(draft, "success", "Feedback sent", "Thanks. Your note was saved for the Golfers Nation team to review.");
            return draft;
          }, { reason: "submit-tester-feedback-success" });
          form.reset();
        })
        .catch((error) => {
          console.warn("[Golfers Nation] Tester feedback submission failed.", error);
          store.setState((draft) => {
            const message = typeof error?.message === "string" && error.message
              ? error.message
              : "The feedback note could not upload right now. Try again when the connection is stronger.";
            setFeedback(draft, "warning", "Feedback not sent", message);
            return draft;
          }, { reason: "submit-tester-feedback-error" });
        });
      return;
    }

    if (formName === "create-round") {
      const submitter = event.submitter;
      const intent = submitter?.value || "local";
      let hostedRoundId = null;

      store.setState((draft) => {
        const roundSetup = getRoundSetupState(draft);
        const playerSetup = parsePlayers(String(data.get("players") || ""), draft.currentUser.name);
        const playerProfiles = ensureProfilesForNames(
          draft,
          playerSetup.names
        );
        const selectedCourseId = String(roundSetup.selectedCourseId || data.get("selectedCourseId") || "");
        const selectedTeeBoxId = String(roundSetup.selectedTeeBoxId || data.get("selectedTeeBoxId") || "");
        const selectedCourse = createRoundCourseSelection(
          selectedCourseId,
          selectedTeeBoxId
        );
        const manualCourse = createManualCourseSelection(
          String(data.get("courseName") || "").trim(),
          String(data.get("teeBox") || "").trim()
        );
        const courseSelection = selectedCourse || manualCourse;
        const round = createRound({
          currentUser: draft.currentUser,
          courseId: courseSelection.courseId,
          courseName: courseSelection.courseName,
          courseCity: courseSelection.city,
          courseState: courseSelection.state,
          courseRegion: courseSelection.region,
          courseLatitude: courseSelection.latitude,
          courseLongitude: courseSelection.longitude,
          courseSource: courseSelection.source,
          courseSeeded: courseSelection.seeded,
          courseMetadata: {
            aliases: courseSelection.aliases || [],
            keywords: courseSelection.keywords || [],
            featured: Boolean(courseSelection.featured),
            featuredNote: courseSelection.featuredNote || "",
            architect: courseSelection.architect || "",
            opened: courseSelection.opened ?? null,
            courseType: courseSelection.courseType || "",
            teeCount: courseSelection.teeCount || 0,
          },
          teeBox: courseSelection.teeBoxName,
          teeBoxId: courseSelection.teeBoxId,
          courseRating: courseSelection.rating,
          courseSlope: courseSelection.slope,
          holesTemplate: courseSelection.holes,
          weather: String(data.get("weather") || "").trim(),
          mode: String(data.get("mode") || "stroke"),
          players: playerProfiles,
          syncTransport: intent === "host" ? "invite" : "local",
        });

        draft.rounds.unshift(round);
        focusRoundView(draft, round.id, draft.currentUser.profileId, setActiveView);
        appendActivity(draft, `${round.courseName} started in ${round.mode} mode.`, "round");
        setFeedback(
          draft,
          "success",
          intent === "host" ? "Round hosted" : "Round started",
          intent === "host"
            ? `${round.courseName} is ready. Share the invite code from the round screen when the group is ready.${playerSetup.note ? ` ${playerSetup.note}` : ""}`
            : `${round.courseName} is ready for live scoring, and only this golfer's score entry opens by default.${playerSetup.note ? ` ${playerSetup.note}` : ""}`
        );

        if (intent === "host") {
          const hosted = ensureHostedGroupForRound(draft, round);
          appendActivity(draft, `${round.courseName} hosted with code ${hosted.group.inviteCode}.`, "sync");
          setFeedback(
            draft,
            "success",
            "Round hosted",
            `Invite code ${hosted.group.inviteCode} is ready to share from the round screen.${playerSetup.note ? ` ${playerSetup.note}` : ""}`
          );
          hostedRoundId = round.id;
        }

        if (playerSetup.note) {
          appendActivity(draft, playerSetup.note, "round");
        }

        resetRoundSetup(draft);
        refreshProfileSnapshots(draft);
        return draft;
      }, { reason: "create-round" });
      if (intent === "host") {
        await finalizeHostedRoundSession(hostedRoundId);
      }
      return;
    }

    if (formName === "join-code") {
      const code = String(data.get("inviteCode") || "").trim().toUpperCase();
      if (!code) {
        store.setState((draft) => {
          setFeedback(draft, "info", "Enter an invite code", "Ask the host for the round code, then enter it here to join the same live card.");
          return draft;
        }, { reason: "join-code-empty" });
        return;
      }

      const liveJoinResult = await resolveLiveJoinResult(code, "[Golfers Nation] Live join failed. Keeping the join flow in local-safe mode.");
      store.setState((draft) => {
        const joined = liveJoinResult?.round
          ? liveJoinResult
          : joinByInviteCode({ code, state: draft });
        if (!joined) {
          appendActivity(draft, `Invite code ${code || "blank"} did not match a game.`, "sync");
          setFeedback(
            draft,
            liveJoinResult?.error ? "warning" : "error",
            liveJoinResult?.error ? "Live join unavailable" : "Couldn't join round",
            liveJoinResult?.error
              ? describeLiveRoomFailure(liveJoinResult)
              : "Check the invite code and try again."
          );
          return draft;
        }

        applyJoinedRoundState(
          draft,
          joined,
          "Joined round",
          `${joined.round.courseName} is ready. Your own score entry is open first, and the rest of the group stays visible underneath.`
        );
        return draft;
      }, { reason: "join-code" });
      form.reset();
      return;
    }

    if (formName === "save-profile") {
      store.setState((draft) => {
        const previousName = draft.currentUser.name;
        const handicapValue = String(data.get("handicap") || "").trim();
        draft.currentUser.name = String(data.get("name") || "").trim() || draft.currentUser.name;
        draft.currentUser.displayName = draft.currentUser.name;
        draft.currentUser.username = String(data.get("username") || "").trim() || draft.currentUser.username;
        draft.currentUser.email = String(data.get("email") || "").trim() || draft.currentUser.email;
        draft.currentUser.avatarLabel = String(data.get("avatarLabel") || "").trim() || draft.currentUser.avatarLabel;
        draft.currentUser.homeCourse = String(data.get("homeCourse") || "").trim() || draft.currentUser.homeCourse;
        draft.currentUser.handicap = handicapValue === "" || Number.isNaN(Number(handicapValue))
          ? null
          : Number(handicapValue);
        draft.currentUser.bio = String(data.get("bio") || "").trim() || draft.currentUser.bio;
        draft.currentUser.city = String(data.get("city") || "").trim() || draft.currentUser.city;
        draft.currentUser.seasonGoal = String(data.get("seasonGoal") || "").trim() || draft.currentUser.seasonGoal;
        draft.currentUser.privacy = {
          ...(draft.currentUser.privacy || {}),
          showHomeCourse: data.get("showHomeCourse") === "on",
          showHandicap: data.get("showHandicap") === "on",
          showBio: data.get("showBio") === "on",
          showRecentForm: data.get("showRecentForm") === "on",
          showHeadToHead: data.get("showHeadToHead") === "on",
        };

        draft.rounds.forEach((round) => {
          round.players.forEach((player) => {
            if (player.userId === draft.currentUser.id || player.profileId === draft.currentUser.profileId) {
              player.name = draft.currentUser.name;
              player.username = draft.currentUser.username;
              player.avatarLabel = draft.currentUser.avatarLabel;
            }
          });

          round.sides.forEach((side) => {
            side.playerNames = side.playerIds.map((playerId) => {
              const player = round.players.find((item) => item.id === playerId);
              return player ? player.name : "";
            });
          });
        });

        draft.groups.forEach((group) => {
          group.members.forEach((member) => {
            if (member.userId === draft.currentUser.id || member.profileId === draft.currentUser.profileId) {
              member.displayName = draft.currentUser.name;
              member.username = draft.currentUser.username;
              member.avatarLabel = draft.currentUser.avatarLabel;
            }
          });
        });

        syncCurrentUserProfile(draft);
        refreshProfileSnapshots(draft);

        if (previousName !== draft.currentUser.name) {
          appendActivity(draft, `Profile identity updated from ${previousName} to ${draft.currentUser.name}.`, "profile");
        }

        appendActivity(draft, `${draft.currentUser.name}'s profile was updated.`, "profile");
        setFeedback(draft, "success", "Profile saved", "Your player profile, privacy settings, and public card are updated.");
        return draft;
      }, { reason: "save-profile" });
      return;
    }

    if (formName === "create-tournament") {
      store.setState((draft) => {
        draft.tournaments.unshift(
          createTournament({
            name: String(data.get("name") || "").trim(),
            courseName: String(data.get("courseName") || "").trim(),
            date: new Date(String(data.get("date"))).toISOString(),
            mode: String(data.get("mode") || "stroke"),
            fieldSize: Number(data.get("fieldSize") || 16),
            status: "planning",
          })
        );
        appendActivity(draft, `Tournament ${String(data.get("name") || "").trim()} was created.`, "tournament");
        setFeedback(draft, "success", "Tournament created", `${String(data.get("name") || "").trim()} is ready in Community.`);
        return draft;
      }, { reason: "create-tournament" });
      form.reset();
      return;
    }

    if (formName === "add-gear") {
      store.setState((draft) => {
        draft.gear.items.unshift(
          createGearItem({
            category: String(data.get("category") || "accessory"),
            name: String(data.get("name") || "").trim(),
            notes: String(data.get("notes") || "").trim(),
            weatherUse: String(data.get("weatherUse") || "").trim(),
          })
        );
        appendActivity(draft, `${String(data.get("name") || "").trim()} added to gear inventory.`, "gear");
        setFeedback(draft, "success", "Gear saved", `${String(data.get("name") || "").trim()} was added to this golfer's kit.`);
        return draft;
      }, { reason: "add-gear" });
      form.reset();
    }
  });

  if (typeof window !== "undefined") {
    const handleBeforeUnload = (event) => {
      const cloudSync = store.getState().session?.cloudSync || {};
      if (["syncing", "failed"].includes(cloudSync.status) || hasPendingRoundSyncForUser(store.getState())) {
        event.preventDefault();
        event.returnValue = "";
      }
      cleanupRuntime();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    removeBeforeUnload = () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      removeAppearanceListener();
    };
  }

  return {
    status: "ready",
    store,
    platform,
    destroy() {
      removeBeforeUnload();
      removeAppearanceListener();
      clearBootGuards();
      cleanupRuntime();
    },
  };
}
function startApp(options = {}) {
  if (typeof document === "undefined") {
    return { status: "no-document" };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      bootstrapApp(options);
    }, { once: true });
    return { status: "waiting-for-dom" };
  }

  return bootstrapApp(options);
}

startApp();
})();
