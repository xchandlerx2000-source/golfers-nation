import { describe, expect, it } from "vitest";

import { createRoundCourseSelection, findCourseById, getCourseQuickPicks, getRoundSetupCourses, searchCourseLibrary } from "../src/services/course-library.js";

describe("course library", () => {
  it("searches seeded real courses by name, city, and state", () => {
    expect(searchCourseLibrary("Pebble").some((course) => course.name.includes("Pebble Beach"))).toBe(true);
    expect(searchCourseLibrary("Atlanta").some((course) => course.name.includes("East Lake"))).toBe(true);
    expect(searchCourseLibrary("NV").some((course) => course.region.includes("Las Vegas"))).toBe(true);
    expect(searchCourseLibrary("Riviera").some((course) => course.name.includes("Riviera"))).toBe(true);
  });

  it("returns a compact starter set for round setup browsing", () => {
    const results = getRoundSetupCourses("", 6);

    expect(results.length).toBeLessThanOrEqual(6);
    expect(results[0].id).toBe("golden-nugget-lake-charles");
    expect(results[0].teeBoxes.length).toBeGreaterThan(0);
  });

  it("supports quick-pick browsing with the featured local course first", () => {
    const picks = getCourseQuickPicks(4);

    expect(picks).toHaveLength(4);
    expect(picks[0].id).toBe("golden-nugget-lake-charles");
    expect(picks.some((course) => course.region.includes("California"))).toBe(true);
  });

  it("builds a round-ready course selection with tee box hole data", () => {
    const course = findCourseById("torrey-pines-south");
    const teeBoxId = course.teeBoxes[1].id;
    const selection = createRoundCourseSelection(course.id, teeBoxId);

    expect(selection.courseName).toBe("Torrey Pines Golf Course - South");
    expect(selection.teeBoxName).toBe(course.teeBoxes[1].name);
    expect(selection.holes).toHaveLength(18);
    expect(selection.totalPar).toBe(72);
    expect(selection.totalYardage).toBe(course.teeBoxes[1].totalYardage);
    expect(selection.courseType).toBeTruthy();
    expect(selection.teeCount).toBeGreaterThan(1);
  });
});
