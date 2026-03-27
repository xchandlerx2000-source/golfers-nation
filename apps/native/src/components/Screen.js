import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { colors, spacing } from "../theme";

export function Screen({ children, scroll = false }) {
  const content = scroll
    ? (
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        style={styles.fill}
      >
        {children}
      </ScrollView>
    )
    : <View style={styles.content}>{children}</View>;

  return (
    <SafeAreaView style={styles.safe}>
      <View pointerEvents="none" style={styles.backgroundChrome}>
        <View style={[styles.halo, styles.haloPrimary]} />
        <View style={[styles.halo, styles.haloAccent]} />
      </View>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    position: "relative",
    overflow: "hidden",
  },
  fill: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl * 3,
    gap: spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl * 3,
    gap: spacing.md,
  },
  backgroundChrome: {
    position: "absolute",
    inset: 0,
  },
  halo: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.22,
  },
  haloPrimary: {
    width: 240,
    height: 240,
    top: -88,
    right: -72,
    backgroundColor: colors.primary,
  },
  haloAccent: {
    width: 200,
    height: 200,
    bottom: -96,
    left: -56,
    backgroundColor: colors.accent,
    opacity: 0.1,
  },
});
