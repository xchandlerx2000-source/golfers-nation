import { cloneData } from "@golfers-nation/core";

function normalizeCourseQuery(value = "") {
  return String(value || "").trim().toLowerCase();
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMiles(latA, lngA, latB, lngB) {
  const earthRadiusMiles = 3958.8;
  const deltaLat = toRadians(latB - latA);
  const deltaLng = toRadians(lngB - lngA);
  const valueA = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(latA))
    * Math.cos(toRadians(latB))
    * Math.sin(deltaLng / 2) ** 2;
  const valueC = 2 * Math.atan2(Math.sqrt(valueA), Math.sqrt(1 - valueA));
  return earthRadiusMiles * valueC;
}

function buildCourseSearchText(course = {}) {
  return normalizeCourseQuery([
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

function getCourseMatchScore(course = {}, normalizedQuery = "") {
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
  ].map(normalizeCourseQuery);

  if (exactTargets.includes(normalizedQuery)) {
    return 300;
  }

  const prefixTargets = [
    course?.displayName,
    course?.clubName,
    course?.courseName,
    course?.city,
    ...(course?.aliases || []),
  ].map(normalizeCourseQuery);

  if (prefixTargets.some((value) => value.startsWith(normalizedQuery))) {
    return 220;
  }

  const keywordTargets = (course?.searchKeywords || []).map(normalizeCourseQuery);
  if (keywordTargets.some((value) => value.includes(normalizedQuery))) {
    return 170;
  }

  return buildCourseSearchText(course).includes(normalizedQuery) ? 120 : -1;
}

function getCourseReadinessRank(course = {}) {
  const readinessTier = String(course?.metadata?.readinessTier || "").toLowerCase();
  switch (readinessTier) {
    case "rich-round-ready":
      return 3;
    case "basic-round-ready":
      return 2;
    case "discovery-ready":
      return 1;
    default:
      return 0;
  }
}

function getCourseConfidenceScore(course = {}) {
  const numericScore = Number(course?.metadata?.matchConfidence);
  return Number.isFinite(numericScore) ? numericScore : 0;
}

export function sortCourseCatalog(left = {}, right = {}) {
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

  const leftReadinessRank = getCourseReadinessRank(left);
  const rightReadinessRank = getCourseReadinessRank(right);
  if (leftReadinessRank !== rightReadinessRank) {
    return rightReadinessRank - leftReadinessRank;
  }

  const leftConfidenceScore = getCourseConfidenceScore(left);
  const rightConfidenceScore = getCourseConfidenceScore(right);
  if (leftConfidenceScore !== rightConfidenceScore) {
    return rightConfidenceScore - leftConfidenceScore;
  }

  return String(left?.displayName || left?.name || "").localeCompare(String(right?.displayName || right?.name || ""));
}

export function searchCourseCatalog(catalog = [], query = "", { limit = 10 } = {}) {
  const normalizedQuery = normalizeCourseQuery(query);
  return catalog
    .map((course) => ({
      ...course,
      matchScore: getCourseMatchScore(course, normalizedQuery),
    }))
    .filter((course) => !normalizedQuery || course.matchScore >= 0)
    .sort((left, right) => {
      if (normalizedQuery && left.matchScore !== right.matchScore) {
        return right.matchScore - left.matchScore;
      }

      return sortCourseCatalog(left, right);
    })
    .slice(0, limit)
    .map(({ matchScore, ...course }) => cloneData(course));
}

export function findNearbyCourseCatalog(catalog = [], lat, lng, { limit = 6, radiusMiles = 50 } = {}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return [];
  }

  return catalog
    .filter((course) => Number.isFinite(course?.latitude) && Number.isFinite(course?.longitude))
    .map((course) => {
      const nearbyDistanceMiles = calculateDistanceMiles(lat, lng, course.latitude, course.longitude);
      return {
        ...cloneData(course),
        nearbyDistanceMiles,
        nearbyDistanceLabel: `${nearbyDistanceMiles.toFixed(1)} mi`,
      };
    })
    .filter((course) => course.nearbyDistanceMiles <= radiusMiles)
    .sort(sortCourseCatalog)
    .slice(0, limit);
}
