import { cloneData } from "../../utils/formatters.js";
import { dedupeCanonicalCourseRecords } from "../course-deduplication.js";
import { normalizeImportedCourseSourceRecords } from "../course-normalization.js";

function normalizeImportedCourseQuery(value = "") {
  return String(value || "").trim().toLowerCase();
}

function toImportedCourseRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateImportedCourseDistanceMiles(latA, lngA, latB, lngB) {
  const earthRadiusMiles = 3958.8;
  const deltaLat = toImportedCourseRadians(latB - latA);
  const deltaLng = toImportedCourseRadians(lngB - lngA);
  const valueA = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toImportedCourseRadians(latA))
    * Math.cos(toImportedCourseRadians(latB))
    * Math.sin(deltaLng / 2) ** 2;
  const valueC = 2 * Math.atan2(Math.sqrt(valueA), Math.sqrt(1 - valueA));
  return earthRadiusMiles * valueC;
}

function buildImportedCourseSearchText(course = {}) {
  return normalizeImportedCourseQuery([
    course?.displayName,
    course?.clubName,
    course?.courseName,
    course?.city,
    course?.state,
    course?.stateName,
    course?.postalCode,
    ...(course?.aliases || []),
    ...(course?.searchKeywords || []),
  ].join(" "));
}

function getImportedCourseMatchScore(course = {}, normalizedQuery = "") {
  if (!normalizedQuery) {
    return 0;
  }

  const exactTargets = [
    course?.displayName,
    course?.clubName,
    course?.courseName,
    course?.city,
    course?.state,
    course?.stateName,
    ...(course?.aliases || []),
  ].map(normalizeImportedCourseQuery);

  if (exactTargets.includes(normalizedQuery)) {
    return 300;
  }

  const prefixTargets = [
    course?.displayName,
    course?.clubName,
    course?.courseName,
    course?.city,
    ...(course?.aliases || []),
  ].map(normalizeImportedCourseQuery);

  if (prefixTargets.some((value) => value.startsWith(normalizedQuery))) {
    return 220;
  }

  const keywordTargets = (course?.searchKeywords || []).map(normalizeImportedCourseQuery);
  if (keywordTargets.some((value) => value.includes(normalizedQuery))) {
    return 170;
  }

  return buildImportedCourseSearchText(course).includes(normalizedQuery) ? 120 : -1;
}

function sortImportedCourseCatalog(left = {}, right = {}) {
  const leftPriority = left?.metadata?.priority ?? 100;
  const rightPriority = right?.metadata?.priority ?? 100;
  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const leftFeatured = Number(Boolean(left?.metadata?.featured));
  const rightFeatured = Number(Boolean(right?.metadata?.featured));
  if (leftFeatured !== rightFeatured) {
    return rightFeatured - leftFeatured;
  }

  const leftDistance = Number.isFinite(left?.nearbyDistanceMiles) ? left.nearbyDistanceMiles : Number.POSITIVE_INFINITY;
  const rightDistance = Number.isFinite(right?.nearbyDistanceMiles) ? right.nearbyDistanceMiles : Number.POSITIVE_INFINITY;
  if (leftDistance !== rightDistance) {
    return leftDistance - rightDistance;
  }

  return String(left?.displayName || left?.name || "").localeCompare(String(right?.displayName || right?.name || ""));
}

export function buildUsCourseImportCatalog(rawRows = [], options = {}) {
  const normalized = normalizeImportedCourseSourceRecords(rawRows, options);
  return dedupeCanonicalCourseRecords(normalized).sort(sortImportedCourseCatalog);
}

export function searchUsCourseImportCatalog(catalog = [], query = "", { limit = 10 } = {}) {
  const normalizedQuery = normalizeImportedCourseQuery(query);
  const results = catalog
    .map((course) => ({
      ...course,
      matchScore: getImportedCourseMatchScore(course, normalizedQuery),
    }))
    .filter((course) => !normalizedQuery || course.matchScore >= 0)
    .sort((left, right) => {
      if (normalizedQuery && left.matchScore !== right.matchScore) {
        return right.matchScore - left.matchScore;
      }

      return sortImportedCourseCatalog(left, right);
    })
    .slice(0, limit)
    .map(({ matchScore, ...course }) => cloneData(course));

  return results;
}

export function findNearbyUsCourseImportCatalog(catalog = [], lat, lng, { limit = 6, radiusMiles = 50 } = {}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return [];
  }

  return catalog
    .filter((course) => Number.isFinite(course?.latitude) && Number.isFinite(course?.longitude))
    .map((course) => {
      const nearbyDistanceMiles = calculateImportedCourseDistanceMiles(lat, lng, course.latitude, course.longitude);
      return {
        ...cloneData(course),
        nearbyDistanceMiles,
        nearbyDistanceLabel: `${nearbyDistanceMiles.toFixed(1)} mi`,
      };
    })
    .filter((course) => course.nearbyDistanceMiles <= radiusMiles)
    .sort(sortImportedCourseCatalog)
    .slice(0, limit);
}
