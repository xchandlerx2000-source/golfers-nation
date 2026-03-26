import { beforeEach, describe, expect, it } from "vitest";

import {
  buildNativeRoundTemplate,
  resetNativeCourseCatalogCache,
  searchNativeCourseCatalog,
} from "../apps/native/src/services/native-course-service.js";

describe("native course service", () => {
  beforeEach(() => {
    resetNativeCourseCatalogCache();
  });

  it("falls back to bundled real-course search when remote assets are unavailable", async () => {
    const result = await searchNativeCourseCatalog("Boston", { limit: 10 });

    expect(result.courses.length).toBeGreaterThan(0);
    expect(result.courses.some((course) => course.displayName.includes("Boston"))).toBe(true);
  });

  it("builds a playable round template from the native course service", async () => {
    const result = await searchNativeCourseCatalog("Torrey", { limit: 5 });
    const course = result.courses[0];
    const template = await buildNativeRoundTemplate(course.id);

    expect(template.courseId).toBe(course.id);
    expect(template.holes.length).toBeGreaterThan(0);
    expect(template.teeBoxName).toBeTruthy();
  });
});
