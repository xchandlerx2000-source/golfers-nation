import React, { useState } from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { Screen } from "../../src/components/Screen";
import { SectionHeader } from "../../src/components/SectionHeader";
import { colors, radii, spacing } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

export default function JoinRoundScreen() {
  const joinRound = useAppStore((state) => state.joinRound);
  const authNotice = useAppStore((state) => state.authNotice);
  const liveSyncNotice = useAppStore((state) => state.liveSyncNotice);
  const liveSyncStatus = useAppStore((state) => state.liveSyncStatus);
  const [code, setCode] = useState("");

  return (
    <Screen>
      <SectionHeader title="Join Game" subtitle="Enter a live code and go straight into the round." />
      <Card>
        <TextInput
          autoCapitalize="characters"
          placeholder="Invite code"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={code}
          onChangeText={setCode}
        />
        <AppButton
          label="Join"
          onPress={async () => {
            await joinRound(code);
            router.replace("/round/lobby");
          }}
        />
        {liveSyncStatus === "connecting" ? <Text style={styles.notice}>Joining live room...</Text> : null}
        {liveSyncNotice ? <Text style={styles.notice}>{liveSyncNotice}</Text> : null}
        {authNotice ? <Text style={styles.notice}>{authNotice}</Text> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  notice: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
