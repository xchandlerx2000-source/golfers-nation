import { normalizeCourseRecord } from "../domain/course-models.js";
import { cloneData } from "../utils/formatters.js";

function normalizeImportedCourseHoleRows(rawHoles = []) {
  if (!Array.isArray(rawHoles)) {
    return [];
  }

  return rawHoles.map((hole, index) => ({
    number: Number(hole?.number || index + 1),
    par: Number(hole?.par || 4),
    yards: Number(hole?.yards || 0),
    handicapIndex: hole?.handicapIndex ?? null,
    notes: hole?.notes || "",
    gps: cloneData(hole?.gps || null),
  }));
}

function normalizeImportedCourseTeeRows(rawTees = []) {
  if (!Array.isArray(rawTees)) {
    return [];
  }

  return rawTees.map((tee, index) => ({
    id: tee?.id || tee?.teeId || `tee-${index + 1}`,
    name: tee?.name || tee?.teeName || `Tee ${index + 1}`,
    color: tee?.color || "",
    gender: tee?.gender || "",
    slope: tee?.slope ?? null,
    rating: tee?.rating ?? null,
    holes: normalizeImportedCourseHoleRows(tee?.holes || tee?.perHole || []),
  }));
}

function buildImportedCourseSourceMeta(rawCourse = {}, options = {}) {
  const sourceLabel = options.providerLabel || rawCourse?.providerLabel || "";
  const sourceType = options.sourceType || rawCourse?.sourceType || "bulk-import";
  const importedAt = options.importedAt || rawCourse?.importedAt || null;

  return {
    providerLabel: sourceLabel,
    sourceType,
    sourceImportedAt: importedAt,
    providerCourseId: rawCourse?.providerCourseId || rawCourse?.externalIds?.providerCourseId || rawCourse?.id || "",
    externalIds: cloneData(rawCourse?.externalIds || {}),
  };
}

export function normalizeImportedCourseSourceRecord(rawCourse = {}, options = {}) {
  const providerId = options.providerId || rawCourse?.providerId || "imported-us-course-database";
  const rawTeeBoxes = Array.isArray(rawCourse?.tees) && rawCourse.tees.length
    ? rawCourse.tees
    : (Array.isArray(rawCourse?.teeBoxes) ? rawCourse.teeBoxes : []);
  const normalized = normalizeCourseRecord({
    id: rawCourse?.id || rawCourse?.courseId || "",
    slug: rawCourse?.slug || "",
    clubName: rawCourse?.clubName || rawCourse?.club || rawCourse?.name || rawCourse?.displayName || "",
    courseName: rawCourse?.courseName || rawCourse?.name || rawCourse?.clubName || rawCourse?.displayName || "",
    displayName: rawCourse?.displayName || "",
    address: rawCourse?.address || rawCourse?.addressLine1 || "",
    city: rawCourse?.city || "",
    state: rawCourse?.state || "",
    stateName: rawCourse?.stateName || "",
    postalCode: rawCourse?.postalCode || rawCourse?.zip || "",
    country: rawCourse?.country || "USA",
    region: rawCourse?.region || "",
    latitude: rawCourse?.latitude ?? rawCourse?.lat ?? null,
    longitude: rawCourse?.longitude ?? rawCourse?.lng ?? null,
    holesCount: rawCourse?.holesCount || rawCourse?.holeCount || 18,
    teeBoxes: normalizeImportedCourseTeeRows(rawTeeBoxes),
    aliases: cloneData(rawCourse?.aliases || []),
    keywords: cloneData(rawCourse?.searchTerms || rawCourse?.keywords || []),
    featured: Boolean(rawCourse?.featured),
    featuredNote: rawCourse?.featuredNote || "",
    priority: rawCourse?.priority ?? 100,
    architect: rawCourse?.architect || "",
    opened: rawCourse?.opened ?? null,
    courseType: rawCourse?.courseType || "course",
    source: options.source || rawCourse?.source || providerId,
    sourceType: options.sourceType || rawCourse?.sourceType || "bulk-import",
    providerLabel: options.providerLabel || rawCourse?.providerLabel || "",
    providerCourseId: rawCourse?.providerCourseId || rawCourse?.externalIds?.providerCourseId || rawCourse?.id || "",
    externalIds: cloneData(rawCourse?.externalIds || {}),
    metadata: {
      ...cloneData(rawCourse?.metadata || {}),
      ...buildImportedCourseSourceMeta(rawCourse, options),
    },
  }, providerId);

  return normalized;
}

export function normalizeImportedCourseSourceRecords(rawCourses = [], options = {}) {
  if (!Array.isArray(rawCourses)) {
    return [];
  }

  return rawCourses.map((rawCourse) => normalizeImportedCourseSourceRecord(rawCourse, options));
}
