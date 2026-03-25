// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bootstrapApp } from "../src/main.js";
import { createRound } from "../src/domain/factories.js";
import { appendRoundAction, applyRoundActionEvent, createRoundActionEvent } from "../src/domain/round-sync.js";
import { createEmailAccount, loadAccountIntoState, prepareStateForPersistence } from "../src/services/account-service.js";
import { readCrashLogEntries } from "../src/services/crash-log-service.js";
import { persistState } from "../src/services/storage-service.js";
import { createDefaultState } from "../src/state/default-state.js";
import { createRenderer } from "../src/ui/render.js";

function createSuccessPlatform() {
  return {
    auth: {
      restoreSession(state) {
        return state;
      },
    },
    data: {
      loadInitialState(createDefaultStateFn) {
        return createDefaultStateFn();
      },
      prepareForPersistence(state) {
        return state;
      },
      persist() {},
      saveWorkspace() {},
    },
    realtime: {
      createSession() {
        return {
          connect() {},
          disconnect() {},
          publishRoundUpdate() {},
          enableNearbySync() {},
          enableBluetoothSync() {
            return Promise.resolve();
          },
          updateTransport() {},
        };
      },
    },
  };
}

function openRoundWizardForLocalRound() {
  document.querySelector('[data-action="nav-view"][data-view="round"]').click();
  document.querySelector('[data-action="choose-round-intent"][data-intent="local"]').click();
}

function clickRoundWizardNext() {
  document.querySelector('.round-setup-wizard-card [data-action="round-setup-step"][data-direction="1"]').click();
}

describe("bootstrap app", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="app">
        <div class="app-loading-shell">Loading</div>
      </div>
    `;
    localStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals?.();
  });

  it("replaces the loading shell with the real app UI on successful boot", () => {
    const result = bootstrapApp({
      root: document.querySelector("#app"),
      platformFactory: createSuccessPlatform,
      createDefaultStateFn: createDefaultState,
      rendererFactory: createRenderer,
      timeoutMs: 50,
    });

    expect(result.status).toBe("ready");
    expect(document.querySelector(".app-loading-shell")).toBeNull();
    expect(document.querySelector('[data-form="auth-login"]')).not.toBeNull();
    expect(document.body.dataset.appShellMode).toBe("browser");

    result.destroy();
  });

  it("boots into the entry screen with empty local data on the real startup path", () => {
    const result = bootstrapApp({
      root: document.querySelector("#app"),
      timeoutMs: 50,
    });

    expect(result.status).toBe("ready");
    expect(document.querySelector(".app-loading-shell")).toBeNull();
    expect(document.querySelector('[data-form="auth-login"]')).not.toBeNull();
    expect(result.store.getState().auth.status).toBe("signed_out");

    result.destroy();
  });

  it("restores a returning user session on app boot", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Taylor Reed",
      email: "taylor@example.com",
      password: "swing123",
    });
    loadAccountIntoState(state, created.account.id);
    persistState(prepareStateForPersistence(state));

    const result = bootstrapApp({
      root: document.querySelector("#app"),
      timeoutMs: 50,
    });

    expect(result.status).toBe("ready");
    expect(result.store.getState().auth.status).toBe("authenticated");
    expect(result.store.getState().currentUser.email).toBe("taylor@example.com");
    expect(document.querySelector('[data-action="open-settings"]')).not.toBeNull();

    result.destroy();
  });

  it("retries a pending cloud round save after restore so reloads are safer on weak networks", async () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Retry Restore",
      email: "retryrestore@example.com",
      password: "swing123",
    });
    loadAccountIntoState(state, created.account.id);
    state.session.cloudSync = {
      status: "failed",
      scope: "round-finish",
      roundId: "round-retry",
      userId: created.account.id,
      errorMessage: "Weak connection during the last save.",
      lastAttemptAt: Date.now(),
      lastSuccessAt: 0,
      retryCount: 1,
    };

    const flushSyncAsync = vi.fn().mockResolvedValue({ status: "synced" });
    const result = bootstrapApp({
      root: document.querySelector("#app"),
      platformFactory() {
        return {
          auth: {
            restoreSession(nextState) {
              return nextState;
            },
          },
          data: {
            loadInitialState() {
              return state;
            },
            prepareForPersistence(nextState) {
              return nextState;
            },
            persist() {},
            saveWorkspace() {},
            hydrateAccountAsync: vi.fn().mockResolvedValue({ status: "ready" }),
            flushSyncAsync,
          },
          realtime: {
            createSession() {
              return {
                connect() {},
                disconnect() {},
                publishRoundUpdate() {},
                enableNearbySync() {},
                enableBluetoothSync() {
                  return Promise.resolve();
                },
                updateTransport() {},
              };
            },
          },
        };
      },
      timeoutMs: 50,
    });

    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(flushSyncAsync).toHaveBeenCalled();
    expect(result.store.getState().session.cloudSync.status).toBe("idle");

    result.destroy();
  });

  it("restores an in-progress live round and retries queued live updates after reload", async () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Queued Live Round",
      email: "queuedlive@example.com",
      password: "swing123",
    });
    loadAccountIntoState(state, created.account.id);
    state.rounds = [
      createRound({
        currentUser: state.currentUser,
        courseName: "The Country Club at Golden Nugget",
        teeBox: "Gold",
        weather: "Humid 79F",
        mode: "stroke",
        players: [state.currentUser.name, "Maya Chen"],
      }),
    ];
    state.session.activeRoundId = state.rounds[0].id;
    state.session.selectedHole = 4;
    const event = createRoundActionEvent({
      roundId: state.rounds[0].id,
      participantId: state.rounds[0].players[0].id,
      holeNumber: 4,
      patch: { strokes: 5, penalties: 1 },
      actorUserId: created.account.id,
      occurredAt: Date.now(),
    });
    applyRoundActionEvent(state.rounds[0], event);
    appendRoundAction(state.rounds[0], event);
    persistState(prepareStateForPersistence(state));

    const flushSyncAsync = vi.fn().mockResolvedValue({ status: "synced" });
    const result = bootstrapApp({
      root: document.querySelector("#app"),
      platformFactory() {
        return {
          auth: {
            restoreSession(nextState) {
              return nextState;
            },
          },
          data: {
            loadInitialState() {
              return state;
            },
            prepareForPersistence(nextState) {
              return nextState;
            },
            persist() {},
            saveWorkspace() {},
            hydrateAccountAsync: vi.fn().mockResolvedValue({ status: "ready" }),
            flushSyncAsync,
          },
          realtime: {
            createSession() {
              return {
                connect() {},
                disconnect() {},
                publishRoundUpdate() {},
                enableNearbySync() {},
                enableBluetoothSync() {
                  return Promise.resolve();
                },
                updateTransport() {},
              };
            },
          },
        };
      },
      timeoutMs: 50,
    });

    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.store.getState().session.activeView).toBe("round");
    expect(result.store.getState().session.selectedHole).toBe(4);
    expect(flushSyncAsync).toHaveBeenCalled();
    expect(result.store.getState().rounds[0].sync.pendingActionCount).toBe(0);

    result.destroy();
  });

  it("returns to the auth entry screen after logout", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Jordan Miles",
      email: "jordan@example.com",
      password: "swing123",
    });
    loadAccountIntoState(state, created.account.id);
    persistState(prepareStateForPersistence(state));

    const result = bootstrapApp({
      root: document.querySelector("#app"),
      timeoutMs: 50,
    });

    document.querySelector('[data-action="open-settings"]').click();
    document.querySelector('[data-action="set-settings-destination"][data-destination="app"]').click();
    document.querySelector('[data-action="sign-out"]').click();

    expect(result.store.getState().auth.status).toBe("signed_out");
    expect(result.store.getState().auth.mode).toBe("login");
    expect(document.querySelector('[data-form="auth-login"]')).not.toBeNull();
    expect(document.body.textContent).toContain("Jordan Miles logged out.");
    expect(document.body.textContent).toContain("Log in below");

    result.destroy();
  });

  it("creates a premium-access tester account through the signup flow", () => {
    const result = bootstrapApp({
      root: document.querySelector("#app"),
      timeoutMs: 50,
    });

    document.querySelector('[data-action="set-auth-mode"][data-mode="signup"]').click();
    const form = document.querySelector('[data-form="auth-signup"]');
    form.querySelector('input[name="displayName"]').value = "Alicia Stone";
    form.querySelector('input[name="email"]').value = "alicia@example.com";
    form.querySelector('input[name="password"]').value = "swing123";
    form.requestSubmit(form.querySelector('button[type="submit"]'));

    expect(result.store.getState().auth.status).toBe("authenticated");
    expect(result.store.getState().currentUser.email).toBe("alicia@example.com");
    expect(result.store.getState().currentUser.subscription.tier).toBe("premium");
    expect(result.store.getState().session.feedback.message).toContain("premium tester access");

    result.destroy();
  });

  it("keeps rounds and settings isolated when switching between golfer accounts", () => {
    const state = createDefaultState();
    const first = createEmailAccount(state, {
      displayName: "Harper Reed",
      email: "harper@example.com",
      password: "swing123",
    });
    const second = createEmailAccount(state, {
      displayName: "Miles Ford",
      email: "miles@example.com",
      password: "swing123",
    });

    loadAccountIntoState(state, first.account.id);
    state.currentUser.appearance = {
      ...(state.currentUser.appearance || {}),
      themeId: "ocean",
    };
    const savedRound = createRound({
      currentUser: state.currentUser,
      courseName: "The Country Club at Golden Nugget",
      teeBox: "Gold",
      weather: "Humid 79F",
      mode: "stroke",
      players: [state.currentUser.name, "Maya Chen"],
      status: "completed",
    });
    state.rounds.unshift(savedRound);
    state.session.summaryRoundId = savedRound.id;
    persistState(prepareStateForPersistence(state));

    const result = bootstrapApp({
      root: document.querySelector("#app"),
      timeoutMs: 50,
    });

    expect(result.store.getState().currentUser.email).toBe("harper@example.com");
    expect(result.store.getState().rounds).toHaveLength(1);

    document.querySelector('[data-action="open-settings"]').click();
    document.querySelector('[data-action="set-settings-destination"][data-destination="app"]').click();
    document.querySelector('[data-action="sign-out"]').click();

    const loginForm = document.querySelector('[data-form="auth-login"]');
    loginForm.querySelector('input[name="email"]').value = "miles@example.com";
    loginForm.querySelector('input[name="password"]').value = "swing123";
    loginForm.requestSubmit(loginForm.querySelector('button[type="submit"]'));

    expect(result.store.getState().auth.status).toBe("authenticated");
    expect(result.store.getState().currentUser.email).toBe("miles@example.com");
    expect(result.store.getState().rounds).toHaveLength(0);
    expect(result.store.getState().currentUser.appearance.themeId).toBe("forest");

    result.destroy();
  });

  it("recovers a one-player round setup into a playable card", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Field Tester",
      email: "field@test.com",
      password: "swing123",
    });
    loadAccountIntoState(state, created.account.id);
    persistState(prepareStateForPersistence(state));

    const result = bootstrapApp({
      root: document.querySelector("#app"),
      timeoutMs: 50,
    });

    openRoundWizardForLocalRound();
    clickRoundWizardNext();
    clickRoundWizardNext();
    const playerInput = document.querySelector('[data-round-setup-field="players"]');
    playerInput.value = "Field Tester";
    playerInput.dispatchEvent(new Event("input", { bubbles: true }));
    clickRoundWizardNext();
    const form = document.querySelector('[data-form="create-round"]');
    form.requestSubmit(form.querySelector('button[type="submit"][name="intent"][value="local"]'));

    const currentState = result.store.getState();
    expect(currentState.session.activeRoundId).toBeTruthy();
    expect(currentState.rounds[0].players).toHaveLength(2);
    expect(currentState.session.feedback.message).toContain("A second golfer was added");

    result.destroy();
  });

  it("creates a round from a seeded real course and tee selection", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Course Tester",
      email: "course@test.com",
      password: "swing123",
    });
    loadAccountIntoState(state, created.account.id);
    persistState(prepareStateForPersistence(state));

    const result = bootstrapApp({
      root: document.querySelector("#app"),
      timeoutMs: 50,
    });

    openRoundWizardForLocalRound();
    const searchInput = document.querySelector('[data-course-search-input]');
    searchInput.value = "Pebble";
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
    document.querySelector('[data-action="select-course"][data-course-id="pebble-beach-california"]').click();

    const teeSelect = document.querySelector('[data-course-tee-select]');
    const alternateTeeId = teeSelect.querySelectorAll("option")[1].value;
    teeSelect.value = alternateTeeId;
    teeSelect.dispatchEvent(new Event("change", { bubbles: true }));

    clickRoundWizardNext();
    clickRoundWizardNext();
    clickRoundWizardNext();

    const form = document.querySelector('[data-form="create-round"]');
    form.requestSubmit(form.querySelector('button[type="submit"][name="intent"][value="local"]'));

    const round = result.store.getState().rounds[0];
    expect(round.courseId).toBe("pebble-beach-california");
    expect(round.courseName).toBe("Pebble Beach Golf Links");
    expect(round.teeBoxId).toBe(alternateTeeId);
    expect(round.holes[0].yards).toBeGreaterThan(300);

    result.destroy();
  });

  it("preserves scroll position during in-round score actions", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Scroll Tester",
      email: "scroll@test.com",
      password: "swing123",
    });
    loadAccountIntoState(state, created.account.id);
    persistState(prepareStateForPersistence(state));

    const result = bootstrapApp({
      root: document.querySelector("#app"),
      timeoutMs: 50,
    });

    openRoundWizardForLocalRound();
    clickRoundWizardNext();
    clickRoundWizardNext();
    clickRoundWizardNext();

    const form = document.querySelector('[data-form="create-round"]');
    form.requestSubmit(form.querySelector('button[type="submit"][name="intent"][value="local"]'));

    const scrollHost = document.scrollingElement || document.documentElement;
    scrollHost.scrollTop = 240;

    document.querySelector('[data-action="adjust-score"][data-direction="1"]').click();

    expect((document.scrollingElement || document.documentElement).scrollTop).toBe(240);

    result.destroy();
  });

  it("keeps score accordions open after in-place score edits", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Accordion Tester",
      email: "accordion@test.com",
      password: "swing123",
    });
    loadAccountIntoState(state, created.account.id);
    persistState(prepareStateForPersistence(state));

    const result = bootstrapApp({
      root: document.querySelector("#app"),
      timeoutMs: 50,
    });

    openRoundWizardForLocalRound();
    clickRoundWizardNext();
    clickRoundWizardNext();
    clickRoundWizardNext();

    const form = document.querySelector('[data-form="create-round"]');
    form.requestSubmit(form.querySelector('button[type="submit"][name="intent"][value="local"]'));

    const details = document.querySelector(".advanced-hole-stats");
    details.open = true;

    const puttsInput = document.querySelector('[data-score-field="putts"]');
    puttsInput.value = "2";
    puttsInput.dispatchEvent(new Event("change", { bubbles: true }));

    expect(document.querySelector(".advanced-hole-stats").open).toBe(true);

    result.destroy();
  });

  it("shows inline recovery guidance for a blank invite code submission", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Join Tester",
      email: "join@test.com",
      password: "swing123",
    });
    loadAccountIntoState(state, created.account.id);
    persistState(prepareStateForPersistence(state));

    const result = bootstrapApp({
      root: document.querySelector("#app"),
      timeoutMs: 50,
    });

    document.querySelector('[data-action="nav-view"][data-view="community"]').click();
    const form = document.querySelector('[data-form="join-code"]');
    form.requestSubmit(form.querySelector('button[type="submit"]'));

    expect(result.store.getState().session.feedback.title).toBe("Enter an invite code");
    expect(result.store.getState().session.feedback.message).toContain("Ask the host");

    result.destroy();
  });

  it("shows a recovery screen and retries back into the app when startup initially fails", () => {
    const reload = vi.fn();
    const removeItem = vi.fn();
    let attempts = 0;

    const result = bootstrapApp({
      root: document.querySelector("#app"),
      platformFactory: createSuccessPlatform,
      createDefaultStateFn: createDefaultState,
      rendererFactory(root) {
        attempts += 1;
        if (attempts === 1) {
          throw new Error("Renderer could not start.");
        }

        return createRenderer(root);
      },
      timeoutMs: 50,
      locationRef: { reload },
      storage: { removeItem },
    });

    expect(result.status).toBe("failed");
    expect(document.querySelector(".app-loading-shell")).toBeNull();
    expect(document.body.textContent).toContain("We couldn't finish opening the app.");

    document.querySelector('[data-boot-action="retry"]').click();
    expect(document.querySelector('[data-form="auth-login"]')).not.toBeNull();
    expect(reload).toHaveBeenCalledTimes(0);

    document.body.innerHTML = `
      <div id="app">
        <div class="app-loading-shell">Loading</div>
      </div>
    `;
    let resetAttempts = 0;
    const secondResult = bootstrapApp({
      root: document.querySelector("#app"),
      platformFactory: createSuccessPlatform,
      createDefaultStateFn: createDefaultState,
      rendererFactory(root) {
        resetAttempts += 1;
        if (resetAttempts === 1) {
          throw new Error("Renderer could not start.");
        }

        return createRenderer(root);
      },
      timeoutMs: 50,
      locationRef: { reload },
      storage: { removeItem },
    });
    document.querySelector('[data-boot-action="reset"]').click();
    expect(removeItem).toHaveBeenCalledWith("golfers-nation-platform-v2");
    expect(document.querySelector('[data-form="auth-login"]')).not.toBeNull();
    expect(reload).toHaveBeenCalledTimes(0);

    expect(secondResult.status).toBe("failed");
  });

  it("records a local crash log when startup fails before the app shell is ready", () => {
    const result = bootstrapApp({
      root: document.querySelector("#app"),
      platformFactory: createSuccessPlatform,
      createDefaultStateFn: createDefaultState,
      rendererFactory() {
        throw new Error("Renderer could not start.");
      },
      timeoutMs: 50,
    });

    expect(result.status).toBe("failed");
    expect(document.body.textContent).toContain("Crash log saved");

    const entries = readCrashLogEntries();
    expect(entries[0].stage).toBe("renderer-init");
    expect(entries[0].message).toBe("Renderer could not start.");
  });

  it("shows a runtime recovery screen when a later render fails after boot", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Runtime Guard",
      email: "runtimeguard@example.com",
      password: "swing123",
    });
    loadAccountIntoState(state, created.account.id);

    let renderCount = 0;
    const result = bootstrapApp({
      root: document.querySelector("#app"),
      platformFactory() {
        return {
          auth: {
            restoreSession(nextState) {
              return nextState;
            },
          },
          data: {
            loadInitialState() {
              return state;
            },
            prepareForPersistence(nextState) {
              return nextState;
            },
            persist() {},
            saveWorkspace() {},
          },
          realtime: {
            createSession() {
              return {
                connect() {},
                disconnect() {},
                publishRoundUpdate() {},
                enableNearbySync() {},
                enableBluetoothSync() {
                  return Promise.resolve();
                },
                updateTransport() {},
              };
            },
          },
        };
      },
      rendererFactory(root) {
        const baseRender = createRenderer(root);
        return (nextState) => {
          renderCount += 1;
          if (renderCount > 1) {
            throw new Error("Late screen render failure.");
          }
          baseRender(nextState);
        };
      },
      timeoutMs: 50,
    });

    expect(result.status).toBe("ready");

    result.store.setState((draft) => {
      draft.session.activeView = "community";
      return draft;
    }, { reason: "test-runtime-render-failure" });

    expect(document.body.textContent).toContain("This screen hit a problem.");
    expect(document.body.textContent).toContain("Go to Play");

    result.destroy();
  });

  it("previews appearance changes immediately and saves them to the golfer account", () => {
    const state = createDefaultState();
    loadAccountIntoState(state, "user-demo-free");
    persistState(prepareStateForPersistence(state));

    const result = bootstrapApp({
      root: document.querySelector("#app"),
      timeoutMs: 50,
    });

    document.querySelector('[data-action="open-settings"]').click();
    document.querySelector('[data-action="set-settings-destination"][data-destination="app"]').click();
    document.querySelector('[data-action="set-settings-section"][data-section="appearance"]').click();

    const appearanceForm = document.querySelector('[data-form="save-appearance-settings"]');
    const lightInput = appearanceForm.querySelector('input[name="colorMode"][value="light"]');
    const oceanInput = appearanceForm.querySelector('input[name="themeId"][value="ocean"]');
    const largeTextInput = appearanceForm.querySelector('input[name="textScale"][value="large"]');
    const compactInput = appearanceForm.querySelector('input[name="compactMode"]');
    const contrastInput = appearanceForm.querySelector('input[name="contrastMode"][value="high"]');

    lightInput.checked = true;
    lightInput.dispatchEvent(new Event("change", { bubbles: true }));
    oceanInput.checked = true;
    oceanInput.dispatchEvent(new Event("change", { bubbles: true }));
    largeTextInput.checked = true;
    largeTextInput.dispatchEvent(new Event("change", { bubbles: true }));
    compactInput.checked = true;
    compactInput.dispatchEvent(new Event("change", { bubbles: true }));
    contrastInput.checked = true;
    contrastInput.dispatchEvent(new Event("change", { bubbles: true }));

    expect(document.body.dataset.colorMode).toBe("light");
    expect(document.body.dataset.resolvedMode).toBe("light");
    expect(document.body.dataset.theme).toBe("ocean");
    expect(document.body.dataset.textScale).toBe("large");
    expect(document.body.dataset.density).toBe("compact");
    expect(document.body.dataset.contrast).toBe("high");
    expect(document.querySelector('[data-active-theme-name]').textContent).toBe("Ocean");
    expect(document.querySelector('[data-active-theme-card]').dataset.themePreview).toBe("ocean");

    appearanceForm.requestSubmit(appearanceForm.querySelector('button[type="submit"]'));

    expect(result.store.getState().currentUser.appearance.colorMode).toBe("light");
    expect(result.store.getState().currentUser.appearance.themeId).toBe("ocean");
    expect(result.store.getState().currentUser.appearance.textScale).toBe("large");
    expect(result.store.getState().currentUser.appearance.compactMode).toBe(true);
    expect(result.store.getState().currentUser.appearance.contrastMode).toBe("high");

    result.destroy();
  });

  it("switches settings destinations and sections locally without remounting the full view", () => {
    const state = createDefaultState();
    loadAccountIntoState(state, "user-demo-free");
    persistState(prepareStateForPersistence(state));

    let renderCount = 0;
    const result = bootstrapApp({
      root: document.querySelector("#app"),
      rendererFactory(root) {
        const baseRender = createRenderer(root);
        const wrappedRender = (nextState, meta) => {
          renderCount += 1;
          return baseRender(nextState, meta);
        };
        Object.assign(wrappedRender, baseRender);
        return wrappedRender;
      },
      timeoutMs: 50,
    });

    document.querySelector('[data-action="open-settings"]').click();
    const renderCountAfterOpen = renderCount;

    document.querySelector('[data-action="set-settings-destination"][data-destination="app"]').click();
    document.querySelector('[data-action="set-settings-section"][data-section="appearance"]').click();

    expect(renderCount).toBe(renderCountAfterOpen);
    expect(document.querySelector('[data-settings-destination-panel="app"]').hidden).toBe(false);
    expect(document.querySelector('[data-settings-section-panel="appearance"]').hidden).toBe(false);
    expect(document.querySelector('[data-settings-section-panel="account"]').hidden).toBe(true);

    result.destroy();
  });

  it("connects the Spotify companion scaffold from app settings without showing top-level controls", () => {
    const state = createDefaultState();
    loadAccountIntoState(state, "user-demo-free");
    persistState(prepareStateForPersistence(state));

    const result = bootstrapApp({
      root: document.querySelector("#app"),
      timeoutMs: 50,
    });

    document.querySelector('[data-action="open-settings"]').click();
    document.querySelector('[data-action="set-settings-destination"][data-destination="app"]').click();
    document.querySelector('[data-action="set-settings-section"][data-section="integrations"]').click();
    document.querySelector('[data-action="connect-spotify"]').click();

    expect(result.store.getState().currentUser.integrations.spotify.status).toBe("connected");
    expect(result.store.getState().currentUser.integrations.spotify.nowPlaying.title).toBe("Golden Hour Drive");
    expect(document.body.textContent).toContain("Spotify companion connected");
    expect(document.querySelector('[data-action="spotify-open"]')).not.toBeNull();

    document.querySelector('[data-action="nav-view"][data-view="round"]').click();
    expect(document.querySelector('[data-action="toggle-spotify-bar"]')).toBeNull();
    expect(document.querySelector(".spotify-minibar")).toBeNull();

    result.destroy();
  });

  it("submits tester feedback through the in-app cloud feedback flow", async () => {
    const submitTesterFeedbackAsync = vi.fn().mockResolvedValue({
      status: "submitted",
      record: { id: 1 },
    });

    const state = createDefaultState();
    loadAccountIntoState(state, "user-demo-free");
    persistState(prepareStateForPersistence(state));

    const result = bootstrapApp({
      root: document.querySelector("#app"),
      timeoutMs: 50,
    });

    result.platform.data.submitTesterFeedbackAsync = submitTesterFeedbackAsync;

    document.querySelector('[data-action="open-settings"]').click();
    document.querySelector('[data-action="set-settings-destination"][data-destination="app"]').click();
    document.querySelector('[data-action="set-settings-section"][data-section="integrations"]').click();

    const feedbackForm = document.querySelector('[data-form="submit-tester-feedback"]');
    feedbackForm.querySelector('textarea[name="feedbackMessage"]').value = "Round scoring felt great, but the join flow could be clearer.";
    feedbackForm.requestSubmit(feedbackForm.querySelector('button[type="submit"]'));

    await Promise.resolve();
    await Promise.resolve();

    expect(submitTesterFeedbackAsync).toHaveBeenCalledTimes(1);
    expect(submitTesterFeedbackAsync.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        feedbackArea: "other",
        feedbackMessage: "Round scoring felt great, but the join flow could be clearer.",
      })
    );
    expect(result.store.getState().session.feedback.title).toBe("Feedback sent");

    result.destroy();
  });
});
