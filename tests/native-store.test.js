import { beforeEach, describe, expect, it } from "vitest";

import { getCourseTeeTimeAccess } from "../packages/course/src/index.js";
import { clearNativeAppSession, writeNativeAppSession } from "../apps/native/src/services/native-platform.js";
import { resetNativeCourseCatalogCache } from "../apps/native/src/services/native-course-service.js";
import { useAppStore } from "../apps/native/src/store/useAppStore.js";

describe("native app store", () => {
  beforeEach(async () => {
    await clearNativeAppSession();
    resetNativeCourseCatalogCache();
    useAppStore.setState({
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
        courseId: useAppStore.getInitialState().setup.courseId,
        courseQuery: "",
        mode: "stroke",
      },
      courseResults: useAppStore.getInitialState().courseResults,
      courseResultsStatus: "idle",
      courseResultsSource: "starter",
      courseCatalogNotice: "",
      selectedCourse: useAppStore.getInitialState().selectedCourse,
      completedRounds: [],
      socialProfiles: useAppStore.getInitialState().socialProfiles,
      socialPosts: useAppStore.getInitialState().socialPosts,
      socialConversations: useAppStore.getInitialState().socialConversations,
      socialSettings: useAppStore.getInitialState().socialSettings,
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
    });
  });

  it("restores a persisted native app session", async () => {
    await writeNativeAppSession({
      signedIn: true,
      currentUser: {
        id: "persisted-user",
        displayName: "Persisted Golfer",
      },
      authMode: "local-demo",
    });

    await useAppStore.getState().restoreSession();

    expect(useAppStore.getState().signedIn).toBe(true);
    expect(useAppStore.getState().currentUser.displayName).toBe("Persisted Golfer");
    expect(useAppStore.getState().sessionRestoredFrom).toBe("native-storage");
  });

  it("searches the native course catalog fallback and starts a playable round from a real course record", async () => {
    const store = useAppStore.getState();
    store.setCourseQuery("Boston");
    const results = await useAppStore.getState().refreshCourseSearch();

    expect(results.length).toBeGreaterThan(0);
    await useAppStore.getState().selectCourse(results[0].id);

    const round = await useAppStore.getState().startSoloRound();
    expect(round.courseName).toBeTruthy();
    expect(round.courseId).toBeTruthy();
    expect(round.holes.length).toBeGreaterThan(0);
  });

  it("hydrates tee-time capability metadata onto supported native catalog courses", async () => {
    useAppStore.getState().setCourseQuery("Torrey");
    const results = await useAppStore.getState().refreshCourseSearch();
    const torreyPines = results.find((course) => course.id === "torrey-pines-golf-course-la-jolla-ca");

    expect(torreyPines).toBeTruthy();
    expect(getCourseTeeTimeAccess(torreyPines)?.url).toContain("torreypines.com");
  });

  it("creates a local tee-time request for request-enabled courses", async () => {
    useAppStore.getState().setCourseQuery("Boston");
    const results = await useAppStore.getState().refreshCourseSearch();
    const requestCourse = results.find((course) => course.id === "boston-golf-club-hingham-ma");

    expect(requestCourse).toBeTruthy();
    await useAppStore.getState().selectCourse(requestCourse.id);

    const request = await useAppStore.getState().createSelectedCourseTeeTimeRequest();

    expect(request?.courseId).toBe("boston-golf-club-hingham-ma");
    expect(request?.status).toBe("requested");
    expect(request?.metadata?.syncStatus).toBe("local-only");
    expect(useAppStore.getState().teeTimeRequests[0]?.courseId).toBe("boston-golf-club-hingham-ma");
  });

  it("hosts a live round from the selected native course path", async () => {
    const round = await useAppStore.getState().hostLiveRound();

    expect(round.inviteCode).toBe("GN18");
    expect(round.players.length).toBeGreaterThan(1);
    expect(["connecting", "connected", "local-only"]).toContain(useAppStore.getState().liveSyncStatus);
  });

  it("creates a local on-course service request for supported active-round courses", async () => {
    useAppStore.getState().setCourseQuery("Paiute");
    const results = await useAppStore.getState().refreshCourseSearch();
    const serviceCourse = results.find((course) => course.id === "las-vegas-paiute-golf-resort-las-vegas-nv");

    expect(serviceCourse).toBeTruthy();
    await useAppStore.getState().selectCourse(serviceCourse.id);
    await useAppStore.getState().startSoloRound();

    const request = await useAppStore.getState().createActiveRoundCourseServiceRequest("beverage-cart");

    expect(request?.courseId).toBe("las-vegas-paiute-golf-resort-las-vegas-nv");
    expect(request?.requestType).toBe("beverage-cart");
    expect(request?.metadata?.syncStatus).toBe("local-only");
    expect(useAppStore.getState().courseServiceRequests[0]?.requestType).toBe("beverage-cart");
  });

  it("builds a local-safe review queue when cloud request persistence is unavailable", async () => {
    useAppStore.getState().setCourseQuery("Boston");
    const results = await useAppStore.getState().refreshCourseSearch();
    const requestCourse = results.find((course) => course.id === "boston-golf-club-hingham-ma");

    await useAppStore.getState().selectCourse(requestCourse.id);
    await useAppStore.getState().createSelectedCourseTeeTimeRequest();

    useAppStore.getState().setCourseQuery("Paiute");
    const serviceResults = await useAppStore.getState().refreshCourseSearch();
    const serviceCourse = serviceResults.find((course) => course.id === "las-vegas-paiute-golf-resort-las-vegas-nv");
    await useAppStore.getState().selectCourse(serviceCourse.id);
    await useAppStore.getState().startSoloRound();
    await useAppStore.getState().createActiveRoundCourseServiceRequest("beverage-cart");

    const queue = await useAppStore.getState().refreshRequestReviewQueue();

    expect(queue.length).toBeGreaterThan(1);
    expect(useAppStore.getState().requestReviewQueueStatus).toBe("local-only");
    expect(useAppStore.getState().requestReviewQueue[0]?.queueType).toBeTruthy();
  });

  it("marks an expired cloud session and keeps the active round local-safe", async () => {
    useAppStore.setState({
      signedIn: true,
      currentUser: {
        id: "cloud-user",
        displayName: "Cloud Golfer",
      },
      authMode: "supabase",
      activeRound: {
        inviteCode: "GN18",
      },
      liveSyncStatus: "connected",
    });

    const result = await useAppStore.getState().revalidateSession();

    expect(result.expired).toBe(true);
    expect(useAppStore.getState().signedIn).toBe(false);
    expect(useAppStore.getState().authHealthStatus).toBe("expired");
    expect(useAppStore.getState().liveSyncStatus).toBe("retry-needed");
  });

  it("requires an email before starting password reset", async () => {
    const result = await useAppStore.getState().requestPasswordReset("");

    expect(result.error.message).toBe("Enter your email first.");
    expect(useAppStore.getState().authError).toBe("Enter your email first.");
  });

  it("finishes a round into completed history and exposes stats", async () => {
    await useAppStore.getState().startSoloRound();
    const activeRound = useAppStore.getState().activeRound;
    const completedRound = {
      ...activeRound,
      holes: activeRound.holes.map((hole) => ({
        ...hole,
        entries: hole.entries.map((entry, index) =>
          index === 0
            ? { ...entry, strokes: hole.par, updatedAt: Date.now() }
            : entry
        ),
      })),
    };
    useAppStore.setState({ activeRound: completedRound });

    await useAppStore.getState().finishRound();

    expect(useAppStore.getState().activeRound).toBeNull();
    expect(useAppStore.getState().completedRounds.length).toBe(1);
    expect(useAppStore.getState().getCompletedRoundStats().roundsPlayed).toBe(1);
  });

  it("creates native social posts and direct messages that persist in store state", async () => {
    await useAppStore.getState().signInDemo();
    const circle = useAppStore.getState().getSocialCircle();

    expect(circle.length).toBeGreaterThan(0);

    await useAppStore.getState().createSocialPost({
      message: "Testing the Clubhouse post flow.",
      linkUrl: "",
    });
    await useAppStore.getState().sendDirectMessage(circle[0].id, "You free for a round this week?");

    const feed = useAppStore.getState().getCommunityFeed();
    const inbox = useAppStore.getState().getDirectInbox();

    expect(feed[0]?.message).toBe("Testing the Clubhouse post flow.");
    expect(inbox[0]?.messages[inbox[0].messages.length - 1]?.text).toBe("You free for a round this week?");
  });

  it("promotes followed golfers to friends and exposes their preview state", async () => {
    await useAppStore.getState().signInDemo();
    const target = useAppStore.getState().getSocialCircle()[0];

    await useAppStore.getState().toggleFollowProfile(target.id);
    await useAppStore.getState().addFriendProfile(target.id);

    const preview = useAppStore.getState().getSocialProfile(target.id);

    expect(preview.isFriend).toBe(true);
    expect(preview.isFollowed).toBe(true);
  });
});
