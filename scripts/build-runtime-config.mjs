import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const shellSourceRoot = path.join(projectRoot, "src", "shell");

function readEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) {
      return String(value).trim();
    }
  }

  return "";
}

const runtimeConfig = {
  supabaseUrl: readEnv("GN_SUPABASE_URL", "SUPABASE_URL") || "https://jsvxckzbymbdilyujjko.supabase.co",
  supabaseAnonKey: readEnv("GN_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"),
  supabaseResetRedirectUrl: readEnv("GN_SUPABASE_RESET_REDIRECT_URL"),
  siteUrl: readEnv("GN_SITE_URL", "URL", "DEPLOY_PRIME_URL"),
};

const output = `window.__GN_RUNTIME_CONFIG__ = Object.assign(
  {
    supabaseUrl: ${JSON.stringify(runtimeConfig.supabaseUrl)},
    supabaseAnonKey: ${JSON.stringify(runtimeConfig.supabaseAnonKey)},
    supabaseResetRedirectUrl: ${JSON.stringify(runtimeConfig.supabaseResetRedirectUrl)},
    siteUrl: ${JSON.stringify(runtimeConfig.siteUrl)},
  },
  window.__GN_RUNTIME_CONFIG__ || {}
);
`;

await mkdir(shellSourceRoot, { recursive: true });
await writeFile(path.join(shellSourceRoot, "runtime-config.js"), output, "utf8");
await writeFile(path.join(projectRoot, "runtime-config.js"), output, "utf8");
