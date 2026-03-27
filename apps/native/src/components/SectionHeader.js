import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../theme";

export function SectionHeader({ title, subtitle = "" }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.eyebrow}>
        <Text style={styles.eyebrowText}>Golfers Nation</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  eyebrow: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.primarySoft,
  },
  eyebrowText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 420,
  },
});
