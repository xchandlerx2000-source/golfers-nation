import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputDirectory = path.join(projectRoot, "data", "course-enrichment");
const outputPath = path.join(outputDirectory, "us-golf-course-details.json");

const SOURCE_URL = "https://raw.githubusercontent.com/seanconeys/US_Golf_Courses/master/golf_courses.csv";

function cleanString(value = "") {
  const trimmed = String(value || "").trim();
  return trimmed && trimmed.toUpperCase() !== "N/A" ? trimmed : "";
}

function slugify(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildCourseId(name, city, state) {
  return [name, city, state].map(slugify).filter(Boolean).join("-");
}

function parseCsv(text = "") {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && next === "\n") {
        index += 1;
      }

      row.push(current);
      current = "";
      if (row.some((value) => value.length)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    current += character;
  }

  if (current.length || row.length) {
    row.push(current);
    rows.push(row);
  }

  const [header = [], ...body] = rows;
  return body.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
}

function normalizeYearBuilt(value = "") {
  const numeric = Number(cleanString(value));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function normalizeHoleCount(value = "") {
  const numeric = Number(cleanString(value));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function normalizeCourseType(value = "") {
  return cleanString(value).toLowerCase();
}

function normalizeBooleanLike(value = "") {
  const normalized = cleanString(value).toLowerCase();
  if (!normalized) {
    return null;
  }

  if (["yes", "accepted", "allowed", "open"].includes(normalized)) {
    return true;
  }

  if (["no", "not allowed", "closed"].includes(normalized)) {
    return false;
  }

  return null;
}

function transformCsvRow(row = {}) {
  const name = cleanString(row.Name);
  const city = cleanString(row.City);
  const state = cleanString(row.State).toUpperCase();

  if (!name || !city || !state) {
    return null;
  }

  const id = buildCourseId(name, city, state);
  if (!id) {
    return null;
  }

  return {
    id,
    providerCourseId: id,
    clubName: name,
    courseName: name,
    displayName: name,
    address: cleanString(row.Street),
    city,
    state,
    postalCode: cleanString(row.Zip1),
    country: "USA",
    holesCount: normalizeHoleCount(row.Holes),
    architect: cleanString(row.Designer),
    opened: normalizeYearBuilt(row["Year Built"]),
    courseType: normalizeCourseType(row["Public/Private"]) || "course",
    searchTerms: [
      city,
      state,
      cleanString(row.County),
      [city, state].join(" "),
    ].filter(Boolean),
    source: "seanconeys-us-golf-courses",
    sourceType: "public-golf-enrichment",
    providerLabel: "Public U.S. golf course enrichment",
    metadata: {
      county: cleanString(row.County),
      email: cleanString(row.Email),
      clubhousePhone: cleanString(row.Phone),
      description: cleanString(row.Description),
      publicPrivate: cleanString(row["Public/Private"]),
      annualRounds: cleanString(row["Annual Rounds"]),
      season: cleanString(row.Season),
      manager: cleanString(row.Manager),
      clubPro: cleanString(row["Club Pro"]),
      superintendent: cleanString(row.Superintendent),
      guestPolicy: cleanString(row["Guest Policy"]),
      shopHours: cleanString(row["Shop Hours"]),
      dressCode: cleanString(row["Dress Code"]),
      feeWeekend: cleanString(row["Fee Weekend"]),
      feeWeekday: cleanString(row["Fee Weekday"]),
      teeTimeReservations: cleanString(row["Tee Time Reservations"]),
      onlineReservations: cleanString(row["Online Reservations"]),
      earliestTeeTime: cleanString(row["Earliest Tee Time"]),
      greensType: cleanString(row["Greens Type"]),
      fairwayType: cleanString(row["Fairway Type"]),
      waterHazards: cleanString(row["Water Hazards"]),
      bunkers: cleanString(row.Bunkers),
      metalSpikesAllowed: normalizeBooleanLike(row["Metal Spikes"]),
      aeration: cleanString(row.Aeration),
      fivesomesAllowed: normalizeBooleanLike(row["Fivesomes Alloweed"]),
      teeDetailReady: false,
      holeByHoleReady: false,
      handicapReady: false,
      publicDataset: true,
      sourceRepo: "https://github.com/seanconeys/US_Golf_Courses",
    },
  };
}

async function fetchCsvText() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      accept: "text/csv",
      "user-agent": "GolfersNationCourseEnrichment/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function createOutputDocument(rows = []) {
  return {
    id: "public-us-golf-course-enrichment",
    label: "Public U.S. golf course enrichment",
    sourceType: "public-golf-enrichment",
    importedAt: new Date().toISOString(),
    sourceUrl: SOURCE_URL,
    recordCount: rows.length,
    rows,
  };
}

const csvText = await fetchCsvText();
const rows = parseCsv(csvText)
  .map(transformCsvRow)
  .filter(Boolean);

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(createOutputDocument(rows), null, 2)}\n`, "utf8");

console.log(`Imported ${rows.length} enrichment rows to ${outputPath}`);
