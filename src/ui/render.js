import { createDefaultState } from "../state/default-state.js";
import { getDefaultCourseAdminReviewState } from "../state/course-state.js";
import { renderAppTemplate } from "./templates.js";

function getActiveRound(state) {
  return (state?.rounds || []).find((round) => round.id === state?.session?.activeRoundId) || null;
}

function getActiveGroup(state, round) {
  if (!round) {
    return null;
  }

  return (state?.groups || []).find((group) =>
    group.roundId === round.id
    || group.id === round.groupId
    || (round.inviteCode && group.inviteCode === round.inviteCode)
  ) || null;
}

const RENDER_FALLBACK_STATE = createDefaultState();

function createRenderableHole(number) {
  return {
    id: `render-hole-${number}`,
    number,
    par: 4,
    yards: "--",
    handicapIndex: null,
    notes: "",
    entries: [],
  };
}

function getRenderableHoles(round = {}) {
  if (Array.isArray(round?.holes) && round.holes.length) {
    return round.holes.map((hole, index) => ({
      id: hole?.id || `render-hole-${hole?.number || index + 1}`,
      number: Number.isFinite(Number(hole?.number)) ? Number(hole.number) : index + 1,
      par: Number.isFinite(Number(hole?.par)) ? Number(hole.par) : 4,
      yards: hole?.yards ?? "--",
      handicapIndex: hole?.handicapIndex ?? null,
      notes: hole?.notes || "",
      entries: Array.isArray(hole?.entries) ? hole.entries : [],
      ...hole,
      entries: Array.isArray(hole?.entries) ? hole.entries : [],
    }));
  }

  const holeCount = Number(round?.selectedHoleCount || round?.courseHoleCount || 18);
  return Array.from({ length: holeCount > 0 ? holeCount : 18 }, (_, index) => createRenderableHole(index + 1));
}

function normalizeRenderableRound(round = {}) {
  return {
    ...round,
    players: Array.isArray(round?.players) ? round.players : [],
    holes: getRenderableHoles(round),
    sides: Array.isArray(round?.sides) ? round.sides : [],
    sync: {
      label: "Local only",
      note: "Offline-first local data foundation.",
      transport: "local",
      state: "idle",
      ...(round?.sync || {}),
    },
  };
}

function normalizeRenderableGroup(group = {}) {
  return {
    ...group,
    members: Array.isArray(group?.members) ? group.members : [],
    feed: Array.isArray(group?.feed) ? group.feed : [],
  };
}

function getRenderableState(state = {}) {
  return {
    ...RENDER_FALLBACK_STATE,
    ...(state || {}),
    auth: {
      ...(RENDER_FALLBACK_STATE.auth || {}),
      ...(state?.auth || {}),
    },
    currentUser: {
      ...(RENDER_FALLBACK_STATE.currentUser || {}),
      ...(state?.currentUser || {}),
      privacy: {
        ...(RENDER_FALLBACK_STATE.currentUser?.privacy || {}),
        ...(state?.currentUser?.privacy || {}),
      },
      appearance: {
        ...(RENDER_FALLBACK_STATE.currentUser?.appearance || {}),
        ...(state?.currentUser?.appearance || {}),
      },
      social: {
        ...(RENDER_FALLBACK_STATE.currentUser?.social || {}),
        ...(state?.currentUser?.social || {}),
        handles: {
          ...(RENDER_FALLBACK_STATE.currentUser?.social?.handles || {}),
          ...(state?.currentUser?.social?.handles || {}),
        },
      },
      integrations: {
        ...(RENDER_FALLBACK_STATE.currentUser?.integrations || {}),
        ...(state?.currentUser?.integrations || {}),
        spotify: {
          ...(RENDER_FALLBACK_STATE.currentUser?.integrations?.spotify || {}),
          ...(state?.currentUser?.integrations?.spotify || {}),
        },
      },
      subscription: {
        ...(RENDER_FALLBACK_STATE.currentUser?.subscription || {}),
        ...(state?.currentUser?.subscription || {}),
      },
    },
    social: {
      ...(RENDER_FALLBACK_STATE.social || {}),
      ...(state?.social || {}),
      activity: Array.isArray(state?.social?.activity)
        ? state.social.activity
        : (RENDER_FALLBACK_STATE.social?.activity || []),
    },
    session: {
      ...(RENDER_FALLBACK_STATE.session || {}),
      ...(state?.session || {}),
      cloudSync: {
        ...(RENDER_FALLBACK_STATE.session?.cloudSync || {}),
        ...(state?.session?.cloudSync || {}),
      },
      nearby: {
        ...(RENDER_FALLBACK_STATE.session?.nearby || {}),
        ...(state?.session?.nearby || {}),
      },
      spotify: {
        ...(RENDER_FALLBACK_STATE.session?.spotify || {}),
        ...(state?.session?.spotify || {}),
      },
      crashLog: {
        ...(RENDER_FALLBACK_STATE.session?.crashLog || {}),
        ...(state?.session?.crashLog || {}),
      },
    },
    gear: {
      ...(RENDER_FALLBACK_STATE.gear || {}),
      ...(state?.gear || {}),
    },
    profiles: Array.isArray(state?.profiles) ? state.profiles : [],
    rounds: Array.isArray(state?.rounds) ? state.rounds.map((round) => normalizeRenderableRound(round)) : [],
    groups: Array.isArray(state?.groups) ? state.groups.map((group) => normalizeRenderableGroup(group)) : [],
    tournaments: Array.isArray(state?.tournaments) ? state.tournaments : [],
    accounts: Array.isArray(state?.accounts) ? state.accounts : (RENDER_FALLBACK_STATE.accounts || []),
    accountVault: state?.accountVault || RENDER_FALLBACK_STATE.accountVault || {},
  };
}

function getLiveSessionFromState(state) {
  const activeRound = getActiveRound(state);
  if (!activeRound) {
    return null;
  }

  const activeGroup = getActiveGroup(state, activeRound);
  const players = activeGroup?.members?.length
    ? activeGroup.members.map((member) => member.displayName).filter(Boolean)
    : activeRound.players.map((player) => player.name).filter(Boolean);
  const code = activeGroup?.inviteCode || activeRound.inviteCode || "---";

  return {
    code,
    players,
  };
}

function updateLiveSession(root, session) {
  const strip = root.querySelector("#liveStrip");
  if (!strip) {
    return;
  }

  if (!session) {
    strip.classList.add("hidden");
    return;
  }

  strip.classList.remove("hidden");

  const codeElement = root.querySelector("#liveCode");
  const playersElement = root.querySelector("#livePlayers");

  if (codeElement) {
    codeElement.textContent = session.code;
  }

  if (playersElement) {
    const playerCount = session.players.length || 1;
    playersElement.textContent = `${playerCount} ${playerCount === 1 ? "golfer" : "golfers"}`;
  }
}

const HARD_RESET_RENDER_REASONS = new Set([
  "create-round",
  "join-code",
  "resume-round",
  "finish-round",
  "end-round",
  "auth-login",
  "auth-signup",
  "sign-out",
]);

const LOCAL_SETTINGS_SYNC_REASONS = new Set([
  "initial-render",
  "open-settings",
  "open-current-profile",
  "render-tab",
  "nav-view",
  "auth-login",
  "auth-signup",
]);

function getScrollHost(root) {
  if (!root) {
    return null;
  }

  const doc = root.ownerDocument || document;
  const shellHost = root.querySelector("#appContent") || root.querySelector(".content-shell");
  const shellMode = doc?.body?.dataset?.appShellMode || "browser";

  if (shellMode === "standalone" && shellHost) {
    return shellHost;
  }

  return doc?.scrollingElement || doc?.documentElement || doc?.body || shellHost || null;
}

function capturePersistedDetailKeys(root) {
  if (!root) {
    return [];
  }

  return [...root.querySelectorAll("details[data-persist-key][open]")]
    .map((item) => String(item.dataset.persistKey || "").trim())
    .filter(Boolean);
}

function restorePersistedDetailKeys(root, detailKeys = []) {
  if (!root || !detailKeys.length) {
    return;
  }

  detailKeys.forEach((key) => {
    const detail = root.querySelector(`details[data-persist-key="${key}"]`);
    if (detail) {
      detail.open = true;
    }
  });
}

function enforceSingleOpenCommunitySection(root) {
  if (!root) {
    return;
  }

  const openSections = [...root.querySelectorAll(".community-section-card[open]")];
  if (openSections.length <= 1) {
    return;
  }

  openSections.slice(1).forEach((section) => {
    section.open = false;
  });
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

function normalizeLocalSettingsState(localUiState = {}, state = {}) {
  const destination = localUiState.settingsDestination || state?.session?.settingsDestination || "landing";
  const rawSection = localUiState.settingsSection || state?.session?.settingsSection || getDefaultSettingsSectionId(destination);
  const section = destination === "app" && (rawSection === "spotify" || rawSection === "app-support")
    ? "integrations"
    : rawSection;
  return {
    destination,
    section: destination === "landing" ? getDefaultSettingsSectionId("app") : section,
  };
}

function applyLocalUiOverrides(state = {}, localUiState = {}) {
  const nextState = {
    ...state,
    course: {
      ...(state?.course || {}),
    },
    session: {
      ...(state?.session || {}),
    },
  };

  if (typeof localUiState.appMenuOpen === "boolean") {
    nextState.session.appMenuOpen = localUiState.appMenuOpen;
  }

  if (localUiState.roundSetupFieldDrafts && Object.keys(localUiState.roundSetupFieldDrafts).length) {
    nextState.session.roundSetup = {
      ...(nextState.session?.roundSetup || {}),
      ...localUiState.roundSetupFieldDrafts,
    };
  }

  if (nextState.session.activeView === "settings") {
    const settingsState = normalizeLocalSettingsState(localUiState, nextState);
    nextState.session.settingsDestination = settingsState.destination;
    nextState.session.settingsSection = settingsState.section;
  }

  if (localUiState.courseAdminReview) {
    nextState.course.adminReview = {
      ...getDefaultCourseAdminReviewState(),
      ...(nextState.course?.adminReview || {}),
      ...(localUiState.courseAdminReview || {}),
    };
  }

  return nextState;
}

function captureActiveInputSnapshot(root) {
  const doc = root?.ownerDocument || document;
  const activeElement = doc?.activeElement;
  if (!activeElement || typeof activeElement.matches !== "function") {
    return null;
  }

  let selector = "";
  if (activeElement.matches("[data-course-search-input]")) {
    selector = '[data-course-search-input="true"]';
  } else if (activeElement.matches("[data-round-setup-field]")) {
    selector = `[data-round-setup-field="${String(activeElement.dataset.roundSetupField || "").trim()}"]`;
  } else {
    return null;
  }

  return {
    selector,
    start: typeof activeElement.selectionStart === "number" ? activeElement.selectionStart : null,
    end: typeof activeElement.selectionEnd === "number" ? activeElement.selectionEnd : null,
    direction: activeElement.selectionDirection || "none",
  };
}

function restoreActiveInputSnapshot(root, snapshot) {
  if (!root || !snapshot?.selector) {
    return;
  }

  const input = root.querySelector(snapshot.selector);
  if (!input || typeof input.focus !== "function") {
    return;
  }

  input.focus({ preventScroll: true });

  if (
    typeof input.setSelectionRange === "function"
    && typeof snapshot.start === "number"
    && typeof snapshot.end === "number"
  ) {
    input.setSelectionRange(snapshot.start, snapshot.end, snapshot.direction || "none");
  }
}

function applyLocalAppMenuUi(root, isOpen) {
  if (!root) {
    return;
  }

  const toggle = root.querySelector('[data-action="toggle-app-menu"]');
  const panel = root.querySelector("[data-app-menu-panel]");

  if (toggle) {
    toggle.classList.toggle("is-open", Boolean(isOpen));
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  if (panel) {
    panel.hidden = !isOpen;
  }
}

function applyLocalSettingsUi(root, localUiState = {}) {
  if (!root) {
    return;
  }

  const settingsRoot = root.querySelector("[data-settings-view-root]");
  if (!settingsRoot) {
    return;
  }

  const { destination, section } = normalizeLocalSettingsState(localUiState, {
    session: {
      settingsDestination: settingsRoot.dataset.settingsDestination || "landing",
      settingsSection: settingsRoot.dataset.settingsSection || "account",
    },
  });

  settingsRoot.dataset.settingsDestination = destination;
  settingsRoot.dataset.settingsSection = section;

  [...settingsRoot.querySelectorAll("[data-settings-destination-panel]")]
    .forEach((panel) => {
      panel.hidden = panel.dataset.settingsDestinationPanel !== destination;
    });

  [...settingsRoot.querySelectorAll('[data-action="set-settings-destination"]')]
    .forEach((button) => {
      const isActive = button.dataset.destination === destination;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

  [...settingsRoot.querySelectorAll("[data-settings-section-panel]")]
    .forEach((panel) => {
      const ownsDestination = panel.dataset.settingsDestinationOwner === destination;
      const isActive = ownsDestination && panel.dataset.settingsSectionPanel === section;
      panel.hidden = !isActive;
    });

  [...settingsRoot.querySelectorAll('[data-action="set-settings-section"]')]
    .forEach((button) => {
      const ownsDestination = button.dataset.destination === destination;
      const isActive = ownsDestination && button.dataset.section === section;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });
}

export function createRenderer(root) {
  const scrollPositions = new Map();
  let lastRenderedView = null;
  let pendingScrollRestore = 0;
  let lastSourceState = RENDER_FALLBACK_STATE;
  const localUiState = {
    appMenuOpen: false,
    settingsDestination: null,
    settingsSection: null,
    roundSetupFieldDrafts: {},
    courseAdminReview: getDefaultCourseAdminReviewState(),
  };

  function updateLocalUi(patch = {}) {
    let shouldRerender = false;

    if (Object.prototype.hasOwnProperty.call(patch, "appMenuOpen")) {
      localUiState.appMenuOpen = Boolean(patch.appMenuOpen);
      applyLocalAppMenuUi(root, localUiState.appMenuOpen);
    }

    const touchedSettings = Object.prototype.hasOwnProperty.call(patch, "settingsDestination")
      || Object.prototype.hasOwnProperty.call(patch, "settingsSection");
    if (touchedSettings) {
      if (Object.prototype.hasOwnProperty.call(patch, "settingsDestination")) {
        localUiState.settingsDestination = patch.settingsDestination || "landing";
      }

      if (Object.prototype.hasOwnProperty.call(patch, "settingsSection")) {
        localUiState.settingsSection = patch.settingsSection || getDefaultSettingsSectionId(localUiState.settingsDestination || "app");
      }

      if (localUiState.settingsDestination !== "landing" && !localUiState.settingsSection) {
        localUiState.settingsSection = getDefaultSettingsSectionId(localUiState.settingsDestination);
      }

      applyLocalSettingsUi(root, localUiState);
    }

    if (Object.prototype.hasOwnProperty.call(patch, "roundSetupFieldDrafts")) {
      localUiState.roundSetupFieldDrafts = {
        ...(patch.roundSetupFieldDrafts || {}),
      };
    }

    if (Object.prototype.hasOwnProperty.call(patch, "courseAdminReview")) {
      localUiState.courseAdminReview = {
        ...getDefaultCourseAdminReviewState(),
        ...(localUiState.courseAdminReview || {}),
        ...(patch.courseAdminReview || {}),
      };
      shouldRerender = true;
    }

    if (shouldRerender) {
      render(lastSourceState, { reason: "course-admin-local" });
    }
  }

  function closeTransientUi() {
    if (localUiState.appMenuOpen) {
      updateLocalUi({ appMenuOpen: false });
    }
  }

  function getLocalUiState() {
    return {
      ...localUiState,
      roundSetupFieldDrafts: {
        ...(localUiState.roundSetupFieldDrafts || {}),
      },
      courseAdminReview: {
        ...(localUiState.courseAdminReview || {}),
      },
    };
  }

  function render(state, meta = {}) {
    lastSourceState = state || RENDER_FALLBACK_STATE;
    const renderableState = getRenderableState(state);
    const nextView = renderableState.session?.activeView || "home";
    const sameView = lastRenderedView === nextView;
    const currentScrollHost = getScrollHost(root);
    const persistedDetailKeys = sameView ? capturePersistedDetailKeys(root) : [];
    const activeInputSnapshot = sameView ? captureActiveInputSnapshot(root) : null;

    if (nextView === "settings" && (
      localUiState.settingsDestination === null
      || LOCAL_SETTINGS_SYNC_REASONS.has(meta?.reason || "")
    )) {
      localUiState.settingsDestination = renderableState.session?.settingsDestination || "landing";
      localUiState.settingsSection = renderableState.session?.settingsSection
        || getDefaultSettingsSectionId(localUiState.settingsDestination);
    }

    if (LOCAL_SETTINGS_SYNC_REASONS.has(meta?.reason || "") || nextView !== lastRenderedView) {
      localUiState.appMenuOpen = false;
    }

    const uiRenderableState = applyLocalUiOverrides(renderableState, localUiState);

    if (currentScrollHost && lastRenderedView) {
      scrollPositions.set(lastRenderedView, {
        top: currentScrollHost.scrollTop,
        left: currentScrollHost.scrollLeft,
      });
    }

    root.innerHTML = renderAppTemplate(uiRenderableState);
    updateLiveSession(root, getLiveSessionFromState(uiRenderableState));
    applyLocalAppMenuUi(root, localUiState.appMenuOpen);
    applyLocalSettingsUi(root, localUiState);

    const nextScrollHost = getScrollHost(root);
    const shouldHardReset = HARD_RESET_RENDER_REASONS.has(meta?.reason || "");
    const nextScrollPosition = sameView && !shouldHardReset
      ? scrollPositions.get(nextView) || { top: 0, left: 0 }
      : (shouldHardReset ? { top: 0, left: 0 } : scrollPositions.get(nextView) || { top: 0, left: 0 });

    if (sameView) {
      restorePersistedDetailKeys(root, persistedDetailKeys);
    }

    enforceSingleOpenCommunitySection(root);

    if (pendingScrollRestore && typeof cancelAnimationFrame === "function") {
      cancelAnimationFrame(pendingScrollRestore);
      pendingScrollRestore = 0;
    }

    if (nextScrollHost) {
      const applyScrollPosition = () => {
        nextScrollHost.scrollTop = Number(nextScrollPosition.top || 0);
        nextScrollHost.scrollLeft = Number(nextScrollPosition.left || 0);
      };

      applyScrollPosition();
      if (typeof requestAnimationFrame === "function") {
        pendingScrollRestore = requestAnimationFrame(() => {
          applyScrollPosition();
          restoreActiveInputSnapshot(root, activeInputSnapshot);
          pendingScrollRestore = 0;
        });
      }
    }

    restoreActiveInputSnapshot(root, activeInputSnapshot);

    lastRenderedView = nextView;
  }

  render.updateLocalUi = updateLocalUi;
  render.closeTransientUi = closeTransientUi;
  render.getLocalUiState = getLocalUiState;

  return render;
}
