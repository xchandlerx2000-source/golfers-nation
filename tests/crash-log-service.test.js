// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";

import {
  clearCrashLogEntries,
  createCrashLogReport,
  getCrashLogSummary,
  readCrashLogEntries,
  recordCrashLog,
} from "../src/services/crash-log-service.js";

describe("crash log service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("records a startup crash and returns it in the local summary", () => {
    recordCrashLog({
      stage: "renderer-init",
      error: new Error("Renderer could not start."),
      context: {
        activeView: "home",
        inviteCode: "ABC123",
      },
    });

    const summary = getCrashLogSummary();

    expect(summary.count).toBe(1);
    expect(summary.latestStage).toBe("renderer-init");
    expect(summary.latestMessage).toBe("Renderer could not start.");
    expect(summary.entries[0].context.inviteCode).toBe("ABC123");
  });

  it("caps stored crash logs and can export a report", () => {
    for (let index = 0; index < 25; index += 1) {
      recordCrashLog({
        stage: `runtime-${index}`,
        error: new Error(`Crash ${index}`),
      });
    }

    const entries = readCrashLogEntries();
    const report = createCrashLogReport();

    expect(entries).toHaveLength(20);
    expect(report).toContain("Golfers Nation Crash Report");
    expect(report).toContain("Crash 1");
    expect(report).toContain("runtime-24");
  });

  it("clears stored crash logs", () => {
    recordCrashLog({
      stage: "window-error",
      error: new Error("Boom"),
    });

    expect(getCrashLogSummary().count).toBe(1);

    clearCrashLogEntries();

    expect(getCrashLogSummary().count).toBe(0);
  });
});
