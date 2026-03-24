export const placesCourseProvider = {
  id: "maps-places-provider",
  meta: {
    id: "maps-places-provider",
    label: "Maps / Places provider",
    live: false,
    supportsSearch: true,
    supportsNearby: true,
    supportsRoundTemplates: false,
    description: "Future nearby-search provider for map-based course detection and candidate ranking.",
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
