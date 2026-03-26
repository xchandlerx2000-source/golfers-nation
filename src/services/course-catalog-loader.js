import { IMPORTED_US_COURSE_CATALOG_MANIFEST } from "./course-import/generated/us-course-catalog-manifest.js";

let manifestCache = IMPORTED_US_COURSE_CATALOG_MANIFEST || {
  nearbyIndexPath: "data/course/nearby-index.json",
  discoveryIndexPath: "data/course/discovery-index.json",
  detailShards: [],
  recordCount: 0,
};
let nearbyIndexCache = null;
let nearbyIndexById = new Map();
let nearbyIndexPromise = null;
let nearbyIndexError = null;
let discoveryIndexCache = null;
let discoveryIndexById = new Map();
let discoveryIndexPromise = null;
let discoveryIndexError = null;
const detailShardCache = new Map();
const detailByIdCache = new Map();
const detailShardPromises = new Map();

function normalizeAssetPath(relativePath = "") {
  return String(relativePath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/[?#].*$/, "");
}

function buildCourseAssetUrl(relativePath = "", manifest = manifestCache) {
  const normalizedPath = normalizeAssetPath(relativePath);
  if (!normalizedPath) {
    return "";
  }

  const assetVersion = String(manifest?.assetVersion || "").trim();
  if (!assetVersion) {
    return normalizedPath;
  }

  return `${normalizedPath}?v=${encodeURIComponent(assetVersion)}`;
}

async function readJsonAsset(relativePath = "", { manifest = manifestCache } = {}) {
  const normalizedPath = normalizeAssetPath(relativePath);
  if (!normalizedPath) {
    throw new Error("Course catalog asset path is missing.");
  }

  if (typeof window !== "undefined" && typeof fetch === "function") {
    const assetUrl = new URL(buildCourseAssetUrl(normalizedPath, manifest), window.location.href);
    const response = await fetch(assetUrl.href, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Course catalog asset request failed (${response.status}) for ${normalizedPath}.`);
    }

    return response.json();
  }

  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const filePath = path.join(process.cwd(), ...normalizedPath.split("/"));
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function cacheDiscoveryIndex(courses = []) {
  discoveryIndexCache = Array.isArray(courses) ? courses : [];
  discoveryIndexById = new Map(discoveryIndexCache.map((course) => [course.id, course]));
  discoveryIndexError = null;
  return discoveryIndexCache;
}

function cacheNearbyIndex(courses = []) {
  nearbyIndexCache = Array.isArray(courses) ? courses : [];
  nearbyIndexById = new Map(nearbyIndexCache.map((course) => [course.id, course]));
  nearbyIndexError = null;
  return nearbyIndexCache;
}

function cacheDetailCourses(courses = []) {
  (Array.isArray(courses) ? courses : []).forEach((course) => {
    if (course?.id) {
      detailByIdCache.set(course.id, course);
    }
  });
}

export function getCourseCatalogManifest() {
  return manifestCache;
}

export function getCourseCatalogCacheState() {
  if (discoveryIndexCache) {
    return {
      status: "ready",
      errorMessage: "",
      recordCount: discoveryIndexCache.length,
    };
  }

  if (discoveryIndexPromise) {
    return {
      status: "loading",
      errorMessage: "",
      recordCount: Number(manifestCache?.recordCount || 0),
    };
  }

  if (discoveryIndexError) {
    return {
      status: "error",
      errorMessage: String(discoveryIndexError?.message || "Course catalog loading failed."),
      recordCount: Number(manifestCache?.recordCount || 0),
    };
  }

  return {
    status: "idle",
    errorMessage: "",
    recordCount: Number(manifestCache?.recordCount || 0),
  };
}

export function getCourseNearbyCatalogCacheState() {
  if (nearbyIndexCache) {
    return {
      status: "ready",
      errorMessage: "",
      recordCount: nearbyIndexCache.length,
    };
  }

  if (nearbyIndexPromise) {
    return {
      status: "loading",
      errorMessage: "",
      recordCount: Number(manifestCache?.recordCount || 0),
    };
  }

  if (nearbyIndexError) {
    return {
      status: "error",
      errorMessage: String(nearbyIndexError?.message || "Course nearby catalog loading failed."),
      recordCount: Number(manifestCache?.recordCount || 0),
    };
  }

  return {
    status: "idle",
    errorMessage: "",
    recordCount: Number(manifestCache?.recordCount || 0),
  };
}

export function getCachedCourseNearbyIndex() {
  return nearbyIndexCache || [];
}

export function getCachedCourseNearbyEntry(courseId = "") {
  return courseId ? (nearbyIndexById.get(courseId) || null) : null;
}

export function getCachedCourseDiscoveryIndex() {
  return discoveryIndexCache || [];
}

export function getCachedCourseDiscoveryEntry(courseId = "") {
  return courseId ? (discoveryIndexById.get(courseId) || null) : null;
}

export function getCachedCourseById(courseId = "") {
  if (!courseId) {
    return null;
  }

  return detailByIdCache.get(courseId)
    || discoveryIndexById.get(courseId)
    || nearbyIndexById.get(courseId)
    || null;
}

export async function loadCourseManifest() {
  return manifestCache;
}

export async function loadCourseNearbyIndex(options = {}) {
  const forceRefresh = Boolean(options?.forceRefresh);
  const manifest = options?.manifest || manifestCache;
  const nearbyIndexPath = manifest?.nearbyIndexPath || manifest?.discoveryIndexPath;

  if (forceRefresh) {
    nearbyIndexCache = null;
    nearbyIndexById = new Map();
    nearbyIndexError = null;
  }

  if (nearbyIndexCache) {
    return nearbyIndexCache;
  }

  if (nearbyIndexPromise) {
    return nearbyIndexPromise;
  }

  nearbyIndexPromise = readJsonAsset(nearbyIndexPath, { manifest })
    .then((payload) => {
      const courses = Array.isArray(payload?.courses) ? payload.courses : [];
      return cacheNearbyIndex(courses);
    })
    .catch((error) => {
      nearbyIndexError = error;
      throw error;
    })
    .finally(() => {
      nearbyIndexPromise = null;
    });

  return nearbyIndexPromise;
}

export async function loadCourseDiscoveryIndex(options = {}) {
  const forceRefresh = Boolean(options?.forceRefresh);
  const manifest = options?.manifest || manifestCache;

  if (forceRefresh) {
    discoveryIndexCache = null;
    discoveryIndexById = new Map();
    discoveryIndexError = null;
  }

  if (discoveryIndexCache) {
    return discoveryIndexCache;
  }

  if (discoveryIndexPromise) {
    return discoveryIndexPromise;
  }

  discoveryIndexPromise = readJsonAsset(manifest?.discoveryIndexPath, { manifest })
    .then((payload) => {
      const courses = Array.isArray(payload?.courses) ? payload.courses : [];
      return cacheDiscoveryIndex(courses);
    })
    .catch((error) => {
      discoveryIndexError = error;
      throw error;
    })
    .finally(() => {
      discoveryIndexPromise = null;
    });

  return discoveryIndexPromise;
}

function getDetailShardMetaForCourseId(courseId = "", manifest = manifestCache) {
  const discoveryEntry = getCachedCourseDiscoveryEntry(courseId);
  if (!discoveryEntry) {
    return null;
  }

  return (manifest?.detailShards || []).find((shard) => shard.key === discoveryEntry.detailShard) || null;
}

async function loadCourseDetailShard(shardMeta = null, { manifest = manifestCache } = {}) {
  if (!shardMeta?.key || !shardMeta?.path) {
    return [];
  }

  if (detailShardCache.has(shardMeta.key)) {
    return detailShardCache.get(shardMeta.key);
  }

  if (detailShardPromises.has(shardMeta.key)) {
    return detailShardPromises.get(shardMeta.key);
  }

  const shardPromise = readJsonAsset(shardMeta.path, { manifest })
    .then((payload) => {
      const courses = Array.isArray(payload?.courses) ? payload.courses : [];
      detailShardCache.set(shardMeta.key, courses);
      cacheDetailCourses(courses);
      return courses;
    })
    .finally(() => {
      detailShardPromises.delete(shardMeta.key);
    });

  detailShardPromises.set(shardMeta.key, shardPromise);
  return shardPromise;
}

export async function loadCourseDetailById(courseId = "", options = {}) {
  if (!courseId) {
    return null;
  }

  if (detailByIdCache.has(courseId)) {
    return detailByIdCache.get(courseId) || null;
  }

  await loadCourseDiscoveryIndex(options);

  const shardMeta = getDetailShardMetaForCourseId(courseId, options?.manifest || manifestCache);
  if (!shardMeta) {
    return getCachedCourseById(courseId);
  }

  try {
    await loadCourseDetailShard(shardMeta, { manifest: options?.manifest || manifestCache });
  } catch {
    return getCachedCourseById(courseId);
  }

  return getCachedCourseById(courseId);
}

export function resetCourseCatalogLoaderCache() {
  manifestCache = IMPORTED_US_COURSE_CATALOG_MANIFEST || manifestCache;
  nearbyIndexCache = null;
  nearbyIndexById = new Map();
  nearbyIndexPromise = null;
  nearbyIndexError = null;
  discoveryIndexCache = null;
  discoveryIndexById = new Map();
  discoveryIndexPromise = null;
  discoveryIndexError = null;
  detailShardCache.clear();
  detailByIdCache.clear();
  detailShardPromises.clear();
}
