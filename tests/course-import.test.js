import { describe, expect, it } from "vitest";

import { createCourseRoundTemplateRecord, getDefaultCourseTeeBoxRecord } from "../src/domain/course-models.js";
import { normalizeImportedCourseSourceRecord, normalizeImportedCourseSourceRecords } from "../src/services/course-normalization.js";
import { dedupeCanonicalCourseRecords } from "../src/services/course-deduplication.js";
import { buildUsCourseImportCatalog, findNearbyUsCourseImportCatalog, searchUsCourseImportCatalog } from "../src/services/course-import/us-course-import-service.js";

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
  });
});
