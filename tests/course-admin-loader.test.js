import { beforeEach, describe, expect, it } from "vitest";

import {
  getCachedCourseAdminOverrides,
  getCachedCourseReconciliationReport,
  loadCourseAdminOverrides,
  loadCourseReconciliationReport,
  resetCourseAdminLoaderCache,
} from "../src/services/course-admin-loader.js";
import { getCourseCatalogManifest } from "../src/services/course-catalog-loader.js";

describe("course admin loader", () => {
  beforeEach(() => {
    resetCourseAdminLoaderCache();
  });

  it("loads and caches the reconciliation report", async () => {
    const firstLoad = await loadCourseReconciliationReport();
    const secondLoad = await loadCourseReconciliationReport();

    expect(firstLoad).toBe(secondLoad);
    expect(firstLoad.assetVersion).toBe(getCourseCatalogManifest().assetVersion);
    expect(firstLoad.recordCount).toBe(getCourseCatalogManifest().recordCount);
    expect(getCachedCourseReconciliationReport()).toBe(firstLoad);
  });

  it("loads and caches the runtime admin overrides payload", async () => {
    const firstLoad = await loadCourseAdminOverrides();
    const secondLoad = await loadCourseAdminOverrides();

    expect(firstLoad).toBe(secondLoad);
    expect(firstLoad.assetVersion).toBe(getCourseCatalogManifest().assetVersion);
    expect(Array.isArray(firstLoad.rows)).toBe(true);
    expect(getCachedCourseAdminOverrides()).toBe(firstLoad);
  });

  it("fails cleanly when the admin override asset is missing", async () => {
    await expect(loadCourseAdminOverrides({
      forceRefresh: true,
      overridesPath: "data/course/missing-admin-overrides.json",
    })).rejects.toThrow("missing-admin-overrides");
  });
});
