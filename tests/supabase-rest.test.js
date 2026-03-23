import { describe, expect, it, vi } from "vitest";

import { SUPABASE_SESSION_STORAGE_KEY } from "../src/config.js";
import { createSupabaseRestBridge } from "../src/services/supabase-rest.js";

function createMemoryStorage() {
  const memory = new Map();

  return {
    getItem(key) {
      return memory.has(key) ? memory.get(key) : null;
    },
    setItem(key, value) {
      memory.set(key, String(value));
    },
    removeItem(key) {
      memory.delete(key);
    },
  };
}

function createJsonResponse(payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    text: async () => JSON.stringify(payload),
  };
}

describe("supabase rest bridge", () => {
  it("treats missing profile and workspace tables as a non-blocking empty cloud state", async () => {
    const storage = createMemoryStorage();
    storage.setItem(SUPABASE_SESSION_STORAGE_KEY, JSON.stringify({
      access_token: "token",
      refresh_token: "refresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: "user-1", email: "golfer@example.com" },
    }));

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({
        code: "PGRST205",
        message: "Could not find the table 'public.player_profiles' in the schema cache",
      }, { ok: false, status: 404 }))
      .mockResolvedValueOnce(createJsonResponse({
        code: "PGRST205",
        message: "Could not find the table 'public.player_workspaces' in the schema cache",
      }, { ok: false, status: 404 }));

    const bridge = createSupabaseRestBridge({
      config: {
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon-key",
      },
      fetchImpl,
      storage,
    });

    const result = await bridge.fetchWorkspace("user-1");

    expect(result.profile).toBeNull();
    expect(result.workspace).toBeNull();
    expect(result.session.access_token).toBe("token");
  });

  it("skips profile and workspace upserts cleanly when the backend tables are missing", async () => {
    const storage = createMemoryStorage();
    storage.setItem(SUPABASE_SESSION_STORAGE_KEY, JSON.stringify({
      access_token: "token",
      refresh_token: "refresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: "user-1", email: "golfer@example.com" },
    }));

    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({
        code: "PGRST205",
        message: "Could not find the table 'public.player_profiles' in the schema cache",
      }, { ok: false, status: 404 }))
      .mockResolvedValueOnce(createJsonResponse({
        code: "PGRST205",
        message: "Could not find the table 'public.player_workspaces' in the schema cache",
      }, { ok: false, status: 404 }));

    const bridge = createSupabaseRestBridge({
      config: {
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon-key",
      },
      fetchImpl,
      storage,
    });

    const profileResult = await bridge.upsertProfile({ id: "user-1", email: "golfer@example.com" });
    const workspaceResult = await bridge.upsertWorkspace("user-1", { rounds: [] });

    expect(profileResult.status).toBe("skipped-missing-table");
    expect(workspaceResult.status).toBe("skipped-missing-table");
  });

  it("treats a missing live round session table as a non-blocking multiplayer fallback", async () => {
    const storage = createMemoryStorage();
    storage.setItem(SUPABASE_SESSION_STORAGE_KEY, JSON.stringify({
      access_token: "token",
      refresh_token: "refresh",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: "user-1", email: "golfer@example.com" },
    }));

    const fetchImpl = vi.fn().mockResolvedValueOnce(createJsonResponse({
      code: "PGRST205",
      message: "Could not find the table 'public.live_round_sessions' in the schema cache",
    }, { ok: false, status: 404 }));

    const bridge = createSupabaseRestBridge({
      config: {
        supabaseUrl: "https://example.supabase.co",
        supabaseAnonKey: "anon-key",
      },
      fetchImpl,
      storage,
    });

    const result = await bridge.fetchLiveRoundSessionByInviteCode("ABC123");

    expect(result.session).toBeNull();
    expect(result.missingTable).toBe(true);
  });
});
