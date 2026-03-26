import { describe, expect, it } from "vitest";

import {
  AUTH_GATEWAY_CONTRACT,
  COURSE_OPERATIONS_GATEWAY_CONTRACT,
  DATA_GATEWAY_CONTRACT,
  REALTIME_GATEWAY_CONTRACT,
  createLiveSessionMeta,
} from "../packages/backend/src/index.js";
import {
  COURSE_PROVIDER_CONTRACT,
  COURSE_SERVICE_CONTRACT,
  courseSupportsTeeTimeBooking,
  createManualRoundTemplateRecord,
  getCourseTeeTimeAccess,
} from "../packages/course/src/index.js";
import {
  CORE_SHARED_BOUNDARIES,
  GAME_MODES,
  buildLeaderboard,
  createRound,
} from "../packages/core/src/index.js";

describe("shared monorepo package seams", () => {
  it("exposes core round and scoring helpers through the shared package", () => {
    const round = createRound({
      currentUser: {
        id: "user-1",
        profileId: "profile-1",
        name: "Alex Mercer",
        displayName: "Alex Mercer",
      },
      courseName: "Torrey Pines South",
      teeBox: "Blue",
      players: ["Alex Mercer", "Jordan Lee"],
      mode: "stroke",
    });

    expect(CORE_SHARED_BOUNDARIES.factories).toContain("Round");
    expect(GAME_MODES.stroke.label).toBe("Strokes");

    const leaderboard = buildLeaderboard(round, "user-1");
    expect(leaderboard.length).toBe(2);
  });

  it("exposes backend gateway contracts and realtime helpers", () => {
    const sessionMeta = createLiveSessionMeta({
      inviteCode: "gn18",
      roundId: "round-1",
    });

    expect(AUTH_GATEWAY_CONTRACT.requiredMethods).toContain("restoreSession");
    expect(DATA_GATEWAY_CONTRACT.requiredMethods).toContain("persist");
    expect(COURSE_OPERATIONS_GATEWAY_CONTRACT.optionalMethods).toContain("createTeeTimeRequestAsync");
    expect(REALTIME_GATEWAY_CONTRACT.helpers).toContain("joinLiveRoundSession");
    expect(sessionMeta.inviteCode).toBe("GN18");
  });

  it("exposes course template helpers and provider contracts", () => {
    const manualTemplate = createManualRoundTemplateRecord({
      courseName: "Pinehurst No. 2",
      teeBoxName: "White",
    });

    expect(COURSE_PROVIDER_CONTRACT.requiredMethods).toContain("searchCourses");
    expect(COURSE_SERVICE_CONTRACT.responsibilities[0]).toContain("Resolve nearby");
    expect(manualTemplate.courseName).toBe("Pinehurst No. 2");
    expect(manualTemplate.holes.length).toBe(18);
  });

  it("exposes shared course capability flags for tee-time support", () => {
    const course = {
      id: "torrey-pines-golf-course-la-jolla-ca",
      displayName: "Torrey Pines Golf Course",
      metadata: {},
    };

    const teeTimeAccess = getCourseTeeTimeAccess(course);

    expect(courseSupportsTeeTimeBooking(course)).toBe(true);
    expect(teeTimeAccess?.mode).toBe("external-link");
    expect(teeTimeAccess?.url).toContain("torreypines.com");
  });
});
