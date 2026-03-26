import { deriveCourseCatalogMetadata } from "../domain/course-models.js";

function mergeUniqueCourseValues(...valueLists) {
  const seen = new Set();
  const merged = [];

  valueLists.flat().forEach((value) => {
    const normalized = String(value || "").trim();
    if (!normalized) {
      return;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(normalized);
  });

  return merged;
}

function getCourseRecordCompletenessScore(course = {}) {
  return Number(course?.metadata?.completenessScore || 0);
}

function mergeBooleanFlagMaps(...flagMaps) {
  const merged = {};
  const keys = new Set(flagMaps.flatMap((flags) => Object.keys(flags || {})));

  keys.forEach((key) => {
    const values = flagMaps
      .map((flags) => flags?.[key])
      .filter((value) => value !== undefined);

    if (values.length) {
      merged[key] = values.some(Boolean);
    }
  });

  return merged;
}

function getMergedEnrichmentMatchType(primary = {}, secondary = {}) {
  const matchTypes = [
    primary?.metadata?.enrichmentMatchType || "",
    secondary?.metadata?.enrichmentMatchType || "",
  ].filter(Boolean);

  if (matchTypes.includes("id")) {
    return "id";
  }

  if (matchTypes.includes("location")) {
    return "location";
  }

  return "";
}

function getCanonicalCourseDedupeKey(course = {}) {
  const providerCourseId = String(course?.metadata?.providerCourseId || "").trim();
  if (providerCourseId) {
    return `${course?.providerId || ""}:${providerCourseId}`;
  }

  const slug = String(course?.slug || course?.id || "").trim().toLowerCase();
  const city = String(course?.city || "").trim().toLowerCase();
  const state = String(course?.state || "").trim().toLowerCase();
  return `${slug}:${city}:${state}`;
}

export function mergeCanonicalCourseRecords(primary = {}, secondary = {}) {
  const primaryScore = getCourseRecordCompletenessScore(primary);
  const secondaryScore = getCourseRecordCompletenessScore(secondary);
  const preferred = primaryScore >= secondaryScore ? primary : secondary;
  const fallback = preferred === primary ? secondary : primary;
  const merged = {
    ...fallback,
    ...preferred,
    aliases: mergeUniqueCourseValues(primary?.aliases || [], secondary?.aliases || []),
    searchKeywords: mergeUniqueCourseValues(primary?.searchKeywords || [], secondary?.searchKeywords || []),
    teeBoxes: Array.isArray(preferred?.teeBoxes) && preferred.teeBoxes.length
      ? preferred.teeBoxes
      : (Array.isArray(fallback?.teeBoxes) ? fallback.teeBoxes : []),
    metadata: {
      ...(fallback?.metadata || {}),
      ...(preferred?.metadata || {}),
      aliases: mergeUniqueCourseValues(primary?.metadata?.aliases || [], secondary?.metadata?.aliases || []),
      keywords: mergeUniqueCourseValues(primary?.metadata?.keywords || [], secondary?.metadata?.keywords || []),
      sourceHistory: mergeUniqueCourseValues(
        primary?.metadata?.sourceHistory || [],
        secondary?.metadata?.sourceHistory || [],
        [primary?.metadata?.source || ""],
        [secondary?.metadata?.source || ""]
      ),
      qualityFlags: mergeBooleanFlagMaps(
        fallback?.metadata?.qualityFlags || {},
        preferred?.metadata?.qualityFlags || {}
      ),
      enrichmentApplied: Boolean(primary?.metadata?.enrichmentApplied || secondary?.metadata?.enrichmentApplied),
      enrichmentMatchType: getMergedEnrichmentMatchType(primary, secondary),
      enrichmentMatchConfidence: Math.max(
        Number(primary?.metadata?.enrichmentMatchConfidence || 0),
        Number(secondary?.metadata?.enrichmentMatchConfidence || 0)
      ),
    },
  };

  return {
    ...merged,
    metadata: {
      ...merged.metadata,
      ...deriveCourseCatalogMetadata(merged, merged.providerId || preferred?.providerId || fallback?.providerId || "us-course-database"),
    },
  };
}

export function dedupeCanonicalCourseRecords(records = []) {
  const deduped = new Map();

  records.forEach((record) => {
    const key = getCanonicalCourseDedupeKey(record);
    const existing = deduped.get(key);
    deduped.set(key, existing ? mergeCanonicalCourseRecords(existing, record) : record);
  });

  return [...deduped.values()];
}
