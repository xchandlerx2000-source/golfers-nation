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
  "src/state/persistence.js",
  "src/state/store.js",
  "src/state/session-state.js",
  "src/state/round-state.js",
  "src/services/storage-service.js",
  "src/integrations/spotify-service.js",
  "src/services/account-service.js",
  "src/services/course-library.js",
  "src/services/runtime-config.js",
  "src/services/supabase-rest.js",
  "src/services/player-service.js",
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
    "// Generated browser-safe bundle for direct file opening.",
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
