// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEY } from "../src/config.js";
import { createRound } from "../src/domain/factories.js";
import { createEmailAccount, hydrateActiveAccountState, loadAccountIntoState, prepareStateForPersistence } from "../src/services/account-service.js";
import { loadStoredState, persistState } from "../src/services/storage-service.js";
import { createDefaultState } from "../src/state/default-state.js";

function createFallbackState() {
  return {
    currentUser: {
      name: "Avery Brooks",
      city: "Chicago, IL",
      appearance: { colorMode: "system", themeId: "forest", textScale: "standard", compactMode: false, contrastMode: "standard" },
      privacy: { profileVisibility: "friends", showHomeCourse: true },
      social: {
        handles: { instagram: "", x: "", ghin: "" },
        allowProfileSharing: true,
        allowRoundSharing: true,
      },
      subscription: { tier: "free", billingReady: true },
    },
    gear: { items: [] },
    rounds: [],
    auth: { status: "authenticated", provider: "email", linkedProviders: ["email"] },
    session: { activeView: "home", selectedHole: 1 },
    social: { activity: [] },
  };
}

describe("storage service", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns fallback state when nothing is stored", () => {
    const loaded = loadStoredState(createFallbackState);

    expect(loaded.currentUser.name).toBe("Avery Brooks");
    expect(loaded.session.activeView).toBe("home");
  });

  it("persists and merges stored state with fallback defaults", () => {
    persistState({
      currentUser: { city: "Dallas, TX" },
      session: { activeView: "stats" },
      social: { activity: [{ id: "1" }] },
      gear: { items: [{ id: "gear-1" }] },
    });

    const loaded = loadStoredState(createFallbackState);

    expect(loaded.currentUser.name).toBe("Avery Brooks");
    expect(loaded.currentUser.city).toBe("Dallas, TX");
    expect(loaded.session.activeView).toBe("stats");
    expect(loaded.gear.items).toHaveLength(1);
  });

  it("preserves nested subscription defaults when older saved profiles are loaded", () => {
    persistState({
      currentUser: {
        name: "Avery Brooks",
        subscription: { tier: "premium" },
      },
    });

    const loaded = loadStoredState(createFallbackState);

    expect(loaded.currentUser.subscription.tier).toBe("premium");
    expect(loaded.currentUser.subscription.billingReady).toBe(true);
  });

  it("preserves nested appearance and social defaults when older saved profiles are loaded", () => {
    persistState({
      currentUser: {
        appearance: { themeId: "ocean" },
        privacy: { profileVisibility: "public" },
        social: {
          handles: { instagram: "@averygolf" },
        },
      },
    });

    const loaded = loadStoredState(createFallbackState);

    expect(loaded.currentUser.appearance.themeId).toBe("ocean");
    expect(loaded.currentUser.appearance.colorMode).toBe("system");
    expect(loaded.currentUser.appearance.textScale).toBe("standard");
    expect(loaded.currentUser.appearance.compactMode).toBe(false);
    expect(loaded.currentUser.appearance.contrastMode).toBe("standard");
    expect(loaded.currentUser.privacy.profileVisibility).toBe("public");
    expect(loaded.currentUser.privacy.showHomeCourse).toBe(true);
    expect(loaded.currentUser.social.handles.instagram).toBe("@averygolf");
    expect(loaded.currentUser.social.handles.x).toBe("");
    expect(loaded.currentUser.social.allowProfileSharing).toBe(true);
  });

  it("merges auth defaults when older saved sessions omit auth fields", () => {
    persistState({
      auth: {
        status: "authenticated",
      },
    });

    const loaded = loadStoredState(createFallbackState);

    expect(loaded.auth.status).toBe("authenticated");
    expect(loaded.auth.provider).toBe("email");
    expect(loaded.auth.linkedProviders).toEqual(["email"]);
  });

  it("falls back cleanly when stored JSON is invalid", () => {
    localStorage.setItem(STORAGE_KEY, "{not-json");

    const loaded = loadStoredState(createFallbackState);

    expect(loaded.session.selectedHole).toBe(1);
    expect(loaded.social.activity).toHaveLength(0);
  });

  it("falls back safely when local storage access throws during boot", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });

    const loaded = loadStoredState(createFallbackState);

    expect(loaded.currentUser.name).toBe("Avery Brooks");
    expect(loaded.session.activeView).toBe("home");

    getItemSpy.mockRestore();
  });

  it("does not throw when state persistence fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });

    expect(() => persistState({ session: { activeView: "home" } })).not.toThrow();

    setItemSpy.mockRestore();
  });

  it("restores the signed-in user and that user's rounds after reload", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Taylor Reed",
      email: "taylor@example.com",
      password: "swing123",
    });

    loadAccountIntoState(state, created.account.id);
    state.rounds.unshift(
      createRound({
        currentUser: state.currentUser,
        courseName: "Cedar Dunes",
        teeBox: "Blue",
        weather: "Clear 71F",
        mode: "stroke",
        players: [state.currentUser.name, "Maya Chen"],
      })
    );
    state.session.activeRoundId = state.rounds[0].id;

    persistState(prepareStateForPersistence(state));

    const restored = hydrateActiveAccountState(loadStoredState(createDefaultState));

    expect(restored.auth.activeUserId).toBe(created.account.id);
    expect(restored.auth.status).toBe("authenticated");
    expect(restored.currentUser.email).toBe("taylor@example.com");
    expect(restored.rounds).toHaveLength(1);
    expect(restored.rounds[0].courseName).toBe("Cedar Dunes");
  });
});
