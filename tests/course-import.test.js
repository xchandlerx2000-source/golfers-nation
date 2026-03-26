import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";

import { createCourseRoundTemplateRecord, getDefaultCourseTeeBoxRecord } from "../src/domain/course-models.js";
import { normalizeImportedCourseSourceRecord, normalizeImportedCourseSourceRecords } from "../src/services/course-normalization.js";
import { dedupeCanonicalCourseRecords } from "../src/services/course-deduplication.js";
import { buildUsCourseImportCatalog, findNearbyUsCourseImportCatalog, searchUsCourseImportCatalog } from "../src/services/course-import/us-course-import-service.js";
import { getCourseCatalogManifest } from "../src/services/course-catalog-loader.js";

describe("course import pipeline", () => {
  it("normalizes imported provider rows into canonical course records", () => {
    const course = normalizeImportedCourseSourceRecord({
      id: "torrey-import",
      clubName: "Torrey Pines",
      courseName: "South",
      displayName: "Torrey Pines - South",
      city: "La Jolla",
      state: "CA",
      zip: "92037",
      lat: 32.9044,
      lng: -117.2519,
      teeBoxes: [
        {
          id: "south-blue",
          name: "Blue",
          slope: 148,
          rating: 77.7,
          holes: [{ number: 1, par: 4, yards: 454 }],
        },
      ],
      externalIds: {
        providerCourseId: "tp-south-1",
      },
    }, {
      providerId: "imported-us-course-database",
      providerLabel: "Imported U.S. course database",
      source: "licensed-export-2026",
    });

    expect(course.providerId).toBe("imported-us-course-database");
    expect(course.displayName).toBe("Torrey Pines - South");
    expect(course.postalCode).toBe("92037");
    expect(course.metadata.qualityFlags.hasCoordinates).toBe(true);
    expect(course.metadata.discoveryReady).toBe(true);
    expect(course.metadata.basicRoundReady).toBe(true);
    expect(course.metadata.richRoundReady).toBe(true);
    expect(course.metadata.readinessTier).toBe("rich-round-ready");
    expect(course.metadata.qualityFlags.hasRealTeeData).toBe(true);
    expect(course.metadata.qualityFlags.hasRealHoleData).toBe(true);
    expect(course.metadata.qualityFlags.hasRealRatingSlope).toBe(true);
    expect(course.metadata.providerCourseId).toBe("tp-south-1");
  });

  it("deduplicates imported course rows and keeps the most complete record", () => {
    const records = normalizeImportedCourseSourceRecords([
      {
        id: "pebble-a",
        providerCourseId: "pebble-1",
        clubName: "Pebble Beach",
        courseName: "Golf Links",
        displayName: "Pebble Beach Golf Links",
        city: "Pebble Beach",
        state: "CA",
      },
      {
        id: "pebble-b",
        providerCourseId: "pebble-1",
        clubName: "Pebble Beach",
        courseName: "Golf Links",
        displayName: "Pebble Beach Golf Links",
        city: "Pebble Beach",
        state: "CA",
        latitude: 36.5683,
        longitude: -121.9482,
        address: "1700 17 Mile Dr",
        teeBoxes: [
          {
            id: "champ",
            name: "Championship",
            holes: [{ number: 1, par: 4, yards: 381 }],
          },
        ],
      },
    ], {
      providerId: "imported-us-course-database",
      source: "licensed-export-2026",
    });

    const deduped = dedupeCanonicalCourseRecords(records);

    expect(deduped).toHaveLength(1);
    expect(deduped[0].address).toBe("1700 17 Mile Dr");
    expect(deduped[0].metadata.qualityFlags.hasCoordinates).toBe(true);
    expect(deduped[0].metadata.readinessTier).toBe("basic-round-ready");
    expect(deduped[0].teeBoxes.length).toBeGreaterThan(0);
  });

  it("supports real-course search and nearby lookup from the import catalog", () => {
    const catalog = buildUsCourseImportCatalog([
      {
        id: "golden-nugget-lake-charles",
        displayName: "The Country Club at Golden Nugget",
        clubName: "Golden Nugget",
        courseName: "Country Club",
        city: "Lake Charles",
        state: "LA",
        latitude: 30.1869,
        longitude: -93.2754,
        teeBoxes: [{ id: "tee-1", name: "Tee 1", holes: [{ number: 1, par: 5, yards: 501 }] }],
        aliases: ["Golden Nugget Lake Charles"],
        searchTerms: ["lake charles", "louisiana"],
      },
      {
        id: "tpc-louisiana-avondale",
        displayName: "TPC Louisiana",
        city: "Avondale",
        state: "LA",
        latitude: 29.9113,
        longitude: -90.1896,
        teeBoxes: [{ id: "blue", name: "Blue", holes: [{ number: 1, par: 4, yards: 441 }] }],
      },
    ], {
      providerId: "us-course-database",
      source: "us-seeded-course-database",
    });

    const searched = searchUsCourseImportCatalog(catalog, "Lake Charles", { limit: 3 });
    const nearby = findNearbyUsCourseImportCatalog(catalog, 30.1869, -93.2754, { limit: 2, radiusMiles: 25 });

    expect(searched[0].id).toBe("golden-nugget-lake-charles");
    expect(nearby[0].id).toBe("golden-nugget-lake-charles");
    expect(nearby[0].nearbyDistanceMiles).toBeLessThan(1);
  });

  it("creates a playable fallback tee when imported data only has course location fields", () => {
    const course = normalizeImportedCourseSourceRecord({
      id: "public-course-only",
      displayName: "Public Course Only",
      city: "Austin",
      state: "TX",
      latitude: 30.2672,
      longitude: -97.7431,
      holesCount: 18,
    }, {
      providerId: "imported-us-course-database",
      source: "public-open-data-import",
    });

    const teeBox = getDefaultCourseTeeBoxRecord(course);
    const template = createCourseRoundTemplateRecord({
      course,
      teeBox,
      holeCount: 18,
    });

    expect(teeBox.name).toBe("Default");
    expect(template.holes).toHaveLength(18);
    expect(template.courseName).toBe("Public Course Only");
    expect(course.metadata.discoveryReady).toBe(true);
    expect(course.metadata.basicRoundReady).toBe(true);
    expect(course.metadata.richRoundReady).toBe(false);
    expect(course.metadata.readinessTier).toBe("basic-round-ready");
    expect(course.metadata.qualityFlags.hasRealTeeData).toBe(false);
    expect(course.metadata.qualityFlags.usesFallbackTeeData).toBe(true);
    expect(course.metadata.qualityFlags.usesFallbackHoleData).toBe(true);
  });

  it("emits runtime discovery and detail-shard assets for the imported catalog", async () => {
    const manifest = getCourseCatalogManifest();
    const nearbyIndexPath = `${process.cwd()}\\${manifest.nearbyIndexPath.replace(/\//g, "\\")}`;
    const discoveryIndexPath = `${process.cwd()}\\${manifest.discoveryIndexPath.replace(/\//g, "\\")}`;
    const firstShardPath = `${process.cwd()}\\${manifest.detailShards[0].path.replace(/\//g, "\\")}`;
    const reconciliationReportPath = `${process.cwd()}\\data\\course\\reconciliation-report.json`;
    const adminOverridesPath = `${process.cwd()}\\data\\course\\admin-overrides.json`;

    const nearbyIndex = JSON.parse(await readFile(nearbyIndexPath, "utf8"));
    const discoveryIndex = JSON.parse(await readFile(discoveryIndexPath, "utf8"));
    const firstShard = JSON.parse(await readFile(firstShardPath, "utf8"));
    const reconciliationReport = JSON.parse(await readFile(reconciliationReportPath, "utf8"));
    const adminOverrides = JSON.parse(await readFile(adminOverridesPath, "utf8"));

    expect(manifest.assetVersion).toMatch(/^[a-f0-9]{12}$/);
    expect(manifest.nearbyIndexPath).toContain("nearby-index.json");
    expect(nearbyIndex.recordCount).toBeGreaterThan(0);
    expect(nearbyIndex.recordCount).toBeLessThanOrEqual(manifest.recordCount);
    expect(nearbyIndex.courses[0].detailShard).toBeTruthy();
    expect(discoveryIndex.recordCount).toBe(manifest.recordCount);
    expect(manifest.qualitySummary.readinessTiers["basic-round-ready"]).toBeGreaterThan(0);
    expect(manifest.qualitySummary.readinessTiers["rich-round-ready"]).toBeGreaterThan(0);
    expect(manifest.qualitySummary.confidenceTiers.medium).toBeGreaterThan(0);
    expect(manifest.qualitySummary.hasRealTeeData).toBeGreaterThan(0);
    expect(manifest.qualitySummary.hasRealHoleData).toBeGreaterThan(0);
    expect(manifest.qualitySummary.hasRealRatingSlope).toBeGreaterThan(0);
    expect(typeof manifest.reconciliationSummary.overriddenRecords).toBe("number");
    expect(typeof manifest.reconciliationSummary.reviewedRecords).toBe("number");
    expect(discoveryIndex.courses[0].detailShard).toBeTruthy();
    expect(Array.isArray(discoveryIndex.courses[0].holes)).toBe(false);
    expect(discoveryIndex.courses[0].metadata.readinessTier).toBeTruthy();
    expect(typeof discoveryIndex.courses[0].metadata.matchConfidence).toBe("number");
    expect(firstShard.recordCount).toBeGreaterThan(0);
    expect(firstShard.courses[0].holes).toBeTruthy();
    expect(reconciliationReport.assetVersion).toBe(manifest.assetVersion);
    expect(reconciliationReport.recordCount).toBe(manifest.recordCount);
    expect(reconciliationReport.overrideSummary).toBeTruthy();
    expect(reconciliationReport.reviewQueueSummary).toBeTruthy();
    expect(adminOverrides.assetVersion).toBe(manifest.assetVersion);
    expect(Array.isArray(adminOverrides.rows)).toBe(true);
    expect(typeof adminOverrides.overrideCount).toBe("number");
  });
});
