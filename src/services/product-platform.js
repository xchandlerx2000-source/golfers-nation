import { createLocalAuthGateway, createSupabaseAuthGateway } from "./auth-gateway.js";
import { createLocalDataGateway, createSupabaseDataGateway } from "./data-gateway.js";
import { createLocalRealtimeGatewayFactory } from "./realtime-gateway.js";
import { getRuntimeConfig, hasSupabaseRuntimeConfig } from "./runtime-config.js";
import { createSupabaseRestBridge } from "./supabase-rest.js";

export function createProductPlatform({
  auth = null,
  data = null,
  realtime = createLocalRealtimeGatewayFactory(),
} = {}) {
  const runtimeConfig = getRuntimeConfig();
  const localAuth = createLocalAuthGateway();
  const localData = createLocalDataGateway();
  const supabaseBridge = hasSupabaseRuntimeConfig(runtimeConfig)
    ? createSupabaseRestBridge({ config: runtimeConfig })
    : null;
  const resolvedAuth = auth || (supabaseBridge ? createSupabaseAuthGateway({ bridge: supabaseBridge, fallback: localAuth }) : localAuth);
  const resolvedData = data || (supabaseBridge ? createSupabaseDataGateway({ bridge: supabaseBridge, fallback: localData }) : localData);

  return {
    auth: resolvedAuth,
    data: resolvedData,
    realtime,
    capabilities: {
      authMode: resolvedAuth.mode,
      dataMode: resolvedData.mode,
      realtimeMode: realtime.mode,
      backendReady: Boolean(resolvedAuth.backendReady && resolvedData.backendReady && realtime.backendReady),
      supabaseEnabled: Boolean(supabaseBridge?.isConfigured?.()),
    },
  };
}
