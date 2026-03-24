export const mockCourseProvider = {
  id: "mock-course-provider",
  meta: {
    id: "mock-course-provider",
    label: "Mock provider",
    live: false,
    supportsSearch: true,
    supportsNearby: false,
    supportsRoundTemplates: false,
    description: "Scaffolded provider reserved for future mocked integration tests and demo data injection.",
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
