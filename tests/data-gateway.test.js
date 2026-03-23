import { describe, expect, it, vi } from "vitest";

import { FEATURED_COURSE_ID } from "../src/config.js";
import { createRound } from "../src/domain/factories.js";
import { appendRoundAction, applyRoundActionEvent, createRoundActionEvent } from "../src/domain/round-sync.js";
import { createEmailAccount, loadAccountIntoState } from "../src/services/account-service.js";
import { createLocalDataGateway, createSupabaseDataGateway } from "../src/services/data-gateway.js";
import { createDefaultState } from "../src/state/default-state.js";
import { createStore } from "../src/state/store.js";

function createRemoteProfile(account, overrides = {}) {
  return {
    id: account.id,
    display_name: account.displayName,
    username: account.username,
    email: account.email,
    provider: account.provider,
    avatar_label: account.avatarLabel,
    avatar_url: account.avatarUrl || "",
    city: account.city || "",
    home_course: account.homeCourse || "",
    handicap: account.handicap,
    bio: account.bio || "",
    season_goal: account.seasonGoal || "Finish your first round",
    created_at: new Date(account.createdAt).toISOString(),
    subscription_tier: account.subscription.tier,
    appearance: account.appearance || {},
    social_settings: account.social || {},
    privacy: account.privacy || {},
    ...overrides,
  };
}

function createRemoteWorkspace(account, {
  courseName = "The Country Club at Golden Nugget",
  teeBox = "Gold",
  teeBoxId = "gnlc-gold",
  selectedHole = 3,
} = {}) {
  const round = createRound({
    currentUser: account,
    courseName,
    teeBox,
    teeBoxId,
    courseId: FEATURED_COURSE_ID,
    weather: "Humid 78F",
    mode: "stroke",
    players: [account.displayName, "Maya Chen"],
  });

  return {
    profiles: [
      {
        id: account.profileId,
        userId: account.id,
        publicProfile: {
          displayName: account.displayName,
          username: account.username,
          avatarLabel: account.avatarLabel,
          homeCourse: account.homeCourse,
          handicap: account.handicap,
          bio: account.bio,
        },
        publicStats: {
          roundsPlayed: 1,
          averageScore: 76,
          bestRound: 76,
          recentFormSummary: `${courseName} +4`,
        },
        account: {
          premiumStatus: account.subscription.tier,
          createdAt: account.createdAt,
        },
        privacy: account.privacy,
      },
    ],
    rounds: [round],
    groups: [],
    tournaments: [],
    gear: { items: [] },
    social: { activity: [] },
    userSession: {
      activeRoundId: round.id,
      selectedHole,
      summaryRoundId: null,
      selectedProfileId: account.profileId,
      roundSetup: {
        courseQuery: "",
        selectedCourseId: FEATURED_COURSE_ID,
        selectedTeeBoxId: teeBoxId,
      },
    },
  };
}

describe("supabase data gateway", () => {
  it("hydrates only the requested user's remote workspace and leaves other accounts untouched", async () => {
    const store = createStore(createDefaultState());
    let primaryAccountId = "";
    let secondaryAccountId = "";

    store.setState((draft) => {
      const primary = createEmailAccount(draft, {
        displayName: "Alex Rivers",
        email: "alex@example.com",
        password: "swing123",
      });
      const secondary = createEmailAccount(draft, {
        displayName: "Brooke Lane",
        email: "brooke@example.com",
        password: "swing123",
      });

      primaryAccountId = primary.account.id;
      secondaryAccountId = secondary.account.id;
      draft.accountVault[secondary.account.id].rounds.push(
        createRound({
          currentUser: secondary.account,
          courseName: "Brooke Hills",
          teeBox: "Blue",
          weather: "Clear 73F",
          mode: "stroke",
          players: [secondary.account.displayName, "Theo Grant"],
        })
      );
      return draft;
    });

    const primaryAccount = store.getState().accounts.find((account) => account.id === primaryAccountId);
    const bridge = {
      isConfigured: () => true,
      fetchWorkspace: vi.fn(async (userId) => ({
        profile: createRemoteProfile(primaryAccount),
        workspace: createRemoteWorkspace(primaryAccount),
        session: { access_token: "token" },
      })),
      upsertProfile: vi.fn(async () => ({ data: [{}] })),
      upsertWorkspace: vi.fn(async () => ({ data: [{}] })),
    };

    const gateway = createSupabaseDataGateway({
      bridge,
      fallback: createLocalDataGateway(),
    });

    await gateway.hydrateAccountAsync(store, primaryAccountId);

    const nextState = store.getState();
    expect(bridge.fetchWorkspace).toHaveBeenCalledWith(primaryAccountId);
    expect(nextState.auth.activeUserId).toBe(primaryAccountId);
    expect(nextState.currentUser.email).toBe("alex@example.com");
    expect(nextState.rounds).toHaveLength(1);
    expect(nextState.rounds[0].courseName).toBe("The Country Club at Golden Nugget");
    expect(nextState.accountVault[secondaryAccountId].rounds).toHaveLength(1);
    expect(nextState.accountVault[secondaryAccountId].rounds[0].courseName).toBe("Brooke Hills");
  });

  it("gives brand-new remote users a clean empty workspace and surfaces bootstrap sync warnings", async () => {
    const store = createStore(createDefaultState());
    let accountId = "";

    store.setState((draft) => {
      const created = createEmailAccount(draft, {
        displayName: "Casey Marsh",
        email: "casey@example.com",
        password: "swing123",
      });
      accountId = created.account.id;
      return draft;
    });

    const account = store.getState().accounts.find((entry) => entry.id === accountId);
    const bridge = {
      isConfigured: () => true,
      fetchWorkspace: vi.fn(async () => ({
        profile: createRemoteProfile(account),
        workspace: null,
        session: { access_token: "token" },
      })),
      upsertProfile: vi.fn(async () => ({ data: [{}] })),
      upsertWorkspace: vi.fn(async () => ({
        error: {
          status: 503,
          message: "Workspace bootstrap timed out.",
          code: "workspace_timeout",
        },
      })),
    };

    const gateway = createSupabaseDataGateway({
      bridge,
      fallback: createLocalDataGateway(),
    });

    const result = await gateway.hydrateAccountAsync(store, accountId);
    const nextState = store.getState();

    expect(result.status).toBe("ready");
    expect(result.syncWarning.message).toContain("Workspace bootstrap timed out");
    expect(nextState.auth.activeUserId).toBe(accountId);
    expect(nextState.currentUser.email).toBe("casey@example.com");
    expect(nextState.rounds).toHaveLength(0);
    expect(nextState.tournaments).toHaveLength(0);
    expect(nextState.session.roundSetup.selectedCourseId).toBe(FEATURED_COURSE_ID);
  });

  it("preserves a local round when cloud sync is pending instead of overwriting it with stale remote data", async () => {
    const store = createStore(createDefaultState());
    let accountId = "";

    store.setState((draft) => {
      const created = createEmailAccount(draft, {
        displayName: "Jordan Hale",
        email: "jordanhale@example.com",
        password: "swing123",
      });
      accountId = created.account.id;
      loadAccountIntoState(draft, accountId);
      draft.rounds = [
        createRound({
          currentUser: created.account,
          courseName: "The Country Club at Golden Nugget",
          teeBox: "Gold",
          teeBoxId: "gnlc-gold",
          courseId: FEATURED_COURSE_ID,
          weather: "Humid 80F",
          mode: "stroke",
          players: [created.account.displayName, "Maya Chen"],
          status: "completed",
        }),
      ];
      draft.session.summaryRoundId = draft.rounds[0].id;
      draft.session.cloudSync = {
        status: "failed",
        scope: "round-finish",
        roundId: draft.rounds[0].id,
        userId: accountId,
        errorMessage: "Network dropped during save.",
        lastAttemptAt: Date.now(),
        lastSuccessAt: 0,
        retryCount: 1,
      };
      return draft;
    });

    const account = store.getState().accounts.find((entry) => entry.id === accountId);
    const bridge = {
      isConfigured: () => true,
      fetchWorkspace: vi.fn(async () => ({
        profile: createRemoteProfile(account),
        workspace: {
          ...createRemoteWorkspace(account, { courseName: "Remote Stale Copy" }),
          rounds: [],
        },
        session: { access_token: "token" },
      })),
      upsertProfile: vi.fn(async () => ({ data: [{}] })),
      upsertWorkspace: vi.fn(async () => ({ data: [{}] })),
    };

    const gateway = createSupabaseDataGateway({
      bridge,
      fallback: createLocalDataGateway(),
    });

    const result = await gateway.hydrateAccountAsync(store, accountId);
    const nextState = store.getState();

    expect(result.preservedLocalWorkspace).toBe(true);
    expect(nextState.rounds).toHaveLength(1);
    expect(nextState.rounds[0].courseName).toBe("The Country Club at Golden Nugget");
    expect(bridge.upsertWorkspace).toHaveBeenCalledTimes(1);
  });

  it("preserves local live-round changes when the event queue is pending, even if cloudSync state looks idle", async () => {
    const store = createStore(createDefaultState());
    let accountId = "";

    store.setState((draft) => {
      const created = createEmailAccount(draft, {
        displayName: "Signal Safe",
        email: "signalsafe@example.com",
        password: "swing123",
      });
      accountId = created.account.id;
      loadAccountIntoState(draft, accountId);
      draft.rounds = [
        createRound({
          currentUser: created.account,
          courseName: "The Country Club at Golden Nugget",
          teeBox: "Gold",
          teeBoxId: "gnlc-gold",
          courseId: FEATURED_COURSE_ID,
          weather: "Humid 80F",
          mode: "stroke",
          players: [created.account.displayName, "Maya Chen"],
        }),
      ];
      const liveRound = draft.rounds[0];
      const event = createRoundActionEvent({
        roundId: liveRound.id,
        participantId: liveRound.players[0].id,
        holeNumber: 1,
        patch: { strokes: 4, putts: 2, gir: true },
        actorUserId: accountId,
        occurredAt: Date.now(),
      });
      applyRoundActionEvent(liveRound, event);
      appendRoundAction(liveRound, event);
      draft.session.cloudSync = {
        status: "idle",
        scope: "",
        roundId: null,
        userId: accountId,
        errorMessage: "",
        lastAttemptAt: 0,
        lastSuccessAt: 0,
        retryCount: 0,
      };
      return draft;
    });

    const account = store.getState().accounts.find((entry) => entry.id === accountId);
    const bridge = {
      isConfigured: () => true,
      fetchWorkspace: vi.fn(async () => ({
        profile: createRemoteProfile(account),
        workspace: {
          ...createRemoteWorkspace(account, { courseName: "Remote Older Copy" }),
          rounds: [],
        },
        session: { access_token: "token" },
      })),
      upsertProfile: vi.fn(async () => ({ data: [{}] })),
      upsertWorkspace: vi.fn(async () => ({ data: [{}] })),
    };

    const gateway = createSupabaseDataGateway({
      bridge,
      fallback: createLocalDataGateway(),
    });

    const result = await gateway.hydrateAccountAsync(store, accountId);
    const nextState = store.getState();

    expect(result.preservedLocalWorkspace).toBe(true);
    expect(nextState.rounds[0].holes[0].entries[0].strokes).toBe(4);
    expect(nextState.rounds[0].sync.pendingActionCount).toBe(1);
  });

  it("flushes round data to Supabase for the authenticated user only", async () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Devon Hart",
      email: "devon@example.com",
      password: "swing123",
    });

    loadAccountIntoState(state, created.account.id);
    state.rounds = [
      createRound({
        currentUser: created.account,
        courseName: "The Country Club at Golden Nugget",
        teeBox: "Gold",
        teeBoxId: "gnlc-gold",
        courseId: FEATURED_COURSE_ID,
        weather: "Humid 79F",
        mode: "stroke",
        players: [created.account.displayName, "Jordan Wells"],
      }),
    ];

    const bridge = {
      isConfigured: () => true,
      upsertProfile: vi.fn(async () => ({ data: [{}] })),
      upsertWorkspace: vi.fn(async () => ({ data: [{}] })),
    };

    const gateway = createSupabaseDataGateway({
      bridge,
      fallback: createLocalDataGateway(),
    });

    const result = await gateway.flushSyncAsync(state, created.account.id);

    expect(result.status).toBe("synced");
    expect(bridge.upsertProfile).toHaveBeenCalledTimes(1);
    expect(bridge.upsertWorkspace).toHaveBeenCalledTimes(1);
    expect(bridge.upsertWorkspace).toHaveBeenCalledWith(
      created.account.id,
      expect.objectContaining({
        rounds: expect.arrayContaining([
          expect.objectContaining({
            courseName: "The Country Club at Golden Nugget",
          }),
        ]),
      })
    );
  });

  it("submits tester feedback to Supabase for the authenticated golfer", async () => {
    const state = createDefaultState();
    const created = createEmailAccount(state, {
      displayName: "Taylor Quinn",
      email: "taylor@example.com",
      password: "swing123",
    });

    loadAccountIntoState(state, created.account.id);

    const bridge = {
      isConfigured: () => true,
      submitTesterFeedback: vi.fn(async () => ({ data: [{ id: 11 }] })),
    };

    const gateway = createSupabaseDataGateway({
      bridge,
      fallback: createLocalDataGateway(),
    });

    const result = await gateway.submitTesterFeedbackAsync(state, {
      testerName: "Taylor Quinn",
      email: "taylor@example.com",
      feedbackArea: "round",
      rating: "4",
      feedbackMessage: "Round flow felt clean on the phone.",
      appVersion: "0.1.0",
      planTier: "premium",
      installState: "standalone",
      appearanceMode: "dark",
      themeId: "forest",
      contextView: "round",
      recentActivity: "Finished hole 3",
      userAgent: "UnitTest",
    });

    expect(result.status).toBe("submitted");
    expect(bridge.submitTesterFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: created.account.id,
        feedback_area: "round",
        rating: 4,
        feedback_message: "Round flow felt clean on the phone.",
      })
    );
  });
});
