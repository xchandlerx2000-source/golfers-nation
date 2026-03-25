import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const files = [
  "src/utils/formatters.js",
  "src/config.js",
  "src/domain/factories.js",
  "src/domain/scoring.js",
  "src/domain/round-sync.js",
  "src/domain/course-models.js",
  "src/services/course-normalization.js",
  "src/services/course-deduplication.js",
  "src/state/persistence.js",
  "src/state/store.js",
  "src/state/course-state.js",
  "src/state/session-state.js",
  "src/state/round-state.js",
  "src/services/storage-service.js",
  "src/services/crash-log-service.js",
  "src/integrations/spotify-service.js",
  "src/services/course-library.js",
  "src/services/course-import/us-course-import-service.js",
  "src/services/course-providers/local-course-provider.js",
  "src/services/course-providers/imported-us-course-provider.js",
  "src/services/course-providers/mock-course-provider.js",
  "src/services/course-providers/licensed-course-provider.js",
  "src/services/course-providers/golfnow-course-provider.js",
  "src/services/course-providers/places-course-provider.js",
  "src/services/course-service.js",
  "src/services/account-service.js",
  "src/services/runtime-config.js",
  "src/services/supabase-rest.js",
  "src/services/player-service.js",
  "src/services/nearby-detection-service.js",
  "src/services/mock-api.js",
  "src/services/sync-service.js",
  "src/services/round-flow-service.js",
  "src/services/backend-models.js",
  "src/services/auth-gateway.js",
  "src/services/data-gateway.js",
  "src/services/realtime-gateway.js",
  "src/services/realtime-session-service.js",
  "src/state/default-state.js",
  "src/ui/spotify-controls.js",
  "src/ui/templates.js",
  "src/ui/render.js",
  "src/ui/view-controller.js",
  "src/bootstrap/startup-recovery.js",
  "src/bootstrap/app-bootstrap.js",
  "src/services/product-platform.js",
  "src/main.js",
];

function stripModuleSyntax(content) {
  return content
    .replace(/^\s*import[\s\S]*?from\s+["'][^"']+["'];?\r?\n/gm, "")
    .replace(/^\s*export\s+/gm, "");
}

async function buildBundle() {
  const parts = [
    "(function () {",
    '"use strict";',
    "",
    "// AUTO-GENERATED FILE. DO NOT EDIT app.js DIRECTLY.",
    "// Source of truth: src/**/*.js and the build scripts in scripts/.",
    "// Run `npm run build:web` or `npm run build` after source changes.",
    "",
  ];

  for (const relativeFile of files) {
    const absoluteFile = path.join(rootDir, relativeFile);
    const content = await readFile(absoluteFile, "utf8");
    parts.push(`// ---- ${relativeFile} ----`);
    parts.push(stripModuleSyntax(content).trim());
    parts.push("");
  }

  parts.push("startApp();");
  parts.push("})();");

  await writeFile(path.join(rootDir, "app.js"), `${parts.join("\r\n")}\r\n`, "utf8");
}

await buildBundle();
