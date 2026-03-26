import { describe, expect, it } from "vitest";

import { toBackendCourseOverrideRecord, toBackendCourseReconciliationRecord } from "../src/services/backend-models.js";

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
    expect(record.uses_fallback_tee_data).toBe(true);
    expect(record.quality_issues).toContain("needs-hole-detail");
  });
});
