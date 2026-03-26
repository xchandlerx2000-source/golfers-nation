import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildUsCourseImportCatalog } from "../src/services/course-import/us-course-import-service.js";
import { mergeImportedCourseRowsWithEnrichment } from "../src/services/course-enrichment.js";
import { applyCourseAdminOverrides, buildCourseReconciliationReport } from "../src/services/course-reconciliation.js";
import {
  getCuratedScoringEnrichmentSourceDescriptor,
  listCuratedScoringEnrichmentRows,
} from "../src/services/course-scoring-enrichment.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const rawImportRoot = path.join(projectRoot, "data", "course-import");
const rawEnrichmentRoot = path.join(projectRoot, "data", "course-enrichment");
const rawAdminRoot = path.join(projectRoot, "data", "course-admin");
const runtimeCourseRoot = path.join(projectRoot, "data", "course");
const runtimeDetailRoot = path.join(runtimeCourseRoot, "detail-shards");
const generatedModuleRoot = path.join(projectRoot, "src", "services", "course-import", "generated");
const generatedManifestModulePath = path.join(generatedModuleRoot, "us-course-catalog-manifest.js");
const legacyGeneratedCatalogModulePath = path.join(generatedModuleRoot, "us-course-catalog.js");

const IMPORTED_PROVIDER_ID = "imported-us-course-database";
const IMPORTED_PROVIDER_LABEL = "Imported U.S. course database";
const RUNTIME_DISCOVERY_INDEX_PATH = "data/course/discovery-index.json";
const RUNTIME_NEARBY_INDEX_PATH = "data/course/nearby-index.json";

function toPosixPath(value = "") {
  return String(value || "").replace(/\\/g, "/");
}

function slugifyValue(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDetailShardKey(course = {}) {
  return slugifyValue(course?.state || course?.stateName || course?.region || "unknown") || "unknown";
}

async function listJsonFiles(rootDirectory) {
  try {
    const entries = await readdir(rootDirectory, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
      const absolutePath = path.join(rootDirectory, entry.name);
      if (entry.isDirectory()) {
        return listJsonFiles(absolutePath);
      }

      return entry.isFile() && entry.name.toLowerCase().endsWith(".json")
        ? [absolutePath]
        : [];
    }));
    return files.flat();
  } catch {
    return [];
  }
}

function normalizeRawImportDocument(document, filePath) {
  if (Array.isArray(document)) {
    return {
      rows: document,
      source: {
        id: toPosixPath(path.relative(projectRoot, filePath)),
        label: path.basename(filePath, path.extname(filePath)),
        sourceType: "json-import",
        file: toPosixPath(path.relative(projectRoot, filePath)),
        recordCount: document.length,
      },
    };
  }

  const rows = Array.isArray(document?.rows)
    ? document.rows
    : Array.isArray(document?.courses)
      ? document.courses
      : [];

  return {
    rows,
    source: {
      id: String(document?.id || toPosixPath(path.relative(projectRoot, filePath))),
      label: String(document?.label || document?.name || path.basename(filePath, path.extname(filePath))),
      sourceType: String(document?.sourceType || "json-import"),
      file: toPosixPath(path.relative(projectRoot, filePath)),
      recordCount: rows.length,
      importedAt: document?.importedAt || null,
    },
  };
}

async function loadRawJsonPayload(rootDirectory) {
  const files = await listJsonFiles(rootDirectory);
  if (!files.length) {
    return null;
  }

  const rows = [];
  const sources = [];

  for (const filePath of files) {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const normalized = normalizeRawImportDocument(parsed, filePath);
    rows.push(...normalized.rows);
    sources.push(normalized.source);
  }

  return {
    rows,
    sources,
  };
}

function createDiscoveryCourseRecord(course = {}, detailShard = "unknown") {
  const primaryTee = Array.isArray(course?.teeBoxes) && course.teeBoxes[0]
    ? {
        id: course.teeBoxes[0].id || "default",
        name: course.teeBoxes[0].name || "Default",
        color: course.teeBoxes[0].color || "",
        gender: course.teeBoxes[0].gender || "",
        totalPar: Number(course.teeBoxes[0].totalPar || 0),
        totalYardage: Number(course.teeBoxes[0].totalYardage || 0),
        slope: course.teeBoxes[0].slope ?? null,
        rating: course.teeBoxes[0].rating ?? null,
      }
    : null;

  return {
    id: course.id,
    slug: course.slug || "",
    providerId: course.providerId || IMPORTED_PROVIDER_ID,
    displayName: course.displayName || course.name || "",
    name: course.name || course.displayName || "",
    clubName: course.clubName || "",
    courseName: course.courseName || course.name || "",
    address: course.address || "",
    city: course.city || "",
    state: course.state || "",
    stateName: course.stateName || course.state || "",
    postalCode: course.postalCode || "",
    country: course.country || "USA",
    region: course.region || "",
    latitude: course.latitude ?? null,
    longitude: course.longitude ?? null,
    holesCount: Number(course.holesCount || 18),
    teeBoxes: primaryTee ? [primaryTee] : [],
    aliases: Array.isArray(course.aliases) ? course.aliases : [],
    searchKeywords: Array.isArray(course.searchKeywords) ? course.searchKeywords : [],
    detailShard,
    metadata: {
      priority: course?.metadata?.priority ?? 100,
      featured: Boolean(course?.metadata?.featured),
      completenessScore: Number(course?.metadata?.completenessScore || 0),
      discoveryReady: Boolean(course?.metadata?.discoveryReady),
      basicRoundReady: Boolean(course?.metadata?.basicRoundReady),
      richRoundReady: Boolean(course?.metadata?.richRoundReady),
      readinessTier: course?.metadata?.readinessTier || "incomplete",
      matchConfidence: Number(course?.metadata?.matchConfidence || 0),
      confidenceTier: course?.metadata?.confidenceTier || "low",
      qualityFlags: course?.metadata?.qualityFlags || {},
      courseType: course?.metadata?.courseType || "course",
      source: course?.metadata?.source || IMPORTED_PROVIDER_ID,
      sourceType: course?.metadata?.sourceType || "bulk-import",
      providerCourseId: course?.metadata?.providerCourseId || course.id || "",
      providerLabel: course?.metadata?.providerLabel || IMPORTED_PROVIDER_LABEL,
      seeded: Boolean(course?.metadata?.seeded),
    },
  };
}

function createNearbyCourseRecord(course = {}, detailShard = "unknown") {
  const primaryTee = Array.isArray(course?.teeBoxes) && course.teeBoxes[0]
    ? {
        id: course.teeBoxes[0].id || "default",
        name: course.teeBoxes[0].name || "Default",
        totalPar: Number(course.teeBoxes[0].totalPar || 0),
        totalYardage: Number(course.teeBoxes[0].totalYardage || 0),
      }
    : null;

  return {
    id: course.id,
    slug: course.slug || "",
    providerId: course.providerId || IMPORTED_PROVIDER_ID,
    displayName: course.displayName || course.name || "",
    name: course.name || course.displayName || "",
    clubName: course.clubName || "",
    courseName: course.courseName || course.name || "",
    city: course.city || "",
    state: course.state || "",
    stateName: course.stateName || course.state || "",
    country: course.country || "USA",
    latitude: course.latitude ?? null,
    longitude: course.longitude ?? null,
    holesCount: Number(course.holesCount || 18),
    teeBoxes: primaryTee ? [primaryTee] : [],
    detailShard,
    metadata: {
      priority: course?.metadata?.priority ?? 100,
      featured: Boolean(course?.metadata?.featured),
      completenessScore: Number(course?.metadata?.completenessScore || 0),
      discoveryReady: Boolean(course?.metadata?.discoveryReady),
      basicRoundReady: Boolean(course?.metadata?.basicRoundReady),
      richRoundReady: Boolean(course?.metadata?.richRoundReady),
      readinessTier: course?.metadata?.readinessTier || "incomplete",
      matchConfidence: Number(course?.metadata?.matchConfidence || 0),
      confidenceTier: course?.metadata?.confidenceTier || "low",
      qualityFlags: course?.metadata?.qualityFlags || {},
      courseType: course?.metadata?.courseType || "course",
      source: course?.metadata?.source || IMPORTED_PROVIDER_ID,
      sourceType: course?.metadata?.sourceType || "bulk-import",
      providerCourseId: course?.metadata?.providerCourseId || course.id || "",
      providerLabel: course?.metadata?.providerLabel || IMPORTED_PROVIDER_LABEL,
      seeded: Boolean(course?.metadata?.seeded),
    },
  };
}

function buildCatalogQualitySummary(catalog = []) {
  return catalog.reduce((summary, course) => {
    const readinessTier = course?.metadata?.readinessTier || "incomplete";
    const confidenceTier = course?.metadata?.confidenceTier || "low";

    summary.readinessTiers[readinessTier] = Number(summary.readinessTiers[readinessTier] || 0) + 1;
    summary.confidenceTiers[confidenceTier] = Number(summary.confidenceTiers[confidenceTier] || 0) + 1;
    summary.hasRealTeeData += Number(Boolean(course?.metadata?.qualityFlags?.hasRealTeeData));
    summary.hasRealHoleData += Number(Boolean(course?.metadata?.qualityFlags?.hasRealHoleData));
    summary.hasRealRatingSlope += Number(Boolean(course?.metadata?.qualityFlags?.hasRealRatingSlope));
    return summary;
  }, {
    readinessTiers: {
      incomplete: 0,
      "discovery-ready": 0,
      "basic-round-ready": 0,
      "rich-round-ready": 0,
    },
    confidenceTiers: {
      low: 0,
      medium: 0,
      high: 0,
    },
    hasRealTeeData: 0,
    hasRealHoleData: 0,
    hasRealRatingSlope: 0,
  });
}

function createCatalogAssetVersion(catalog = [], sources = []) {
  const hash = createHash("sha1");
  hash.update(JSON.stringify(catalog));
  hash.update(JSON.stringify(sources));
  return hash.digest("hex").slice(0, 12);
}

function buildRuntimeCatalogArtifacts(catalog = [], sources = []) {
  const shardMap = new Map();
  const discoveryIndex = catalog.map((course) => {
    const detailShard = getDetailShardKey(course);
    const existingShard = shardMap.get(detailShard) || [];
    existingShard.push(course);
    shardMap.set(detailShard, existingShard);
    return createDiscoveryCourseRecord(course, detailShard);
  });
  const nearbyIndex = catalog
    .filter((course) => Number.isFinite(course?.latitude) && Number.isFinite(course?.longitude))
    .map((course) => createNearbyCourseRecord(course, getDetailShardKey(course)));

  const detailShards = [...shardMap.entries()]
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, records]) => ({
      key,
      state: records[0]?.state || "",
      recordCount: records.length,
      path: `data/course/detail-shards/${key}.json`,
      courses: records,
    }));

  const assetVersion = createCatalogAssetVersion(catalog, sources);

  return {
    manifest: {
      version: 1,
      assetVersion,
      providerId: IMPORTED_PROVIDER_ID,
      providerLabel: IMPORTED_PROVIDER_LABEL,
      generatedAt: new Date().toISOString(),
      recordCount: catalog.length,
      sourceCount: sources.length,
      qualitySummary: buildCatalogQualitySummary(catalog),
      reconciliationSummary: {
        overriddenRecords: catalog.filter((course) => Boolean(course?.metadata?.adminOverrideApplied)).length,
        reviewedRecords: catalog.filter((course) => String(course?.metadata?.adminReviewStatus || "") === "approved").length,
      },
      sources,
      nearbyIndexPath: RUNTIME_NEARBY_INDEX_PATH,
      discoveryIndexPath: RUNTIME_DISCOVERY_INDEX_PATH,
      detailShards: detailShards.map(({ courses, ...shard }) => shard),
    },
    nearbyIndex,
    discoveryIndex,
    detailShards,
  };
}

async function writeJsonFile(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(payload), "utf8");
}

function createGeneratedManifestModule(manifest) {
  return `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source of truth: data/course-import/**/*.json, data/course-enrichment/**/*.json, and scripts/build-course-catalog.mjs

export const IMPORTED_US_COURSE_CATALOG_MANIFEST = ${JSON.stringify(manifest, null, 2)};
`;
}

function buildRuntimeAdminOverridesPayload(overrideRows = [], metadata = {}) {
  const rows = Array.isArray(overrideRows) ? overrideRows : [];
  const approvedCount = rows.filter((row) => String(row?.reviewStatus || "").toLowerCase() === "approved").length;
  const pendingCount = rows.filter((row) => String(row?.reviewStatus || "").toLowerCase() === "pending").length;
  const rejectedCount = rows.filter((row) => String(row?.reviewStatus || "").toLowerCase() === "rejected").length;

  return {
    generatedAt: metadata.generatedAt || new Date().toISOString(),
    assetVersion: metadata.assetVersion || "",
    sourceId: "admin-course-overrides",
    label: "Admin course overrides",
    overrideCount: rows.length,
    approvedCount,
    pendingCount,
    rejectedCount,
    rows,
  };
}

async function writeRuntimeCatalogArtifacts(artifacts) {
  await rm(runtimeCourseRoot, { recursive: true, force: true });
  await mkdir(runtimeDetailRoot, { recursive: true });

  await writeJsonFile(path.join(runtimeCourseRoot, "manifest.json"), artifacts.manifest);
  await writeJsonFile(path.join(runtimeCourseRoot, "nearby-index.json"), {
    generatedAt: artifacts.manifest.generatedAt,
    recordCount: artifacts.nearbyIndex.length,
    courses: artifacts.nearbyIndex,
  });
  await writeJsonFile(path.join(runtimeCourseRoot, "discovery-index.json"), {
    generatedAt: artifacts.manifest.generatedAt,
    recordCount: artifacts.discoveryIndex.length,
    courses: artifacts.discoveryIndex,
  });
  await writeJsonFile(path.join(runtimeCourseRoot, "reconciliation-report.json"), artifacts.reconciliationReport);
  await writeJsonFile(path.join(runtimeCourseRoot, "admin-overrides.json"), artifacts.adminOverrides);

  for (const shard of artifacts.detailShards) {
    await writeJsonFile(path.join(projectRoot, shard.path), {
      generatedAt: artifacts.manifest.generatedAt,
      key: shard.key,
      state: shard.state,
      recordCount: shard.recordCount,
      courses: shard.courses,
    });
  }

  await mkdir(generatedModuleRoot, { recursive: true });
  await writeFile(
    generatedManifestModulePath,
    `${createGeneratedManifestModule(artifacts.manifest).trim()}\n`,
    "utf8"
  );
  await rm(legacyGeneratedCatalogModulePath, { force: true });
}

const importPayload = await loadRawJsonPayload(rawImportRoot);
const enrichmentPayload = await loadRawJsonPayload(rawEnrichmentRoot);
const adminOverridePayload = await loadRawJsonPayload(rawAdminRoot);
const curatedScoringEnrichmentPayload = {
  rows: listCuratedScoringEnrichmentRows(),
  sources: [getCuratedScoringEnrichmentSourceDescriptor()],
};
const mergedPayload = importPayload?.rows?.length
  ? {
      rows: applyCourseAdminOverrides(
        mergeImportedCourseRowsWithEnrichment(importPayload.rows, [
          ...(enrichmentPayload?.rows || []),
          ...(curatedScoringEnrichmentPayload.rows || []),
        ]),
        adminOverridePayload?.rows || []
      ),
      sources: [
        ...(importPayload?.sources || []),
        ...(enrichmentPayload?.sources || []),
        ...(curatedScoringEnrichmentPayload?.sources || []),
        ...(adminOverridePayload?.sources || []),
      ],
    }
  : null;

const canonicalCatalog = buildUsCourseImportCatalog(mergedPayload?.rows || [], {
  providerId: IMPORTED_PROVIDER_ID,
  providerLabel: IMPORTED_PROVIDER_LABEL,
  source: "imported-course-catalog",
  sourceType: "bulk-import",
});

const runtimeArtifacts = buildRuntimeCatalogArtifacts(canonicalCatalog, mergedPayload?.sources || []);
runtimeArtifacts.reconciliationReport = buildCourseReconciliationReport(
  canonicalCatalog,
  adminOverridePayload?.rows || [],
  {
    generatedAt: runtimeArtifacts.manifest.generatedAt,
    assetVersion: runtimeArtifacts.manifest.assetVersion,
  }
);
runtimeArtifacts.adminOverrides = buildRuntimeAdminOverridesPayload(
  adminOverridePayload?.rows || [],
  {
    generatedAt: runtimeArtifacts.manifest.generatedAt,
    assetVersion: runtimeArtifacts.manifest.assetVersion,
  }
);
await writeRuntimeCatalogArtifacts(runtimeArtifacts);

console.log(
  canonicalCatalog.length
    ? `Course catalog generated as runtime assets with ${canonicalCatalog.length} canonical course record(s) across ${runtimeArtifacts.detailShards.length} detail shard(s).`
    : "Course catalog generated with no imported course records."
);
