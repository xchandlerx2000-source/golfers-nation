import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const shellSourceRoot = path.join(projectRoot, "src", "shell");

const shellFiles = [
  "index.html",
  "styles.css",
  "manifest.json",
  "service-worker.js",
  "runtime-config.js",
];

async function buildShellAssets() {
  await mkdir(shellSourceRoot, { recursive: true });

  for (const fileName of shellFiles) {
    const sourcePath = path.join(shellSourceRoot, fileName);
    const destinationPath = path.join(projectRoot, fileName);
    const contents = await readFile(sourcePath, "utf8");
    await writeFile(destinationPath, contents, "utf8");
  }
}

await buildShellAssets();

