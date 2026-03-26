function normalizeMergeValue(value = "") {
  return String(value || "").trim().toLowerCase();
}

function slugifyMergeValue(value = "") {
  return normalizeMergeValue(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function mergeUniqueValues(...valueLists) {
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

function getRawCourseMergeKey(course = {}) {
  const id = slugifyMergeValue(course?.id || course?.slug || "");
  if (id) {
    return id;
  }

  const displayName = slugifyMergeValue(course?.displayName || course?.courseName || course?.clubName || course?.name || "");
  const city = slugifyMergeValue(course?.city || "");
  const state = slugifyMergeValue(course?.state || "");
  return [displayName, city, state].filter(Boolean).join(":");
}

function pickPreferredValue(primaryValue, fallbackValue) {
  if (primaryValue === null || primaryValue === undefined || primaryValue === "") {
    return fallbackValue;
  }

  return primaryValue;
}

function mergeRawCourseRows(baseCourse = {}, enrichmentCourse = {}) {
  const mergedMetadata = {
    ...(enrichmentCourse?.metadata || {}),
    ...(baseCourse?.metadata || {}),
    enrichmentSource: enrichmentCourse?.source || enrichmentCourse?.metadata?.source || "",
    enrichmentSourceType: enrichmentCourse?.sourceType || enrichmentCourse?.metadata?.sourceType || "",
    enrichmentApplied: true,
    sourceHistory: mergeUniqueValues(
      baseCourse?.metadata?.sourceHistory || [],
      enrichmentCourse?.metadata?.sourceHistory || [],
      [baseCourse?.source || ""],
      [enrichmentCourse?.source || ""]
    ),
  };

  return {
    ...enrichmentCourse,
    ...baseCourse,
    id: baseCourse?.id || enrichmentCourse?.id || "",
    slug: baseCourse?.slug || enrichmentCourse?.slug || "",
    clubName: pickPreferredValue(baseCourse?.clubName, enrichmentCourse?.clubName),
    courseName: pickPreferredValue(baseCourse?.courseName, enrichmentCourse?.courseName),
    displayName: pickPreferredValue(baseCourse?.displayName, enrichmentCourse?.displayName),
    address: pickPreferredValue(baseCourse?.address, enrichmentCourse?.address),
    city: pickPreferredValue(baseCourse?.city, enrichmentCourse?.city),
    state: pickPreferredValue(baseCourse?.state, enrichmentCourse?.state),
    postalCode: pickPreferredValue(baseCourse?.postalCode, enrichmentCourse?.postalCode),
    latitude: pickPreferredValue(baseCourse?.latitude, enrichmentCourse?.latitude),
    longitude: pickPreferredValue(baseCourse?.longitude, enrichmentCourse?.longitude),
    holesCount: pickPreferredValue(baseCourse?.holesCount, enrichmentCourse?.holesCount),
    architect: pickPreferredValue(baseCourse?.architect, enrichmentCourse?.architect),
    opened: pickPreferredValue(baseCourse?.opened, enrichmentCourse?.opened),
    courseType: pickPreferredValue(baseCourse?.courseType, enrichmentCourse?.courseType),
    teeBoxes: Array.isArray(baseCourse?.teeBoxes) && baseCourse.teeBoxes.length
      ? baseCourse.teeBoxes
      : (Array.isArray(enrichmentCourse?.teeBoxes) ? enrichmentCourse.teeBoxes : []),
    aliases: mergeUniqueValues(baseCourse?.aliases || [], enrichmentCourse?.aliases || []),
    searchTerms: mergeUniqueValues(baseCourse?.searchTerms || [], enrichmentCourse?.searchTerms || []),
    keywords: mergeUniqueValues(baseCourse?.keywords || [], enrichmentCourse?.keywords || []),
    externalIds: {
      ...(enrichmentCourse?.externalIds || {}),
      ...(baseCourse?.externalIds || {}),
    },
    metadata: mergedMetadata,
  };
}

export function mergeImportedCourseRowsWithEnrichment(baseRows = [], enrichmentRows = []) {
  const enrichmentByKey = new Map(
    enrichmentRows
      .map((row) => [getRawCourseMergeKey(row), row])
      .filter(([key]) => Boolean(key))
  );

  return baseRows.map((baseRow) => {
    const enrichment = enrichmentByKey.get(getRawCourseMergeKey(baseRow));
    return enrichment ? mergeRawCourseRows(baseRow, enrichment) : baseRow;
  });
}
