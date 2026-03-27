import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const discoveryIndexPath = path.join(projectRoot, "data", "course", "discovery-index.json");
const outputPath = path.join(projectRoot, "apps", "native", "src", "lib", "native-discovery-seed.json");

function normalizeState(value = "") {
  return String(value || "").trim().toUpperCase();
}

function getCoursePriority(course = {}) {
  return Number(course?.metadata?.priority ?? 100);
}

function getConfidence(course = {}) {
  return Number(course?.metadata?.matchConfidence || 0);
}

function getReadinessRank(course = {}) {
  switch (String(course?.metadata?.readinessTier || "").toLowerCase()) {
    case "rich-round-ready":
      return 3;
    case "basic-round-ready":
      return 2;
    case "discovery-ready":
      return 1;
    default:
      return 0;
  }
}

function compareCourses(left = {}, right = {}) {
  const leftPriority = getCoursePriority(left);
  const rightPriority = getCoursePriority(right);
  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const leftReadiness = getReadinessRank(left);
  const rightReadiness = getReadinessRank(right);
  if (leftReadiness !== rightReadiness) {
    return rightReadiness - leftReadiness;
  }

  const leftConfidence = getConfidence(left);
  const rightConfidence = getConfidence(right);
  if (leftConfidence !== rightConfidence) {
    return rightConfidence - leftConfidence;
  }

  return String(left.displayName || "").localeCompare(String(right.displayName || ""));
}

function pickSeedCourses(courses = [], {
  targetCount = 240,
  perStateMinimum = 4,
} = {}) {
  const sorted = [...courses].sort(compareCourses);
  const byState = new Map();
  sorted.forEach((course) => {
    const state = normalizeState(course.state || "NA");
    if (!byState.has(state)) {
      byState.set(state, []);
    }
    byState.get(state).push(course);
  });

  const selected = [];
  const selectedIds = new Set();

  for (const [, stateCourses] of byState) {
    for (const course of stateCourses.slice(0, perStateMinimum)) {
      if (!selectedIds.has(course.id)) {
        selected.push(course);
        selectedIds.add(course.id);
      }
    }
  }

  for (const course of sorted) {
    if (selected.length >= targetCount) {
      break;
    }
    if (selectedIds.has(course.id)) {
      continue;
    }
    selected.push(course);
    selectedIds.add(course.id);
  }

  return selected
    .slice(0, targetCount)
    .map((course) => ({
      id: course.id,
      slug: course.slug,
      providerId: course.providerId,
      displayName: course.displayName,
      name: course.name,
      clubName: course.clubName,
      courseName: course.courseName,
      address: course.address,
      city: course.city,
      state: course.state,
      stateName: course.stateName,
      postalCode: course.postalCode,
      country: course.country,
      region: course.region,
      latitude: course.latitude,
      longitude: course.longitude,
      holesCount: course.holesCount,
      teeBoxes: course.teeBoxes,
      aliases: course.aliases,
      searchKeywords: course.searchKeywords,
      detailShard: course.detailShard,
      metadata: course.metadata,
    }));
}

async function main() {
  const discovery = JSON.parse(await fs.readFile(discoveryIndexPath, "utf8"));
  const seedCourses = pickSeedCourses(discovery.courses || []);
  const payload = {
    generatedAt: new Date().toISOString(),
    sourceRecordCount: Array.isArray(discovery.courses) ? discovery.courses.length : 0,
    seedRecordCount: seedCourses.length,
    courses: seedCourses,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Native course seed generated with ${seedCourses.length} course(s).`);
}

await main();
