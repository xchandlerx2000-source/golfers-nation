export const golfnowCourseProvider = {
  id: "golfnow-partner-api",
  meta: {
    id: "golfnow-partner-api",
    label: "GolfNow partner API",
    live: false,
    supportsSearch: true,
    supportsNearby: true,
    supportsRoundTemplates: true,
    description: "Future partner provider for licensed GolfNow course search, nearby lookup, and tee selection.",
  },
  searchCourses() {
    return [];
  },
  getCourseQuickPicks() {
    return [];
  },
  getRoundSetupCourses() {
    return [];
  },
  getCourseById() {
    return null;
  },
  findNearbyCourses() {
    return [];
  },
  buildRoundTemplate() {
    return null;
  },
};
