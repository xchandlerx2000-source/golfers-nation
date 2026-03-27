import { describe, expect, it, vi } from "vitest";

import { cloneData } from "../src/utils/formatters.js";

describe("formatters", () => {
  it("returns primitive values directly when structuredClone is unavailable", () => {
    const originalStructuredClone = globalThis.structuredClone;
    vi.stubGlobal("structuredClone", undefined);

    try {
      expect(cloneData(undefined)).toBeUndefined();
      expect(cloneData(null)).toBeNull();
      expect(cloneData(42)).toBe(42);
      expect(cloneData("par")).toBe("par");
      expect(cloneData(false)).toBe(false);
    } finally {
      vi.stubGlobal("structuredClone", originalStructuredClone);
    }
  });

  it("throws a controlled error for unsupported fallback values", () => {
    const originalStructuredClone = globalThis.structuredClone;
    vi.stubGlobal("structuredClone", undefined);

    try {
      expect(() => cloneData(() => {})).toThrow(/cannot clone function values/i);
      expect(() => cloneData({ label: "x", score: 3n })).toThrow(/cannot clone nested bigint values/i);
    } finally {
      vi.stubGlobal("structuredClone", originalStructuredClone);
    }
  });
});
