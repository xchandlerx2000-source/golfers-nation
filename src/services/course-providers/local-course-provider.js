import {
  createCourseRoundTemplateRecord,
  findCourseTeeBoxRecord,
  getDefaultCourseTeeBoxRecord,
} from "../../domain/course-models.js";
import { listSeededCourseImportRows } from "../course-library.js";
import {
  buildUsCourseImportCatalog,
  findNearbyUsCourseImportCatalog,
  searchUsCourseImportCatalog,
} from "../course-import/us-course-import-service.js";

const LOCAL_PROVIDER_ID = "us-course-database";

const localCourseProviderCatalog = buildUsCourseImportCatalog(listSeededCourseImportRows(), {
  providerId: LOCAL_PROVIDER_ID,
  providerLabel: "U.S. course database",
  source: "us-seeded-course-database",
  sourceType: "seeded-us-database",
});

function getLocalCourseProviderCatalog() {
  return localCourseProviderCatalog;
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
    description: "Built-in normalized U.S. course records for search, nearby course assist, and round templates.",
  },
  searchCourses(query = "", { limit = 10 } = {}) {
    return searchUsCourseImportCatalog(getLocalCourseProviderCatalog(), query, { limit });
  },
  getCourseQuickPicks(limit = 4) {
    return searchUsCourseImportCatalog(getLocalCourseProviderCatalog(), "", { limit });
  },
  getRoundSetupCourses(query = "", limit = 10) {
    return searchUsCourseImportCatalog(getLocalCourseProviderCatalog(), query, { limit });
  },
  getCourseById(courseId) {
    return getLocalCourseProviderCatalog().find((course) => course.id === courseId) || null;
  },
  findNearbyCourses(lat, lng, { limit = 6, radiusMiles = 50 } = {}) {
    return findNearbyUsCourseImportCatalog(getLocalCourseProviderCatalog(), lat, lng, { limit, radiusMiles });
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
