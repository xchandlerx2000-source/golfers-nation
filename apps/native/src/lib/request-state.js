function toText(value, fallback = "") {
  const text = String(value ?? fallback).trim();
  return text || fallback;
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normalizeTeeTimeRequest(request = {}) {
  return {
    ...request,
    id: toText(request.id),
    type: "tee-time",
    courseId: toText(request.courseId),
    courseName: toText(request.courseName, "Golf course"),
    requesterUserId: toText(request.requesterUserId),
    requesterProfileId: toText(request.requesterProfileId),
    mode: toText(request.mode, "request"),
    provider: toText(request.provider),
    desiredWindowLabel: toText(request.desiredWindowLabel, "Next available"),
    notes: toText(request.notes),
    status: toText(request.status, "requested"),
    createdAt: toNumber(request.createdAt, Date.now()),
    updatedAt: toNumber(request.updatedAt || request.createdAt, Date.now()),
    metadata: request?.metadata && typeof request.metadata === "object" ? request.metadata : {},
  };
}

export function normalizeCourseServiceRequest(request = {}) {
  return {
    ...request,
    id: toText(request.id),
    type: "course-service",
    courseId: toText(request.courseId),
    courseName: toText(request.courseName, "Golf course"),
    roundId: toText(request.roundId),
    requesterUserId: toText(request.requesterUserId),
    requesterProfileId: toText(request.requesterProfileId),
    requestType: toText(request.requestType, "guest-services"),
    notes: toText(request.notes),
    status: toText(request.status, "requested"),
    createdAt: toNumber(request.createdAt, Date.now()),
    updatedAt: toNumber(request.updatedAt || request.createdAt, Date.now()),
    metadata: request?.metadata && typeof request.metadata === "object" ? request.metadata : {},
  };
}

export function normalizeTeeTimeRequests(requests = []) {
  return (Array.isArray(requests) ? requests : [])
    .map(normalizeTeeTimeRequest)
    .filter((request) => request.id && request.courseId);
}

export function normalizeCourseServiceRequests(requests = []) {
  return (Array.isArray(requests) ? requests : [])
    .map(normalizeCourseServiceRequest)
    .filter((request) => request.id && request.courseId);
}
