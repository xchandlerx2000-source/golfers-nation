import { COURSE_TEMPLATE } from "../config.js";
import { cloneData } from "../utils/formatters.js";

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
  const hasAddress = Boolean(rawCourse?.address || rawCourse?.addressLine1 || postalCode);
  const hasCoordinates = rawCourse?.latitude !== null
    && rawCourse?.latitude !== undefined
    && rawCourse?.longitude !== null
    && rawCourse?.longitude !== undefined;
  const hasTeeData = teeBoxes.length > 0;
  const hasRatings = teeBoxes.some((teeBox) => teeBox?.rating !== null || teeBox?.slope !== null);
  const completenessScore = (
    (hasAddress ? 1 : 0)
    + (hasCoordinates ? 1 : 0)
    + (hasTeeData ? 1 : 0)
    + (hasRatings ? 1 : 0)
  ) / 4;
  const metadata = {
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
    gpsReady: hasCoordinates,
    routingReady: Boolean(rawCourse?.metadata?.routingReady),
    holeDetailReady: holes.length > 0,
    completenessScore,
    qualityFlags: {
      hasAddress,
      hasCoordinates,
      hasTeeData,
      hasRatings,
      hasHoleDetail: holes.length > 0,
    },
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
    return cloneData(course.teeBoxes[0]);
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
  return cloneData(selected);
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
    },
  };
}
