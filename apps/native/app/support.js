import React, { useMemo, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { APP_VERSION, TESTER_FEEDBACK_AREAS } from "@golfers-nation/core";
import { AppButton } from "../src/components/AppButton";
import { Card } from "../src/components/Card";
import { Screen } from "../src/components/Screen";
import { SectionHeader } from "../src/components/SectionHeader";
import { getNativeRuntimeConfig } from "../src/lib/runtime-config";
import { colors, radii, spacing } from "../src/theme";
import { useAppStore } from "../src/store/useAppStore";

const FEEDBACK_RATINGS = [
  { id: "5", label: "5 / Great" },
  { id: "4", label: "4 / Good" },
  { id: "3", label: "3 / Okay" },
  { id: "2", label: "2 / Rough" },
  { id: "1", label: "1 / Broken" },
];

function ChoiceGroup({ title, options, selectedId, onSelect }) {
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

export default function SupportScreen() {
  const runtimeConfig = getNativeRuntimeConfig();
  const supportEmail = runtimeConfig.supportEmail || "support@golfersnation.app";
  const currentUser = useAppStore((state) => state.currentUser);
  const authMode = useAppStore((state) => state.authMode);
  const liveSyncStatus = useAppStore((state) => state.liveSyncStatus);
  const requestReviewQueueStatus = useAppStore((state) => state.requestReviewQueueStatus);
  const nearbyLocationStatus = useAppStore((state) => state.nearbyLocationStatus);
  const activeRound = useAppStore((state) => state.activeRound);
  const [testerName, setTesterName] = useState(currentUser?.displayName || "");
  const [contactEmail, setContactEmail] = useState(currentUser?.email || "");
  const [feedbackArea, setFeedbackArea] = useState("other");
  const [rating, setRating] = useState("3");
  const [message, setMessage] = useState("");

  const diagnostics = useMemo(() => ({
    appVersion: APP_VERSION,
    environment: runtimeConfig.appEnv,
    channel: runtimeConfig.releaseChannel,
    authMode,
    liveSyncStatus: liveSyncStatus || "idle",
    requestQueueStatus: requestReviewQueueStatus || "idle",
    nearbyLocationStatus: nearbyLocationStatus || "idle",
    roundContext: activeRound ? `${activeRound.courseName} / Hole ${activeRound.currentHole}` : "No active round",
  }), [
    activeRound,
    authMode,
    liveSyncStatus,
    nearbyLocationStatus,
    requestReviewQueueStatus,
    runtimeConfig.appEnv,
    runtimeConfig.releaseChannel,
  ]);

  async function openFeedbackEmail() {
    const body = [
      `Tester: ${testerName || "Unknown"}`,
      `Contact: ${contactEmail || "Not provided"}`,
      `Area: ${TESTER_FEEDBACK_AREAS.find((entry) => entry.id === feedbackArea)?.label || feedbackArea}`,
      `Rating: ${rating}`,
      "",
      "What happened:",
      message || "No message entered.",
      "",
      "Diagnostics:",
      `App version: ${diagnostics.appVersion}`,
      `Environment: ${diagnostics.environment}`,
      `Channel: ${diagnostics.channel}`,
      `Auth mode: ${diagnostics.authMode}`,
      `Live sync: ${diagnostics.liveSyncStatus}`,
      `Request queue: ${diagnostics.requestQueueStatus}`,
      `Nearby location: ${diagnostics.nearbyLocationStatus}`,
      `Round context: ${diagnostics.roundContext}`,
    ].join("\n");

    const subject = `Golfers Nation feedback / ${feedbackArea} / ${rating}`;

    try {
      await Linking.openURL(`mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    } catch {
      Alert.alert("Mail app unavailable", "Copy the support address and send feedback manually from this device.");
    }
  }

  return (
    <Screen scroll>
      <SectionHeader title="Support" subtitle="Help, feedback, and rollout support." />

      <Card>
        <Text style={styles.title}>Contact</Text>
        <Text style={styles.copy}>For app issues, testing feedback, or rollout bugs, use the support address below.</Text>
        <Text style={styles.meta}>{supportEmail}</Text>
        <AppButton
          label="Email Support"
          onPress={() => {
            void Linking.openURL(`mailto:${supportEmail}`);
          }}
        />
      </Card>

      <Card>
        <Text style={styles.title}>Tester Feedback</Text>
        <Text style={styles.copy}>This sends feedback with enough app context to debug real field issues instead of generic notes.</Text>
        <View style={styles.stack}>
          <TextInput
            autoCapitalize="words"
            placeholder="Tester name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={testerName}
            onChangeText={setTesterName}
          />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Contact email"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={contactEmail}
            onChangeText={setContactEmail}
          />
          <ChoiceGroup
            title="Feedback area"
            options={TESTER_FEEDBACK_AREAS}
            selectedId={feedbackArea}
            onSelect={setFeedbackArea}
          />
          <ChoiceGroup
            title="Overall feel"
            options={FEEDBACK_RATINGS}
            selectedId={rating}
            onSelect={setRating}
          />
          <TextInput
            multiline
            numberOfLines={4}
            placeholder="What happened, or what should change?"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.textarea]}
            value={message}
            onChangeText={setMessage}
          />
          <AppButton label="Send Tester Feedback" onPress={() => void openFeedbackEmail()} />
        </View>
      </Card>

      <Card>
        <Text style={styles.title}>Diagnostics Snapshot</Text>
        <View style={styles.stack}>
          <View style={styles.row}><Text style={styles.label}>App version</Text><Text style={styles.value}>{diagnostics.appVersion}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Environment</Text><Text style={styles.value}>{diagnostics.environment}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Channel</Text><Text style={styles.value}>{diagnostics.channel}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Auth mode</Text><Text style={styles.value}>{diagnostics.authMode}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Live sync</Text><Text style={styles.value}>{diagnostics.liveSyncStatus}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Request queue</Text><Text style={styles.value}>{diagnostics.requestQueueStatus}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Nearby location</Text><Text style={styles.value}>{diagnostics.nearbyLocationStatus}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Round</Text><Text style={styles.value}>{diagnostics.roundContext}</Text></View>
        </View>
      </Card>

      <Card>
        <Text style={styles.title}>Quick Paths</Text>
        <View style={styles.actions}>
          <AppButton label="Open Help" variant="secondary" onPress={() => router.push("/help")} />
          <AppButton label="Open Testing" variant="secondary" onPress={() => router.push("/testing")} />
          <AppButton label="Open Stats" variant="secondary" onPress={() => router.push("/stats")} />
        </View>
      </Card>

      <AppButton label="Back to Settings" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  copy: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  actions: {
    gap: spacing.md,
  },
  stack: {
    gap: spacing.sm,
  },
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    color: colors.textMuted,
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
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  choiceChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  choiceText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  choiceTextActive: {
    color: colors.text,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
});
