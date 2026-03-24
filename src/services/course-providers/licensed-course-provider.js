export const licensedCourseProvider = {
  id: "licensed-course-database",
  meta: {
    id: "licensed-course-database",
    label: "Licensed course database",
    live: false,
    supportsSearch: true,
    supportsNearby: true,
    supportsRoundTemplates: true,
    description: "Future plug-in point for a licensed golf course database with verified tee, slope, and rating coverage.",
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
