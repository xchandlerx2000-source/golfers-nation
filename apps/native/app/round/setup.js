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
          <Text style={styles.courseMeta}>
            {[course.city, course.state].filter(Boolean).join(", ") || "Course location"}
          </Text>
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
            <Text style={styles.formatBadgeText}>In play</Text>
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

  const formatCards = useMemo(() => Object.values(GAME_MODES), []);
  const teeTimeAccess = selectedCourse ? getCourseTeeTimeAccess(selectedCourse) : null;
  const latestTeeTimeRequest = selectedCourse?.id
    ? getLatestCourseTeeTimeRequest(teeTimeRequests, selectedCourse.id)
    : null;

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
    if (browseMode !== "search") {
      return;
    }

    const timeoutId = setTimeout(() => {
      searchInputRef.current?.focus?.();
    }, 120);

    return () => clearTimeout(timeoutId);
  }, [browseMode]);

  const browseSummary = browseMode === "search"
    ? (setup.courseQuery ? `Searching ${courseResults.length} matches` : "Type a course, city, or state")
    : browseMode === "recent"
      ? "Your last courses stay easy to find here"
      : "Use phone location or saved nearby picks";

  return (
    <Screen scroll>
      <SectionHeader title="Start Round" subtitle="Choose a course, lock the format, then go solo or live without extra steps." />

      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Round Setup</Text>
          </View>
          <View style={styles.heroSource}>
            <Text style={styles.heroSourceText}>{mapSourceLabel(courseResultsSource)}</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>
          {selectedCourse?.displayName || "Choose a course"}
        </Text>
        <Text style={styles.heroMeta}>
          {selectedCourse
            ? `${[selectedCourse.city, selectedCourse.state].filter(Boolean).join(", ")} / ${selectedCourse.teeBoxes?.[0]?.name || "Default tee"}`
            : "Nearby and recent picks show first. Nationwide search only kicks in when you type."}
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Browse</Text>
            <Text style={styles.heroStatValue}>{browseSummary}</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Format</Text>
            <Text style={styles.heroStatValue}>{GAME_MODES[setup.mode]?.label || "Strokes"}</Text>
          </View>
        </View>
      </Card>

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
              variant="secondary"
              disabled={nearbyLocationStatus === "locating"}
              onPress={() => {
                setBrowseMode("nearby");
                setCourseQuery("");
                void refreshNearbyCoursesFromLocation({ requestPermission: true, forceResults: true });
              }}
            />
            <AppButton
              label="Search All Courses"
              variant="secondary"
              onPress={() => {
                setBrowseMode("search");
              }}
            />
          </View>
        )}

        {courseResultsStatus === "loading" || courseResultsStatus === "searching" ? (
          <Text style={styles.statusLine}>
            {courseResultsStatus === "searching" ? "Searching the nationwide catalog..." : "Loading your course picks..."}
          </Text>
        ) : null}
        {nearbyLocationNotice && browseMode === "nearby" ? <Text style={styles.statusLine}>{nearbyLocationNotice}</Text> : null}
        {courseCatalogNotice ? <Text style={styles.notice}>{courseCatalogNotice}</Text> : null}

        {browseMode === "search" && !setup.courseQuery ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Search stays manual by design</Text>
            <Text style={styles.emptyCopy}>Type a course, city, or state to open nationwide results. This keeps the default setup fast.</Text>
          </View>
        ) : (
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
        )}
      </Card>

      {selectedCourse ? (
        <Card>
          <Text style={styles.groupTitle}>Selected course</Text>
          <Text style={styles.selectedName}>{selectedCourse.displayName}</Text>
          <Text style={styles.selectedMeta}>
            {[selectedCourse.city, selectedCourse.state].filter(Boolean).join(", ")} / {selectedCourse.teeBoxes?.[0]?.name || "Default tee"} / Rating {selectedCourse.teeBoxes?.[0]?.rating ?? "--"}
          </Text>
          <View style={styles.selectedStats}>
            <Text style={styles.selectedStat}>Slope {selectedCourse.teeBoxes?.[0]?.slope ?? "--"}</Text>
            <Text style={styles.selectedStat}>Holes {selectedCourse.holes?.length || 18}</Text>
            <Text style={styles.selectedStat}>{selectedCourse.country || "USA"}</Text>
          </View>
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
                  ? `${getTeeTimeRequestStatusLabel(latestTeeTimeRequest.status)} / ${latestTeeTimeRequest.desiredWindowLabel}`
                  : (teeTimeAccess.notes || "Save a local request until partner booking is wired live.")}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <Text style={styles.groupTitle}>Format</Text>
        <View style={styles.formatGrid}>
          {formatCards.map((mode) => (
            <FormatCard
              key={mode.id}
              mode={mode}
              selected={setup.mode === mode.id}
              onPress={() => setSetupMode(mode.id)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.groupTitle}>Start</Text>
        <Text style={styles.startCopy}>Solo keeps the card on this phone. Live creates a room code and opens the lobby.</Text>
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
  heroCard: {
    gap: spacing.lg,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  heroBadgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
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
    letterSpacing: 0.4,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  heroMeta: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  heroStats: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  heroStat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    gap: 4,
  },
  heroStatLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  heroStatValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  groupTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  browseChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  browseChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    minHeight: 54,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSoft,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  inlineActions: {
    gap: spacing.sm,
  },
  statusLine: {
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
  teeTimeBlock: {
    gap: spacing.sm,
    marginTop: spacing.sm,
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
  startCopy: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  notice: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
