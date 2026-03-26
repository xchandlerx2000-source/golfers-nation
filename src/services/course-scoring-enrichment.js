import { cloneData } from "../utils/formatters.js";
import { listSeededCourses } from "./course-library.js";

const CURATED_SCORING_TARGETS = {
  "golden-nugget-lake-charles": "contraband-bayou-golf-club-at-l-auberge-du-lac-lake-charles-la",
  "the-country-club-brookline": "the-country-club-brookline-chestnut-hill-ma",
  "granite-links-quincy": "granite-links-golf-club-at-quarry-hills-quincy-ma",
  "boston-golf-club": "boston-golf-club-hingham-ma",
  "east-lake-atlanta": "east-lake-golf-club-atlanta-ga",
  "sea-island-seaside": "sea-island-golf-club-saint-simons-island-ga",
  "tpc-louisiana-avondale": "tpc-of-louisiana-avondale-la",
  "english-turn-new-orleans": "english-turn-golf-country-club-new-orleans-la",
  "squire-creek-choudrant": "squire-creek-country-club-choudrant-la",
  "shadow-creek-las-vegas": "shadow-creek-golf-club-north-las-vegas-nv",
  "paiute-wolf-las-vegas": "las-vegas-paiute-golf-resort-las-vegas-nv",
  "cascata-boulder-city": "cascata-boulder-city-nv",
  "pebble-beach-california": "pebble-beach-golf-links-pebble-beach-ca",
  "torrey-pines-south": "torrey-pines-golf-course-la-jolla-ca",
  "riviera-country-club": "riviera-country-club-pacific-palisades-ca",
};

export function getCuratedScoringEnrichmentSourceDescriptor() {
  return {
    id: "curated-scoring-detail-enrichment",
    label: "Curated scoring detail enrichment",
    sourceType: "scoring-detail-enrichment",
    file: "src/services/course-scoring-enrichment.js",
    recordCount: Object.keys(CURATED_SCORING_TARGETS).length,
    importedAt: null,
  };
}

export function listCuratedScoringEnrichmentRows() {
  const seededCourses = listSeededCourses();

  return seededCourses
    .filter((course) => CURATED_SCORING_TARGETS[course.id])
    .map((course) => ({
      id: CURATED_SCORING_TARGETS[course.id],
      providerCourseId: CURATED_SCORING_TARGETS[course.id],
      clubName: course.clubName || course.name || "",
      courseName: course.courseName || course.name || "",
      displayName: course.displayName || course.name || "",
      city: course.city || "",
      state: course.state || "",
      stateName: course.stateName || course.state || "",
      country: "USA",
      region: course.region || "",
      latitude: course.latitude ?? null,
      longitude: course.longitude ?? null,
      holesCount: Array.isArray(course?.teeBoxes?.[0]?.holes) ? course.teeBoxes[0].holes.length : 18,
      teeBoxes: cloneData(course.teeBoxes || []),
      aliases: cloneData(course.aliases || []),
      searchTerms: cloneData(course.keywords || []),
      architect: course.architect || "",
      opened: course.opened ?? null,
      courseType: course.courseType || "course",
      source: "curated-scoring-detail-enrichment",
      sourceType: "scoring-detail-enrichment",
      providerLabel: "Curated scoring detail enrichment",
      metadata: {
        seeded: Boolean(course.seeded),
        enrichmentPriority: 300,
        teeDetailReady: true,
        holeByHoleReady: true,
        handicapReady: Boolean(course.teeBoxes?.some((teeBox) => teeBox.holes?.some((hole) => hole.handicapIndex !== null && hole.handicapIndex !== undefined))),
        scoringDetailReady: true,
        scoringDetailSourceCourseId: course.id,
        sourceHistory: [
          "curated-scoring-detail-enrichment",
          course.source || "us-seeded-course-database",
        ],
      },
    }));
}
