import { describe, expect, it } from "vitest";

import { normalizeImportedCourseSourceRecord } from "../src/services/course-normalization.js";
import { applyCourseAdminOverrides, buildCourseReconciliationReport } from "../src/services/course-reconciliation.js";

describe("course reconciliation pipeline", () => {
  it("applies manual overrides after enrichment and tracks admin metadata", () => {
    const overridden = applyCourseAdminOverrides([
      {
        id: "sample-course-austin-tx",
        displayName: "Sample Course",
        city: "Austin",
        state: "TX",
        address: "100 Fairway Dr",
        source: "public-golf-enrichment",
        metadata: {
          sourceHistory: ["public-us-golf-courses", "public-golf-enrichment"],
        },
      },
    ], [
      {
        courseId: "sample-course-austin-tx",
        address: "101 Fairway Dr",
        reviewStatus: "approved",
        reviewNotes: "Verified against clubhouse correction.",
        metadata: {
          qualityIssues: ["address-corrected"],
        },
      },
    ]);

    const normalized = normalizeImportedCourseSourceRecord(overridden[0], {
      providerId: "imported-us-course-database",
      source: "imported-course-catalog",
      sourceType: "bulk-import",
    });

    expect(normalized.address).toBe("101 Fairway Dr");
    expect(normalized.metadata.adminOverrideApplied).toBe(true);
    expect(normalized.metadata.adminReviewStatus).toBe("approved");
    expect(normalized.metadata.adminOverrideFields).toContain("address");
    expect(normalized.metadata.qualityIssues).toContain("address-corrected");
    expect(normalized.metadata.sourceHistory).toContain("admin-course-overrides");
  });

  it("builds a reconciliation report with override and queue summaries", () => {
    const report = buildCourseReconciliationReport([
      {
        id: "course-rich",
        displayName: "Rich Course",
        city: "Austin",
        state: "TX",
        providerId: "imported-us-course-database",
        metadata: {
          readinessTier: "rich-round-ready",
          confidenceTier: "high",
          matchConfidence: 0.98,
          adminOverrideApplied: true,
          adminReviewStatus: "approved",
          teeTimes: {
            enabled: true,
            mode: "external-link",
          },
          qualityFlags: {
            hasAddress: true,
            hasCoordinates: true,
            usesFallbackTeeData: false,
            usesFallbackHoleData: false,
            hasRealRatingSlope: true,
          },
        },
      },
      {
        id: "course-basic",
        displayName: "Basic Course",
        city: "Dallas",
        state: "TX",
        providerId: "imported-us-course-database",
        metadata: {
          readinessTier: "basic-round-ready",
          confidenceTier: "medium",
          matchConfidence: 0.82,
          qualityFlags: {
            hasAddress: false,
            hasCoordinates: true,
            usesFallbackTeeData: true,
            usesFallbackHoleData: true,
            hasRealRatingSlope: false,
          },
        },
      },
    ], [
      {
        courseId: "course-rich",
        reviewStatus: "approved",
      },
      {
        courseId: "missing-course",
        reviewStatus: "pending",
      },
    ], {
      generatedAt: "2026-03-25T00:00:00.000Z",
      assetVersion: "abc123def456",
    });

    expect(report.recordCount).toBe(2);
    expect(report.overrideSummary.overrideRows).toBe(2);
    expect(report.overrideSummary.overriddenRecords).toBe(1);
    expect(report.overrideSummary.unmatchedOverrides).toHaveLength(1);
    expect(report.capabilitySummary.teeTimes.enabled).toBe(1);
    expect(report.capabilitySummary.teeTimes.externalLink).toBe(1);
    expect(report.reviewQueueSummary.priority.high).toBeGreaterThan(0);
    expect(report.reviewQueueSummary.reasons["fallback-hole-data"]).toBeGreaterThan(0);
    expect(report.reviewQueue.highPriority[0].id).toBe("course-basic");
  });
});
