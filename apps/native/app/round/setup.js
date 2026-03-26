import React, { useEffect, useMemo, useRef } from "react";
import { Alert, Linking, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { GAME_MODES, getLatestCourseTeeTimeRequest, getTeeTimeRequestStatusLabel } from "@golfers-nation/core";
import { getCourseTeeTimeAccess } from "@golfers-nation/course";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { Screen } from "../../src/components/Screen";
import { SectionHeader } from "../../src/components/SectionHeader";
import { colors, radii, spacing } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

function CourseResultRow({ course, selected, onPress }) {
  return (
    <View style={styles.courseResult}>
      <AppButton
        label={course.displayName}
        variant={selected ? "primary" : "secondary"}
        onPress={onPress}
      />
      <Text style={styles.courseMeta}>
        {course.city}, {course.state} | {course.teeBoxes?.[0]?.name || "Tee"} | {course.teeBoxes?.[0]?.rating ?? "--"}
      </Text>
    </View>
  );
}

export default function RoundSetupScreen() {
  const setup = useAppStore((state) => state.setup);
  const courseResults = useAppStore((state) => state.courseResults);
  const courseResultsStatus = useAppStore((state) => state.courseResultsStatus);
  const courseCatalogNotice = useAppStore((state) => state.courseCatalogNotice);
  const nearbyLocationStatus = useAppStore((state) => state.nearbyLocationStatus);
  const nearbyLocationNotice = useAppStore((state) => state.nearbyLocationNotice);
  const selectedCourse = useAppStore((state) => state.selectedCourse);
  const teeTimeRequests = useAppStore((state) => state.teeTimeRequests);
  const setCourseQuery = useAppStore((state) => state.setCourseQuery);
  const selectCourse = useAppStore((state) => state.selectCourse);
  const setSetupMode = useAppStore((state) => state.setSetupMode);
  const prepareCourseSetup = useAppStore((state) => state.prepareCourseSetup);
  const refreshCourseSearch = useAppStore((state) => state.refreshCourseSearch);
  const refreshNearbyCoursesFromLocation = useAppStore((state) => state.refreshNearbyCoursesFromLocation);
  const createSelectedCourseTeeTimeRequest = useAppStore((state) => state.createSelectedCourseTeeTimeRequest);
  const startSoloRound = useAppStore((state) => state.startSoloRound);
  const hostLiveRound = useAppStore((state) => state.hostLiveRound);
  const authNotice = useAppStore((state) => state.authNotice);
  const hasInitializedSearchRef = useRef(false);

  const formatCards = useMemo(() => Object.values(GAME_MODES), []);
  const teeTimeAccess = selectedCourse ? getCourseTeeTimeAccess(selectedCourse) : null;
  const latestTeeTimeRequest = selectedCourse?.id
    ? getLatestCourseTeeTimeRequest(teeTimeRequests, selectedCourse.id)
    : null;

  useEffect(() => {
    void prepareCourseSetup();
  }, [prepareCourseSetup]);

  useEffect(() => {
    if (!hasInitializedSearchRef.current) {
      hasInitializedSearchRef.current = true;
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      if (String(setup.courseQuery || "").trim()) {
        void refreshCourseSearch();
        return;
      }

      void prepareCourseSetup();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [prepareCourseSetup, refreshCourseSearch, setup.courseQuery]);

  return (
    <Screen scroll>
      <SectionHeader title="Start Round" subtitle="Pick a real course, choose format, then go solo or live." />

      <Card>
        <Text style={styles.groupTitle}>Choose course</Text>
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          placeholder="Search course, city, or state"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={setup.courseQuery}
          onChangeText={setCourseQuery}
        />
        <AppButton
          label={nearbyLocationStatus === "locating" ? "Locating..." : "Use My Location"}
          variant="secondary"
          disabled={nearbyLocationStatus === "locating"}
          onPress={() => {
            setCourseQuery("");
            void refreshNearbyCoursesFromLocation({ requestPermission: true, forceResults: true });
          }}
        />
        {courseResultsStatus === "loading" || courseResultsStatus === "searching" ? (
          <Text style={styles.statusLine}>
            {courseResultsStatus === "searching" ? "Searching expanded course catalog..." : "Loading nearby course picks..."}
          </Text>
        ) : null}
        {nearbyLocationNotice ? <Text style={styles.statusLine}>{nearbyLocationNotice}</Text> : null}
        {courseCatalogNotice ? <Text style={styles.notice}>{courseCatalogNotice}</Text> : null}
        <View style={styles.resultsList}>
          {courseResults.map((course) => (
            <CourseResultRow
              key={course.id}
              course={course}
              selected={selectedCourse?.id === course.id}
              onPress={() => {
                void selectCourse(course.id);
              }}
            />
          ))}
        </View>
      </Card>

      {selectedCourse ? (
        <Card>
          <Text style={styles.groupTitle}>Selected course</Text>
          <Text style={styles.selectedName}>{selectedCourse.displayName}</Text>
          <Text style={styles.selectedMeta}>
            {selectedCourse.city}, {selectedCourse.state} | {selectedCourse.teeBoxes?.[0]?.name || "Tee"} | Rating {selectedCourse.teeBoxes?.[0]?.rating ?? "--"}
          </Text>
          {teeTimeAccess?.mode === "external-link" && teeTimeAccess.url ? (
            <View style={styles.teeTimeBlock}>
              <Text style={styles.teeTimeMeta}>External booking</Text>
              <AppButton
                label={teeTimeAccess.label || "Book Tee Time"}
                variant="secondary"
                onPress={async () => {
                  try {
                    await Linking.openURL(teeTimeAccess.url);
                  } catch {
                    Alert.alert("Booking link unavailable", "This tee-time link could not be opened on this device.");
                  }
                }}
              />
            </View>
          ) : null}
          {teeTimeAccess?.mode === "request" ? (
            <View style={styles.teeTimeBlock}>
              <Text style={styles.teeTimeMeta}>Partner request</Text>
              <AppButton
                label={latestTeeTimeRequest ? "Request saved" : (teeTimeAccess.label || "Request Tee Time")}
                variant="secondary"
                disabled={Boolean(latestTeeTimeRequest && ["requested", "confirmed"].includes(latestTeeTimeRequest.status))}
                onPress={async () => {
                  await createSelectedCourseTeeTimeRequest();
                }}
              />
              <Text style={styles.teeTimeStatus}>
                {latestTeeTimeRequest
                  ? `${getTeeTimeRequestStatusLabel(latestTeeTimeRequest.status)} | ${latestTeeTimeRequest.desiredWindowLabel}`
                  : (teeTimeAccess.notes || "Save a local request until partner booking is wired live.")}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.groupTitle}>Pick format</Text>
        <View style={styles.formatGrid}>
          {formatCards.map((mode) => {
            const selected = setup.mode === mode.id;
            return (
              <View key={mode.id} style={styles.formatItem}>
                <AppButton
                  label={mode.label}
                  variant={selected ? "primary" : "secondary"}
                  onPress={() => setSetupMode(mode.id)}
                />
                <Text style={styles.formatMeta}>{mode.shortDescription}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.groupTitle}>Start</Text>
        <AppButton
          label="Solo Round"
          onPress={async () => {
            await startSoloRound();
            router.replace("/(tabs)/score");
          }}
        />
        <AppButton
          label="Live Round"
          variant="secondary"
          onPress={async () => {
            await hostLiveRound();
            router.replace("/round/lobby");
          }}
        />
        {authNotice ? <Text style={styles.notice}>{authNotice}</Text> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  groupTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  statusLine: {
    color: colors.textMuted,
    fontSize: 13,
  },
  resultsList: {
    gap: spacing.md,
  },
  courseResult: {
    gap: spacing.xs,
  },
  courseMeta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  selectedName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  selectedMeta: {
    color: colors.textMuted,
    fontSize: 14,
  },
  teeTimeBlock: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  teeTimeMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  teeTimeStatus: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  formatGrid: {
    gap: spacing.md,
  },
  formatItem: {
    gap: spacing.xs,
  },
  formatMeta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  notice: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
