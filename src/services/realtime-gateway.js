import { CONNECTION_COPY } from "../config.js";
import {
  appendRoundAction,
  applyRoundActionEvent,
  ensureRoundSyncScaffold,
  getPendingRoundEvents,
} from "../domain/round-sync.js";
import { toBackendLiveRoundSessionRecord, fromBackendLiveRoundSessionRecord } from "./backend-models.js";
import { createSyncService } from "./sync-service.js";
import { cloneData, uid } from "../utils/formatters.js";

const CHANNEL_PREFIX = "gn-live-round";
const SOCKET_PROTOCOL_VERSION = "1.0.0";
const HEARTBEAT_INTERVAL_MS = 20_000;
const RECONNECT_DELAY_MS = 1_500;

function now() {
  return Date.now();
}

function normalizeInviteCode(value = "") {
  return String(value || "").trim().toUpperCase();
}

function normalizeComparable(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9]+/g, "");
}

function createRealtimeTopic(inviteCode) {
  return `${CHANNEL_PREFIX}:${normalizeInviteCode(inviteCode)}`;
}

function createRealtimeSocketUrl(config = {}) {
  const supabaseUrl = String(config.supabaseUrl || "").trim();
  const supabaseAnonKey = String(config.supabaseAnonKey || "").trim();
  if (!supabaseUrl || !supabaseAnonKey) {
    return "";
  }

  const url = new URL(supabaseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/realtime/v1/websocket";
  url.search = "";
  url.searchParams.set("apikey", supabaseAnonKey);
  url.searchParams.set("vsn", SOCKET_PROTOCOL_VERSION);
  return url.toString();
}

function getRoundById(state, roundId) {
  return (state?.rounds || []).find((round) => round.id === roundId) || null;
}

function getGroupForRound(state, round) {
  if (!round) {
    return null;
  }

  return (state?.groups || []).find((group) =>
    group.roundId === round.id
      || (round.groupId && group.id === round.groupId)
      || (round.inviteCode && group.inviteCode === round.inviteCode)
  ) || null;
}

function markRoundConnected(round, {
  transport = "cloud",
  state = "connected",
  note = "Live round updates are flowing between connected devices.",
  at = now(),
} = {}) {
  ensureRoundSyncScaffold(round);
  round.sync.transport = transport;
  round.sync.label = CONNECTION_COPY[transport] || CONNECTION_COPY.cloud;
  round.sync.state = state;
  round.sync.lastEventAt = at;
  round.sync.note = note;
}

function createStrokeEntry(participantId) {
  return {
    participantId,
    strokes: null,
    putts: null,
    penalties: 0,
    fairwayHit: false,
    gir: false,
    upAndDown: false,
    sandSave: false,
    updatedAt: null,
    lastEventId: null,
  };
}

function createPlayerRecord(currentUser) {
  return {
    id: uid("player"),
    profileId: currentUser.profileId || null,
    userId: currentUser.id,
    name: currentUser.displayName || currentUser.name,
    displayName: currentUser.displayName || currentUser.name,
    username: currentUser.username || normalizeComparable(currentUser.displayName || currentUser.name),
    avatarLabel: currentUser.avatarLabel || "GN",
    role: "guest",
  };
}

function ensureMemberOnRound(round, member) {
  if (!round || !member) {
    return { participantId: null, added: false };
  }

  const normalizedName = normalizeComparable(member.displayName);
  const normalizedUsername = normalizeComparable(member.username);
  let participant = (round.players || []).find((player) =>
    player.id === member.playerId
      || player.userId === member.userId
      || player.profileId === member.profileId
  ) || null;

  if (!participant) {
    participant = (round.players || []).find((player) => {
      const playerName = normalizeComparable(player.displayName || player.name);
      const playerUsername = normalizeComparable(player.username);
      return (!player.userId && !player.profileId)
        && (playerName === normalizedName || (normalizedUsername && playerUsername === normalizedUsername));
    }) || null;
  }

  let added = false;

  if (!participant) {
    participant = {
      id: member.playerId || uid("player"),
      profileId: member.profileId || null,
      userId: member.userId || null,
      name: member.displayName || "Golfer",
      displayName: member.displayName || "Golfer",
      username: member.username || normalizeComparable(member.displayName || "golfer"),
      avatarLabel: member.avatarLabel || "GN",
      role: member.role === "host" ? "owner" : "guest",
    };
    round.players = Array.isArray(round.players) ? round.players : [];
    round.players.push(participant);
    added = true;

    if (round.mode === "stroke") {
      round.holes.forEach((hole) => {
        hole.entries = Array.isArray(hole.entries) ? hole.entries : [];
        hole.entries.push(createStrokeEntry(participant.id));
      });
    } else if (Array.isArray(round.sides) && round.sides.length) {
      const targetSide = [...round.sides].sort((left, right) => left.playerIds.length - right.playerIds.length)[0];
      if (targetSide) {
        targetSide.playerIds.push(participant.id);
        targetSide.playerNames = targetSide.playerIds
          .map((playerId) => round.players.find((player) => player.id === playerId)?.name || "")
          .filter(Boolean);
      }
    }
  }

  participant.id = member.playerId || participant.id;
  participant.profileId = member.profileId || participant.profileId || null;
  participant.userId = member.userId || participant.userId || null;
  participant.name = member.displayName || participant.name;
  participant.displayName = member.displayName || participant.displayName || participant.name;
  participant.username = member.username || participant.username;
  participant.avatarLabel = member.avatarLabel || participant.avatarLabel || "GN";

  if (Array.isArray(round.sides)) {
    round.sides.forEach((side) => {
      side.playerNames = side.playerIds
        .map((playerId) => round.players.find((player) => player.id === playerId)?.name || "")
        .filter(Boolean);
    });
  }

  return {
    participantId: participant.id,
    added,
  };
}

function ensureCurrentUserOnRound(round, group, currentUser) {
  if (!round || !currentUser?.id) {
    return { round, group, participantId: null, added: false };
  }

  const displayName = currentUser.displayName || currentUser.name;
  const normalizedName = normalizeComparable(displayName);
  const normalizedUsername = normalizeComparable(currentUser.username);
  let participant = (round.players || []).find((player) =>
    player.userId === currentUser.id || player.profileId === currentUser.profileId
  ) || null;

  if (!participant) {
    participant = (round.players || []).find((player) => {
      const playerName = normalizeComparable(player.displayName || player.name);
      const playerUsername = normalizeComparable(player.username);
      return (!player.userId && !player.profileId)
        && (playerName === normalizedName || (normalizedUsername && playerUsername === normalizedUsername));
    }) || null;
  }

  let added = false;

  if (!participant) {
    participant = createPlayerRecord(currentUser);
    round.players = Array.isArray(round.players) ? round.players : [];
    round.players.push(participant);
    added = true;

    if (round.mode === "stroke") {
      round.holes.forEach((hole) => {
        hole.entries = Array.isArray(hole.entries) ? hole.entries : [];
        hole.entries.push(createStrokeEntry(participant.id));
      });
    } else if (Array.isArray(round.sides) && round.sides.length) {
      const targetSide = [...round.sides].sort((left, right) => left.playerIds.length - right.playerIds.length)[0];
      if (targetSide) {
        targetSide.playerIds.push(participant.id);
        targetSide.playerNames = targetSide.playerIds
          .map((playerId) => round.players.find((player) => player.id === playerId)?.name || "")
          .filter(Boolean);
      }
    }
  }

  participant.userId = currentUser.id;
  participant.profileId = currentUser.profileId || participant.profileId || null;
  participant.name = displayName;
  participant.displayName = displayName;
  participant.username = currentUser.username || participant.username;
  participant.avatarLabel = currentUser.avatarLabel || participant.avatarLabel || "GN";

  if (Array.isArray(round.sides)) {
    round.sides.forEach((side) => {
      side.playerNames = side.playerIds
        .map((playerId) => round.players.find((player) => player.id === playerId)?.name || "")
        .filter(Boolean);
    });
  }

  if (group) {
    group.members = Array.isArray(group.members) ? group.members : [];
    let member = group.members.find((item) =>
      item.userId === currentUser.id || item.profileId === currentUser.profileId || item.playerId === participant.id
    ) || null;

    if (!member) {
      member = {
        id: uid("member"),
        playerId: participant.id,
        profileId: participant.profileId,
        userId: currentUser.id,
        displayName: participant.name,
        username: participant.username,
        avatarLabel: participant.avatarLabel,
        role: group.members.length ? "player" : "host",
        connectionState: "connected",
      };
      group.members.push(member);
    }

    member.playerId = participant.id;
    member.profileId = participant.profileId;
    member.userId = currentUser.id;
    member.displayName = participant.name;
    member.username = participant.username;
    member.avatarLabel = participant.avatarLabel;
    member.connectionState = "connected";
    group.updatedAt = now();
  }

  return {
    round,
    group,
    participantId: participant.id,
    added,
  };
}

function mergeIncomingRound(existingRound, incomingRound) {
  if (!existingRound) {
    return incomingRound;
  }

  const localPendingEvents = getPendingRoundEvents(existingRound).map((event) => cloneData(event));
  const mergedRound = incomingRound;

  localPendingEvents
    .sort((left, right) => (left.occurredAt || 0) - (right.occurredAt || 0))
    .forEach((event) => {
      if (mergedRound.eventLog?.some((entry) => entry.id === event.id)) {
        return;
      }

      const applied = applyRoundActionEvent(mergedRound, event);
      if (!applied.applied) {
        return;
      }

      appendRoundAction(mergedRound, cloneData(event));
    });

  return mergedRound;
}

function resolveBroadcastEnvelope(message) {
  if (!message || message.event !== "broadcast") {
    return null;
  }

  const envelope = message.payload || {};
  return {
    name: envelope.event || "",
    payload: envelope.payload || null,
  };
}

export function createLocalRealtimeGatewayFactory() {
  return {
    mode: "device-realtime-adapter",
    backendReady: true,
    createSession({ store }) {
      const service = createSyncService({ store });

      return {
        mode: "device-realtime-session",
        connect() {
          service.init();
        },
        disconnect() {
          service.teardown();
        },
        publishRoundUpdate(roundId) {
          service.notifyRoundUpdated(roundId);
        },
        enableNearbySync(roundId) {
          service.enableNearbyPrototype(roundId);
        },
        enableBluetoothSync(roundId) {
          return service.tryBluetoothPrototype(roundId);
        },
        updateTransport(roundId, transport, stateLabel) {
          service.updateTransport(roundId, transport, stateLabel);
        },
        async hostRoundSession() {
          return { status: "unsupported-local" };
        },
        async joinRoundSession() {
          return null;
        },
      };
    },
  };
}

export function createSupabaseRealtimeGatewayFactory({
  bridge,
  fallback = createLocalRealtimeGatewayFactory(),
  WebSocketFactory = typeof WebSocket === "function" ? WebSocket : null,
  setIntervalFn = typeof setInterval === "function" ? setInterval : null,
  clearIntervalFn = typeof clearInterval === "function" ? clearInterval : null,
  setTimeoutFn = typeof setTimeout === "function" ? setTimeout : null,
  clearTimeoutFn = typeof clearTimeout === "function" ? clearTimeout : null,
  windowRef = typeof window !== "undefined" ? window : null,
} = {}) {
  if (!bridge?.isConfigured?.() || !WebSocketFactory) {
    return fallback;
  }

  return {
    mode: "supabase-realtime-adapter",
    backendReady: true,
    createSession({ store }) {
      let socket = null;
      let heartbeatTimer = null;
      let reconnectTimer = null;
      let reconnectBound = false;
      let socketReadyPromise = null;
      let currentChannel = null;
      let currentJoinRef = null;
      let currentSessionMeta = null;
      let manualDisconnect = false;
      let refCounter = 0;
      const pendingReplies = new Map();
      const publishedEventIds = new Set();
      const localDeviceId = `realtime-device-${now()}`;

      async function getRealtimeAccessToken() {
        if (typeof bridge?.getActiveSession !== "function") {
          return "";
        }

        try {
          const active = await bridge.getActiveSession();
          return active?.session?.access_token || "";
        } catch (error) {
          return "";
        }
      }

      function nextRef() {
        refCounter += 1;
        return String(refCounter);
      }

      function setRoundRealtimeState(roundId, updater, reason = "realtime-state") {
        store.setState((draft) => {
          const round = getRoundById(draft, roundId);
          if (!round) {
            return draft;
          }

          updater(round, draft);
          return draft;
        }, { reason });
      }

      function cleanupPendingReplies() {
        pendingReplies.forEach((pending) => {
          if (pending.timeoutId && clearTimeoutFn) {
            clearTimeoutFn(pending.timeoutId);
          }
          pending.reject(new Error("Realtime channel closed before the request completed."));
        });
        pendingReplies.clear();
      }

      function teardownSocket() {
        if (heartbeatTimer && clearIntervalFn) {
          clearIntervalFn(heartbeatTimer);
          heartbeatTimer = null;
        }

        if (socket) {
          try {
            socket.close();
          } catch (error) {
            // Ignore socket close failures during teardown.
          }
        }

        socket = null;
        socketReadyPromise = null;
        currentChannel = null;
        currentJoinRef = null;
        cleanupPendingReplies();
      }

      function scheduleReconnect() {
        if (manualDisconnect || reconnectTimer || !currentSessionMeta || !setTimeoutFn) {
          return;
        }

        reconnectTimer = setTimeoutFn(async () => {
          reconnectTimer = null;
          try {
            await ensureChannel(currentSessionMeta);
            if (currentSessionMeta?.roundId) {
              await syncRoundSessionSnapshot(currentSessionMeta.roundId, {
                broadcast: true,
                eventName: "round-snapshot",
              });
            }
          } catch (error) {
            console.warn("[Golfers Nation] Realtime reconnect failed.", error);
            scheduleReconnect();
          }
        }, RECONNECT_DELAY_MS);
      }

      function sendSocketMessage(message) {
        if (!socket || socket.readyState !== 1) {
          return false;
        }

        socket.send(JSON.stringify(message));
        return true;
      }

      function startHeartbeat() {
        if (!setIntervalFn || heartbeatTimer) {
          return;
        }

        heartbeatTimer = setIntervalFn(() => {
          sendSocketMessage({
            topic: "phoenix",
            event: "heartbeat",
            payload: {},
            ref: nextRef(),
          });
        }, HEARTBEAT_INTERVAL_MS);
      }

      async function ensureSocket() {
        if (socket && socket.readyState === 1) {
          return socket;
        }

        if (socketReadyPromise) {
          return socketReadyPromise;
        }

        socketReadyPromise = new Promise((resolve, reject) => {
          const socketUrl = createRealtimeSocketUrl(bridge.config);
          socket = new WebSocketFactory(socketUrl);

          socket.addEventListener("open", () => {
            startHeartbeat();
            resolve(socket);
          }, { once: true });

          socket.addEventListener("message", handleSocketMessage);

          socket.addEventListener("close", () => {
            socketReadyPromise = null;
            socket = null;
            currentChannel = null;
            currentJoinRef = null;
            cleanupPendingReplies();
            scheduleReconnect();
          });

          socket.addEventListener("error", (error) => {
            reject(error);
          }, { once: true });
        });

        return socketReadyPromise;
      }

      function registerReply(ref, resolve, reject) {
        const timeoutId = setTimeoutFn
          ? setTimeoutFn(() => {
              pendingReplies.delete(ref);
              reject(new Error("Realtime channel request timed out."));
            }, 6_000)
          : null;

        pendingReplies.set(ref, { resolve, reject, timeoutId });
      }

      function leaveCurrentChannel() {
        if (!currentChannel || !currentJoinRef) {
          return;
        }

        sendSocketMessage({
          topic: currentChannel,
          event: "phx_leave",
          payload: {},
          ref: nextRef(),
          join_ref: currentJoinRef,
        });

        currentChannel = null;
        currentJoinRef = null;
      }

      async function joinChannel(meta) {
        await ensureSocket();

        const nextChannel = `realtime:${createRealtimeTopic(meta.inviteCode)}`;
        if (currentChannel === nextChannel && currentJoinRef) {
          return {
            channel: currentChannel,
            joinRef: currentJoinRef,
          };
        }

        if (currentChannel && currentChannel !== nextChannel) {
          leaveCurrentChannel();
        }

        const accessToken = await getRealtimeAccessToken();
        const attemptJoin = async (isPrivate) => {
          const joinRef = nextRef();

          const joined = new Promise((resolve, reject) => {
            registerReply(joinRef, resolve, reject);
          });

          sendSocketMessage({
            topic: nextChannel,
            event: "phx_join",
            payload: {
              config: {
                broadcast: {
                  ack: false,
                  self: true,
                },
                presence: {
                  enabled: false,
                },
                private: isPrivate,
              },
              ...(accessToken ? { access_token: accessToken } : {}),
            },
            ref: joinRef,
            join_ref: joinRef,
          });

          await joined;
          currentChannel = nextChannel;
          currentJoinRef = joinRef;
          return {
            channel: currentChannel,
            joinRef,
          };
        };

        try {
          return await attemptJoin(false);
        } catch (publicError) {
          if (!accessToken) {
            throw publicError;
          }

          try {
            return await attemptJoin(true);
          } catch (privateError) {
            throw new Error(
              "Realtime channel join failed. Check Supabase Realtime public access or add authenticated policies on realtime.messages."
            );
          }
        }
      }

      async function ensureChannel(meta) {
        currentSessionMeta = meta;
        return joinChannel(meta);
      }

      function handleSocketMessage(event) {
        let message = null;

        try {
          message = JSON.parse(event.data);
        } catch (error) {
          return;
        }

        if (!message) {
          return;
        }

        if (message.event === "phx_reply" && message.ref) {
          const pending = pendingReplies.get(message.ref);
          if (pending) {
            pendingReplies.delete(message.ref);
            if (pending.timeoutId && clearTimeoutFn) {
              clearTimeoutFn(pending.timeoutId);
            }

            if (message.payload?.status === "ok") {
              pending.resolve(message.payload?.response || {});
            } else {
              pending.reject(new Error(message.payload?.response?.reason || message.payload?.status || "Realtime join failed."));
            }
          }
          return;
        }

        const broadcast = resolveBroadcastEnvelope(message);
        if (!broadcast?.name || !broadcast.payload) {
          return;
        }

        if (broadcast.name === "round-event") {
          applyIncomingRoundEvent(broadcast.payload);
          return;
        }

        if (broadcast.name === "round-snapshot") {
          applyIncomingRoundSnapshot(broadcast.payload);
          return;
        }

        if (broadcast.name === "member-state") {
          applyIncomingMemberState(broadcast.payload);
        }
      }

      function applyIncomingMemberState(payload) {
        if (!payload?.inviteCode || !payload?.member) {
          return;
        }

        console.info("[Golfers Nation] Incoming member-state event received.", {
          inviteCode: payload.inviteCode,
          userId: payload.member.userId || null,
          profileId: payload.member.profileId || null,
        });

        store.setState((draft) => {
          const group = (draft.groups || []).find((entry) => entry.inviteCode === payload.inviteCode);
          const round = (draft.rounds || []).find((entry) =>
            entry.inviteCode === payload.inviteCode || (group && entry.id === group.roundId)
          );
          if (!group && !round) {
            return draft;
          }

          const beforeMemberCount = group?.members?.length || 0;
          const beforePlayerCount = round?.players?.length || 0;

          if (group) {
            group.members = Array.isArray(group.members) ? group.members : [];
          }
          let member = group?.members?.find((entry) =>
            entry.userId === payload.member.userId || entry.profileId === payload.member.profileId
          ) || null;

          if (!member) {
            member = {
              id: payload.member.id || uid("member"),
              playerId: payload.member.playerId || null,
              profileId: payload.member.profileId || null,
              userId: payload.member.userId || null,
              displayName: payload.member.displayName || "Golfer",
              username: payload.member.username || "",
              avatarLabel: payload.member.avatarLabel || "GN",
              role: payload.member.role || "player",
              connectionState: payload.member.connectionState || "connected",
            };
            group?.members?.push(member);
          } else {
            Object.assign(member, payload.member);
          }

          if (group) {
            group.updatedAt = now();
          }

          if (round) {
            ensureMemberOnRound(round, {
              ...payload.member,
              playerId: payload.member.playerId || member?.playerId || null,
            });
            markRoundConnected(round, {
              at: now(),
              note: `${payload.member.displayName || "A golfer"} joined the live round.`,
            });
          }

          console.info("[Golfers Nation] Host participant merge after member-state.", {
            inviteCode: payload.inviteCode,
            membersBefore: beforeMemberCount,
            membersAfter: group?.members?.length || 0,
            playersBefore: beforePlayerCount,
            playersAfter: round?.players?.length || 0,
          });
          return draft;
        }, { reason: "realtime-member-state" });
      }

      function applyIncomingRoundEvent(payload) {
        const incomingEvent = cloneData(payload?.event || null);
        if (!incomingEvent?.id || !payload?.roundId) {
          return;
        }

        console.info("[Golfers Nation] Incoming round-event received.", {
          inviteCode: payload.inviteCode || "",
          roundId: payload.roundId,
          eventId: incomingEvent.id,
          actionType: incomingEvent.actionType,
        });

        store.setState((draft) => {
          const round = getRoundById(draft, payload.roundId);
          if (!round) {
            return draft;
          }

          ensureRoundSyncScaffold(round);
          if (round.eventLog.some((entry) => entry.id === incomingEvent.id)) {
            markRoundConnected(round, {
              at: incomingEvent.occurredAt || now(),
            });
            return draft;
          }

          const applied = applyRoundActionEvent(round, incomingEvent);
          if (!applied.applied) {
            if (applied.reason === "missing-entry" && payload?.inviteCode) {
              void bridge.fetchLiveRoundSessionByInviteCode(payload.inviteCode)
                .then((response) => {
                  const session = fromBackendLiveRoundSessionRecord(response?.session);
                  if (session?.round) {
                    applyIncomingRoundSnapshot({
                      session: {
                        id: session.id,
                        inviteCode: session.inviteCode,
                        round: session.round,
                        group: session.group,
                        updatedAt: session.updatedAt,
                      },
                    });
                  }
                })
                .catch((error) => {
                  console.warn("[Golfers Nation] Failed to hydrate the latest live session after a missing-entry event.", error);
                });
            }
            return draft;
          }

          const storedEvent = {
            ...incomingEvent,
            syncState: "synced",
            syncedAt: payload.sentAt || now(),
            lastError: "",
          };

          round.eventLog.push(storedEvent);
          markRoundConnected(round, {
            at: incomingEvent.occurredAt || now(),
          });

          const group = getGroupForRound(draft, round);
          if (group) {
            group.updatedAt = now();
          }

          return draft;
        }, { reason: "realtime-round-event" });
      }

      function applyIncomingRoundSnapshot(payload) {
        const incoming = cloneData(payload?.session || null);
        if (!incoming?.round || !incoming?.inviteCode) {
          return;
        }

        console.info("[Golfers Nation] Incoming round-snapshot received.", {
          inviteCode: incoming.inviteCode,
          roundId: incoming.round?.id || null,
          sessionId: incoming.id || null,
        });

        store.setState((draft) => {
          const incomingRound = mergeIncomingRound(
            (draft.rounds || []).find((round) => round.id === incoming.round.id || round.inviteCode === incoming.inviteCode) || null,
            ensureRoundSyncScaffold(cloneData(incoming.round))
          );
          markRoundConnected(incomingRound, {
            at: incoming.updatedAt || now(),
          });

          const roundIndex = draft.rounds.findIndex((round) =>
            round.id === incomingRound.id || round.inviteCode === incoming.inviteCode
          );
          if (roundIndex >= 0) {
            draft.rounds[roundIndex] = incomingRound;
          } else {
            draft.rounds.unshift(incomingRound);
          }

          if (incoming.group) {
            const groupIndex = draft.groups.findIndex((group) =>
              group.id === incoming.group.id || group.inviteCode === incoming.inviteCode || group.roundId === incomingRound.id
            );
            if (groupIndex >= 0) {
              draft.groups[groupIndex] = cloneData(incoming.group);
            } else {
              draft.groups.unshift(cloneData(incoming.group));
            }
          }

          return draft;
        }, { reason: "realtime-round-snapshot" });
      }

      async function upsertLiveSessionFromRound(round, group, {
        broadcast = false,
        eventName = "round-snapshot",
      } = {}) {
        if (!round?.inviteCode) {
          return { status: "skipped" };
        }

        console.info("[Golfers Nation] Syncing live round session.", {
          inviteCode: round.inviteCode,
          roundId: round.id,
          broadcast,
          eventName,
        });

        const sessionRecord = toBackendLiveRoundSessionRecord({
          round,
          group,
          userId: store.getState().currentUser?.id || store.getState().auth?.activeUserId || null,
          sessionId: currentSessionMeta?.sessionId || group?.id || round.groupId || null,
        });

        const upsert = await bridge.upsertLiveRoundSession(sessionRecord);
        if (upsert?.error) {
          return upsert;
        }

        const liveSession = fromBackendLiveRoundSessionRecord(
          Array.isArray(upsert?.data) ? upsert.data[0] || sessionRecord : upsert?.data || sessionRecord
        ) || {
          id: sessionRecord.id,
          inviteCode: round.inviteCode,
          round,
          group,
          updatedAt: now(),
        };

        currentSessionMeta = {
          sessionId: liveSession.id,
          inviteCode: liveSession.inviteCode,
          roundId: liveSession.round?.id || round.id,
        };

        if (broadcast) {
          const topic = createRealtimeTopic(liveSession.inviteCode);
          const broadcastResult = await bridge.broadcastRealtimeMessage(topic, eventName, {
            session: {
              id: liveSession.id,
              inviteCode: liveSession.inviteCode,
              round: liveSession.round || round,
              group: liveSession.group || group,
              updatedAt: liveSession.updatedAt || now(),
            },
            deviceId: localDeviceId,
          });
          if (broadcastResult?.error) {
            return broadcastResult;
          }
        }

        return {
          status: upsert?.status || "synced",
          session: liveSession,
        };
      }

      async function syncRoundSessionSnapshot(roundId, options = {}) {
        const state = store.getState();
        const round = getRoundById(state, roundId);
        const group = getGroupForRound(state, round);
        return upsertLiveSessionFromRound(round, group, options);
      }

      async function publishRoundUpdate(roundId) {
        const state = store.getState();
        const round = getRoundById(state, roundId);
        if (!round?.inviteCode) {
          return;
        }

        const latestEvent = Array.isArray(round.eventLog) ? round.eventLog[round.eventLog.length - 1] || null : null;
        await ensureChannel({
          sessionId: currentSessionMeta?.sessionId || round.groupId || null,
          inviteCode: round.inviteCode,
          roundId: round.id,
        });

        if (!latestEvent || publishedEventIds.has(latestEvent.id)) {
          return;
        }

        const topic = createRealtimeTopic(round.inviteCode);
        const broadcastResult = await bridge.broadcastRealtimeMessage(topic, "round-event", {
          inviteCode: round.inviteCode,
          roundId: round.id,
          event: latestEvent,
          deviceId: localDeviceId,
          sentAt: now(),
        });

        if (broadcastResult?.error) {
          console.warn("[Golfers Nation] Realtime round update broadcast failed.", broadcastResult.error);
          setRoundRealtimeState(round.id, (draftRound) => {
            markRoundConnected(draftRound, {
              state: "retry-needed",
              note: "Live updates are safe on this phone and will retry when the connection returns.",
            });
          }, "realtime-broadcast-failed");
          return;
        }

        publishedEventIds.add(latestEvent.id);
        setRoundRealtimeState(round.id, (draftRound) => {
          markRoundConnected(draftRound, {
            state: "connected",
            note: "Live round changes are moving between connected phones.",
          });
        }, "realtime-broadcast-sent");
        await syncRoundSessionSnapshot(roundId, {
          broadcast: false,
        });
      }

      async function hostRoundSession(roundId) {
        const state = store.getState();
        const round = getRoundById(state, roundId);
        if (!round?.inviteCode) {
          return { error: { message: "Create an invite code before hosting this round.", code: "missing_invite_code" } };
        }

        const ensured = await syncRoundSessionSnapshot(roundId, {
          broadcast: false,
        });
        if (ensured?.status === "skipped-missing-table") {
          return {
            error: {
              code: "missing_live_round_sessions_table",
              message: "Supabase table public.live_round_sessions is missing. Run the multiplayer SQL setup first.",
            },
          };
        }
        if (ensured?.error) {
          return ensured;
        }

        try {
          await ensureChannel({
            sessionId: ensured.session?.id || round.groupId || null,
            inviteCode: round.inviteCode,
            roundId: round.id,
          });
          console.info("[Golfers Nation] Live host subscription ready.", {
            inviteCode: round.inviteCode,
            roundId: round.id,
            sessionId: ensured.session?.id || null,
          });
        } catch (error) {
          return {
            error: {
              code: "realtime_channel_join_failed",
              message: error?.message || "Realtime channel join failed.",
            },
          };
        }

        await syncRoundSessionSnapshot(roundId, {
          broadcast: true,
        });

        return {
          status: "hosted",
          inviteCode: round.inviteCode,
          sessionId: currentSessionMeta?.sessionId || ensured.session?.id || null,
        };
      }

      async function joinRoundSession(inviteCode) {
        const normalizedCode = normalizeInviteCode(inviteCode);
        if (!normalizedCode) {
          return null;
        }

        const response = await bridge.fetchLiveRoundSessionByInviteCode(normalizedCode);
        if (response?.error) {
          return response;
        }

        if (response?.missingTable) {
          return {
            error: {
              code: "missing_live_round_sessions_table",
              message: "Supabase table public.live_round_sessions is missing. Run the multiplayer SQL setup first.",
            },
          };
        }

        if (!response?.session) {
          return null;
        }

        const liveSession = fromBackendLiveRoundSessionRecord(response.session);
        if (!liveSession?.round) {
          return null;
        }

        console.info("[Golfers Nation] Live join resolved session.", {
          inviteCode: normalizedCode,
          sessionId: liveSession.id,
          roundId: liveSession.round?.id || null,
        });

        const round = ensureRoundSyncScaffold(cloneData(liveSession.round));
        const group = liveSession.group ? cloneData(liveSession.group) : null;
        const ensuredIdentity = ensureCurrentUserOnRound(round, group, store.getState().currentUser);
        markRoundConnected(round, {
          state: "connected",
          note: "This phone now has its own safe live copy of the shared round.",
        });

        currentSessionMeta = {
          sessionId: liveSession.id,
          inviteCode: liveSession.inviteCode,
          roundId: round.id,
        };

        try {
          await ensureChannel(currentSessionMeta);
          console.info("[Golfers Nation] Live join subscription ready.", {
            inviteCode: liveSession.inviteCode,
            roundId: round.id,
            participantAdded: ensuredIdentity.added,
          });
        } catch (error) {
          return {
            error: {
              code: "realtime_channel_join_failed",
              message: error?.message || "Realtime channel join failed.",
            },
          };
        }

        if (ensuredIdentity.added) {
          const joiningMember = group?.members?.find((member) => member.userId === store.getState().currentUser.id)
            || {
              id: uid("member"),
              playerId: ensuredIdentity.participantId,
              profileId: store.getState().currentUser.profileId,
              userId: store.getState().currentUser.id,
              displayName: store.getState().currentUser.displayName || store.getState().currentUser.name,
              username: store.getState().currentUser.username,
              avatarLabel: store.getState().currentUser.avatarLabel,
              role: "player",
              connectionState: "connected",
            };
          const topic = createRealtimeTopic(liveSession.inviteCode);
          await bridge.broadcastRealtimeMessage(topic, "member-state", {
            inviteCode: liveSession.inviteCode,
            member: joiningMember,
          });
          await upsertLiveSessionFromRound(round, group, {
            broadcast: true,
          });
        } else {
          const topic = createRealtimeTopic(liveSession.inviteCode);
          await bridge.broadcastRealtimeMessage(topic, "member-state", {
            inviteCode: liveSession.inviteCode,
            member: group?.members?.find((member) => member.userId === store.getState().currentUser.id)
              || {
                id: uid("member"),
                playerId: ensuredIdentity.participantId,
                profileId: store.getState().currentUser.profileId,
                userId: store.getState().currentUser.id,
                displayName: store.getState().currentUser.displayName || store.getState().currentUser.name,
                username: store.getState().currentUser.username,
                avatarLabel: store.getState().currentUser.avatarLabel,
                role: "player",
                connectionState: "connected",
              },
          });
        }

        return {
          source: "supabase",
          round,
          group,
          notice: `Joined ${round.courseName} via live invite code.`,
        };
      }

      function connect() {
        manualDisconnect = false;

        if (windowRef && !reconnectBound) {
          reconnectBound = true;
          if (typeof windowRef.addEventListener === "function") {
            windowRef.addEventListener("online", scheduleReconnect);
          }
        }

        const state = store.getState();
        const round = getRoundById(state, state.session?.activeRoundId);
        if (round?.inviteCode) {
          void ensureChannel({
            sessionId: round.groupId || null,
            inviteCode: round.inviteCode,
            roundId: round.id,
          }).catch((error) => {
            console.warn("[Golfers Nation] Realtime channel connect fell back to local-only mode.", error);
          });
        }
      }

      function disconnect() {
        manualDisconnect = true;
        if (reconnectTimer && clearTimeoutFn) {
          clearTimeoutFn(reconnectTimer);
          reconnectTimer = null;
        }
        teardownSocket();
      }

      function updateTransport(roundId, transport, stateLabel) {
        setRoundRealtimeState(roundId, (round) => {
          ensureRoundSyncScaffold(round);
          round.sync.transport = transport;
          round.sync.label = CONNECTION_COPY[transport] || CONNECTION_COPY.local;
          round.sync.state = stateLabel;
          round.sync.lastEventAt = now();
          round.sync.note = "Live round transport was updated from the current device.";
        }, "realtime-transport-updated");
      }

      function enableNearbySync(roundId) {
        updateTransport(roundId, "nearby", "connected");
      }

      async function enableBluetoothSync(roundId) {
        const canUseBluetooth = typeof navigator !== "undefined" && Boolean(navigator.bluetooth);
        updateTransport(roundId, canUseBluetooth ? "bluetooth" : "nearby", "connected");
      }

      return {
        mode: "supabase-realtime-session",
        connect,
        disconnect,
        publishRoundUpdate,
        enableNearbySync,
        enableBluetoothSync,
        updateTransport,
        hostRoundSession,
        joinRoundSession,
      };
    },
  };
}
