import { cloneData } from "../utils/formatters.js";

const SPOTIFY_WEB_URL = "https://open.spotify.com/";

const SPOTIFY_PREVIEW_QUEUE = [
  {
    id: "golden-hour-drive",
    title: "Golden Hour Drive",
    artist: "Fairway Echoes",
    album: "Late Tee Time",
    artworkLabel: "GH",
    artworkVariant: "forest",
    webUrl: SPOTIFY_WEB_URL,
    deepLink: "spotify://",
  },
  {
    id: "lake-charles-loop",
    title: "Lake Charles Loop",
    artist: "Pin High FM",
    album: "Local Fairways",
    artworkLabel: "LC",
    artworkVariant: "ocean",
    webUrl: SPOTIFY_WEB_URL,
    deepLink: "spotify://",
  },
  {
    id: "clubhouse-close",
    title: "Clubhouse Close",
    artist: "The Scorecards",
    album: "After the 18th",
    artworkLabel: "CC",
    artworkVariant: "sand",
    webUrl: SPOTIFY_WEB_URL,
    deepLink: "spotify://",
  },
];

function getPreviewTrackAtIndex(index = 0) {
  const safeIndex = Number.isInteger(index) ? index : 0;
  const normalizedIndex = ((safeIndex % SPOTIFY_PREVIEW_QUEUE.length) + SPOTIFY_PREVIEW_QUEUE.length) % SPOTIFY_PREVIEW_QUEUE.length;
  return {
    queueIndex: normalizedIndex,
    track: cloneData(SPOTIFY_PREVIEW_QUEUE[normalizedIndex]),
  };
}

function normalizeSpotifyTrack(track = null, fallbackIndex = 0) {
  if (!track) {
    return null;
  }

  const defaultTrack = getPreviewTrackAtIndex(fallbackIndex).track;
  return {
    id: String(track.id || defaultTrack.id),
    title: String(track.title || defaultTrack.title),
    artist: String(track.artist || defaultTrack.artist),
    album: String(track.album || defaultTrack.album),
    artworkLabel: String(track.artworkLabel || defaultTrack.artworkLabel || "SP").slice(0, 2).toUpperCase(),
    artworkVariant: String(track.artworkVariant || defaultTrack.artworkVariant || "forest"),
    webUrl: String(track.webUrl || defaultTrack.webUrl || SPOTIFY_WEB_URL),
    deepLink: String(track.deepLink || defaultTrack.deepLink || "spotify://"),
  };
}

export function createSpotifyIntegrationState(overrides = {}) {
  const queueIndex = Number.isInteger(overrides.queueIndex) ? overrides.queueIndex : 0;
  const connected = overrides.status === "connected";
  const fallbackTrack = connected ? getPreviewTrackAtIndex(queueIndex).track : null;
  const nowPlaying = normalizeSpotifyTrack(
    overrides.nowPlaying || fallbackTrack,
    queueIndex
  );
  const playbackState = overrides.playbackState === "playing"
    ? "playing"
    : connected && overrides.playbackState === "paused"
      ? "paused"
      : connected
        ? "playing"
        : "idle";

  return {
    status: connected ? "connected" : "disconnected",
    previewMode: overrides.previewMode !== false,
    controlsEnabled: connected ? overrides.controlsEnabled !== false : false,
    accountLabel: String(overrides.accountLabel || ""),
    deviceName: String(overrides.deviceName || ""),
    lastConnectedAt: overrides.lastConnectedAt || null,
    lastError: String(overrides.lastError || ""),
    queueIndex,
    playbackState,
    showOnRoundScreen: overrides.showOnRoundScreen !== false,
    nowPlaying,
  };
}

export function createSpotifySessionState(overrides = {}) {
  return {
    barCollapsed: overrides.barCollapsed === true,
    lastAction: String(overrides.lastAction || ""),
    lastUpdatedAt: overrides.lastUpdatedAt || 0,
  };
}

export function createIntegrationSettings(overrides = {}) {
  const next = cloneData(overrides || {});
  return {
    spotify: createSpotifyIntegrationState(next.spotify || {}),
  };
}

export function getSpotifyIntegration(stateOrUser = {}) {
  const source = stateOrUser?.currentUser ? stateOrUser.currentUser : stateOrUser;
  return createSpotifyIntegrationState(source?.integrations?.spotify || {});
}

export function getSpotifySession(state = {}) {
  return createSpotifySessionState(state?.session?.spotify || {});
}

export function isSpotifyConnected(state = {}) {
  return getSpotifyIntegration(state).status === "connected";
}

export function getSpotifyOpenTarget(spotifyState = null) {
  const spotify = createSpotifyIntegrationState(spotifyState || {});
  return {
    deepLink: spotify.nowPlaying?.deepLink || "spotify://",
    webUrl: spotify.nowPlaying?.webUrl || SPOTIFY_WEB_URL,
  };
}

export function connectSpotifyCompanion(current = {}, options = {}) {
  const queueIndex = Number.isInteger(current?.queueIndex) ? current.queueIndex : 0;
  const previewTrack = getPreviewTrackAtIndex(queueIndex).track;
  return createSpotifyIntegrationState({
    ...current,
    status: "connected",
    previewMode: true,
    controlsEnabled: true,
    queueIndex,
    accountLabel: options.accountLabel || current?.accountLabel || "",
    deviceName: options.deviceName || current?.deviceName || "This phone",
    lastConnectedAt: Date.now(),
    lastError: "",
    playbackState: current?.playbackState === "paused" ? "paused" : "playing",
    nowPlaying: current?.nowPlaying || previewTrack,
  });
}

export function disconnectSpotifyCompanion(current = {}) {
  return createSpotifyIntegrationState({
    ...current,
    status: "disconnected",
    controlsEnabled: false,
    playbackState: "idle",
    nowPlaying: null,
    lastError: "",
  });
}

export function toggleSpotifyPlayback(current = {}) {
  const spotify = createSpotifyIntegrationState(current);
  if (spotify.status !== "connected" || !spotify.controlsEnabled) {
    return spotify;
  }

  return createSpotifyIntegrationState({
    ...spotify,
    playbackState: spotify.playbackState === "playing" ? "paused" : "playing",
  });
}

export function stepSpotifyQueue(current = {}, direction = 1) {
  const spotify = createSpotifyIntegrationState(current);
  if (spotify.status !== "connected" || !spotify.controlsEnabled) {
    return spotify;
  }

  const nextIndex = spotify.queueIndex + (direction >= 0 ? 1 : -1);
  const previewTrack = getPreviewTrackAtIndex(nextIndex);
  return createSpotifyIntegrationState({
    ...spotify,
    queueIndex: previewTrack.queueIndex,
    nowPlaying: previewTrack.track,
    playbackState: "playing",
  });
}

export function getSpotifyConnectionSummary(spotifyState = null) {
  const spotify = createSpotifyIntegrationState(spotifyState || {});
  if (spotify.status !== "connected") {
    return {
      statusLabel: "Disconnected",
      title: "Connect Spotify",
      message: "Connect Spotify to unlock a compact Now Playing bar and quick playback actions inside Golfers Nation.",
      detail: "This first pass is a companion control scaffold only. Real Spotify OAuth, device selection, and playback transfer come next.",
    };
  }

  return {
    statusLabel: spotify.previewMode ? "Connected preview" : "Connected",
    title: spotify.playbackState === "playing" ? "Now playing in the companion bar" : "Playback ready in the companion bar",
    message: `${spotify.nowPlaying?.title || "Spotify"} / ${spotify.nowPlaying?.artist || "Connected account"} / ${spotify.deviceName || "This phone"}`,
    detail: spotify.previewMode
      ? "This scaffold preview proves the mobile control flow. Full Spotify auth, playback SDK support, and device handoff can be layered in later."
      : "Spotify is connected and ready for lightweight in-app controls.",
  };
}
