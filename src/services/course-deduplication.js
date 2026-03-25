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

  return {
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
      completenessScore: Math.max(primaryScore, secondaryScore),
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
