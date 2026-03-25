import { listSeededCourseImportRows } from "../../course-library.js";

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
