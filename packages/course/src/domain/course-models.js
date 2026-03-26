import { COURSE_TEMPLATE, cloneData } from "@golfers-nation/core";
import { getCourseCapabilities } from "../lib/course-capabilities.js";

function slugifyCourseValue(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCourseHoleNumber(rawHole, fallbackNumber) {
  return Number(rawHole?.number || fallbackNumber || 0);
}

function normalizeCourseHolePar(rawHole) {
  const value = Number(rawHole?.par || 0);
  return Number.isFinite(value) && value > 0 ? value : 4;
}

function normalizeCourseHoleYardage(rawHole) {
  const value = Number(rawHole?.yards || 0);
  return Number.isFinite(value) && value >= 0 ? value : 0;
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

function isPositiveNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0;
}

function getRawCourseTeeRows(rawCourse = {}) {
  if (Array.isArray(rawCourse?.tees)) {
    return rawCourse.tees;
  }

  if (Array.isArray(rawCourse?.teeBoxes)) {
    return rawCourse.teeBoxes;
  }

  return [];
}

function getRawCourseHoleRows(rawCourse = {}) {
  if (Array.isArray(rawCourse?.holes) && rawCourse.holes.length) {
    return rawCourse.holes;
  }

  return getRawCourseTeeRows(rawCourse).flatMap((teeBox) => {
    if (Array.isArray(teeBox?.holes)) {
      return teeBox.holes;
    }

    if (Array.isArray(teeBox?.perHole)) {
      return teeBox.perHole;
    }

    return [];
  });
}

function clampCourseConfidence(value) {
  return Math.min(0.99, Math.max(0, Number(value || 0)));
}

function getCourseConfidenceTier(score = 0) {
  if (score >= 0.9) {
    return "high";
  }

  if (score >= 0.75) {
    return "medium";
  }

  return "low";
}

function getCourseSourceConfidence(rawCourse = {}, providerId = "us-course-database") {
  const sourceHistory = [
    ...(rawCourse?.metadata?.sourceHistory || []),
    rawCourse?.metadata?.source || "",
    rawCourse?.source || "",
    rawCourse?.metadata?.sourceType || "",
    rawCourse?.sourceType || "",
    providerId,
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");

  if (sourceHistory.includes("licensed") || sourceHistory.includes("partner") || sourceHistory.includes("golfapi") || sourceHistory.includes("golfnow")) {
    return 0.95;
  }

  if (sourceHistory.includes("seeded")) {
    return 0.88;
  }

  if (sourceHistory.includes("public")) {
    return 0.78;
  }

  if (sourceHistory.includes("manual")) {
    return 0.45;
  }

  if (sourceHistory.includes("import")) {
    return 0.82;
  }

  return 0.8;
}

function getCourseReadinessTier({
  discoveryReady = false,
  basicRoundReady = false,
  richRoundReady = false,
} = {}) {
  if (richRoundReady) {
    return "rich-round-ready";
  }

  if (basicRoundReady) {
    return "basic-round-ready";
  }

  if (discoveryReady) {
    return "discovery-ready";
  }

  return "incomplete";
}

export function deriveAdvancedGolferToolAvailability(rawCourse = {}, catalogMetadata = {}) {
  const metadata = rawCourse?.metadata || {};
  const hasHoleOverlays = Boolean(Array.isArray(rawCourse?.holeOverlays) && rawCourse.holeOverlays.length);
  const hasGreenComplexes = Boolean(Array.isArray(rawCourse?.greenComplexes) && rawCourse.greenComplexes.length);
  const gpsReady = Boolean(catalogMetadata.gpsReady);
  const holeDetailReady = Boolean(catalogMetadata.qualityFlags?.hasRealHoleData || catalogMetadata.holeDetailReady);
  const routingReady = Boolean(catalogMetadata.routingReady || metadata.routingReady);

  return {
    courseViewReady: Boolean(metadata.courseViewReady || hasHoleOverlays || holeDetailReady),
    greenViewReady: Boolean(metadata.greenViewReady || hasGreenComplexes),
    gpsDistanceReady: gpsReady,
    clubTrackingReady: Boolean(metadata.clubTrackingReady),
    holeGuidanceReady: Boolean(metadata.holeGuidanceReady || (gpsReady && (routingReady || holeDetailReady))),
  };
}

export function deriveCourseCatalogMetadata(rawCourse = {}, providerId = "us-course-database") {
  const rawTeeRows = getRawCourseTeeRows(rawCourse);
  const rawHoleRows = getRawCourseHoleRows(rawCourse);
  const existingQualityFlags = cloneData(rawCourse?.metadata?.qualityFlags || {});
  const hasAddress = existingQualityFlags.hasAddress ?? Boolean(rawCourse?.address || rawCourse?.addressLine1 || rawCourse?.postalCode || rawCourse?.zip);
  const hasCoordinates = existingQualityFlags.hasCoordinates ?? (
    rawCourse?.latitude !== null
    && rawCourse?.latitude !== undefined
    && rawCourse?.longitude !== null
    && rawCourse?.longitude !== undefined
  );
  const hasHoleCount = existingQualityFlags.hasHoleCount ?? Boolean(
    isPositiveNumber(rawCourse?.holesCount)
    || isPositiveNumber(rawCourse?.holeCount)
  );
  const hasTeeData = existingQualityFlags.hasTeeData ?? Boolean(rawTeeRows.length);
  const hasHoleDetail = existingQualityFlags.hasHoleDetail ?? Boolean(rawHoleRows.length || rawCourse?.holes?.length);
  const hasRatings = existingQualityFlags.hasRatings ?? rawTeeRows.some((teeBox) => hasMeaningfulValue(teeBox?.rating) || hasMeaningfulValue(teeBox?.slope));
  const hasRealTeeData = existingQualityFlags.hasRealTeeData ?? Boolean(rawTeeRows.length);
  const hasRealHoleData = existingQualityFlags.hasRealHoleData ?? Boolean(rawHoleRows.length);
  const hasRealRatingSlope = existingQualityFlags.hasRealRatingSlope ?? rawTeeRows.some((teeBox) => hasMeaningfulValue(teeBox?.rating) || hasMeaningfulValue(teeBox?.slope));
  const hasArchitect = Boolean(rawCourse?.architect || rawCourse?.metadata?.architect);
  const hasYearBuilt = Boolean(rawCourse?.opened || rawCourse?.metadata?.opened);
  const hasCourseType = Boolean(rawCourse?.courseType || rawCourse?.metadata?.courseType);
  const hasOperationsMeta = Boolean(
    rawCourse?.metadata?.clubhousePhone
    || rawCourse?.metadata?.email
    || rawCourse?.metadata?.website
    || rawCourse?.metadata?.season
    || rawCourse?.metadata?.publicPrivate
    || rawCourse?.metadata?.annualRounds
  );
  const discoveryReady = Boolean(
    (rawCourse?.displayName || rawCourse?.courseName || rawCourse?.clubName || rawCourse?.name)
    && (hasCoordinates || (rawCourse?.city && rawCourse?.state))
  );
  const basicRoundReady = Boolean(discoveryReady && hasHoleCount);
  const richRoundReady = Boolean(discoveryReady && hasRealTeeData && hasRealHoleData && hasRealRatingSlope);
  const sourceHistory = [
    ...(rawCourse?.metadata?.sourceHistory || []),
    rawCourse?.metadata?.source || "",
    rawCourse?.source || "",
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value, index, values) => values.findIndex((candidate) => candidate.toLowerCase() === value.toLowerCase()) === index);
  const weightedScore = (
    (hasAddress ? 1 : 0)
    + (hasCoordinates ? 2 : 0)
    + (hasHoleCount ? 1 : 0)
    + (hasRealTeeData ? 2 : 0)
    + (hasRealHoleData ? 2 : 0)
    + (hasRealRatingSlope ? 1.5 : 0)
    + (hasArchitect ? 0.5 : 0)
    + (hasYearBuilt ? 0.5 : 0)
    + (hasCourseType ? 0.5 : 0)
    + (hasOperationsMeta ? 0.5 : 0)
  ) / 10.5;
  const enrichmentConfidence = Number(rawCourse?.metadata?.enrichmentMatchConfidence || 0);
  let matchConfidence = getCourseSourceConfidence(rawCourse, providerId);

  if (rawCourse?.metadata?.enrichmentApplied && enrichmentConfidence > 0) {
    matchConfidence = (matchConfidence + enrichmentConfidence) / 2;
  }

  matchConfidence += Math.min(Math.max(sourceHistory.length - 1, 0) * 0.02, 0.06);
  matchConfidence += hasCoordinates ? 0.02 : 0;
  matchConfidence += hasAddress ? 0.02 : 0;
  matchConfidence += hasRealHoleData ? 0.03 : 0;
  matchConfidence = clampCourseConfidence(matchConfidence);

  return {
    gpsReady: hasCoordinates,
    routingReady: Boolean(rawCourse?.metadata?.routingReady),
    holeDetailReady: hasHoleDetail,
    completenessScore: clampCourseConfidence(weightedScore),
    discoveryReady,
    basicRoundReady,
    richRoundReady,
    readinessTier: getCourseReadinessTier({
      discoveryReady,
      basicRoundReady,
      richRoundReady,
    }),
    matchConfidence,
    confidenceTier: getCourseConfidenceTier(matchConfidence),
    sourceHistory,
    qualityFlags: {
      hasAddress,
      hasCoordinates,
      hasHoleCount,
      hasTeeData,
      hasRatings,
      hasHoleDetail,
      hasRealTeeData,
      hasRealHoleData,
      hasRealRatingSlope,
      usesFallbackTeeData: !hasRealTeeData,
      usesFallbackHoleData: !hasRealHoleData,
    },
  };
}

export function normalizeCourseHoleRecord(rawHole = {}, fallbackNumber = 1) {
  return {
    number: normalizeCourseHoleNumber(rawHole, fallbackNumber),
    par: normalizeCourseHolePar(rawHole),
    yards: normalizeCourseHoleYardage(rawHole),
    handicapIndex: rawHole?.handicapIndex ?? null,
    notes: rawHole?.notes || "",
    gps: cloneData(rawHole?.gps || null),
  };
}

export function normalizeCourseTeeBoxRecord(rawTeeBox = {}, fallbackIndex = 0) {
  const holes = Array.isArray(rawTeeBox?.holes) && rawTeeBox.holes.length
    ? rawTeeBox.holes.map((hole, index) => normalizeCourseHoleRecord(hole, index + 1))
    : COURSE_TEMPLATE.map((hole, index) => normalizeCourseHoleRecord(hole, index + 1));
  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
  const totalYardage = holes.reduce((sum, hole) => sum + hole.yards, 0);

  return {
    id: rawTeeBox?.id || `tee-${fallbackIndex + 1}`,
    name: rawTeeBox?.name || `Tee ${fallbackIndex + 1}`,
    color: rawTeeBox?.color || "",
    gender: rawTeeBox?.gender || "",
    totalPar,
    totalYardage,
    slope: rawTeeBox?.slope ?? null,
    rating: rawTeeBox?.rating ?? null,
    holes,
  };
}

export function normalizeCourseRecord(rawCourse = {}, providerId = "us-course-database") {
  const teeBoxes = Array.isArray(rawCourse?.teeBoxes)
    ? rawCourse.teeBoxes.map((teeBox, index) => normalizeCourseTeeBoxRecord(teeBox, index))
    : [];
  const referenceTee = teeBoxes[0] || normalizeCourseTeeBoxRecord({}, 0);
  const holes = referenceTee.holes.map((hole, index) => normalizeCourseHoleRecord(hole, index + 1));
  const clubName = rawCourse?.clubName || rawCourse?.name || "";
  const courseName = rawCourse?.courseName || rawCourse?.name || clubName;
  const displayName = rawCourse?.displayName || (clubName && courseName && clubName !== courseName ? `${clubName} - ${courseName}` : courseName || clubName);
  const aliases = cloneData(rawCourse?.aliases || []);
  const keywords = cloneData(rawCourse?.keywords || []);
  const slug = rawCourse?.slug || slugifyCourseValue(rawCourse?.id || `${displayName}-${rawCourse?.city || ""}-${rawCourse?.state || ""}`);
  const postalCode = rawCourse?.postalCode || rawCourse?.zip || "";
  const catalogMetadata = deriveCourseCatalogMetadata(rawCourse, providerId);
  const advancedTools = deriveAdvancedGolferToolAvailability(rawCourse, catalogMetadata);
  const capabilities = getCourseCapabilities(rawCourse);
  const metadata = {
    ...cloneData(rawCourse?.metadata || {}),
    providerId,
    providerLabel: rawCourse?.providerLabel || "",
    region: rawCourse?.region || "",
    aliases,
    keywords,
    featured: Boolean(rawCourse?.featured),
    featuredNote: rawCourse?.featuredNote || "",
    priority: rawCourse?.priority ?? 100,
    architect: rawCourse?.architect || "",
    opened: rawCourse?.opened ?? null,
    courseType: rawCourse?.courseType || "course",
    seeded: Boolean(rawCourse?.seeded),
    source: rawCourse?.source || providerId,
    sourceType: rawCourse?.sourceType || rawCourse?.metadata?.sourceType || "seeded-us-database",
    ...catalogMetadata,
    advancedTools,
    capabilities,
    teeTimes: cloneData(capabilities.teeTimes),
    booking: cloneData(capabilities.teeTimes),
    onCourseServices: cloneData(capabilities.onCourseServices),
    serviceCapabilities: cloneData(capabilities.onCourseServices),
    externalIds: cloneData(rawCourse?.externalIds || rawCourse?.metadata?.externalIds || {}),
    providerCourseId: rawCourse?.providerCourseId || rawCourse?.metadata?.providerCourseId || rawCourse?.id || "",
    clubhousePhone: rawCourse?.metadata?.clubhousePhone || "",
    notes: rawCourse?.metadata?.notes || "",
  };

  return {
    id: rawCourse?.id || "",
    slug,
    providerId,
    clubName,
    courseName,
    displayName,
    name: courseName || clubName,
    address: rawCourse?.address || rawCourse?.addressLine1 || "",
    city: rawCourse?.city || "",
    state: rawCourse?.state || "",
    stateName: rawCourse?.stateName || rawCourse?.state || "",
    postalCode,
    country: rawCourse?.country || "USA",
    region: rawCourse?.region || "",
    aliases,
    searchKeywords: keywords,
    latitude: rawCourse?.latitude ?? null,
    longitude: rawCourse?.longitude ?? null,
    holesCount: rawCourse?.holesCount || referenceTee.holes.length || holes.length,
    holes,
    teeBoxes,
    metadata,
  };
}

export function getDefaultCourseTeeBoxRecord(course) {
  if (course?.teeBoxes?.[0]) {
    const teeBox = cloneData(course.teeBoxes[0]);
    return Array.isArray(teeBox?.holes) && teeBox.holes.length
      ? teeBox
      : normalizeCourseTeeBoxRecord(teeBox, 0);
  }

  return normalizeCourseTeeBoxRecord({
    id: "default",
    name: "Default",
  }, 0);
}

export function findCourseTeeBoxRecord(course, teeId = "") {
  if (!course?.teeBoxes?.length) {
    return getDefaultCourseTeeBoxRecord(course);
  }

  const selected = course.teeBoxes.find((teeBox) => teeBox.id === teeId) || course.teeBoxes[0];
  const teeBox = cloneData(selected);
  return Array.isArray(teeBox?.holes) && teeBox.holes.length
    ? teeBox
    : normalizeCourseTeeBoxRecord(teeBox, 0);
}

function getTemplateHoleCount(requestedCount, availableCount) {
  const safeRequested = Number(requestedCount || availableCount || 18);
  if (!Number.isFinite(safeRequested) || safeRequested <= 0) {
    return availableCount;
  }

  return Math.min(availableCount, safeRequested);
}

export function createCourseRoundTemplateRecord({
  course,
  teeBox,
  holeCount = 18,
} = {}) {
  if (!course || !teeBox) {
    return null;
  }

  const selectedHoleCount = getTemplateHoleCount(holeCount, teeBox.holes.length);
  const holes = teeBox.holes
    .slice(0, selectedHoleCount)
    .map((hole, index) => normalizeCourseHoleRecord(hole, index + 1));
  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
  const totalYardage = holes.reduce((sum, hole) => sum + hole.yards, 0);
  const capabilities = getCourseCapabilities(course);

  return {
    courseId: course.id,
    courseSlug: course.slug || "",
    providerId: course.providerId || course.metadata?.providerId || "us-course-database",
    courseName: course.courseName || course.name,
    clubName: course.clubName || course.courseName || course.name,
    displayName: course.displayName || course.courseName || course.name,
    address: course.address || "",
    city: course.city,
    state: course.state,
    country: course.country || "USA",
    region: course.region || course.metadata?.region || "",
    latitude: course.latitude ?? null,
    longitude: course.longitude ?? null,
    teeBoxId: teeBox.id,
    teeBoxName: teeBox.name,
    selectedHoleCount,
    holesCount: holes.length,
    holes,
    totalPar,
    totalYardage,
    slope: teeBox.slope ?? null,
    rating: teeBox.rating ?? null,
    source: course.metadata?.source || course.providerId || "us-course-database",
    seeded: Boolean(course.metadata?.seeded),
    metadata: {
      ...cloneData(course.metadata || {}),
      teeCount: Array.isArray(course.teeBoxes) ? course.teeBoxes.length : 0,
      roundTemplateReady: true,
      capabilities,
      teeTimes: cloneData(capabilities.teeTimes),
      booking: cloneData(capabilities.teeTimes),
      onCourseServices: cloneData(capabilities.onCourseServices),
      serviceCapabilities: cloneData(capabilities.onCourseServices),
      advancedTools: cloneData(course.metadata?.advancedTools || {
        courseViewReady: false,
        greenViewReady: false,
        gpsDistanceReady: false,
        clubTrackingReady: false,
        holeGuidanceReady: false,
      }),
    },
  };
}

export function createManualRoundTemplateRecord({
  courseName = "",
  teeBoxName = "",
  holeCount = 18,
  providerId = "manual-template",
} = {}) {
  const selectedHoleCount = getTemplateHoleCount(holeCount, COURSE_TEMPLATE.length);
  const holes = COURSE_TEMPLATE
    .slice(0, selectedHoleCount)
    .map((hole, index) => normalizeCourseHoleRecord(hole, index + 1));
  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
  const totalYardage = holes.reduce((sum, hole) => sum + hole.yards, 0);
  const capabilities = getCourseCapabilities({});

  return {
    courseId: null,
    courseSlug: "",
    providerId,
    courseName: courseName || "Manual course",
    clubName: courseName || "Manual course",
    displayName: courseName || "Manual course",
    address: "",
    city: "",
    state: "",
    country: "USA",
    region: "",
    latitude: null,
    longitude: null,
    teeBoxId: null,
    teeBoxName: teeBoxName || "Blue",
    selectedHoleCount,
    holesCount: holes.length,
    holes,
    totalPar,
    totalYardage,
    slope: null,
    rating: null,
    source: providerId,
    seeded: false,
    metadata: {
      providerId,
      courseType: "template",
      teeCount: 1,
      roundTemplateReady: true,
      gpsReady: false,
      routingReady: false,
      holeDetailReady: true,
      capabilities,
      teeTimes: cloneData(capabilities.teeTimes),
      booking: cloneData(capabilities.teeTimes),
      onCourseServices: cloneData(capabilities.onCourseServices),
      serviceCapabilities: cloneData(capabilities.onCourseServices),
      advancedTools: {
        courseViewReady: false,
        greenViewReady: false,
        gpsDistanceReady: false,
        clubTrackingReady: false,
        holeGuidanceReady: false,
      },
    },
  };
}
