import { describe, expect, it } from "vitest";

import { normalizeCurrentUser } from "../apps/native/src/lib/account-state.js";
import { normalizeCourseServiceRequests, normalizeTeeTimeRequests } from "../apps/native/src/lib/request-state.js";
import {
  mergeNativeAppSession,
  mergeSupabaseAccountWithPersistedUser,
} from "../apps/native/src/services/native-platform.js";
import { buildCommunityFeed, buildDirectInbox, normalizeSocialState } from "../apps/native/src/lib/social-state.js";

describe("native state normalizers", () => {
  it("sanitizes restored social data so feed and inbox stay render-safe", () => {
    const socialState = normalizeSocialState({
      currentUser: {
        id: "user-1",
        displayName: "Casey",
      },
      completedRounds: [],
      socialProfiles: [
        {
          id: "profile-friend",
          displayName: { bad: true },
          username: null,
          bio: 42,
        },
      ],
      socialPosts: [
        {
          id: "post-1",
          profileId: "profile-friend",
          message: { text: "bad" },
          createdAt: "not-a-number",
        },
      ],
      socialConversations: [
        {
          id: "conversation-1",
          participantProfileIds: ["user-1", "profile-friend"],
          messages: [
            {
              id: "message-1",
              authorProfileId: "profile-friend",
              text: { body: "bad" },
              createdAt: "still-bad",
            },
          ],
        },
      ],
      socialSettings: {
        followedProfileIds: ["profile-friend"],
        friendProfileIds: ["profile-friend"],
      },
    });

    const feed = buildCommunityFeed({
      currentUser: { id: "user-1" },
      socialProfiles: socialState.socialProfiles,
      socialPosts: socialState.socialPosts,
      socialSettings: socialState.socialSettings,
    });
    const inbox = buildDirectInbox({
      currentUser: { id: "user-1" },
      socialProfiles: socialState.socialProfiles,
      socialConversations: socialState.socialConversations,
      socialSettings: socialState.socialSettings,
    });

    expect(typeof feed[0]?.message).toBe("string");
    expect(typeof feed[0]?.author?.displayName).toBe("string");
    expect(typeof inbox[0]?.messages?.[0]?.text).toBe("string");
  });

  it("sanitizes restored request history so profile request cards stay render-safe", () => {
    const teeTimes = normalizeTeeTimeRequests([
      {
        id: "tee-1",
        courseId: "course-1",
        courseName: { bad: true },
        desiredWindowLabel: 99,
        status: null,
      },
    ]);
    const services = normalizeCourseServiceRequests([
      {
        id: "service-1",
        courseId: "course-2",
        courseName: ["bad"],
        requestType: { type: "beverage-cart" },
        status: null,
      },
    ]);

    expect(teeTimes[0].courseName).toBe("[object Object]");
    expect(teeTimes[0].desiredWindowLabel).toBe("99");
    expect(teeTimes[0].status).toBe("requested");
    expect(services[0].courseName).toBe("bad");
    expect(services[0].requestType).toBe("[object Object]");
    expect(services[0].status).toBe("requested");
  });

  it("fills missing appearance and privacy defaults for legacy native users", () => {
    const user = normalizeCurrentUser({
      id: "user-1",
      displayName: "Casey",
      appearance: null,
      privacy: null,
      subscription: null,
    });

    expect(user.appearance.colorMode).toBe("system");
    expect(user.appearance.themeId).toBe("forest");
    expect(user.privacy.profileVisibility).toBe("friends");
    expect(user.subscription.tier).toBe("free");
  });

  it("keeps saved golfer appearance fields when cloud auth refreshes the account shell", () => {
    const merged = mergeSupabaseAccountWithPersistedUser(
      {
        id: "user-1",
        email: "casey@example.com",
        user_metadata: {
          display_name: "Casey",
        },
        app_metadata: {
          provider: "email",
        },
      },
      {
        id: "user-1",
        homeCourse: "Torrey Pines",
        appearance: {
          colorMode: "light",
          themeId: "ocean",
          textScale: "large",
          compactMode: true,
          contrastMode: "high",
        },
      }
    );

    expect(merged.homeCourse).toBe("Torrey Pines");
    expect(merged.appearance.themeId).toBe("ocean");
    expect(merged.appearance.colorMode).toBe("light");
  });

  it("preserves saved session collections when auth fields are refreshed", () => {
    const merged = mergeNativeAppSession(
      {
        signedIn: true,
        completedRounds: [{ id: "round-1" }],
        socialPosts: [{ id: "post-1" }],
        currentUser: {
          id: "user-1",
          appearance: {
            themeId: "ocean",
          },
        },
      },
      {
        signedIn: true,
        authMode: "supabase",
        currentUser: {
          id: "user-1",
          email: "casey@example.com",
        },
      }
    );

    expect(merged.completedRounds).toHaveLength(1);
    expect(merged.socialPosts).toHaveLength(1);
    expect(merged.currentUser.email).toBe("casey@example.com");
    expect(merged.currentUser.appearance.themeId).toBe("ocean");
  });
});
