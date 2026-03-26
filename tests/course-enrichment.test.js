import { describe, expect, it } from "vitest";

import { mergeImportedCourseRowsWithEnrichment } from "../src/services/course-enrichment.js";
import { normalizeImportedCourseSourceRecord } from "../src/services/course-normalization.js";

describe("course enrichment pipeline", () => {
  it("merges enrichment fields onto the imported nationwide base row", () => {
    const merged = mergeImportedCourseRowsWithEnrichment([
      {
        id: "sample-course-austin-tx",
        clubName: "Sample Course",
        courseName: "Sample Course",
        displayName: "Sample Course",
        city: "Austin",
        state: "TX",
        latitude: 30.2672,
        longitude: -97.7431,
        holesCount: 18,
        source: "public-us-golf-courses",
        sourceType: "public-open-data-import",
        providerLabel: "Public U.S. golf course dataset",
      },
    ], [
      {
        id: "sample-course-austin-tx",
        clubName: "Sample Course",
        courseName: "Sample Course",
        displayName: "Sample Course",
        address: "100 Fairway Dr",
        city: "Austin",
        state: "TX",
        postalCode: "78701",
        architect: "A. Designer",
        opened: 1997,
        courseType: "public",
        source: "seanconeys-us-golf-courses",
        sourceType: "public-golf-enrichment",
        metadata: {
          clubhousePhone: "555-111-2222",
          greensType: "Bent Grass",
        },
      },
    ]);

    const normalized = normalizeImportedCourseSourceRecord(merged[0], {
      providerId: "imported-us-course-database",
      source: "imported-course-catalog",
      sourceType: "bulk-import",
    });

    expect(normalized.address).toBe("100 Fairway Dr");
    expect(normalized.latitude).toBe(30.2672);
    expect(normalized.metadata.clubhousePhone).toBe("555-111-2222");
    expect(normalized.metadata.greensType).toBe("Bent Grass");
    expect(normalized.metadata.enrichmentApplied).toBe(true);
  });

  it("does not add unmatched enrichment rows into the nearby/search base catalog", () => {
    const merged = mergeImportedCourseRowsWithEnrichment([
      {
        id: "base-course-san-diego-ca",
        displayName: "Base Course",
        city: "San Diego",
        state: "CA",
      },
    ], [
      {
        id: "other-course-phoenix-az",
        displayName: "Other Course",
        city: "Phoenix",
        state: "AZ",
        address: "123 Desert Way",
      },
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("base-course-san-diego-ca");
    expect(merged[0].address || "").toBe("");
  });

  it("accepts future tee-box enrichment without changing the base import pipeline", () => {
    const merged = mergeImportedCourseRowsWithEnrichment([
      {
        id: "future-detail-course-dallas-tx",
        displayName: "Future Detail Course",
        city: "Dallas",
        state: "TX",
        latitude: 32.7767,
        longitude: -96.797,
      },
    ], [
      {
        id: "future-detail-course-dallas-tx",
        displayName: "Future Detail Course",
        city: "Dallas",
        state: "TX",
        teeBoxes: [
          {
            id: "blue",
            name: "Blue",
            slope: 132,
            rating: 72.1,
            holes: [{ number: 1, par: 4, yards: 410 }],
          },
        ],
      },
    ]);

    const normalized = normalizeImportedCourseSourceRecord(merged[0], {
      providerId: "imported-us-course-database",
      source: "imported-course-catalog",
      sourceType: "bulk-import",
    });

    expect(normalized.teeBoxes).toHaveLength(1);
    expect(normalized.teeBoxes[0].slope).toBe(132);
    expect(normalized.teeBoxes[0].rating).toBe(72.1);
  });
});
