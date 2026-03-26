import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function runScript(scriptName) {
  execFileSync(process.execPath, [path.join("scripts", scriptName)], {
    cwd: projectRoot,
    stdio: "inherit",
  });
}

runScript("build-shell-assets.mjs");
runScript("build-course-catalog.mjs");
runScript("build-native-course-seed.mjs");
runScript("build-browser-bundle.mjs");

