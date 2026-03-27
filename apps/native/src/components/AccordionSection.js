import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radii, spacing, useAppTheme } from "../theme";

export function AccordionSection({
  title,
  subtitle = "",
  defaultOpen = false,
  children,
  actions = null,
}) {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.section}>
      <Pressable onPress={() => setOpen((value) => !value)} style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.headerRight}>
          {actions}
          <View style={[styles.chevron, open ? styles.chevronOpen : null]}>
            <Text style={styles.chevronText}>{open ? "-" : "+"}</Text>
          </View>
        </View>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  section: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: radii.lg,
    backgroundColor: theme.colors.surfaceMuted,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chevronOpen: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  chevronText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 18,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
