import { createSyncService } from "./sync-service.js";

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
      };
    },
  };
}
