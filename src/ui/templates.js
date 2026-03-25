import {
  APPEARANCE_MODE_OPTIONS,
  APP_VERSION,
  CONNECTION_COPY,
  GAME_MODES,
  GEAR_CATEGORIES,
  PREMIUM_MODE_IDS,
  PROFILE_VISIBILITY_OPTIONS,
  PRIVACY_CONTROL_OPTIONS,
  TEXT_SCALE_OPTIONS,
  SUBSCRIPTION_PLANS,
  TESTER_FEEDBACK_AREAS,
  THEME_PRESET_OPTIONS,
  VIEW_ORDER,
} from "../config.js";
import {
  getFrequentPartners,
  getHistoryMetrics,
  getParticipantTotals,
  getRoundSummary,
  getScoringParticipants,
} from "../domain/scoring.js";
import { getPendingRoundEvents } from "../domain/round-sync.js";
import { escapeHtml, formatDate, formatDateTime, formatRelativeSync } from "../utils/formatters.js";
import { getGearRecommendations } from "../services/mock-api.js";
import { getNearbyDiscoveryState } from "../services/nearby-detection-service.js";
import { getReviewAccounts } from "../services/account-service.js";
import {
  buildManualRoundTemplate,
  getDefaultCourseTeeBox,
  getRoundSetupDiscoveryState,
} from "../services/course-service.js";
import { buildCompetitivePreview, buildPlayerComparison, getCurrentProfile, getProfileById, getProfileForPlayer } from "../services/player-service.js";
import { renderSpotifySettingsPanel } from "./spotify-controls.js";

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

function getRoundSummaryForState(state, round) {
  return getRoundSummary(round, state.currentUser.id, {
    friendProfileIds: state.currentUser?.social?.friendProfileIds || [],
    followedProfileIds: state.currentUser?.social?.followedProfileIds || [],
  });
}

const PROFILE_SETTINGS_SECTIONS = [
  { id: "profile-identity", label: "Identity" },
  { id: "golf-profile", label: "Golf Profile" },
  { id: "social", label: "Social" },
];

const APP_SETTINGS_SECTIONS = [
  { id: "account", label: "Account" },
  { id: "appearance", label: "Appearance" },
  { id: "integrations", label: "Integrations" },
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
  settings: `
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 3.75v2.1" />
      <path d="M12 18.15v2.1" />
      <path d="m5.7 5.7 1.5 1.5" />
      <path d="m16.8 16.8 1.5 1.5" />
      <path d="M3.75 12h2.1" />
      <path d="M18.15 12h2.1" />
      <path d="m5.7 18.3 1.5-1.5" />
      <path d="m16.8 7.2 1.5-1.5" />
    </svg>
  `,
  premium: `
    <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
      <path d="m5 16 2-8 5 5 5-7 2 10H5Z" />
      <path d="M7 19h10" />
    </svg>
  `,
};

const PRIMARY_NAV_TABS = [
  { id: "home", label: "Play", iconId: "home" },
  { id: "round", label: "Score", iconId: "round" },
  { id: "community", label: "Community", iconId: "community" },
  { id: "settings", label: "Profile", iconId: "settings" },
];

function getActiveRound(state) {
  return (state?.rounds || []).find((round) => round.id === state?.session?.activeRoundId) || null;
}

function getSummaryRound(state) {
  return (state?.rounds || []).find((round) => round.id === state?.session?.summaryRoundId) || null;
}

function getActiveGroup(state, round) {
  if (!round) {
    return null;
  }

  return (state?.groups || []).find((group) => group.roundId === round.id) || null;
}

function getCompletedRounds(state) {
  return (state?.rounds || [])
    .filter((round) => round.status === "completed")
    .sort((left, right) => (right.completedAt || 0) - (left.completedAt || 0));
}

function getSubscription(state) {
  return state?.currentUser?.subscription || {
    tier: "free",
    planName: "Free",
    status: "active",
    billingReady: true,
  };
}

function getGameModeLabel(modeId = "stroke") {
  return GAME_MODES[modeId]?.label || GAME_MODES.stroke.label;
}

function getNavActiveView(state) {
  const activeView = state?.session?.activeView || "home";

  if (PRIMARY_NAV_TABS.some((view) => view.id === activeView)) {
    return activeView;
  }

  if (["settings", "stats", "premium"].includes(activeView)) {
    return "settings";
  }

  if (activeView === "help") {
    const fallback = state?.session?.helpReturnView || state?.session?.previousView || "home";
    if (fallback === "auth") {
      return "home";
    }
    return PRIMARY_NAV_TABS.some((view) => view.id === fallback) ? fallback : "settings";
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

export function isModeLocked(modeId, subscription) {
  return PREMIUM_MODE_IDS.includes(modeId) && !isPremiumSubscription(subscription);
}

export function getFeatureGate(featureId, subscription) {
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

export function getNextOpenHole(round, selectedHole = 1) {
  if (!round?.holes?.length) {
    return selectedHole;
  }

  const afterSelected = round.holes.slice(selectedHole).concat(round.holes.slice(0, selectedHole));
  const nextHole = afterSelected.find((hole) => hole.entries.some((entry) => entry.strokes === null || entry.strokes === 0));

  return nextHole ? nextHole.number : selectedHole;
}

export function getSyncPresentation(round, group) {
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
      title: "Saved on this phone",
      message: `${pendingCount === 1 ? "1 change is" : `${pendingCount} changes are`} safe here. Retry when the connection settles.`,
    };
  }

  if (saveState === "syncing") {
    return {
      tone: "success",
      title: "Reconnecting",
      message: "Your scores are safe here while the shared round catches up.",
    };
  }

  if (transport === "local") {
    return {
      tone: "quiet",
      title: "Not connected",
      message: inviteCode
        ? `Code ${inviteCode} is ready when players are ready to join.`
        : "Start hosting when you want to share this round.",
    };
  }

  if (stale) {
    return {
      tone: "warning",
      title: "Reconnecting",
      message: `Trying to reconnect${inviteCode ? ` with code ${inviteCode}` : ""}.`,
    };
  }

  if (stateLabel === "hosting") {
    return {
      tone: "success",
      title: "Waiting for players",
      message: `Share code ${inviteCode || "pending"} to bring golfers in.`,
    };
  }

  if (stateLabel === "connected") {
    return {
      tone: "success",
      title: "Connected",
      message: "Shared scoring is live right now.",
    };
  }

  return {
    tone: "quiet",
    title: "Not connected",
    message: "This round is ready when you want to share it.",
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
  return PRIMARY_NAV_TABS.map((view) => {
    const isActive = navActiveView === view.id;
    const activeClass = isActive ? "is-active active" : "";
    const tabId = view.id === "home"
      ? "play"
      : view.id === "round"
        ? "score"
        : view.id === "community"
          ? "community"
          : "profile";
    const currentAttr = isActive ? 'aria-current="page"' : "";
    const selectedAttr = isActive ? "true" : "false";
    return `
      <button
        id="tab-${view.id}"
        class="nav-item nav-btn ${activeClass}"
        data-action="nav-view"
        data-view="${view.id}"
        data-tab="${tabId}"
        type="button"
        role="tab"
        aria-selected="${selectedAttr}"
        aria-controls="app-screen-panel"
        aria-label="${escapeHtml(view.label)}"
        ${currentAttr}
      >
        <span class="nav-icon">${NAV_ICONS[view.iconId] || ""}</span>
        <strong class="nav-label">${escapeHtml(view.label)}</strong>
        <span class="nav-indicator" aria-hidden="true"></span>
      </button>
    `;
  }).join("");
}

function renderAppMenu(state) {
  return `
    <div
      class="app-menu-panel"
      data-app-menu="true"
      data-app-menu-panel="true"
      role="menu"
      aria-label="App menu"
      ${state.session?.appMenuOpen ? "" : "hidden"}
    >
      <button class="app-menu-item" type="button" data-action="open-help-section" data-section="getting-started" role="menuitem">
        <strong>Help / FAQ</strong>
        <span>Quick answers for sign-in, rounds, and shared play.</span>
      </button>
      <button class="app-menu-item" type="button" data-action="open-settings" data-destination="app" data-section="account" role="menuitem">
        <strong>App Settings</strong>
        <span>Account, appearance, and integrations.</span>
      </button>
      <button class="app-menu-item" type="button" data-action="open-settings" data-destination="app" data-section="integrations" role="menuitem">
        <strong>Feedback / Support</strong>
        <span>Send tester feedback or open support details.</span>
      </button>
      <button class="app-menu-item" type="button" data-action="open-settings" data-destination="app" data-section="integrations" role="menuitem">
        <strong>About</strong>
        <span>Version, app details, and release notes scaffold.</span>
      </button>
    </div>
  `;
}

function renderAppShellHeader(state, activeRound, subscription) {
  const viewId = state.session.activeView || "home";
  const firstName = state.currentUser.name?.split(" ")[0] || "Golfer";
  const settingsDestination = getSettingsDestination(state);
  let viewLabel = "Play";
  let headerClass = "app-header-card--utility";

  if (viewId === "home") {
    headerClass = "app-header-card--home";
    viewLabel = "Play";
  } else if (viewId === "round") {
    headerClass = "app-header-card--round";
    viewLabel = "Score";
  } else if (viewId === "stats") {
    viewLabel = "Profile";
  } else if (viewId === "community") {
    viewLabel = "Community";
  } else if (viewId === "premium") {
    viewLabel = "Profile";
  } else if (viewId === "settings") {
    viewLabel = settingsDestination === "app" ? "App Settings" : "Profile";
  } else if (viewId === "help") {
    viewLabel = "Help";
  }

  return `
    <header class="app-header-card top-bar ${headerClass}" data-view="${escapeHtml(viewId)}">
      <div class="app-menu-shell" data-app-menu="true">
        <button
          class="top-left top-bar-action ${state.session?.appMenuOpen ? "is-open" : ""}"
          type="button"
          data-action="toggle-app-menu"
          aria-label="Open app menu"
          aria-expanded="${state.session?.appMenuOpen ? "true" : "false"}"
        >
          <span aria-hidden="true">&#9776;</span>
        </button>
        ${renderAppMenu(state)}
      </div>
      <div class="app-header-context">
        <button
          class="brand-mark brand-mark--compact"
          type="button"
          data-action="nav-view"
          data-view="home"
          aria-label="Go to Play"
        >
          GN
        </button>
        <div class="app-header-copy top-title-wrap">
          <strong class="app-header-title top-title">Golfers Nation</strong>
          <p class="app-header-subtitle top-view-label">${escapeHtml(viewLabel)}</p>
        </div>
      </div>
      <button
        class="account-trigger top-right"
        type="button"
        data-action="open-settings"
        data-destination="landing"
        aria-label="Open my profile"
      >
        ${renderAvatarChip(state.currentUser.avatarLabel || firstName, "is-header")}
        <span class="account-trigger-copy">
          <span class="mini-label">My Profile</span>
          <strong>${escapeHtml(firstName)}</strong>
        </span>
      </button>
    </header>
  `;
}

function renderLiveSessionStrip(activeRound, activeGroup) {
  const inviteCode = activeGroup?.inviteCode || activeRound?.inviteCode || "---";
  const players = activeGroup?.members?.length
    ? activeGroup.members.map((member) => member.displayName).filter(Boolean)
    : activeRound?.players?.map((player) => player.name).filter(Boolean) || [];
  const playerCount = players.length || 1;
  const liveStatus = activeRound?.connectionState === "live"
    ? "Live sync"
    : "Saved local";
  const holeLabel = activeRound?.currentHole ? `Hole ${activeRound.currentHole}` : "Hole 1";
  const detailSummary = [
    activeRound?.courseName || "Active round",
    activeRound?.teeBox ? `${activeRound.teeBox} tees` : null,
    `${activeRound?.holes?.length || activeRound?.selectedHoleCount || 18} holes`,
  ].filter(Boolean).join(" / ");
  const hiddenClass = activeRound ? "" : " hidden";
  return `
    <details class="live-strip${hiddenClass}" id="liveStrip" data-persist-key="live-strip">
      <summary class="live-strip-summary">
        <div class="live-strip-main">
          <span class="live-strip-badge">LIVE</span>
          <span class="live-strip-code"><b id="liveCode">${escapeHtml(inviteCode)}</b></span>
          <span id="livePlayers" class="live-strip-players">${playerCount} ${playerCount === 1 ? "golfer" : "golfers"}</span>
          <span class="live-strip-status">${escapeHtml(`${holeLabel} / ${liveStatus}`)}</span>
        </div>
        <span class="live-strip-toggle">Details</span>
      </summary>
      <div class="live-strip-detail-row">
        <span>${escapeHtml(detailSummary)}</span>
        <span>${escapeHtml(players.join(", ") || "You")}</span>
      </div>
    </details>
  `;
}

function renderScreenHeader(state, activeRound) {
  return "";
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

  const summary = getRoundSummaryForState(state, summaryRound);
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
  const relationshipAction = !isCurrentUser
    ? `
      <button
        class="button ${preview.isFollowed ? "secondary" : "primary"}"
        type="button"
        data-action="toggle-follow-profile"
        data-profile-id="${escapeHtml(profileId)}"
      >
        ${preview.isFollowed ? "Following" : "Follow golfer"}
      </button>
      <button
        class="button subtle"
        type="button"
        data-action="request-friend-profile"
        data-profile-id="${escapeHtml(profileId)}"
        ${preview.isFriend || preview.pendingFriendRequest ? "disabled" : ""}
      >
        ${preview.isFriend ? "Friends" : preview.pendingFriendRequest ? "Request sent" : "Add friend"}
      </button>
    `
    : `
      <button class="button subtle" type="button" data-action="share-profile-placeholder">Share profile</button>
      <button class="button subtle" type="button" data-action="share-round-summary-placeholder">Round brag card</button>
    `;

  if (comparison && !comparisonGate.locked) {
    return `
      <article class="card competitive-preview-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Player comparison</p>
            <h3>${escapeHtml(title)}</h3>
          </div>
          <span class="status-pill">${escapeHtml(isCurrentUser ? comparison.right.formLabel : preview.relationshipLabel)}</span>
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
          ${!isCurrentUser ? `
            <article>
              <span>Connection</span>
              <strong>${escapeHtml(preview.relationshipLabel)}</strong>
            </article>
          ` : ""}
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
          ${relationshipAction}
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
      <div class="competitive-public-strip">
        <span>${escapeHtml(preview.relationshipLabel)}</span>
        <span>${escapeHtml(preview.recentFormSummary)}</span>
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
      <div class="row-actions competitive-action-row">
        ${relationshipAction}
      </div>
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
        ${game.socialSummary ? `<p>${escapeHtml(game.socialSummary)}</p>` : ""}
      </div>
      <div class="list-metrics ${compact ? "" : "discovery-list-metrics"}">
        <span>${escapeHtml(game.distance)}</span>
        ${game.liveBadge ? `<span class="status-pill">${escapeHtml(game.liveBadge)}</span>` : ""}
        ${compact ? "" : `<span>${escapeHtml(game.transport)}</span>`}
        <span>${escapeHtml(game.inviteCode)}</span>
        ${game.friendCount ? `<span class="status-pill">${game.friendCount} ${game.friendCount === 1 ? "friend" : "friends"}</span>` : ""}
        <button class="button subtle" type="button" data-action="quick-join-code" data-code="${game.inviteCode}">${escapeHtml(game.joinActionLabel || actionLabel)}</button>
      </div>
    </article>
  `).join("");
}

function getCurrentUserRelationshipCounts(state) {
  const social = state.currentUser?.social || {};
  return {
    friends: (social.friendProfileIds || []).length,
    following: (social.followedProfileIds || []).length,
  };
}

function renderPlayCourseAssistCard(state, activeRound) {
  const roundSetup = getRoundSetup(state);
  const discovery = getRoundSetupDiscoveryState(roundSetup, state.session?.nearby || {});
  const selectedCourse = discovery.selectedCourse;
  const locationStatus = state.session?.nearby?.locationPermission === "granted"
    ? "Location on"
    : state.session?.nearby?.locationPermission === "denied"
      ? "Location off"
      : "Location optional";
  const actionLabel = selectedCourse ? "Confirm course" : "Find course";
  const actionName = selectedCourse ? "nav-view" : "detect-nearby-courses";
  const actionValue = selectedCourse ? "round" : "";

  return `
    <article class="card play-screen-card play-compact-card play-course-card">
      <div class="section-heading section-heading--compact">
        <div>
          <p class="eyebrow">Course Assist</p>
          <h3>${escapeHtml(selectedCourse?.name || discovery.nearbyCopy.title)}</h3>
        </div>
        <span class="status-pill">${escapeHtml(locationStatus)}</span>
      </div>
      <p class="play-active-copy">${escapeHtml(selectedCourse ? `${selectedCourse.city}, ${selectedCourse.state}` : "Find a course to start.")}</p>
      <div class="row-actions compact-actions">
        <button class="button secondary" type="button" data-action="${actionName}" ${actionValue ? `data-view="${actionValue}"` : ""}>
          ${actionLabel}
        </button>
      </div>
    </article>
  `;
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
        <span class="nearby-player-badge">${escapeHtml(player.relationshipLabel)}</span>
        <span>${escapeHtml(player.detail)}</span>
        <span>${escapeHtml(player.statsSummary)}</span>
        ${player.homeCourse ? `<span>${escapeHtml(player.homeCourse)}</span>` : ""}
        ${player.handicap !== null && player.handicap !== undefined ? `<span>Hdcp ${escapeHtml(String(player.handicap))}</span>` : ""}
      </div>
      <div class="row-actions nearby-player-actions">
        <button class="button subtle" type="button" data-action="select-profile-preview" data-profile-id="${escapeHtml(player.profileId)}">${player.isLive ? "View live card" : "View card"}</button>
        ${player.inviteCode
          ? `<button class="button secondary" type="button" data-action="quick-join-code" data-code="${player.inviteCode}">${escapeHtml(player.joinActionLabel || "Join round")}</button>`
          : `<button class="button secondary" type="button" data-action="request-round-invite" data-profile-id="${escapeHtml(player.profileId)}">${player.pendingFriendRequest ? "Invite pending" : "Join request"}</button>`}
        <button class="button subtle" type="button" data-action="toggle-follow-profile" data-profile-id="${escapeHtml(player.profileId)}">${player.isFollowed ? "Following" : "Follow"}</button>
      </div>
    </article>
  `).join("");
}

function renderPrimaryActions(state, activeRound) {
  const hasActiveRound = Boolean(activeRound && activeRound.status === "active");
  return `
      <div class="play-screen-actions">
        <button class="button primary primary-btn ${shouldShowFirstRoundGuide(state) && !hasActiveRound ? "guided-action" : ""}" type="button" data-action="nav-view" data-view="round">Start Round</button>
        <button class="button secondary secondary-btn" type="button" data-action="open-community-join">Join Game</button>
      </div>
    `;
}

function renderPlayActiveGameCard(state, activeRound) {
  const activeGroup = getActiveGroup(state, activeRound);
  const inviteCode = activeGroup?.inviteCode || activeRound?.inviteCode || "";
  const players = activeGroup?.members?.length
    ? activeGroup.members.map((member) => member.displayName).filter(Boolean)
    : activeRound?.players?.map((player) => player.name).filter(Boolean) || [];
  const visiblePlayers = players.slice(0, 4);
  const extraPlayers = players.length - visiblePlayers.length;

  if (!activeRound) {
    return `
      <article class="card play-screen-card play-compact-card play-active-card play-active-card--empty">
        <div class="play-screen-card-head">
          <div>
            <p class="eyebrow">Active Game</p>
            <h3>No live round yet</h3>
          </div>
          <span class="status-pill">Ready</span>
        </div>
        <p class="play-active-copy">Start a round or join one to see it here.</p>
      </article>
    `;
  }

  const sync = getSyncPresentation(activeRound, activeGroup);

  return `
      <article class="card play-screen-card play-compact-card play-active-card">
        <div class="play-screen-card-head">
          <div>
            <p class="eyebrow">Active Game</p>
            <h3>${escapeHtml(activeRound.courseName)}</h3>
          </div>
          <span class="status-pill ${sync.tone === "success" ? "is-live" : ""}">${escapeHtml(sync.title)}</span>
        </div>
        <div class="play-active-strip-meta">
          <span><strong>Code</strong> ${escapeHtml(inviteCode || "---")}</span>
          <span><strong>Hole</strong> ${activeRound.currentHole}</span>
          <span><strong>Tee</strong> ${escapeHtml(activeRound.teeBox || "Default")}</span>
          <span><strong>Status</strong> ${escapeHtml(sync.title)}</span>
        </div>
        <div class="play-active-players" aria-label="Players in active game">
          ${visiblePlayers.length
            ? visiblePlayers.map((name) => `<span class="play-player-pill">${escapeHtml(name)}</span>`).join("")
            : `<span class="play-player-pill">You</span>`}
          ${extraPlayers > 0 ? `<span class="play-player-pill play-player-pill--extra">+${extraPlayers}</span>` : ""}
        </div>
        <div class="row-actions compact-actions">
          <button class="button primary" type="button" data-action="resume-round" data-round-id="${activeRound.id}">Continue Round</button>
          ${inviteCode ? `<button class="button secondary" type="button" data-action="copy-invite-code" data-code="${inviteCode}">Copy invite</button>` : `<button class="button secondary" type="button" data-action="host-active-round">Go live</button>`}
        </div>
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
            <strong>Saved on this phone</strong>
            <p>${escapeHtml(cloudSync.errorMessage || "The latest changes are safe on this phone. Retry when the connection is ready.")}</p>
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
  const setup = state.session?.roundSetup || {};
  return {
    step: setup.step || "type",
    intent: setup.intent || "local",
    courseQuery: setup.courseQuery || "",
    selectedCourseId: setup.selectedCourseId || "",
    selectedTeeBoxId: setup.selectedTeeBoxId || "",
    selectedHoleCount: Number(setup.selectedHoleCount || 18),
    mode: setup.mode || "stroke",
    players: setup.players || "",
    manualCourseName: setup.manualCourseName || "National Pines",
    manualTeeBoxName: setup.manualTeeBoxName || "Blue",
  };
}

function getSettingsDestination(state) {
  return state.session?.settingsDestination || "landing";
}

function getSettingsSectionsForDestination(destination = "landing") {
  if (destination === "profile") {
    return PROFILE_SETTINGS_SECTIONS;
  }

  if (destination === "app") {
    return APP_SETTINGS_SECTIONS;
  }

  return [];
}

function getDefaultSettingsSectionId(destination = "landing") {
  if (destination === "profile") {
    return "profile-identity";
  }

  if (destination === "app") {
    return "account";
  }

  return "account";
}

function getSelectedSettingsSectionId(state, destination = "landing") {
  const rawSelectedId = state.session?.settingsSection || "";
  const selectedId = destination === "app" && (rawSelectedId === "spotify" || rawSelectedId === "app-support")
    ? "integrations"
    : rawSelectedId;
  const sections = getSettingsSectionsForDestination(destination);
  if (sections.some((section) => section.id === selectedId)) {
    return selectedId;
  }

  return getDefaultSettingsSectionId(destination);
}

function getSettingsDestinationCopy(destination = "landing") {
  if (destination === "profile") {
    return {
      title: "My Profile",
      eyebrow: "Golfer identity",
      description: "Identity, stats, and privacy.",
    };
  }

  if (destination === "app") {
    return {
      title: "App Settings",
      eyebrow: "How you use the app",
      description: "Appearance, account, support, and integrations.",
    };
  }

  return {
    title: "Profile",
    eyebrow: "Choose a destination",
    description: "Open your public golfer profile or manage how the app works on this phone.",
  };
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

function renderSettingsSectionNav(state, destination) {
  const selected = getSelectedSettingsSectionId(state, destination);
  const sections = getSettingsSectionsForDestination(destination);
  if (!sections.length) {
    return "";
  }

  return `
    <div class="settings-section-list" role="tablist" aria-label="${escapeHtml(destination === "profile" ? "My Profile sections" : "App Settings sections")}">
      ${sections.map((section) => `
        <button
          class="settings-section-row ${selected === section.id ? "is-active" : ""}"
          type="button"
          data-action="set-settings-section"
          data-section="${section.id}"
          data-destination="${destination}"
          role="tab"
          aria-selected="${selected === section.id ? "true" : "false"}"
        >
          ${escapeHtml(section.label)}
        </button>
      `).join("")}
    </div>
  `;
}

function renderSettingsLandingView(state) {
  const subscription = getSubscription(state);
  const provider = state.currentUser.providerType || state.currentUser.provider || "email";
  const relationshipCounts = getCurrentUserRelationshipCounts(state);
  const preview = buildCompetitivePreview(state, state.currentUser.profileId, state.currentUser.profileId);

  return `
    <section class="view-grid settings-grid settings-grid--landing">
      <article class="card settings-top-card card-span-3">
        <div class="profile-identity-row">
          ${renderAvatarChip(state.currentUser.avatarLabel || state.currentUser.avatar, "is-large")}
          <div>
            <p class="eyebrow">Profile</p>
            <h3>${escapeHtml(state.currentUser.displayName || state.currentUser.name)}</h3>
            <p>${escapeHtml(state.currentUser.username || "@golfer")} / ${escapeHtml(subscription.tier === "premium" ? "Premium" : "Free")} / ${escapeHtml(provider)}</p>
          </div>
        </div>
        <div class="summary-grid compact settings-summary-grid">
          <article>
            <span>Rounds</span>
            <strong>${preview?.roundsPlayed || state.currentUser.roundsPlayed || 0}</strong>
          </article>
          <article>
            <span>Average</span>
            <strong>${formatAverageScore(preview?.averageScore ?? state.currentUser.averageScore)}</strong>
          </article>
          <article>
            <span>Best round</span>
            <strong>${preview?.bestRound || state.currentUser.bestRound || "--"}</strong>
          </article>
          <article>
            <span>Friends</span>
            <strong>${relationshipCounts.friends}</strong>
          </article>
        </div>
      </article>
      <div class="settings-destination-grid card-span-3">
        <button class="card settings-destination-card" type="button" data-action="set-settings-destination" data-destination="profile" data-section="profile-identity">
          <span class="mini-label">My Profile</span>
          <strong>Golfer identity</strong>
          <p>Profile and stats.</p>
        </button>
        <button class="card settings-destination-card" type="button" data-action="set-settings-destination" data-destination="app" data-section="account">
          <span class="mini-label">App Settings</span>
          <strong>App controls</strong>
          <p>Account, look, integrations.</p>
        </button>
      </div>
    </section>
  `;
}

function renderSettingsDestinationSwitch(destination) {
  return `
    <div class="settings-destination-switch" role="tablist" aria-label="Profile destinations">
      <button
        class="settings-destination-pill ${destination === "profile" ? "is-active" : ""}"
        type="button"
        data-action="set-settings-destination"
        data-destination="profile"
        data-section="profile-identity"
        role="tab"
        aria-selected="${destination === "profile" ? "true" : "false"}"
      >
        My Profile
      </button>
      <button
        class="settings-destination-pill ${destination === "app" ? "is-active" : ""}"
        type="button"
        data-action="set-settings-destination"
        data-destination="app"
        data-section="account"
        role="tab"
        aria-selected="${destination === "app" ? "true" : "false"}"
      >
        App Settings
      </button>
    </div>
  `;
}

function renderSettingsDestinationHeader(state, destination) {
  const copy = getSettingsDestinationCopy(destination);

  return `
    <article class="card settings-top-card card-span-3">
      <div class="profile-identity-row">
        ${renderAvatarChip(state.currentUser.avatarLabel || state.currentUser.avatar, "is-large")}
        <div>
          <p class="eyebrow">${escapeHtml(copy.eyebrow)}</p>
          <h3>${escapeHtml(copy.title)}</h3>
          <p class="compact-copy">${escapeHtml(copy.description)}</p>
        </div>
      </div>
      ${renderSettingsDestinationSwitch(destination)}
      ${renderSettingsSectionNav(state, destination)}
    </article>
  `;
}

function renderSettingsPanelsForDestination(state, destination) {
  const selectedSectionId = getSelectedSettingsSectionId(state, destination);
  const cards = {
    "profile-identity": renderProfileIdentitySettingsCard(state),
    account: renderAccountSettingsCard(state),
    "golf-profile": renderGolfProfileSettingsCard(state),
    appearance: renderAppearanceSettingsCard(state),
    social: renderSocialSettingsCard(state),
    integrations: renderIntegrationsSettingsCard(state),
  };

  return getSettingsSectionsForDestination(destination)
    .map((section) => `
      <section
        class="settings-section-panel"
        data-settings-section-panel="${section.id}"
        data-settings-destination-owner="${destination}"
        ${section.id === selectedSectionId ? "" : "hidden"}
      >
        ${cards[section.id] || ""}
      </section>
    `)
    .join("");
}

function renderSettingsDestinationWorkspace(state, destination) {
  const destinationCopy = getSettingsDestinationCopy(destination);

  return `
    <section
      class="settings-destination-panel"
      data-settings-destination-panel="${destination}"
      data-settings-destination-title="${escapeHtml(destinationCopy.title)}"
      ${getSettingsDestination(state) === destination ? "" : "hidden"}
    >
      ${renderSettingsDestinationHeader(state, destination)}
      ${renderSettingsPanelsForDestination(state, destination)}
    </section>
  `;
}

function renderProfileIdentitySettingsCard(state) {
  return `
    <article class="card settings-card" data-settings-card="profile-identity">
      <div class="section-heading">
        <div>
          <p class="eyebrow">My Profile</p>
          <h3>Identity and public card</h3>
        </div>
      </div>
      <form class="stack-form" data-form="save-profile-identity">
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
            Avatar
            <input name="avatarLabel" type="text" maxlength="2" value="${escapeHtml(state.currentUser.avatarLabel || "GN")}" />
          </label>
          <label>
            Public summary
            <input value="${escapeHtml(state.currentUser.bio || state.currentUser.homeCourse || "Ready for your first public round")}" readonly />
          </label>
        </div>
        <div class="summary-grid compact">
          <article>
            <span>Public name</span>
            <strong>${escapeHtml(state.currentUser.displayName || state.currentUser.name)}</strong>
          </article>
          <article>
            <span>Username</span>
            <strong>${escapeHtml(state.currentUser.username || "@golfer")}</strong>
          </article>
          <article>
            <span>Rounds played</span>
            <strong>${state.currentUser.roundsPlayed || 0}</strong>
          </article>
          <article>
            <span>Average</span>
            <strong>${formatAverageScore(state.currentUser.averageScore)}</strong>
          </article>
        </div>
        <div class="row-actions">
          <button class="button primary" type="submit">Save profile identity</button>
        </div>
      </form>
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
        <p class="body-copy compact-copy">Use the ${escapeHtml(provider)} account flow to change it.</p>
      </article>
    `;

  return `
    <article class="card settings-card" data-settings-card="account">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Account</p>
          <h3>Account</h3>
        </div>
        <span class="status-pill">${escapeHtml(subscription.tier === "premium" ? "Premium" : "Free")}</span>
      </div>
      <div class="stack-form">
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
          <button class="button primary" type="button" data-action="sign-out">Log out</button>
        </div>
      </div>
      ${passwordScaffold}
    </article>
  `;
}

function renderIntegrationsSettingsCard(state) {
  const crashLog = state.session?.crashLog || {
    count: 0,
    lastCrashAt: "",
    latestStage: "",
    entries: [],
  };
  const crashEntries = Array.isArray(crashLog.entries) ? crashLog.entries.slice(0, 3) : [];
  const recentActivity = (state.social?.activity || [])
    .slice(0, 3)
    .map((entry) => entry.message)
    .join(" | ");
  const contextView = state.session.settingsReturnView || state.session.previousView || "stats";

  return `
    <article class="card settings-card" data-settings-card="integrations">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Integrations</p>
          <h3>Integrations</h3>
        </div>
      </div>
      <div class="stack-list settings-support-list">
        <article class="settings-support-panel">
          <span class="mini-label">Spotify</span>
          <strong>Music companion</strong>
          ${renderSpotifySettingsPanel(state)}
        </article>
        <button class="list-row large settings-link-row" type="button" data-action="open-help-section" data-section="getting-started">
          <div>
            <strong>Help Center</strong>
            <p>Quick guides.</p>
          </div>
          <span>Open</span>
        </button>
        <button class="list-row large settings-link-row" type="button" data-action="contact-support-placeholder">
          <div>
            <strong>Support</strong>
            <p>Send feedback or get help.</p>
          </div>
          <span>Email</span>
        </button>
      </div>
      <article class="settings-support-panel">
        <span class="mini-label">Crash logs</span>
        <strong>${crashLog.count ? "Crash logs saved on this phone" : "No crash logs on this phone"}</strong>
        <div class="row-actions">
          <button class="button secondary" type="button" data-action="copy-crash-report" ${crashLog.count ? "" : "disabled"}>Copy crash report</button>
          <button class="button subtle" type="button" data-action="clear-crash-logs" ${crashLog.count ? "" : "disabled"}>Clear logs</button>
        </div>
        ${crashEntries.length ? `
          <div class="stack-list settings-support-list crash-log-list">
            ${crashEntries.map((entry) => `
              <article class="list-row large crash-log-entry">
                <div>
                  <strong>${escapeHtml(entry.stage || "runtime")}</strong>
                  <p>${escapeHtml(entry.message || "Unknown error.")}</p>
                </div>
                <span>${escapeHtml(entry.id || "")}</span>
              </article>
            `).join("")}
          </div>
        ` : ""}
      </article>
      <form class="stack-form compact-form" data-form="submit-tester-feedback">
        <input type="hidden" name="testerName" value="${escapeHtml(state.currentUser.displayName || state.currentUser.name)}" />
        <input type="hidden" name="email" value="${escapeHtml(state.currentUser.email || "")}" />
        <input type="hidden" name="feedbackArea" value="other" />
        <input type="hidden" name="rating" value="4" />
        <input type="hidden" name="appVersion" value="${escapeHtml(APP_VERSION)}" />
        <input type="hidden" name="planTier" value="${escapeHtml(state.currentUser.subscription?.tier || "free")}" />
        <input type="hidden" name="installState" value="${escapeHtml(state.session?.installState || "browser")}" />
        <input type="hidden" name="appearanceMode" value="${escapeHtml(state.currentUser?.appearance?.colorMode || "system")}" />
        <input type="hidden" name="themeId" value="${escapeHtml(state.currentUser?.appearance?.themeId || "forest")}" />
        <input type="hidden" name="contextView" value="${escapeHtml(contextView)}" />
        <input type="hidden" name="recentActivity" value="${escapeHtml(recentActivity)}" />
        <input type="hidden" name="userAgent" value="${escapeHtml(typeof navigator === "undefined" ? "" : navigator.userAgent || "")}" />
        <label>
          Feedback
          <textarea name="feedbackMessage" rows="3" placeholder="What needs attention?"></textarea>
        </label>
        <button class="button primary" type="submit">Send tester feedback</button>
      </form>
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
          <h3>Appearance</h3>
        </div>
      </div>
      <form class="stack-form" data-form="save-appearance-settings">
        <div class="settings-option-group">
          <span class="mini-label">Mode</span>
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
          <span class="mini-label">Theme</span>
          <div class="theme-current-card" data-active-theme-card="true" data-theme-preview="${escapeHtml(activeTheme.id)}">
            <div class="theme-current-copy" aria-live="polite">
              <span class="theme-current-eyebrow">Preview</span>
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
                  <span class="theme-choice-badge">Preview</span>
                </div>
                <p>${escapeHtml(theme.description)}</p>
              </label>
            `).join("")}
          </div>
        </div>
        <div class="settings-option-group">
          <span class="mini-label">Display</span>
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
              <strong>Compact</strong>
              <p>Tighter spacing.</p>
            </label>
            <label class="settings-toggle-card ${appearance.contrastMode === "high" ? "is-selected" : ""}">
              <input type="checkbox" name="contrastMode" value="high" data-appearance-input="true" ${appearance.contrastMode === "high" ? "checked" : ""} />
              <strong>High contrast</strong>
              <p>Stronger separation.</p>
            </label>
          </div>
        </div>
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
  const crashLog = state.session?.crashLog || {
    count: 0,
    lastCrashAt: "",
    latestStage: "",
    latestMessage: "",
    entries: [],
  };
  const crashEntries = Array.isArray(crashLog.entries) ? crashLog.entries.slice(0, 3) : [];

  return `
    <article class="card settings-card" data-settings-card="app-support">
      <div class="section-heading">
        <div>
          <p class="eyebrow">App & Support</p>
          <h3>Help, policy, and device support</h3>
        </div>
      </div>
      <div class="stack-list settings-support-list">
        <button class="list-row large settings-link-row" type="button" data-action="show-policy-placeholder" data-doc="about">
          <div>
            <strong>About Golfers Nation</strong>
            <p>Version details, release notes, and the product overview scaffold for launch review.</p>
          </div>
          <span>Open</span>
        </button>
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
        <span class="mini-label">Crash logs</span>
        <strong>Local startup and runtime reports</strong>
        <p class="body-copy compact-copy">
          ${crashLog.count
            ? `Stored on this device for developer review. Latest crash: ${escapeHtml(crashLog.latestStage || "runtime")} at ${escapeHtml(formatDateTime(crashLog.lastCrashAt))}.`
            : "No startup or runtime crashes have been recorded on this device yet."}
        </p>
        <div class="row-actions">
          <button class="button secondary" type="button" data-action="copy-crash-report" ${crashLog.count ? "" : "disabled"}>Copy crash report</button>
          <button class="button subtle" type="button" data-action="clear-crash-logs" ${crashLog.count ? "" : "disabled"}>Clear logs</button>
        </div>
        ${crashEntries.length ? `
          <div class="stack-list settings-support-list crash-log-list">
            ${crashEntries.map((entry) => `
              <article class="list-row large crash-log-entry">
                <div>
                  <strong>${escapeHtml(entry.stage || "runtime")}</strong>
                  <p>${escapeHtml(entry.message || "Unknown error.")}</p>
                  <p>${escapeHtml(formatDateTime(entry.createdAt))}</p>
                </div>
                <span>${escapeHtml(entry.id || "")}</span>
              </article>
            `).join("")}
          </div>
        ` : ""}
      </article>
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
  const destination = getSettingsDestination(state);
  return `
    <section
      class="view-grid settings-grid ${destination === "landing" ? "settings-grid--landing" : ""}"
      data-settings-view-root="true"
      data-settings-destination="${escapeHtml(destination)}"
      data-settings-section="${escapeHtml(getSelectedSettingsSectionId(state, destination === "landing" ? "app" : destination))}"
    >
      <section
        class="settings-destination-panel"
        data-settings-destination-panel="landing"
        ${destination === "landing" ? "" : "hidden"}
      >
        ${renderSettingsLandingView(state)}
      </section>
      ${renderSettingsDestinationWorkspace(state, "profile")}
      ${renderSettingsDestinationWorkspace(state, "app")}
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

  return `
    <section class="play-screen">
      ${renderPlayActiveGameCard(state, activeRound)}
      ${renderPrimaryActions(state, activeRound)}
      ${renderPlayCourseAssistCard(state, activeRound)}
    </section>
  `;
}

function renderModeNotes(state, mode) {
  const subscription = getSubscription(state);
  const premiumModes = PREMIUM_MODE_IDS.map((modeId) => getGameModeLabel(modeId)).join(" and ");

  return `
    <div class="mode-strip">
      <span class="status-pill">Mode in play: ${escapeHtml(getGameModeLabel(mode))}</span>
      <span class="status-pill">${isPremiumSubscription(subscription) ? "Premium modes unlocked" : `${escapeHtml(premiumModes)} unlock with Premium`}</span>
    </div>
  `;
}

const ROUND_SETUP_STEP_COPY = [
  { id: "type", label: "Type" },
  { id: "course", label: "Course" },
  { id: "format", label: "Format" },
  { id: "players", label: "Players" },
  { id: "review", label: "Start" },
];

function renderRoundSetupProgress(step = "type") {
  const activeIndex = Math.max(0, ROUND_SETUP_STEP_COPY.findIndex((item) => item.id === step));

  return `
    <div class="round-setup-progress" aria-label="Round setup progress">
      <div class="round-setup-progress-copy">
        <span class="mini-label">Step ${activeIndex + 1} / ${ROUND_SETUP_STEP_COPY.length}</span>
        <strong>${escapeHtml(ROUND_SETUP_STEP_COPY[activeIndex]?.label || "Type")}</strong>
      </div>
      <div class="round-setup-progress-track">
        ${ROUND_SETUP_STEP_COPY.map((item, index) => `
          <span class="round-setup-progress-step ${index <= activeIndex ? "is-complete" : ""}">${index + 1}</span>
        `).join("")}
      </div>
    </div>
  `;
}

function renderRoundSetupFooter({
  canGoBack = false,
  backLabel = "Back",
  nextLabel = "Next",
  nextAction = "round-setup-step",
  nextStep = "",
  nextDirection = 1,
  nextDisabled = false,
} = {}) {
  return `
    <div class="round-setup-footer">
      ${canGoBack
        ? `<button class="button subtle" type="button" data-action="round-setup-step" data-direction="-1">${escapeHtml(backLabel)}</button>`
        : `<span class="round-setup-footer-spacer"></span>`}
      <button
        class="button primary"
        type="button"
        data-action="${escapeHtml(nextAction)}"
        ${nextStep ? `data-step="${escapeHtml(nextStep)}"` : ""}
        ${nextAction === "round-setup-step" ? `data-direction="${Number(nextDirection)}"` : ""}
        ${nextDisabled ? "disabled" : ""}
      >
        ${escapeHtml(nextLabel)}
      </button>
    </div>
  `;
}

function renderRoundSetupTypeStep(roundSetup) {
  const options = [
    {
      id: "local",
      title: "Solo Round",
      detail: "Just score your card.",
    },
    {
      id: "host",
      title: "Live Round",
      detail: "Share a code after start.",
    },
  ];

  return `
    <div class="round-setup-step-card">
      <div class="round-setup-step-head">
        <p class="eyebrow">Step 1</p>
        <h4>Choose round type</h4>
      </div>
      <div class="round-choice-grid">
        ${options.map((option) => `
          <button
            class="round-choice-button ${roundSetup.intent === option.id ? "is-active" : ""}"
            type="button"
            data-action="choose-round-intent"
            data-intent="${option.id}"
          >
            <strong>${escapeHtml(option.title)}</strong>
            <span>${escapeHtml(option.detail)}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderCoursePicker(state) {
  const roundSetup = getRoundSetup(state);
  const discovery = getRoundSetupDiscoveryState(roundSetup, state.session?.nearby || {});
  const {
    searchResults,
    quickPicks,
    selectedCourse,
    selectedTeeBox,
    nearbyCourses,
    nearbyCopy,
  } = discovery;
  const holeCountOptions = [9, 18]
    .filter((count) => count <= Number(selectedCourse?.holesCount || 18))
    .concat(
      Number(selectedCourse?.holesCount || 18) > 0 && ![9, 18].includes(Number(selectedCourse?.holesCount || 18))
        ? [Number(selectedCourse.holesCount)]
        : []
    );
  const locationStatusLabel = state.session?.nearby?.locationPermission === "granted"
    ? "Location assist on"
    : state.session?.nearby?.locationPermission === "denied"
      ? "Location off"
      : "Location optional";

  return `
    <div class="stack-list course-picker-block round-setup-step-card">
      <div class="round-setup-step-head">
        <p class="eyebrow">Step 2</p>
        <h4>Choose course</h4>
      </div>
      <article class="course-detection-card">
        <div class="course-detection-copy">
          <strong>${escapeHtml(nearbyCopy.title)}</strong>
          <span class="status-pill">${escapeHtml(locationStatusLabel)}</span>
        </div>
        ${nearbyCopy.canRefresh
          ? `<div class="row-actions compact-actions"><button class="button subtle" type="button" data-action="detect-nearby-courses">${state.session?.nearby?.locationPermission === "granted" ? "Refresh" : "Nearby Courses"}</button></div>`
          : ""}
      </article>
      ${nearbyCourses.length
        ? `
          <div class="round-setup-choice-row" aria-label="Likely nearby courses">
            ${nearbyCourses.map((course) => {
              const nearbyTee = getDefaultCourseTeeBox(course);
              const isSelected = course.id === selectedCourse?.id;
              return `
                <button class="course-result-card course-result-card--compact ${isSelected ? "is-selected" : ""}" type="button" data-action="select-course" data-course-id="${course.id}" data-tee-box-id="${nearbyTee?.id || ""}">
                  <strong>${escapeHtml(course.name)}</strong>
                  <p>${escapeHtml(course.nearbyDistanceLabel || `${course.city}, ${course.state}`)}</p>
                </button>
              `;
            }).join("")}
          </div>
        `
        : ""}
      ${quickPicks.length
        ? `
          <div class="round-setup-choice-row" aria-label="Quick course picks">
            ${quickPicks.map((course) => {
              const featuredTee = getDefaultCourseTeeBox(course);
              const isSelected = course.id === selectedCourse?.id;
              return `
                <button class="course-result-card course-result-card--compact ${isSelected ? "is-selected" : ""}" type="button" data-action="select-course" data-course-id="${course.id}" data-tee-box-id="${featuredTee?.id || ""}">
                  <strong>${escapeHtml(course.name)}</strong>
                  <p>${escapeHtml(course.city)}, ${escapeHtml(course.state)}</p>
                </button>
              `;
            }).join("")}
          </div>
        `
        : ""}
      <div class="course-search-shell" data-course-search-shell="true">
        <label class="course-search-field">
          <span>Search Course</span>
          <input data-course-search-input="true" type="search" value="${escapeHtml(roundSetup.courseQuery)}" placeholder="Course or city" />
        </label>
      </div>
      <div class="course-results-list course-results-list--compact">
        ${searchResults.length
          ? searchResults.slice(0, 6).map((course) => {
              const featuredTee = getDefaultCourseTeeBox(course);
              const isSelected = course.id === selectedCourse?.id;
              return `
                <button class="course-result-card ${isSelected ? "is-selected" : ""}" type="button" data-action="select-course" data-course-id="${course.id}" data-tee-box-id="${featuredTee?.id || ""}">
                  <div class="course-result-copy">
                    <strong>${escapeHtml(course.name)}</strong>
                    <p>${escapeHtml(course.city)}, ${escapeHtml(course.state)}</p>
                  </div>
                  <div class="course-result-meta">
                    <span>${escapeHtml(featuredTee?.name || "Primary tee")}</span>
                    <span>${featuredTee?.totalYardage || "--"} yds</span>
                  </div>
                </button>
              `;
            }).join("")
          : `
            <div class="empty-state compact-empty-state">
              <strong>No course match</strong>
              <p>Use the quick custom course below.</p>
            </div>
          `}
      </div>
      ${selectedCourse && selectedTeeBox
        ? `
          <article class="course-selected-card" data-selected-course="true">
            <div class="course-selected-copy">
              <span class="mini-label">Selected</span>
              <strong>${escapeHtml(selectedCourse.name)}</strong>
              <p>${escapeHtml(selectedTeeBox.name)} / ${selectedTeeBox.totalYardage} yds / Par ${selectedTeeBox.totalPar}</p>
            </div>
            <div class="split-inputs course-selected-actions">
              <label>
                Tee
                <select name="selectedTeeBoxId" form="create-round-form" data-course-tee-select="true">
                  ${selectedCourse.teeBoxes.map((teeBox) => `
                    <option value="${teeBox.id}" ${teeBox.id === selectedTeeBox.id ? "selected" : ""}>
                      ${escapeHtml(teeBox.name)} / ${teeBox.totalYardage} yds
                    </option>
                  `).join("")}
                </select>
              </label>
              <label>
                Holes
                <select name="selectedHoleCount" form="create-round-form" data-course-hole-count-select="true">
                  ${holeCountOptions.map((count) => `
                    <option value="${count}" ${count === roundSetup.selectedHoleCount ? "selected" : ""}>${count}</option>
                  `).join("")}
                </select>
              </label>
            </div>
            <div class="row-actions compact-actions">
              <button class="button subtle" type="button" data-action="clear-selected-course">Use Custom</button>
            </div>
          </article>
        `
        : `
          <div class="split-inputs">
            <label>
              Course
              <input
                name="courseName"
                type="text"
                value="${escapeHtml(roundSetup.manualCourseName)}"
                data-round-setup-field="manualCourseName"
                placeholder="Custom course"
              />
            </label>
            <label>
              Tee
              <input
                name="teeBox"
                type="text"
                value="${escapeHtml(roundSetup.manualTeeBoxName)}"
                data-round-setup-field="manualTeeBoxName"
                placeholder="Blue"
              />
            </label>
          </div>
        `}
      ${renderRoundSetupFooter({ canGoBack: true, nextLabel: "Next", nextDirection: 1 })}
    </div>
  `;
}

function renderCreateRoundCard(state, activeRound) {
  const subscription = getSubscription(state);
  const roundSetup = getRoundSetup(state);
  const playerValue = activeRound
    ? activeRound.players.map((player) => player.name).join(", ")
    : String(roundSetup.players || state.currentUser.name || "").trim() || state.currentUser.name;
  const discovery = getRoundSetupDiscoveryState(roundSetup, state.session?.nearby || {});
  const selectedCourse = discovery.selectedCourse;
  const selectedTeeBox = discovery.selectedTeeBox;
  const manualCourse = buildManualRoundTemplate(
    roundSetup.manualCourseName || activeRound?.courseName || "National Pines",
    roundSetup.manualTeeBoxName || activeRound?.teeBox || "Blue",
    { holeCount: roundSetup.selectedHoleCount || 18 }
  );
  const selectedCourseTemplate = selectedCourse || manualCourse;
  const selectedTeeName = selectedTeeBox?.name || manualCourse.teeBoxName || "Blue";
  const selectedHoleCount = roundSetup.selectedHoleCount || 18;
  const nearbyPlayers = getNearbyDiscoveryState(state).players.slice(0, 4);
  const playerNames = playerValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const visiblePlayers = playerNames.length ? playerNames : [state.currentUser.name];
  const availableModes = Object.values(GAME_MODES);
  const currentStep = roundSetup.step || "type";

  function renderFormatStep() {
    return `
      <div class="round-setup-step-card">
        <div class="round-setup-step-head">
          <p class="eyebrow">Step 3</p>
          <h4>Choose format</h4>
        </div>
        <div class="round-choice-grid round-choice-grid--tight">
          ${availableModes.map((gameMode) => {
            const locked = isModeLocked(gameMode.id, subscription);
            return `
              <button
                class="round-choice-button ${roundSetup.mode === gameMode.id ? "is-active" : ""}"
                type="button"
                data-action="${locked ? "locked-mode" : "choose-round-format"}"
                data-mode="${gameMode.id}"
                ${locked ? "disabled" : ""}
              >
                <strong>${escapeHtml(gameMode.label)}</strong>
                <span>${locked ? "Premium" : gameMode.id === "stroke" ? "Classic scoring" : gameMode.id === "match" ? "Head-to-head" : "Team play"}</span>
              </button>
            `;
          }).join("")}
        </div>
        ${renderRoundSetupFooter({ canGoBack: true, nextLabel: "Next", nextDirection: 1 })}
      </div>
    `;
  }

  function renderPlayersStep() {
    return `
      <div class="round-setup-step-card">
        <div class="round-setup-step-head">
          <p class="eyebrow">Step 4</p>
          <h4>Players</h4>
        </div>
        <div class="round-setup-player-list">
          ${visiblePlayers.map((name) => `<span class="round-setup-player-pill">${escapeHtml(name)}</span>`).join("")}
        </div>
        <label>
          Add Player
          <input
            name="players"
            type="text"
            value="${escapeHtml(playerValue)}"
            data-round-setup-field="players"
            placeholder="You, Maya Chen"
          />
        </label>
        ${roundSetup.intent === "host" && nearbyPlayers.length
          ? `
            <div class="round-setup-inline-list">
              ${nearbyPlayers.map((player) => `
                <button
                  class="button subtle"
                  type="button"
                  data-action="round-setup-add-player"
                  data-player-name="${escapeHtml(player.displayName)}"
                >
                  ${escapeHtml(player.displayName)}
                </button>
              `).join("")}
            </div>
          `
          : ""}
        <div class="round-setup-mini-note">
          <span class="status-pill">${roundSetup.intent === "host" ? "Live players can join by code after start" : "Score only your card by default"}</span>
        </div>
        ${renderRoundSetupFooter({ canGoBack: true, nextLabel: "Review", nextDirection: 1 })}
      </div>
    `;
  }

  function renderReviewStep() {
    return `
      <div class="round-setup-step-card">
        <div class="round-setup-step-head">
          <p class="eyebrow">Step 5</p>
          <h4>Review and start</h4>
        </div>
        <div class="round-setup-summary-grid">
          <article>
            <span>Type</span>
            <strong>${escapeHtml(roundSetup.intent === "host" ? "Live Round" : "Solo Round")}</strong>
          </article>
          <article>
            <span>Course</span>
            <strong>${escapeHtml(selectedCourseTemplate.courseName || selectedCourseTemplate.name || "Custom course")}</strong>
          </article>
          <article>
            <span>Format</span>
            <strong>${escapeHtml(getGameModeLabel(roundSetup.mode || "stroke"))}</strong>
          </article>
          <article>
            <span>Tee</span>
            <strong>${escapeHtml(selectedTeeName)}</strong>
          </article>
          <article>
            <span>Holes</span>
            <strong>${selectedHoleCount}</strong>
          </article>
          <article>
            <span>Players</span>
            <strong>${visiblePlayers.length}</strong>
          </article>
        </div>
        <div class="round-setup-player-list">
          ${visiblePlayers.map((name) => `<span class="round-setup-player-pill">${escapeHtml(name)}</span>`).join("")}
        </div>
        <div class="row-actions round-setup-submit-row">
          <button class="button primary" type="submit" name="intent" value="${escapeHtml(roundSetup.intent || "local")}">
            ${escapeHtml(roundSetup.intent === "host" ? "Start Live Round" : "Start Round")}
          </button>
          <button
            class="button subtle"
            type="button"
            data-action="choose-round-intent"
            data-intent="${roundSetup.intent === "host" ? "local" : "host"}"
          >
            ${escapeHtml(roundSetup.intent === "host" ? "Switch to Solo" : "Switch to Live")}
          </button>
        </div>
        <div class="round-setup-footer">
          <button class="button subtle" type="button" data-action="round-setup-step" data-direction="-1">Back</button>
        </div>
      </div>
    `;
  }

  function renderStepBody() {
    if (currentStep === "type") {
      return renderRoundSetupTypeStep(roundSetup);
    }

    if (currentStep === "course") {
      return renderCoursePicker(state);
    }

    if (currentStep === "format") {
      return renderFormatStep();
    }

    if (currentStep === "players") {
      return renderPlayersStep();
    }

    return renderReviewStep();
  }

  return `
    <article class="card round-setup-wizard-card card-span-2">
      <form class="stack-form" data-form="create-round" id="create-round-form">
        <div class="round-setup-wizard">
          <div class="round-setup-wizard-head">
            <div>
              <p class="eyebrow">Round setup</p>
              <h3>Start in five quick steps</h3>
            </div>
            ${renderRoundSetupProgress(currentStep)}
          </div>
          ${renderStepBody()}
        </div>
        <input type="hidden" name="selectedCourseId" value="${escapeHtml(selectedCourse?.id || "")}" />
        <input type="hidden" name="selectedTeeBoxId" value="${escapeHtml(selectedTeeBox?.id || "")}" />
        <input type="hidden" name="selectedHoleCount" value="${selectedHoleCount}" />
        <input type="hidden" name="courseName" value="${escapeHtml(manualCourse.courseName)}" />
        <input type="hidden" name="teeBox" value="${escapeHtml(manualCourse.teeBoxName)}" />
        <input type="hidden" name="weather" value="${escapeHtml(activeRound?.weather || "Calm 72F")}" />
        <input type="hidden" name="mode" value="${escapeHtml(roundSetup.mode || "stroke")}" />
        <input type="hidden" name="players" value="${escapeHtml(playerValue)}" />
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

function renderCompetitionLayerCard(summary) {
  const friendRows = summary?.friendLeaderboard?.entries || [];
  const sideGame = summary?.sideGame;
  const tournamentScaffold = summary?.tournamentScaffold;

  if (!friendRows.length && !sideGame && !tournamentScaffold) {
    return "";
  }

  return `
    <article class="card round-support-card competition-layer-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Competition layer</p>
          <h3>Social pressure and side games</h3>
        </div>
      </div>
      ${friendRows.length
        ? `
          <div class="stack-list compact-stack">
            <p class="mini-label">${escapeHtml(summary.friendLeaderboard.title)}</p>
            ${friendRows.map((entry) => `
              <div class="feature-row">
                <strong>${escapeHtml(entry.name)}</strong>
                <span>${escapeHtml(entry.relationshipLabel)} / #${entry.rank} / ${escapeHtml(entry.displayStatus)}</span>
              </div>
            `).join("")}
          </div>
        `
        : ""}
      ${sideGame
        ? `
          <div class="stack-list compact-stack">
            <p class="mini-label">${escapeHtml(sideGame.title)}</p>
            <div class="feature-row">${escapeHtml(sideGame.swingLabel)}</div>
            <div class="feature-row">${escapeHtml(sideGame.detail)}</div>
          </div>
        `
        : ""}
      ${tournamentScaffold
        ? `
          <div class="feature-row">
            <strong>${escapeHtml(tournamentScaffold.title)}</strong>
            <span>${escapeHtml(tournamentScaffold.detail)}</span>
          </div>
        `
        : ""}
    </article>
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
  const summary = getRoundSummaryForState(state, round);
  const roundSafety = getRoundSavePresentation(round);
  const localParticipantId = summary.localParticipant?.id;
  const leadParticipantId = summary.leaderboard[0]?.id;
  const nextOpenHole = getNextOpenHole(round, selectedHole);
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
    const scorePulseVisible = participant.id === state.session.lastScoredParticipantId
      && hole.number === state.session.lastScoredHole
      && Number(state.session.lastScorePulseAt || 0) > 0;
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
      scorePulseVisible,
      advancedSummary,
      isLocal: participant.id === localParticipantId,
      isLeader: participant.id === leadParticipantId,
      isRecent: participant.id === state.session.lastScoredParticipantId,
    };
  }

  function renderEditableParticipant(participant, options = {}) {
    const context = buildParticipantContext(participant);
    const { secondary = false } = options;
    const displayedScore = context.entry?.strokes ?? hole.par;
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
          ${context.scorePulseVisible ? `<span class="score-feedback-pill is-saved">Saved</span>` : ""}
          ${context.leaderboardEntry?.rankTrend && context.leaderboardEntry.rankTrend !== "steady"
            ? `<span class="score-feedback-pill">${escapeHtml(context.leaderboardEntry.rankTrendLabel || "Moved")}</span>`
            : ""}
        </div>
        ${secondary
          ? `
            <div class="participant-compact-stats">
              <span>Status ${escapeHtml(context.leaderboardEntry?.displayStatus || "--")}</span>
              <span>${escapeHtml(context.leaderboardEntry?.rankTrendLabel || "Opening stretch")}</span>
              <span>FW ${context.participantTotals.fairwaysHit}/${context.participantTotals.fairwayOpportunities} / GIR ${context.participantTotals.greensHit}/${context.participantTotals.girOpportunities}</span>
              <span>Putts ${context.participantTotals.averagePutts ?? "--"}</span>
            </div>
          `
          : ""}
        <div class="score-primary-block">
          ${secondary
            ? `
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
            `
            : `
              <div class="score-screen">
                <h2>Hole ${hole.number}</h2>
                <div class="score-screen-meta">
                  <span>Par ${hole.par}</span>
                  <span>${hole.yards} yds</span>
                  <span>${escapeHtml(context.leaderboardEntry?.displayStatus || "Ready")}</span>
                </div>
                <div class="score-control">
                  <button
                    type="button"
                    aria-label="Lower score"
                    data-action="adjust-score"
                    data-direction="-1"
                    data-hole="${hole.number}"
                    data-participant-id="${participant.id}"
                  >
                    -
                  </button>
                  <span>${displayedScore}</span>
                  <button
                    type="button"
                    aria-label="Raise score"
                    data-action="adjust-score"
                    data-direction="1"
                    data-hole="${hole.number}"
                    data-participant-id="${participant.id}"
                  >
                    +
                  </button>
                </div>
                <button class="button primary next-btn" type="button" data-action="jump-next-open" data-hole="${nextOpenHole}">
                  Next Hole
                </button>
              </div>
            `}
        </div>
        <details class="advanced-hole-stats" data-persist-key="advanced-hole-${hole.number}-${participant.id}">
          <summary>
            <span>More stats</span>
            <strong>${escapeHtml(context.advancedSummary)}</strong>
          </summary>
          <div class="advanced-hole-stats-body">
            <div class="split-inputs score-secondary-grid">
              <label>
                Score
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
          <p class="eyebrow">Score</p>
          <h3>Hole ${hole.number}</h3>
          <p class="body-copy compact-copy round-score-subcopy">Par ${hole.par} / ${hole.yards} yds</p>
        </div>
        <div class="round-score-status">
          <span class="status-pill">${escapeHtml(summary.localParticipant?.displayStatus || "--")}</span>
          <span class="status-pill">${escapeHtml(roundSafety.title)}</span>
        </div>
      </div>
      ${renderHoleNavigator(round, selectedHole)}
      <div class="participant-grid participant-grid--single">
        ${primaryParticipant ? renderEditableParticipant(primaryParticipant) : ""}
      </div>
      ${secondaryParticipants.length
        ? `
          <div class="round-shared-group">
            <div class="section-heading section-heading--compact">
              <div>
                <p class="eyebrow">Group</p>
                <h4>Everyone else</h4>
              </div>
            </div>
            <div class="stack-list compact-stack shared-round-list">
              ${secondaryParticipants.map((participant) => renderSharedParticipantRow(participant)).join("")}
            </div>
            <details class="round-secondary-entry" data-persist-key="round-secondary-entry-${round.id}-${hole.number}">
              <summary>
                <span>Score another golfer</span>
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

function renderRoundSessionCard(state, round, group) {
  const selectedHole = state.session.selectedHole;
  const hole = round.holes.find((item) => item.number === selectedHole) || round.holes[0];
  const sync = getSyncPresentation(round, group);
  const safety = getRoundSavePresentation(round);
  const inviteCode = group?.inviteCode || round?.inviteCode || "";
  const pendingLocalChanges = getPendingRoundEvents(round).length > 0;
  const sessionCopy = round.sync?.saveState === "retry-needed" || pendingLocalChanges ? safety.detail : sync.message;

  return `
    <article class="card round-support-card round-session-card">
      <div class="round-session-main">
        <div>
          <p class="eyebrow">Active session</p>
          <h3>${escapeHtml(round.courseName)}</h3>
          <p class="body-copy compact-copy">Hole ${hole.number} / Par ${hole.par} / ${hole.yards} yds / ${escapeHtml(round.teeBox)} / ${round.holes?.length || round.selectedHoleCount || 18}</p>
        </div>
        <div class="round-session-code">
          <span>Code</span>
          <strong>${escapeHtml(inviteCode || "Host to share")}</strong>
        </div>
      </div>
      <div class="play-stat-strip round-session-strip">
        <span class="status-pill">${escapeHtml(sync.title)}</span>
        <span class="status-pill">${escapeHtml(safety.title)}</span>
        <span class="status-pill">${round.players.length} golfers</span>
      </div>
      <p class="body-copy compact-copy">${escapeHtml(sessionCopy)}</p>
      <div class="participant-preview-row round-session-players">
        ${round.players.map((player) => `
          <span class="player-preview-pill player-preview-pill--static">
            ${renderAvatarChip(getProfileForPlayer(state, player)?.publicProfile.avatarLabel || player.avatarLabel)}
            <span>${escapeHtml(player.name)}</span>
          </span>
        `).join("")}
      </div>
      <div class="row-actions compact-actions">
        ${inviteCode
          ? `<button class="button secondary" type="button" data-action="copy-invite-code" data-code="${inviteCode}">Copy code</button>`
          : `<button class="button secondary" type="button" data-action="host-active-round">Host round</button>`}
        <button class="button subtle" type="button" data-action="nav-view" data-view="community">Room</button>
        ${safety.showRetry ? `<button class="button subtle" type="button" data-action="retry-cloud-save">Retry save</button>` : `<button class="button subtle" type="button" data-action="jump-next-open" data-hole="${getNextOpenHole(round, selectedHole)}">Next hole</button>`}
      </div>
    </article>
  `;
}

function renderLeaderboardCard(state, round) {
  const summary = getRoundSummaryForState(state, round);
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
  const summary = getRoundSummaryForState(state, round);
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
      <section class="view-grid round-grid round-grid-start">
        ${renderCreateRoundCard(state, null)}
      </section>
    `;
  }

  const summary = getRoundSummaryForState(state, activeRound);

  return `
    <section class="view-grid round-grid round-grid-live">
      <div class="round-main-column">
        ${renderRoundSessionCard(state, activeRound, activeGroup)}
        ${renderHoleEditor(state, activeRound)}
      </div>
      <div class="round-side-column">
        <div class="round-support-stack">
          ${renderLeaderboardCard(state, activeRound)}
          ${renderRoundControlCard(state, activeRound)}
        </div>
        <div class="round-desktop-support">
          ${renderCompetitionLayerCard(summary)}
          ${renderCompetitivePreviewCard(
            state,
            state.session.selectedProfileId
              || activeRound.players.find((player) => !player.userId)?.profileId
              || state.currentUser.profileId,
            "Selected player matchup"
          )}
        </div>
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
  const selectedSummary = summaryRound ? getRoundSummaryForState(state, summaryRound) : null;
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
                  const summary = getRoundSummaryForState(state, round);
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
                <button class="button subtle" type="button" data-action="open-settings" data-section="integrations">Send feedback</button>
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
  const nearby = getNearbyDiscoveryState(state);
  const nearbyGames = nearby.games;
  const nearbyPlayers = nearby.players;
  const friendRows = nearby.friends;
  const featuredProfileId = state.session.selectedProfileId
    || activeRound?.players.find((player) => !player.userId)?.profileId
    || nearbyPlayers[0]?.profileId
    || state.currentUser.profileId;
  const inviteCode = activeGroup?.inviteCode || activeRound?.inviteCode || "";

  return `
    <section class="view-grid community-grid">
      <article class="card community-hero-card card-span-2 community-hub-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Community</p>
            <h3>Discover golfers and join rounds fast</h3>
          </div>
          <span class="status-pill">${escapeHtml(inviteCode || "No code yet")}</span>
        </div>
        <p class="body-copy compact-copy">Join with a code, find active golfers, or jump into nearby hosted rounds.</p>
        <div class="community-compact-badges">
          <span class="status-pill">Code fallback</span>
          <span class="status-pill">Nearby games</span>
          <span class="status-pill">Player cards</span>
        </div>
      </article>
      <details class="card discovery-card community-section-card" data-persist-key="community-join-options" open>
        <summary class="community-section-summary">
          <div>
            <p class="eyebrow">Join options</p>
            <h3>Code or quick join</h3>
          </div>
          <span>Open</span>
        </summary>
        <div class="community-section-body">
          <form class="inline-form round-join-form community-join-form" data-form="join-code">
            <label class="inline-grow">
              Invite code
              <input name="inviteCode" type="text" placeholder="Enter code" />
            </label>
            <button class="button primary" type="submit">Join round</button>
          </form>
          <div class="row-actions compact-actions community-action-row">
            ${inviteCode ? `<button class="button secondary" type="button" data-action="copy-invite-code" data-code="${inviteCode}">Copy code</button>` : ""}
            <button class="button subtle" type="button" data-action="invite-friends">Invite golfer</button>
            ${renderHelpLink("Joining guide", "playing-round", true)}
          </div>
        </div>
      </details>
      <details class="card discovery-card community-section-card" data-persist-key="community-nearby-players">
        <summary class="community-section-summary">
          <div>
            <p class="eyebrow">Nearby players</p>
            <h3>Active golfers now</h3>
          </div>
          <span>${nearbyPlayers.length}</span>
        </summary>
        <div class="community-section-body">
          ${renderNearbyPlayerRows(nearbyPlayers)}
        </div>
      </details>
      <details class="card discovery-card community-section-card" data-persist-key="community-nearby-games">
        <summary class="community-section-summary">
          <div>
            <p class="eyebrow">Nearby games</p>
            <h3>Hosted rounds to join</h3>
          </div>
          <span>${nearbyGames.length}</span>
        </summary>
        <div class="community-section-body">
          ${nearbyGames.length
            ? renderNearbyRoundRows(nearbyGames.slice(0, 4))
            : `
              <div class="empty-state compact-empty-state">
                <strong>No nearby rounds yet.</strong>
                <p>Invite code join stays ready any time.</p>
              </div>
            `}
        </div>
      </details>
      <details class="card discovery-card community-section-card" data-persist-key="community-friends">
        <summary class="community-section-summary">
          <div>
            <p class="eyebrow">Friends</p>
            <h3>People you golf with</h3>
          </div>
          <span>${friendRows.length || "Open"}</span>
        </summary>
        <div class="community-section-body">
          ${friendRows.length
            ? `
              <div class="stack-list compact-stack play-list">
                ${friendRows.map((friend) => `
                  <article class="list-row play-list-row">
                    <div>
                      <strong>${escapeHtml(friend.displayName)}</strong>
                      <p>${escapeHtml(friend.statusLabel)}</p>
                    </div>
                    <div class="list-metrics">
                      ${friend.canJoin ? `<button class="button secondary" type="button" data-action="quick-join-code" data-code="${friend.inviteCode}">Join</button>` : ""}
                      <button class="button subtle" type="button" data-action="select-profile-preview" data-profile-id="${escapeHtml(friend.profileId)}">View</button>
                    </div>
                  </article>
                `).join("")}
              </div>
            `
            : `
              <div class="empty-state compact-empty-state">
                <strong>No friend activity yet.</strong>
                <p>Follow golfers here to make repeat rounds faster.</p>
              </div>
            `}
        </div>
      </details>
      <article class="card discovery-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Social ranking</p>
            <h3>Compact competitive preview</h3>
          </div>
        </div>
        ${renderCompetitionLayerCard(activeRound ? getRoundSummaryForState(state, activeRound) : {
          friendLeaderboard: {
            title: "Friends leaderboard",
            entries: nearbyPlayers.slice(0, 3).map((player, index) => ({
              rank: index + 1,
              name: player.displayName,
              relationshipLabel: player.relationshipLabel,
              displayStatus: player.isLive ? "Live now" : player.statsSummary,
            })),
          },
          sideGame: null,
          tournamentScaffold: null,
        })}
      </article>
      ${renderCompetitivePreviewCard(state, featuredProfileId, featuredProfileId === state.currentUser.profileId ? "Your public matchup card" : "Selected golfer preview")}
      <article class="card card-span-2">
        <div class="summary-grid compact">
          <article>
            <span>Fallback</span>
            <strong>Join by code</strong>
          </article>
          <article>
            <span>Fast path</span>
            <strong>Nearby games</strong>
          </article>
          <article>
            <span>Player cards</span>
            <strong>Tap to compare</strong>
          </article>
        </div>
        <p class="body-copy compact-copy">Community keeps joining and discovery in one place so Score can stay focused on setup and scoring.</p>
        <div class="row-actions empty-state-actions">
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

export function renderAppTemplate(state) {
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
  const navActiveView = getNavActiveView(state);
  const activeViewLabel = state.session.activeView === "help"
    ? "Help"
    : state.session.activeView === "settings"
      ? "Settings"
    : VIEW_ORDER.find((view) => view.id === state.session.activeView)?.label || "Home";
  const activeTab = PRIMARY_NAV_TABS.find((view) => view.id === navActiveView);
  const transitionClass = `transition-${state.session.transitionDirection || "steady"}`;
  const shellClasses = ["app-shell", state.session.standaloneMode ? "is-standalone" : ""].filter(Boolean).join(" ");
  const screenStageClasses = ["screen-stage", state.session.activeView !== "home" ? "screen-stage--compact" : "", state.session.activeView === "round" ? "screen-stage--round" : ""]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="app ${shellClasses}" data-theme="${escapeHtml(appearance.themeId)}" data-color-mode="${escapeHtml(appearance.colorMode)}">
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
      <main class="content-shell main-content" id="appContent">
        ${renderAppShellHeader(state, activeRound, subscription)}
        ${renderLiveSessionStrip(activeRound, getActiveGroup(state, activeRound))}
        <section class="app-stage">
          ${renderGlobalFeedback(state)}
          ${renderScreenHeader(state, activeRound)}
          ${summaryRound && state.session.activeView === "stats" ? renderSummarySpotlight(state, summaryRound) : ""}
          <section
            class="${screenStageClasses}"
            id="app-screen-panel"
            role="tabpanel"
            ${activeTab ? `aria-labelledby="tab-${navActiveView}"` : `aria-label="${escapeHtml(activeViewLabel)}"`}
            data-view="${state.session.activeView}"
          >
            <div class="screen-panel view-shell ${transitionClass}" data-view="${state.session.activeView}" data-from-view="${state.session.previousView || state.session.activeView}">
              ${renderCurrentView(state)}
            </div>
          </section>
        </section>
      </main>
      <nav class="mobile-nav bottom-nav" aria-label="Primary" role="tablist">
        ${renderNav(state)}
      </nav>
    </div>
  `;
}
