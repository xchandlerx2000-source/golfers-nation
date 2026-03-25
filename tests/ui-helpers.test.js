import { describe, expect, it, vi } from "vitest";

import { createGroup, createRound } from "../src/domain/factories.js";
import { appendRoundAction, applyRoundActionEvent, createRoundActionEvent } from "../src/domain/round-sync.js";
import { createEmailAccount, loadAccountIntoState } from "../src/services/account-service.js";
import { createDefaultState } from "../src/state/default-state.js";
import { getFeatureGate, getNextOpenHole, getSyncPresentation, isModeLocked, renderAppTemplate } from "../src/ui/templates.js";

const currentUser = {
  id: "user-1",
  name: "Avery Brooks",
};

describe("ui helpers", () => {
  it("finds the next incomplete hole after the current selection", () => {
    const round = createRound({
      currentUser,
      courseName: "National Pines",
      teeBox: "Blue",
      weather: "Clear 72F",
      mode: "stroke",
      players: ["Avery Brooks", "Maya Chen"],
    });

    round.holes[1].entries[0].strokes = 4;
    round.holes[1].entries[1].strokes = 5;
    round.holes[2].entries[0].strokes = 3;

    expect(getNextOpenHole(round, 2)).toBe(3);
  });

  it("returns a reconnect warning when hosted sync goes stale", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-22T12:00:00.000Z"));

    const round = createRound({
      currentUser,
      courseName: "National Pines",
      teeBox: "Blue",
      weather: "Clear 72F",
      mode: "stroke",
      players: ["Avery Brooks", "Maya Chen"],
      syncTransport: "invite",
    });
    round.sync.state = "hosting";
    round.sync.lastEventAt = Date.now() - 60000;
    const group = createGroup({
      round,
      currentUser,
      inviteCode: "ABC123",
    });

    const presentation = getSyncPresentation(round, group);

    expect(presentation.tone).toBe("warning");
    expect(presentation.title).toBe("Reconnecting");
    expect(presentation.message).toContain("ABC123");

    vi.useRealTimers();
  });

  it("renders the live session strip with player names for an active hosted round", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "home";

    const round = createRound({
      currentUser: state.currentUser,
      courseName: "National Pines",
      teeBox: "Blue",
      weather: "Clear 72F",
      mode: "stroke",
      players: [state.currentUser.name, "Maya Chen"],
      syncTransport: "invite",
    });
    const group = createGroup({
      round,
      currentUser: state.currentUser,
      inviteCode: "ABC123",
    });

    state.rounds.unshift(round);
    state.groups.unshift(group);
    state.session.activeRoundId = round.id;

    const markup = renderAppTemplate(state);

    expect(markup).toContain('id="liveStrip"');
    expect(markup).toContain("ABC123");
    expect(markup).toContain("2 players");
    expect(markup).toContain("LIVE");
    expect(markup).toContain("Connected");
  });

  it("shows local-first trust messaging when live round backup needs a retry", () => {
    const round = createRound({
      currentUser,
      courseName: "National Pines",
      teeBox: "Blue",
      weather: "Clear 72F",
      mode: "stroke",
      players: ["Avery Brooks", "Maya Chen"],
      syncTransport: "invite",
    });
    const event = createRoundActionEvent({
      roundId: round.id,
      participantId: round.players[0].id,
      holeNumber: 1,
      patch: { strokes: 5 },
      actorUserId: currentUser.id,
      occurredAt: Date.now(),
    });
    applyRoundActionEvent(round, event);
    appendRoundAction(round, event);
    round.sync.saveState = "retry-needed";
    round.sync.lastSyncError = "Weak signal.";

    const presentation = getSyncPresentation(round, null);

    expect(presentation.tone).toBe("warning");
    expect(presentation.title).toBe("Saved on this phone");
    expect(presentation.message).toContain("safe here");
    expect(presentation.message).toContain("Retry");
  });

  it("locks premium scoring modes for free accounts", () => {
    expect(isModeLocked("match", { tier: "free" })).toBe(true);
    expect(isModeLocked("stroke", { tier: "free" })).toBe(false);
    expect(isModeLocked("scramble", { tier: "premium" })).toBe(false);
  });

  it("marks premium insights as unlocked for premium accounts", () => {
    expect(getFeatureGate("advanced-stats", { tier: "free" }).locked).toBe(true);
    expect(getFeatureGate("advanced-stats", { tier: "premium" }).locked).toBe(false);
    expect(getFeatureGate("player-comparison", { tier: "free" }).locked).toBe(true);
  });

  it("renders the help screen when help is opened before sign-in", () => {
    const state = createDefaultState();
    state.session.activeView = "help";
    state.session.helpSection = "playing-round";

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Answers that keep the app easy to understand.");
    expect(markup).toContain("Playing a Round");
  });

  it("shows the compact play-first home flow for a new authenticated golfer", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "New Golfer",
      email: "new@example.com",
      password: "swing123",
    });

    loadAccountIntoState(state, created.account.id);
    state.session.activeView = "home";

    const markup = renderAppTemplate(state);

    expect(markup).toContain("No round yet");
    expect(markup).toContain("Start Round");
    expect(markup).toContain("Join Game");
    expect(markup).toContain('data-action="open-community-join"');
    expect(markup).not.toContain("Active Game");
    expect(markup).not.toContain("Course Assist");
    expect(markup).not.toContain("Confirm course");
  });

  it("shows only Open Score and Invite on Home when an active round exists", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "home";

    const round = createRound({
      currentUser: state.currentUser,
      courseName: "Pebble Beach Golf Links",
      teeBox: "Blue",
      weather: "Clear 72F",
      mode: "stroke",
      players: [state.currentUser.name, "Maya Chen"],
      syncTransport: "invite",
      inviteCode: "ABC123",
    });
    const group = createGroup({
      round,
      currentUser: state.currentUser,
      inviteCode: "ABC123",
    });

    state.rounds.unshift(round);
    state.groups.unshift(group);
    state.session.activeRoundId = round.id;

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Open Score");
    expect(markup).toContain(">Invite<");
    expect(markup).not.toContain(">Start Round<");
    expect(markup).not.toContain(">Join Game<");
  });

  it("renders friend-first challenge actions in Community", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "community";

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Friends leaderboard");
    expect(markup).toContain("Challenge");
    expect(markup).toContain("Join now");
  });

  it("renders the seeded course picker inside round setup", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "round";
    state.rounds = [];
    state.groups = [];
    state.session.activeRoundId = null;
    state.session.roundSetup = {
      ...state.session.roundSetup,
      step: "course",
      courseMethod: "search",
      courseQuery: "California",
      selectedCourseId: "pebble-beach-california",
      selectedTeeBoxId: "pebble-beach-california-championship",
    };

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Step 1");
    expect(markup).toContain("Search course");
    expect(markup).toContain("Pebble Beach Golf Links");
    expect(markup).toContain("Selected");
    expect(markup).toContain('name="selectedCourseId" value="pebble-beach-california"');
  });

  it("preloads Golden Nugget for a brand-new golfer's first round", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Local Tester",
      email: "localtester@example.com",
      password: "swing123",
    });

    loadAccountIntoState(state, created.account.id);
    state.rounds = [];
    state.groups = [];
    state.session.activeRoundId = null;
    state.session.activeView = "round";

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Start a live round fast");
    expect(markup).toContain("Choose course");
    expect(markup).toContain("Use My Location");
    expect(markup).toContain("Search Course");
    expect(markup).toContain("Step 1 / 3");
  });

  it("renders the game mode step with the core golf formats", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "round";
    state.rounds = [];
    state.groups = [];
    state.session.activeRoundId = null;
    state.session.roundSetup = {
      ...state.session.roundSetup,
      step: "mode",
      mode: "stroke",
    };

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Choose game mode");
    expect(markup).toContain("Stroke Play");
    expect(markup).toContain("Match Play");
    expect(markup).toContain("Scramble");
    expect(markup).toContain("Skins");
    expect(markup).toContain("Stableford");
  });

  it("renders the live round waiting room for a hosted round before scoring starts", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "round";
    state.session.roundScreenMode = "lobby";
    state.rounds = [
      createRound({
        currentUser: state.currentUser,
        courseName: "Pebble Beach Golf Links",
        teeBox: "Championship",
        mode: "stroke",
        players: [state.currentUser.displayName],
        syncTransport: "invite",
        inviteCode: "PB1234",
      }),
    ];
    state.rounds[0].sync.state = "hosting";
    state.session.activeRoundId = state.rounds[0].id;

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Live Round");
    expect(markup).toContain("Share Invite");
    expect(markup).toContain("Start Scoring");
    expect(markup).toContain("Waiting for players");
  });

  it("shows the help center entry in the stats account area", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "stats";

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Help Center");
    expect(markup).toContain("Open Help Center");
  });

  it("shows a profile and settings action in the signed-in app header", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "home";

    const markup = renderAppTemplate(state);

    expect(markup).toContain("My Profile");
    expect(markup).toContain('data-action="open-settings"');
    expect(markup).toContain('data-destination="landing"');
  });

  it("renders the settings screen with appearance controls and keeps the parent tab active", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "settings";
    state.session.settingsDestination = "app";
    state.session.settingsSection = "appearance";
    state.session.settingsReturnView = "stats";
    state.currentUser.appearance = {
      ...(state.currentUser.appearance || {}),
      colorMode: "light",
      themeId: "ocean",
    };

    const markup = renderAppTemplate(state);

    expect(markup).toContain("App Settings");
    expect(markup).toContain("Mode");
    expect(markup).toContain("Theme");
    expect(markup).toContain("Display");
    expect(markup).toContain("Preview");
    expect(markup).toContain('data-active-theme-card="true"');
    expect(markup).toContain("Ember");
    expect(markup).toContain('data-theme="ocean"');
    expect(markup).toContain('data-color-mode="light"');
    expect(markup).not.toContain("Back to Profile");
    expect(markup).toContain('data-settings-destination-panel="app"');
    expect(markup).toContain('data-settings-section-panel="appearance"');
    expect(markup).toMatch(/id="tab-settings"[\s\S]*?aria-selected="true"/);
  });

  it("renders the community hub with grouped join and discovery sections", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "community";

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Join and discover");
    expect(markup).toContain("Join options");
    expect(markup).toContain("Nearby players");
    expect(markup).toContain("Nearby games");
    expect(markup).not.toContain("Live room");
  });

  it("opens the profile tab as the main account/settings home", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "settings";

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Golfer identity");
    expect(markup).toContain("My Profile");
    expect(markup).toContain("App Settings");
  });

  it("renders Spotify connection scaffolding only inside app settings and keeps round view clear", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "settings";
    state.session.settingsDestination = "app";
    state.session.settingsSection = "integrations";
    state.currentUser.integrations = {
      spotify: {
        status: "connected",
        controlsEnabled: true,
        playbackState: "playing",
        previewMode: true,
        deviceName: "This installed app",
        nowPlaying: {
          id: "lake-charles-loop",
          title: "Lake Charles Loop",
          artist: "Pin High FM",
          artworkLabel: "LC",
          artworkVariant: "ocean",
        },
      },
    };

    const settingsMarkup = renderAppTemplate(state);

    expect(settingsMarkup).toContain("Spotify companion");
    expect(settingsMarkup).toContain("Disconnect Spotify");
    expect(settingsMarkup).toContain("Lake Charles Loop");
    expect(settingsMarkup).toContain('data-action="spotify-open"');

    state.session.activeView = "round";
    state.rounds.unshift(
      createRound({
        currentUser: state.currentUser,
        courseName: "The Country Club at Golden Nugget",
        teeBox: "Gold",
        weather: "Humid 79F",
        mode: "stroke",
        players: [state.currentUser.name, "Maya Chen"],
      })
    );
    state.session.activeRoundId = state.rounds[0].id;

    const roundMarkup = renderAppTemplate(state);

    expect(roundMarkup).not.toContain("spotify-minibar");
    expect(roundMarkup).not.toContain("spotify-now-playing-bar");
    expect(roundMarkup).not.toContain('data-action="toggle-spotify-bar"');
  });

  it("renders the clean score stepper flow for the active golfer", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "round";
    state.rounds.unshift(
      createRound({
        currentUser: state.currentUser,
        courseName: "The Country Club at Golden Nugget",
        teeBox: "Gold",
        weather: "Humid 79F",
        mode: "stroke",
        players: [state.currentUser.name, "Maya Chen"],
      })
    );
    state.session.activeRoundId = state.rounds[0].id;

    const markup = renderAppTemplate(state);

    expect(markup).toContain('class="score-screen"');
    expect(markup).toContain("Hole 1");
    expect(markup).toContain('data-action="adjust-score"');
    expect(markup).toContain("Next Hole");
    expect(markup).toContain("Stats");
    expect(markup).toContain("Players");
    expect(markup).toContain("Leaderboard");
    expect(markup).toContain("Finish Round");
    expect(markup).not.toContain('class="hole-pill');
  });

  it("renders the in-app tester feedback form in app support settings", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "settings";
    state.session.settingsDestination = "app";
    state.session.settingsSection = "integrations";
    state.session.settingsReturnView = "stats";
    state.session.crashLog = {
      count: 1,
      lastCrashAt: "2026-03-24T06:30:00.000Z",
      latestStage: "window-error",
      latestMessage: "Boom",
      entries: [
        {
          id: "crash-123",
          createdAt: "2026-03-24T06:30:00.000Z",
          stage: "window-error",
          message: "Boom",
        },
      ],
    };

    const markup = renderAppTemplate(state);

    expect(markup).toContain('data-form="submit-tester-feedback"');
    expect(markup).toContain("Send tester feedback");
    expect(markup).toContain("Crash logs");
    expect(markup).toContain('data-action="copy-crash-report"');
    expect(markup).toContain("crash-123");
  });

  it("keeps join and nearby discovery available in community without an active round", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "No Round Yet",
      email: "noround@example.com",
      password: "swing123",
    });

    loadAccountIntoState(state, created.account.id);
    state.session.activeView = "community";
    state.session.activeRoundId = null;

    const markup = renderAppTemplate(state);

    expect(markup).toContain('data-form="join-code"');
    expect(markup).toContain("Nearby games");
    expect(markup).not.toContain("Live room");
  });

  it("disables finishing a round before any hole has been scored", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Careful Closer",
      email: "careful@example.com",
      password: "swing123",
    });

    loadAccountIntoState(state, created.account.id);
    state.session.activeView = "round";
    state.rounds.unshift(
      createRound({
        currentUser: state.currentUser,
        courseName: "National Pines",
        teeBox: "Blue",
        weather: "Clear 72F",
        mode: "stroke",
        players: [state.currentUser.name, "Maya Chen"],
      })
    );
    state.session.activeRoundId = state.rounds[0].id;

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Finish");
    expect(markup).toContain("0/18 played");
    expect(markup).toContain(`data-action="finish-round" data-round-id="${state.rounds[0].id}" disabled`);
  });

  it("shows retry guidance when a cloud round save has failed", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Retry Ready",
      email: "retry@example.com",
      password: "swing123",
    });

    loadAccountIntoState(state, created.account.id);
    state.session.cloudSync = {
      status: "failed",
      scope: "round-finish",
      roundId: "round-1",
      userId: created.account.id,
      errorMessage: "Network timed out before cloud backup finished.",
      lastAttemptAt: Date.now(),
      lastSuccessAt: 0,
      retryCount: 1,
    };

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Saved on this phone");
    expect(markup).toContain("Retry save");
  });

  it("shows the finish control as saving while a round backup is in progress", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Saving Golfer",
      email: "saving@example.com",
      password: "swing123",
    });

    loadAccountIntoState(state, created.account.id);
    state.session.activeView = "round";
    state.rounds.unshift(
      createRound({
        currentUser: state.currentUser,
        courseName: "National Pines",
        teeBox: "Blue",
        weather: "Clear 72F",
        mode: "stroke",
        players: [state.currentUser.name, "Maya Chen"],
      })
    );
    state.session.activeRoundId = state.rounds[0].id;
    state.rounds[0].holes[0].entries[0].strokes = 4;
    state.session.cloudSync = {
      status: "syncing",
      scope: "round-finish",
      roundId: state.rounds[0].id,
      userId: created.account.id,
      errorMessage: "",
      lastAttemptAt: Date.now(),
      lastSuccessAt: 0,
      retryCount: 0,
    };

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Saving...");
    expect(markup).toContain("1/18 played");
    expect(markup).toContain(`data-action="finish-round" data-round-id="${state.rounds[0].id}" disabled`);
  });

  it("shows visible round safety status inside live scoring when local changes are waiting on cloud backup", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Signal Watch",
      email: "signalwatch@example.com",
      password: "swing123",
    });

    loadAccountIntoState(state, created.account.id);
    state.session.activeView = "round";
    state.rounds.unshift(
      createRound({
        currentUser: state.currentUser,
        courseName: "The Country Club at Golden Nugget",
        teeBox: "Gold",
        weather: "Humid 79F",
        mode: "stroke",
        players: [state.currentUser.name, "Maya Chen"],
      })
    );
    state.session.activeRoundId = state.rounds[0].id;
    const event = createRoundActionEvent({
      roundId: state.rounds[0].id,
      participantId: state.rounds[0].players[0].id,
      holeNumber: 1,
      patch: { strokes: 4 },
      actorUserId: created.account.id,
      occurredAt: Date.now(),
    });
    applyRoundActionEvent(state.rounds[0], event);
    appendRoundAction(state.rounds[0], event);

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Saved locally");
    expect(markup).toContain("Room");
  });

  it("renders the mobile-first four-tab primary navigation", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "home";

    const markup = renderAppTemplate(state);

    expect(markup).toContain('id="tab-home"');
    expect(markup).toContain('id="tab-round"');
    expect(markup).toContain('id="tab-community"');
    expect(markup).toContain('id="tab-settings"');
    expect(markup).toContain('data-tab="home"');
    expect(markup).toContain('data-tab="score"');
    expect(markup).toContain("Home");
    expect(markup).toContain("Score");
    expect(markup).toContain("Profile");
  });

  it("renders testing tools inside app settings", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "settings";
    state.session.settingsDestination = "app";
    state.session.settingsSection = "testing";

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Developer tools");
    expect(markup).toContain("Reset local app data");
    expect(markup).toContain("Clear cached app");
  });
});
