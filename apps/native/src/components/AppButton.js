import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../theme";

export function AppButton({ label, variant = "primary", onPress, disabled = false }) {
  const secondary = variant === "secondary";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        secondary ? styles.secondary : styles.primary,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.text, secondary ? styles.secondaryText : null]}>{label}</Text>
        {!secondary ? <Text style={styles.chevron}>></Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryPressed,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
  },
  secondary: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderStrong,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  secondaryText: {
    color: colors.textSoft,
  },
  chevron: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
});
