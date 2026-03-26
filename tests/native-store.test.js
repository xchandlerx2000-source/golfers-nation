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

  it("hosts a live round from the selected native course path", async () => {
    const round = await useAppStore.getState().hostLiveRound();

    expect(round.inviteCode).toBe("GN18");
    expect(round.players.length).toBeGreaterThan(1);
    expect(["connecting", "connected", "local-only"]).toContain(useAppStore.getState().liveSyncStatus);
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
});
