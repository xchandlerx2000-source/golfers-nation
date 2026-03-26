const CACHE_NAME = "golfers-nation-shell-v9";
const COURSE_CACHE_NAME = "golfers-nation-course-v1";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/runtime-config.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png"
];

const NETWORK_FIRST_PATHS = new Set([
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/runtime-config.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
]);

const INDEX_PATH = "/index.html";
const COURSE_DATA_PATH_PREFIX = "/data/course/";

function isCacheableResponse(response) {
  return Boolean(response) && response.status === 200 && response.type === "basic";
}

function isCourseAssetPath(pathname = "") {
  return String(pathname || "").startsWith(COURSE_DATA_PATH_PREFIX);
}

async function updateCourseAssetCache(request) {
  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    const copy = response.clone();
    caches.open(COURSE_CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
  }
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => {
            if (key === CACHE_NAME || key === COURSE_CACHE_NAME) {
              return false;
            }

            return key.startsWith("golfers-nation-shell-") || key.startsWith("golfers-nation-course-");
          })
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(INDEX_PATH, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(INDEX_PATH))
    );
    return;
  }

  if (!isSameOrigin) {
    return;
  }

  if (isCourseAssetPath(requestUrl.pathname)) {
    event.respondWith(
      caches.open(COURSE_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          event.waitUntil(updateCourseAssetCache(event.request).catch(() => {}));
          return cached;
        }

        try {
          return await updateCourseAssetCache(event.request);
        } catch {
          return Response.error();
        }
      })
    );
    return;
  }

  if (NETWORK_FIRST_PATHS.has(requestUrl.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (isCacheableResponse(response)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match(INDEX_PATH)))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(event.request)
          .then((response) => {
            if (!isCacheableResponse(response)) {
              return response;
            }

            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
            return response;
          })
          .catch(() => caches.match(INDEX_PATH));
      })
  );
});
