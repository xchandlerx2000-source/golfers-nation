export const AUTH_GATEWAY_CONTRACT = Object.freeze({
  requiredMethods: [
    "restoreSession",
    "signOut",
    "listReviewAccounts",
  ],
  optionalMethods: [
    "signUpWithEmail",
    "signInWithEmail",
    "signInWithProvider",
    "signUpWithEmailAsync",
    "signInWithEmailAsync",
    "commitAuthResult",
    "requestPasswordResetAsync",
    "signOutAsync",
    "useReviewAccount",
    "togglePremiumForTesting",
  ],
});

export const DATA_GATEWAY_CONTRACT = Object.freeze({
  requiredMethods: [
    "loadInitialState",
    "prepareForPersistence",
    "persist",
    "saveWorkspace",
    "exportWorkspaceSnapshot",
  ],
  optionalMethods: [
    "submitTesterFeedbackAsync",
    "hydrateAccountAsync",
    "flushSyncAsync",
    "getCourseCapabilitiesAsync",
    "createTeeTimeRequestAsync",
    "createOnCourseServiceRequestAsync",
    "listRequestReviewQueueAsync",
  ],
});

export const COURSE_OPERATIONS_GATEWAY_CONTRACT = Object.freeze({
  optionalMethods: [
    "getCourseCapabilitiesAsync",
    "createTeeTimeRequestAsync",
    "listTeeTimeRequestsAsync",
    "createOnCourseServiceRequestAsync",
    "listOnCourseServiceRequestsAsync",
    "listRequestReviewQueueAsync",
  ],
  responsibilities: [
    "Resolve course capability flags without forcing a live booking integration.",
    "Support external booking links and request-based tee time flows.",
    "Leave room for future on-course service requests on a course-by-course basis.",
  ],
});

export const REALTIME_GATEWAY_CONTRACT = Object.freeze({
  requiredMethods: [
    "hostLiveRoundSession",
    "joinRoundSession",
    "publishRoundUpdate",
  ],
  helpers: [
    "describeLiveRoomFailure",
    "createLiveSessionMeta",
    "shouldApplyLiveSessionSnapshot",
    "publishLiveRoundUpdate",
    "hostLiveRoundSession",
    "joinLiveRoundSession",
  ],
});
