import { afterEach, describe, expect, it } from "vitest";

import { createProductPlatform } from "../src/services/product-platform.js";
import { createDefaultState } from "../src/state/default-state.js";
import { createStore } from "../src/state/store.js";

describe("product platform", () => {
  afterEach(() => {
    delete globalThis.__GN_RUNTIME_CONFIG__;
  });

  it("exposes backend-ready local adapters for auth, data, and realtime", () => {
    const platform = createProductPlatform();

    expect(platform.capabilities.backendReady).toBe(true);
    expect(platform.capabilities.authMode).toBe("local-auth-adapter");
    expect(platform.capabilities.dataMode).toBe("local-device-adapter");
    expect(platform.capabilities.realtimeMode).toBe("device-realtime-adapter");
  });

  it("runs signup through the auth gateway and exports a cloud-ready workspace snapshot", () => {
    const platform = createProductPlatform();
    const state = createDefaultState();

    const result = platform.auth.signUpWithEmail(state, {
      displayName: "Morgan Hill",
      email: "morgan@example.com",
      password: "swing123",
    });

    expect(result.error).toBeUndefined();
    expect(state.auth.status).toBe("authenticated");

    const snapshot = platform.data.exportWorkspaceSnapshot(state, state.currentUser.id);

    expect(snapshot.auth_user.email).toBe("morgan@example.com");
    expect(snapshot.auth_user.subscription_tier).toBe("premium");
    expect(snapshot.profiles).toHaveLength(1);
    expect(snapshot.session.selected_profile_id).toBe(state.currentUser.profileId);
  });

  it("switches to Supabase-backed auth and data adapters when runtime config is present", () => {
    globalThis.__GN_RUNTIME_CONFIG__ = {
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "test-anon-key",
    };

    const platform = createProductPlatform();

    expect(platform.capabilities.supabaseEnabled).toBe(true);
    expect(platform.capabilities.authMode).toBe("supabase-auth-adapter");
    expect(platform.capabilities.dataMode).toBe("supabase-cloud-adapter");
    expect(platform.capabilities.realtimeMode).toBe("supabase-realtime-adapter");
  });

  it("creates realtime sessions with backend-friendly method names", () => {
    const platform = createProductPlatform();
    const store = createStore(createDefaultState());
    const session = platform.realtime.createSession({ store });

    expect(typeof session.connect).toBe("function");
    expect(typeof session.disconnect).toBe("function");
    expect(typeof session.publishRoundUpdate).toBe("function");
    expect(typeof session.enableNearbySync).toBe("function");
    expect(typeof session.enableBluetoothSync).toBe("function");
  });
});
