import { CONNECTION_COPY } from "../config.js";
import { createActivity } from "../domain/factories.js";
import { applyHoleUpdate, getLocalParticipantIds, getScoringParticipants } from "../domain/scoring.js";

export function createSyncService({ store }) {
  const clientId = `client-${Date.now()}`;
  let broadcastChannel = null;
  let simulationTimer = null;

  function init() {
    if ("BroadcastChannel" in window) {
      broadcastChannel = new BroadcastChannel("golfers-nation-sync");
      broadcastChannel.addEventListener("message", handleBroadcastMessage);
    }

    simulationTimer = window.setInterval(simulateRemoteProgress, 12000);
  }

  function teardown() {
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }

    if (simulationTimer) {
      clearInterval(simulationTimer);
      simulationTimer = null;
    }
  }

  function handleBroadcastMessage(event) {
    const payload = event.data;
    if (!payload || payload.clientId === clientId || payload.type !== "round-sync") {
      return;
    }

    store.setState((draft) => {
      const round = draft.rounds.find((item) => item.id === payload.roundId);
      if (!round) {
        return draft;
      }

      round.sync.lastEventAt = payload.at;
      round.sync.state = "connected";
      round.sync.note = "Cross-tab sync event received.";
      draft.social.activity.unshift(
        createActivity({
          type: "sync",
          message: `${round.courseName} received a shared update.`,
        })
      );
      draft.social.activity = draft.social.activity.slice(0, 16);
      return draft;
    }, { reason: "broadcast-received" });
  }

  function broadcastRoundUpdate(round) {
    if (!broadcastChannel) {
      return;
    }

    broadcastChannel.postMessage({
      type: "round-sync",
      clientId,
      roundId: round.id,
      at: Date.now(),
    });
  }

  function updateTransport(roundId, transport, stateLabel) {
    store.setState((draft) => {
      const round = draft.rounds.find((item) => item.id === roundId);
      if (!round) {
        return draft;
      }

      round.sync.transport = transport;
      round.sync.label = CONNECTION_COPY[transport] || CONNECTION_COPY.local;
      round.sync.state = stateLabel;
      round.sync.lastEventAt = Date.now();
      round.sync.note = "Sync transport changed through the current device sync layer.";

      const group = draft.groups.find((item) => item.roundId === roundId);
      if (group) {
        group.transport = transport;
        group.status = stateLabel;
        group.updatedAt = Date.now();
      }

      draft.social.activity.unshift(
        createActivity({
          type: "sync",
          message: `${round.courseName} is now using ${round.sync.label}.`,
        })
      );
      draft.social.activity = draft.social.activity.slice(0, 16);
      return draft;
    }, { reason: "transport-updated" });
  }

  function enableNearbyPrototype(roundId) {
    updateTransport(roundId, "nearby", "connected");
  }

  async function tryBluetoothPrototype(roundId) {
    if (!navigator.bluetooth) {
      updateTransport(roundId, "nearby", "connected");
      store.setState((draft) => {
        draft.social.activity.unshift(
          createActivity({
            type: "sync",
            message: "Browser Bluetooth is unavailable. Nearby sync stayed active instead.",
          })
        );
        draft.social.activity = draft.social.activity.slice(0, 16);
        return draft;
      }, { reason: "bluetooth-fallback" });
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
      });

      store.setState((draft) => {
        const round = draft.rounds.find((item) => item.id === roundId);
        if (!round) {
          return draft;
        }

        round.sync.transport = "bluetooth";
        round.sync.label = CONNECTION_COPY.bluetooth;
        round.sync.state = "connected";
        round.sync.lastEventAt = Date.now();
        round.sync.note = `${device.name || "Nearby device"} linked through browser Bluetooth.`;
        draft.social.activity.unshift(
          createActivity({
            type: "sync",
            message: `${device.name || "Nearby device"} linked for Bluetooth sync.`,
          })
        );
        draft.social.activity = draft.social.activity.slice(0, 16);
        return draft;
      }, { reason: "bluetooth-connected" });
    } catch (error) {
      updateTransport(roundId, "invite", "hosting");
      store.setState((draft) => {
        draft.social.activity.unshift(
          createActivity({
            type: "sync",
            message: "Bluetooth request canceled. Invite-code sync remains the primary path.",
          })
        );
        draft.social.activity = draft.social.activity.slice(0, 16);
        return draft;
      }, { reason: "bluetooth-canceled" });
    }
  }

  function notifyRoundUpdated(roundId) {
    const round = store.getState().rounds.find((item) => item.id === roundId);
    if (!round) {
      return;
    }

    broadcastRoundUpdate(round);
  }

  function simulateRemoteProgress() {
    const state = store.getState();
    const activeRound = state.rounds.find((round) => round.id === state.session.activeRoundId);
    if (!activeRound || activeRound.status !== "active" || activeRound.sync.transport === "local") {
      return;
    }

    const participants = getScoringParticipants(activeRound);
    const localIds = new Set(getLocalParticipantIds(activeRound, state.currentUser.id));
    const remoteParticipants = participants.filter((participant) => !localIds.has(participant.id));
    if (!remoteParticipants.length) {
      return;
    }

    const target = remoteParticipants[Math.floor(Math.random() * remoteParticipants.length)];
    const targetHole = activeRound.holes.find((hole) => {
      const entry = hole.entries.find((item) => item.participantId === target.id);
      return entry && (entry.strokes === null || entry.strokes === 0);
    });

    if (!targetHole) {
      return;
    }

    const par = targetHole.par;
    const strokes = par + [-1, 0, 0, 1][Math.floor(Math.random() * 4)];
    const putts = Math.max(1, Math.min(3, strokes - (par - 2)));

    store.setState((draft) => {
      const round = draft.rounds.find((item) => item.id === activeRound.id);
      if (!round) {
        return draft;
      }

      applyHoleUpdate(round, targetHole.number, target.id, {
        strokes,
        putts,
        fairwayHit: targetHole.par > 3 ? strokes <= par : false,
        gir: strokes <= par,
      });
      round.sync.lastEventAt = Date.now();

      const group = draft.groups.find((item) => item.roundId === round.id);
      if (group) {
        group.updatedAt = Date.now();
        group.feed.unshift(
          createActivity({
            type: "sync",
            message: `${target.name} updated hole ${targetHole.number}.`,
          })
        );
        group.feed = group.feed.slice(0, 12);
      }

      draft.social.activity.unshift(
        createActivity({
          type: "sync",
          message: `${target.name} posted a live update on hole ${targetHole.number}.`,
        })
      );
      draft.social.activity = draft.social.activity.slice(0, 16);
      return draft;
    }, { reason: "remote-progress" });
  }

  return {
    init,
    teardown,
    enableNearbyPrototype,
    tryBluetoothPrototype,
    notifyRoundUpdated,
    updateTransport,
  };
}
