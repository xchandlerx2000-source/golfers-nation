import { cloneData } from "../utils/formatters.js";

function normalizeCourseKeyValue(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

function buildCourseIdentityLabel(row = {}) {
  const displayName = String(row?.displayName || "").trim();
  if (displayName) {
    return displayName;
  }

  return [row?.clubName, row?.courseName, row?.name]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ");
}

function buildCourseIdKey(row = {}) {
  const idCandidate = row?.providerCourseId
    || row?.externalIds?.providerCourseId
    || row?.id
    || row?.slug
    || "";
  const normalized = normalizeCourseKeyValue(idCandidate);
  return normalized || "";
}

function buildCourseLocationKey(row = {}) {
  const identity = normalizeCourseKeyValue(buildCourseIdentityLabel(row));
  const city = normalizeCourseKeyValue(row?.city || "");
  const state = normalizeCourseKeyValue(row?.state || "");
  return [identity, city, state].filter(Boolean).join("|");
}

function pickFirstNonEmptyString(...values) {
  for (const value of values) {
    const normalized = String(value || "").trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function pickFirstDefinedValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function pickFirstNumericValue(...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return null;
}

function pickFirstPositiveNumericValue(...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }

  return 0;
}

function hasMeaningfulValue(value) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return Boolean(value.trim());
  }

  return true;
}

function getTeeRows(row = {}) {
  if (Array.isArray(row?.teeBoxes)) {
    return row.teeBoxes;
  }

  if (Array.isArray(row?.tees)) {
    return row.tees;
  }

  return [];
}

function getTeeDataScore(row = {}) {
  const teeRows = getTeeRows(row);
  if (!teeRows.length) {
    return 0;
  }

  let score = 1;
  if (teeRows.some((teeBox) => Array.isArray(teeBox?.holes) && teeBox.holes.length)) {
    score += 2;
  }

  if (teeRows.some((teeBox) => hasMeaningfulValue(teeBox?.rating) || hasMeaningfulValue(teeBox?.slope))) {
    score += 1;
  }

  return score;
}

function getPreferredTeeRows(baseRow = {}, enrichmentRow = {}) {
  return getTeeDataScore(enrichmentRow) > getTeeDataScore(baseRow)
    ? cloneData(getTeeRows(enrichmentRow))
    : cloneData(getTeeRows(baseRow));
}

function getEnrichmentPriority(row = {}) {
  const explicitPriority = Number(row?.metadata?.enrichmentPriority);
  if (Number.isFinite(explicitPriority)) {
    return explicitPriority;
  }

  return getTeeDataScore(row) > 0 ? 300 : 100;
}

function buildMergedExternalIds(baseRow = {}, enrichmentRow = {}) {
  return {
    ...cloneData(enrichmentRow?.externalIds || {}),
    ...cloneData(baseRow?.externalIds || {}),
  };
}

function buildMergedMetadata(baseRow = {}, enrichmentRow = {}, matchMeta = {}) {
  return {
    ...cloneData(baseRow?.metadata || {}),
    ...cloneData(enrichmentRow?.metadata || {}),
    enrichmentApplied: Boolean(enrichmentRow && matchMeta?.matchType),
    enrichmentMatchType: matchMeta?.matchType || "",
    enrichmentMatchConfidence: Number(matchMeta?.matchConfidence || 0),
    sourceHistory: mergeUniqueCourseValues(
      baseRow?.metadata?.sourceHistory || [],
      enrichmentRow?.metadata?.sourceHistory || [],
      [baseRow?.source || ""],
      [enrichmentRow?.source || ""]
    ),
  };
}

function mergeImportedCourseRow(baseRow = {}, enrichmentRow = {}, matchMeta = {}) {
  const mergedTeeBoxes = getPreferredTeeRows(baseRow, enrichmentRow);
  const mergedTees = cloneData(mergedTeeBoxes);

  return {
    ...cloneData(baseRow),
    id: pickFirstNonEmptyString(baseRow?.id, enrichmentRow?.id),
    slug: pickFirstNonEmptyString(baseRow?.slug, enrichmentRow?.slug),
    clubName: pickFirstNonEmptyString(baseRow?.clubName, enrichmentRow?.clubName, baseRow?.name, enrichmentRow?.name),
    courseName: pickFirstNonEmptyString(baseRow?.courseName, enrichmentRow?.courseName, baseRow?.clubName, enrichmentRow?.clubName),
    displayName: pickFirstNonEmptyString(baseRow?.displayName, enrichmentRow?.displayName, baseRow?.courseName, enrichmentRow?.courseName),
    address: pickFirstNonEmptyString(
      enrichmentRow?.address,
      enrichmentRow?.addressLine1,
      baseRow?.address,
      baseRow?.addressLine1
    ),
    city: pickFirstNonEmptyString(baseRow?.city, enrichmentRow?.city),
    state: pickFirstNonEmptyString(baseRow?.state, enrichmentRow?.state),
    stateName: pickFirstNonEmptyString(baseRow?.stateName, enrichmentRow?.stateName, baseRow?.state, enrichmentRow?.state),
    postalCode: pickFirstNonEmptyString(
      enrichmentRow?.postalCode,
      enrichmentRow?.zip,
      baseRow?.postalCode,
      baseRow?.zip
    ),
    country: pickFirstNonEmptyString(baseRow?.country, enrichmentRow?.country, "USA"),
    region: pickFirstNonEmptyString(baseRow?.region, enrichmentRow?.region),
    latitude: pickFirstNumericValue(baseRow?.latitude, baseRow?.lat, enrichmentRow?.latitude, enrichmentRow?.lat),
    longitude: pickFirstNumericValue(baseRow?.longitude, baseRow?.lng, enrichmentRow?.longitude, enrichmentRow?.lng),
    holesCount: pickFirstPositiveNumericValue(
      enrichmentRow?.holesCount,
      enrichmentRow?.holeCount,
      baseRow?.holesCount,
      baseRow?.holeCount,
      18
    ),
    teeBoxes: mergedTeeBoxes,
    tees: mergedTees,
    aliases: mergeUniqueCourseValues(baseRow?.aliases || [], enrichmentRow?.aliases || []),
    searchTerms: mergeUniqueCourseValues(
      baseRow?.searchTerms || [],
      enrichmentRow?.searchTerms || [],
      baseRow?.keywords || [],
      enrichmentRow?.keywords || []
    ),
    keywords: mergeUniqueCourseValues(
      baseRow?.keywords || [],
      enrichmentRow?.keywords || [],
      baseRow?.searchTerms || [],
      enrichmentRow?.searchTerms || []
    ),
    featured: Boolean(baseRow?.featured || enrichmentRow?.featured),
    featuredNote: pickFirstNonEmptyString(baseRow?.featuredNote, enrichmentRow?.featuredNote),
    priority: Math.min(Number(baseRow?.priority ?? 100), Number(enrichmentRow?.priority ?? 100)),
    architect: pickFirstNonEmptyString(enrichmentRow?.architect, baseRow?.architect),
    opened: pickFirstDefinedValue(enrichmentRow?.opened, baseRow?.opened),
    courseType: pickFirstNonEmptyString(enrichmentRow?.courseType, baseRow?.courseType, "course"),
    source: pickFirstNonEmptyString(baseRow?.source, enrichmentRow?.source, "imported-course-catalog"),
    sourceType: pickFirstNonEmptyString(baseRow?.sourceType, enrichmentRow?.sourceType, "bulk-import"),
    providerLabel: pickFirstNonEmptyString(baseRow?.providerLabel, enrichmentRow?.providerLabel),
    providerCourseId: pickFirstNonEmptyString(
      baseRow?.providerCourseId,
      enrichmentRow?.providerCourseId,
      baseRow?.externalIds?.providerCourseId,
      enrichmentRow?.externalIds?.providerCourseId,
      baseRow?.id,
      enrichmentRow?.id
    ),
    externalIds: buildMergedExternalIds(baseRow, enrichmentRow),
    metadata: buildMergedMetadata(baseRow, enrichmentRow, matchMeta),
  };
}

function buildEnrichmentLookup(rows = []) {
  const byId = new Map();
  const byLocation = new Map();

  rows.forEach((row) => {
    const idKey = buildCourseIdKey(row);
    const locationKey = buildCourseLocationKey(row);

    if (idKey) {
      const matches = byId.get(idKey) || [];
      matches.push(row);
      byId.set(idKey, matches);
    }

    if (locationKey) {
      const matches = byLocation.get(locationKey) || [];
      matches.push(row);
      byLocation.set(locationKey, matches);
    }
  });

  return {
    byId,
    byLocation,
  };
}

export function mergeImportedCourseRowsWithEnrichment(baseRows = [], enrichmentRows = []) {
  if (!Array.isArray(baseRows) || !baseRows.length) {
    return [];
  }

  if (!Array.isArray(enrichmentRows) || !enrichmentRows.length) {
    return cloneData(baseRows);
  }

  const lookup = buildEnrichmentLookup(enrichmentRows);

  return baseRows.map((baseRow) => {
    const idKey = buildCourseIdKey(baseRow);
    const locationKey = buildCourseLocationKey(baseRow);
    const idMatches = idKey ? (lookup.byId.get(idKey) || []) : [];
    const locationMatches = locationKey ? (lookup.byLocation.get(locationKey) || []) : [];
    const matchedRows = [...idMatches, ...locationMatches]
      .filter((row, index, rows) => rows.findIndex((candidate) => candidate === row) === index)
      .sort((left, right) => getEnrichmentPriority(left) - getEnrichmentPriority(right));

    if (!matchedRows.length) {
      return cloneData(baseRow);
    }

    return matchedRows.reduce((mergedRow, enrichmentRow) => mergeImportedCourseRow(mergedRow, enrichmentRow, {
      matchType: idMatches.includes(enrichmentRow) ? "id" : "location",
      matchConfidence: idMatches.includes(enrichmentRow) ? 0.99 : 0.92,
    }), cloneData(baseRow));
  });
}
