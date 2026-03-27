import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { Screen } from "../../src/components/Screen";
import { SectionHeader } from "../../src/components/SectionHeader";
import { radii, spacing, useAppTheme } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

function normalizeInviteCode(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function mapSyncLabel(status) {
  switch (status) {
    case "connected":
      return "Connected";
    case "connecting":
      return "Joining";
    case "retry-needed":
      return "Retry needed";
    case "local-only":
      return "Local safe";
    default:
      return "Standby";
  }
}

export default function JoinRoundScreen() {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const joinRound = useAppStore((state) => state.joinRound);
  const authNotice = useAppStore((state) => state.authNotice);
  const liveSyncNotice = useAppStore((state) => state.liveSyncNotice);
  const liveSyncStatus = useAppStore((state) => state.liveSyncStatus);
  const recentInviteCode = useAppStore((state) => state.recentInviteCode);
  const joinedCode = useAppStore((state) => state.joinedCode);
  const [code, setCode] = useState(recentInviteCode || "");
  const [joinBusy, setJoinBusy] = useState(false);

  const cleanedCode = useMemo(() => normalizeInviteCode(code), [code]);
  const canJoin = cleanedCode.length >= 4 && !joinBusy;

  async function handleJoin(inviteCode) {
    const nextCode = normalizeInviteCode(inviteCode);
    if (nextCode.length < 4 || joinBusy) {
      return;
    }

    setJoinBusy(true);
    try {
      await joinRound(nextCode);
      router.replace("/round/lobby");
    } finally {
      setJoinBusy(false);
    }
  }

  return (
    <Screen scroll>
      <SectionHeader title="Join Game" subtitle="Use a live room code and drop straight into the lobby without extra setup." />

      <Card style={styles.heroCard}>
        <View style={styles.badgeRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Live Join</Text>
          </View>
          <View style={[styles.syncBadge, liveSyncStatus === "connected" ? styles.syncConnected : null]}>
            <Text style={styles.syncBadgeText}>{mapSyncLabel(liveSyncStatus)}</Text>
          </View>
        </View>
        <Text style={styles.title}>{joinedCode || recentInviteCode || "Enter a room code"}</Text>
        <Text style={styles.meta}>
          Codes are uppercase and fast to recover. Your most recent code stays here so rejoining does not start from zero.
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Recent</Text>
            <Text style={styles.heroStatValue}>{recentInviteCode || "None yet"}</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Status</Text>
            <Text style={styles.heroStatValue}>{mapSyncLabel(liveSyncStatus)}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.groupTitle}>Room code</Text>
        <TextInput
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
          keyboardType="ascii-capable"
          maxLength={8}
          placeholder="Enter invite code"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          value={code}
          onChangeText={(value) => setCode(normalizeInviteCode(value))}
        />
        <Text style={styles.helperText}>
          Four to eight characters works best. Spaces and punctuation are stripped automatically.
        </Text>
        <View style={styles.actionStack}>
          <AppButton
            label={joinBusy ? "Joining..." : "Join Room"}
            disabled={!canJoin}
            onPress={() => {
              void handleJoin(cleanedCode);
            }}
          />
          {recentInviteCode ? (
            <AppButton
              label={`Use ${recentInviteCode}`}
              variant="secondary"
              disabled={joinBusy}
              onPress={() => {
                setCode(recentInviteCode);
                void handleJoin(recentInviteCode);
              }}
            />
          ) : null}
        </View>
        {liveSyncStatus === "connecting" ? <Text style={styles.notice}>Joining live room...</Text> : null}
        {liveSyncNotice ? <Text style={styles.notice}>{liveSyncNotice}</Text> : null}
        {authNotice ? <Text style={styles.notice}>{authNotice}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.groupTitle}>What happens next</Text>
        <View style={styles.flowList}>
          <Text style={styles.flowItem}>1. The app resolves the code against the shared live round.</Text>
          <Text style={styles.flowItem}>2. If the room exists, you land in the lobby and realtime reconnect starts.</Text>
          <Text style={styles.flowItem}>3. If the backend is slow, the app keeps a local-safe copy so testing does not dead-end.</Text>
        </View>
      </Card>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  heroCard: {
    gap: spacing.lg,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: theme.colors.primarySoft,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  statusBadgeText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  syncBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  syncConnected: {
    backgroundColor: theme.isDark ? "rgba(52,208,123,0.16)" : "rgba(31,157,85,0.12)",
    borderColor: theme.isDark ? "rgba(52,208,123,0.45)" : "rgba(31,157,85,0.4)",
  },
  syncBadgeText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: "900",
  },
  meta: {
    color: theme.colors.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  heroStats: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  heroStat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  heroStatLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroStatValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  groupTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  input: {
    minHeight: 56,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surfaceMuted,
    color: theme.colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2,
  },
  helperText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  actionStack: {
    gap: spacing.md,
  },
  notice: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  flowList: {
    gap: spacing.sm,
  },
  flowItem: {
    color: theme.colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
});
