import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../src/components/AppButton";
import { Card } from "../src/components/Card";
import { Screen } from "../src/components/Screen";
import { SectionHeader } from "../src/components/SectionHeader";
import { getNativeRuntimeConfig } from "../src/lib/runtime-config";
import { colors, radii, spacing } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";

export default function AuthScreen() {
  const signInDemo = useAppStore((state) => state.signInDemo);
  const signInWithEmail = useAppStore((state) => state.signInWithEmail);
  const signUpWithEmail = useAppStore((state) => state.signUpWithEmail);
  const requestPasswordReset = useAppStore((state) => state.requestPasswordReset);
  const authError = useAppStore((state) => state.authError);
  const authNotice = useAppStore((state) => state.authNotice);
  const authBusy = useAppStore((state) => state.authBusy);
  const runtimeConfig = getNativeRuntimeConfig();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Screen scroll>
      <SectionHeader title="Golfers Nation" subtitle="Use your cloud account for real rounds and synced requests." />

      <Card>
        <Text style={styles.title}>Cloud account</Text>
        <Text style={styles.copy}>Sign in with your own email to restore rounds, stats, and request history on this phone.</Text>
        <TextInput
          autoCapitalize="words"
          placeholder="Display name for new account"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          autoCapitalize="none"
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        {authError ? <Text style={styles.error}>{authError}</Text> : null}
        {authNotice ? <Text style={styles.notice}>{authNotice}</Text> : null}
        <View style={styles.actions}>
          <AppButton
            label={authBusy ? "Signing In..." : "Sign In"}
            disabled={authBusy}
            onPress={async () => {
              const result = await signInWithEmail({ email, password });
              if (!result?.error) {
                router.replace("/(tabs)/home");
              }
            }}
          />
          <AppButton
            label={authBusy ? "Creating..." : "Create Account"}
            variant="secondary"
            disabled={authBusy}
            onPress={async () => {
              const result = await signUpWithEmail({ email, password, displayName });
              if (result?.session?.currentUser) {
                router.replace("/(tabs)/home");
              }
            }}
          />
          <AppButton
            label="Reset Password"
            variant="secondary"
            disabled={authBusy}
            onPress={async () => {
              await requestPasswordReset(email);
            }}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.title}>Local tester</Text>
        <Text style={styles.copy}>Use this only for quick device checks. Cloud sync, real account history, and request persistence are stronger with email sign-in.</Text>
        <AppButton
          label="Continue Local"
          variant="secondary"
          disabled={authBusy}
          onPress={async () => {
            await signInDemo();
            router.replace("/(tabs)/home");
          }}
        />
      </Card>

      <Card>
        <Text style={styles.title}>Build</Text>
        <View style={styles.metaRows}>
          <Text style={styles.metaText}>Environment: {runtimeConfig.appEnv}</Text>
          <Text style={styles.metaText}>Channel: {runtimeConfig.releaseChannel}</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  copy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
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
  actions: {
    gap: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
  notice: {
    color: colors.textMuted,
    fontSize: 14,
  },
  metaRows: {
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
