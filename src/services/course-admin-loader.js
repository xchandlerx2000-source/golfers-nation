import { getCourseCatalogManifest } from "./course-catalog-loader.js";

const DEFAULT_RECONCILIATION_REPORT_PATH = "data/course/reconciliation-report.json";
const DEFAULT_ADMIN_OVERRIDES_PATH = "data/course/admin-overrides.json";

let reconciliationReportCache = null;
let reconciliationReportPromise = null;
let adminOverridesCache = null;
let adminOverridesPromise = null;

function normalizeAssetPath(relativePath = "") {
  return String(relativePath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/[?#].*$/, "");
}

function buildAssetUrl(relativePath = "") {
  const normalizedPath = normalizeAssetPath(relativePath);
  if (!normalizedPath) {
    return "";
  }

  const assetVersion = String(getCourseCatalogManifest()?.assetVersion || "").trim();
  if (!assetVersion) {
    return normalizedPath;
  }

  return `${normalizedPath}?v=${encodeURIComponent(assetVersion)}`;
}

async function readJsonAsset(relativePath = "") {
  const normalizedPath = normalizeAssetPath(relativePath);
  if (!normalizedPath) {
    throw new Error("Course admin asset path is missing.");
  }

  if (typeof window !== "undefined" && typeof fetch === "function") {
    const assetUrl = new URL(buildAssetUrl(normalizedPath), window.location.href);
    const response = await fetch(assetUrl.href, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error(`Course admin asset request failed (${response.status}) for ${normalizedPath}.`);
    }
    return response.json();
  }

  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const filePath = path.join(process.cwd(), ...normalizedPath.split("/"));
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

export async function loadCourseReconciliationReport(options = {}) {
  const forceRefresh = Boolean(options?.forceRefresh);
  const reportPath = options?.reportPath || DEFAULT_RECONCILIATION_REPORT_PATH;

  if (forceRefresh) {
    reconciliationReportCache = null;
  }

  if (reconciliationReportCache) {
    return reconciliationReportCache;
  }

  if (reconciliationReportPromise) {
    return reconciliationReportPromise;
  }

  reconciliationReportPromise = readJsonAsset(reportPath)
    .then((payload) => {
      reconciliationReportCache = payload || null;
      return reconciliationReportCache;
    })
    .finally(() => {
      reconciliationReportPromise = null;
    });

  return reconciliationReportPromise;
}

export async function loadCourseAdminOverrides(options = {}) {
  const forceRefresh = Boolean(options?.forceRefresh);
  const overridesPath = options?.overridesPath || DEFAULT_ADMIN_OVERRIDES_PATH;

  if (forceRefresh) {
    adminOverridesCache = null;
  }

  if (adminOverridesCache) {
    return adminOverridesCache;
  }

  if (adminOverridesPromise) {
    return adminOverridesPromise;
  }

  adminOverridesPromise = readJsonAsset(overridesPath)
    .then((payload) => {
      adminOverridesCache = payload || null;
      return adminOverridesCache;
    })
    .finally(() => {
      adminOverridesPromise = null;
    });

  return adminOverridesPromise;
}

export function getCachedCourseReconciliationReport() {
  return reconciliationReportCache;
}

export function getCachedCourseAdminOverrides() {
  return adminOverridesCache;
}

export function resetCourseAdminLoaderCache() {
  reconciliationReportCache = null;
  reconciliationReportPromise = null;
  adminOverridesCache = null;
  adminOverridesPromise = null;
}
