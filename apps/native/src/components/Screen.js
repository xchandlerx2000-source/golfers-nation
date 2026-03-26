import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { colors, spacing } from "../theme";

export function Screen({ children, scroll = false }) {
  const content = scroll
    ? (
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.fill}>
        {children}
      </ScrollView>
    )
    : <View style={styles.content}>{children}</View>;

  return <SafeAreaView style={styles.safe}>{content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fill: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
