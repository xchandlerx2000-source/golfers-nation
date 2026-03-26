import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { Screen } from "../../src/components/Screen";
import { SectionHeader } from "../../src/components/SectionHeader";
import { colors, spacing } from "../../src/theme";
import { SAMPLE_PLAYERS } from "../../src/lib/seed-state";
import { useAppStore } from "../../src/store/useAppStore";

function Section({ title, summary, open, onToggle, children }) {
  return (
    <Card>
      <Pressable onPress={onToggle} style={styles.sectionHeader}>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSummary}>{summary}</Text>
        </View>
        <Text style={styles.sectionToggle}>{open ? "−" : "+"}</Text>
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </Card>
  );
}

export default function CommunityScreen() {
  const activeRound = useAppStore((state) => state.activeRound);
  const recentInviteCode = useAppStore((state) => state.recentInviteCode);
  const [openSection, setOpenSection] = useState("join");

  return (
    <Screen scroll>
      <SectionHeader title="Community" subtitle="Join live games and keep your golf circle close." />

      <Section
        title="Join"
        summary={recentInviteCode ? `Recent code ${recentInviteCode}` : "Enter a code and go straight into the round"}
        open={openSection === "join"}
        onToggle={() => setOpenSection((value) => (value === "join" ? "" : "join"))}
      >
        <AppButton label="Join Game" onPress={() => router.push("/round/join")} />
        {activeRound?.inviteCode ? (
          <AppButton label="Open Live Round" variant="secondary" onPress={() => router.push("/round/lobby")} />
        ) : null}
      </Section>

      <Section
        title="Golf Circle"
        summary={`${SAMPLE_PLAYERS.length} golfers in the starter circle`}
        open={openSection === "friends"}
        onToggle={() => setOpenSection((value) => (value === "friends" ? "" : "friends"))}
      >
        {SAMPLE_PLAYERS.map((player) => (
          <View key={player.id} style={styles.personRow}>
            <View>
              <Text style={styles.personName}>{player.displayName}</Text>
              <Text style={styles.personMeta}>@{player.username}</Text>
            </View>
            <Text style={styles.personStatus}>Ready</Text>
          </View>
        ))}
      </Section>

      <Section
        title="Live Room"
        summary={activeRound ? activeRound.courseName : "No active round"}
        open={openSection === "live"}
        onToggle={() => setOpenSection((value) => (value === "live" ? "" : "live"))}
      >
        {activeRound ? (
          <>
            <Text style={styles.copy}>Invite code {activeRound.inviteCode || "Local"} • Hole {activeRound.currentHole}</Text>
            <AppButton label="Go to Score" onPress={() => router.push("/(tabs)/score")} />
          </>
        ) : (
          <Text style={styles.copy}>Start or join a live round to bring the shared room online.</Text>
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  sectionSummary: {
    color: colors.textMuted,
    fontSize: 13,
  },
  sectionToggle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 24,
  },
  sectionBody: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  personRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  personName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  personMeta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  personStatus: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "700",
  },
  copy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
