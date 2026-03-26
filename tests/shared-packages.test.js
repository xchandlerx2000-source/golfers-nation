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
  getCourseOnCourseServiceAccess,
  createManualRoundTemplateRecord,
  getCourseTeeTimeAccess,
} from "../packages/course/src/index.js";
import {
  CORE_SHARED_BOUNDARIES,
  GAME_MODES,
  buildLeaderboard,
  createCourseServiceRequest,
  createTeeTimeRequest,
  createRound,
  formatCourseRequestTypeLabel,
  getCourseServiceRequestStatusLabel,
  getLatestCourseServiceRequest,
  transitionCourseServiceRequest,
  transitionTeeTimeRequest,
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
      displayName: "Torrey Pines Golf Course",
      metadata: {
        capabilities: {
          teeTimes: {
            enabled: true,
            mode: "external-link",
            url: "https://www.torreypines.com/tee-time-reservations/",
          },
        },
      },
    };

    const teeTimeAccess = getCourseTeeTimeAccess(course);

    expect(courseSupportsTeeTimeBooking(course)).toBe(true);
    expect(teeTimeAccess?.mode).toBe("external-link");
    expect(teeTimeAccess?.url).toContain("torreypines.com");
  });

  it("exposes tee-time request lifecycle helpers through the shared core package", () => {
    const request = createTeeTimeRequest({
      courseId: "boston-golf-club-hingham-ma",
      courseName: "Boston Golf Club",
      requesterUserId: "user-1",
    });
    const confirmed = transitionTeeTimeRequest(request, "confirmed", {
      confirmationCode: "TT-100",
    });

    expect(CORE_SHARED_BOUNDARIES.courseRequests).toContain("tee-time");
    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.metadata.confirmationCode).toBe("TT-100");
  });

  it("exposes generic course-service request lifecycle helpers through the shared core package", () => {
    const request = createCourseServiceRequest({
      courseId: "las-vegas-paiute-golf-resort-las-vegas-nv",
      courseName: "Las Vegas Paiute Golf Resort",
      roundId: "round-1",
      requesterUserId: "user-1",
      requestType: "beverage-cart",
    });
    const fulfilled = transitionCourseServiceRequest(request, "fulfilled", {
      deliveredBy: "cart-2",
    });

    expect(fulfilled.status).toBe("fulfilled");
    expect(fulfilled.metadata.deliveredBy).toBe("cart-2");
  });

  it("exposes on-course service capability and lookup helpers", () => {
    const course = {
      metadata: {
        capabilities: {
          onCourseServices: {
            enabled: true,
            mode: "request",
            requestTypes: ["beverage-cart", "guest-services"],
          },
        },
      },
    };
    const requests = [
      createCourseServiceRequest({
        courseId: "course-1",
        courseName: "Test Club",
        requesterUserId: "user-1",
        requestType: "beverage-cart",
      }),
    ];

    const serviceAccess = getCourseOnCourseServiceAccess(course);
    const latestRequest = getLatestCourseServiceRequest(requests, "course-1", "beverage-cart");

    expect(serviceAccess?.requestTypes).toContain("beverage-cart");
    expect(latestRequest?.requestType).toBe("beverage-cart");
    expect(getCourseServiceRequestStatusLabel("accepted")).toBe("Accepted");
    expect(formatCourseRequestTypeLabel("beverage-cart")).toBe("Beverage Cart");
  });
});
