import { describe, expect, it } from "vitest";

import { createGroup, createRound } from "../src/domain/factories.js";
import { createDefaultNearbyState, getNearbyDiscoveryState, listNearbyGames, listNearbyPlayers } from "../src/services/nearby-detection-service.js";
import { createDefaultState } from "../src/state/default-state.js";

describe("nearby discovery scaffolding", () => {
  it("surfaces nearby rounds and players from active local live groups", () => {
    const state = createDefaultState();
    const round = createRound({
      currentUser: state.currentUser,
      courseName: "The Country Club at Golden Nugget",
      teeBox: "Gold",
      weather: "Clear 74F",
      mode: "stroke",
      players: [
        state.currentUser.displayName,
        {
          profileId: "profile-maya",
          displayName: "Maya Chen",
          username: "@mayachen",
          avatarLabel: "MC",
        },
      ],
      syncTransport: "invite",
    });
    const group = createGroup({
      round,
      currentUser: state.currentUser,
      inviteCode: "GLD123",
    });

    round.inviteCode = group.inviteCode;
    round.groupId = group.id;
    round.currentHole = 4;
    state.rounds.unshift(round);
    state.groups.unshift(group);

    const nearbyGames = listNearbyGames(state);
    const nearbyPlayers = listNearbyPlayers(state);
    const maya = nearbyPlayers.find((player) => player.profileId === "profile-maya");

    expect(nearbyGames[0]).toEqual(expect.objectContaining({
      inviteCode: "GLD123",
      joinActionLabel: "Join friends",
      playerCount: 2,
      statusLabel: "Hole 4 / 2 golfers",
    }));
    expect(maya).toEqual(expect.objectContaining({
      displayName: "Maya Chen",
      inviteCode: "GLD123",
      isFriend: true,
      isLive: true,
      relationshipLabel: "Friend",
      statusLabel: "In a live nearby round",
    }));
  });

  it("respects private profile visibility in nearby discovery", () => {
    const state = createDefaultState();
    const jordan = state.profiles.find((profile) => profile.id === "profile-jordan");

    jordan.privateProfile.privacy.profileVisibility = "private";

    const nearbyPlayers = listNearbyPlayers(state);

    expect(nearbyPlayers.some((player) => player.profileId === "profile-jordan")).toBe(false);
  });

  it("sorts nearby players with friend and follow context first", () => {
    const state = createDefaultState();

    const nearbyPlayers = listNearbyPlayers(state);

    expect(nearbyPlayers[0].isFriend).toBe(true);
    expect(nearbyPlayers[0].relationshipLabel).toBe("Friend");
    expect(nearbyPlayers.findIndex((player) => player.isFriend)).toBeLessThan(
      nearbyPlayers.findIndex((player) => player.isFollowed && !player.isFriend)
    );
    expect(nearbyPlayers.some((player) => player.profileId === "profile-theo" && player.isFollowed)).toBe(true);
  });

  it("falls back to app-safe discovery when location is unavailable", () => {
    const state = createDefaultState();
    state.session.nearby = {
      ...createDefaultNearbyState(),
      locationPermission: "denied",
      locationStatus: "fallback",
      bluetoothStatus: "idle",
    };

    const discovery = getNearbyDiscoveryState(state);

    expect(discovery.strategy.badge).toBe("App-safe discovery");
    expect(discovery.strategy.detail).toContain("Location is off");
    expect(discovery.games.length).toBeGreaterThan(0);
    expect(discovery.players.length).toBeGreaterThan(0);
  });
});
