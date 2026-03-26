import { beforeEach, describe, expect, it } from "vitest";

import {
  getCachedCourseById,
  getCourseCatalogCacheState,
  getCourseCatalogManifest,
  getCourseNearbyCatalogCacheState,
  loadCourseDetailById,
  loadCourseDiscoveryIndex,
  loadCourseManifest,
  loadCourseNearbyIndex,
  resetCourseCatalogLoaderCache,
} from "../src/services/course-catalog-loader.js";

describe("course catalog loader", () => {
  beforeEach(() => {
    resetCourseCatalogLoaderCache();
  });

  it("loads the generated manifest snapshot", async () => {
    const manifest = await loadCourseManifest();

    expect(manifest.providerId).toBe("imported-us-course-database");
    expect(manifest.assetVersion).toMatch(/^[a-f0-9]{12}$/);
    expect(manifest.recordCount).toBeGreaterThan(10000);
    expect(manifest.detailShards.length).toBeGreaterThan(0);
  });

  it("loads and caches the discovery index", async () => {
    const firstLoad = await loadCourseDiscoveryIndex();
    const secondLoad = await loadCourseDiscoveryIndex();

    expect(firstLoad).toBe(secondLoad);
    expect(firstLoad.length).toBe(getCourseCatalogManifest().recordCount);
    expect(getCourseCatalogCacheState().status).toBe("ready");
  });

  it("loads and caches the nearby index", async () => {
    const manifest = getCourseCatalogManifest();
    const firstLoad = await loadCourseNearbyIndex();
    const secondLoad = await loadCourseNearbyIndex();

    expect(manifest.nearbyIndexPath).toBeTruthy();
    expect(firstLoad).toBe(secondLoad);
    expect(firstLoad.length).toBeGreaterThan(0);
    expect(firstLoad.length).toBeLessThanOrEqual(getCourseCatalogManifest().recordCount);
    expect(getCourseNearbyCatalogCacheState().status).toBe("ready");
  });

  it("hydrates course detail by id from the correct shard", async () => {
    await loadCourseDiscoveryIndex();

    const course = await loadCourseDetailById("contraband-bayou-golf-club-at-l-auberge-du-lac-lake-charles-la");

    expect(course?.id).toBe("contraband-bayou-golf-club-at-l-auberge-du-lac-lake-charles-la");
    expect(getCachedCourseById("contraband-bayou-golf-club-at-l-auberge-du-lac-lake-charles-la")?.displayName).toContain("Contraband Bayou");
  });

  it("falls back to the cached discovery entry when a detail shard cannot be loaded", async () => {
    const discoveryIndex = await loadCourseDiscoveryIndex();
    const discoveryEntry = discoveryIndex.find((course) => course.id === "contraband-bayou-golf-club-at-l-auberge-du-lac-lake-charles-la");
    const manifest = {
      ...getCourseCatalogManifest(),
      detailShards: getCourseCatalogManifest().detailShards.map((shard) => (
        shard.key === discoveryEntry.detailShard
          ? { ...shard, path: "data/course/detail-shards/missing-detail.json" }
          : shard
      )),
    };

    const course = await loadCourseDetailById(discoveryEntry.id, { manifest });

    expect(course?.id).toBe(discoveryEntry.id);
    expect(course?.detailShard).toBe(discoveryEntry.detailShard);
    expect(Array.isArray(course?.holes)).toBe(false);
  });

  it("fails cleanly when a discovery asset is missing", async () => {
    const manifest = {
      ...getCourseCatalogManifest(),
      discoveryIndexPath: "data/course/missing-discovery-index.json",
    };

    await expect(loadCourseDiscoveryIndex({
      manifest,
      forceRefresh: true,
    })).rejects.toThrow("missing-discovery-index");

    expect(getCourseCatalogCacheState().status).toBe("error");
  });
});
