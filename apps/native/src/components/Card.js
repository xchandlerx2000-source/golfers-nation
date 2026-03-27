import React from "react";
import { StyleSheet, View } from "react-native";
import { radii, spacing, useAppTheme } from "../theme";

export function Card({ children, style }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.card, style]}>
      <View pointerEvents="none" style={styles.tint} />
      {children}
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  card: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.borderStrong,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: theme.colors.shadow,
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
    backgroundColor: theme.colors.primarySoft,
    opacity: 0.75,
  },
});
