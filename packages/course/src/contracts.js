export const COURSE_PROVIDER_CONTRACT = Object.freeze({
  requiredMethods: [
    "searchCourses",
    "findNearbyCourses",
    "getCourseById",
    "buildRoundTemplate",
  ],
  optionalMethods: [
    "listRecentCourses",
    "getLikelyCourseSuggestion",
    "loadDiscoveryIndex",
    "getCourseCapabilities",
  ],
});

export const COURSE_SERVICE_CONTRACT = Object.freeze({
  responsibilities: [
    "Resolve nearby, recent, and manual course search flows.",
    "Hydrate full course detail only when setup requires it.",
    "Build playable round templates from rich or fallback course data.",
    "Expose course capability metadata for tee times and future on-course services.",
    "Preserve a provider-agnostic interface for web and native clients.",
  ],
});
