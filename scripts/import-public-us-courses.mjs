import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputDirectory = path.join(projectRoot, "data", "course-import");
const outputPath = path.join(outputDirectory, "public-us-golf-courses.json");

const DATASET_URL = "https://services3.arcgis.com/9nfxWATFamVUTTGb/ArcGIS/rest/services/USAGolf_Map_sboudiz_WFL1/FeatureServer/8/query";
const PAGE_SIZE = 2000;

function slugify(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanString(value = "") {
  return String(value || "").trim();
}

function normalizePostalCode(value = "") {
  const match = cleanString(value).match(/\b\d{5}(?:-\d{4})?\b/);
  return match ? match[0] : "";
}

function normalizeHoleCount(value) {
  const numeric = Number(value || 18);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 18;
}

function normalizeCoordinate(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function buildCourseId(name, city, state) {
  const base = [name, city, state].map(slugify).filter(Boolean).join("-");
  return base || `us-public-course-${Math.random().toString(36).slice(2, 10)}`;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "GolfersNationCourseImporter/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchCourseCount() {
  const url = new URL(DATASET_URL);
  url.search = new URLSearchParams({
    where: "1=1",
    returnCountOnly: "true",
    f: "json",
  }).toString();
  const payload = await fetchJson(url);
  return Number(payload?.count || 0);
}

async function fetchCoursePage(offset = 0) {
  const url = new URL(DATASET_URL);
  url.search = new URLSearchParams({
    where: "1=1",
    outFields: "OBJECTID,Name,City,State,Zipcode,Holes,Latitude,Longitude,Type",
    orderByFields: "OBJECTID ASC",
    resultOffset: String(offset),
    resultRecordCount: String(PAGE_SIZE),
    f: "json",
  }).toString();

  const payload = await fetchJson(url);
  return Array.isArray(payload?.features) ? payload.features : [];
}

function transformFeature(feature = {}) {
  const attributes = feature?.attributes || {};
  const name = cleanString(attributes.Name);
  const city = cleanString(attributes.City);
  const state = cleanString(attributes.State).toUpperCase();
  const latitude = normalizeCoordinate(attributes.Latitude);
  const longitude = normalizeCoordinate(attributes.Longitude);

  if (!name || !state) {
    return null;
  }

  const id = buildCourseId(name, city, state);

  return {
    id,
    providerCourseId: id,
    clubName: name,
    courseName: name,
    displayName: name,
    city,
    state,
    postalCode: normalizePostalCode(attributes.Zipcode),
    country: "USA",
    latitude,
    longitude,
    holesCount: normalizeHoleCount(attributes.Holes),
    aliases: [],
    searchTerms: [
      city,
      state,
      [city, state].filter(Boolean).join(" "),
    ].filter(Boolean),
    courseType: cleanString(attributes.Type || "course").toLowerCase() || "course",
    source: "public-us-golf-courses",
    sourceType: "public-open-data-import",
    providerLabel: "Public U.S. golf course dataset",
    externalIds: {
      sourceObjectId: String(attributes.OBJECTID || ""),
    },
    metadata: {
      publicDataset: true,
      sourceDataset: "USAGolf_Map_sboudiz_WFL1/FeatureServer/8",
    },
  };
}

function createOutputDocument(rows = [], count = 0) {
  return {
    id: "public-us-golf-courses",
    label: "Public U.S. golf course dataset",
    sourceType: "public-open-data-import",
    importedAt: new Date().toISOString(),
    sourceUrl: DATASET_URL,
    recordCount: rows.length,
    upstreamRecordCount: count,
    rows,
  };
}

const count = await fetchCourseCount();
const features = [];

for (let offset = 0; offset < count; offset += PAGE_SIZE) {
  const page = await fetchCoursePage(offset);
  features.push(...page);
}

const rows = features
  .map(transformFeature)
  .filter(Boolean);

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(createOutputDocument(rows, count), null, 2)}\n`, "utf8");

console.log(`Imported ${rows.length} public U.S. golf courses to ${outputPath}`);
