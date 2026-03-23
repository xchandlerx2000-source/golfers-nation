import { promises as fs } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "dist");

const filesToCopy = [
  "_redirects",
  "index.html",
  "styles.css",
  "app.js",
  "runtime-config.js",
  "manifest.json",
  "service-worker.js",
];

async function ensureCleanDirectory(directoryPath) {
  await fs.rm(directoryPath, { recursive: true, force: true });
  await fs.mkdir(directoryPath, { recursive: true });
}

async function copyFile(relativePath) {
  await fs.copyFile(
    path.join(projectRoot, relativePath),
    path.join(distRoot, relativePath)
  );
}

async function copyDirectory(relativeDirectory) {
  const sourceDirectory = path.join(projectRoot, relativeDirectory);
  const destinationDirectory = path.join(distRoot, relativeDirectory);
  const entries = await fs.readdir(sourceDirectory, { withFileTypes: true });

  await fs.mkdir(destinationDirectory, { recursive: true });

  for (const entry of entries) {
    const entryRelativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(entryRelativePath);
      continue;
    }

    await fs.copyFile(
      path.join(projectRoot, entryRelativePath),
      path.join(distRoot, entryRelativePath)
    );
  }
}

execFileSync(process.execPath, [path.join("scripts", "build-browser-bundle.mjs")], {
  cwd: projectRoot,
  stdio: "inherit",
});

await ensureCleanDirectory(distRoot);

for (const relativePath of filesToCopy) {
  await copyFile(relativePath);
}

await copyDirectory("icons");

console.log(`Deploy package written to ${path.relative(projectRoot, distRoot)}`);
