import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { APP_VERSION } from "@golfers-nation/core";
import { AppButton } from "../src/components/AppButton";
import { Card } from "../src/components/Card";
import { Screen } from "../src/components/Screen";
import { SectionHeader } from "../src/components/SectionHeader";
import {
  APPEARANCE_MODE_OPTIONS,
  PROFILE_VISIBILITY_OPTIONS,
  TEXT_SCALE_OPTIONS,
  THEME_PRESET_OPTIONS,
  formatProfileVisibilityLabel,
  formatSubscriptionLabel,
  normalizeCurrentUser,
} from "../src/lib/account-state";
import { getNativeRuntimeConfig } from "../src/lib/runtime-config";
import { radii, spacing, useAppTheme } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";

function SettingRow({ label, value, styles }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function ChoiceGroup({ title, options, selectedId, onSelect, styles }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{title}</Text>
      <View style={styles.choiceWrap}>
        {options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <Pressable
              key={option.id}
              onPress={() => onSelect(option.id)}
              style={[styles.choiceChip, selected ? styles.choiceChipActive : null]}
            >
              <Text style={[styles.choiceText, selected ? styles.choiceTextActive : null]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ToggleRow({ label, value, onValueChange, styles, theme }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={theme.colors.text}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const signOut = useAppStore((state) => state.signOut);
  const revalidateSession = useAppStore((state) => state.revalidateSession);
  const authMode = useAppStore((state) => state.authMode);
  const sessionRestoredFrom = useAppStore((state) => state.sessionRestoredFrom);
  const liveSyncStatus = useAppStore((state) => state.liveSyncStatus);
  const authHealthStatus = useAppStore((state) => state.authHealthStatus);
  const requestReviewQueueStatus = useAppStore((state) => state.requestReviewQueueStatus);
  const nearbyLocationStatus = useAppStore((state) => state.nearbyLocationStatus);
  const sessionExpiresAt = useAppStore((state) => state.sessionExpiresAt);
  const lastAuthCheckAt = useAppStore((state) => state.lastAuthCheckAt);
  const currentUser = useAppStore((state) => normalizeCurrentUser(state.currentUser || {}));
  const updateCurrentUserAppearance = useAppStore((state) => state.updateCurrentUserAppearance);
  const updateCurrentUserPrivacy = useAppStore((state) => state.updateCurrentUserPrivacy);
  const runtimeConfig = getNativeRuntimeConfig();

  return (
    <Screen scroll>
      <SectionHeader title="Settings" subtitle="Account, appearance, privacy, and support tools." />

      <Card>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingRow label="Mode" value={authMode === "supabase" ? "Cloud account" : "Local tester"} styles={styles} />
        <SettingRow label="Email" value={currentUser.email || "Not connected"} styles={styles} />
        <SettingRow label="Provider" value={currentUser.provider || "email"} styles={styles} />
        <SettingRow label="Plan" value={formatSubscriptionLabel(currentUser.subscription)} styles={styles} />
        <SettingRow label="Visibility" value={formatProfileVisibilityLabel(currentUser.privacy?.profileVisibility)} styles={styles} />
        <SettingRow label="Session source" value={sessionRestoredFrom || "Fresh launch"} styles={styles} />
        <SettingRow label="Session health" value={authHealthStatus || "idle"} styles={styles} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <ChoiceGroup
          title="Color mode"
          options={APPEARANCE_MODE_OPTIONS}
          selectedId={currentUser.appearance.colorMode}
          onSelect={(id) => updateCurrentUserAppearance({ colorMode: id })}
          styles={styles}
        />
        <ChoiceGroup
          title="Theme"
          options={THEME_PRESET_OPTIONS}
          selectedId={currentUser.appearance.themeId}
          onSelect={(id) => updateCurrentUserAppearance({ themeId: id })}
          styles={styles}
        />
        <ChoiceGroup
          title="Text size"
          options={TEXT_SCALE_OPTIONS}
          selectedId={currentUser.appearance.textScale}
          onSelect={(id) => updateCurrentUserAppearance({ textScale: id })}
          styles={styles}
        />
        <ToggleRow
          label="Compact score surfaces"
          value={currentUser.appearance.compactMode === true}
          onValueChange={(value) => updateCurrentUserAppearance({ compactMode: value })}
          styles={styles}
          theme={theme}
        />
        <ToggleRow
          label="High contrast"
          value={currentUser.appearance.contrastMode === "high"}
          onValueChange={(value) => updateCurrentUserAppearance({ contrastMode: value ? "high" : "standard" })}
          styles={styles}
          theme={theme}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <ChoiceGroup
          title="Profile visibility"
          options={PROFILE_VISIBILITY_OPTIONS}
          selectedId={currentUser.privacy.profileVisibility}
          onSelect={(id) => updateCurrentUserPrivacy({ profileVisibility: id })}
          styles={styles}
        />
        <ToggleRow
          label="Show home course"
          value={currentUser.privacy.showHomeCourse === true}
          onValueChange={(value) => updateCurrentUserPrivacy({ showHomeCourse: value })}
          styles={styles}
          theme={theme}
        />
        <ToggleRow
          label="Show handicap"
          value={currentUser.privacy.showHandicap === true}
          onValueChange={(value) => updateCurrentUserPrivacy({ showHandicap: value })}
          styles={styles}
          theme={theme}
        />
        <ToggleRow
          label="Show bio"
          value={currentUser.privacy.showBio === true}
          onValueChange={(value) => updateCurrentUserPrivacy({ showBio: value })}
          styles={styles}
          theme={theme}
        />
        <ToggleRow
          label="Show recent form"
          value={currentUser.privacy.showRecentForm === true}
          onValueChange={(value) => updateCurrentUserPrivacy({ showRecentForm: value })}
          styles={styles}
          theme={theme}
        />
        <ToggleRow
          label="Show head-to-head"
          value={currentUser.privacy.showHeadToHead === true}
          onValueChange={(value) => updateCurrentUserPrivacy({ showHeadToHead: value })}
          styles={styles}
          theme={theme}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>App</Text>
        <SettingRow label="Version" value={APP_VERSION} styles={styles} />
        <SettingRow label="Environment" value={runtimeConfig.appEnv} styles={styles} />
        <SettingRow label="Channel" value={runtimeConfig.releaseChannel} styles={styles} />
        <SettingRow label="Live sync" value={liveSyncStatus || "idle"} styles={styles} />
        <SettingRow label="Request queue" value={requestReviewQueueStatus || "idle"} styles={styles} />
        <SettingRow label="Nearby location" value={nearbyLocationStatus || "idle"} styles={styles} />
        <SettingRow label="Session expiry" value={sessionExpiresAt ? new Date(sessionExpiresAt).toLocaleString() : "Not set"} styles={styles} />
        <SettingRow label="Last auth check" value={lastAuthCheckAt ? new Date(lastAuthCheckAt).toLocaleString() : "Not checked"} styles={styles} />
        <SettingRow label="Support" value={runtimeConfig.supportEmail || "support@golfersnation.app"} styles={styles} />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Support</Text>
        <Text style={styles.note}>Help covers the product flow. Testing covers diagnostics. Support is for actual issue reporting.</Text>
        <View style={styles.actions}>
          <AppButton label="Open Help" variant="secondary" onPress={() => router.push("/help")} />
          <AppButton label="Open Support" variant="secondary" onPress={() => router.push("/support")} />
          <AppButton label="Open Testing" variant="secondary" onPress={() => router.push("/testing")} />
        </View>
      </Card>

      <View style={styles.actions}>
        <AppButton label="Refresh Session" variant="secondary" onPress={() => revalidateSession()} />
        <AppButton label="Back to Profile" variant="secondary" onPress={() => router.back()} />
        <AppButton
          label="Sign Out"
          variant="secondary"
          onPress={async () => {
            await signOut();
            router.replace("/auth");
          }}
        />
      </View>
    </Screen>
  );
}

const createStyles = (theme) => StyleSheet.create({
  sectionTitle: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  value: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  note: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: spacing.md,
  },
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  choiceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceMuted,
  },
  choiceChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  choiceText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  choiceTextActive: {
    color: theme.colors.text,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  toggleLabel: {
    color: theme.colors.text,
    fontSize: 14,
    flex: 1,
  },
});
