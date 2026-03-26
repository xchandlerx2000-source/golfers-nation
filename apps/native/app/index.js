import React, { useEffect } from "react";
import { ActivityIndicator, Text } from "react-native";
import { Redirect } from "expo-router";
import { Screen } from "../src/components/Screen";
import { colors } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";

export default function IndexRoute() {
  const bootStatus = useAppStore((state) => state.bootStatus);
  const signedIn = useAppStore((state) => state.signedIn);
  const restoreSession = useAppStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  if (bootStatus !== "ready") {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.text }}>Restoring session...</Text>
      </Screen>
    );
  }

  return <Redirect href={signedIn ? "/(tabs)/home" : "/auth"} />;
}
