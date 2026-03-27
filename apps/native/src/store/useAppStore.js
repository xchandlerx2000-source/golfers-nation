import { create } from "zustand";
import {
  createCourseServiceRequest,
  createTeeTimeRequest,
  createRound,
  GAME_MODES,
  getRoundSummary,
} from "@golfers-nation/core";
import {
  getCourseOnCourseServiceAccess,
  getCourseTeeTimeAccess,
  getDefaultCourseTeeBoxRecord,
} from "@golfers-nation/course";
import {
  DEMO_USER,
  RECOMMENDED_COURSES,
  STARTER_COURSES,
} from "../lib/seed-state";
import {
  buildCompletedRoundSummaries,
  normalizeCompletedRounds,
  summarizeCompletedRounds,
} from "../lib/round-history";
import {
  addFriendProfileId,
  buildCommunityFeed,
  buildDirectInbox,
  buildSocialCircle,
  buildSocialProfilePreview,
  createSocialPostRecord,
  ensureDirectConversation,
  mergeSocialProfiles,
  normalizeSocialState,
  toggleFollowedProfileIds,
  upsertDirectConversationMessage,
} from "../lib/social-state";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_PRIVACY,
  normalizeCurrentUser,
} from "../lib/account-state";
import {
  normalizeCourseServiceRequests,
  normalizeTeeTimeRequests,
} from "../lib/request-state";
import {
  applyRequestPersistenceResult,
  createLocalQueueItems,
  getCloudQueueItems,
  getRequestQueueNotice,
  mergeRequestById,
  mergeReviewQueue,
} from "../lib/request-review";
import {
  buildNativeRoundTemplate,
  findNearbyNativeCourses,
  getBundledRecommendedCourses,
  getRecentNativeCourses,
  loadNativeCourseById,
  prepareNativeCourseCatalog,
  recordRecentNativeCourse,
  searchNativeCourseCatalog,
} from "../services/native-course-service";
import { refreshNativeLocation } from "../services/native-location-service";
import {
  broadcastLiveMemberStateNative,
  broadcastLiveRoundSnapshotNative,
  clearNativeAppSession,
  createOnCourseServiceRequestNative,
  createTeeTimeRequestNative,
  fetchLiveRoundByCodeNative,
  joinRoundByCodeNative,
  listRequestReviewQueueNative,
  patchNativeAppSession,
  requestPasswordResetNative,
  revalidateNativeAuthSession,
  restoreNativeAuthSession,
  searchPlayerProfilesNative,
  signInWithEmailNative,
  signOutNative,
  signUpWithEmailNative,
  upsertCurrentUserProfileNative,
  writeNativeAppSession,
} from "../services/native-platform";
import {
  connectNativeRealtimeSession,
  disconnectNativeRealtimeSession,
} from "../services/native-realtime-session";

const DEFAULT_RECOMMENDED_COURSES = getBundledRecommendedCourses(6);
const DEFAULT_COURSE = DEFAULT_RECOMMENDED_COURSES[0] || STARTER_COURSES[0] || null;
const DEFAULT_SOCIAL_STATE = normalizeSocialState({
  currentUser: null,
  completedRounds: [],
});
const LIVE_SYNC_POLL_INTERVAL_MS = 12_000;
const LIVE_PRESENCE_INTERVAL_MS = 25_000;
const NATIVE_REALTIME_DEVICE_ID = `native-device-${Date.now()}`;

let liveSyncTimer = null;
let liveSyncInFlight = false;
let livePresenceTimer = null;
let livePresenceInFlight = false;

function mergeUniqueCourseRecords(...groups) {
  const merged = [];
  const seen = new Set();

  groups.flat().forEach((course) => {
    if (!course?.id || seen.has(course.id)) {
      return;
    }

    seen.add(course.id);
    merged.push(course);
  });

  return merged;
}

function getCourseById(courseId) {
  return STARTER_COURSES.find((course) => course.id === courseId)
    || DEFAULT_RECOMMENDED_COURSES.find((course) => course.id === courseId)
    || null;
}

async function buildRoundFromSetup(setup, currentUser, selectedCourse, options = {}) {
  const fallbackCourse = selectedCourse
    || getCourseById(setup.courseId)
    || DEFAULT_COURSE;
  const template = await buildNativeRoundTemplate(setup.courseId || fallbackCourse?.id, "", {
    holeCount: 18,
  });
  const course = template
    ? {
        id: template.courseId,
        displayName: template.displayName,
        courseName: template.courseName,
        clubName: template.clubName,
        city: template.city,
        state: template.state,
        country: template.country,
        region: template.region,
        address: template.address,
        latitude: template.latitude,
        longitude: template.longitude,
        metadata: template.metadata,
        teeBoxes: fallbackCourse?.teeBoxes || [],
      }
    : fallbackCourse;
  const teeBox = fallbackCourse?.teeBoxes?.[0] || getDefaultCourseTeeBoxRecord(fallbackCourse || {});
  const live = Boolean(options.live);

  return createRound({
    currentUser: currentUser || DEMO_USER,
    courseName: template?.courseName || course?.displayName || fallbackCourse?.displayName || "Golf course",
    teeBox: template?.teeBoxName || teeBox?.name || "Blue",
    teeBoxId: template?.teeBoxId || teeBox?.id || null,
    courseId: template?.courseId || course?.id || null,
    courseCity: template?.city || course?.city || "",
    courseState: template?.state || course?.state || "",
    courseCountry: template?.country || course?.country || "USA",
    courseAddress: template?.address || course?.address || "",
    courseRegion: template?.region || course?.region || "",
    courseLatitude: template?.latitude ?? course?.latitude ?? null,
    courseLongitude: template?.longitude ?? course?.longitude ?? null,
    courseSource: template?.source || course?.metadata?.source || course?.providerId || "native-course-catalog",
    courseMetadata: template?.metadata || course?.metadata || {},
    holesTemplate: template?.holes || course?.holes || [],
    selectedHoleCount: template?.selectedHoleCount || 18,
    courseRating: template?.rating ?? teeBox?.rating ?? null,
    courseSlope: template?.slope ?? teeBox?.slope ?? null,
    mode: setup.mode,
    players: [
      {
        profileId: (currentUser || DEMO_USER).profileId || (currentUser || DEMO_USER).id,
        userId: (currentUser || DEMO_USER).id,
        displayName: (currentUser || DEMO_USER).displayName,
        username: (currentUser || DEMO_USER).username,
        avatarLabel: (currentUser || DEMO_USER).avatarLabel,
      },
    ],
    syncTransport: live ? "cloud" : "local",
    inviteCode: live ? "GN18" : null,
  });
}

function updateRoundEntry(round, holeNumber, strokes) {
  return {
    ...round,
    holes: round.holes.map((hole) => {
      if (hole.number !== holeNumber) {
        return hole;
      }

      return {
        ...hole,
        entries: hole.entries.map((entry, index) =>
          index === 0
            ? {
                ...entry,
                strokes,
                updatedAt: Date.now(),
              }
            : entry
        ),
      };
    }),
    updatedAt: Date.now(),
  };
}

function isRoundScored(round) {
  return round.holes.every((hole) => {
    const ownerEntry = hole.entries[0];
    return Number(ownerEntry?.strokes) > 0;
  });
}

function createPersistedSession(currentUser, authMode = "local-demo") {
  return {
    signedIn: true,
    currentUser: normalizeCurrentUser(currentUser),
    authMode,
    restoredFrom: "native-storage",
  };
}

async function persistNativeStoreSession(sessionPatch = {}) {
  await patchNativeAppSession(sessionPatch);
}

function getSelectedCourseFromState(state) {
  if (state.selectedCourse?.id === state.setup.courseId) {
    return state.selectedCourse;
  }

  return state.courseResults.find((course) => course.id === state.setup.courseId)
    || getCourseById(state.setup.courseId)
    || state.selectedCourse
    || DEFAULT_COURSE;
}

function buildPersistedUserPatch(currentUser, overrides = {}) {
  return {
    currentUser: normalizeCurrentUser(currentUser),
    completedRounds: overrides.completedRounds,
    socialProfiles: overrides.socialProfiles,
    socialPosts: overrides.socialPosts,
    socialConversations: overrides.socialConversations,
    socialSettings: overrides.socialSettings,
    teeTimeRequests: overrides.teeTimeRequests,
    courseServiceRequests: overrides.courseServiceRequests,
  };
}

async function syncCurrentUserProfile(get, set, currentUser = get().currentUser) {
  if (!currentUser?.id) {
    return { status: "skipped" };
  }

  const stats = summarizeCompletedRounds(get().completedRounds, currentUser.id);
  const result = await upsertCurrentUserProfileNative({
    currentUser,
    stats,
    authMode: get().authMode,
  });

  if (result?.status === "persisted" && result.profile?.id) {
    set((state) => ({
      socialProfiles: mergeSocialProfiles(
        state.socialProfiles,
        [result.profile],
        currentUser.profileId || currentUser.id
      ),
    }));
  }

  return result;
}

function stopLiveSyncLoop() {
  if (liveSyncTimer) {
    clearInterval(liveSyncTimer);
    liveSyncTimer = null;
  }
}

function stopLivePresenceLoop() {
  if (livePresenceTimer) {
    clearInterval(livePresenceTimer);
    livePresenceTimer = null;
  }
}

function shouldApplyIncomingRound(currentRound, incomingRound) {
  if (!incomingRound) {
    return false;
  }

  if (!currentRound) {
    return true;
  }

  const currentUpdatedAt = Number(currentRound.updatedAt || 0);
  const incomingUpdatedAt = Number(incomingRound.updatedAt || 0);
  return incomingUpdatedAt > currentUpdatedAt;
}

function attachRealtimeSession(get, set, round) {
  if (!round?.inviteCode) {
    return;
  }

  void connectNativeRealtimeSession({
    inviteCode: round.inviteCode,
    deviceId: NATIVE_REALTIME_DEVICE_ID,
    handlers: {
      onStatus(status, notice) {
        set({
          liveSyncStatus: status,
          liveSyncNotice: notice || "",
        });
      },
      onRoundSnapshot(payload) {
        const incomingRound = payload?.session?.round || null;
        if (!incomingRound) {
          return;
        }

        const currentRound = get().activeRound;
        if (currentRound?.inviteCode !== incomingRound.inviteCode && currentRound?.inviteCode !== payload?.session?.inviteCode) {
          return;
        }

        if (shouldApplyIncomingRound(currentRound, incomingRound)) {
          set({
            activeRound: incomingRound,
            liveSyncStatus: "connected",
            liveSyncNotice: "Live round updated instantly.",
            lastLiveSyncAt: Date.now(),
          });
        }
      },
      onMemberState(payload) {
        if (payload?.inviteCode !== get().activeRound?.inviteCode) {
          return;
        }

        void get().refreshLiveRound(true);
      },
    },
  }).catch(() => {
    set({
      liveSyncStatus: "retry-needed",
      liveSyncNotice: "Realtime channel will retry. Backend reconcile stays active.",
    });
  });
}

function detachRealtimeSession() {
  disconnectNativeRealtimeSession();
}

async function publishLivePresence(get, set, { quiet = true } = {}) {
  const round = get().activeRound;
  const currentUser = get().currentUser || DEMO_USER;
  if (!round?.inviteCode || !currentUser?.id) {
    return { status: "skipped" };
  }

  try {
    const result = await broadcastLiveMemberStateNative({
      round,
      currentUser,
      deviceId: NATIVE_REALTIME_DEVICE_ID,
    });

    if (result?.error) {
      if (!quiet) {
        set({
          liveSyncStatus: "retry-needed",
          liveSyncNotice: result.error.message || "Live presence will retry.",
        });
      }
      return result;
    }

    set((state) => ({
      liveSyncStatus: state.liveSyncStatus === "local-only" ? "local-only" : "connected",
      liveSyncNotice: quiet ? state.liveSyncNotice : "Live room reattached.",
      lastLiveSyncAt: Date.now(),
    }));
    return result || { status: "connected" };
  } catch (error) {
    if (!quiet) {
      set({
        liveSyncStatus: "retry-needed",
        liveSyncNotice: error?.message || "Live presence will retry.",
      });
    }
    return { error };
  }
}

function startLiveSyncLoop(get, set) {
  stopLiveSyncLoop();

  liveSyncTimer = setInterval(async () => {
    if (liveSyncInFlight) {
      return;
    }

    const state = get();
    const round = state.activeRound;
    if (!round?.inviteCode) {
      stopLiveSyncLoop();
      return;
    }

    liveSyncInFlight = true;
    try {
      const remote = await fetchLiveRoundByCodeNative(round.inviteCode);
      if (remote?.session?.round && shouldApplyIncomingRound(get().activeRound, remote.session.round)) {
        set({
          activeRound: remote.session.round,
          liveSyncStatus: "connected",
          liveSyncNotice: "Live round reconciled from the shared session.",
          lastLiveSyncAt: Date.now(),
        });
      }
    } catch {
      set({
        liveSyncStatus: "retry-needed",
        liveSyncNotice: "Live updates will retry when the backend is reachable.",
      });
    } finally {
      liveSyncInFlight = false;
    }
  }, LIVE_SYNC_POLL_INTERVAL_MS);
}

function startLivePresenceLoop(get, set) {
  stopLivePresenceLoop();

  livePresenceTimer = setInterval(async () => {
    if (livePresenceInFlight) {
      return;
    }

    const round = get().activeRound;
    if (!round?.inviteCode) {
      stopLivePresenceLoop();
      return;
    }

    livePresenceInFlight = true;
    try {
      await publishLivePresence(get, set, { quiet: true });
    } finally {
      livePresenceInFlight = false;
    }
  }, LIVE_PRESENCE_INTERVAL_MS);
}

export const useAppStore = create((set, get) => ({
  bootStatus: "idle",
  signedIn: false,
  currentUser: null,
  authMode: "local-demo",
  authError: "",
  authNotice: "",
  authBusy: false,
  sessionRestoredFrom: "",
  authHealthStatus: "idle",
  authHealthNotice: "",
  sessionExpiresAt: 0,
  lastAuthCheckAt: 0,
  setup: {
    courseId: DEFAULT_COURSE?.id || null,
    courseQuery: "",
    mode: "stroke",
  },
  courseResults: DEFAULT_RECOMMENDED_COURSES,
  courseResultsStatus: "idle",
  courseResultsSource: "starter",
  courseCatalogNotice: "",
  homeNearbyCourses: [],
  homeNearbyStatus: "idle",
  homeNearbyNotice: "",
  nearbyLocation: null,
  nearbyLocationStatus: "idle",
  nearbyLocationSource: "",
  nearbyLocationNotice: "",
  selectedCourse: DEFAULT_COURSE,
  completedRounds: [],
  socialProfiles: DEFAULT_SOCIAL_STATE.socialProfiles,
  socialPosts: DEFAULT_SOCIAL_STATE.socialPosts,
  socialConversations: DEFAULT_SOCIAL_STATE.socialConversations,
  socialSettings: DEFAULT_SOCIAL_STATE.socialSettings,
  socialDiscoveryQuery: "",
  socialDiscoveryResults: [],
  socialDiscoveryStatus: "idle",
  socialDiscoveryNotice: "",
  teeTimeRequests: [],
  courseServiceRequests: [],
  requestReviewQueue: [],
  requestReviewQueueStatus: "idle",
  requestReviewQueueNotice: "",
  activeRound: null,
  joinedCode: "",
  recentInviteCode: "",
  liveSyncStatus: "idle",
  liveSyncNotice: "",
  lastLiveSyncAt: 0,
  restoreSession: async () => {
    if (get().bootStatus === "ready") {
      return;
    }

    set({ bootStatus: "restoring" });
    const restored = await restoreNativeAuthSession();
    if (restored?.signedIn && restored?.currentUser) {
      const currentUser = normalizeCurrentUser(restored.currentUser);
      const socialState = normalizeSocialState({
        currentUser,
        completedRounds: restored.completedRounds || [],
        socialProfiles: restored.socialProfiles,
        socialPosts: restored.socialPosts,
        socialConversations: restored.socialConversations,
        socialSettings: restored.socialSettings,
      });
      set({
        bootStatus: "ready",
        signedIn: true,
        currentUser,
        authMode: restored.authMode || "local-demo",
        sessionRestoredFrom: restored.restoredFrom || "",
        authHealthStatus: restored.authMode === "supabase" ? "active" : "local",
        authHealthNotice: restored.authMode === "supabase" ? "Cloud session active." : "Local tester session active.",
        sessionExpiresAt: Number(restored.sessionExpiresAt || 0),
        completedRounds: normalizeCompletedRounds(restored.completedRounds || []),
        socialProfiles: socialState.socialProfiles,
        socialPosts: socialState.socialPosts,
        socialConversations: socialState.socialConversations,
        socialSettings: socialState.socialSettings,
        teeTimeRequests: normalizeTeeTimeRequests(restored.teeTimeRequests),
        courseServiceRequests: normalizeCourseServiceRequests(restored.courseServiceRequests),
        lastAuthCheckAt: Date.now(),
        authNotice: restored.restoredFrom === "supabase" ? "Session restored." : "",
        homeNearbyCourses: [],
        homeNearbyStatus: "idle",
        homeNearbyNotice: "",
        socialDiscoveryQuery: "",
        socialDiscoveryResults: [],
        socialDiscoveryStatus: "idle",
        socialDiscoveryNotice: "",
      });
      return;
    }

    const socialState = normalizeSocialState({
      currentUser: null,
      completedRounds: [],
    });
    set({
      bootStatus: "ready",
      signedIn: false,
      currentUser: null,
      sessionRestoredFrom: "",
      authHealthStatus: "signed-out",
      authHealthNotice: "",
      sessionExpiresAt: 0,
      completedRounds: [],
      socialProfiles: socialState.socialProfiles,
      socialPosts: socialState.socialPosts,
      socialConversations: socialState.socialConversations,
      socialSettings: socialState.socialSettings,
      homeNearbyCourses: [],
      homeNearbyStatus: "idle",
      homeNearbyNotice: "",
      socialDiscoveryQuery: "",
      socialDiscoveryResults: [],
      socialDiscoveryStatus: "idle",
      socialDiscoveryNotice: "",
      lastAuthCheckAt: Date.now(),
    });
  },
  signInDemo: async () => {
    const currentUser = normalizeCurrentUser(DEMO_USER);
    const socialState = normalizeSocialState({
      currentUser,
      completedRounds: get().completedRounds,
      socialProfiles: get().socialProfiles,
      socialPosts: get().socialPosts,
      socialConversations: get().socialConversations,
      socialSettings: get().socialSettings,
    });
    const session = createPersistedSession(currentUser, "local-demo");
    await writeNativeAppSession({
      ...session,
      socialProfiles: socialState.socialProfiles,
      socialPosts: socialState.socialPosts,
      socialConversations: socialState.socialConversations,
      socialSettings: socialState.socialSettings,
      completedRounds: get().completedRounds,
      teeTimeRequests: get().teeTimeRequests,
      courseServiceRequests: get().courseServiceRequests,
    });
    set({
      signedIn: true,
      currentUser,
      authMode: "local-demo",
      authError: "",
      authNotice: "",
      authBusy: false,
      sessionRestoredFrom: "native-storage",
      authHealthStatus: "local",
      authHealthNotice: "Local tester session active.",
      sessionExpiresAt: 0,
      socialProfiles: socialState.socialProfiles,
      socialPosts: socialState.socialPosts,
      socialConversations: socialState.socialConversations,
      socialSettings: socialState.socialSettings,
      homeNearbyCourses: [],
      homeNearbyStatus: "idle",
      homeNearbyNotice: "",
      socialDiscoveryQuery: "",
      socialDiscoveryResults: [],
      socialDiscoveryStatus: "idle",
      socialDiscoveryNotice: "",
      lastAuthCheckAt: Date.now(),
    });
    return syncCurrentUserProfile(get, set, currentUser);
  },
  signInWithEmail: async ({ email, password }) => {
    set({ authBusy: true, authError: "", authNotice: "" });
    const result = await signInWithEmailNative({ email, password });
    if (result?.error) {
      set({
        authBusy: false,
      authError: result.error.message || "Sign in failed.",
      });
      return result;
    }

    const currentUser = normalizeCurrentUser(result.session.currentUser);
    const socialState = normalizeSocialState({
      currentUser,
      completedRounds: get().completedRounds,
      socialProfiles: get().socialProfiles,
      socialPosts: get().socialPosts,
      socialConversations: get().socialConversations,
      socialSettings: get().socialSettings,
    });
    set({
      signedIn: true,
      currentUser,
      authMode: "supabase",
      authError: "",
      authNotice: "Signed in.",
      authBusy: false,
      sessionRestoredFrom: "supabase",
      authHealthStatus: "active",
      authHealthNotice: "Cloud session active.",
      sessionExpiresAt: Number(result.session.sessionExpiresAt || 0),
      socialProfiles: socialState.socialProfiles,
      socialPosts: socialState.socialPosts,
      socialConversations: socialState.socialConversations,
      socialSettings: socialState.socialSettings,
      lastAuthCheckAt: Date.now(),
    });
    await persistNativeStoreSession({
      signedIn: true,
      currentUser,
      authMode: "supabase",
      restoredFrom: "supabase",
      sessionExpiresAt: Number(result.session.sessionExpiresAt || 0),
      completedRounds: get().completedRounds,
      socialProfiles: socialState.socialProfiles,
      socialPosts: socialState.socialPosts,
      socialConversations: socialState.socialConversations,
      socialSettings: socialState.socialSettings,
      teeTimeRequests: get().teeTimeRequests,
      courseServiceRequests: get().courseServiceRequests,
    });
    await syncCurrentUserProfile(get, set, currentUser);
    return result;
  },
  signUpWithEmail: async ({ email, password, displayName }) => {
    set({ authBusy: true, authError: "", authNotice: "" });
    const result = await signUpWithEmailNative({ email, password, displayName });
    if (result?.error) {
      set({
        authBusy: false,
        authError: result.error.message || "Sign up failed.",
      });
      return result;
    }

    if (result?.session?.currentUser) {
      const currentUser = normalizeCurrentUser(result.session.currentUser);
      const socialState = normalizeSocialState({
        currentUser,
        completedRounds: get().completedRounds,
        socialProfiles: get().socialProfiles,
        socialPosts: get().socialPosts,
        socialConversations: get().socialConversations,
        socialSettings: get().socialSettings,
      });
      set({
        signedIn: true,
        currentUser,
        authMode: "supabase",
        authError: "",
        authNotice: "Account ready.",
        authBusy: false,
        sessionRestoredFrom: "supabase",
        authHealthStatus: "active",
        authHealthNotice: "Cloud session active.",
        sessionExpiresAt: Number(result.session.sessionExpiresAt || 0),
        socialProfiles: socialState.socialProfiles,
        socialPosts: socialState.socialPosts,
        socialConversations: socialState.socialConversations,
        socialSettings: socialState.socialSettings,
        lastAuthCheckAt: Date.now(),
      });
      await persistNativeStoreSession({
        signedIn: true,
        currentUser,
        authMode: "supabase",
        restoredFrom: "supabase",
        sessionExpiresAt: Number(result.session.sessionExpiresAt || 0),
        completedRounds: get().completedRounds,
        socialProfiles: socialState.socialProfiles,
        socialPosts: socialState.socialPosts,
        socialConversations: socialState.socialConversations,
        socialSettings: socialState.socialSettings,
        teeTimeRequests: get().teeTimeRequests,
        courseServiceRequests: get().courseServiceRequests,
      });
      await syncCurrentUserProfile(get, set, currentUser);
      return result;
    }

    set({
      authBusy: false,
      authError: "",
      authNotice: result?.notice || "Account created. Finish confirmation, then sign in.",
    });
    return result;
  },
  requestPasswordReset: async (email) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      set({
        authError: "Enter your email first.",
        authNotice: "",
      });
      return {
        error: {
          message: "Enter your email first.",
        },
      };
    }

    set({ authBusy: true, authError: "", authNotice: "" });
    const result = await requestPasswordResetNative(normalizedEmail);
    if (result?.error) {
      set({
        authBusy: false,
        authError: result.error.message || "Password reset failed.",
      });
      return result;
    }

    set({
      authBusy: false,
      authError: "",
      authNotice: "Password reset link sent if the account exists.",
    });
    return result;
  },
  signOut: async () => {
    stopLiveSyncLoop();
    detachRealtimeSession();
    await signOutNative();
    await clearNativeAppSession();
    const socialState = normalizeSocialState({
      currentUser: null,
      completedRounds: [],
    });
    set({
      signedIn: false,
      currentUser: null,
      authMode: "local-demo",
      activeRound: null,
      completedRounds: [],
      socialProfiles: socialState.socialProfiles,
      socialPosts: socialState.socialPosts,
      socialConversations: socialState.socialConversations,
      socialSettings: socialState.socialSettings,
      teeTimeRequests: [],
      courseServiceRequests: [],
      requestReviewQueue: [],
      requestReviewQueueStatus: "idle",
      requestReviewQueueNotice: "",
      homeNearbyCourses: [],
      homeNearbyStatus: "idle",
      homeNearbyNotice: "",
      socialDiscoveryQuery: "",
      socialDiscoveryResults: [],
      socialDiscoveryStatus: "idle",
      socialDiscoveryNotice: "",
      authError: "",
      authNotice: "",
      authBusy: false,
      sessionRestoredFrom: "",
      authHealthStatus: "signed-out",
      authHealthNotice: "",
      sessionExpiresAt: 0,
      lastAuthCheckAt: Date.now(),
      recentInviteCode: "",
      joinedCode: "",
      liveSyncStatus: "idle",
      liveSyncNotice: "",
      lastLiveSyncAt: 0,
    });
  },
  revalidateSession: async ({ quiet = false } = {}) => {
    const result = await revalidateNativeAuthSession({
      signedIn: get().signedIn,
      authMode: get().authMode,
    });

    if (result.status === "active" && result.currentUser) {
      const currentUser = normalizeCurrentUser({
        ...(get().currentUser || {}),
        ...(result.currentUser || {}),
      });
      const socialState = normalizeSocialState({
        currentUser,
        completedRounds: get().completedRounds,
        socialProfiles: get().socialProfiles,
        socialPosts: get().socialPosts,
        socialConversations: get().socialConversations,
        socialSettings: get().socialSettings,
      });
      set({
        signedIn: true,
        currentUser,
        authMode: "supabase",
        sessionRestoredFrom: "supabase",
        authHealthStatus: "active",
        authHealthNotice: result.notice,
        sessionExpiresAt: Number(result.sessionExpiresAt || 0),
        socialProfiles: socialState.socialProfiles,
        socialPosts: socialState.socialPosts,
        socialConversations: socialState.socialConversations,
        socialSettings: socialState.socialSettings,
        lastAuthCheckAt: Date.now(),
        authNotice: quiet ? get().authNotice : "Session refreshed.",
      });
      await persistNativeStoreSession({
        signedIn: true,
        currentUser,
        authMode: "supabase",
        restoredFrom: "supabase",
        sessionExpiresAt: Number(result.sessionExpiresAt || 0),
        completedRounds: get().completedRounds,
        socialProfiles: socialState.socialProfiles,
        socialPosts: socialState.socialPosts,
        socialConversations: socialState.socialConversations,
        socialSettings: socialState.socialSettings,
        teeTimeRequests: get().teeTimeRequests,
        courseServiceRequests: get().courseServiceRequests,
      });
      await syncCurrentUserProfile(get, set, currentUser);
      return result;
    }

    if (result.status === "local") {
      set({
        authHealthStatus: "local",
        authHealthNotice: result.notice,
        sessionExpiresAt: 0,
        lastAuthCheckAt: Date.now(),
      });
      return result;
    }

    if (result.expired) {
      stopLiveSyncLoop();
      stopLivePresenceLoop();
      detachRealtimeSession();
      set((state) => ({
        signedIn: false,
        currentUser: null,
        authMode: "local-demo",
        sessionRestoredFrom: "",
        authHealthStatus: "expired",
        authHealthNotice: result.notice,
        sessionExpiresAt: 0,
        lastAuthCheckAt: Date.now(),
        authNotice: result.notice,
        ...normalizeSocialState({
          currentUser: null,
          completedRounds: state.completedRounds,
          socialProfiles: state.socialProfiles,
          socialPosts: state.socialPosts,
          socialConversations: state.socialConversations,
          socialSettings: state.socialSettings,
        }),
        liveSyncStatus: state.activeRound?.inviteCode ? "retry-needed" : "idle",
        liveSyncNotice: state.activeRound?.inviteCode
          ? "Cloud session expired. Sign in again to resume live sync."
          : "",
      }));
      return result;
    }

  set({
      authHealthStatus: result.status,
      authHealthNotice: result.notice,
      sessionExpiresAt: Number(result.sessionExpiresAt || 0),
      lastAuthCheckAt: Date.now(),
    });
    return result;
  },
  setSocialDiscoveryQuery: (query) => {
    set({
      socialDiscoveryQuery: String(query || ""),
    });
  },
  clearSocialDiscovery: () => {
    set({
      socialDiscoveryQuery: "",
      socialDiscoveryResults: [],
      socialDiscoveryStatus: "idle",
      socialDiscoveryNotice: "",
    });
  },
  refreshSocialDiscovery: async (queryOverride = null) => {
    const currentUser = get().currentUser || DEMO_USER;
    const currentProfileId = currentUser.profileId || currentUser.id;
    const rawQuery = queryOverride === null ? get().socialDiscoveryQuery : String(queryOverride || "");
    const query = String(rawQuery || "").trim();
    const existingProfiles = (get().socialProfiles || []).filter((profile) => profile?.id && profile.id !== currentProfileId);
    const localMatches = existingProfiles.filter((profile) => {
      if (!query) {
        return true;
      }

      const haystack = [
        profile.displayName,
        profile.username,
        profile.homeCourse,
        profile.city,
      ].join(" ").toLowerCase();
      return haystack.includes(query.toLowerCase());
    }).slice(0, 12);

    set({
      socialDiscoveryQuery: rawQuery,
      socialDiscoveryStatus: "loading",
      socialDiscoveryNotice: "",
    });

    if (get().authMode !== "supabase") {
      set({
        socialDiscoveryResults: localMatches,
        socialDiscoveryStatus: "local-only",
        socialDiscoveryNotice: localMatches.length
          ? "Showing golfers already saved on this phone."
          : "Sign in with a cloud account to discover real golfers.",
      });
      return localMatches;
    }

    const remote = await searchPlayerProfilesNative({
      query,
      currentUser,
      limit: 12,
    });

    if (remote?.error) {
      set({
        socialDiscoveryResults: localMatches,
        socialDiscoveryStatus: "error",
        socialDiscoveryNotice: remote.error.message || "Golfer discovery is unavailable right now.",
      });
      return localMatches;
    }

    const results = (remote.profiles || []).filter((profile) => profile?.id).slice(0, 12);
    set((state) => ({
      socialProfiles: mergeSocialProfiles(state.socialProfiles, results, currentProfileId),
      socialDiscoveryResults: results,
      socialDiscoveryStatus: remote.status || "ready",
      socialDiscoveryNotice: results.length
        ? `Found ${results.length} real golfer${results.length === 1 ? "" : "s"}.`
        : (remote.notice || (query ? "No golfers matched that search yet." : "No golfer profiles are available yet.")),
    }));
    return results;
  },
  loadHomeNearbyCourses: async ({ requestPermission = false } = {}) => {
    set((state) => ({
      homeNearbyStatus: requestPermission ? "locating" : (state.homeNearbyStatus === "idle" ? "checking" : state.homeNearbyStatus),
      homeNearbyNotice: requestPermission ? "Finding courses near your phone..." : state.homeNearbyNotice,
    }));

    const locationResult = await refreshNativeLocation({ requestPermission });
    const coords = locationResult?.coords || null;

    set({
      nearbyLocation: coords,
      nearbyLocationStatus: locationResult?.status || "idle",
      nearbyLocationSource: locationResult?.source || "",
      nearbyLocationNotice: locationResult?.notice || "",
    });

    if (!coords) {
      set({
        homeNearbyCourses: [],
        homeNearbyStatus: locationResult?.status || "idle",
        homeNearbyNotice: locationResult?.notice || "Use your phone location to show nearby courses.",
      });
      return [];
    }

    const courses = await findNearbyNativeCourses(coords.latitude, coords.longitude, {
      limit: 6,
      radiusMiles: 50,
      allowFallback: false,
    });

    set({
      homeNearbyCourses: courses,
      homeNearbyStatus: "ready",
      homeNearbyNotice: locationResult?.notice || "Nearby courses matched to your phone location.",
    });
    return courses;
  },
  prepareCourseSetup: async () => {
    if (String(get().setup.courseQuery || "").trim()) {
      return get().refreshCourseSearch();
    }

    set({ courseResultsStatus: "loading", courseCatalogNotice: "" });
    const nearbyCourses = await get().refreshNearbyCoursesFromLocation();
    if (Array.isArray(nearbyCourses) && nearbyCourses.length) {
      return nearbyCourses;
    }

    const prepared = await prepareNativeCourseCatalog();
    const courses = prepared.courses?.length ? prepared.courses : DEFAULT_RECOMMENDED_COURSES;
    const selectedCourse = courses.find((course) => course.id === get().setup.courseId) || courses[0] || DEFAULT_COURSE;

    set((state) => ({
      setup: {
        ...state.setup,
        courseId: selectedCourse?.id || state.setup.courseId,
      },
      courseResults: courses,
      courseResultsStatus: "ready",
      courseResultsSource: prepared.source || "starter",
      selectedCourse,
      courseCatalogNotice: prepared.source === "starter"
        ? (state.nearbyLocationNotice || "Using bundled course picks until the expanded catalog loads on device.")
        : prepared.source.includes("recent")
          ? "Nearby and recent courses are ready offline."
          : state.nearbyLocationNotice || "",
    }));
    return courses;
  },
  loadRecentCourseResults: async () => {
    set({
      courseResultsStatus: "loading",
      courseCatalogNotice: "",
    });

    const recentCourses = await getRecentNativeCourses(8);
    const courses = recentCourses.length ? recentCourses : DEFAULT_RECOMMENDED_COURSES;
    const selectedCourse = courses.find((course) => course.id === get().setup.courseId) || courses[0] || DEFAULT_COURSE;

    set((state) => ({
      setup: {
        ...state.setup,
        courseId: selectedCourse?.id || state.setup.courseId,
      },
      courseResults: courses,
      courseResultsStatus: "ready",
      courseResultsSource: recentCourses.length ? "recent-only" : "starter-recent",
      selectedCourse,
      courseCatalogNotice: recentCourses.length
        ? "Recent courses saved on this device."
        : "Play a course once and it will stay easy to find here.",
    }));

    return courses;
  },
  refreshNearbyCoursesFromLocation: async ({ requestPermission = false, forceResults = false } = {}) => {
    const query = String(get().setup.courseQuery || "").trim();
    const shouldReplaceResults = forceResults || !query;
    const hadResults = Array.isArray(get().courseResults) && get().courseResults.length > 0;

    if (shouldReplaceResults) {
      set({ courseResultsStatus: "loading", courseCatalogNotice: "" });
    }
    set((state) => ({
      nearbyLocationStatus: requestPermission
        ? "locating"
        : state.nearbyLocationStatus === "idle"
          ? "checking"
          : state.nearbyLocationStatus,
      nearbyLocationNotice: requestPermission ? "Finding courses near your phone..." : state.nearbyLocationNotice,
    }));

    const locationResult = await refreshNativeLocation({ requestPermission });
    const coords = locationResult?.coords || null;

    if (!coords) {
      set((state) => ({
        nearbyLocation: null,
        nearbyLocationStatus: locationResult?.status || "unavailable",
        nearbyLocationSource: locationResult?.source || "",
        nearbyLocationNotice: locationResult?.notice || "",
        courseResultsStatus: shouldReplaceResults ? (hadResults ? "ready" : "idle") : state.courseResultsStatus,
        courseCatalogNotice: shouldReplaceResults ? (locationResult?.notice || state.courseCatalogNotice) : state.courseCatalogNotice,
      }));
      return null;
    }

    const [recentCourses, nearbyCourses] = await Promise.all([
      getRecentNativeCourses(6),
      findNearbyNativeCourses(coords.latitude, coords.longitude, {
        limit: 12,
        radiusMiles: 75,
      }),
    ]);
    const courses = mergeUniqueCourseRecords(recentCourses, nearbyCourses, DEFAULT_RECOMMENDED_COURSES).slice(0, 20);
    const selectedCourse = courses.find((course) => course.id === get().setup.courseId) || courses[0] || DEFAULT_COURSE;
    const source = locationResult.source === "cache" ? "cached-location-nearby" : "device-nearby";
    const notice = locationResult.notice || (locationResult.source === "cache"
      ? "Using the last nearby match saved on this device."
      : "Nearby courses matched to your phone location.");

    set((state) => ({
      nearbyLocation: coords,
      nearbyLocationStatus: locationResult.status || "ready",
      nearbyLocationSource: locationResult.source || "device",
      nearbyLocationNotice: notice,
      setup: shouldReplaceResults
        ? {
            ...state.setup,
            courseId: selectedCourse?.id || state.setup.courseId,
          }
        : state.setup,
      courseResults: shouldReplaceResults ? courses : state.courseResults,
      courseResultsStatus: shouldReplaceResults ? "ready" : state.courseResultsStatus,
      courseResultsSource: shouldReplaceResults ? source : state.courseResultsSource,
      selectedCourse: shouldReplaceResults ? selectedCourse : state.selectedCourse,
      courseCatalogNotice: shouldReplaceResults ? notice : state.courseCatalogNotice,
    }));

    return courses;
  },
  setCourseQuery: (courseQuery) => {
    set((state) => ({
      setup: {
        ...state.setup,
        courseQuery,
      },
    }));
  },
  refreshCourseSearch: async (queryOverride = null) => {
    const query = queryOverride ?? get().setup.courseQuery;
    if (!String(query || "").trim()) {
      return get().prepareCourseSetup();
    }

    set({
      courseResultsStatus: "searching",
      courseCatalogNotice: "",
    });

    const result = await searchNativeCourseCatalog(query, { limit: 20 });
    const courses = result.courses?.length ? result.courses : DEFAULT_RECOMMENDED_COURSES;
    const selectedCourse = courses.find((course) => course.id === get().setup.courseId) || courses[0] || DEFAULT_COURSE;

    set((state) => ({
      setup: {
        ...state.setup,
        courseId: selectedCourse?.id || state.setup.courseId,
      },
      courseResults: courses,
      courseResultsStatus: "ready",
      courseResultsSource: result.source || "starter",
      selectedCourse,
      courseCatalogNotice: result.source === "starter-search"
        ? "Showing bundled real-course matches while expanded discovery stays offline."
        : result.source === "discovery-cache"
          ? "Expanded course catalog is cached on this device."
          : "",
    }));

    return courses;
  },
  selectCourse: async (courseId) => {
    const fromResults = get().courseResults.find((course) => course.id === courseId)
      || getCourseById(courseId)
      || null;
    set((state) => ({
      setup: {
        ...state.setup,
        courseId,
      },
      selectedCourse: fromResults || state.selectedCourse,
    }));

    if (courseId) {
      const detailed = await loadNativeCourseById(courseId);
      if (detailed?.id === courseId) {
        await recordRecentNativeCourse(detailed);
        set((state) => ({
          selectedCourse: detailed,
          courseResults: state.courseResults.map((course) => (course.id === courseId ? detailed : course)),
        }));
      }
    }
  },
  hydrateSelectedCourse: async () => {
    const courseId = get().setup.courseId;
    if (!courseId) {
      return null;
    }

    const detailed = await loadNativeCourseById(courseId);
    if (!detailed) {
      return getSelectedCourseFromState(get());
    }

    await recordRecentNativeCourse(detailed);
    set((state) => ({
      selectedCourse: detailed,
      courseResults: state.courseResults.map((course) => (course.id === courseId ? detailed : course)),
    }));
    return detailed;
  },
  setSetupMode: (mode) => {
    if (!GAME_MODES[mode]) {
      return;
    }

    set((state) => ({
      setup: {
        ...state.setup,
        mode,
      },
    }));
  },
  createSelectedCourseTeeTimeRequest: async () => {
    const currentUser = get().currentUser || DEMO_USER;
    const selectedCourse = await get().hydrateSelectedCourse();
    const teeTimeAccess = getCourseTeeTimeAccess(selectedCourse);

    if (!selectedCourse?.id || teeTimeAccess?.mode !== "request") {
      return null;
    }

    const request = createTeeTimeRequest({
      courseId: selectedCourse.id,
      courseName: selectedCourse.displayName || selectedCourse.courseName || selectedCourse.name,
      requesterUserId: currentUser.id,
      requesterProfileId: currentUser.profileId || currentUser.id,
      mode: teeTimeAccess.mode,
      provider: teeTimeAccess.provider || "",
      desiredWindowLabel: "Next available",
      notes: teeTimeAccess.notes || "",
      metadata: {
        providerLabel: teeTimeAccess.provider || "",
      },
    });
    const persisted = await createTeeTimeRequestNative(request, {
      currentUser,
      authMode: get().authMode,
    });
    const nextRequest = applyRequestPersistenceResult(request, persisted);
    const teeTimeRequests = mergeRequestById(get().teeTimeRequests, nextRequest, 20);

    set((state) => ({
      teeTimeRequests,
      requestReviewQueue: mergeReviewQueue(
        createLocalQueueItems({
          teeTimeRequests,
          courseServiceRequests: state.courseServiceRequests,
        }),
        getCloudQueueItems(state.requestReviewQueue)
      ),
      requestReviewQueueStatus: persisted?.status === "persisted" ? "ready" : state.requestReviewQueueStatus,
      requestReviewQueueNotice: getRequestQueueNotice(persisted, state.requestReviewQueueNotice),
      authNotice: persisted?.status === "persisted"
        ? "Tee time request saved to the review queue."
        : "Tee time request saved on this phone.",
      authError: "",
    }));
    await persistNativeStoreSession({
      completedRounds: get().completedRounds,
      socialProfiles: get().socialProfiles,
      socialPosts: get().socialPosts,
      socialConversations: get().socialConversations,
      socialSettings: get().socialSettings,
      teeTimeRequests: get().teeTimeRequests,
      courseServiceRequests: get().courseServiceRequests,
    });

    return nextRequest;
  },
  createActiveRoundCourseServiceRequest: async (requestType = "guest-services") => {
    const currentUser = get().currentUser || DEMO_USER;
    const activeRound = get().activeRound;
    if (!activeRound?.courseId) {
      return null;
    }

    const course = {
      id: activeRound.courseId,
      displayName: activeRound.courseName,
      metadata: activeRound.courseMetadata || {},
    };
    const serviceAccess = getCourseOnCourseServiceAccess(course);
    const normalizedRequestType = String(requestType || "").trim() || "guest-services";

    if (!serviceAccess?.enabled || !serviceAccess.requestTypes.includes(normalizedRequestType)) {
      return null;
    }

    const request = createCourseServiceRequest({
      courseId: activeRound.courseId,
      courseName: activeRound.courseName,
      roundId: activeRound.id,
      requesterUserId: currentUser.id,
      requesterProfileId: currentUser.profileId || currentUser.id,
      requestType: normalizedRequestType,
      notes: serviceAccess.notes || "",
      metadata: {
        providerMode: serviceAccess.mode || "request",
      },
    });
    const persisted = await createOnCourseServiceRequestNative(request, {
      currentUser,
      authMode: get().authMode,
    });
    const nextRequest = applyRequestPersistenceResult(request, persisted);
    const courseServiceRequests = mergeRequestById(get().courseServiceRequests, nextRequest, 30);

    set((state) => ({
      courseServiceRequests,
      requestReviewQueue: mergeReviewQueue(
        createLocalQueueItems({
          teeTimeRequests: state.teeTimeRequests,
          courseServiceRequests,
        }),
        getCloudQueueItems(state.requestReviewQueue)
      ),
      requestReviewQueueStatus: persisted?.status === "persisted" ? "ready" : state.requestReviewQueueStatus,
      requestReviewQueueNotice: getRequestQueueNotice(persisted, state.requestReviewQueueNotice),
      authNotice: persisted?.status === "persisted"
        ? "Course service request saved to the review queue."
        : "Course service request saved on this phone.",
      authError: "",
    }));
    await persistNativeStoreSession({
      completedRounds: get().completedRounds,
      socialProfiles: get().socialProfiles,
      socialPosts: get().socialPosts,
      socialConversations: get().socialConversations,
      socialSettings: get().socialSettings,
      teeTimeRequests: get().teeTimeRequests,
      courseServiceRequests: get().courseServiceRequests,
    });

    return nextRequest;
  },
  refreshRequestReviewQueue: async () => {
    set({ requestReviewQueueStatus: "loading" });
    const remote = await listRequestReviewQueueNative({
      currentUser: get().currentUser || DEMO_USER,
      authMode: get().authMode,
      limit: 30,
    });
    const localItems = createLocalQueueItems({
      teeTimeRequests: get().teeTimeRequests,
      courseServiceRequests: get().courseServiceRequests,
    });

    if (remote?.error) {
      set({
        requestReviewQueue: localItems,
        requestReviewQueueStatus: "local-only",
        requestReviewQueueNotice: remote.error.message || "Showing saved requests from this phone only.",
      });
      return localItems;
    }

    const merged = mergeReviewQueue(localItems, remote.items || []);
    set({
      requestReviewQueue: merged,
      requestReviewQueueStatus: remote.status || "ready",
      requestReviewQueueNotice: remote.notice || (remote.status === "ready"
        ? "Cloud request queue loaded."
        : "Showing saved requests from this phone only."),
    });
    return merged;
  },
  startSoloRound: async () => {
    const currentUser = get().currentUser || DEMO_USER;
    const selectedCourse = await get().hydrateSelectedCourse();
    const round = await buildRoundFromSetup(get().setup, currentUser, selectedCourse, {
      live: false,
    });
    stopLiveSyncLoop();
    detachRealtimeSession();
    set({
      activeRound: round,
      recentInviteCode: "",
      liveSyncStatus: "idle",
      liveSyncNotice: "",
      lastLiveSyncAt: 0,
    });
    return round;
  },
  hostLiveRound: async () => {
    const currentUser = get().currentUser || DEMO_USER;
    const selectedCourse = await get().hydrateSelectedCourse();
    const round = await buildRoundFromSetup(get().setup, currentUser, selectedCourse, {
      live: true,
    });

    set({
      activeRound: round,
      recentInviteCode: round.inviteCode || "GN18",
      liveSyncStatus: "connecting",
      liveSyncNotice: "Creating live room...",
    });

    const syncResult = await broadcastLiveRoundSnapshotNative(round, currentUser, null, NATIVE_REALTIME_DEVICE_ID);
    if (syncResult?.session?.round) {
      const hostedRound = syncResult.session.round;
      set({
        activeRound: hostedRound,
        recentInviteCode: hostedRound.inviteCode || round.inviteCode || "GN18",
        liveSyncStatus: "connecting",
        liveSyncNotice: "Live room ready. Connecting realtime...",
        lastLiveSyncAt: Date.now(),
        authNotice: "",
      });
      attachRealtimeSession(get, set, hostedRound);
      startLiveSyncLoop(get, set);
      startLivePresenceLoop(get, set);
      await publishLivePresence(get, set, { quiet: true });
      return hostedRound;
    }

    if (syncResult?.error) {
      set({
        liveSyncStatus: "local-only",
        liveSyncNotice: syncResult.error.message || "Live room stayed on this device.",
        authNotice: syncResult.error.message || "Live room stayed on this device.",
      });
      return round;
    }

    set({
      liveSyncStatus: "local-only",
      liveSyncNotice: "Live room stayed on this device.",
    });
    return round;
  },
  joinRound: async (inviteCode) => {
    const cleanedCode = String(inviteCode || "").trim().toUpperCase() || "GN18";
    set({
      liveSyncStatus: "connecting",
      liveSyncNotice: "Joining live room...",
      authNotice: "",
    });

    const remote = await joinRoundByCodeNative(cleanedCode, get().currentUser || DEMO_USER);
    if (remote?.session?.round) {
      const round = remote.session.round;
      set({
        activeRound: round,
        joinedCode: cleanedCode,
        recentInviteCode: cleanedCode,
        authNotice: "",
        liveSyncStatus: "connecting",
        liveSyncNotice: "Joined live room. Connecting realtime...",
        lastLiveSyncAt: Date.now(),
      });
      attachRealtimeSession(get, set, round);
      startLiveSyncLoop(get, set);
      startLivePresenceLoop(get, set);
      await publishLivePresence(get, set, { quiet: false });
      return round;
    }

    set({
      activeRound: null,
      joinedCode: "",
      recentInviteCode: cleanedCode,
      authNotice: remote?.error?.message || "",
      liveSyncStatus: remote?.status === "local-only" ? "local-only" : "retry-needed",
      liveSyncNotice: remote?.error?.message || "That live room was not found.",
    });
    return null;
  },
  refreshLiveRound: async (force = false) => {
    const round = get().activeRound;
    if (!round?.inviteCode) {
      return null;
    }

    try {
      const remote = await fetchLiveRoundByCodeNative(round.inviteCode);
      if (remote?.session?.round && (force || shouldApplyIncomingRound(get().activeRound, remote.session.round))) {
        set({
          activeRound: remote.session.round,
          liveSyncStatus: "connected",
          liveSyncNotice: force ? "Live round refreshed." : "Live round updated from the shared session.",
          lastLiveSyncAt: Date.now(),
        });
        return remote.session.round;
      }
    } catch (error) {
      set({
        liveSyncStatus: "retry-needed",
        liveSyncNotice: error?.message || "Live round refresh will retry.",
      });
    }

    return get().activeRound;
  },
  resumeLiveRoundSession: async ({ quiet = true } = {}) => {
    const round = get().activeRound;
    if (!round?.inviteCode) {
      return null;
    }

    set((state) => ({
      liveSyncStatus: state.liveSyncStatus === "local-only" ? "local-only" : "connecting",
      liveSyncNotice: quiet ? state.liveSyncNotice : "Reconnecting live room...",
    }));

    attachRealtimeSession(get, set, round);
    startLiveSyncLoop(get, set);
    startLivePresenceLoop(get, set);
    await get().refreshLiveRound(true);
    await publishLivePresence(get, set, { quiet });
    return get().activeRound;
  },
  submitHoleScore: (strokes) => {
    const round = get().activeRound;
    if (!round) {
      return { finished: false };
    }

    const nextRound = updateRoundEntry(round, round.currentHole, strokes);
    const finished = isRoundScored(nextRound);
    const nextHole = finished ? nextRound.currentHole : Math.min(nextRound.currentHole + 1, nextRound.holes.length);
    const liveRound = {
      ...nextRound,
      currentHole: nextHole,
    };

    set({
      activeRound: liveRound,
      lastLiveSyncAt: liveRound.inviteCode ? Date.now() : get().lastLiveSyncAt,
    });

    if (liveRound.inviteCode) {
      void broadcastLiveRoundSnapshotNative(liveRound, get().currentUser || DEMO_USER, null, NATIVE_REALTIME_DEVICE_ID)
        .then((result) => {
          if (result?.session?.round && shouldApplyIncomingRound(get().activeRound, result.session.round)) {
            set({
              activeRound: result.session.round,
              liveSyncStatus: "connected",
              liveSyncNotice: "Score synced live.",
              lastLiveSyncAt: Date.now(),
            });
            return;
          }

          if (result?.error) {
            set({
              liveSyncStatus: "retry-needed",
              liveSyncNotice: result.error.message || "Live sync will retry.",
            });
            return;
          }

          set({
            liveSyncStatus: "connected",
            liveSyncNotice: "Score synced live.",
            lastLiveSyncAt: Date.now(),
          });
        });
    }

    return { finished };
  },
  goToPreviousHole: () => {
    const round = get().activeRound;
    if (!round) {
      return;
    }

    set({
      activeRound: {
        ...round,
        currentHole: Math.max(1, round.currentHole - 1),
      },
    });
  },
  leaveRound: () => {
    stopLiveSyncLoop();
    stopLivePresenceLoop();
    detachRealtimeSession();
    set({
      activeRound: null,
      recentInviteCode: "",
      joinedCode: "",
      liveSyncStatus: "idle",
      liveSyncNotice: "",
      lastLiveSyncAt: 0,
    });
  },
  finishRound: async () => {
    const round = get().activeRound;
    if (!round) {
      return null;
    }

    const completedRound = {
      ...round,
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    };

    const completedRounds = normalizeCompletedRounds([
      completedRound,
      ...get().completedRounds.filter((entry) => entry.id !== completedRound.id),
    ]);

    stopLiveSyncLoop();
    stopLivePresenceLoop();
    detachRealtimeSession();
    set({
      activeRound: null,
      completedRounds,
      recentInviteCode: "",
      joinedCode: "",
      liveSyncStatus: "idle",
      liveSyncNotice: "",
      lastLiveSyncAt: 0,
    });
    await persistNativeStoreSession({
      completedRounds,
      socialProfiles: get().socialProfiles,
      socialPosts: get().socialPosts,
      socialConversations: get().socialConversations,
      socialSettings: get().socialSettings,
      teeTimeRequests: get().teeTimeRequests,
      courseServiceRequests: get().courseServiceRequests,
    });
    await syncCurrentUserProfile(get, set, get().currentUser);
    return completedRound;
  },
  toggleFollowProfile: async (profileId) => {
    const cleanedProfileId = String(profileId || "").trim();
    if (!cleanedProfileId || !(get().socialProfiles || []).some((profile) => profile.id === cleanedProfileId)) {
      return null;
    }

    const socialSettings = toggleFollowedProfileIds(get().socialSettings, cleanedProfileId);
    set({ socialSettings });
    await persistNativeStoreSession({
      socialProfiles: get().socialProfiles,
      socialPosts: get().socialPosts,
      socialConversations: get().socialConversations,
      socialSettings,
      completedRounds: get().completedRounds,
      teeTimeRequests: get().teeTimeRequests,
      courseServiceRequests: get().courseServiceRequests,
    });
    return socialSettings;
  },
  addFriendProfile: async (profileId) => {
    const cleanedProfileId = String(profileId || "").trim();
    if (!cleanedProfileId || !(get().socialProfiles || []).some((profile) => profile.id === cleanedProfileId)) {
      return null;
    }

    const socialSettings = addFriendProfileId(get().socialSettings, cleanedProfileId);
    set({ socialSettings });
    await persistNativeStoreSession({
      socialProfiles: get().socialProfiles,
      socialPosts: get().socialPosts,
      socialConversations: get().socialConversations,
      socialSettings,
      completedRounds: get().completedRounds,
      teeTimeRequests: get().teeTimeRequests,
      courseServiceRequests: get().courseServiceRequests,
    });
    return socialSettings;
  },
  createSocialPost: async ({ message, linkUrl = "" }) => {
    const post = createSocialPostRecord(get().currentUser || DEMO_USER, { message, linkUrl });
    if (!post.message) {
      return null;
    }

    const socialPosts = [post, ...get().socialPosts].slice(0, 40);
    set({
      socialPosts,
      authNotice: "Update posted to Clubhouse.",
      authError: "",
    });
    await persistNativeStoreSession({
      socialProfiles: get().socialProfiles,
      socialPosts,
      socialConversations: get().socialConversations,
      socialSettings: get().socialSettings,
      completedRounds: get().completedRounds,
      teeTimeRequests: get().teeTimeRequests,
      courseServiceRequests: get().courseServiceRequests,
    });
    return post;
  },
  openDirectConversation: async (profileId) => {
    const cleanedProfileId = String(profileId || "").trim();
    if (!cleanedProfileId || !(get().socialProfiles || []).some((profile) => profile.id === cleanedProfileId)) {
      return "";
    }

    const result = ensureDirectConversation(
      get().socialConversations,
      get().currentUser || DEMO_USER,
      cleanedProfileId
    );

    set({
      socialConversations: result.conversations,
      authNotice: "",
      authError: "",
    });
    await persistNativeStoreSession({
      socialProfiles: get().socialProfiles,
      socialPosts: get().socialPosts,
      socialConversations: result.conversations,
      socialSettings: get().socialSettings,
      completedRounds: get().completedRounds,
      teeTimeRequests: get().teeTimeRequests,
      courseServiceRequests: get().courseServiceRequests,
    });
    return result.conversationId;
  },
  sendDirectMessage: async (profileId, text) => {
    const cleanedProfileId = String(profileId || "").trim();
    if (!cleanedProfileId || !(get().socialProfiles || []).some((profile) => profile.id === cleanedProfileId)) {
      set({
        authError: "Pick a real golfer before sending a message.",
        authNotice: "",
      });
      return null;
    }

    const socialConversations = upsertDirectConversationMessage(
      get().socialConversations,
      get().currentUser || DEMO_USER,
      cleanedProfileId,
      text
    );
    if (socialConversations === get().socialConversations) {
      set({
        authError: "Write a message first.",
        authNotice: "",
      });
      return null;
    }

    set({
      socialConversations,
      authNotice: "Message saved on this phone.",
      authError: "",
    });
    await persistNativeStoreSession({
      socialProfiles: get().socialProfiles,
      socialPosts: get().socialPosts,
      socialConversations,
      socialSettings: get().socialSettings,
      completedRounds: get().completedRounds,
      teeTimeRequests: get().teeTimeRequests,
      courseServiceRequests: get().courseServiceRequests,
    });
    return socialConversations;
  },
  updateCurrentUserProfile: async (fields = {}) => {
    const currentUser = normalizeCurrentUser({
      ...(get().currentUser || DEMO_USER),
      ...fields,
      handicap: fields.handicap ?? (get().currentUser || DEMO_USER).handicap ?? null,
    });
    set({
      currentUser,
      authNotice: "Profile saved on this phone.",
      authError: "",
    });
    await persistNativeStoreSession(buildPersistedUserPatch(currentUser, {
      completedRounds: get().completedRounds,
      socialProfiles: get().socialProfiles,
      socialPosts: get().socialPosts,
      socialConversations: get().socialConversations,
      socialSettings: get().socialSettings,
      teeTimeRequests: get().teeTimeRequests,
      courseServiceRequests: get().courseServiceRequests,
    }));
    await syncCurrentUserProfile(get, set, currentUser);
    return currentUser;
  },
  updateCurrentUserAppearance: async (fields = {}) => {
    const currentUser = normalizeCurrentUser(get().currentUser || DEMO_USER);
    const nextUser = normalizeCurrentUser({
      ...currentUser,
      appearance: {
        ...DEFAULT_APPEARANCE,
        ...(currentUser.appearance || {}),
        ...(fields || {}),
      },
    });
    set({
      currentUser: nextUser,
      authNotice: "App appearance updated.",
      authError: "",
    });
    await persistNativeStoreSession(buildPersistedUserPatch(nextUser, {
      completedRounds: get().completedRounds,
      socialProfiles: get().socialProfiles,
      socialPosts: get().socialPosts,
      socialConversations: get().socialConversations,
      socialSettings: get().socialSettings,
      teeTimeRequests: get().teeTimeRequests,
      courseServiceRequests: get().courseServiceRequests,
    }));
    return nextUser.appearance;
  },
  updateCurrentUserPrivacy: async (fields = {}) => {
    const currentUser = normalizeCurrentUser(get().currentUser || DEMO_USER);
    const nextUser = normalizeCurrentUser({
      ...currentUser,
      privacy: {
        ...DEFAULT_PRIVACY,
        ...(currentUser.privacy || {}),
        ...(fields || {}),
      },
    });
    set({
      currentUser: nextUser,
      authNotice: "Privacy settings updated.",
      authError: "",
    });
    await persistNativeStoreSession(buildPersistedUserPatch(nextUser, {
      completedRounds: get().completedRounds,
      socialProfiles: get().socialProfiles,
      socialPosts: get().socialPosts,
      socialConversations: get().socialConversations,
      socialSettings: get().socialSettings,
      teeTimeRequests: get().teeTimeRequests,
      courseServiceRequests: get().courseServiceRequests,
    }));
    return nextUser.privacy;
  },
  getRoundSummary: () => {
    const round = get().activeRound;
    if (!round) {
      return null;
    }

    return getRoundSummary(round, (get().currentUser || DEMO_USER).id);
  },
  getCurrentSocialProfile: () => buildSocialProfilePreview({
    currentUser: get().currentUser || DEMO_USER,
    socialProfiles: get().socialProfiles,
    socialSettings: get().socialSettings,
    profileId: (get().currentUser || DEMO_USER).profileId || (get().currentUser || DEMO_USER).id,
  }),
  getSocialProfile: (profileId) => buildSocialProfilePreview({
    currentUser: get().currentUser || DEMO_USER,
    socialProfiles: get().socialProfiles,
    socialSettings: get().socialSettings,
    profileId,
  }),
  getSocialCircle: () => buildSocialCircle({
    currentUser: get().currentUser || DEMO_USER,
    socialProfiles: get().socialProfiles,
    socialSettings: get().socialSettings,
  }),
  getCommunityFeed: () => buildCommunityFeed({
    currentUser: get().currentUser || DEMO_USER,
    socialProfiles: get().socialProfiles,
    socialPosts: get().socialPosts,
    socialSettings: get().socialSettings,
  }),
  getDirectInbox: () => buildDirectInbox({
    currentUser: get().currentUser || DEMO_USER,
    socialProfiles: get().socialProfiles,
    socialConversations: get().socialConversations,
    socialSettings: get().socialSettings,
  }),
  getCompletedRoundStats: () => summarizeCompletedRounds(get().completedRounds, (get().currentUser || DEMO_USER).id),
  getCompletedRoundSummaries: () => buildCompletedRoundSummaries(get().completedRounds, (get().currentUser || DEMO_USER).id),
}));
