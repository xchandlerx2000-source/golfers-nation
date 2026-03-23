export function describeLiveRoomFailure(result) {
  const code = String(result?.error?.code || result?.code || "");
  const message = String(result?.error?.message || result?.message || "");

  if (code === "missing_live_round_sessions_table") {
    return "Live rooms are not ready in Supabase yet. Create the public.live_round_sessions table first.";
  }

  if (code === "realtime_channel_join_failed") {
    return "Supabase Realtime rejected the room connection. Check Realtime public access or add authenticated realtime.messages policies.";
  }

  return message || "The live sync connection is not ready yet.";
}

export function publishLiveRoundUpdate(realtimeSession, roundId) {
  if (!roundId) {
    return;
  }

  return Promise.resolve(realtimeSession.publishRoundUpdate(roundId))
    .catch((error) => {
      console.warn("[Golfers Nation] Live round publish failed. Continuing with local-safe state.", error);
    });
}

export async function hostLiveRoundSession(realtimeSession, roundId) {
  if (!roundId || typeof realtimeSession.hostRoundSession !== "function") {
    return null;
  }

  try {
    return await realtimeSession.hostRoundSession(roundId);
  } catch (error) {
    console.warn("[Golfers Nation] Live host setup failed. Keeping the round on this device only.", error);
    return {
      error: {
        message: "Live hosting is unavailable right now.",
      },
    };
  }
}

export async function joinLiveRoundSession(realtimeSession, code, warningPrefix = "[Golfers Nation] Live join failed.") {
  if (!code || typeof realtimeSession.joinRoundSession !== "function") {
    return null;
  }

  try {
    return await realtimeSession.joinRoundSession(code);
  } catch (error) {
    console.warn(warningPrefix, error);
    return {
      error: {
        message: "Live join is unavailable right now.",
      },
    };
  }
}
