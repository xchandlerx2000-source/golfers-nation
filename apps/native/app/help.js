import React from "react";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "../src/components/AppButton";
import { Card } from "../src/components/Card";
import { Screen } from "../src/components/Screen";
import { SectionHeader } from "../src/components/SectionHeader";
import { HELP_SECTIONS } from "../src/lib/help-content";
import { colors, spacing } from "../src/theme";

export default function HelpScreen() {
  return (
    <Screen scroll>
      <SectionHeader title="Help" subtitle="Short answers for the actual product flow." />
      {HELP_SECTIONS.map((section) => (
        <Card key={section.id}>
          <Text style={styles.title}>{section.title}</Text>
          <View style={styles.stack}>
            {section.items.map((item) => (
              <Text key={item} style={styles.copy}>{item}</Text>
            ))}
          </View>
        </Card>
      ))}
      <AppButton label="Done" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  stack: {
    gap: spacing.sm,
  },
  copy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
