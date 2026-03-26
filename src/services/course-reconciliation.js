import { cloneData } from "../utils/formatters.js";

function normalizeCourseKeyValue(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function buildOverrideLookupKey(overrideRow = {}) {
  return normalizeCourseKeyValue(
    overrideRow?.courseId
    || overrideRow?.canonicalCourseId
    || overrideRow?.id
    || overrideRow?.slug
    || overrideRow?.providerCourseId
    || ""
  );
}

function getOverrideSource(overrideRow = {}) {
  return String(
    overrideRow?.source
    || overrideRow?.metadata?.source
    || "admin-course-overrides"
  ).trim();
}

function getOverrideReviewStatus(overrideRow = {}) {
  return String(
    overrideRow?.reviewStatus
    || overrideRow?.metadata?.reviewStatus
    || "approved"
  ).trim() || "approved";
}

function buildOverrideFieldList(baseRow = {}, overrideRow = {}) {
  return Object.keys(overrideRow)
    .filter((field) => ![
      "courseId",
      "canonicalCourseId",
      "id",
      "source",
      "sourceType",
      "reviewStatus",
      "reviewNotes",
      "metadata",
    ].includes(field))
    .filter((field) => overrideRow[field] !== undefined)
    .filter((field) => JSON.stringify(overrideRow[field]) !== JSON.stringify(baseRow?.[field]));
}

function mergeOverrideMetadata(baseRow = {}, overrideRow = {}, overrideFields = []) {
  const baseMetadata = cloneData(baseRow?.metadata || {});
  const overrideMetadata = cloneData(overrideRow?.metadata || {});
  const sourceHistory = mergeUniqueValues(
    baseMetadata?.sourceHistory || [],
    overrideMetadata?.sourceHistory || [],
    [baseRow?.source || ""],
    [getOverrideSource(overrideRow)]
  );

  return {
    ...baseMetadata,
    ...overrideMetadata,
    adminOverrideApplied: true,
    adminOverrideFields: mergeUniqueValues(
      baseMetadata?.adminOverrideFields || [],
      overrideFields
    ),
    adminOverrideSource: getOverrideSource(overrideRow),
    adminReviewStatus: getOverrideReviewStatus(overrideRow),
    adminReviewNotes: String(
      overrideRow?.reviewNotes
      || overrideMetadata?.reviewNotes
      || baseMetadata?.adminReviewNotes
      || ""
    ).trim(),
    qualityIssues: mergeUniqueValues(
      baseMetadata?.qualityIssues || [],
      overrideMetadata?.qualityIssues || [],
      overrideRow?.qualityIssues || []
    ),
    sourceHistory,
  };
}

function mergeCourseOverrideRow(baseRow = {}, overrideRow = {}) {
  const overrideFields = buildOverrideFieldList(baseRow, overrideRow);
  const merged = {
    ...cloneData(baseRow),
    ...cloneData(overrideRow),
  };

  if (overrideRow.courseId || overrideRow.canonicalCourseId) {
    merged.id = String(overrideRow.courseId || overrideRow.canonicalCourseId).trim();
  }

  if (overrideRow.teeBoxes === undefined) {
    merged.teeBoxes = cloneData(baseRow?.teeBoxes || []);
  }

  if (overrideRow.tees === undefined) {
    merged.tees = cloneData(overrideRow?.teeBoxes || baseRow?.tees || baseRow?.teeBoxes || []);
  }

  merged.metadata = mergeOverrideMetadata(baseRow, overrideRow, overrideFields);
  merged.source = getOverrideSource(overrideRow);
  merged.sourceType = String(
    overrideRow?.sourceType
    || overrideRow?.metadata?.sourceType
    || "course-admin-override"
  ).trim();
  merged.reviewStatus = getOverrideReviewStatus(overrideRow);
  merged.reviewNotes = String(
    overrideRow?.reviewNotes
    || overrideRow?.metadata?.reviewNotes
    || ""
  ).trim();

  return merged;
}

export function applyCourseAdminOverrides(baseRows = [], overrideRows = []) {
  if (!Array.isArray(baseRows) || !baseRows.length) {
    return [];
  }

  if (!Array.isArray(overrideRows) || !overrideRows.length) {
    return cloneData(baseRows);
  }

  const overrideByKey = new Map();
  overrideRows.forEach((overrideRow) => {
    const key = buildOverrideLookupKey(overrideRow);
    if (key) {
      overrideByKey.set(key, overrideRow);
    }
  });

  return baseRows.map((baseRow) => {
    const match = overrideByKey.get(buildOverrideLookupKey(baseRow));
    if (!match) {
      return cloneData(baseRow);
    }

    return mergeCourseOverrideRow(baseRow, match);
  });
}

function getCourseQualityReasons(course = {}) {
  const reasons = [];
  const qualityFlags = course?.metadata?.qualityFlags || {};
  const confidenceTier = String(course?.metadata?.confidenceTier || "low");
  const readinessTier = String(course?.metadata?.readinessTier || "incomplete");

  if (!qualityFlags.hasAddress) {
    reasons.push("missing-address");
  }

  if (!qualityFlags.hasCoordinates) {
    reasons.push("missing-coordinates");
  }

  if (qualityFlags.usesFallbackTeeData) {
    reasons.push("fallback-tee-data");
  }

  if (qualityFlags.usesFallbackHoleData) {
    reasons.push("fallback-hole-data");
  }

  if (!qualityFlags.hasRealRatingSlope) {
    reasons.push("missing-rating-slope");
  }

  if (confidenceTier !== "high") {
    reasons.push("review-confidence");
  }

  if (readinessTier !== "rich-round-ready") {
    reasons.push("needs-rich-detail");
  }

  return reasons;
}

function getReviewPriority(reasons = []) {
  if (reasons.includes("missing-coordinates") || reasons.includes("review-confidence")) {
    return "high";
  }

  if (
    reasons.includes("fallback-hole-data")
    || reasons.includes("fallback-tee-data")
    || reasons.includes("missing-rating-slope")
  ) {
    return "medium";
  }

  return "low";
}

function createReconciliationQueueEntry(course = {}) {
  const reasons = getCourseQualityReasons(course);
  return {
    id: course.id,
    displayName: course.displayName || course.name || "",
    city: course.city || "",
    state: course.state || "",
    providerId: course.providerId || "",
    readinessTier: course?.metadata?.readinessTier || "incomplete",
    confidenceTier: course?.metadata?.confidenceTier || "low",
    matchConfidence: Number(course?.metadata?.matchConfidence || 0),
    adminReviewStatus: String(course?.metadata?.adminReviewStatus || ""),
    adminOverrideApplied: Boolean(course?.metadata?.adminOverrideApplied),
    reasons,
    priority: getReviewPriority(reasons),
  };
}

export function buildCourseReconciliationReport(catalog = [], overrideRows = [], { generatedAt = new Date().toISOString(), assetVersion = "" } = {}) {
  const normalizedCatalog = Array.isArray(catalog) ? catalog : [];
  const queueEntries = (Array.isArray(catalog) ? catalog : [])
    .map((course) => createReconciliationQueueEntry(course))
    .filter((entry) => entry.reasons.length > 0)
    .sort((left, right) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const leftPriority = priorityOrder[left.priority] ?? 3;
      const rightPriority = priorityOrder[right.priority] ?? 3;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return right.matchConfidence - left.matchConfidence;
    });

  const overrideLookup = new Map(
    (Array.isArray(overrideRows) ? overrideRows : [])
      .map((overrideRow) => [buildOverrideLookupKey(overrideRow), overrideRow])
      .filter(([key]) => Boolean(key))
  );

  const overriddenRecordCount = (Array.isArray(catalog) ? catalog : [])
    .filter((course) => course?.metadata?.adminOverrideApplied)
    .length;
  const unmatchedOverrides = [...overrideLookup.values()]
    .filter((overrideRow) => !(Array.isArray(catalog) ? catalog : []).some((course) => buildOverrideLookupKey(course) === buildOverrideLookupKey(overrideRow)))
    .map((overrideRow) => ({
      courseId: String(overrideRow?.courseId || overrideRow?.canonicalCourseId || overrideRow?.id || "").trim(),
      reviewStatus: getOverrideReviewStatus(overrideRow),
      source: getOverrideSource(overrideRow),
    }));

  const reviewQueueSummary = queueEntries.reduce((summary, entry) => {
    summary.priority[entry.priority] = Number(summary.priority[entry.priority] || 0) + 1;
    entry.reasons.forEach((reason) => {
      summary.reasons[reason] = Number(summary.reasons[reason] || 0) + 1;
    });
    return summary;
  }, {
    priority: {
      high: 0,
      medium: 0,
      low: 0,
    },
    reasons: {},
  });

  const overrideSummary = {
    overrideRows: Array.isArray(overrideRows) ? overrideRows.length : 0,
    overriddenRecords: overriddenRecordCount,
    approvedOverrides: (Array.isArray(overrideRows) ? overrideRows : []).filter((overrideRow) => getOverrideReviewStatus(overrideRow) === "approved").length,
    pendingOverrides: (Array.isArray(overrideRows) ? overrideRows : []).filter((overrideRow) => getOverrideReviewStatus(overrideRow) === "pending").length,
    rejectedOverrides: (Array.isArray(overrideRows) ? overrideRows : []).filter((overrideRow) => getOverrideReviewStatus(overrideRow) === "rejected").length,
    unmatchedOverrides,
  };

  const capabilitySummary = normalizedCatalog.reduce((summary, course) => {
    const teeTimes = course?.metadata?.teeTimes || course?.metadata?.booking || {};
    const onCourseServices = course?.metadata?.onCourseServices || course?.metadata?.serviceCapabilities || {};
    if (teeTimes?.enabled) {
      summary.teeTimes.enabled += 1;
      if (teeTimes.mode === "external-link") {
        summary.teeTimes.externalLink += 1;
      } else if (teeTimes.mode === "request") {
        summary.teeTimes.request += 1;
      }
    }

    if (onCourseServices?.enabled) {
      summary.onCourseServices.enabled += 1;
    }

    return summary;
  }, {
    teeTimes: {
      enabled: 0,
      externalLink: 0,
      request: 0,
    },
    onCourseServices: {
      enabled: 0,
    },
  });

  return {
    generatedAt,
    assetVersion,
    recordCount: Array.isArray(catalog) ? catalog.length : 0,
    overrideSummary,
    capabilitySummary,
    reviewQueueSummary,
    reviewQueue: {
      highPriority: queueEntries.filter((entry) => entry.priority === "high").slice(0, 250),
      mediumPriority: queueEntries.filter((entry) => entry.priority === "medium").slice(0, 250),
      lowPrioritySample: queueEntries.filter((entry) => entry.priority === "low").slice(0, 100),
    },
  };
}
