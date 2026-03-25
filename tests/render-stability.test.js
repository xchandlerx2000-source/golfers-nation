// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { createRenderer } from "../src/ui/render.js";

describe("render stability", () => {
  it("renders safely with partial authenticated state", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const render = createRenderer(document.querySelector("#app"));

    expect(() => {
      render({
        auth: { status: "authenticated", activeUserId: "user-1" },
        session: { activeView: "round", activeRoundId: "round-1" },
        currentUser: { id: "user-1", displayName: "Avery Brooks" },
        rounds: [
          {
            id: "round-1",
            courseName: "Broken Pines",
            mode: "unknown-mode",
          },
        ],
      });
    }).not.toThrow();

    expect(document.body.textContent).toContain("Broken Pines");
  });
});
