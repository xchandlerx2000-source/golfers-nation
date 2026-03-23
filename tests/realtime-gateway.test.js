import { describe, expect, it, vi } from "vitest";

import { createRound } from "../src/domain/factories.js";
import { createSupabaseRealtimeGatewayFactory } from "../src/services/realtime-gateway.js";
import { hostRoundGroup } from "../src/services/mock-api.js";
import { toBackendLiveRoundSessionRecord } from "../src/services/backend-models.js";
import { createDefaultState } from "../src/state/default-state.js";
import { createStore } from "../src/state/store.js";

class FakeRealtimeSocket {
  constructor() {
    FakeRealtimeSocket.instances.push(this);
    this.readyState = 0;
    this.sentMessages = [];
    this.listeners = {
      open: [],
      message: [],
      close: [],
      error: [],
    };

    queueMicrotask(() => {
      this.readyState = 1;
      this.emit("open", {});
    });
  }

  addEventListener(type, handler) {
    this.listeners[type].push(handler);
  }

  send(serialized) {
    const message = JSON.parse(serialized);
    this.sentMessages.push(message);
    if (message.event === "phx_join") {
      queueMicrotask(() => {
        this.emit("message", {
          data: JSON.stringify({
            topic: message.topic,
            event: "phx_reply",
            payload: {
              status: "ok",
              response: {},
            },
            ref: message.ref,
            join_ref: message.join_ref,
          }),
        });
      });
    }
  }

  close() {
    this.readyState = 3;
    this.emit("close", {});
  }

  emit(type, payload) {
    this.listeners[type].forEach((listener) => listener(payload));
  }
}
FakeRealtimeSocket.instances = [];

function createBridge(overrides = {}) {
  return {
    config: {
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon-key",
    },
    isConfigured: () => true,
    upsertLiveRoundSession: vi.fn(async (record) => ({ data: [record] })),
    fetchLiveRoundSessionByInviteCode: vi.fn(async () => ({ session: null, missingTable: false })),
    broadcastRealtimeMessage: vi.fn(async () => ({ data: { ok: true } })),
    ...overrides,
  };
}

describe("supabase realtime gateway", () => {
  it("hosts a round through the live session bridge and broadcasts an initial snapshot", async () => {
    const state = createDefaultState();
    const store = createStore(state);

    store.setState((draft) => {
      const round = createRound({
        currentUser: draft.currentUser,
        courseName: "The Country Club at Golden Nugget",
        teeBox: "Gold",
        mode: "stroke",
        players: [draft.currentUser.displayName],
        syncTransport: "invite",
      });
      const hosted = hostRoundGroup({ state: draft, round });
      round.inviteCode = hosted.inviteCode;
      round.groupId = hosted.group.id;
      draft.rounds.unshift(round);
      draft.groups.unshift(hosted.group);
      draft.session.activeRoundId = round.id;
      return draft;
    });

    const bridge = createBridge();
    const gateway = createSupabaseRealtimeGatewayFactory({
      bridge,
      WebSocketFactory: FakeRealtimeSocket,
      windowRef: null,
    });
    const session = gateway.createSession({ store });

    const result = await session.hostRoundSession(store.getState().session.activeRoundId);

    expect(result.status).toBe("hosted");
    expect(bridge.upsertLiveRoundSession).toHaveBeenCalledTimes(2);
    expect(bridge.broadcastRealtimeMessage).toHaveBeenCalledWith(
      expect.stringContaining("gn-live-round:"),
      "round-snapshot",
      expect.objectContaining({
        session: expect.objectContaining({
          inviteCode: store.getState().rounds[0].inviteCode,
        }),
      })
    );
  });

  it("joins a live round and assigns the current golfer to a local participant card", async () => {
    const store = createStore(createDefaultState());
    const currentUser = store.getState().currentUser;
    const hostUser = {
      id: "host-user-1",
      profileId: "profile-host-1",
      name: "Host Golfer",
      displayName: "Host Golfer",
      username: "@hostgolfer",
      avatarLabel: "HG",
    };

    const round = createRound({
      currentUser: hostUser,
      courseName: "The Country Club at Golden Nugget",
      teeBox: "Gold",
      mode: "stroke",
      players: [hostUser.displayName],
      syncTransport: "invite",
    });
    const hosted = hostRoundGroup({
      state: {
        groups: [],
        currentUser: hostUser,
      },
      round,
    });
    round.inviteCode = hosted.inviteCode;
    round.groupId = hosted.group.id;

    const sessionRecord = toBackendLiveRoundSessionRecord({
      round,
      group: hosted.group,
      userId: hostUser.id,
      sessionId: hosted.group.id,
    });

    const bridge = createBridge({
      fetchLiveRoundSessionByInviteCode: vi.fn(async () => ({
        session: sessionRecord,
        missingTable: false,
      })),
    });
    const gateway = createSupabaseRealtimeGatewayFactory({
      bridge,
      WebSocketFactory: FakeRealtimeSocket,
      windowRef: null,
    });
    const session = gateway.createSession({ store });

    const joined = await session.joinRoundSession(hosted.inviteCode);

    expect(joined.source).toBe("supabase");
    expect(joined.round.inviteCode).toBe(hosted.inviteCode);
    expect(joined.round.players.some((player) => player.userId === currentUser.id)).toBe(true);
    expect(joined.group.members.some((member) => member.userId === currentUser.id)).toBe(true);
    expect(bridge.upsertLiveRoundSession).toHaveBeenCalledTimes(1);
    expect(bridge.broadcastRealtimeMessage).toHaveBeenCalledWith(
      expect.stringContaining(`gn-live-round:${hosted.inviteCode}`),
      "round-snapshot",
      expect.objectContaining({
        session: expect.objectContaining({
          inviteCode: hosted.inviteCode,
        }),
      })
    );
  });

  it("updates the host round player list immediately when a member-state event arrives", async () => {
    FakeRealtimeSocket.instances.length = 0;
    const state = createDefaultState();
    const store = createStore(state);

    store.setState((draft) => {
      const round = createRound({
        currentUser: draft.currentUser,
        courseName: "The Country Club at Golden Nugget",
        teeBox: "Gold",
        mode: "stroke",
        players: [draft.currentUser.displayName],
        syncTransport: "invite",
      });
      const hosted = hostRoundGroup({ state: draft, round });
      round.inviteCode = hosted.inviteCode;
      round.groupId = hosted.group.id;
      draft.rounds.unshift(round);
      draft.groups.unshift(hosted.group);
      draft.session.activeRoundId = round.id;
      return draft;
    });

    const bridge = createBridge();
    const gateway = createSupabaseRealtimeGatewayFactory({
      bridge,
      WebSocketFactory: FakeRealtimeSocket,
      windowRef: null,
    });
    const session = gateway.createSession({ store });
    const hostedRound = store.getState().rounds[0];

    await session.hostRoundSession(hostedRound.id);

    const socket = FakeRealtimeSocket.instances[0];
    socket.emit("message", {
      data: JSON.stringify({
        topic: `realtime:gn-live-round:${hostedRound.inviteCode}`,
        event: "broadcast",
        payload: {
          type: "broadcast",
          event: "member-state",
          payload: {
            inviteCode: hostedRound.inviteCode,
            member: {
              id: "member-joiner-1",
              playerId: "player-joiner-1",
              profileId: "profile-joiner-1",
              userId: "joiner-user-1",
              displayName: "Joiner Golfer",
              username: "@joiner",
              avatarLabel: "JG",
              role: "player",
              connectionState: "connected",
            },
          },
        },
      }),
    });

    const nextState = store.getState();
    expect(nextState.groups[0].members.some((member) => member.userId === "joiner-user-1")).toBe(true);
    expect(nextState.rounds[0].players.some((player) => player.userId === "joiner-user-1")).toBe(true);
    expect(nextState.rounds[0].holes[0].entries.some((entry) => entry.participantId === "player-joiner-1")).toBe(true);
  });

  it("reconciles the live room from Supabase when a join snapshot is persisted but a broadcast is missed", async () => {
    FakeRealtimeSocket.instances.length = 0;
    const intervals = [];
    const state = createDefaultState();
    const store = createStore(state);

    store.setState((draft) => {
      const round = createRound({
        currentUser: draft.currentUser,
        courseName: "The Country Club at Golden Nugget",
        teeBox: "Gold",
        mode: "stroke",
        players: [draft.currentUser.displayName],
        syncTransport: "invite",
      });
      const hosted = hostRoundGroup({ state: draft, round });
      round.inviteCode = hosted.inviteCode;
      round.groupId = hosted.group.id;
      draft.rounds.unshift(round);
      draft.groups.unshift(hosted.group);
      draft.session.activeRoundId = round.id;
      return draft;
    });

    const hostedRound = store.getState().rounds[0];
    const hostedGroup = store.getState().groups[0];
    const hydratedSession = toBackendLiveRoundSessionRecord({
      round: hostedRound,
      group: hostedGroup,
      userId: store.getState().currentUser.id,
      sessionId: hostedGroup.id,
    });

    const bridge = createBridge({
      fetchLiveRoundSessionByInviteCode: vi.fn(async () => ({
        session: hydratedSession,
        missingTable: false,
      })),
    });
    const gateway = createSupabaseRealtimeGatewayFactory({
      bridge,
      WebSocketFactory: FakeRealtimeSocket,
      windowRef: null,
      setIntervalFn: (fn, delay) => {
        intervals.push({ fn, delay });
        return intervals.length;
      },
      clearIntervalFn: () => {},
    });
    const session = gateway.createSession({ store });

    await session.hostRoundSession(hostedRound.id);

    hydratedSession.group_state.members.push({
      id: "member-joiner-2",
      playerId: "player-joiner-2",
      profileId: "profile-joiner-2",
      userId: "joiner-user-2",
      displayName: "Late Joiner",
      username: "@latejoiner",
      avatarLabel: "LJ",
      role: "player",
      connectionState: "connected",
    });
    hydratedSession.round_state.players.push({
      id: "player-joiner-2",
      profileId: "profile-joiner-2",
      userId: "joiner-user-2",
      name: "Late Joiner",
      displayName: "Late Joiner",
      username: "@latejoiner",
      avatarLabel: "LJ",
      role: "guest",
    });
    hydratedSession.round_state.holes.forEach((hole) => {
      hole.entries.push({
        participantId: "player-joiner-2",
        strokes: null,
        putts: null,
        penalties: 0,
        fairwayHit: false,
        gir: false,
        upAndDown: false,
        sandSave: false,
        updatedAt: null,
        lastEventId: null,
      });
    });
    hydratedSession.updated_at = new Date(Date.now() + 1000).toISOString();

    const reconcileInterval = intervals.find((entry) => entry.delay === 2500);
    await reconcileInterval.fn();

    const nextState = store.getState();
    expect(nextState.groups[0].members.some((member) => member.userId === "joiner-user-2")).toBe(true);
    expect(nextState.rounds[0].players.some((player) => player.userId === "joiner-user-2")).toBe(true);
  });

  it("switches realtime rooms cleanly when the same device joins a different invite code", async () => {
    FakeRealtimeSocket.instances.length = 0;
    const store = createStore(createDefaultState());
    const currentUser = store.getState().currentUser;

    const hostA = {
      id: "host-user-a",
      profileId: "profile-host-a",
      name: "Host A",
      displayName: "Host A",
      username: "@hosta",
      avatarLabel: "HA",
    };
    const roundA = createRound({
      currentUser: hostA,
      courseName: "Course A",
      teeBox: "Gold",
      mode: "stroke",
      players: [hostA.displayName],
      syncTransport: "invite",
    });
    const hostedA = hostRoundGroup({
      state: { groups: [], currentUser: hostA },
      round: roundA,
    });
    roundA.inviteCode = hostedA.inviteCode;
    roundA.groupId = hostedA.group.id;

    const hostB = {
      id: "host-user-b",
      profileId: "profile-host-b",
      name: "Host B",
      displayName: "Host B",
      username: "@hostb",
      avatarLabel: "HB",
    };
    const roundB = createRound({
      currentUser: hostB,
      courseName: "Course B",
      teeBox: "Gold",
      mode: "stroke",
      players: [hostB.displayName],
      syncTransport: "invite",
    });
    const hostedB = hostRoundGroup({
      state: { groups: [], currentUser: hostB },
      round: roundB,
    });
    roundB.inviteCode = hostedB.inviteCode;
    roundB.groupId = hostedB.group.id;

    const sessionsByCode = new Map([
      [hostedA.inviteCode, toBackendLiveRoundSessionRecord({ round: roundA, group: hostedA.group, userId: hostA.id, sessionId: hostedA.group.id })],
      [hostedB.inviteCode, toBackendLiveRoundSessionRecord({ round: roundB, group: hostedB.group, userId: hostB.id, sessionId: hostedB.group.id })],
    ]);

    const bridge = createBridge({
      fetchLiveRoundSessionByInviteCode: vi.fn(async (inviteCode) => ({
        session: sessionsByCode.get(inviteCode),
        missingTable: false,
      })),
    });
    const gateway = createSupabaseRealtimeGatewayFactory({
      bridge,
      WebSocketFactory: FakeRealtimeSocket,
      windowRef: null,
    });
    const session = gateway.createSession({ store });

    const joinedA = await session.joinRoundSession(hostedA.inviteCode);
    const joinedB = await session.joinRoundSession(hostedB.inviteCode);

    expect(joinedA.round.inviteCode).toBe(hostedA.inviteCode);
    expect(joinedB.round.inviteCode).toBe(hostedB.inviteCode);

    const socket = FakeRealtimeSocket.instances[0];
    const joinMessages = socket.sentMessages.filter((message) => message.event === "phx_join");
    const leaveMessages = socket.sentMessages.filter((message) => message.event === "phx_leave");

    expect(joinMessages.some((message) => message.topic === `realtime:gn-live-round:${hostedA.inviteCode}`)).toBe(true);
    expect(joinMessages.some((message) => message.topic === `realtime:gn-live-round:${hostedB.inviteCode}`)).toBe(true);
    expect(leaveMessages.some((message) => message.topic === `realtime:gn-live-round:${hostedA.inviteCode}`)).toBe(true);
    expect(store.getState().rounds.some((round) => round.inviteCode === hostedB.inviteCode)).toBe(true);
    expect(store.getState().rounds.some((round) => round.players.some((player) => player.userId === currentUser.id))).toBe(true);
  });
});
