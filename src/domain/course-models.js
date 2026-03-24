import { COURSE_TEMPLATE } from "../config.js";
import { cloneData } from "../utils/formatters.js";

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

export function normalizeCourseRecord(rawCourse = {}, providerId = "local-manual") {
  const teeBoxes = Array.isArray(rawCourse?.teeBoxes)
    ? rawCourse.teeBoxes.map((teeBox, index) => normalizeCourseTeeBoxRecord(teeBox, index))
    : [];
  const referenceTee = teeBoxes[0] || normalizeCourseTeeBoxRecord({}, 0);
  const holes = referenceTee.holes.map((hole, index) => normalizeCourseHoleRecord(hole, index + 1));
  const metadata = {
    providerId,
    providerLabel: rawCourse?.providerLabel || "",
    region: rawCourse?.region || "",
    aliases: cloneData(rawCourse?.aliases || []),
    keywords: cloneData(rawCourse?.keywords || []),
    featured: Boolean(rawCourse?.featured),
    featuredNote: rawCourse?.featuredNote || "",
    priority: rawCourse?.priority ?? 100,
    architect: rawCourse?.architect || "",
    opened: rawCourse?.opened ?? null,
    courseType: rawCourse?.courseType || "course",
    seeded: Boolean(rawCourse?.seeded),
    source: rawCourse?.source || providerId,
    gpsReady: rawCourse?.latitude !== null && rawCourse?.latitude !== undefined && rawCourse?.longitude !== null && rawCourse?.longitude !== undefined,
    routingReady: Boolean(rawCourse?.metadata?.routingReady),
    holeDetailReady: holes.length > 0,
    clubhousePhone: rawCourse?.metadata?.clubhousePhone || "",
    notes: rawCourse?.metadata?.notes || "",
  };

  return {
    id: rawCourse?.id || "",
    providerId,
    clubName: rawCourse?.clubName || rawCourse?.name || "",
    name: rawCourse?.name || rawCourse?.clubName || "",
    address: rawCourse?.address || rawCourse?.addressLine1 || "",
    city: rawCourse?.city || "",
    state: rawCourse?.state || "",
    stateName: rawCourse?.stateName || rawCourse?.state || "",
    country: rawCourse?.country || "USA",
    region: rawCourse?.region || "",
    latitude: rawCourse?.latitude ?? null,
    longitude: rawCourse?.longitude ?? null,
    holesCount: rawCourse?.holesCount || referenceTee.holes.length || holes.length,
    holes,
    teeBoxes,
    metadata,
  };
}

export function getDefaultCourseTeeBoxRecord(course) {
  return course?.teeBoxes?.[0] ? cloneData(course.teeBoxes[0]) : null;
}

export function findCourseTeeBoxRecord(course, teeId = "") {
  if (!course?.teeBoxes?.length) {
    return null;
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
    providerId: course.providerId || course.metadata?.providerId || "local-manual",
    courseName: course.name,
    clubName: course.clubName || course.name,
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
    source: course.metadata?.source || course.providerId || "local-manual",
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
    providerId,
    courseName: courseName || "National Pines",
    clubName: courseName || "National Pines",
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
