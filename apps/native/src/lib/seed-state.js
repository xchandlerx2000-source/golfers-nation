import { applyCourseCapabilitiesToCatalog } from "@golfers-nation/course";
import nativeDiscoverySeed from "./native-discovery-seed.json";

export const DEMO_USER = {
  id: "local-demo-user",
  profileId: "profile-local-demo-user",
  name: "Local Golfer",
  displayName: "Local Golfer",
  username: "localgolfer",
  avatarLabel: "LG",
  homeCourse: "",
  handicap: null,
  city: "",
  provider: "local-demo",
  seededDemo: false,
};

export const STARTER_COURSES = applyCourseCapabilitiesToCatalog(nativeDiscoverySeed.courses || []);

export const RECOMMENDED_COURSES = STARTER_COURSES.slice(0, 12);
