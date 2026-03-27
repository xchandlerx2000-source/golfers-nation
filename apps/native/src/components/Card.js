import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "../theme";

export function Card({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      <View pointerEvents="none" style={styles.tint} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 8,
  },
  tint: {
    position: "absolute",
    top: -40,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    opacity: 0.75,
  },
});
