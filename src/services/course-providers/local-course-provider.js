import {
  findCourseById,
  getCourseQuickPicks,
  getRoundSetupCourses,
  listSeededCourses,
  searchCourseLibrary,
} from "../course-library.js";
import {
  createCourseRoundTemplateRecord,
  findCourseTeeBoxRecord,
  getDefaultCourseTeeBoxRecord,
  normalizeCourseRecord,
} from "../../domain/course-models.js";

const LOCAL_PROVIDER_ID = "us-course-database";

const COURSE_ADDRESS_OVERRIDES = {
  "golden-nugget-lake-charles": "2550 Golden Nugget Blvd",
  "torrey-pines-south": "11480 N Torrey Pines Rd",
  "pebble-beach-california": "1700 17 Mile Dr",
};

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function formatDistanceLabel(distanceMiles) {
  if (!Number.isFinite(distanceMiles)) {
    return "Discoverable now";
  }

  if (distanceMiles < 1) {
    return `${distanceMiles.toFixed(1)} mi`;
  }

  return `${distanceMiles.toFixed(1)} mi`;
}

function calculateDistanceMiles(latA, lngA, latB, lngB) {
  const earthRadiusMiles = 3958.8;
  const deltaLat = toRadians(latB - latA);
  const deltaLng = toRadians(lngB - lngA);
  const valueA = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(deltaLng / 2) ** 2;
  const valueC = 2 * Math.atan2(Math.sqrt(valueA), Math.sqrt(1 - valueA));
  return earthRadiusMiles * valueC;
}

function normalizeLocalCourse(rawCourse) {
  const normalized = normalizeCourseRecord({
    ...rawCourse,
    address: rawCourse?.address || COURSE_ADDRESS_OVERRIDES[rawCourse?.id] || "",
    country: rawCourse?.country || "USA",
    providerLabel: "Local manual provider",
  }, LOCAL_PROVIDER_ID);

  return {
    ...normalized,
    source: rawCourse?.source || LOCAL_PROVIDER_ID,
    featured: Boolean(rawCourse?.featured),
    featuredNote: rawCourse?.featuredNote || "",
    architect: rawCourse?.architect || "",
    courseType: rawCourse?.courseType || normalized.metadata?.courseType || "course",
  };
}

export const localCourseProvider = {
  id: LOCAL_PROVIDER_ID,
  meta: {
    id: LOCAL_PROVIDER_ID,
    label: "U.S. course database",
    live: true,
    supportsSearch: true,
    supportsNearby: true,
    supportsRoundTemplates: true,
    description: "Built-in U.S. course records for search, nearby course assist, and round templates.",
  },
  searchCourses(query = "", { limit = 10 } = {}) {
    return searchCourseLibrary(query)
      .slice(0, limit)
      .map((course) => normalizeLocalCourse(course));
  },
  getCourseQuickPicks(limit = 4) {
    return getCourseQuickPicks(limit).map((course) => normalizeLocalCourse(course));
  },
  getRoundSetupCourses(query = "", limit = 10) {
    return getRoundSetupCourses(query, limit).map((course) => normalizeLocalCourse(course));
  },
  getCourseById(courseId) {
    const course = findCourseById(courseId);
    return course ? normalizeLocalCourse(course) : null;
  },
  findNearbyCourses(lat, lng, { limit = 6, radiusMiles = 50 } = {}) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return [];
    }

    return listSeededCourses()
      .map((course) => normalizeLocalCourse(course))
      .filter((course) => Number.isFinite(course.latitude) && Number.isFinite(course.longitude))
      .map((course) => {
        const distanceMiles = calculateDistanceMiles(lat, lng, course.latitude, course.longitude);
        return {
          ...course,
          nearbyDistanceMiles: distanceMiles,
          nearbyDistanceLabel: formatDistanceLabel(distanceMiles),
        };
      })
      .filter((course) => course.nearbyDistanceMiles <= radiusMiles)
      .sort((left, right) => left.nearbyDistanceMiles - right.nearbyDistanceMiles)
      .slice(0, limit);
  },
  buildRoundTemplate(courseId, teeId = "", { holeCount = 18 } = {}) {
    const course = this.getCourseById(courseId);
    if (!course) {
      return null;
    }

    const teeBox = findCourseTeeBoxRecord(course, teeId) || getDefaultCourseTeeBoxRecord(course);
    return createCourseRoundTemplateRecord({
      course,
      teeBox,
      holeCount,
    });
  },
};
