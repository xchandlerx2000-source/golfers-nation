import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { GAME_MODES, getLatestCourseTeeTimeRequest, getTeeTimeRequestStatusLabel } from "@golfers-nation/core";
import { getCourseTeeTimeAccess } from "@golfers-nation/course";
import { AppButton } from "../../src/components/AppButton";
import { Card } from "../../src/components/Card";
import { Screen } from "../../src/components/Screen";
import { SectionHeader } from "../../src/components/SectionHeader";
import { colors, radii, spacing } from "../../src/theme";
import { useAppStore } from "../../src/store/useAppStore";

const COURSE_BROWSE_MODES = [
  { id: "nearby", label: "Nearby" },
  { id: "recent", label: "Recent" },
  { id: "search", label: "Search" },
];

const SETUP_STEPS = [
  { id: "course", label: "Course" },
  { id: "format", label: "Format" },
  { id: "play", label: "Play" },
];

function mapSourceLabel(source = "") {
  switch (source) {
    case "device-nearby":
      return "Phone location";
    case "cached-location-nearby":
      return "Saved location";
    case "recent-only":
      return "Recent rounds";
    case "starter-recent":
      return "Featured picks";
    case "discovery-cache":
      return "Nationwide search";
    case "starter-search":
      return "Bundled search";
    default:
      return "Course picks";
  }
}

function StepChip({ label, active, complete, onPress, disabled = false }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.stepChip,
        active ? styles.stepChipActive : null,
        complete ? styles.stepChipComplete : null,
        disabled ? styles.stepChipDisabled : null,
      ]}
    >
      <Text style={[styles.stepChipText, active || complete ? styles.stepChipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function CourseBrowseChip({ label, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.browseChip, selected ? styles.browseChipActive : null]}>
      <Text style={[styles.browseChipText, selected ? styles.browseChipTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function CourseResultRow({ course, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.courseRow, selected ? styles.courseRowActive : null]}>
      <View style={styles.courseRowHeader}>
        <View style={styles.courseCopy}>
          <Text style={styles.courseName}>{course.displayName}</Text>
          <Text style={styles.courseMeta}>{[course.city, course.state].filter(Boolean).join(", ") || "Course location"}</Text>
        </View>
        {selected ? (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>Selected</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.courseStats}>
        <Text style={styles.courseStat}>Tee {course.teeBoxes?.[0]?.name || "Default"}</Text>
        <Text style={styles.courseStat}>Rating {course.teeBoxes?.[0]?.rating ?? "--"}</Text>
        <Text style={styles.courseStat}>Slope {course.teeBoxes?.[0]?.slope ?? "--"}</Text>
      </View>
    </Pressable>
  );
}

function FormatCard({ mode, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.formatCard, selected ? styles.formatCardActive : null]}>
      <View style={styles.formatHeader}>
        <Text style={[styles.formatTitle, selected ? styles.formatTitleActive : null]}>{mode.label}</Text>
        {selected ? (
          <View style={styles.formatBadge}>
            <Text style={styles.formatBadgeText}>Selected</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.formatMeta}>{mode.shortDescription}</Text>
    </Pressable>
  );
}

export default function RoundSetupScreen() {
  const setup = useAppStore((state) => state.setup);
  const courseResults = useAppStore((state) => state.courseResults);
  const courseResultsStatus = useAppStore((state) => state.courseResultsStatus);
  const courseResultsSource = useAppStore((state) => state.courseResultsSource);
  const courseCatalogNotice = useAppStore((state) => state.courseCatalogNotice);
  const nearbyLocationStatus = useAppStore((state) => state.nearbyLocationStatus);
  const nearbyLocationNotice = useAppStore((state) => state.nearbyLocationNotice);
  const selectedCourse = useAppStore((state) => state.selectedCourse);
  const teeTimeRequests = useAppStore((state) => state.teeTimeRequests);
  const setCourseQuery = useAppStore((state) => state.setCourseQuery);
  const selectCourse = useAppStore((state) => state.selectCourse);
  const setSetupMode = useAppStore((state) => state.setSetupMode);
  const prepareCourseSetup = useAppStore((state) => state.prepareCourseSetup);
  const loadRecentCourseResults = useAppStore((state) => state.loadRecentCourseResults);
  const refreshCourseSearch = useAppStore((state) => state.refreshCourseSearch);
  const refreshNearbyCoursesFromLocation = useAppStore((state) => state.refreshNearbyCoursesFromLocation);
  const createSelectedCourseTeeTimeRequest = useAppStore((state) => state.createSelectedCourseTeeTimeRequest);
  const startSoloRound = useAppStore((state) => state.startSoloRound);
  const hostLiveRound = useAppStore((state) => state.hostLiveRound);
  const authNotice = useAppStore((state) => state.authNotice);

  const searchInputRef = useRef(null);
  const initializedRef = useRef(false);
  const [browseMode, setBrowseMode] = useState("nearby");
  const [setupStep, setSetupStepLocal] = useState("course");

  const formatCards = useMemo(() => Object.values(GAME_MODES), []);
  const teeTimeAccess = selectedCourse ? getCourseTeeTimeAccess(selectedCourse) : null;
  const latestTeeTimeRequest = selectedCourse?.id
    ? getLatestCourseTeeTimeRequest(teeTimeRequests, selectedCourse.id)
    : null;
  const browseSummary = browseMode === "search"
    ? (setup.courseQuery ? `Searching ${courseResults.length} matches` : "Type a course, city, or state")
    : browseMode === "recent"
      ? "Recent rounds stay pinned here"
      : "Phone location and saved nearby picks";

  useEffect(() => {
    void prepareCourseSetup();
  }, [prepareCourseSetup]);

  useEffect(() => {
    const hasQuery = Boolean(String(setup.courseQuery || "").trim());
    if (hasQuery && browseMode !== "search") {
      setBrowseMode("search");
    }
  }, [browseMode, setup.courseQuery]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return undefined;
    }

    const hasQuery = Boolean(String(setup.courseQuery || "").trim());
    const timeoutId = setTimeout(() => {
      if (hasQuery) {
        void refreshCourseSearch();
        return;
      }

      if (browseMode === "recent") {
        void loadRecentCourseResults();
        return;
      }

      void prepareCourseSetup();
    }, hasQuery ? 220 : 0);

    return () => clearTimeout(timeoutId);
  }, [browseMode, loadRecentCourseResults, prepareCourseSetup, refreshCourseSearch, setup.courseQuery]);

  useEffect(() => {
    if (browseMode !== "search" || setupStep !== "course") {
      return;
    }

    const timeoutId = setTimeout(() => {
      searchInputRef.current?.focus?.();
    }, 120);

    return () => clearTimeout(timeoutId);
  }, [browseMode, setupStep]);

  useEffect(() => {
    if (!selectedCourse && setupStep !== "course") {
      setSetupStepLocal("course");
    }
  }, [selectedCourse, setupStep]);

  function goToStep(stepId) {
    if (stepId === "course") {
      setSetupStepLocal("course");
      return;
    }

    if (stepId === "format" && selectedCourse) {
      setSetupStepLocal("format");
      return;
    }

    if (stepId === "play" && selectedCourse) {
      setSetupStepLocal("play");
    }
  }

  async function handleCourseSelect(courseId) {
    await selectCourse(courseId);
    setSetupStepLocal("format");
  }

  function handleFormatSelect(modeId) {
    setSetupMode(modeId);
    setSetupStepLocal("play");
  }

  async function handleStartSolo() {
    await startSoloRound();
    router.replace("/(tabs)/score");
  }

  async function handleStartLive() {
    await hostLiveRound();
    router.replace("/round/lobby");
  }

  return (
    <Screen scroll>
      <SectionHeader title="Start Round" subtitle="Move through course, format, and play as separate steps instead of one long page." />

      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroEyebrow}>Round setup</Text>
            <Text style={styles.heroTitle}>
              {setupStep === "course" ? "Pick a course" : setupStep === "format" ? "Pick a format" : "Start the round"}
            </Text>
          </View>
          <View style={styles.heroSource}>
            <Text style={styles.heroSourceText}>{mapSourceLabel(courseResultsSource)}</Text>
          </View>
        </View>
        <Text style={styles.heroMeta}>
          {selectedCourse
            ? `${selectedCourse.displayName} / ${[selectedCourse.city, selectedCourse.state].filter(Boolean).join(", ")}`
            : browseSummary}
        </Text>
        <View style={styles.stepRow}>
          {SETUP_STEPS.map((step, index) => {
            const currentIndex = SETUP_STEPS.findIndex((item) => item.id === setupStep);
            const active = step.id === setupStep;
            const complete = index < currentIndex;
            const disabled = (step.id === "format" || step.id === "play") && !selectedCourse;
            return (
              <StepChip
                key={step.id}
                label={step.label}
                active={active}
                complete={complete}
                disabled={disabled}
                onPress={() => goToStep(step.id)}
              />
            );
          })}
        </View>
      </Card>

      {setupStep === "course" ? (
        <Card>
          <Text style={styles.groupTitle}>Course</Text>
          <View style={styles.browseChipRow}>
            {COURSE_BROWSE_MODES.map((mode) => (
              <CourseBrowseChip
                key={mode.id}
                label={mode.label}
                selected={browseMode === mode.id}
                onPress={() => {
                  setBrowseMode(mode.id);
                  if (mode.id !== "search") {
                    setCourseQuery("");
                  }
                }}
              />
            ))}
          </View>

          {browseMode === "search" ? (
            <TextInput
              ref={searchInputRef}
              autoCapitalize="words"
              autoCorrect={false}
              placeholder="Search course, city, or state"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={setup.courseQuery}
              onChangeText={(value) => {
                setBrowseMode("search");
                setCourseQuery(value);
              }}
            />
          ) : (
            <View style={styles.inlineActions}>
              <AppButton
                label={nearbyLocationStatus === "locating" ? "Locating..." : "Use My Location"}
                size="compact"
                variant="secondary"
                disabled={nearbyLocationStatus === "locating"}
                onPress={() => {
                  setBrowseMode("nearby");
                  setCourseQuery("");
                  void refreshNearbyCoursesFromLocation({ requestPermission: true, forceResults: true });
                }}
              />
              <AppButton
                label="Search All"
                size="compact"
                variant="secondary"
                onPress={() => {
                  setBrowseMode("search");
                }}
              />
            </View>
          )}

          {courseResultsStatus === "loading" || courseResultsStatus === "searching" ? (
            <Text style={styles.statusLine}>
              {courseResultsStatus === "searching" ? "Searching the nationwide catalog..." : "Loading course picks..."}
            </Text>
          ) : null}
          {nearbyLocationNotice && browseMode === "nearby" ? <Text style={styles.statusLine}>{nearbyLocationNotice}</Text> : null}
          {courseCatalogNotice ? <Text style={styles.notice}>{courseCatalogNotice}</Text> : null}

          {browseMode === "search" && !setup.courseQuery ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Search opens only when you type</Text>
              <Text style={styles.emptyCopy}>That keeps nearby and recent picks fast by default.</Text>
            </View>
          ) : (
            <View style={styles.resultsList}>
              {courseResults.map((course) => (
                <CourseResultRow
                  key={course.id}
                  course={course}
                  selected={selectedCourse?.id === course.id}
                  onPress={() => {
                    void handleCourseSelect(course.id);
                  }}
                />
              ))}
            </View>
          )}
        </Card>
      ) : null}

      {setupStep === "format" && selectedCourse ? (
        <>
          <Card>
            <Text style={styles.groupTitle}>Selected course</Text>
            <Text style={styles.selectedName}>{selectedCourse.displayName}</Text>
            <Text style={styles.selectedMeta}>
              {[selectedCourse.city, selectedCourse.state].filter(Boolean).join(", ")} / {selectedCourse.teeBoxes?.[0]?.name || "Default tee"}
            </Text>
            <View style={styles.selectedStats}>
              <Text style={styles.selectedStat}>Rating {selectedCourse.teeBoxes?.[0]?.rating ?? "--"}</Text>
              <Text style={styles.selectedStat}>Slope {selectedCourse.teeBoxes?.[0]?.slope ?? "--"}</Text>
              <Text style={styles.selectedStat}>Holes {selectedCourse.holes?.length || 18}</Text>
            </View>
          </Card>

          <Card>
            <Text style={styles.groupTitle}>Format</Text>
            <View style={styles.formatGrid}>
              {formatCards.map((mode) => (
                <FormatCard
                  key={mode.id}
                  mode={mode}
                  selected={setup.mode === mode.id}
                  onPress={() => handleFormatSelect(mode.id)}
                />
              ))}
            </View>
            <View style={styles.stepActions}>
              <AppButton label="Back to Course" size="compact" variant="secondary" onPress={() => setSetupStepLocal("course")} />
            </View>
          </Card>
        </>
      ) : null}

      {setupStep === "play" && selectedCourse ? (
        <>
          <Card>
            <Text style={styles.groupTitle}>Round summary</Text>
            <Text style={styles.selectedName}>{selectedCourse.displayName}</Text>
            <Text style={styles.selectedMeta}>
              {GAME_MODES[setup.mode]?.label || "Strokes"} / {selectedCourse.teeBoxes?.[0]?.name || "Default tee"} / {[selectedCourse.city, selectedCourse.state].filter(Boolean).join(", ")}
            </Text>
            <View style={styles.selectedStats}>
              <Text style={styles.selectedStat}>Source {mapSourceLabel(courseResultsSource)}</Text>
              <Text style={styles.selectedStat}>{selectedCourse.country || "USA"}</Text>
            </View>
            {teeTimeAccess?.mode === "external-link" && teeTimeAccess.url ? (
              <View style={styles.teeTimeBlock}>
                <Text style={styles.teeTimeMeta}>Booking</Text>
                <AppButton
                  label={teeTimeAccess.label || "Book Tee Time"}
                  size="compact"
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
                  size="compact"
                  variant="secondary"
                  disabled={Boolean(latestTeeTimeRequest && ["requested", "confirmed"].includes(latestTeeTimeRequest.status))}
                  onPress={async () => {
                    await createSelectedCourseTeeTimeRequest();
                  }}
                />
                <Text style={styles.teeTimeStatus}>
                  {latestTeeTimeRequest
                    ? `${getTeeTimeRequestStatusLabel(latestTeeTimeRequest.status)} / ${latestTeeTimeRequest.desiredWindowLabel}`
                    : (teeTimeAccess.notes || "Save a local request until partner booking is wired live.")}
                </Text>
              </View>
            ) : null}
          </Card>

          <Card>
            <Text style={styles.groupTitle}>Play</Text>
            <Text style={styles.startCopy}>Solo keeps scoring on this phone. Live opens a room code and lobby for the group.</Text>
            <View style={styles.startStack}>
              <AppButton label="Start Solo Round" onPress={() => { void handleStartSolo(); }} />
              <AppButton label="Create Live Round" variant="secondary" onPress={() => { void handleStartLive(); }} />
              <AppButton label="Back to Format" size="compact" variant="secondary" onPress={() => setSetupStepLocal("format")} />
            </View>
            {authNotice ? <Text style={styles.notice}>{authNotice}</Text> : null}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: spacing.md,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  heroEyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  heroSource: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroSourceText: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
  heroMeta: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  stepChip: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  stepChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  stepChipComplete: {
    borderColor: "rgba(34,197,94,0.45)",
    backgroundColor: "rgba(34,197,94,0.12)",
  },
  stepChipDisabled: {
    opacity: 0.5,
  },
  stepChipText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stepChipTextActive: {
    color: colors.text,
  },
  groupTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
  },
  browseChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  browseChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  browseChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryPressed,
  },
  browseChipText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "800",
  },
  browseChipTextActive: {
    color: colors.text,
  },
  input: {
    minHeight: 50,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSoft,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statusLine: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  notice: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyCopy: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  resultsList: {
    gap: spacing.sm,
  },
  courseRow: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  courseRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  courseRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  courseCopy: {
    flex: 1,
    gap: 2,
  },
  courseName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  courseMeta: {
    color: colors.textMuted,
    fontSize: 13,
  },
  selectedBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  selectedBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  courseStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  courseStat: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  selectedName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  selectedMeta: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  selectedStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  selectedStat: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  formatGrid: {
    gap: spacing.sm,
  },
  formatCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  formatCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  formatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  formatTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  formatTitleActive: {
    color: colors.accent,
  },
  formatBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  formatBadgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  formatMeta: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  stepActions: {
    gap: spacing.sm,
  },
  teeTimeBlock: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  teeTimeMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  teeTimeStatus: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  startCopy: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  startStack: {
    gap: spacing.sm,
  },
});
