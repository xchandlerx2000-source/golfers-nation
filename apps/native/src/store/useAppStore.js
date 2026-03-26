import { create } from "zustand";
import {
  createRound,
  GAME_MODES,
  getRoundSummary,
} from "@golfers-nation/core";
import { getDefaultCourseTeeBoxRecord } from "@golfers-nation/course";
import {
  DEMO_USER,
  RECOMMENDED_COURSES,
  SAMPLE_PLAYERS,
  STARTER_COURSES,
} from "../lib/seed-state";
import {
  buildNativeRoundTemplate,
  getBundledRecommendedCourses,
  loadNativeCourseById,
  prepareNativeCourseCatalog,
  recordRecentNativeCourse,
  searchNativeCourseCatalog,
} from "../services/native-course-service";
import {
  broadcastLiveMemberStateNative,
  broadcastLiveRoundSnapshotNative,
  clearNativeAppSession,
  fetchLiveRoundByCodeNative,
  joinRoundByCodeNative,
  requestPasswordResetNative,
  revalidateNativeAuthSession,
  restoreNativeAuthSession,
  signInWithEmailNative,
  signOutNative,
  signUpWithEmailNative,
  writeNativeAppSession,
} from "../services/native-platform";
import {
  connectNativeRealtimeSession,
  disconnectNativeRealtimeSession,
} from "../services/native-realtime-session";

const DEFAULT_RECOMMENDED_COURSES = getBundledRecommendedCourses(6);
const DEFAULT_COURSE = DEFAULT_RECOMMENDED_COURSES[0] || STARTER_COURSES[0] || null;
const LIVE_SYNC_POLL_INTERVAL_MS = 12_000;
const NATIVE_REALTIME_DEVICE_ID = `native-device-${Date.now()}`;

let liveSyncTimer = null;
let liveSyncInFlight = false;

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
    players: live
      ? [
          (currentUser || DEMO_USER).displayName,
          ...SAMPLE_PLAYERS.map((player) => ({
            id: player.id,
            profileId: player.id,
            displayName: player.displayName,
            username: player.username,
            avatarLabel: player.avatarLabel,
          })),
        ]
      : [(currentUser || DEMO_USER).displayName],
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
    currentUser,
    authMode,
    restoredFrom: "native-storage",
  };
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

function stopLiveSyncLoop() {
  if (liveSyncTimer) {
    clearInterval(liveSyncTimer);
    liveSyncTimer = null;
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
  selectedCourse: DEFAULT_COURSE,
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
      set({
        bootStatus: "ready",
        signedIn: true,
        currentUser: restored.currentUser,
        authMode: restored.authMode || "local-demo",
        sessionRestoredFrom: restored.restoredFrom || "",
        authHealthStatus: restored.authMode === "supabase" ? "active" : "local",
        authHealthNotice: restored.authMode === "supabase" ? "Cloud session active." : "Local tester session active.",
        sessionExpiresAt: Number(restored.sessionExpiresAt || 0),
        lastAuthCheckAt: Date.now(),
        authNotice: restored.restoredFrom === "supabase" ? "Session restored." : "",
      });
      return;
    }

    set({
      bootStatus: "ready",
      signedIn: false,
      currentUser: null,
      sessionRestoredFrom: "",
      authHealthStatus: "signed-out",
      authHealthNotice: "",
      sessionExpiresAt: 0,
      lastAuthCheckAt: Date.now(),
    });
  },
  signInDemo: async () => {
    const session = createPersistedSession(DEMO_USER, "local-demo");
    await writeNativeAppSession(session);
    set({
      signedIn: true,
      currentUser: DEMO_USER,
      authMode: "local-demo",
      authError: "",
      authNotice: "",
      authBusy: false,
      sessionRestoredFrom: "native-storage",
      authHealthStatus: "local",
      authHealthNotice: "Local tester session active.",
      sessionExpiresAt: 0,
      lastAuthCheckAt: Date.now(),
    });
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

    set({
      signedIn: true,
      currentUser: result.session.currentUser,
      authMode: "supabase",
      authError: "",
      authNotice: "Signed in.",
      authBusy: false,
      sessionRestoredFrom: "supabase",
      authHealthStatus: "active",
      authHealthNotice: "Cloud session active.",
      sessionExpiresAt: Number(result.session.sessionExpiresAt || 0),
      lastAuthCheckAt: Date.now(),
    });
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
      set({
        signedIn: true,
        currentUser: result.session.currentUser,
        authMode: "supabase",
        authError: "",
        authNotice: "Account ready.",
        authBusy: false,
        sessionRestoredFrom: "supabase",
        authHealthStatus: "active",
        authHealthNotice: "Cloud session active.",
        sessionExpiresAt: Number(result.session.sessionExpiresAt || 0),
        lastAuthCheckAt: Date.now(),
      });
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
    set({
      signedIn: false,
      currentUser: null,
      authMode: "local-demo",
      activeRound: null,
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
      set({
        signedIn: true,
        currentUser: result.currentUser,
        authMode: "supabase",
        sessionRestoredFrom: "supabase",
        authHealthStatus: "active",
        authHealthNotice: result.notice,
        sessionExpiresAt: Number(result.sessionExpiresAt || 0),
        lastAuthCheckAt: Date.now(),
        authNotice: quiet ? get().authNotice : "Session refreshed.",
      });
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
  prepareCourseSetup: async () => {
    if (String(get().setup.courseQuery || "").trim()) {
      return get().refreshCourseSearch();
    }

    set({ courseResultsStatus: "loading", courseCatalogNotice: "" });
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
        ? "Using bundled course picks until the expanded catalog loads on device."
        : prepared.source.includes("recent")
          ? "Nearby and recent courses are ready offline."
          : "",
    }));
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
    set({
      courseResultsStatus: String(query || "").trim() ? "searching" : "loading",
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
      await broadcastLiveMemberStateNative({
        round,
        group: remote.session.group,
        currentUser: get().currentUser || DEMO_USER,
        deviceId: NATIVE_REALTIME_DEVICE_ID,
      });
      return round;
    }

    const fallbackRound = await buildRoundFromSetup({
      courseId: DEFAULT_RECOMMENDED_COURSES[1]?.id || DEFAULT_COURSE?.id || null,
      mode: "stroke",
    }, get().currentUser || DEMO_USER, DEFAULT_RECOMMENDED_COURSES[1] || DEFAULT_COURSE, {
      live: true,
    });
    fallbackRound.inviteCode = cleanedCode;
    fallbackRound.sync.state = "connected";
    fallbackRound.sync.label = "Live cloud sync";
    set({
      activeRound: fallbackRound,
      joinedCode: cleanedCode,
      recentInviteCode: cleanedCode,
      authNotice: remote?.error?.message || "",
      liveSyncStatus: remote?.status === "local-only" ? "local-only" : "retry-needed",
      liveSyncNotice: remote?.error?.message || "Live join fell back to a local-safe copy.",
    });
    return fallbackRound;
  },
  refreshLiveRound: async (force = false) => {
    const round = get().activeRound;
    if (!round?.inviteCode) {
      return null;
    }

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
  getRoundSummary: () => {
    const round = get().activeRound;
    if (!round) {
      return null;
    }

    return getRoundSummary(round, (get().currentUser || DEMO_USER).id);
  },
}));
