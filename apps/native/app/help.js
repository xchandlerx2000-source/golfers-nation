import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../src/components/AppButton";
import { Card } from "../src/components/Card";
import { Screen } from "../src/components/Screen";
import { SectionHeader } from "../src/components/SectionHeader";
import { HELP_SECTIONS } from "../src/lib/help-content";
import { colors, radii, spacing } from "../src/theme";

export default function HelpScreen() {
  const [selectedSectionId, setSelectedSectionId] = useState(HELP_SECTIONS[0]?.id || "");
  const orderedSections = useMemo(() => {
    const selected = HELP_SECTIONS.find((section) => section.id === selectedSectionId) || HELP_SECTIONS[0];
    if (!selected) {
      return HELP_SECTIONS;
    }

    return [selected, ...HELP_SECTIONS.filter((section) => section.id !== selected.id)];
  }, [selectedSectionId]);

  return (
    <Screen scroll>
      <SectionHeader title="Help" subtitle="Short answers for the actual product flow." />

      <Card>
        <Text style={styles.title}>Quick Topics</Text>
        <View style={styles.jumpGrid}>
          {HELP_SECTIONS.map((section) => {
            const selected = section.id === selectedSectionId;
            return (
              <Pressable
                key={section.id}
                onPress={() => setSelectedSectionId(section.id)}
                style={[styles.jumpChip, selected ? styles.jumpChipActive : null]}
              >
                <Text style={[styles.jumpChipText, selected ? styles.jumpChipTextActive : null]}>
                  {section.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {orderedSections.map((section) => (
        <Card key={section.id}>
          <Text style={styles.title}>{section.title}</Text>
          <View style={styles.stack}>
            {section.items.map((item) => (
              <Text key={item} style={styles.copy}>{item}</Text>
            ))}
          </View>
        </Card>
      ))}

      <View style={styles.actions}>
        <AppButton label="Open Support" variant="secondary" onPress={() => router.push("/support")} />
        <AppButton label="Done" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  jumpGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  jumpChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  jumpChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  jumpChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  jumpChipTextActive: {
    color: colors.text,
  },
  stack: {
    gap: spacing.sm,
  },
  copy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.md,
  },
});
