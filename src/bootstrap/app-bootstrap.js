const APP_SHELL_CACHE_PREFIX = "golfers-nation-shell-";

export function getInstallEnvironment(hasDeferredPrompt = false) {
  if (typeof window === "undefined") {
    return {
      standaloneMode: false,
      installPromptAvailable: false,
      installState: "browser",
    };
  }

  const standaloneMode = (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches)
    || window.navigator.standalone === true;
  const userAgent = window.navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);

  return {
    standaloneMode,
    installPromptAvailable: hasDeferredPrompt && !standaloneMode,
    installState: standaloneMode
      ? "installed"
      : hasDeferredPrompt
        ? "prompt"
        : isIOS && isSafari
          ? "ios-share"
          : "browser",
  };
}

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  if (window.location.protocol === "file:") {
    return;
  }

  const secureContext = window.location.protocol === "https:"
    || window.location.hostname === "localhost"
    || window.location.hostname === "127.0.0.1";

  if (!secureContext) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js", { scope: "/" }).catch(() => {});
  }, { once: true });
}

export async function clearAppShellCaches() {
  if (typeof caches === "undefined" || typeof caches.keys !== "function") {
    return;
  }

  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(APP_SHELL_CACHE_PREFIX))
      .map((key) => caches.delete(key))
  );
}

export async function refreshAppBuild({
  locationRef = typeof window !== "undefined" ? window.location : null,
  serviceWorkerContainer = typeof navigator !== "undefined" ? navigator.serviceWorker : null,
} = {}) {
  let controllerChangeHandler = null;
  let fallbackTimer = null;

  const triggerReload = () => {
    if (controllerChangeHandler && serviceWorkerContainer?.removeEventListener) {
      try {
        serviceWorkerContainer.removeEventListener("controllerchange", controllerChangeHandler);
      } catch {}
      controllerChangeHandler = null;
    }

    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }

    if (locationRef && typeof locationRef.reload === "function") {
      locationRef.reload();
    }
  };

  if (serviceWorkerContainer?.addEventListener) {
    controllerChangeHandler = () => triggerReload();
    serviceWorkerContainer.addEventListener("controllerchange", controllerChangeHandler, { once: true });
    fallbackTimer = setTimeout(triggerReload, 1200);
  }

  try {
    if (serviceWorkerContainer?.getRegistration) {
      const registration = await serviceWorkerContainer.getRegistration("./")
        .catch(() => serviceWorkerContainer.getRegistration());

      if (registration?.update) {
        await registration.update().catch(() => {});
      }

      if (registration?.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    }

    await clearAppShellCaches();
  } catch (error) {
    console.warn("[Golfers Nation] App refresh could not fully clear cached shell files.", error);
  }

  if (!serviceWorkerContainer?.addEventListener) {
    triggerReload();
  }
}

export function applyAppearanceSelectionToDocument(appearance = {}) {
  if (typeof document === "undefined") {
    return;
  }

  const colorMode = appearance.colorMode || "system";
  const themeId = appearance.themeId || "forest";
  const textScale = appearance.textScale || "standard";
  const contrastMode = appearance.contrastMode === "high" ? "high" : "standard";
  const compactMode = appearance.compactMode === true;
  let resolvedMode = colorMode;

  if (colorMode === "system") {
    resolvedMode = typeof window !== "undefined"
      && typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }

  document.body.dataset.colorMode = colorMode;
  document.body.dataset.resolvedMode = resolvedMode === "light" ? "light" : "dark";
  document.body.dataset.theme = themeId;
  document.body.dataset.textScale = textScale === "large" ? "large" : "standard";
  document.body.dataset.contrast = contrastMode;
  document.body.dataset.density = compactMode ? "compact" : "comfortable";
  document.body.style.colorScheme = resolvedMode === "light" ? "light" : "dark";
}

export function applyAppearanceToDocument(state) {
  applyAppearanceSelectionToDocument(state.currentUser?.appearance || {});
}

export function applyShellModeToDocument(state) {
  if (typeof document === "undefined") {
    return;
  }

  document.body.dataset.appShellMode = state.session?.standaloneMode ? "standalone" : "browser";
}

export function syncAppearancePreviewSummary(form) {
  if (!form) {
    return;
  }

  const selectedTheme = form.querySelector('input[name="themeId"]:checked');
  const activeThemeName = form.querySelector('[data-active-theme-name]');
  const activeThemeDescription = form.querySelector('[data-active-theme-description]');
  const activeThemeCard = form.querySelector('[data-active-theme-card]');

  if (!selectedTheme) {
    return;
  }

  const nextThemeId = String(selectedTheme.value || "forest");

  if (activeThemeName) {
    activeThemeName.textContent = selectedTheme.dataset.themeLabel || nextThemeId;
  }

  if (activeThemeDescription) {
    activeThemeDescription.textContent = selectedTheme.dataset.themeDescription || "";
  }

  if (activeThemeCard) {
    activeThemeCard.dataset.themePreview = nextThemeId;
  }
}

export function previewAppearanceFromForm(form) {
  if (!form) {
    return;
  }

  const formData = new FormData(form);
  applyAppearanceSelectionToDocument({
    colorMode: String(formData.get("colorMode") || "system"),
    themeId: String(formData.get("themeId") || "forest"),
    textScale: String(formData.get("textScale") || "standard"),
    compactMode: formData.get("compactMode") === "on",
    contrastMode: formData.get("contrastMode") === "high" ? "high" : "standard",
  });
  syncAppearancePreviewSummary(form);
}

export function createNoopRealtimeSession() {
  return {
    connect() {},
    disconnect() {},
    publishRoundUpdate() {
      return Promise.resolve();
    },
    enableNearbySync() {},
    enableBluetoothSync() {
      return Promise.resolve();
    },
    updateTransport() {},
    hostRoundSession() {
      return Promise.resolve({ status: "local-only" });
    },
    joinRoundSession() {
      return Promise.resolve(null);
    },
  };
}
