import { describe, expect, it } from "vitest";

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

describe("course service", () => {
  it("returns a provider-agnostic catalog with live and scaffolded providers", () => {
    const catalog = getCourseProviderCatalog();

    expect(catalog.some((provider) => provider.id === "us-course-database" && provider.live)).toBe(true);
    expect(catalog.some((provider) => provider.id === "imported-us-course-database" && provider.live)).toBe(true);
    expect(catalog.find((provider) => provider.id === "imported-us-course-database")?.recordCount).toBeGreaterThan(0);
    expect(catalog.some((provider) => provider.id === "golfnow-partner-api" && provider.live === false)).toBe(true);
  });

  it("searches canonical course records and keeps Golden Nugget available", () => {
    const results = searchCourses("Lake Charles", { limit: 8 });

    expect(results[0].id).toBe("golden-nugget-lake-charles");
    expect(results[0].providerId).toBe("imported-us-course-database");
    expect(results[0].teeBoxes.length).toBeGreaterThan(0);
    expect(results[0].metadata.featured).toBe(true);
    expect(results[0].slug).toBeTruthy();
  });

  it("finds nearby courses from seeded coordinates", () => {
    const nearby = findNearbyCourses(30.1869, -93.2754, { limit: 4, radiusMiles: 25 });

    expect(nearby.length).toBeGreaterThan(0);
    expect(nearby[0].id).toBe("golden-nugget-lake-charles");
    expect(nearby[0].nearbyDistanceMiles).toBeLessThan(1);
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

    expect(discovery.selectedCourse.id).toBe("golden-nugget-lake-charles");
    expect(discovery.nearbyCourses).toHaveLength(0);
    expect(discovery.nearbyCopy.title).toBe("Location is off");
  });
});
