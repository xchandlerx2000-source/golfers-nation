export const importedUsCourseProvider = {
  id: "imported-us-course-database",
  meta: {
    id: "imported-us-course-database",
    label: "Imported U.S. course database",
    live: false,
    supportsSearch: true,
    supportsNearby: true,
    supportsRoundTemplates: true,
    description: "Future import adapter for a licensed or curated nationwide U.S. course dataset.",
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
