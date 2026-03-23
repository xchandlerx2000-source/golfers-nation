import {
  ensureAccountWorkspace,
  loadAccountIntoState,
  prepareStateForPersistence,
  replaceAccountWorkspace,
  saveWorkspaceToVault,
  upsertRemoteAccount,
} from "./account-service.js";
import { workspaceHasPendingRoundSync } from "../domain/round-sync.js";
import { loadPersistedState, persistAppState } from "../state/persistence.js";
import { toBackendAccountRecord, toBackendWorkspaceSnapshot } from "./backend-models.js";

function getSnapshotUserId(snapshot) {
  return snapshot.auth?.activeUserId || snapshot.currentUser?.id || null;
}

export function createLocalDataGateway() {
  return {
    mode: "local-device-adapter",
    backendReady: true,
    loadInitialState(createDefaultState) {
      return loadPersistedState(createDefaultState);
    },
    prepareForPersistence(state) {
      return prepareStateForPersistence(state);
    },
    persist(snapshot) {
      persistAppState(snapshot);
      return snapshot;
    },
    saveWorkspace(draft, userId) {
      saveWorkspaceToVault(draft, userId);
      return draft;
    },
    exportWorkspaceSnapshot(state, userId) {
      return toBackendWorkspaceSnapshot(state, userId);
    },
    async submitTesterFeedbackAsync() {
      return {
        error: {
          status: 0,
          message: "Tester feedback needs the cloud data connection to be active first.",
          code: "feedback_not_configured",
        },
      };
    },
  };
}

export function createSupabaseDataGateway({ bridge, fallback = createLocalDataGateway() } = {}) {
  let syncTimer = null;
  let pendingSync = null;

  async function writeRemoteSnapshot(snapshot, userId) {
    if (!bridge?.isConfigured?.() || !userId) {
      return { status: "skipped" };
    }

    const account = (snapshot.accounts || []).find((entry) => entry.id === userId) || snapshot.currentUser || null;
    const workspace = snapshot.accountVault?.[userId] || null;

    if (!account || !workspace) {
      return { status: "skipped" };
    }

    const profileResult = await bridge.upsertProfile(toBackendAccountRecord(account));
    if (profileResult?.error) {
      return profileResult;
    }

    const workspaceResult = await bridge.upsertWorkspace(userId, workspace);
    if (workspaceResult?.error) {
      return workspaceResult;
    }

    return { status: "synced" };
  }

  function scheduleRemoteSync(snapshot, userId = getSnapshotUserId(snapshot)) {
    if (!bridge?.isConfigured?.() || !userId) {
      return;
    }

    pendingSync = {
      snapshot,
      userId,
    };

    if (syncTimer) {
      return;
    }

    syncTimer = setTimeout(async () => {
      const queued = pendingSync;
      pendingSync = null;
      syncTimer = null;

      if (!queued) {
        return;
      }

      const result = await writeRemoteSnapshot(queued.snapshot, queued.userId);
      if (result?.error) {
        console.warn("[Golfers Nation] Supabase workspace sync failed.", result.error);
      }
    }, 350);
  }

  return {
    mode: "supabase-cloud-adapter",
    backendReady: true,
    loadInitialState(createDefaultState) {
      return fallback.loadInitialState(createDefaultState);
    },
    prepareForPersistence(state) {
      return fallback.prepareForPersistence(state);
    },
    persist(snapshot) {
      fallback.persist(snapshot);
      scheduleRemoteSync(snapshot);
      return snapshot;
    },
    saveWorkspace(draft, userId) {
      fallback.saveWorkspace(draft, userId);
      scheduleRemoteSync(fallback.prepareForPersistence(draft), userId);
      return draft;
    },
    exportWorkspaceSnapshot(state, userId) {
      return fallback.exportWorkspaceSnapshot(state, userId);
    },
    async submitTesterFeedbackAsync(state, payload) {
      if (!bridge?.isConfigured?.()) {
        return fallback.submitTesterFeedbackAsync?.(state, payload);
      }

      const userId = state?.auth?.activeUserId || state?.currentUser?.id || null;
      const response = await bridge.submitTesterFeedback({
        user_id: userId,
        tester_name: payload.testerName,
        email: payload.email,
        feedback_area: payload.feedbackArea,
        rating: Number(payload.rating) || 3,
        feedback_message: payload.feedbackMessage,
        app_version: payload.appVersion,
        plan_tier: payload.planTier,
        install_state: payload.installState,
        appearance_mode: payload.appearanceMode,
        theme_id: payload.themeId,
        context_view: payload.contextView,
        recent_activity: payload.recentActivity,
        user_agent: payload.userAgent,
        created_at: new Date().toISOString(),
      });

      if (response?.error) {
        return response;
      }

      return {
        status: "submitted",
        record: Array.isArray(response?.data) ? response.data[0] || null : response?.data || null,
      };
    },
    async hydrateAccountAsync(store, userId = store.getState().auth?.activeUserId || store.getState().currentUser?.id) {
      if (!bridge?.isConfigured?.() || !userId) {
        return { status: "skipped" };
      }

      const remote = await bridge.fetchWorkspace(userId);
      if (remote?.error) {
        return remote;
      }

      const currentState = store.getState();
      const pendingCloudSync = currentState.session?.cloudSync || {};
      const preserveLocalWorkspace = pendingCloudSync.userId === userId
        && ["syncing", "failed"].includes(pendingCloudSync.status)
        || workspaceHasPendingRoundSync({
          rounds: currentState.rounds,
        });

      store.setState((draft) => {
        if (remote.profile) {
          upsertRemoteAccount(draft, {
            id: remote.profile.id,
            displayName: remote.profile.display_name,
            username: remote.profile.username,
            email: remote.profile.email,
            provider: remote.profile.provider,
            avatarLabel: remote.profile.avatar_label,
            avatarUrl: remote.profile.avatar_url,
            city: remote.profile.city,
            homeCourse: remote.profile.home_course,
            handicap: typeof remote.profile.handicap === "number" ? remote.profile.handicap : null,
            bio: remote.profile.bio,
            seasonGoal: remote.profile.season_goal,
            createdAt: remote.profile.created_at ? Date.parse(remote.profile.created_at) : Date.now(),
            tier: remote.profile.subscription_tier || "free",
            appearance: remote.profile.appearance || {},
            social: remote.profile.social_settings || {},
            privacy: remote.profile.privacy || {},
          });
        } else {
          ensureAccountWorkspace(draft, userId);
        }

        if (preserveLocalWorkspace) {
          saveWorkspaceToVault(draft, userId);
        }

        if (remote.workspace && !preserveLocalWorkspace) {
          replaceAccountWorkspace(draft, userId, remote.workspace);
        } else {
          ensureAccountWorkspace(draft, userId);
        }

        loadAccountIntoState(draft, userId);
        return draft;
      }, { reason: "hydrate-supabase-account" });

      let syncWarning = null;
      if (!remote.workspace || preserveLocalWorkspace) {
        const bootstrapSync = await this.flushSyncAsync(store.getState(), userId);
        if (bootstrapSync?.error) {
          syncWarning = bootstrapSync.error;
        }
      }

      return syncWarning
        ? { status: "ready", syncWarning, preservedLocalWorkspace: preserveLocalWorkspace }
        : { status: "ready", preservedLocalWorkspace: preserveLocalWorkspace };
    },
    async flushSyncAsync(state, userId = getSnapshotUserId(state)) {
      if (syncTimer) {
        clearTimeout(syncTimer);
        syncTimer = null;
      }

      if (pendingSync && !state) {
        const queued = pendingSync;
        pendingSync = null;
        return writeRemoteSnapshot(queued.snapshot, queued.userId);
      }

      const prepared = state ? fallback.prepareForPersistence(state) : null;
      pendingSync = null;
      return writeRemoteSnapshot(prepared, userId);
    },
  };
}
