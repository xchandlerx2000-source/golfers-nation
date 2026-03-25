import { describe, expect, it } from "vitest";

import { createGearItem, createGroup, createPlayerProfile, createRound, createTournament } from "../src/domain/factories.js";

const currentUser = {
  id: "user-1",
  name: "Avery Brooks",
};

describe("factories", () => {
  it("creates a stroke-play round with the current user on the card", () => {
    const round = createRound({
      currentUser,
      courseName: "National Pines",
      teeBox: "Blue",
      weather: "Clear 72F",
      mode: "stroke",
      players: ["Maya Chen", "Theo Grant"],
    });

    expect(round.mode).toBe("stroke");
    expect(round.players).toHaveLength(3);
    expect(round.players[0].name).toBe("Avery Brooks");
    expect(round.sides).toHaveLength(0);
    expect(round.holes).toHaveLength(18);
    expect(round.holes[0].entries).toHaveLength(3);
    expect(round.holes[0].entries[0].penalties).toBe(0);
    expect(round.holes[0].entries[0].upAndDown).toBe(false);
    expect(round.holes[0].entries[0].sandSave).toBe(false);
  });

  it("creates side-based rounds for scramble mode", () => {
    const round = createRound({
      currentUser,
      courseName: "National Pines",
      teeBox: "Blue",
      weather: "Windy 68F",
      mode: "scramble",
      players: ["Avery Brooks", "Maya Chen", "Theo Grant", "Jordan Wells"],
    });

    expect(round.sides).toHaveLength(2);
    expect(round.sides[0].playerNames).toContain("Avery Brooks");
    expect(round.holes[0].entries).toHaveLength(2);
  });

  it("keeps stableford rounds player-based instead of side-based", () => {
    const round = createRound({
      currentUser,
      courseName: "National Pines",
      teeBox: "Blue",
      weather: "Warm 75F",
      mode: "stableford",
      players: ["Avery Brooks", "Maya Chen", "Theo Grant"],
    });

    expect(round.players).toHaveLength(3);
    expect(round.sides).toHaveLength(0);
    expect(round.holes[0].entries).toHaveLength(3);
  });

  it("uses selected course hole data when a real tee box is supplied", () => {
    const round = createRound({
      currentUser,
      courseId: "pebble-beach-california",
      courseName: "Pebble Beach Golf Links",
      teeBox: "Championship",
      teeBoxId: "pebble-beach-california-championship",
      courseCity: "Pebble Beach",
      courseState: "CA",
      courseRegion: "California",
      courseSource: "seeded-curated-demo",
      courseSeeded: true,
      holesTemplate: [
        { number: 1, par: 4, yards: 381 },
        { number: 2, par: 5, yards: 511 },
        { number: 3, par: 4, yards: 390 },
        { number: 4, par: 4, yards: 331 },
        { number: 5, par: 3, yards: 192 },
        { number: 6, par: 5, yards: 503 },
        { number: 7, par: 3, yards: 106 },
        { number: 8, par: 4, yards: 428 },
        { number: 9, par: 4, yards: 446 },
        { number: 10, par: 4, yards: 495 },
        { number: 11, par: 4, yards: 390 },
        { number: 12, par: 3, yards: 202 },
        { number: 13, par: 4, yards: 407 },
        { number: 14, par: 5, yards: 580 },
        { number: 15, par: 4, yards: 396 },
        { number: 16, par: 4, yards: 403 },
        { number: 17, par: 3, yards: 208 },
        { number: 18, par: 5, yards: 543 },
      ],
      weather: "Marine layer",
      mode: "stroke",
      players: ["Maya Chen", "Theo Grant"],
    });

    expect(round.courseId).toBe("pebble-beach-california");
    expect(round.courseSeeded).toBe(true);
    expect(round.courseCity).toBe("Pebble Beach");
    expect(round.teeBoxId).toBe("pebble-beach-california-championship");
    expect(round.holes[0].yards).toBe(381);
    expect(round.holes[6].par).toBe(3);
  });

  it("creates related group, tournament, and gear records", () => {
    const round = createRound({
      currentUser,
      courseName: "Shadow Ridge",
      teeBox: "Blue",
      weather: "Warm 76F",
      mode: "stroke",
      players: ["Avery Brooks", "Maya Chen"],
    });
    const group = createGroup({
      round,
      currentUser,
      inviteCode: "ABCD12",
    });
    const tournament = createTournament({
      name: "Weekend Cup",
      courseName: "Shadow Ridge",
      date: "2026-04-01T12:00:00.000Z",
      mode: "stroke",
      fieldSize: 24,
    });
    const gearItem = createGearItem({
      category: "accessory",
      name: "Rangefinder",
      notes: "Charge before weekend rounds",
      packed: true,
    });

    expect(group.inviteCode).toBe("ABCD12");
    expect(group.members).toHaveLength(round.players.length);
    expect(tournament.name).toBe("Weekend Cup");
    expect(gearItem.packed).toBe(true);
  });

  it("creates a persistent player profile scaffold for account-based play", () => {
    const profile = createPlayerProfile({
      userId: "user-1",
      displayName: "Avery Brooks",
      username: "@averybrooks",
      avatarLabel: "AB",
      email: "avery@example.com",
      premiumStatus: "free",
    });

    expect(profile.publicProfile.displayName).toBe("Avery Brooks");
    expect(profile.account.email).toBe("avery@example.com");
    expect(profile.privateProfile.privacy.showRecentForm).toBe(true);
    expect(profile.publicProfile.fairwayPercentage).toBe(0);
    expect(profile.publicProfile.smartInsights).toEqual([]);
  });
});
