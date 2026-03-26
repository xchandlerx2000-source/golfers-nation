import { applyCourseCapabilitiesToCatalog } from "@golfers-nation/course";
import nativeDiscoverySeed from "./native-discovery-seed.json";

export const DEMO_USER = {
  id: "native-user-1",
  profileId: "profile-native-user-1",
  name: "Alex Mercer",
  displayName: "Alex Mercer",
  username: "alexmercer",
  avatarLabel: "AM",
  homeCourse: "Torrey Pines Golf Course",
  handicap: 9.8,
  city: "San Diego",
};

export const STARTER_COURSES = applyCourseCapabilitiesToCatalog(nativeDiscoverySeed.courses || []);

export const RECOMMENDED_COURSES = STARTER_COURSES.slice(0, 12);

export const SAMPLE_PLAYERS = [
  {
    id: "friend-1",
    displayName: "Jordan Lee",
    username: "jordanlee",
    avatarLabel: "JL",
  },
  {
    id: "friend-2",
    displayName: "Chris Hall",
    username: "chrishall",
    avatarLabel: "CH",
  },
];
