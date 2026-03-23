// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSyncService } from "../src/services/sync-service.js";
import { createDefaultState } from "../src/state/default-state.js";
import { createStore } from "../src/state/store.js";

class MockBroadcastChannel {
  static instances = [];

  constructor(name) {
    this.name = name;
    this.messages = [];
    this.listeners = new Map();
    MockBroadcastChannel.instances.push(this);
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  postMessage(message) {
    this.messages.push(message);
  }

  emit(type, payload) {
    const listener = this.listeners.get(type);
    if (listener) {
      listener(payload);
    }
  }

  close() {
    this.closed = true;
  }
}

describe("sync service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockBroadcastChannel.instances = [];
    globalThis.BroadcastChannel = MockBroadcastChannel;
    if (window) {
      window.BroadcastChannel = MockBroadcastChannel;
    }

    Object.defineProperty(globalThis.navigator, "bluetooth", {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates the active round transport when nearby sync is enabled", () => {
    const store = createStore(createDefaultState());
    const service = createSyncService({ store });
    const activeRoundId = store.getState().session.activeRoundId;

    service.enableNearbyPrototype(activeRoundId);

    const activeRound = store.getState().rounds.find((round) => round.id === activeRoundId);
    expect(activeRound.sync.transport).toBe("nearby");
    expect(activeRound.sync.label).toBe("Nearby sync");
  });

  it("broadcasts round updates once initialized", () => {
    const store = createStore(createDefaultState());
    const service = createSyncService({ store });
    const activeRoundId = store.getState().session.activeRoundId;

    service.init();
    service.notifyRoundUpdated(activeRoundId);

    expect(MockBroadcastChannel.instances[0].messages).toHaveLength(1);
    expect(MockBroadcastChannel.instances[0].messages[0].roundId).toBe(activeRoundId);

    service.teardown();
  });

  it("falls back from browser bluetooth to nearby sync when bluetooth is unavailable", async () => {
    const store = createStore(createDefaultState());
    const service = createSyncService({ store });
    const activeRoundId = store.getState().session.activeRoundId;

    await service.tryBluetoothPrototype(activeRoundId);

    const activeRound = store.getState().rounds.find((round) => round.id === activeRoundId);
    expect(activeRound.sync.transport).toBe("nearby");
    expect(store.getState().social.activity[0].message).toContain("Browser Bluetooth is unavailable");
  });

  it("simulates remote score progress for connected rounds", () => {
    const state = createDefaultState();
    const activeRoundId = state.session.activeRoundId;
    const store = createStore(state);
    const service = createSyncService({ store });

    store.setState((draft) => {
      const activeRound = draft.rounds.find((round) => round.id === activeRoundId);
      activeRound.sync.transport = "invite";
      activeRound.sync.state = "hosting";
      return draft;
    });

    const activeRoundBefore = store.getState().rounds.find((round) => round.id === activeRoundId);
    const remoteParticipantIds = activeRoundBefore.players.slice(1).map((player) => player.id);

    service.init();
    vi.advanceTimersByTime(12000);

    const activeRoundAfter = store.getState().rounds.find((round) => round.id === activeRoundId);
    const updatedEntries = activeRoundAfter.holes
      .flatMap((hole) => hole.entries.filter((entry) => remoteParticipantIds.includes(entry.participantId)))
      .filter((entry) => entry.strokes !== null);

    expect(updatedEntries.length).toBeGreaterThan(0);

    service.teardown();
  });
});
