import { describe, expect, it, vi } from "vitest";

import {
  describeLiveRoomFailure,
  hostLiveRoundSession,
  joinLiveRoundSession,
  publishLiveRoundUpdate,
} from "../src/services/realtime-session-service.js";

describe("realtime session service", () => {
  it("describes missing live room tables clearly", () => {
    expect(describeLiveRoomFailure({
      error: {
        code: "missing_live_round_sessions_table",
      },
    })).toContain("public.live_round_sessions");
  });

  it("wraps host failures into a safe fallback result", async () => {
    const result = await hostLiveRoundSession({
      async hostRoundSession() {
        throw new Error("boom");
      },
    }, "round-1");

    expect(result.error.message).toContain("unavailable");
  });

  it("wraps join failures into a safe fallback result", async () => {
    const result = await joinLiveRoundSession({
      async joinRoundSession() {
        throw new Error("boom");
      },
    }, "ABC123", "join warning");

    expect(result.error.message).toContain("unavailable");
  });

  it("keeps publish failures non-blocking", async () => {
    const session = {
      publishRoundUpdate: vi.fn(async () => {
        throw new Error("publish failed");
      }),
    };

    await expect(publishLiveRoundUpdate(session, "round-1")).resolves.toBeUndefined();
    expect(session.publishRoundUpdate).toHaveBeenCalledWith("round-1");
  });
});
