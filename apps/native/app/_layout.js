import React, { useEffect } from "react";
import { AppState } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CrashBoundary } from "../src/components/CrashBoundary";
import { installNativeCrashHandlers } from "../src/services/native-crash-service";
import { useAppStore } from "../src/store/useAppStore";
import { AppThemeProvider, useAppTheme } from "../src/theme";

function ThemedRootLayout() {
  const revalidateSession = useAppStore((state) => state.revalidateSession);
  const resumeLiveRoundSession = useAppStore((state) => state.resumeLiveRoundSession);
  const theme = useAppTheme();

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
          return;
        }

        void resumeLiveRoundSession({ quiet: true });
      });
    });

    return () => {
      subscription.remove();
    };
  }, [revalidateSession, resumeLiveRoundSession]);

  return (
    <CrashBoundary onReset={() => router.replace("/")}>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      />
    </CrashBoundary>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <ThemedRootLayout />
    </AppThemeProvider>
  );
}
