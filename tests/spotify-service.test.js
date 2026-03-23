import { describe, expect, it } from "vitest";

import {
  connectSpotifyCompanion,
  createSpotifyIntegrationState,
  disconnectSpotifyCompanion,
  stepSpotifyQueue,
  toggleSpotifyPlayback,
} from "../src/integrations/spotify-service.js";

describe("spotify service", () => {
  it("starts disconnected and connects with a companion preview track", () => {
    const initial = createSpotifyIntegrationState();
    const connected = connectSpotifyCompanion(initial, {
      accountLabel: "Avery Brooks",
      deviceName: "This browser",
    });

    expect(initial.status).toBe("disconnected");
    expect(connected.status).toBe("connected");
    expect(connected.controlsEnabled).toBe(true);
    expect(connected.deviceName).toBe("This browser");
    expect(connected.nowPlaying.title).toBe("Golden Hour Drive");
  });

  it("toggles playback state and steps through the lightweight preview queue", () => {
    const connected = connectSpotifyCompanion(createSpotifyIntegrationState(), {
      deviceName: "This installed app",
    });

    const paused = toggleSpotifyPlayback(connected);
    const nextTrack = stepSpotifyQueue(paused, 1);
    const previousTrack = stepSpotifyQueue(nextTrack, -1);

    expect(paused.playbackState).toBe("paused");
    expect(nextTrack.nowPlaying.title).not.toBe(paused.nowPlaying.title);
    expect(nextTrack.playbackState).toBe("playing");
    expect(previousTrack.nowPlaying.title).toBe("Golden Hour Drive");
  });

  it("disconnects cleanly without keeping playback controls active", () => {
    const connected = connectSpotifyCompanion(createSpotifyIntegrationState());
    const disconnected = disconnectSpotifyCompanion(connected);

    expect(disconnected.status).toBe("disconnected");
    expect(disconnected.controlsEnabled).toBe(false);
    expect(disconnected.nowPlaying).toBeNull();
  });
});
