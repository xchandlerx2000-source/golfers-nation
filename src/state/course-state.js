export function getDefaultCourseState() {
  return {
    catalogProviderId: "us-course-database",
    catalogStatus: "ready",
    lastImportSource: "us-seeded-course-database",
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
