import { cloneData } from "@golfers-nation/core";

const DEFAULT_TEE_TIME_CAPABILITY = Object.freeze({
  enabled: false,
  mode: "none",
  provider: "",
  label: "Book Tee Time",
  url: "",
  requestOnly: false,
  notes: "",
});

const DEFAULT_ON_COURSE_SERVICE_CAPABILITY = Object.freeze({
  enabled: false,
  mode: "none",
  requestTypes: [],
  notes: "",
});

function normalizeRequestTypes(value) {
  return Array.isArray(value)
    ? value.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
}

function getRawTeeTimeCapability(course = {}) {
  return {
    ...cloneData(course?.metadata?.booking || {}),
    ...cloneData(course?.metadata?.teeTimes || {}),
    ...cloneData(course?.metadata?.capabilities?.teeTimes || {}),
    ...cloneData(course?.booking || {}),
    ...cloneData(course?.teeTimes || {}),
    ...cloneData(course?.capabilities?.teeTimes || {}),
  };
}

function getRawOnCourseServiceCapability(course = {}) {
  return {
    ...cloneData(course?.metadata?.serviceCapabilities || {}),
    ...cloneData(course?.metadata?.onCourseServices || {}),
    ...cloneData(course?.metadata?.capabilities?.onCourseServices || {}),
    ...cloneData(course?.serviceCapabilities || {}),
    ...cloneData(course?.onCourseServices || {}),
    ...cloneData(course?.capabilities?.onCourseServices || {}),
  };
}

function normalizeTeeTimeCapability(course = {}) {
  const raw = getRawTeeTimeCapability(course);
  const url = String(
    raw?.url
      || raw?.bookingUrl
      || course?.teeTimeBookingUrl
      || course?.bookingUrl
      || course?.metadata?.teeTimeBookingUrl
      || course?.metadata?.bookingUrl
      || ""
  ).trim();
  const provider = String(raw?.provider || raw?.bookingProvider || "").trim();
  const enabledByMode = String(raw?.mode || "").trim() === "external-link" || String(raw?.mode || "").trim() === "request";
  const requestOnly = Boolean(raw?.requestOnly || raw?.acceptsRequests || raw?.acceptsTeeTimeRequests);
  const enabled = Boolean((raw?.enabled ?? raw?.supported) ?? Boolean(url || requestOnly || enabledByMode));
  const mode = enabled
    ? String(raw?.mode || (url ? "external-link" : "request")).trim() || "external-link"
    : "none";

  return {
    ...cloneData(DEFAULT_TEE_TIME_CAPABILITY),
    enabled,
    mode,
    provider,
    label: String(raw?.label || raw?.ctaLabel || DEFAULT_TEE_TIME_CAPABILITY.label).trim() || DEFAULT_TEE_TIME_CAPABILITY.label,
    url,
    requestOnly: Boolean(requestOnly || mode === "request"),
    notes: String(raw?.notes || "").trim(),
  };
}

function normalizeOnCourseServiceCapability(course = {}) {
  const raw = getRawOnCourseServiceCapability(course);
  const requestTypes = normalizeRequestTypes(raw?.requestTypes);
  const enabled = Boolean((raw?.enabled ?? raw?.supported) ?? Boolean(requestTypes.length));

  return {
    ...cloneData(DEFAULT_ON_COURSE_SERVICE_CAPABILITY),
    enabled,
    mode: enabled ? String(raw?.mode || "request").trim() || "request" : "none",
    requestTypes,
    notes: String(raw?.notes || "").trim(),
  };
}

export function getCourseCapabilities(course = {}) {
  return {
    teeTimes: normalizeTeeTimeCapability(course),
    onCourseServices: normalizeOnCourseServiceCapability(course),
  };
}

export function getCourseTeeTimeAccess(course = {}) {
  const teeTimes = getCourseCapabilities(course).teeTimes;
  return teeTimes.enabled ? teeTimes : null;
}

export function courseSupportsTeeTimeBooking(course = {}) {
  const teeTimes = getCourseTeeTimeAccess(course);
  if (!teeTimes?.enabled) {
    return false;
  }

  return teeTimes.mode !== "external-link" || Boolean(teeTimes.url);
}

export function applyCourseCapabilities(course = {}) {
  if (!course || typeof course !== "object") {
    return course;
  }

  const nextCourse = cloneData(course);
  const capabilities = getCourseCapabilities(nextCourse);
  nextCourse.metadata = {
    ...cloneData(nextCourse.metadata || {}),
    capabilities,
    teeTimes: cloneData(capabilities.teeTimes),
    booking: cloneData(capabilities.teeTimes),
    onCourseServices: cloneData(capabilities.onCourseServices),
    serviceCapabilities: cloneData(capabilities.onCourseServices),
  };

  return nextCourse;
}

export function applyCourseCapabilitiesToCatalog(courses = []) {
  return Array.isArray(courses) ? courses.map((course) => applyCourseCapabilities(course)) : [];
}
