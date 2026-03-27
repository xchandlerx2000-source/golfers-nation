import {
  applyCourseCapabilities,
  applyCourseCapabilitiesToCatalog,
  createCourseRoundTemplateRecord,
  findNearbyCourseCatalog,
  findCourseTeeBoxRecord,
  getDefaultCourseTeeBoxRecord,
  searchCourseCatalog,
} from "@golfers-nation/course";
import { readItem, writeItem } from "../lib/native-storage";
import { getNativeRuntimeConfig } from "../lib/runtime-config";
import { RECOMMENDED_COURSES, STARTER_COURSES } from "../lib/seed-state";

const CACHE_PREFIX = "golfers-nation-native-course-cache-v1";
const RECENT_COURSE_IDS_KEY = `${CACHE_PREFIX}:recent-course-ids`;
const REMOTE_MANIFEST_PATH = "data/course/manifest.json";

const DEFAULT_MANIFEST = {
  assetVersion: "starter-only",
  nearbyIndexPath: "data/course/nearby-index.json",
  discoveryIndexPath: "data/course/discovery-index.json",
  detailShards: [],
  recordCount: STARTER_COURSES.length,
};

let manifestCache = null;
let nearbyCache = null;
let discoveryCache = null;
let nearbyPromise = null;
let discoveryPromise = null;
let recentCourseIdsCache = null;
const detailByIdCache = new Map();
const detailShardCache = new Map();
const detailShardPromiseCache = new Map();

STARTER_COURSES.forEach((course) => {
  if (course?.id) {
    detailByIdCache.set(course.id, applyCourseCapabilities(course));
  }
});

function isReactNativeRuntime() {
  return typeof navigator !== "undefined" && navigator.product === "ReactNative";
}

function normalizeUrlBase(value = "") {
  return String(value || "").trim().replace(/\/+$/, "");
}

function normalizeAssetPath(value = "") {
  return String(value || "").trim().replace(/^\/+/, "");
}

function buildRemoteUrl(pathname = "", { includeVersion = false } = {}) {
  const config = getNativeRuntimeConfig();
  const baseUrl = normalizeUrlBase(config.courseAssetBaseUrl || config.siteUrl);
  const assetPath = normalizeAssetPath(pathname);
  if (!baseUrl || !assetPath) {
    return "";
  }

  const url = `${baseUrl}/${assetPath}`;
  const assetVersion = includeVersion ? String(manifestCache?.assetVersion || "").trim() : "";
  return assetVersion ? `${url}?v=${encodeURIComponent(assetVersion)}` : url;
}

function getManifestCacheKey() {
  return `${CACHE_PREFIX}:manifest`;
}

function getAssetCacheKey(pathname = "", version = manifestCache?.assetVersion || DEFAULT_MANIFEST.assetVersion) {
  return `${CACHE_PREFIX}:${String(version || DEFAULT_MANIFEST.assetVersion)}:${normalizeAssetPath(pathname)}`;
}

async function readCachedJson(key) {
  const raw = await readItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeCachedJson(key, value) {
  await writeItem(key, JSON.stringify(value || null));
  return value;
}

async function fetchRemoteJson(pathname = "", { includeVersion = false } = {}) {
  if (!isReactNativeRuntime() || typeof fetch !== "function") {
    return null;
  }

  const url = buildRemoteUrl(pathname, { includeVersion });
  if (!url) {
    return null;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Course asset request failed (${response.status}) for ${pathname}.`);
  }

  return response.json();
}

function mergeUniqueCourses(...groups) {
  const merged = [];
  const seen = new Set();

  groups.flat().forEach((course) => {
    if (!course?.id || seen.has(course.id)) {
      return;
    }

    seen.add(course.id);
    merged.push(course);
  });

  return merged;
}

function hydrateCourse(course = null) {
  return course ? applyCourseCapabilities(course) : null;
}

function hydrateCourseCatalog(courses = []) {
  return applyCourseCapabilitiesToCatalog(courses);
}

async function loadManifest() {
  if (manifestCache) {
    return manifestCache;
  }

  const cached = await readCachedJson(getManifestCacheKey());
  if (cached?.discoveryIndexPath) {
    manifestCache = cached;
  }

  try {
    const remote = await fetchRemoteJson(REMOTE_MANIFEST_PATH, { includeVersion: false });
    if (remote?.discoveryIndexPath) {
      manifestCache = await writeCachedJson(getManifestCacheKey(), remote);
      return manifestCache;
    }
  } catch {
    // Fall through to cached or default manifest.
  }

  manifestCache = manifestCache || DEFAULT_MANIFEST;
  return manifestCache;
}

function getFallbackCourses(query = "", limit = 20) {
  if (!String(query || "").trim()) {
    return RECOMMENDED_COURSES.slice(0, limit);
  }

  return searchCourseCatalog(STARTER_COURSES, query, { limit }).map((course) => hydrateCourse(course));
}

async function readRecentCourseIds() {
  if (Array.isArray(recentCourseIdsCache)) {
    return recentCourseIdsCache;
  }

  const cached = await readCachedJson(RECENT_COURSE_IDS_KEY);
  recentCourseIdsCache = Array.isArray(cached?.courseIds) ? cached.courseIds : [];
  return recentCourseIdsCache;
}

async function writeRecentCourseIds(courseIds = []) {
  recentCourseIdsCache = courseIds.slice(0, 12);
  await writeCachedJson(RECENT_COURSE_IDS_KEY, {
    courseIds: recentCourseIdsCache,
  });
}

async function loadRecentCourses() {
  const recentIds = await readRecentCourseIds();
  const courses = [];

  for (const courseId of recentIds) {
    const course = await loadNativeCourseById(courseId);
    if (course) {
      courses.push(hydrateCourse(course));
    }
  }

  return courses;
}

async function loadNearbyCatalog() {
  if (nearbyCache) {
    return nearbyCache;
  }

  if (nearbyPromise) {
    return nearbyPromise;
  }

  nearbyPromise = (async () => {
    const manifest = await loadManifest();
    const cacheKey = getAssetCacheKey(manifest.nearbyIndexPath, manifest.assetVersion);
    const cached = await readCachedJson(cacheKey);
    if (Array.isArray(cached?.courses)) {
      nearbyCache = hydrateCourseCatalog(cached.courses);
      cached.courses.forEach((course) => {
        if (course?.id) {
          detailByIdCache.set(course.id, hydrateCourse(course));
        }
      });
    }

    try {
      const remote = await fetchRemoteJson(manifest.nearbyIndexPath, { includeVersion: true });
      if (Array.isArray(remote?.courses)) {
        nearbyCache = hydrateCourseCatalog(remote.courses);
        remote.courses.forEach((course) => {
          if (course?.id) {
            detailByIdCache.set(course.id, hydrateCourse(course));
          }
        });
        await writeCachedJson(cacheKey, { courses: nearbyCache });
      }
    } catch {
      // Keep cached or fallback data.
    }

    return nearbyCache || getFallbackCourses("", 20);
  })()
    .finally(() => {
      nearbyPromise = null;
    });

  return nearbyPromise;
}

async function loadDiscoveryCatalog() {
  if (discoveryCache) {
    return discoveryCache;
  }

  if (discoveryPromise) {
    return discoveryPromise;
  }

  discoveryPromise = (async () => {
    const manifest = await loadManifest();
    const cacheKey = getAssetCacheKey(manifest.discoveryIndexPath, manifest.assetVersion);
    const cached = await readCachedJson(cacheKey);
    if (Array.isArray(cached?.courses)) {
      discoveryCache = hydrateCourseCatalog(cached.courses);
      cached.courses.forEach((course) => {
        if (course?.id) {
          detailByIdCache.set(course.id, hydrateCourse(course));
        }
      });
    }

    try {
      const remote = await fetchRemoteJson(manifest.discoveryIndexPath, { includeVersion: true });
      if (Array.isArray(remote?.courses)) {
        discoveryCache = hydrateCourseCatalog(mergeUniqueCourses(remote.courses, STARTER_COURSES));
        discoveryCache.forEach((course) => {
          if (course?.id) {
            detailByIdCache.set(course.id, course);
          }
        });
        await writeCachedJson(cacheKey, { courses: discoveryCache });
      }
    } catch {
      // Keep cached or fallback data.
    }

    return discoveryCache || STARTER_COURSES;
  })()
    .finally(() => {
      discoveryPromise = null;
    });

  return discoveryPromise;
}

function getDetailShardMeta(courseId = "") {
  const course = detailByIdCache.get(courseId);
  const shardKey = course?.detailShard || "";
  if (!shardKey) {
    return null;
  }

  return (manifestCache?.detailShards || []).find((entry) => entry.key === shardKey) || null;
}

async function loadDetailShard(courseId = "") {
  const cachedCourse = detailByIdCache.get(courseId) || null;
  if (cachedCourse && Array.isArray(cachedCourse?.holes) && cachedCourse.holes.length) {
    return cachedCourse;
  }

  const manifest = await loadManifest();
  const shardMeta = getDetailShardMeta(courseId);
  if (!shardMeta?.path) {
    return cachedCourse || STARTER_COURSES.find((course) => course.id === courseId) || null;
  }

  if (detailShardCache.has(shardMeta.key)) {
    return detailByIdCache.get(courseId) || null;
  }

  if (!detailShardPromiseCache.has(shardMeta.key)) {
    const shardPromise = (async () => {
      const cacheKey = getAssetCacheKey(shardMeta.path, manifest.assetVersion);
      const cached = await readCachedJson(cacheKey);
      if (Array.isArray(cached?.courses)) {
        const hydratedCourses = hydrateCourseCatalog(cached.courses);
        detailShardCache.set(shardMeta.key, hydratedCourses);
        hydratedCourses.forEach((course) => {
          if (course?.id) {
            detailByIdCache.set(course.id, course);
          }
        });
      }

      try {
        const remote = await fetchRemoteJson(shardMeta.path, { includeVersion: true });
        if (Array.isArray(remote?.courses)) {
          const hydratedCourses = hydrateCourseCatalog(remote.courses);
          detailShardCache.set(shardMeta.key, hydratedCourses);
          hydratedCourses.forEach((course) => {
            if (course?.id) {
              detailByIdCache.set(course.id, course);
            }
          });
          await writeCachedJson(cacheKey, { courses: hydratedCourses });
        }
      } catch {
        // Keep cached detail if available.
      }

      return detailShardCache.get(shardMeta.key) || [];
    })()
      .finally(() => {
        detailShardPromiseCache.delete(shardMeta.key);
      });

    detailShardPromiseCache.set(shardMeta.key, shardPromise);
  }

  await detailShardPromiseCache.get(shardMeta.key);
  return detailByIdCache.get(courseId) || STARTER_COURSES.find((course) => course.id === courseId) || null;
}

export function getBundledStarterCourses() {
  return STARTER_COURSES.map((course) => hydrateCourse(course));
}

export function getBundledRecommendedCourses(limit = 12) {
  return RECOMMENDED_COURSES.slice(0, limit).map((course) => hydrateCourse(course));
}

export async function prepareNativeCourseCatalog() {
  const [recentCourses, nearbyCourses] = await Promise.all([
    loadRecentCourses(),
    loadNearbyCatalog(),
  ]);

  const courses = mergeUniqueCourses(recentCourses, nearbyCourses, RECOMMENDED_COURSES).slice(0, 20);
  return {
    courses,
    source: recentCourses.length ? "recent-nearby-cache" : nearbyCache ? "nearby-cache" : "starter",
  };
}

export async function searchNativeCourseCatalog(query = "", { limit = 20 } = {}) {
  const normalizedQuery = String(query || "").trim();
  const recentCourses = await loadRecentCourses();

  if (!normalizedQuery) {
    const prepared = await prepareNativeCourseCatalog();
    return {
      courses: prepared.courses.slice(0, limit),
      source: prepared.source,
    };
  }

  const bundledMatches = searchCourseCatalog(mergeUniqueCourses(recentCourses, STARTER_COURSES), normalizedQuery, { limit });
  const catalog = await loadDiscoveryCatalog();
  const expandedMatches = searchCourseCatalog(Array.isArray(catalog) ? mergeUniqueCourses(recentCourses, catalog) : STARTER_COURSES, normalizedQuery, { limit });
  const courses = mergeUniqueCourses(expandedMatches, bundledMatches).slice(0, limit);

  return {
    courses: courses.length ? courses : getFallbackCourses(normalizedQuery, limit),
    source: discoveryCache ? "discovery-cache" : "starter-search",
  };
}

export async function findNearbyNativeCourses(lat, lng, { limit = 6, radiusMiles = 50, allowFallback = true } = {}) {
  const catalog = await loadNearbyCatalog();
  const nearby = findNearbyCourseCatalog(catalog, lat, lng, { limit, radiusMiles });
  return nearby.length || !allowFallback ? nearby : getBundledRecommendedCourses(limit);
}

export async function loadNativeCourseById(courseId = "") {
  if (!courseId) {
    return null;
  }

  const cached = detailByIdCache.get(courseId) || STARTER_COURSES.find((course) => course.id === courseId) || null;
  if (cached && Array.isArray(cached.holes) && cached.holes.length) {
    return cached;
  }

  await loadDiscoveryCatalog();
  return loadDetailShard(courseId);
}

export async function recordRecentNativeCourse(course = null) {
  if (!course?.id) {
    return;
  }

  detailByIdCache.set(course.id, course);
  const recentIds = await readRecentCourseIds();
  const nextIds = [course.id, ...recentIds.filter((value) => value !== course.id)].slice(0, 12);
  await writeRecentCourseIds(nextIds);
}

export async function getRecentNativeCourses(limit = 6) {
  const recentCourses = await loadRecentCourses();
  return recentCourses.slice(0, limit);
}

export async function buildNativeRoundTemplate(courseId, teeId = "", { holeCount = 18 } = {}) {
  const course = await loadNativeCourseById(courseId);
  if (!course) {
    return null;
  }

  const teeBox = findCourseTeeBoxRecord(course, teeId) || getDefaultCourseTeeBoxRecord(course);
  return createCourseRoundTemplateRecord({
    course,
    teeBox,
    holeCount,
  });
}

export function resetNativeCourseCatalogCache() {
  manifestCache = null;
  nearbyCache = null;
  discoveryCache = null;
  nearbyPromise = null;
  discoveryPromise = null;
  recentCourseIdsCache = null;
  detailByIdCache.clear();
  STARTER_COURSES.forEach((course) => {
    if (course?.id) {
      detailByIdCache.set(course.id, hydrateCourse(course));
    }
  });
  detailShardCache.clear();
  detailShardPromiseCache.clear();
}
