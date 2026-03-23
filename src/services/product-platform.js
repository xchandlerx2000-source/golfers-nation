import { createLocalAuthGateway, createSupabaseAuthGateway } from "./auth-gateway.js";
import { createLocalDataGateway, createSupabaseDataGateway } from "./data-gateway.js";
import { createLocalRealtimeGatewayFactory, createSupabaseRealtimeGatewayFactory } from "./realtime-gateway.js";
import { getRuntimeConfig, hasSupabaseRuntimeConfig } from "./runtime-config.js";
import { createSupabaseRestBridge } from "./supabase-rest.js";

export function createProductPlatform({
  auth = null,
  data = null,
  realtime = null,
} = {}) {
  const runtimeConfig = getRuntimeConfig();
  const localAuth = createLocalAuthGateway();
  const localData = createLocalDataGateway();
  const localRealtime = createLocalRealtimeGatewayFactory();
  const supabaseBridge = hasSupabaseRuntimeConfig(runtimeConfig)
    ? createSupabaseRestBridge({ config: runtimeConfig })
    : null;
  const resolvedAuth = auth || (supabaseBridge ? createSupabaseAuthGateway({ bridge: supabaseBridge, fallback: localAuth }) : localAuth);
  const resolvedData = data || (supabaseBridge ? createSupabaseDataGateway({ bridge: supabaseBridge, fallback: localData }) : localData);
  const resolvedRealtime = realtime || (supabaseBridge
    ? createSupabaseRealtimeGatewayFactory({ bridge: supabaseBridge, fallback: localRealtime })
    : localRealtime);

  return {
    auth: resolvedAuth,
    data: resolvedData,
    realtime: resolvedRealtime,
    capabilities: {
      authMode: resolvedAuth.mode,
      dataMode: resolvedData.mode,
      realtimeMode: resolvedRealtime.mode,
      backendReady: Boolean(resolvedAuth.backendReady && resolvedData.backendReady && resolvedRealtime.backendReady),
      supabaseEnabled: Boolean(supabaseBridge?.isConfigured?.()),
    },
  };
}
