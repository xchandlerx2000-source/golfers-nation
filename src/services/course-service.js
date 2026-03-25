import { FEATURED_COURSE_ID } from "../config.js";
import {
  createManualRoundTemplateRecord,
  findCourseTeeBoxRecord,
  getDefaultCourseTeeBoxRecord,
} from "../domain/course-models.js";
import { importedUsCourseProvider } from "./course-providers/imported-us-course-provider.js";
import { licensedCourseProvider } from "./course-providers/licensed-course-provider.js";
import { localCourseProvider } from "./course-providers/local-course-provider.js";
import { mockCourseProvider } from "./course-providers/mock-course-provider.js";
import { golfnowCourseProvider } from "./course-providers/golfnow-course-provider.js";
import { placesCourseProvider } from "./course-providers/places-course-provider.js";

const COURSE_PROVIDERS = [
  localCourseProvider,
  importedUsCourseProvider,
  licensedCourseProvider,
  golfnowCourseProvider,
  placesCourseProvider,
  mockCourseProvider,
];

function getProviders({ includeScaffolded = true, includeTestingProviders = false } = {}) {
  return COURSE_PROVIDERS.filter((provider) => {
    if (!includeScaffolded && provider?.meta?.live === false) {
      return false;
    }

    if (!includeTestingProviders && provider?.meta?.testingOnly) {
      return false;
    }

    return true;
  });
}

function getCourseKey(course = {}) {
  return course.id || `${course.name || ""}:${course.city || ""}:${course.state || ""}:${course.providerId || ""}`;
}

function sortCourses(left = {}, right = {}) {
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

  return String(left?.name || "").localeCompare(String(right?.name || ""));
}

function dedupeCourses(courses = []) {
  const seen = new Map();
  courses.forEach((course) => {
    const key = getCourseKey(course);
    const existing = seen.get(key);
    if (!existing || sortCourses(course, existing) < 0) {
      seen.set(key, course);
    }
  });
  return [...seen.values()];
}

function collectCourses(methodName, args = [], options = {}) {
  return dedupeCourses(
    getProviders(options).flatMap((provider) => {
      const method = provider?.[methodName];
      if (typeof method !== "function") {
        return [];
      }

      const result = method.apply(provider, args);
      return Array.isArray(result) ? result : [];
    })
  ).sort(sortCourses);
}

export function getCourseProviderCatalog() {
  return getProviders().map((provider) => ({
    id: provider.id,
    ...provider.meta,
  }));
}

export function searchCourses(query = "", options = {}) {
  const limit = Number(options.limit || 10);
  return collectCourses("searchCourses", [query, { limit }], options).slice(0, limit);
}

export function findNearbyCourses(lat, lng, options = {}) {
  const limit = Number(options.limit || 6);
  return collectCourses(
    "findNearbyCourses",
    [lat, lng, { limit, radiusMiles: Number(options.radiusMiles || 50) }],
    options
  ).slice(0, limit);
}

export function getCourseById(courseId = "", options = {}) {
  if (!courseId) {
    return null;
  }

  for (const provider of getProviders(options)) {
    const match = typeof provider?.getCourseById === "function" ? provider.getCourseById(courseId) : null;
    if (match) {
      return match;
    }
  }

  return null;
}

export function getProviderCourseQuickPicks(limit = 4, options = {}) {
  return collectCourses("getCourseQuickPicks", [limit], options).slice(0, limit);
}

export function getProviderRoundSetupCourses(query = "", limit = 10, options = {}) {
  return collectCourses("getRoundSetupCourses", [query, limit], options).slice(0, limit);
}

export function getDefaultCourseTeeBox(course) {
  return getDefaultCourseTeeBoxRecord(course);
}

export function findCourseTeeBox(course, teeId = "") {
  return findCourseTeeBoxRecord(course, teeId);
}

export function buildRoundTemplate(courseId = "", teeId = "", { holeCount = 18 } = {}, options = {}) {
  if (!courseId) {
    return null;
  }

  for (const provider of getProviders(options)) {
    const template = typeof provider?.buildRoundTemplate === "function"
      ? provider.buildRoundTemplate(courseId, teeId, { holeCount })
      : null;
    if (template) {
      return template;
    }
  }

  return null;
}

export function buildManualRoundTemplate(courseName = "", teeBoxName = "", { holeCount = 18 } = {}) {
  return createManualRoundTemplateRecord({
    courseName,
    teeBoxName,
    holeCount,
  });
}

export function getCourseDefaultRoundSetup() {
  const featuredCourse = getCourseById(FEATURED_COURSE_ID);
  const featuredTeeBox = getDefaultCourseTeeBox(featuredCourse);

  return {
    step: "course",
    intent: "local",
    courseMethod: "",
    courseQuery: "",
    selectedCourseId: featuredCourse?.id || "",
    selectedTeeBoxId: featuredTeeBox?.id || "",
    selectedHoleCount: 18,
    mode: "stroke",
    players: "",
    manualCourseName: "",
    manualTeeBoxName: "",
  };
}

export function getCourseRoundSetupState(roundSetup = {}) {
  return {
    ...getCourseDefaultRoundSetup(),
    ...(roundSetup || {}),
  };
}

function getNearbyCourseDiscoveryCopy(nearbyState = {}, nearbyCourses = []) {
  if (nearbyState.locationPermission === "granted" && nearbyCourses.length) {
    return {
      title: "Likely nearby courses",
      message: "Location assist is on. Confirm the course you are actually at, then pick the tee and start scoring.",
      tone: "success",
      canRefresh: true,
    };
  }

  if (nearbyState.locationPermission === "granted") {
    return {
      title: "No nearby curated course matched",
      message: "Location assist is on, but no course record matched nearby yet. Search manually or use manual setup.",
      tone: "info",
      canRefresh: true,
    };
  }

  if (nearbyState.locationPermission === "denied") {
    return {
      title: "Location is off",
      message: "Search by course name, city, or state instead. Manual setup stays available.",
      tone: "muted",
      canRefresh: false,
    };
  }

  if (nearbyState.locationStatus === "fallback") {
    return {
      title: "Nearby assist is limited",
      message: "Course search stays available even without location data.",
      tone: "muted",
      canRefresh: true,
    };
  }

  return {
    title: "Find the course you are playing",
    message: "Use location assist or search for the course you are playing.",
    tone: "muted",
    canRefresh: true,
  };
}

export function getRoundSetupDiscoveryState(roundSetup = {}, nearbyState = {}, options = {}) {
  const setup = getCourseRoundSetupState(roundSetup);
  const selectedCourse = setup.selectedCourseId ? getCourseById(setup.selectedCourseId, options) : null;
  const selectedTeeBox = selectedCourse
    ? findCourseTeeBox(selectedCourse, setup.selectedTeeBoxId || getDefaultCourseTeeBox(selectedCourse)?.id || "")
    : null;
  const searchResults = getProviderRoundSetupCourses(setup.courseQuery, setup.courseQuery ? 10 : 8, options);
  const quickPicks = setup.courseQuery ? [] : getProviderCourseQuickPicks(4, options);
  const nearbyCourses = nearbyState?.coordinates
    ? findNearbyCourses(
        Number(nearbyState.coordinates.latitude || 0),
        Number(nearbyState.coordinates.longitude || 0),
        { limit: 4, radiusMiles: 40, ...options }
      )
    : [];
  const nearbyCopy = getNearbyCourseDiscoveryCopy(nearbyState, nearbyCourses);

  return {
    roundSetup: setup,
    selectedCourse,
    selectedTeeBox,
    searchResults,
    quickPicks,
    nearbyCourses,
    nearbyCopy,
  };
}
