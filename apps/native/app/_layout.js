import React, { useEffect } from "react";
import { AppState } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CrashBoundary } from "../src/components/CrashBoundary";
import { installNativeCrashHandlers } from "../src/services/native-crash-service";
import { useAppStore } from "../src/store/useAppStore";
import { colors } from "../src/theme";

export default function RootLayout() {
  const revalidateSession = useAppStore((state) => state.revalidateSession);

  useEffect(() => {
    installNativeCrashHandlers(() => {
      const state = useAppStore.getState();
      return {
        signedIn: state.signedIn,
        authMode: state.authMode,
        authHealthStatus: state.authHealthStatus,
        activeRoute: state.activeRound ? "round" : "home",
        hasLiveRound: Boolean(state.activeRound?.inviteCode),
      };
    });

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        return;
      }

      void revalidateSession({ quiet: true }).then((result) => {
        if (result?.expired) {
          router.replace("/auth");
        }
      });
    });

    return () => {
      subscription.remove();
    };
  }, [revalidateSession]);

  return (
    <CrashBoundary onReset={() => router.replace("/")}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </CrashBoundary>
  );
}
