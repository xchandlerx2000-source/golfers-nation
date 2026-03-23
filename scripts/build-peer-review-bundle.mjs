import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.join(projectRoot, "docs", "peer-review-bundle.md");

const fixedFiles = [
  "package.json",
  "README.md",
  "index.html",
  "manifest.json",
  "service-worker.js",
  "styles.css",
  "runtime-config.js",
  "netlify.toml",
  "_redirects",
  "scripts/build-browser-bundle.mjs",
  "scripts/build-netlify-package.mjs",
  "scripts/build-peer-review-bundle.mjs",
  "scripts/build-runtime-config.mjs",
];

async function collectFiles(directory, extensions = [".js"]) {
  const absoluteDirectory = path.join(projectRoot, directory);
  const entries = await fs.readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(directory.replace(/\\/g, "/"), entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(relativePath, extensions));
      continue;
    }

    if (extensions.includes(path.extname(entry.name))) {
      files.push(relativePath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function getLanguage(relativePath) {
  const extension = path.extname(relativePath).toLowerCase();
  if (extension === ".js" || extension === ".mjs") {
    return "js";
  }
  if (extension === ".json") {
    return "json";
  }
  if (extension === ".html") {
    return "html";
  }
  if (extension === ".css") {
    return "css";
  }
  if (extension === ".md") {
    return "md";
  }
  return "";
}

async function readSection(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  const language = getLanguage(relativePath);
  const contents = await fs.readFile(absolutePath, "utf8");
  return `## \`${relativePath}\`\n\n\`\`\`${language}\n${contents}\n\`\`\`\n`;
}

const sourceFiles = await collectFiles("src", [".js"]);
const testFiles = await collectFiles("tests", [".js"]);
const includedFiles = [...new Set([...fixedFiles, ...sourceFiles, ...testFiles])];

const sections = await Promise.all(includedFiles.map((relativePath) => readSection(relativePath)));

const markdown = `# Golfers Nation Peer Review Bundle

This file consolidates the current source-of-truth code, runtime config, deploy scripts, and tests for peer review.

Use this bundle with \`docs/business-partner-overview.md\` and \`docs/peer-review-guide.md\` when sharing the project with leadership or other developers.

## Included files

${includedFiles.map((relativePath) => `- \`${relativePath}\``).join("\n")}

---

${sections.join("\n")}
`;

await fs.writeFile(outputPath, markdown, "utf8");

console.log(`Peer review bundle written to ${path.relative(projectRoot, outputPath)}`);
