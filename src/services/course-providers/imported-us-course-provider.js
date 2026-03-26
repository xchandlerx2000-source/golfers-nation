import {
  createCourseRoundTemplateRecord,
  findCourseTeeBoxRecord,
  getDefaultCourseTeeBoxRecord,
} from "../../domain/course-models.js";
import {
  getCachedCourseById,
  getCachedCourseDiscoveryIndex,
  getCachedCourseNearbyIndex,
  getCourseCatalogManifest,
  loadCourseDetailById,
  loadCourseDiscoveryIndex,
  loadCourseNearbyIndex,
} from "../course-catalog-loader.js";
import {
  findNearbyUsCourseImportCatalog,
  searchUsCourseImportCatalog,
} from "../course-import/us-course-import-service.js";

const IMPORTED_PROVIDER_ID = "imported-us-course-database";
const importedCatalogManifest = getCourseCatalogManifest();

function getImportedCourseCatalog() {
  return getCachedCourseDiscoveryIndex();
}

function getImportedNearbyCourseCatalog() {
  return getCachedCourseNearbyIndex();
}

export async function ensureImportedUsCourseDiscoveryReady() {
  return loadCourseDiscoveryIndex();
}

export async function ensureImportedUsCourseNearbyReady() {
  return loadCourseNearbyIndex();
}

export async function ensureImportedUsCourseDetailReady(courseId = "") {
  return loadCourseDetailById(courseId);
}

export const importedUsCourseProvider = {
  id: IMPORTED_PROVIDER_ID,
  meta: {
    id: IMPORTED_PROVIDER_ID,
    label: importedCatalogManifest?.providerLabel || "Imported U.S. course database",
    live: Number(importedCatalogManifest?.recordCount || 0) > 0,
    supportsSearch: true,
    supportsNearby: true,
    supportsRoundTemplates: true,
    recordCount: Number(importedCatalogManifest?.recordCount || 0),
    importSourceCount: Number(importedCatalogManifest?.sourceCount || importedCatalogManifest?.sources?.length || 0),
    description: Number(importedCatalogManifest?.recordCount || 0) > 0
      ? "Runtime-loaded U.S. course catalog ready for nationwide search, nearby lookup, and round templates."
      : "Future import adapter for a licensed or curated nationwide U.S. course dataset.",
  },
  searchCourses(query = "", { limit = 10 } = {}) {
    return searchUsCourseImportCatalog(getImportedCourseCatalog(), query, { limit });
  },
  getCourseQuickPicks(limit = 4) {
    return getImportedNearbyCourseCatalog().slice(0, limit);
  },
  getRoundSetupCourses(query = "", limit = 10) {
    return searchUsCourseImportCatalog(getImportedCourseCatalog(), query, { limit });
  },
  getCourseById(courseId) {
    return getCachedCourseById(courseId);
  },
  findNearbyCourses(lat, lng, { limit = 6, radiusMiles = 50 } = {}) {
    return findNearbyUsCourseImportCatalog(getImportedNearbyCourseCatalog(), lat, lng, { limit, radiusMiles });
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
