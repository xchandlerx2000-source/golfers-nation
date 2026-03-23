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
import { getGearRecommendations, listNearbyGames, listNearbyPlayers } from "../services/mock-api.js";
import { getReviewAccounts } from "../services/account-service.js";
import { createManualCourseSelection, findCourseById, findTeeBox, getCourseQuickPicks, getDefaultTeeBox, getRoundSetupCourses } from "../services/course-library.js";
import { buildCompetitivePreview, buildPlayerComparison, getCurrentProfile, getProfileById, getProfileForPlayer } from "../services/player-service.js";
import { renderSpotifyNowPlayingBar, renderSpotifySettingsPanel } from "./spotify-controls.js";

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
