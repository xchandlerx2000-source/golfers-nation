export function getDefaultCourseState() {
  return {
    catalogProviderId: "imported-us-course-database",
    catalogStatus: "ready",
    lastImportSource: "seeded-bootstrap-import",
    lastImportAt: null,
    recordsCount: 0,
    nearbyStatus: "idle",
    lastNearbySearch: null,
    lastQuery: "",
  };
}

export function mergeCourseState(courseState = {}, updates = {}) {
  return {
    ...getDefaultCourseState(),
    ...(courseState || {}),
    ...(updates || {}),
  };
}
