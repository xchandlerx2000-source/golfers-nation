import { STORAGE_KEY } from "../config.js";

export function createBootErrorMessage(stage, error) {
  const stageLabel = String(stage || "startup")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const message = error instanceof Error ? error.message : String(error || "Unknown startup error.");
  return {
    stageLabel,
    message: message || "Unknown startup error.",
  };
}

export function renderStartupShell(root, caption = "Preparing live rounds, player profiles, and your mobile app shell.") {
  if (!root) {
    return;
  }

  root.innerHTML = `
    <div class="app-loading-shell" aria-label="Loading Golfers Nation">
      <div class="loading-card">
        <div class="loading-brand">
          <img src="/icons/icon-192.png" alt="" width="56" height="56" />
          <div class="loading-brand-copy">
            <p class="eyebrow">Golfers Nation</p>
            <strong class="loading-title">Opening your golf app</strong>
          </div>
        </div>
        <div class="loading-bar" aria-hidden="true">
          <span></span>
        </div>
        <p class="loading-caption">${caption}</p>
      </div>
    </div>
  `;
}

export function showBootRecoveryScreen(root, {
  stage,
  error,
  crashEntry = null,
  locationRef = typeof window !== "undefined" ? window.location : null,
  storage = null,
  onRetry = null,
} = {}) {
  const detail = createBootErrorMessage(stage, error);
  console.error(`[Golfers Nation] Startup failed during ${stage || "startup"}.`, error);
  let availableStorage = storage;
  if (availableStorage === null) {
    try {
      availableStorage = typeof localStorage === "undefined" ? null : localStorage;
    } catch (storageError) {
      availableStorage = null;
    }
  }

  root.innerHTML = `
    <section class="boot-recovery-shell" aria-live="polite">
      <article class="boot-recovery-card" role="alert">
        <p class="eyebrow">Golfers Nation</p>
        <h1>We couldn't finish opening the app.</h1>
        <p class="body-copy">A startup step failed before the product shell was ready. Try launching again, or reset local app data on this device for testing.</p>
        <div class="boot-recovery-detail">
          <strong>${detail.stageLabel}</strong>
          <span>${detail.message}</span>
        </div>
        ${crashEntry ? `
          <div class="boot-recovery-detail">
            <strong>Crash log saved</strong>
            <span>${crashEntry.id}</span>
          </div>
        ` : ""}
        <div class="boot-recovery-actions">
          <button type="button" class="button button-primary" data-boot-action="retry">Retry</button>
          <button type="button" class="button button-secondary" data-boot-action="reset">Reset local app data</button>
        </div>
      </article>
    </section>
  `;

  root.querySelector('[data-boot-action="retry"]')?.addEventListener("click", () => {
    if (typeof onRetry === "function") {
      renderStartupShell(root, "Trying startup again with a safe local handoff.");
      try {
        onRetry();
        return;
      } catch (retryError) {
        console.error("[Golfers Nation] Retry failed immediately.", retryError);
      }
    }

    if (locationRef && typeof locationRef.reload === "function") {
      locationRef.reload();
    }
  });

  root.querySelector('[data-boot-action="reset"]')?.addEventListener("click", () => {
    try {
      availableStorage?.removeItem(STORAGE_KEY);
    } catch (storageError) {
      console.warn("[Golfers Nation] Failed to clear local app data.", storageError);
    }

    if (typeof onRetry === "function") {
      renderStartupShell(root, "Resetting local data and reopening Golfers Nation.");
      try {
        onRetry();
        return;
      } catch (retryError) {
        console.error("[Golfers Nation] Reset-and-retry failed immediately.", retryError);
      }
    }

    if (locationRef && typeof locationRef.reload === "function") {
      locationRef.reload();
    }
  });
}

export function showRuntimeRecoveryScreen(root, {
  stage,
  error,
  crashEntry = null,
  locationRef = typeof window !== "undefined" ? window.location : null,
  onRetry = null,
  onReturnHome = null,
} = {}) {
  const detail = createBootErrorMessage(stage, error);
  console.error(`[Golfers Nation] Runtime render failed during ${stage || "runtime"}.`, error);

  root.innerHTML = `
    <section class="boot-recovery-shell" aria-live="polite">
      <article class="boot-recovery-card" role="alert">
        <p class="eyebrow">Golfers Nation</p>
        <h1>This screen hit a problem.</h1>
        <p class="body-copy">Golfers Nation is still on this device, but the current screen failed to render safely. Retry this screen, jump back to Play, or reload the app.</p>
        <div class="boot-recovery-detail">
          <strong>${detail.stageLabel}</strong>
          <span>${detail.message}</span>
        </div>
        ${crashEntry ? `
          <div class="boot-recovery-detail">
            <strong>Crash log saved</strong>
            <span>${crashEntry.id}</span>
          </div>
        ` : ""}
        <div class="boot-recovery-actions">
          <button type="button" class="button button-primary" data-runtime-action="retry">Retry screen</button>
          <button type="button" class="button button-secondary" data-runtime-action="home">Go to Play</button>
          <button type="button" class="button subtle" data-runtime-action="reload">Reload app</button>
        </div>
      </article>
    </section>
  `;

  root.querySelector('[data-runtime-action="retry"]')?.addEventListener("click", () => {
    try {
      onRetry?.();
    } catch (retryError) {
      console.error("[Golfers Nation] Runtime retry failed immediately.", retryError);
    }
  });

  root.querySelector('[data-runtime-action="home"]')?.addEventListener("click", () => {
    try {
      onReturnHome?.();
    } catch (homeError) {
      console.error("[Golfers Nation] Runtime recovery home action failed immediately.", homeError);
    }
  });

  root.querySelector('[data-runtime-action="reload"]')?.addEventListener("click", () => {
    if (locationRef && typeof locationRef.reload === "function") {
      locationRef.reload();
    }
  });
}

export function applyStartupWarning(state, title, message) {
  if (!state?.session || !state?.auth) {
    return state;
  }

  state.session.feedback = {
    tone: "warning",
    title,
    message,
    updatedAt: Date.now(),
  };
  state.auth.notice = message;
  return state;
}
