import {
  getSpotifyConnectionSummary,
  getSpotifyIntegration,
  getSpotifySession,
  isSpotifyConnected,
} from "../integrations/spotify-service.js";
import { escapeHtml, formatRelativeSync } from "../utils/formatters.js";

function renderArtworkThumb(track) {
  return `
    <div class="spotify-artwork-thumb" data-artwork-variant="${escapeHtml(track?.artworkVariant || "forest")}" aria-hidden="true">
      <span>${escapeHtml(track?.artworkLabel || "SP")}</span>
    </div>
  `;
}

function renderSpotifyControlButton({ action, label, ariaLabel, disabled = false, tone = "subtle" }) {
  return `
    <button
      class="spotify-control-button spotify-control-button--${tone}"
      type="button"
      data-action="${escapeHtml(action)}"
      aria-label="${escapeHtml(ariaLabel || label)}"
      ${disabled ? "disabled" : ""}
    >
      ${escapeHtml(label)}
    </button>
  `;
}

export function renderSpotifySettingsPanel(state) {
  const spotify = getSpotifyIntegration(state);
  const summary = getSpotifyConnectionSummary(spotify);
  const connected = spotify.status === "connected";
  const connectedAt = spotify.lastConnectedAt ? formatRelativeSync(spotify.lastConnectedAt) : "Not connected yet";

  return `
    <article class="settings-support-panel spotify-settings-panel">
      <div class="spotify-settings-header">
        <div>
          <span class="mini-label">Spotify companion</span>
          <strong>${escapeHtml(summary.title)}</strong>
        </div>
        <span class="status-pill ${connected ? "is-live" : ""}">${escapeHtml(summary.statusLabel)}</span>
      </div>
      <p>${escapeHtml(summary.message)}</p>
      <p class="spotify-settings-detail">${escapeHtml(summary.detail)}</p>
      <div class="summary-grid compact spotify-settings-meta">
        <article>
          <span>Connection</span>
          <strong>${escapeHtml(connected ? "Ready for in-app controls" : "Not connected")}</strong>
        </article>
        <article>
          <span>Last update</span>
          <strong>${escapeHtml(connectedAt)}</strong>
        </article>
      </div>
      ${connected && spotify.nowPlaying ? `
        <div class="spotify-settings-preview">
          ${renderArtworkThumb(spotify.nowPlaying)}
          <div class="spotify-settings-preview-copy">
            <span class="mini-label">${escapeHtml(spotify.previewMode ? "Preview track" : "Now playing")}</span>
            <strong>${escapeHtml(spotify.nowPlaying.title)}</strong>
            <p>${escapeHtml(spotify.nowPlaying.artist)} / ${escapeHtml(spotify.deviceName || "This phone")}</p>
          </div>
        </div>
      ` : ""}
      <div class="row-actions spotify-settings-actions">
        <button class="button primary" type="button" data-action="${connected ? "disconnect-spotify" : "connect-spotify"}">
          ${connected ? "Disconnect Spotify" : "Connect Spotify"}
        </button>
        <button class="button secondary" type="button" data-action="spotify-open">
          Open Spotify
        </button>
      </div>
    </article>
  `;
}

export function renderSpotifyNowPlayingBar(state) {
  if (!isSpotifyConnected(state)) {
    return "";
  }

  const spotify = getSpotifyIntegration(state);
  const session = getSpotifySession(state);
  const track = spotify.nowPlaying;
  if (state.session?.activeView === "round" && spotify.showOnRoundScreen === false) {
    return "";
  }
  if (!track) {
    return "";
  }

  const isRoundView = state.session?.activeView === "round";
  const collapsed = isRoundView && session.barCollapsed;
  const statusLabel = spotify.playbackState === "playing" ? "Playing" : "Paused";

  if (collapsed) {
    return `
      <section class="spotify-shell spotify-shell--collapsed" aria-label="Spotify now playing">
        <button class="spotify-minibar" type="button" data-action="toggle-spotify-bar" aria-expanded="false">
          ${renderArtworkThumb(track)}
          <span class="spotify-minibar-copy">
            <strong>${escapeHtml(track.title)}</strong>
            <span>${escapeHtml(track.artist)}</span>
          </span>
          <span class="spotify-minibar-status">${escapeHtml(statusLabel)}</span>
        </button>
      </section>
    `;
  }

  return `
    <section class="spotify-shell" aria-label="Spotify now playing">
      <article class="spotify-now-playing-bar">
        <div class="spotify-now-playing-main">
          ${renderArtworkThumb(track)}
          <div class="spotify-track-copy">
            <div class="spotify-track-copy-top">
              <span class="mini-label">Now Playing</span>
              <span class="spotify-preview-badge">${escapeHtml(spotify.previewMode ? "Companion preview" : "Connected")}</span>
            </div>
            <strong>${escapeHtml(track.title)}</strong>
            <p>${escapeHtml(track.artist)} / ${escapeHtml(statusLabel)} / ${escapeHtml(spotify.deviceName || "This phone")}</p>
          </div>
        </div>
        <div class="spotify-control-row">
          ${renderSpotifyControlButton({ action: "spotify-prev", label: "Prev", ariaLabel: "Previous track", disabled: !spotify.controlsEnabled })}
          ${renderSpotifyControlButton({
            action: "spotify-play-pause",
            label: spotify.playbackState === "playing" ? "Pause" : "Play",
            ariaLabel: spotify.playbackState === "playing" ? "Pause playback" : "Resume playback",
            tone: "primary",
            disabled: !spotify.controlsEnabled,
          })}
          ${renderSpotifyControlButton({ action: "spotify-next", label: "Next", ariaLabel: "Next track", disabled: !spotify.controlsEnabled })}
          ${renderSpotifyControlButton({ action: "spotify-open", label: "Open Spotify", ariaLabel: "Open Spotify", tone: "secondary" })}
          ${isRoundView
            ? renderSpotifyControlButton({ action: "toggle-spotify-bar", label: "Minimize", ariaLabel: "Minimize Spotify controls" })
            : ""}
        </div>
      </article>
    </section>
  `;
}
