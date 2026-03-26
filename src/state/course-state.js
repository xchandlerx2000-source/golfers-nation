export function getDefaultCourseAdminReviewState() {
  return {
    reportStatus: "idle",
    overridesStatus: "idle",
    lastError: "",
    selectedQueue: "high",
    report: null,
    overrides: null,
  };
}

export function getDefaultCourseState() {
  return {
    catalogProviderId: "imported-us-course-database",
    catalogStatus: "idle",
    detailStatus: "idle",
    detailCourseId: "",
    lastImportSource: "runtime-course-assets",
    lastImportAt: null,
    recordsCount: 0,
    lastError: "",
    lastDetailError: "",
    nearbyStatus: "idle",
    lastNearbySearch: null,
    lastQuery: "",
    adminReview: getDefaultCourseAdminReviewState(),
  };
}

export function mergeCourseState(courseState = {}, updates = {}) {
  const base = getDefaultCourseState();
  return {
    ...base,
    ...(courseState || {}),
    ...(updates || {}),
    adminReview: {
      ...getDefaultCourseAdminReviewState(),
      ...(courseState?.adminReview || {}),
      ...(updates?.adminReview || {}),
    },
  };
}
