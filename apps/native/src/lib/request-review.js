import { formatCourseRequestTypeLabel } from "@golfers-nation/core";

export function mergeRequestById(requests = [], nextRequest, limit = 20) {
  return [
    nextRequest,
    ...(Array.isArray(requests) ? requests : []).filter((entry) => entry.id !== nextRequest.id),
  ].slice(0, limit);
}

export function applyRequestPersistenceResult(request, persisted) {
  const nextRequest = persisted?.request || request;
  return {
    ...nextRequest,
    metadata: {
      ...(nextRequest?.metadata || {}),
      syncStatus: persisted?.status || "local-only",
      missingTable: Boolean(persisted?.missingTable),
    },
  };
}

export function createLocalQueueItems({ teeTimeRequests = [], courseServiceRequests = [] } = {}) {
  return [
    ...teeTimeRequests.map((request) => ({
      ...request,
      queueType: "tee-time",
      queueSource: request?.metadata?.syncStatus === "persisted" ? "cloud" : "local",
      queueUpdatedAt: Number(request?.updatedAt || request?.createdAt || 0),
      queueLabel: request.desiredWindowLabel || "Next available",
    })),
    ...courseServiceRequests.map((request) => ({
      ...request,
      queueType: "course-service",
      queueSource: request?.metadata?.syncStatus === "persisted" ? "cloud" : "local",
      queueUpdatedAt: Number(request?.updatedAt || request?.createdAt || 0),
      queueLabel: formatCourseRequestTypeLabel(request.requestType),
    })),
  ].sort((left, right) => Number(right.queueUpdatedAt || 0) - Number(left.queueUpdatedAt || 0));
}

export function mergeReviewQueue(localItems = [], remoteItems = []) {
  const byId = new Map();
  [...remoteItems, ...localItems].forEach((item) => {
    if (!item?.id) {
      return;
    }

    const existing = byId.get(item.id);
    if (!existing || Number(item.queueUpdatedAt || 0) >= Number(existing.queueUpdatedAt || 0)) {
      byId.set(item.id, item);
    }
  });

  return [...byId.values()].sort((left, right) => Number(right.queueUpdatedAt || 0) - Number(left.queueUpdatedAt || 0));
}

export function getCloudQueueItems(queue = []) {
  return (Array.isArray(queue) ? queue : []).filter((entry) => entry.queueSource === "cloud");
}

export function getRequestQueueNotice(persisted, existingNotice = "") {
  if (persisted?.status === "persisted") {
    return "Cloud request queue updated.";
  }

  if (persisted?.missingTable) {
    return "Request tables are not live yet. Saved on this phone.";
  }

  return existingNotice;
}
