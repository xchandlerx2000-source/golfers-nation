import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../src/components/AppButton";
import { Card } from "../src/components/Card";
import { Screen } from "../src/components/Screen";
import { SectionHeader } from "../src/components/SectionHeader";
import { getNativeRuntimeConfig } from "../src/lib/runtime-config";
import { colors, spacing } from "../src/theme";

export default function SupportScreen() {
  const runtimeConfig = getNativeRuntimeConfig();
  const supportEmail = runtimeConfig.supportEmail || "support@golfersnation.app";

  return (
    <Screen scroll>
      <SectionHeader title="Support" subtitle="Help, feedback, and rollout support." />

      <Card>
        <Text style={styles.title}>Contact</Text>
        <Text style={styles.copy}>For app issues, testing feedback, or rollout bugs, use the support address below.</Text>
        <Text style={styles.meta}>{supportEmail}</Text>
        <AppButton
          label="Email Support"
          onPress={() => {
            void Linking.openURL(`mailto:${supportEmail}`);
          }}
        />
      </Card>

      <Card>
        <Text style={styles.title}>Quick Paths</Text>
        <View style={styles.actions}>
          <AppButton label="Open Help" variant="secondary" onPress={() => router.push("/help")} />
          <AppButton label="Open Testing" variant="secondary" onPress={() => router.push("/testing")} />
          <AppButton label="Open Stats" variant="secondary" onPress={() => router.push("/stats")} />
        </View>
      </Card>

      <Card>
        <Text style={styles.title}>What to report</Text>
        <View style={styles.stack}>
          <Text style={styles.copy}>Exact steps that caused the issue.</Text>
          <Text style={styles.copy}>Invite code, course, and whether it was live or solo.</Text>
          <Text style={styles.copy}>The exact error text if one was shown.</Text>
        </View>
      </Card>

      <AppButton label="Back to Settings" variant="secondary" onPress={() => router.back()} />
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
  meta: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  actions: {
    gap: spacing.md,
  },
  stack: {
    gap: spacing.sm,
  },
});
