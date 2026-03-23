import {
  authenticateEmailAccount,
  createEmailAccount,
  ensureAccountWorkspace,
  getReviewAccounts,
  hydrateActiveAccountState,
  loadAccountIntoState,
  signInWithMockProvider,
  signOutAccount,
  togglePremiumAccessForUser,
  upsertRemoteAccount,
} from "./account-service.js";

function getProviderFromSupabaseUser(user = {}) {
  return user?.app_metadata?.provider
    || user?.identities?.[0]?.provider
    || user?.user_metadata?.provider
    || "email";
}

function mapSupabaseUserToAccountFields(user = {}, overrides = {}) {
  const metadata = user?.user_metadata || {};
  const displayName = overrides.displayName
    || metadata.display_name
    || metadata.full_name
    || String(user?.email || "").split("@")[0]
    || "Golfer";
  const provider = overrides.provider || getProviderFromSupabaseUser(user);

  return {
    id: user.id,
    displayName,
    email: user.email || overrides.email || "",
    provider,
    avatarUrl: metadata.avatar_url || "",
    createdAt: user.created_at ? Date.parse(user.created_at) : Date.now(),
    homeCourse: metadata.home_course || "",
    handicap: typeof metadata.handicap === "number" ? metadata.handicap : null,
    handedness: metadata.handedness || "",
    bio: metadata.bio || "",
    city: metadata.city || "",
    seasonGoal: metadata.season_goal || "Finish your first round",
  };
}

async function ensureResolvedUser(bridge, result) {
  if (result?.user?.id) {
    return result;
  }

  const current = await bridge.getCurrentUser();
  if (current.error) {
    return current;
  }

  return {
    ...result,
    user: current.user,
    session: result?.session || current.session || null,
  };
}

export function createLocalAuthGateway() {
  return {
    mode: "local-auth-adapter",
    backendReady: true,
    oauthProviders: ["google", "apple"],
    restoreSession(state) {
      return hydrateActiveAccountState(state);
    },
    signUpWithEmail(draft, fields) {
      const result = createEmailAccount(draft, fields);
      if (result.error) {
        return { error: result.error };
      }

      loadAccountIntoState(draft, result.account.id);
      return { account: result.account };
    },
    signInWithEmail(draft, fields) {
      const result = authenticateEmailAccount(draft, fields);
      if (result.error) {
        return { error: result.error };
      }

      loadAccountIntoState(draft, result.account.id);
      return { account: result.account };
    },
    signInWithProvider(draft, provider) {
      const result = signInWithMockProvider(draft, provider);
      if (result.error) {
        return { error: result.error };
      }

      loadAccountIntoState(draft, result.account.id);
      return { account: result.account };
    },
    signOut(draft) {
      signOutAccount(draft);
      return { status: "signed_out" };
    },
    useReviewAccount(draft, userId) {
      const loaded = loadAccountIntoState(draft, userId);
      if (!loaded) {
        return { error: "That review account is unavailable." };
      }

      return {
        account: draft.accounts.find((entry) => entry.id === userId) || null,
      };
    },
    togglePremiumForTesting(draft, userId) {
      const account = togglePremiumAccessForUser(draft, userId);
      if (!account) {
        return { error: "No active account is available." };
      }

      return { account };
    },
    listReviewAccounts(state) {
      return getReviewAccounts(state);
    },
  };
}

export function createSupabaseAuthGateway({ bridge, fallback = createLocalAuthGateway() } = {}) {
  return {
    ...fallback,
    mode: "supabase-auth-adapter",
    restoreSession(state) {
      const next = hydrateActiveAccountState(state);
      const storedSession = bridge?.readStoredSession?.();
      if (!storedSession?.user?.id) {
        return next;
      }

      const account = upsertRemoteAccount(next, mapSupabaseUserToAccountFields(storedSession.user));
      if (!account) {
        return next;
      }

      ensureAccountWorkspace(next, account.id);
      loadAccountIntoState(next, account.id);
      next.auth.notice = `${account.displayName} restored from secure sign-in.`;
      return next;
    },
    async signUpWithEmailAsync(state, fields) {
      const result = await bridge.signUpWithEmail(fields);
      if (result.error) {
        return {
          error: result.error.message || "Account creation failed.",
        };
      }

      const resolved = await ensureResolvedUser(bridge, result);
      if (resolved.error) {
        return {
          error: resolved.error.message || "Account creation failed.",
        };
      }

      return {
        accountFields: mapSupabaseUserToAccountFields(resolved.user, {
          displayName: fields.displayName,
          email: fields.email,
          provider: "email",
        }),
        requiresConfirmation: !resolved.session,
        notice: resolved.session
          ? ""
          : "Account created. Check your email to confirm the account before logging in, or disable email confirmations in Supabase for tester builds.",
      };
    },
    async signInWithEmailAsync(state, fields) {
      const result = await bridge.signInWithEmail(fields);
      if (result.error) {
        return {
          error: result.error.message || "Login failed.",
        };
      }

      const resolved = await ensureResolvedUser(bridge, result);
      if (resolved.error) {
        return {
          error: resolved.error.message || "Login failed.",
        };
      }

      return {
        accountFields: mapSupabaseUserToAccountFields(resolved.user, {
          email: fields.email,
          provider: "email",
        }),
        requiresConfirmation: false,
        notice: "",
      };
    },
    commitAuthResult(draft, result) {
      if (result?.error) {
        return { error: result.error };
      }

      if (result?.requiresConfirmation) {
        draft.auth.mode = "login";
        draft.auth.error = "";
        draft.auth.notice = result.notice;
        return { account: null, requiresConfirmation: true };
      }

      const account = upsertRemoteAccount(draft, result.accountFields);
      if (!account) {
        return { error: "We could not prepare the signed-in golfer account." };
      }

      ensureAccountWorkspace(draft, account.id);
      loadAccountIntoState(draft, account.id);
      return { account };
    },
    async requestPasswordResetAsync(email) {
      const result = await bridge.requestPasswordReset(email);
      if (result.error) {
        return {
          error: result.error.message || "Password reset could not be started.",
        };
      }

      return {
        status: "sent",
      };
    },
    async signOutAsync() {
      const result = await bridge.signOut();
      if (result?.error) {
        return { error: result.error.message || "Sign out failed." };
      }

      return { status: "signed_out" };
    },
  };
}
