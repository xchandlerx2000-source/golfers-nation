import { describe, expect, it } from "vitest";

import {
  applyRequestPersistenceResult,
  createLocalQueueItems,
  getCloudQueueItems,
  getRequestQueueNotice,
  mergeRequestById,
  mergeReviewQueue,
} from "../apps/native/src/lib/request-review.js";

describe("native request review helpers", () => {
  it("applies persistence status metadata onto a request", () => {
    const request = {
      id: "request-1",
      metadata: {
        providerLabel: "Clubhouse",
      },
    };

    const persisted = applyRequestPersistenceResult(request, {
      status: "persisted",
      request: {
        ...request,
        status: "requested",
      },
    });

    expect(persisted.metadata.syncStatus).toBe("persisted");
    expect(persisted.metadata.providerLabel).toBe("Clubhouse");
  });

  it("merges requests by id and keeps the newest item first", () => {
    const merged = mergeRequestById(
      [
        { id: "one", createdAt: 1 },
        { id: "two", createdAt: 2 },
      ],
      { id: "one", createdAt: 3 },
      5
    );

    expect(merged).toHaveLength(2);
    expect(merged[0].createdAt).toBe(3);
  });

  it("creates queue items for both tee-time and course-service requests", () => {
    const items = createLocalQueueItems({
      teeTimeRequests: [
        {
          id: "tee-1",
          desiredWindowLabel: "Morning",
          updatedAt: 20,
          metadata: { syncStatus: "persisted" },
        },
      ],
      courseServiceRequests: [
        {
          id: "svc-1",
          requestType: "beverage-cart",
          updatedAt: 10,
          metadata: { syncStatus: "local-only" },
        },
      ],
    });

    expect(items[0].id).toBe("tee-1");
    expect(items[0].queueSource).toBe("cloud");
    expect(items[1].queueLabel).toBe("Beverage Cart");
  });

  it("merges remote and local queue items by id", () => {
    const merged = mergeReviewQueue(
      [{ id: "one", queueUpdatedAt: 10, queueSource: "local" }],
      [{ id: "one", queueUpdatedAt: 20, queueSource: "cloud" }, { id: "two", queueUpdatedAt: 5, queueSource: "cloud" }]
    );

    expect(merged).toHaveLength(2);
    expect(merged[0].queueSource).toBe("cloud");
  });

  it("filters cloud queue items and formats notices", () => {
    const cloudItems = getCloudQueueItems([
      { id: "one", queueSource: "cloud" },
      { id: "two", queueSource: "local" },
    ]);

    expect(cloudItems).toHaveLength(1);
    expect(getRequestQueueNotice({ status: "persisted" }, "")).toBe("Cloud request queue updated.");
    expect(getRequestQueueNotice({ missingTable: true }, "")).toBe("Request tables are not live yet. Saved on this phone.");
  });
});
