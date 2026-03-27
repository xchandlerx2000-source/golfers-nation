import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { radii, spacing, useAppTheme } from "../theme";

export function SectionHeader({ title, subtitle = "" }) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

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

const createStyles = (theme) => StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  eyebrow: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.primarySoft,
  },
  eyebrowText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: theme.colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 420,
  },
});
