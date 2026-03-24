import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const sourceRoot = path.join(projectRoot, "src");
const bundlePath = path.join(projectRoot, "app.js");

function listJavaScriptFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const nextPath = path.join(directory, entry);
    const stats = statSync(nextPath);
    if (stats.isDirectory()) {
      return listJavaScriptFiles(nextPath);
    }

    return nextPath.endsWith(".js") ? [nextPath] : [];
  });
}

function getAliasedImportViolations() {
  const files = listJavaScriptFiles(sourceRoot);

  return files.flatMap((filePath) => {
    const content = readFileSync(filePath, "utf8");
    const matches = [...content.matchAll(/^import\s*{[^}]*\bas\b[^}]*}\s*from\s*["'][^"']+["'];?/gm)];
    return matches.map((match) => ({
      filePath,
      snippet: match[0],
    }));
  });
}

function getDuplicateTopLevelFunctions() {
  const content = readFileSync(bundlePath, "utf8");
  const names = [...content.matchAll(/^function\s+([A-Za-z0-9_]+)\s*\(/gm)].map((match) => match[1]);
  const counts = new Map();

  names.forEach((name) => {
    counts.set(name, (counts.get(name) || 0) + 1);
  });

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name, count]) => ({ name, count }));
}

describe("bundle hygiene", () => {
  it("keeps source files free of aliased named imports that break the flattened browser bundle", () => {
    const violations = getAliasedImportViolations();

    expect(violations).toEqual([]);
  });

  it("keeps round setup and course boot helpers unique in the generated browser bundle", () => {
    const riskyDuplicates = getDuplicateTopLevelFunctions().filter(({ name }) =>
      /(RoundSetup|CourseQuickPicks|RoundSetupCourses|CourseDefault|CourseRoundSetup)/.test(name)
    );

    expect(riskyDuplicates).toEqual([]);
  });

  it("keeps the generated browser bundle syntactically valid", () => {
    expect(() => {
      execFileSync(process.execPath, ["--check", bundlePath], {
        stdio: "pipe",
      });
    }).not.toThrow();
  });
});
