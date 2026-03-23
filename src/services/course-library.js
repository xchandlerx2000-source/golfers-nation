import { COURSE_TEMPLATE, FEATURED_COURSE_ID } from "../config.js";
import { cloneData } from "../utils/formatters.js";

const STATE_FULL_NAMES = {
  MA: "Massachusetts",
  GA: "Georgia",
  LA: "Louisiana",
  NV: "Nevada",
  CA: "California",
};

function roundToFive(value) {
  return Math.max(70, Math.round(value / 5) * 5);
}

function createHole(number, par, yards, {
  handicapIndex = null,
  notes = "",
} = {}) {
  return {
    number,
    par,
    yards,
    handicapIndex,
    notes,
  };
}

function createTeeBox({
  id,
  name,
  holes,
  slope = null,
  rating = null,
}) {
  return {
    id,
    name,
    totalPar: holes.reduce((sum, hole) => sum + hole.par, 0),
    totalYardage: holes.reduce((sum, hole) => sum + hole.yards, 0),
    slope,
    rating,
    holes,
  };
}

function scaleHoles(baseHoles, factor) {
  return baseHoles.map((hole) => createHole(hole.number, hole.par, roundToFive(hole.yards * factor)));
}

function createCourse({
  id,
  name,
  city,
  state,
  region,
  stateName = STATE_FULL_NAMES[state] || state,
  featured = false,
  featuredNote = "",
  priority = 100,
  aliases = [],
  keywords = [],
  latitude = null,
  longitude = null,
  architect = "",
  opened = null,
  courseType = "championship",
  source = "seeded-curated-demo",
  seeded = true,
  teeBoxes,
}) {
  return {
    id,
    name,
    city,
    state,
    stateName,
    region,
    featured,
    featuredNote,
    priority,
    aliases,
    keywords,
    latitude,
    longitude,
    architect,
    opened,
    courseType,
    source,
    seeded,
    teeBoxes,
  };
}

function createSeededCourse({
  id,
  name,
  city,
  state,
  region,
  latitude,
  longitude,
  aliases = [],
  keywords = [],
  priority = 100,
  featuredNote = "",
  architect = "",
  opened = null,
  courseType = "championship",
  basePars,
  championshipYards,
  championshipName = "Blue",
  championshipSlope = null,
  championshipRating = null,
  memberName = "White",
  memberFactor = 0.92,
  memberSlope = null,
  memberRating = null,
}) {
  const championshipHoles = basePars.map((par, index) => createHole(index + 1, par, championshipYards[index]));
  const memberHoles = scaleHoles(championshipHoles, memberFactor);

  return createCourse({
    id,
    name,
    city,
    state,
    region,
    latitude,
    longitude,
    aliases,
    keywords,
    priority,
    featuredNote,
    architect,
    opened,
    courseType,
    teeBoxes: [
      createTeeBox({
        id: `${id}-${championshipName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: championshipName,
        holes: championshipHoles,
        slope: championshipSlope,
        rating: championshipRating,
      }),
      createTeeBox({
        id: `${id}-${memberName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: memberName,
        holes: memberHoles,
        slope: memberSlope,
        rating: memberRating,
      }),
    ],
  });
}

const SEEDED_COURSES = [
  createCourse({
    id: FEATURED_COURSE_ID,
    name: "The Country Club at Golden Nugget",
    city: "Lake Charles",
    state: "LA",
    region: "Lake Charles / Louisiana",
    featured: true,
    featuredNote: "Default local tester course",
    priority: 0,
    aliases: ["Golden Nugget", "Golden Nugget Lake Charles", "Country Club at Golden Nugget"],
    keywords: ["local", "tester", "lake charles", "louisiana", "resort"],
    architect: "Todd Eckenrode",
    courseType: "resort",
    latitude: 30.1869,
    longitude: -93.2754,
    source: "https://www.goldennugget.com/lake-charles/amenities/golf/tour-the-golf-course/",
    teeBoxes: [
      createTeeBox({
        id: `${FEATURED_COURSE_ID}-tee-1`,
        name: "Tee 1",
        slope: null,
        rating: null,
        holes: [
          createHole(1, 5, 501), createHole(2, 4, 435), createHole(3, 4, 394), createHole(4, 3, 207),
          createHole(5, 5, 535), createHole(6, 4, 464), createHole(7, 3, 173), createHole(8, 4, 458),
          createHole(9, 4, 390), createHole(10, 4, 300), createHole(11, 4, 467), createHole(12, 5, 520),
          createHole(13, 4, 329), createHole(14, 3, 170), createHole(15, 4, 357), createHole(16, 3, 169),
          createHole(17, 4, 459), createHole(18, 5, 581),
        ],
      }),
      createTeeBox({
        id: `${FEATURED_COURSE_ID}-tee-2`,
        name: "Tee 2",
        slope: null,
        rating: null,
        holes: [
          createHole(1, 5, 477), createHole(2, 4, 407), createHole(3, 4, 362), createHole(4, 3, 186),
          createHole(5, 5, 506), createHole(6, 4, 404), createHole(7, 3, 147), createHole(8, 4, 432),
          createHole(9, 4, 366), createHole(10, 4, 296), createHole(11, 4, 437), createHole(12, 5, 494),
          createHole(13, 4, 304), createHole(14, 3, 163), createHole(15, 4, 326), createHole(16, 3, 154),
          createHole(17, 4, 424), createHole(18, 5, 574),
        ],
      }),
      createTeeBox({
        id: `${FEATURED_COURSE_ID}-tee-3`,
        name: "Tee 3",
        slope: null,
        rating: null,
        holes: [
          createHole(1, 5, 460), createHole(2, 4, 374), createHole(3, 4, 350), createHole(4, 3, 160),
          createHole(5, 5, 485), createHole(6, 4, 390), createHole(7, 3, 140), createHole(8, 4, 393),
          createHole(9, 4, 360), createHole(10, 4, 290), createHole(11, 4, 418), createHole(12, 5, 475),
          createHole(13, 4, 285), createHole(14, 3, 140), createHole(15, 4, 315), createHole(16, 3, 135),
          createHole(17, 4, 410), createHole(18, 5, 525),
        ],
      }),
      createTeeBox({
        id: `${FEATURED_COURSE_ID}-tee-4`,
        name: "Tee 4",
        slope: null,
        rating: null,
        holes: [
          createHole(1, 5, 423), createHole(2, 4, 317), createHole(3, 4, 290), createHole(4, 3, 113),
          createHole(5, 5, 455), createHole(6, 4, 343), createHole(7, 3, 112), createHole(8, 4, 336),
          createHole(9, 4, 318), createHole(10, 4, 241), createHole(11, 4, 390), createHole(12, 5, 435),
          createHole(13, 4, 271), createHole(14, 3, 94), createHole(15, 4, 275), createHole(16, 3, 101),
          createHole(17, 4, 357), createHole(18, 5, 445),
        ],
      }),
    ],
  }),
  createSeededCourse({
    id: "the-country-club-brookline",
    name: "The Country Club",
    city: "Brookline",
    state: "MA",
    region: "Boston / Massachusetts",
    latitude: 42.3317,
    longitude: -71.1398,
    basePars: [4, 4, 4, 3, 5, 4, 4, 4, 4, 4, 3, 4, 4, 4, 5, 3, 4, 4],
    championshipYards: [425, 392, 471, 151, 548, 179, 373, 392, 458, 502, 131, 482, 440, 465, 625, 171, 437, 443],
    championshipName: "Championship",
    championshipSlope: 145,
    championshipRating: 75.2,
    memberName: "Member",
    memberFactor: 0.915,
    memberSlope: 136,
    memberRating: 72.1,
  }),
  createSeededCourse({
    id: "granite-links-quincy",
    name: "Granite Links",
    city: "Quincy",
    state: "MA",
    region: "Boston / Massachusetts",
    latitude: 42.2281,
    longitude: -71.0204,
    basePars: [4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4],
    championshipYards: [431, 189, 552, 446, 404, 202, 438, 561, 417, 409, 461, 182, 548, 423, 439, 192, 573, 431],
    championshipName: "Black",
    championshipSlope: 142,
    championshipRating: 74.6,
    memberName: "Blue",
    memberFactor: 0.925,
    memberSlope: 135,
    memberRating: 71.9,
  }),
  createSeededCourse({
    id: "boston-golf-club",
    name: "Boston Golf Club",
    city: "Hingham",
    state: "MA",
    region: "Boston / Massachusetts",
    latitude: 42.2161,
    longitude: -70.8964,
    aliases: ["BGC Hingham", "Boston GC"],
    keywords: ["boston", "private", "massachusetts"],
    priority: 32,
    architect: "Gil Hanse",
    courseType: "private",
    basePars: [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 3, 4, 5, 4],
    championshipYards: [422, 455, 182, 560, 448, 430, 212, 575, 436, 454, 571, 206, 447, 435, 210, 471, 588, 462],
    championshipName: "Back",
    championshipSlope: 146,
    championshipRating: 75.1,
    memberName: "Member",
    memberFactor: 0.912,
    memberSlope: 138,
    memberRating: 72.4,
  }),
  createSeededCourse({
    id: "east-lake-atlanta",
    name: "East Lake Golf Club",
    city: "Atlanta",
    state: "GA",
    region: "Georgia",
    latitude: 33.7454,
    longitude: -84.3184,
    basePars: [4, 3, 4, 4, 4, 5, 4, 4, 5, 4, 4, 5, 3, 4, 3, 4, 4, 5],
    championshipYards: [455, 214, 397, 479, 442, 525, 434, 235, 600, 469, 438, 547, 212, 520, 211, 435, 421, 590],
    championshipName: "Tournament",
    championshipSlope: 148,
    championshipRating: 76.1,
    memberName: "Club",
    memberFactor: 0.905,
    memberSlope: 139,
    memberRating: 72.8,
  }),
  createSeededCourse({
    id: "sea-island-seaside",
    name: "Sea Island Golf Club - Seaside Course",
    city: "St. Simons Island",
    state: "GA",
    region: "Georgia",
    latitude: 31.1544,
    longitude: -81.3916,
    basePars: [4, 4, 3, 4, 4, 4, 5, 3, 4, 4, 4, 4, 5, 4, 4, 3, 4, 5],
    championshipYards: [410, 425, 188, 472, 417, 409, 557, 204, 435, 418, 437, 429, 559, 442, 404, 168, 429, 562],
    championshipName: "Seaside",
    championshipSlope: 141,
    championshipRating: 74.5,
    memberName: "Resort",
    memberFactor: 0.91,
    memberSlope: 133,
    memberRating: 71.3,
  }),
  createSeededCourse({
    id: "atlanta-athletic-highlands",
    name: "Atlanta Athletic Club - Highlands",
    city: "Johns Creek",
    state: "GA",
    region: "Georgia",
    latitude: 34.0215,
    longitude: -84.1746,
    aliases: ["Atlanta Athletic Club", "AAC Highlands"],
    keywords: ["atlanta", "johns creek", "championship"],
    priority: 38,
    architect: "Rees Jones",
    courseType: "championship",
    basePars: [4, 4, 3, 4, 4, 5, 4, 3, 5, 4, 5, 4, 3, 4, 4, 3, 4, 5],
    championshipYards: [435, 460, 215, 487, 434, 597, 436, 213, 564, 449, 597, 444, 235, 520, 470, 226, 456, 590],
    championshipName: "Highlands",
    championshipSlope: 147,
    championshipRating: 76.0,
    memberName: "Member",
    memberFactor: 0.908,
    memberSlope: 139,
    memberRating: 72.9,
  }),
  createSeededCourse({
    id: "tpc-louisiana-avondale",
    name: "TPC Louisiana",
    city: "Avondale",
    state: "LA",
    region: "Louisiana",
    latitude: 29.9113,
    longitude: -90.1896,
    basePars: [4, 5, 3, 4, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 4, 4, 3, 5],
    championshipYards: [441, 548, 221, 482, 476, 476, 585, 399, 207, 472, 575, 437, 215, 491, 471, 452, 215, 585],
    championshipName: "Tournament",
    championshipSlope: 149,
    championshipRating: 76.4,
    memberName: "Blue",
    memberFactor: 0.91,
    memberSlope: 140,
    memberRating: 73.2,
  }),
  createSeededCourse({
    id: "english-turn-new-orleans",
    name: "English Turn Golf & Country Club",
    city: "New Orleans",
    state: "LA",
    region: "Louisiana",
    latitude: 29.8823,
    longitude: -89.9488,
    basePars: [4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 4, 3, 5],
    championshipYards: [419, 444, 196, 541, 451, 407, 433, 212, 566, 428, 412, 557, 186, 446, 421, 439, 173, 547],
    championshipName: "Championship",
    championshipSlope: 143,
    championshipRating: 74.2,
    memberName: "Member",
    memberFactor: 0.918,
    memberSlope: 135,
    memberRating: 71.4,
  }),
  createSeededCourse({
    id: "squire-creek-choudrant",
    name: "Squire Creek Country Club",
    city: "Choudrant",
    state: "LA",
    region: "Louisiana",
    latitude: 32.5414,
    longitude: -92.4808,
    aliases: ["Squire Creek"],
    keywords: ["north louisiana", "country club", "choudrant"],
    priority: 44,
    architect: "Tom Fazio",
    courseType: "private",
    basePars: [4, 4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 3, 4, 5],
    championshipYards: [452, 401, 572, 188, 435, 443, 557, 204, 421, 446, 588, 431, 210, 468, 420, 172, 457, 593],
    championshipName: "Championship",
    championshipSlope: 145,
    championshipRating: 74.9,
    memberName: "Club",
    memberFactor: 0.914,
    memberSlope: 136,
    memberRating: 71.8,
  }),
  createSeededCourse({
    id: "shadow-creek-las-vegas",
    name: "Shadow Creek Golf Course",
    city: "North Las Vegas",
    state: "NV",
    region: "Las Vegas / Nevada",
    latitude: 36.2021,
    longitude: -115.1822,
    basePars: [4, 4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 3, 5, 4],
    championshipYards: [439, 489, 577, 209, 462, 443, 589, 196, 448, 471, 460, 576, 235, 460, 457, 183, 622, 454],
    championshipName: "Back",
    championshipSlope: 150,
    championshipRating: 77.1,
    memberName: "Member",
    memberFactor: 0.9,
    memberSlope: 142,
    memberRating: 73.9,
  }),
  createSeededCourse({
    id: "paiute-wolf-las-vegas",
    name: "Paiute Golf Resort - Wolf Course",
    city: "Las Vegas",
    state: "NV",
    region: "Las Vegas / Nevada",
    latitude: 36.3115,
    longitude: -115.3898,
    basePars: [4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4],
    championshipYards: [478, 471, 210, 603, 463, 442, 604, 241, 430, 458, 576, 485, 236, 494, 448, 193, 604, 468],
    championshipName: "Wolf",
    championshipSlope: 154,
    championshipRating: 78.0,
    memberName: "Silver",
    memberFactor: 0.89,
    memberSlope: 145,
    memberRating: 74.6,
  }),
  createSeededCourse({
    id: "cascata-boulder-city",
    name: "Cascata",
    city: "Boulder City",
    state: "NV",
    region: "Las Vegas / Nevada",
    latitude: 35.9792,
    longitude: -114.8699,
    aliases: ["Cascata Golf Club"],
    keywords: ["vegas", "desert", "mountain", "boulder city"],
    priority: 41,
    architect: "Rees Jones",
    courseType: "resort",
    basePars: [4, 3, 5, 4, 4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4],
    championshipYards: [488, 207, 621, 474, 459, 560, 472, 218, 447, 471, 589, 454, 202, 512, 438, 166, 612, 460],
    championshipName: "Back",
    championshipSlope: 152,
    championshipRating: 77.0,
    memberName: "Member",
    memberFactor: 0.9,
    memberSlope: 143,
    memberRating: 73.8,
  }),
  createSeededCourse({
    id: "pebble-beach-california",
    name: "Pebble Beach Golf Links",
    city: "Pebble Beach",
    state: "CA",
    region: "California",
    latitude: 36.5683,
    longitude: -121.9482,
    basePars: [4, 5, 4, 4, 3, 5, 3, 4, 4, 4, 4, 3, 4, 5, 4, 4, 3, 5],
    championshipYards: [381, 511, 390, 331, 192, 503, 106, 428, 446, 495, 390, 202, 407, 580, 396, 403, 208, 543],
    championshipName: "Championship",
    championshipSlope: 144,
    championshipRating: 75.5,
    memberName: "Resort",
    memberFactor: 0.91,
    memberSlope: 136,
    memberRating: 72.4,
  }),
  createSeededCourse({
    id: "torrey-pines-south",
    name: "Torrey Pines Golf Course - South",
    city: "La Jolla",
    state: "CA",
    region: "California",
    latitude: 32.9044,
    longitude: -117.2519,
    basePars: [4, 4, 3, 4, 4, 5, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5],
    championshipYards: [454, 389, 198, 488, 454, 564, 462, 177, 615, 454, 225, 505, 614, 437, 480, 227, 443, 570],
    championshipName: "South Tournament",
    championshipSlope: 148,
    championshipRating: 77.7,
    memberName: "South Blue",
    memberFactor: 0.9,
    memberSlope: 140,
    memberRating: 74.5,
  }),
  createSeededCourse({
    id: "riviera-country-club",
    name: "Riviera Country Club",
    city: "Pacific Palisades",
    state: "CA",
    region: "California",
    latitude: 34.0452,
    longitude: -118.5019,
    aliases: ["Riviera", "Riviera Los Angeles"],
    keywords: ["la", "los angeles", "signature", "private"],
    priority: 36,
    architect: "George C. Thomas Jr.",
    courseType: "private",
    basePars: [5, 4, 4, 3, 4, 3, 4, 4, 4, 4, 5, 4, 3, 4, 3, 4, 5, 4],
    championshipYards: [503, 471, 434, 236, 434, 199, 408, 433, 458, 315, 583, 479, 191, 434, 166, 475, 587, 458],
    championshipName: "Championship",
    championshipSlope: 146,
    championshipRating: 75.8,
    memberName: "Member",
    memberFactor: 0.914,
    memberSlope: 137,
    memberRating: 72.7,
  }),
];

function normalizeQuery(value = "") {
  return String(value || "").trim().toLowerCase();
}

function createSearchText(course) {
  return normalizeQuery([
    course.name,
    course.city,
    course.state,
    course.stateName,
    course.region,
    course.architect,
    ...(course.aliases || []),
    ...(course.keywords || []),
    ...(course.teeBoxes || []).map((teeBox) => teeBox.name),
  ].join(" "));
}

function getMatchScore(course, normalizedQuery) {
  if (!normalizedQuery) {
    return 0;
  }

  const exactTargets = [
    course.name,
    course.city,
    course.state,
    course.stateName,
    ...(course.aliases || []),
  ].map(normalizeQuery);

  if (exactTargets.includes(normalizedQuery)) {
    return 260;
  }

  const prefixTargets = [
    course.name,
    course.city,
    course.region,
    ...(course.aliases || []),
  ].map(normalizeQuery);

  if (prefixTargets.some((value) => value.startsWith(normalizedQuery))) {
    return 210;
  }

  if ((course.keywords || []).map(normalizeQuery).some((value) => value.includes(normalizedQuery))) {
    return 170;
  }

  if (createSearchText(course).includes(normalizedQuery)) {
    return 120;
  }

  return -1;
}

function compareCourses(left, right) {
  if (left.id === FEATURED_COURSE_ID && right.id !== FEATURED_COURSE_ID) {
    return -1;
  }

  if (right.id === FEATURED_COURSE_ID && left.id !== FEATURED_COURSE_ID) {
    return 1;
  }

  if ((left.priority || 100) !== (right.priority || 100)) {
    return (left.priority || 100) - (right.priority || 100);
  }

  return left.name.localeCompare(right.name);
}

export function listSeededCourses() {
  return cloneData(SEEDED_COURSES);
}

export function findCourseById(courseId) {
  const found = SEEDED_COURSES.find((course) => course.id === courseId);
  return found ? cloneData(found) : null;
}

export function getDefaultTeeBox(course) {
  return course?.teeBoxes?.[0] ? cloneData(course.teeBoxes[0]) : null;
}

export function findTeeBox(course, teeBoxId) {
  if (!course?.teeBoxes?.length) {
    return null;
  }

  const found = course.teeBoxes.find((teeBox) => teeBox.id === teeBoxId);
  return cloneData(found || course.teeBoxes[0]);
}

export function searchCourseLibrary(query = "") {
  const normalized = normalizeQuery(query);
  const courses = SEEDED_COURSES.map((course) => ({
    ...course,
    searchText: createSearchText(course),
    matchScore: getMatchScore(course, normalized),
  }));

  const filtered = normalized
    ? courses.filter((course) => course.matchScore >= 0)
    : courses;

  return filtered
    .sort((left, right) => {
      if (normalized && left.matchScore !== right.matchScore) {
        return right.matchScore - left.matchScore;
      }
      return compareCourses(left, right);
    })
    .map(({ searchText, matchScore, ...course }) => cloneData(course));
}

export function getCourseQuickPicks(limit = 4) {
  return searchCourseLibrary("").slice(0, limit);
}

export function getRoundSetupCourses(query = "", limit = 10) {
  return searchCourseLibrary(query).slice(0, limit);
}

export function createManualCourseSelection(courseName = "", teeBox = "") {
  return {
    courseId: null,
    courseName: courseName || "National Pines",
    teeBoxId: null,
    teeBoxName: teeBox || "Blue",
    holes: cloneData(COURSE_TEMPLATE),
    city: "",
    state: "",
    region: "",
    latitude: null,
    longitude: null,
    source: "manual-template",
    seeded: false,
    aliases: [],
    keywords: [],
    featured: false,
    featuredNote: "",
    architect: "",
    opened: null,
    courseType: "template",
    teeCount: 1,
    totalPar: COURSE_TEMPLATE.reduce((sum, hole) => sum + hole.par, 0),
    totalYardage: COURSE_TEMPLATE.reduce((sum, hole) => sum + hole.yards, 0),
    slope: null,
    rating: null,
  };
}

export function createRoundCourseSelection(courseId, teeBoxId = "") {
  const course = findCourseById(courseId);
  if (!course) {
    return null;
  }

  const teeBox = findTeeBox(course, teeBoxId);
  if (!teeBox) {
    return null;
  }

  return {
    courseId: course.id,
    courseName: course.name,
    teeBoxId: teeBox.id,
    teeBoxName: teeBox.name,
    holes: cloneData(teeBox.holes),
    city: course.city,
    state: course.state,
    region: course.region,
    latitude: course.latitude,
    longitude: course.longitude,
    source: course.source,
    seeded: Boolean(course.seeded),
    aliases: cloneData(course.aliases || []),
    keywords: cloneData(course.keywords || []),
    featured: Boolean(course.featured),
    featuredNote: course.featuredNote || "",
    architect: course.architect || "",
    opened: course.opened ?? null,
    courseType: course.courseType || "",
    teeCount: Array.isArray(course.teeBoxes) ? course.teeBoxes.length : 0,
    totalPar: teeBox.totalPar,
    totalYardage: teeBox.totalYardage,
    slope: teeBox.slope ?? null,
    rating: teeBox.rating ?? null,
  };
}
