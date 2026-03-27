import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, useAppTheme } from "../theme";

export function LiveStrip({
  live = false,
  connected = true,
  players = 1,
  format = "Strokes",
  statusLabel = "",
}) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const state = live ? "LIVE" : "LOCAL";
  const connection = statusLabel || (connected ? "Connected" : "Saved on this phone");

  return (
    <View style={styles.wrap}>
      <Text style={[styles.badge, live ? styles.liveBadge : styles.localBadge]}>{state}</Text>
      <Text style={styles.text}>{connection}</Text>
      <Text style={styles.dot}>|</Text>
      <Text style={styles.text}>{players} players</Text>
      <Text style={styles.dot}>|</Text>
      <Text style={styles.text}>{format}</Text>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badge: {
    fontWeight: "800",
    fontSize: 12,
  },
  liveBadge: {
    color: theme.colors.success,
  },
  localBadge: {
    color: theme.colors.primary,
  },
  text: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  dot: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});
