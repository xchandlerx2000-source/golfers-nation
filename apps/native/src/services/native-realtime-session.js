import { getNativeRuntimeConfig, hasNativeSupabaseConfig } from "../lib/runtime-config";
import { getNativeRealtimeAccessToken } from "./native-platform";

const CHANNEL_PREFIX = "gn-live-round";
const SOCKET_PROTOCOL_VERSION = "1.0.0";
const HEARTBEAT_INTERVAL_MS = 20_000;
const RECONNECT_DELAY_MS = 1_500;

function normalizeInviteCode(value = "") {
  return String(value || "").trim().toUpperCase();
}

function isReactNativeRuntime() {
  return typeof navigator !== "undefined" && navigator.product === "ReactNative";
}

function createRealtimeTopic(inviteCode = "") {
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

function createNativeRealtimeClient() {
  let socket = null;
  let socketReadyPromise = null;
  let heartbeatTimer = null;
  let reconnectTimer = null;
  let currentInviteCode = "";
  let currentTopic = "";
  let currentJoinRef = "";
  let currentHandlers = null;
  let currentDeviceId = "";
  let manualDisconnect = false;
  let refCounter = 0;
  const pendingReplies = new Map();

  function nextRef() {
    refCounter += 1;
    return String(refCounter);
  }

  function setStatus(status, notice = "") {
    if (typeof currentHandlers?.onStatus === "function") {
      currentHandlers.onStatus(status, notice);
    }
  }

  function cleanupPendingReplies() {
    pendingReplies.forEach((entry) => {
      clearTimeout(entry.timeoutId);
      entry.reject(new Error("Realtime request cancelled."));
    });
    pendingReplies.clear();
  }

  function sendSocketMessage(message) {
    if (!socket || socket.readyState !== 1) {
      return false;
    }

    socket.send(JSON.stringify(message));
    return true;
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function startHeartbeat() {
    if (heartbeatTimer) {
      return;
    }

    heartbeatTimer = setInterval(() => {
      sendSocketMessage({
        topic: "phoenix",
        event: "heartbeat",
        payload: {},
        ref: nextRef(),
      });
    }, HEARTBEAT_INTERVAL_MS);
  }

  function teardownSocket() {
    stopHeartbeat();
    cleanupPendingReplies();
    if (socket) {
      try {
        socket.close();
      } catch {
        // Ignore socket close failures during teardown.
      }
    }
    socket = null;
    socketReadyPromise = null;
    currentTopic = "";
    currentJoinRef = "";
  }

  function scheduleReconnect() {
    if (manualDisconnect || reconnectTimer || !currentInviteCode || !currentHandlers) {
      return;
    }

    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null;
      try {
        await client.connect({
          inviteCode: currentInviteCode,
          handlers: currentHandlers,
          deviceId: currentDeviceId,
          reconnecting: true,
        });
      } catch {
        scheduleReconnect();
      }
    }, RECONNECT_DELAY_MS);
  }

  function handleReply(message) {
    const ref = message.ref || "";
    if (!ref || !pendingReplies.has(ref)) {
      return false;
    }

    const pending = pendingReplies.get(ref);
    pendingReplies.delete(ref);
    clearTimeout(pending.timeoutId);

    if (message.payload?.status === "ok") {
      pending.resolve(message);
      return true;
    }

    pending.reject(new Error(message.payload?.response?.reason || "Realtime join failed."));
    return true;
  }

  function handleSocketMessage(rawMessage) {
    let message = null;

    try {
      message = JSON.parse(rawMessage.data);
    } catch {
      return;
    }

    if (!message) {
      return;
    }

    if (message.event === "phx_reply" && handleReply(message)) {
      return;
    }

    const broadcast = resolveBroadcastEnvelope(message);
    if (!broadcast?.name || !broadcast.payload) {
      return;
    }

    if (broadcast.payload.deviceId && broadcast.payload.deviceId === currentDeviceId) {
      return;
    }

    if (broadcast.name === "round-snapshot" && typeof currentHandlers?.onRoundSnapshot === "function") {
      currentHandlers.onRoundSnapshot(broadcast.payload);
      return;
    }

    if (broadcast.name === "member-state" && typeof currentHandlers?.onMemberState === "function") {
      currentHandlers.onMemberState(broadcast.payload);
    }
  }

  async function ensureSocket() {
    if (socket && socket.readyState === 1) {
      return socket;
    }

    if (socketReadyPromise) {
      return socketReadyPromise;
    }

    socketReadyPromise = new Promise((resolve, reject) => {
      const config = getNativeRuntimeConfig();
      const socketUrl = createRealtimeSocketUrl(config);
      if (!socketUrl || typeof WebSocket !== "function" || !hasNativeSupabaseConfig(config) || !isReactNativeRuntime()) {
        reject(new Error("Realtime transport is unavailable."));
        return;
      }

      socket = new WebSocket(socketUrl);
      socket.addEventListener("open", () => {
        startHeartbeat();
        resolve(socket);
      }, { once: true });
      socket.addEventListener("message", handleSocketMessage);
      socket.addEventListener("close", () => {
        socketReadyPromise = null;
        socket = null;
        stopHeartbeat();
        cleanupPendingReplies();
        setStatus("retry-needed", "Realtime connection dropped. Reconnecting...");
        scheduleReconnect();
      });
      socket.addEventListener("error", (error) => {
        reject(error);
      }, { once: true });
    });

    return socketReadyPromise;
  }

  function registerReply(ref) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        pendingReplies.delete(ref);
        reject(new Error("Realtime channel request timed out."));
      }, 6000);

      pendingReplies.set(ref, { resolve, reject, timeoutId });
    });
  }

  async function joinChannel(inviteCode, reconnecting = false) {
    const accessToken = await getNativeRealtimeAccessToken();
    const nextTopic = createRealtimeTopic(inviteCode);
    const joinRef = nextRef();
    const joined = registerReply(joinRef);

    sendSocketMessage({
      topic: nextTopic,
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
          private: false,
        },
        ...(accessToken ? { access_token: accessToken } : {}),
      },
      ref: joinRef,
      join_ref: joinRef,
    });

    await joined;
    currentTopic = nextTopic;
    currentJoinRef = joinRef;
    setStatus("connected", reconnecting ? "Realtime reconnected." : "Realtime connected.");
  }

  const client = {
    async connect({ inviteCode, handlers, deviceId, reconnecting = false }) {
      currentInviteCode = normalizeInviteCode(inviteCode);
      currentHandlers = handlers || null;
      currentDeviceId = String(deviceId || currentDeviceId || "");
      manualDisconnect = false;

      await ensureSocket();
      if (!currentInviteCode) {
        return;
      }

      if (currentTopic && currentTopic === createRealtimeTopic(currentInviteCode) && socket?.readyState === 1) {
        setStatus("connected", reconnecting ? "Realtime reconnected." : "Realtime connected.");
        return;
      }

      await joinChannel(currentInviteCode, reconnecting);
    },
    disconnect() {
      manualDisconnect = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      teardownSocket();
      currentInviteCode = "";
      currentHandlers = null;
      setStatus("idle", "");
    },
  };

  return client;
}

const nativeRealtimeClient = createNativeRealtimeClient();

export function connectNativeRealtimeSession(options) {
  return nativeRealtimeClient.connect(options);
}

export function disconnectNativeRealtimeSession() {
  nativeRealtimeClient.disconnect();
}
