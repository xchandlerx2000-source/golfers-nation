import { createActivity, createGearItem, createRound, createTournament } from "./domain/factories.js";
import {
  appendRoundAction,
  applyRoundActionEvent,
  createRoundActionEvent,
  ensureRoundSyncScaffold,
  getPendingRoundEvents,
  markRoundEventsRetryNeeded,
  markRoundEventsSynced,
  markRoundEventsSyncing,
  workspaceHasPendingRoundSync,
} from "./domain/round-sync.js";
import { APP_VERSION, FEATURED_COURSE_ID, STORAGE_KEY, VIEW_ORDER } from "./config.js";
import { joinByInviteCode, hostRoundGroup } from "./services/mock-api.js";
import { ensureProfilesForNames, refreshProfileSnapshots, syncCurrentUserProfile } from "./services/player-service.js";
import { createProductPlatform } from "./services/product-platform.js";
import { createManualCourseSelection, createRoundCourseSelection, findCourseById, getDefaultTeeBox } from "./services/course-library.js";
import { createDefaultState } from "./state/default-state.js";
import { createStore } from "./state/store.js";
import { createRenderer } from "./ui/render.js";

function findRound(state, roundId) {
  return state.rounds.find((round) => round.id === roundId);
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

  if (joined.group) {
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

const APP_SHELL_CACHE_PREFIX = "golfers-nation-shell-";

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

  if (selectedTheme) {
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
          <img src="./icons/icon-192.png" alt="" width="56" height="56" />
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

function finishRound(draft, roundId, dataGateway) {
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

export function bootstrapApp({
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
    if (!roundId) {
      return;
    }

    Promise.resolve(realtimeSession.publishRoundUpdate(roundId))
      .catch((error) => {
        console.warn("[Golfers Nation] Live round publish failed. Continuing with local-safe state.", error);
      });
  };

  const finalizeHostedRoundSession = async (roundId) => {
    if (!roundId || typeof realtimeSession.hostRoundSession !== "function") {
      return;
    }

    let result = null;
    try {
      result = await realtimeSession.hostRoundSession(roundId);
    } catch (error) {
      console.warn("[Golfers Nation] Live host setup failed. Keeping the round on this device only.", error);
      result = {
        error: {
          message: "Live hosting is unavailable right now.",
        },
      };
    }
    if (!result?.error && result?.status !== "skipped-missing-table") {
      return;
    }

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
        "The round is still safe on this phone, but cross-device joining is unavailable until the live sync connection is ready."
      );
      return draft;
    }, { reason: "host-live-round-fallback" });
  };

  store.subscribe((state) => {
    try {
      platform.data.persist(platform.data.prepareForPersistence(state));
    } catch (error) {
      console.error("[Golfers Nation] Failed to persist app state.", error);
    }
    safeRender(state, "state-render");
    applyAppearanceToDocument(state);
    applyShellModeToDocument(state);
  });

  if (!safeRender(store.getState(), "initial-render")) {
    return { status: "failed", stage: "initial-render" };
  }
  applyAppearanceToDocument(store.getState());
  applyShellModeToDocument(store.getState());

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

  const updateRoundSyncDraft = (draft, roundId, updater) => {
    const round = findRound(draft, roundId);
    if (!round) {
      return null;
    }

    ensureRoundSyncScaffold(round);
    updater(round);
    return round;
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

        const existing = draft.groups.find((group) => group.roundId === round.id);
        if (existing) {
          round.inviteCode = existing.inviteCode;
          round.sync.transport = "invite";
          round.sync.label = "Invite code";
          round.sync.state = "hosting";
          round.sync.lastEventAt = Date.now();
          round.sync.note = "Invite code is live. The original host can leave and every joined golfer still keeps a safe local card.";
          appendActivity(draft, `${round.courseName} is already live with code ${existing.inviteCode}.`, "sync");
          setFeedback(draft, "info", "Invite code ready", `This round is already hosted. Share code ${existing.inviteCode} with the group.`);
          hostedRoundId = round.id;
          return draft;
        }

        const hosted = hostRoundGroup({ state: draft, round });
        round.inviteCode = hosted.inviteCode;
        round.groupId = hosted.group.id;
        round.sync.transport = "invite";
        round.sync.label = "Invite code";
        round.sync.state = "hosting";
        round.sync.lastEventAt = Date.now();
        round.sync.note = "Invite code is live. The original host can leave and every joined golfer still keeps a safe local card.";
        draft.groups.unshift(hosted.group);
        appendActivity(draft, `${round.courseName} is now hosted with invite code ${hosted.inviteCode}.`, "sync");
        setFeedback(draft, "success", "Round hosted", `Invite code ${hosted.inviteCode} is ready to share.`);
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
        draft.session.activeRoundId = actionElement.dataset.roundId;
        setActiveView(draft, "round", "focus-round");
        draft.session.selectedProfileId = draft.currentUser.profileId;
        draft.session.selectedHole = 1;
        return draft;
      }, { reason: "resume-round" });
      return;
    }

    if (action === "quick-join-code") {
      const code = actionElement.dataset.code;
      let liveJoinResult = null;
      if (typeof realtimeSession.joinRoundSession === "function") {
        try {
          liveJoinResult = await realtimeSession.joinRoundSession(code);
        } catch (error) {
          console.warn("[Golfers Nation] Live join failed. Checking local-safe fallbacks.", error);
          liveJoinResult = {
            error: {
              message: "Live join is unavailable right now.",
            },
          };
        }
      }
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
              ? "The live join service could not connect right now. Scoring still works on this device."
              : `Invite code ${code} did not match an active round.`
          );
          return draft;
        }

        upsertJoinedRoundIntoState(draft, joined);

        joined.round.sync.lastEventAt = Date.now();
        joined.round.sync.state = "connected";
        joined.round.sync.transport = joined.source === "local" ? "invite" : "cloud";
        joined.round.sync.label = joined.source === "local" ? "Invite code" : "Live cloud sync";
        joined.round.sync.note = "This device now carries its own safe copy of the live round, even if the original host leaves.";
        draft.session.activeRoundId = joined.round.id;
        draft.session.selectedProfileId = draft.currentUser.profileId;
        draft.session.selectedHole = 1;
        setActiveView(draft, "round", "focus-round");
        refreshProfileSnapshots(draft);
        appendActivity(draft, joined.notice, "sync");
        setFeedback(draft, "success", "Round joined", `${joined.round.courseName} is now open and ready for scoring.`);
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
        draft.session.activeRoundId = round.id;
        draft.session.selectedHole = 1;
        draft.session.selectedProfileId = draft.currentUser.profileId;
        setActiveView(draft, "round", "focus-round");
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
          const hosted = hostRoundGroup({ state: draft, round });
          round.inviteCode = hosted.inviteCode;
          round.groupId = hosted.group.id;
          round.sync.transport = "invite";
          round.sync.label = "Invite code";
          round.sync.state = "hosting";
          round.sync.lastEventAt = Date.now();
          round.sync.note = "Invite code is live. The original host can leave and every joined golfer still keeps a safe local card.";
          draft.groups.unshift(hosted.group);
          appendActivity(draft, `${round.courseName} hosted with code ${hosted.inviteCode}.`, "sync");
          setFeedback(
            draft,
            "success",
            "Round hosted",
            `Invite code ${hosted.inviteCode} is ready to share from the round screen.${playerSetup.note ? ` ${playerSetup.note}` : ""}`
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
      let liveJoinResult = null;
      if (code && typeof realtimeSession.joinRoundSession === "function") {
        try {
          liveJoinResult = await realtimeSession.joinRoundSession(code);
        } catch (error) {
          console.warn("[Golfers Nation] Live join failed. Keeping the join flow in local-safe mode.", error);
          liveJoinResult = {
            error: {
              message: "Live join is unavailable right now.",
            },
          };
        }
      }
      store.setState((draft) => {
        if (!code) {
          setFeedback(draft, "info", "Enter an invite code", "Ask the host for the round code, then enter it here to join the same live card.");
          return draft;
        }

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
              ? "The live join service could not connect right now. You can still use single-device rounds on this phone."
              : "Check the invite code and try again."
          );
          return draft;
        }

        upsertJoinedRoundIntoState(draft, joined);

        joined.round.sync.lastEventAt = Date.now();
        joined.round.sync.state = "connected";
        joined.round.sync.transport = joined.source === "local" ? "invite" : "cloud";
        joined.round.sync.label = joined.source === "local" ? "Invite code" : "Live cloud sync";
        joined.round.sync.note = "This device now carries its own safe copy of the live round, even if the original host leaves.";
        draft.session.activeRoundId = joined.round.id;
        draft.session.selectedHole = 1;
        draft.session.selectedProfileId = draft.currentUser.profileId;
        setActiveView(draft, "round", "focus-round");
        refreshProfileSnapshots(draft);
        appendActivity(draft, joined.notice, "sync");
        setFeedback(draft, "success", "Joined round", `${joined.round.courseName} is ready. Your own score entry is open first, and the rest of the group stays visible underneath.`);
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

export function startApp(options = {}) {
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
