import { beforeAll, describe, expect, it } from "vitest";

import {
  buildManualRoundTemplate,
  buildRoundTemplate,
  findNearbyCourses,
  getCourseById,
  getCourseProviderCatalog,
  getCourseDefaultRoundSetup,
  getRoundSetupDiscoveryState,
  searchCourses,
} from "../src/services/course-service.js";
import {
  loadCourseDiscoveryIndex,
  loadCourseNearbyIndex,
  resetCourseCatalogLoaderCache,
} from "../src/services/course-catalog-loader.js";

describe("course service", () => {
  beforeAll(async () => {
    resetCourseCatalogLoaderCache();
    await loadCourseNearbyIndex();
    await loadCourseDiscoveryIndex();
  });

  it("returns a provider-agnostic catalog with live and scaffolded providers", () => {
    const catalog = getCourseProviderCatalog();

    expect(catalog.some((provider) => provider.id === "us-course-database" && provider.live)).toBe(true);
    expect(catalog.some((provider) => provider.id === "imported-us-course-database" && provider.live)).toBe(true);
    expect(catalog.find((provider) => provider.id === "imported-us-course-database")?.recordCount).toBeGreaterThan(0);
    expect(catalog.some((provider) => provider.id === "golfnow-partner-api" && provider.live === false)).toBe(true);
    expect(catalog.some((provider) => provider.id === "mock-course-provider")).toBe(false);
  });

  it("searches canonical course records and keeps Golden Nugget available", () => {
    const results = searchCourses("Lake Charles", { limit: 8 });

    expect(results[0].id).toBe("golden-nugget-lake-charles");
    expect(results[0].teeBoxes.length).toBeGreaterThan(0);
    expect(results[0].metadata.featured).toBe(true);
    expect(results[0].slug).toBeTruthy();
    expect(results[0].metadata.discoveryReady).toBe(true);
    expect(results[0].metadata.basicRoundReady).toBe(true);
    expect(results[0].metadata.richRoundReady).toBe(false);
    expect(results.some((course) => course.providerId === "imported-us-course-database")).toBe(true);
    expect(results.some((course) => course.providerId === "mock-course-provider")).toBe(false);
  });

  it("prefers imported rich-detail courses when search matches are otherwise similar", () => {
    const results = searchCourses("Torrey Pines Golf Course", { limit: 3 });

    expect(results[0].id).toBe("torrey-pines-golf-course-la-jolla-ca");
    expect(results[0].providerId).toBe("imported-us-course-database");
    expect(results[0].metadata.readinessTier).toBe("rich-round-ready");
  });

  it("finds nearby courses from seeded coordinates", () => {
    const nearby = findNearbyCourses(30.1869, -93.2754, { limit: 4, radiusMiles: 25 });

    expect(nearby.length).toBeGreaterThan(0);
    expect(nearby[0].id).toBe("golden-nugget-lake-charles");
    expect(nearby[0].nearbyDistanceMiles).toBeLessThan(1);
    expect(nearby.some((course) => course.providerId === "mock-course-provider")).toBe(false);
  });

  it("builds a 9-hole round template from a real course and tee box", () => {
    const course = getCourseById("torrey-pines-south");
    const teeId = course.teeBoxes[1].id;
    const template = buildRoundTemplate(course.id, teeId, { holeCount: 9 });

    expect(template.courseName).toContain("Torrey Pines");
    expect(template.teeBoxId).toBe(teeId);
    expect(template.holes).toHaveLength(9);
    expect(template.selectedHoleCount).toBe(9);
    expect(template.totalPar).toBe(template.holes.reduce((sum, hole) => sum + hole.par, 0));
  });

  it("builds a rich round template from imported nationwide records when scoring detail enrichment exists", () => {
    const course = getCourseById("torrey-pines-golf-course-la-jolla-ca");
    const teeId = course.teeBoxes[0].id;
    const template = buildRoundTemplate(course.id, teeId, { holeCount: 9 });

    expect(course.providerId).toBe("imported-us-course-database");
    expect(course.metadata.richRoundReady).toBe(true);
    expect(course.metadata.qualityFlags.hasRealTeeData).toBe(true);
    expect(course.metadata.qualityFlags.hasRealHoleData).toBe(true);
    expect(course.metadata.qualityFlags.hasRealRatingSlope).toBe(true);
    expect(template.teeBoxId).toBe(teeId);
    expect(template.teeBoxName).toBeTruthy();
    expect(template.holes).toHaveLength(9);
  });

  it("keeps fallback round templates for imported records without scoring detail enrichment", () => {
    const course = getCourseById("fireweed-meadows-golf-course-anchor-point-ak");
    const template = buildRoundTemplate(course.id, "", { holeCount: 9 });

    expect(course.providerId).toBe("imported-us-course-database");
    expect(course.metadata.readinessTier).toBe("basic-round-ready");
    expect(course.metadata.qualityFlags.hasRealTeeData).toBe(false);
    expect(template.teeBoxName).toBe("Default");
    expect(template.holes).toHaveLength(9);
    expect(template.courseName).toContain("Fireweed Meadows");
  });

  it("keeps manual templates available when no provider data is selected", () => {
    const template = buildManualRoundTemplate("Custom Muni", "White", { holeCount: 9 });

    expect(template.courseName).toBe("Custom Muni");
    expect(template.teeBoxName).toBe("White");
    expect(template.holes).toHaveLength(9);
    expect(template.metadata.roundTemplateReady).toBe(true);
  });

  it("creates nearby discovery state that degrades gracefully when location is denied", () => {
    const discovery = getRoundSetupDiscoveryState(
      getCourseDefaultRoundSetup(),
      {
        locationPermission: "denied",
        locationStatus: "fallback",
        coordinates: null,
      }
    );

    expect(discovery.selectedCourse).toBeNull();
    expect(discovery.homeCourseSuggestion).toBeNull();
    expect(discovery.nearbyCourses).toHaveLength(0);
    expect(discovery.nearbyCopy.title).toBe("Location is off");
  });

  it("surfaces a quick-setup suggestion only when the user has a matching home course", () => {
    const discovery = getRoundSetupDiscoveryState(
      getCourseDefaultRoundSetup(),
      {
        locationPermission: "prompt",
        locationStatus: "idle",
        coordinates: null,
      },
      {
        currentUser: {
          homeCourse: "Pebble Beach Golf Links",
        },
      }
    );

    expect(discovery.homeCourseSuggestion?.displayName || discovery.homeCourseSuggestion?.name).toContain("Pebble Beach");
  });

  it("keeps default search discovery focused on recent and nearby subsets until the user types a query", () => {
    const discovery = getRoundSetupDiscoveryState(
      {
        ...getCourseDefaultRoundSetup(),
        courseMethod: "search",
        courseQuery: "",
      },
      {
        locationPermission: "granted",
        locationStatus: "ready",
        coordinates: {
          latitude: 30.1869,
          longitude: -93.2754,
        },
      },
      {
        rounds: [
          {
            id: "recent-round-1",
            courseId: "torrey-pines-golf-course-la-jolla-ca",
            status: "completed",
            updatedAt: 200,
          },
        ],
      }
    );

    expect(discovery.showNationwideSearch).toBe(false);
    expect(discovery.searchResults).toHaveLength(0);
    expect(discovery.recentCourses.some((course) => course.id === "torrey-pines-golf-course-la-jolla-ca")).toBe(true);
    expect(discovery.nearbyCourses.some((course) => course.id === "golden-nugget-lake-charles")).toBe(true);
  });

  it("returns nationwide matches only after the user provides a search query", () => {
    const discovery = getRoundSetupDiscoveryState(
      {
        ...getCourseDefaultRoundSetup(),
        courseMethod: "search",
        courseQuery: "Pebble Beach",
      },
      {}
    );

    expect(discovery.showNationwideSearch).toBe(true);
    expect(discovery.searchResults.length).toBeGreaterThan(0);
    expect(discovery.searchResults[0].displayName || discovery.searchResults[0].name).toContain("Pebble");
  });
});
