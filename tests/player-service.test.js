import { describe, expect, it } from "vitest";

import { createDefaultState } from "../src/state/default-state.js";
import {
  buildCommunityFeed,
  buildCompetitivePreview,
  buildDirectConversationThread,
  buildDirectMessageInbox,
  buildFriendLeaderboard,
  buildPlayerComparison,
  ensureDirectConversation,
  ensureProfilesForNames,
  markDirectConversationRead,
  requestFriendProfile,
  sendDirectMessage,
  toggleFollowProfile,
} from "../src/services/player-service.js";

describe("player service", () => {
  it("creates persistent profile descriptors for round participants", () => {
    const state = createDefaultState();
    const startingProfiles = state.profiles.length;

    const descriptors = ensureProfilesForNames(state, ["Avery Brooks", "Reese Hall"]);

    expect(descriptors[0].profileId).toBe(state.currentUser.profileId);
    expect(descriptors[1].displayName).toBe("Reese Hall");
    expect(state.profiles.length).toBe(startingProfiles + 1);
  });

  it("builds a competitive preview from completed profile-linked rounds", () => {
    const state = createDefaultState();
    const preview = buildCompetitivePreview(state, state.currentUser.profileId);

    expect(preview.displayName).toBe("Avery Brooks");
    expect(preview.roundsPlayed).toBeGreaterThan(0);
    expect(preview.recentFormSummary).not.toBe("First round pending");
    expect(typeof preview.fairwayPercentage).toBe("number");
    expect(typeof preview.girPercentage).toBe("number");
    expect(preview.formLabel).toBeTruthy();
    expect(preview.strokesGained).toBeTruthy();
    expect(Array.isArray(preview.hardestHoles)).toBe(true);
    expect(preview.smartInsights.length).toBeGreaterThan(0);
  });

  it("builds a side-by-side comparison for public player stats", () => {
    const state = createDefaultState();
    const comparison = buildPlayerComparison(state, state.currentUser.profileId, "profile-maya");

    expect(comparison.left.displayName).toBe("Avery Brooks");
    expect(comparison.right.displayName).toBe("Maya Chen");
    expect(comparison.metricRows).toHaveLength(6);
    expect(comparison.metricRows.map((row) => row.label)).toContain("Average score");
    expect(comparison.metricRows.map((row) => row.label)).toContain("Driving");
    expect(comparison.right.headToHeadLabel).toContain("shared rounds");
  });

  it("tracks follow and friend connections on public player cards", () => {
    const state = createDefaultState();
    const [, reese] = ensureProfilesForNames(state, ["Avery Brooks", "Reese Hall"]);

    const followResult = toggleFollowProfile(state, "profile-theo");
    const friendResult = requestFriendProfile(state, reese.profileId);
    const theoPreview = buildCompetitivePreview(state, "profile-theo", state.currentUser.profileId);
    const reesePreview = buildCompetitivePreview(state, reese.profileId, state.currentUser.profileId);

    expect(followResult.isFollowed).toBe(false);
    expect(friendResult.status).toBe("connected");
    expect(theoPreview?.isFollowed).toBe(false);
    expect(reesePreview?.isFriend).toBe(true);
    expect(reesePreview?.relationshipLabel).toBe("Friend");
  });

  it("builds a friend leaderboard from followed and friend golfers", () => {
    const state = createDefaultState();
    const leaderboard = buildFriendLeaderboard(state);

    expect(leaderboard.length).toBeGreaterThan(0);
    expect(leaderboard[0].relationshipLabel).toBe("Friend");
    expect(leaderboard.some((entry) => entry.profileId === "profile-theo")).toBe(true);
  });

  it("builds a clubhouse feed from the current golfer social circle", () => {
    const state = createDefaultState();
    const feed = buildCommunityFeed(state);

    expect(feed.length).toBeGreaterThan(0);
    expect(feed.some((entry) => entry.profileId === state.currentUser.profileId)).toBe(true);
    expect(feed.some((entry) => entry.profileId === "profile-maya")).toBe(true);
    expect(feed.every((entry) => typeof entry.message === "string" && entry.message.length > 0)).toBe(true);
  });

  it("builds a direct-message inbox and thread for the current golfer", () => {
    const state = createDefaultState();
    const inbox = buildDirectMessageInbox(state);
    const thread = buildDirectConversationThread(state, inbox[0].id);

    expect(inbox.length).toBeGreaterThan(0);
    expect(inbox[0].displayName).toBeTruthy();
    expect(typeof inbox[0].lastMessagePreview).toBe("string");
    expect(thread?.messages.length).toBeGreaterThan(0);
    expect(thread?.messages[0].displayName).toBeTruthy();
  });

  it("creates and updates direct conversations on top of the friend network", () => {
    const state = createDefaultState();
    const result = ensureDirectConversation(state, "profile-maya");
    const conversationId = result.conversationId || buildDirectMessageInbox(state).find((entry) => entry.peerProfileId === "profile-maya")?.id;

    const sendResult = sendDirectMessage(state, conversationId, "Want to tee it up early Saturday?");
    const inbox = buildDirectMessageInbox(state);
    const mayaThread = buildDirectConversationThread(state, conversationId);

    expect(conversationId).toBeTruthy();
    expect(sendResult.changed).toBe(true);
    expect(mayaThread?.messages[mayaThread.messages.length - 1].message).toBe("Want to tee it up early Saturday?");

    markDirectConversationRead(state, conversationId);
    expect(inbox.some((entry) => entry.peerProfileId === "profile-maya")).toBe(true);
    expect(buildDirectMessageInbox(state).find((entry) => entry.id === conversationId)?.unreadCount).toBe(0);
  });
});
