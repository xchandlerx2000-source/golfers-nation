import { describe, expect, it } from "vitest";

import {
  authenticateEmailAccount,
  createDefaultAccountState,
  createEmailAccount,
  hydrateActiveAccountState,
  loadAccountIntoState,
  prepareStateForPersistence,
  saveWorkspaceToVault,
  signInWithMockProvider,
  signOutAccount,
  togglePremiumAccessForUser,
} from "../src/services/account-service.js";
import { createDefaultState } from "../src/state/default-state.js";

describe("account service", () => {
  it("seeds free and premium review accounts with stored workspaces", () => {
    const seeded = createDefaultAccountState();
    const freeAccount = seeded.accounts.find((account) => account.email === "free@golfersnation.demo");
    const premiumAccount = seeded.accounts.find((account) => account.email === "premium@golfersnation.demo");

    expect(freeAccount?.subscription.tier).toBe("free");
    expect(freeAccount?.roundsPlayed).toBeGreaterThan(0);
    expect(premiumAccount?.subscription.tier).toBe("premium");
    expect(seeded.accountVault[premiumAccount.id].rounds.length).toBeGreaterThan(0);
  });

  it("creates a new email account and loads it as the active user", () => {
    const state = createDefaultState();
    const result = createEmailAccount(state, {
      displayName: "Sam Carter",
      email: "sam@example.com",
      password: "swing123",
    });

    expect(result.error).toBeUndefined();
    expect(result.account.subscription.tier).toBe("premium");
    expect(state.accountVault[result.account.id].rounds).toHaveLength(0);
    expect(state.accountVault[result.account.id].tournaments).toHaveLength(0);

    const loaded = loadAccountIntoState(state, result.account.id);

    expect(loaded).toBe(true);
    expect(state.auth.status).toBe("authenticated");
    expect(state.currentUser.email).toBe("sam@example.com");
    expect(state.currentUser.roundsPlayed).toBe(0);
  });

  it("authenticates email users and provider review accounts", () => {
    const state = createDefaultState();
    const emailResult = authenticateEmailAccount(state, {
      email: "free@golfersnation.demo",
      password: "fairway123",
    });
    const passwordError = authenticateEmailAccount(state, {
      email: "free@golfersnation.demo",
      password: "wrong",
    });
    const appleResult = signInWithMockProvider(state, "apple");

    expect(emailResult.account.id).toBe("user-demo-free");
    expect(passwordError.error).toContain("password");
    expect(appleResult.account.provider).toBe("apple");
    expect(appleResult.account.subscription.tier).toBe("premium");
  });

  it("keeps profile changes attached to the signed in user when switching accounts", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Chris Vale",
      email: "chris@example.com",
      password: "swing123",
    });

    loadAccountIntoState(state, created.account.id);
    state.currentUser.name = "Chris Vale Updated";
    state.currentUser.displayName = "Chris Vale Updated";
    state.currentUser.username = "@chrisvale";
    saveWorkspaceToVault(state, created.account.id);
    signOutAccount(state);

    expect(state.auth.status).toBe("signed_out");

    loadAccountIntoState(state, "user-demo-free");
    expect(state.currentUser.displayName).toBe("Avery Brooks");

    loadAccountIntoState(state, created.account.id);
    expect(state.currentUser.displayName).toBe("Chris Vale Updated");
  });

  it("persists appearance, golf profile, and social settings per golfer account", () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Taylor Reed",
      email: "taylor-settings@example.com",
      password: "swing123",
    });

    loadAccountIntoState(state, created.account.id);
    state.currentUser.handedness = "Left-handed";
    state.currentUser.homeCourse = "Cedar Dunes";
    state.currentUser.appearance = {
      ...(state.currentUser.appearance || {}),
      colorMode: "light",
      themeId: "ocean",
      textScale: "large",
      compactMode: true,
      contrastMode: "high",
    };
    state.currentUser.social = {
      ...(state.currentUser.social || {}),
      handles: {
        ...(state.currentUser.social?.handles || {}),
        instagram: "@taylorreed",
        x: "@reedgolf",
        ghin: "GHIN-102",
      },
      allowProfileSharing: false,
      allowRoundSharing: true,
      allowFriendConnections: false,
    };

    saveWorkspaceToVault(state, created.account.id);
    signOutAccount(state);
    loadAccountIntoState(state, created.account.id);

    expect(state.currentUser.handedness).toBe("Left-handed");
    expect(state.currentUser.homeCourse).toBe("Cedar Dunes");
    expect(state.currentUser.appearance.colorMode).toBe("light");
    expect(state.currentUser.appearance.themeId).toBe("ocean");
    expect(state.currentUser.appearance.textScale).toBe("large");
    expect(state.currentUser.appearance.compactMode).toBe(true);
    expect(state.currentUser.appearance.contrastMode).toBe("high");
    expect(state.currentUser.social.handles.instagram).toBe("@taylorreed");
    expect(state.currentUser.social.handles.ghin).toBe("GHIN-102");
    expect(state.currentUser.social.allowProfileSharing).toBe(false);
    expect(state.currentUser.social.allowFriendConnections).toBe(false);
  });

  it("hydrates the last active user when a saved session is reopened", () => {
    const state = createDefaultState();
    state.auth.activeUserId = "user-demo-premium";

    const hydrated = hydrateActiveAccountState(state);

    expect(hydrated.auth.status).toBe("authenticated");
    expect(hydrated.currentUser.email).toBe("premium@golfersnation.demo");
    expect(hydrated.currentUser.subscription.tier).toBe("premium");
  });

  it("falls back to a signed-out safe state when the saved session cannot be restored", () => {
    const state = createDefaultState();
    state.auth.activeUserId = "user-missing";
    state.auth.status = "authenticated";

    const hydrated = hydrateActiveAccountState(state);

    expect(hydrated.auth.activeUserId).toBeNull();
    expect(hydrated.auth.status).toBe("signed_out");
    expect(hydrated.auth.notice).toContain("couldn't restore");
    expect(hydrated.session.activeView).toBe("home");
  });

  it("toggles premium access for the active user and keeps it attached to that account", () => {
    const state = createDefaultState();
    loadAccountIntoState(state, "user-demo-free");

    const upgraded = togglePremiumAccessForUser(state);
    expect(upgraded.subscription.tier).toBe("premium");
    expect(state.currentUser.subscription.tier).toBe("premium");

    saveWorkspaceToVault(state, "user-demo-free");
    signOutAccount(state);
    loadAccountIntoState(state, "user-demo-premium");
    expect(state.currentUser.subscription.tier).toBe("premium");

    loadAccountIntoState(state, "user-demo-free");
    expect(state.currentUser.subscription.tier).toBe("premium");

    const downgraded = togglePremiumAccessForUser(state);
    expect(downgraded.subscription.tier).toBe("free");
    expect(state.currentUser.subscription.tier).toBe("free");
  });

  it("does not persist transient feedback and score pulse state", () => {
    const state = createDefaultState();
    loadAccountIntoState(state, "user-demo-free");
    state.session.feedback = { tone: "success", title: "Saved", message: "Recent message" };
    state.session.pendingLabel = "Working";
    state.session.lastScoredParticipantId = "player-1";
    state.session.lastScoredHole = 4;
    state.session.lastScorePulseAt = 1234;

    const prepared = prepareStateForPersistence(state);

    expect(prepared.session.feedback).toBeNull();
    expect(prepared.session.pendingLabel).toBe("");
    expect(prepared.session.lastScoredParticipantId).toBeNull();
    expect(prepared.session.lastScoredHole).toBeNull();
    expect(prepared.session.lastScorePulseAt).toBe(0);
  });
});
