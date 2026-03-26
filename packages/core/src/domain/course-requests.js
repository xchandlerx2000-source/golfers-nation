import { cloneData } from "../utils/formatters.js";

const VALID_TEE_TIME_REQUEST_STATUSES = new Set([
  "requested",
  "confirmed",
  "rejected",
  "canceled",
]);

function createRequestId(prefix = "request") {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
}

export function createTeeTimeRequest({
  id = "",
  courseId = "",
  courseName = "",
  requesterUserId = "",
  requesterProfileId = "",
  mode = "request",
  provider = "",
  desiredWindowLabel = "Next available",
  notes = "",
  status = "requested",
  createdAt = Date.now(),
  metadata = {},
} = {}) {
  const nextStatus = VALID_TEE_TIME_REQUEST_STATUSES.has(status) ? status : "requested";
  const timestamp = Number(createdAt || Date.now());

  return {
    id: String(id || createRequestId("tee-time")).trim(),
    type: "tee-time",
    courseId: String(courseId || "").trim(),
    courseName: String(courseName || "").trim(),
    requesterUserId: String(requesterUserId || "").trim(),
    requesterProfileId: String(requesterProfileId || "").trim(),
    mode: String(mode || "request").trim() || "request",
    provider: String(provider || "").trim(),
    desiredWindowLabel: String(desiredWindowLabel || "Next available").trim() || "Next available",
    notes: String(notes || "").trim(),
    status: nextStatus,
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: cloneData(metadata || {}),
  };
}

export function transitionTeeTimeRequest(request = {}, status = "requested", metadataPatch = {}) {
  const nextStatus = String(status || "").trim();
  if (!VALID_TEE_TIME_REQUEST_STATUSES.has(nextStatus)) {
    throw new Error(`Unsupported tee-time request status: ${status}`);
  }

  return {
    ...cloneData(request),
    status: nextStatus,
    updatedAt: Date.now(),
    metadata: {
      ...cloneData(request?.metadata || {}),
      ...cloneData(metadataPatch || {}),
    },
  };
}

export function getLatestCourseTeeTimeRequest(requests = [], courseId = "") {
  return (Array.isArray(requests) ? requests : [])
    .filter((request) => request?.type === "tee-time" && request?.courseId === courseId)
    .sort((left, right) => Number(right?.updatedAt || 0) - Number(left?.updatedAt || 0))[0] || null;
}

export function getTeeTimeRequestStatusLabel(status = "requested") {
  switch (String(status || "").trim()) {
    case "confirmed":
      return "Confirmed";
    case "rejected":
      return "Rejected";
    case "canceled":
      return "Canceled";
    default:
      return "Requested";
  }
}
