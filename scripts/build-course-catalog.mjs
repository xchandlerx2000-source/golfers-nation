import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeImportedCourseRowsWithEnrichment } from "../src/services/course-enrichment.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const rawImportRoot = path.join(projectRoot, "data", "course-import");
const rawEnrichmentRoot = path.join(projectRoot, "data", "course-enrichment");
const generatedModulePath = path.join(projectRoot, "src", "services", "course-import", "generated", "us-course-catalog.js");

function toPosixPath(value = "") {
  return String(value || "").replace(/\\/g, "/");
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

function createBootstrapModule() {
  return `import { listSeededCourseImportRows } from "../../course-library.js";

function createBootstrapImportedRows() {
  return listSeededCourseImportRows().map((row) => ({
    ...row,
    source: row.source || "seeded-bootstrap-import",
    sourceType: "seeded-bootstrap-import",
    providerLabel: "Imported U.S. course database",
    metadata: {
      ...(row.metadata || {}),
      bootstrapImported: true,
      sourceHistory: [
        ...(row.metadata?.sourceHistory || []),
        row.source || "seeded-bootstrap-import",
      ],
    },
  }));
}

export const IMPORTED_US_COURSE_SOURCES = [
  {
    id: "seeded-bootstrap-import",
    label: "Seeded bootstrap import",
    sourceType: "seeded-bootstrap-import",
    recordCount: createBootstrapImportedRows().length,
  },
];

export const IMPORTED_US_COURSE_ROWS = createBootstrapImportedRows();
`;
}

function createImportedModule(payload) {
  return `// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source of truth: data/course-import/**/*.json and data/course-enrichment/**/*.json

export const IMPORTED_US_COURSE_SOURCES = ${JSON.stringify(payload.sources, null, 2)};

export const IMPORTED_US_COURSE_ROWS = ${JSON.stringify(payload.rows, null, 2)};
`;
}

await mkdir(path.dirname(generatedModulePath), { recursive: true });

const importPayload = await loadRawJsonPayload(rawImportRoot);
const enrichmentPayload = await loadRawJsonPayload(rawEnrichmentRoot);
const mergedPayload = importPayload?.rows?.length
  ? {
      rows: mergeImportedCourseRowsWithEnrichment(importPayload.rows, enrichmentPayload?.rows || []),
      sources: [
        ...(importPayload?.sources || []),
        ...(enrichmentPayload?.sources || []),
      ],
    }
  : null;
const nextContent = mergedPayload?.rows?.length
  ? createImportedModule(mergedPayload)
  : createBootstrapModule();

await writeFile(generatedModulePath, `${nextContent.trim()}\n`, "utf8");

console.log(mergedPayload?.rows?.length
  ? `Course catalog generated from ${mergedPayload.sources.length} import/enrichment source(s).`
  : "Course catalog generated from seeded bootstrap data.");
