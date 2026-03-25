import { IMPORTED_US_COURSE_ROWS, IMPORTED_US_COURSE_SOURCES } from "../course-import/generated/us-course-catalog.js";
import {
  createCourseRoundTemplateRecord,
  findCourseTeeBoxRecord,
  getDefaultCourseTeeBoxRecord,
} from "../../domain/course-models.js";
import {
  buildUsCourseImportCatalog,
  findNearbyUsCourseImportCatalog,
  searchUsCourseImportCatalog,
} from "../course-import/us-course-import-service.js";

const IMPORTED_PROVIDER_ID = "imported-us-course-database";
const importedCourseCatalog = buildUsCourseImportCatalog(IMPORTED_US_COURSE_ROWS, {
  providerId: IMPORTED_PROVIDER_ID,
  providerLabel: "Imported U.S. course database",
  source: "imported-course-catalog",
  sourceType: "bulk-import",
});

function getImportedCourseCatalog() {
  return importedCourseCatalog;
}

export const importedUsCourseProvider = {
  id: IMPORTED_PROVIDER_ID,
  meta: {
    id: IMPORTED_PROVIDER_ID,
    label: "Imported U.S. course database",
    live: importedCourseCatalog.length > 0,
    supportsSearch: true,
    supportsNearby: true,
    supportsRoundTemplates: true,
    recordCount: importedCourseCatalog.length,
    importSourceCount: IMPORTED_US_COURSE_SOURCES.length,
    description: importedCourseCatalog.length
      ? "Import-generated U.S. course catalog ready for nationwide search, nearby lookup, and round templates."
      : "Future import adapter for a licensed or curated nationwide U.S. course dataset.",
  },
  searchCourses(query = "", { limit = 10 } = {}) {
    return searchUsCourseImportCatalog(getImportedCourseCatalog(), query, { limit });
  },
  getCourseQuickPicks(limit = 4) {
    return searchUsCourseImportCatalog(getImportedCourseCatalog(), "", { limit });
  },
  getRoundSetupCourses(query = "", limit = 10) {
    return searchUsCourseImportCatalog(getImportedCourseCatalog(), query, { limit });
  },
  getCourseById(courseId) {
    return getImportedCourseCatalog().find((course) => course.id === courseId) || null;
  },
  findNearbyCourses(lat, lng, { limit = 6, radiusMiles = 50 } = {}) {
    return findNearbyUsCourseImportCatalog(getImportedCourseCatalog(), lat, lng, { limit, radiusMiles });
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
