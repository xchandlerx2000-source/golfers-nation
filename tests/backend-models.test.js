import { describe, expect, it } from "vitest";

import {
  fromBackendCourseServiceRequestRecord,
  fromBackendTeeTimeRequestRecord,
  toBackendCourseServiceRequestRecord,
  toBackendCourseCapabilityRecord,
  toBackendCourseOverrideRecord,
  toBackendCourseReconciliationRecord,
  toBackendTeeTimeRequestRecord,
} from "../src/services/backend-models.js";

describe("backend course quality models", () => {
  it("maps a course override into a backend-ready admin record", () => {
    const record = toBackendCourseOverrideRecord({
      courseId: "torrey-pines-golf-course-la-jolla-ca",
      reviewStatus: "approved",
      reviewNotes: "Verified tee naming.",
      metadata: {
        adminOverrideFields: ["teeBoxes"],
        qualityIssues: ["tee-name-normalized"],
      },
    }, "user-123");

    expect(record.canonical_course_id).toBe("torrey-pines-golf-course-la-jolla-ca");
    expect(record.submitted_by_user_id).toBe("user-123");
    expect(record.review_status).toBe("approved");
    expect(record.override_fields).toContain("teeBoxes");
    expect(record.quality_issues).toContain("tee-name-normalized");
  });

  it("maps a reconciled course into a backend-ready queue record", () => {
    const record = toBackendCourseReconciliationRecord({
      id: "fireweed-meadows-golf-course-anchor-point-ak",
      displayName: "Fireweed Meadows Golf Course",
      city: "Anchor Point",
      state: "AK",
      providerId: "imported-us-course-database",
      metadata: {
        readinessTier: "basic-round-ready",
        confidenceTier: "medium",
        matchConfidence: 0.82,
        completenessScore: 0.61,
        teeTimes: {
          enabled: true,
          mode: "request",
        },
        adminOverrideApplied: false,
        adminReviewStatus: "",
        qualityIssues: ["needs-hole-detail"],
        sourceHistory: ["public-us-golf-courses"],
        qualityFlags: {
          hasRealTeeData: false,
          hasRealHoleData: false,
          hasRealRatingSlope: false,
          usesFallbackTeeData: true,
          usesFallbackHoleData: true,
        },
      },
    });

    expect(record.canonical_course_id).toBe("fireweed-meadows-golf-course-anchor-point-ak");
    expect(record.readiness_tier).toBe("basic-round-ready");
    expect(record.tee_times_enabled).toBe(true);
    expect(record.tee_times_mode).toBe("request");
    expect(record.uses_fallback_tee_data).toBe(true);
    expect(record.quality_issues).toContain("needs-hole-detail");
  });

  it("maps capability and tee-time request records for backend persistence", () => {
    const capabilityRecord = toBackendCourseCapabilityRecord({
      id: "boston-golf-club-hingham-ma",
      providerId: "imported-us-course-database",
      metadata: {
        teeTimes: {
          enabled: true,
          mode: "request",
          provider: "partner-request",
        },
        onCourseServices: {
          enabled: true,
          mode: "request",
          requestTypes: ["beverage-cart"],
        },
      },
    });
    const requestRecord = toBackendTeeTimeRequestRecord({
      id: "tee-time-1",
      courseId: "boston-golf-club-hingham-ma",
      mode: "request",
      status: "requested",
      notes: "Next available.",
      metadata: {
        source: "native-alpha",
      },
    }, "user-123");
    const serviceRequestRecord = toBackendCourseServiceRequestRecord({
      id: "service-1",
      courseId: "las-vegas-paiute-golf-resort-las-vegas-nv",
      roundId: "round-1",
      requestType: "beverage-cart",
      status: "requested",
      notes: "Need water on the back nine.",
    }, "user-123");

    expect(capabilityRecord.tee_times_mode).toBe("request");
    expect(capabilityRecord.on_course_request_types).toContain("beverage-cart");
    expect(requestRecord.course_id).toBe("boston-golf-club-hingham-ma");
    expect(requestRecord.course_name).toBe("");
    expect(requestRecord.requester_user_id).toBe("user-123");
    expect(requestRecord.status).toBe("requested");
    expect(serviceRequestRecord.request_type).toBe("beverage-cart");
    expect(serviceRequestRecord.round_id).toBe("round-1");
  });

  it("maps backend request rows back into client-safe request records", () => {
    const teeTimeRequest = fromBackendTeeTimeRequestRecord({
      id: "tee-time-1",
      course_id: "torrey-pines-golf-course-la-jolla-ca",
      course_name: "Torrey Pines Golf Course",
      requester_user_id: "user-123",
      requester_profile_id: "profile-123",
      request_mode: "request",
      provider: "partner-request",
      desired_window_label: "Saturday morning",
      status: "requested",
      requested_at: "2026-03-26T10:00:00.000Z",
      metadata: {
        source: "native-alpha",
      },
    });
    const serviceRequest = fromBackendCourseServiceRequestRecord({
      id: "service-1",
      course_id: "las-vegas-paiute-golf-resort-las-vegas-nv",
      course_name: "Las Vegas Paiute Golf Resort",
      round_id: "round-1",
      requester_user_id: "user-123",
      requester_profile_id: "profile-123",
      request_type: "beverage-cart",
      status: "accepted",
      requested_at: "2026-03-26T10:05:00.000Z",
      metadata: {
        source: "native-alpha",
      },
    });

    expect(teeTimeRequest.courseName).toBe("Torrey Pines Golf Course");
    expect(teeTimeRequest.desiredWindowLabel).toBe("Saturday morning");
    expect(serviceRequest.requestType).toBe("beverage-cart");
    expect(serviceRequest.status).toBe("accepted");
  });
});
