import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

describe("static app shell", () => {
  it("keeps generated root shell files in sync with src/shell", () => {
    const shellFiles = [
      "index.html",
      "styles.css",
      "manifest.json",
      "service-worker.js",
      "runtime-config.js",
    ];

    for (const fileName of shellFiles) {
      const sourceContents = readFileSync(path.join(projectRoot, "src", "shell", fileName), "utf8");
      const generatedContents = readFileSync(path.join(projectRoot, fileName), "utf8");

      expect(generatedContents).toBe(sourceContents);
    }
  });

  it("uses root-relative boot assets for hosted deployments", () => {
    const indexHtml = readFileSync(path.join(projectRoot, "index.html"), "utf8");

    expect(indexHtml).toContain('href="/manifest.json"');
    expect(indexHtml).toContain('href="/styles.css"');
    expect(indexHtml).toContain('src="/runtime-config.js"');
    expect(indexHtml).toContain('src="/app.js"');
  });

  it("uses root-relative PWA paths and service worker assets", () => {
    const manifest = JSON.parse(readFileSync(path.join(projectRoot, "manifest.json"), "utf8"));
    const serviceWorker = readFileSync(path.join(projectRoot, "service-worker.js"), "utf8");

    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.icons.every((icon) => icon.src.startsWith("/icons/"))).toBe(true);
    expect(serviceWorker).toContain('const CACHE_NAME = "golfers-nation-shell-v7"');
    expect(serviceWorker).toContain('"/app.js"');
    expect(serviceWorker).toContain('"/runtime-config.js"');
  });

  it("marks app.js as a generated artifact", () => {
    const appBundle = readFileSync(path.join(projectRoot, "app.js"), "utf8");

    expect(appBundle).toContain("// AUTO-GENERATED FILE. DO NOT EDIT app.js DIRECTLY.");
    expect(appBundle).toContain("// Source of truth: src/**/*.js and the build scripts in scripts/.");
  });
});
