import { beforeEach, describe, expect, it } from "vitest";

import {
  clearNativeCrashLogEntries,
  getNativeCrashLogSummary,
  readNativeCrashLogEntries,
  recordNativeCrashLog,
} from "../apps/native/src/services/native-crash-service.js";

describe("native crash service", () => {
  beforeEach(async () => {
    await clearNativeCrashLogEntries();
  });

  it("records a native crash entry with environment metadata", async () => {
    const entry = await recordNativeCrashLog({
      stage: "render",
      source: "boundary",
      error: new Error("Native render failed."),
      context: {
        route: "/(tabs)/score",
      },
    });

    const summary = await getNativeCrashLogSummary();

    expect(entry.id).toBeTruthy();
    expect(summary.count).toBe(1);
    expect(summary.latestStage).toBe("render");
    expect(summary.latestMessage).toBe("Native render failed.");
  });

  it("clears native crash log entries", async () => {
    await recordNativeCrashLog({
      stage: "fatal-js",
      error: new Error("Boom"),
    });

    expect((await readNativeCrashLogEntries()).length).toBe(1);

    await clearNativeCrashLogEntries();

    expect((await readNativeCrashLogEntries()).length).toBe(0);
  });
});
