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
    expect(presentation.title).toBe("Reconnect check");
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
    expect(markup).toContain("Players: Avery Brooks, Maya Chen");
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
    expect(presentation.title).toBe("Saved locally / retry needed");
    expect(presentation.message).toContain("safe on this phone");
    expect(presentation.message).toContain("original host leaves");
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

    expect(markup).toContain("No live round yet");
    expect(markup).toContain("Start Round");
    expect(markup).toContain("Join Game");
    expect(markup).toContain("Active Game");
    expect(markup).toContain("Nearby Players");
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
      courseQuery: "California",
      selectedCourseId: "pebble-beach-california",
      selectedTeeBoxId: "pebble-beach-california-championship",
    };

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Course library");
    expect(markup).toContain("Pebble Beach Golf Links");
    expect(markup).toContain("Selected course");
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

    expect(markup).toContain("The Country Club at Golden Nugget");
    expect(markup).toContain('name="selectedCourseId" value="golden-nugget-lake-charles"');
    expect(markup).toContain("Default local tester course");
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
    expect(markup).toContain("Appearance Mode");
    expect(markup).toContain("Theme Style");
    expect(markup).toContain("Display Comfort");
    expect(markup).toContain("Live preview");
    expect(markup).toContain('data-active-theme-card="true"');
    expect(markup).toContain("Ember");
    expect(markup).toContain('data-theme="ocean"');
    expect(markup).toContain('data-color-mode="light"');
    expect(markup).not.toContain("Log out account");
    expect(markup).toMatch(/id="tab-settings"[\s\S]*?aria-selected="true"/);
  });

  it("renders the community hub with nearby players and nearby games cards", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "community";

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Join fast and keep golfers visible");
    expect(markup).toContain("Nearby players");
    expect(markup).toContain("Nearby games");
    expect(markup).toContain("Nearby detection");
  });

  it("opens the profile tab as the main account/settings home", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "settings";

    const markup = renderAppTemplate(state);

    expect(markup).toContain("Choose the part of Profile you need right now");
    expect(markup).toContain("My Profile");
    expect(markup).toContain("App Settings");
  });

  it("renders Spotify connection scaffolding only inside app settings and keeps round view clear", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "settings";
    state.session.settingsDestination = "app";
    state.session.settingsSection = "spotify";
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
    expect(markup).toContain("Next Hole →");
  });

  it("renders the in-app tester feedback form in app support settings", () => {
    const state = createDefaultState();
    state.auth.status = "authenticated";
    state.auth.activeUserId = state.currentUser.id;
    state.session.activeView = "settings";
    state.session.settingsDestination = "app";
    state.session.settingsSection = "app-support";
    state.session.settingsReturnView = "stats";

    const markup = renderAppTemplate(state);

    expect(markup).toContain('data-form="submit-tester-feedback"');
    expect(markup).toContain("Send tester feedback");
  });

  it("disables community sync controls when there is no active round", () => {
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

    expect(markup).toContain('data-action="host-active-round" disabled');
    expect(markup).toContain("Location assist");
    expect(markup).toContain("Nearby sync mode");
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

    expect(markup).toContain("Score at least one hole first");
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

    expect(markup).toContain("Saved locally / retry needed");
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
    expect(markup).toContain("backing up to your golfer account");
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
    expect(markup).toContain("stored safely on this phone first and waiting for cloud backup");
    expect(markup).toContain("Open room tools");
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
    expect(markup).toContain('data-tab="play"');
    expect(markup).toContain('data-tab="score"');
    expect(markup).toContain("Play");
    expect(markup).toContain("Score");
    expect(markup).toContain("Profile");
  });
});
