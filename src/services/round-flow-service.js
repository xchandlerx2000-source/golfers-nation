import {
  getCourseById,
  getDefaultCourseTeeBox,
  getCourseDefaultRoundSetup,
  getCourseRoundSetupState,
} from "./course-service.js";
import { hostRoundGroup } from "./mock-api.js";

const HOSTED_ROUND_NOTE = "Invite code is live. The original host can leave and every joined golfer still keeps a safe local card.";
const JOINED_ROUND_NOTE = "This device now carries its own safe copy of the live round, even if the original host leaves.";
export const ROUND_SETUP_STEPS = ["course", "review"];

export function parsePlayers(value, currentUserName) {
  const safeCurrentUserName = String(currentUserName || "").trim() || "Golfer";
  const names = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const deduped = [];
  const seen = new Set();

  names.forEach((name) => {
    const normalized = name.toLowerCase();
    if (seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    deduped.push(name);
  });

  if (!seen.has(safeCurrentUserName.toLowerCase())) {
    deduped.unshift(safeCurrentUserName);
    seen.add(safeCurrentUserName.toLowerCase());
  } else {
    const currentIndex = deduped.findIndex((name) => name.toLowerCase() === safeCurrentUserName.toLowerCase());
    if (currentIndex > 0) {
      const [currentName] = deduped.splice(currentIndex, 1);
      deduped.unshift(currentName);
    }
  }

  const adjustments = [];

  if (deduped.length > 4) {
    deduped.length = 4;
    adjustments.push("This build keeps live rounds to four golfers, so only the first four names were used.");
  }

  return {
    names: deduped,
    note: adjustments.join(" "),
  };
}

export function getDefaultRoundSetup() {
  return getCourseDefaultRoundSetup();
}

export function getRoundSetupState(state) {
  return getCourseRoundSetupState(state?.session?.roundSetup || {});
}

export function getRoundSetupStep(state) {
  const step = getRoundSetupState(state).step;
  return ROUND_SETUP_STEPS.includes(step) ? step : ROUND_SETUP_STEPS[0];
}

export function resetRoundSetup(draft) {
  if (!draft?.session) {
    return;
  }

  draft.session.roundSetup = getDefaultRoundSetup();
}

export function setRoundSetupStep(draft, step) {
  if (!draft?.session) {
    return;
  }

  draft.session.roundSetup = {
    ...getRoundSetupState(draft),
    step: ROUND_SETUP_STEPS.includes(step) ? step : ROUND_SETUP_STEPS[0],
  };
}

export function moveRoundSetupStep(draft, direction = 1) {
  if (!draft?.session) {
    return;
  }

  const currentStep = getRoundSetupStep(draft);
  const currentIndex = ROUND_SETUP_STEPS.indexOf(currentStep);
  const nextIndex = Math.max(0, Math.min(ROUND_SETUP_STEPS.length - 1, currentIndex + Number(direction || 0)));
  setRoundSetupStep(draft, ROUND_SETUP_STEPS[nextIndex]);
}

export function setRoundSetupField(draft, field, value) {
  if (!draft?.session || !field) {
    return;
  }

  draft.session.roundSetup = {
    ...getRoundSetupState(draft),
    [field]: value,
  };
}

export function setSelectedCourse(draft, courseId, teeBoxId = "") {
  if (!draft?.session) {
    return;
  }

  const course = getCourseById(courseId);
  if (!course) {
    draft.session.roundSetup = {
      ...getRoundSetupState(draft),
      courseMethod: "search",
      selectedCourseId: "",
      selectedTeeBoxId: "",
    };
    return;
  }

  const defaultTee = getDefaultCourseTeeBox(course);
  draft.session.roundSetup = {
    ...getRoundSetupState(draft),
    courseMethod: getRoundSetupState(draft).courseMethod || "detected",
    selectedCourseId: course.id,
    selectedTeeBoxId: teeBoxId || defaultTee?.id || "",
    selectedHoleCount: Math.min(
      Number(getRoundSetupState(draft).selectedHoleCount || course.holesCount || 18),
      Number(course.holesCount || defaultTee?.holes?.length || 18)
    ),
  };
}

export function setSelectedTeeBox(draft, teeBoxId = "") {
  if (!draft?.session) {
    return;
  }

  draft.session.roundSetup = {
    ...getRoundSetupState(draft),
    selectedTeeBoxId: teeBoxId || "",
  };
}

export function setSelectedHoleCount(draft, holeCount = 18) {
  if (!draft?.session) {
    return;
  }

  const roundSetup = getRoundSetupState(draft);
  const course = roundSetup.selectedCourseId ? getCourseById(roundSetup.selectedCourseId) : null;
  const maxHoleCount = Number(course?.holesCount || 18);
  const safeCount = Math.max(1, Math.min(maxHoleCount, Number(holeCount || 18)));

  draft.session.roundSetup = {
    ...roundSetup,
    selectedHoleCount: safeCount,
  };
}

export function focusRoundView(draft, roundId, profileId, setActiveView) {
  if (!draft?.session || typeof setActiveView !== "function") {
    return;
  }

  draft.session.activeRoundId = roundId;
  draft.session.selectedHole = 1;
  draft.session.selectedProfileId = profileId;
  setActiveView(draft, "round", "focus-round");
}

export function upsertJoinedRoundIntoState(draft, joined) {
  if (!joined?.round) {
    return;
  }

  const roundIndex = draft.rounds.findIndex((round) =>
    round.id === joined.round.id
      || (joined.round.inviteCode && round.inviteCode === joined.round.inviteCode)
  );

  if (roundIndex >= 0) {
    draft.rounds[roundIndex] = joined.round;
  } else {
    draft.rounds.unshift(joined.round);
  }

  if (!joined.group) {
    return;
  }

  const groupIndex = draft.groups.findIndex((group) =>
    group.id === joined.group.id
      || group.roundId === joined.round.id
      || (joined.group.inviteCode && group.inviteCode === joined.group.inviteCode)
  );

  if (groupIndex >= 0) {
    draft.groups[groupIndex] = joined.group;
  } else {
    draft.groups.unshift(joined.group);
  }
}

export function applyHostedRoundState(round, inviteCode) {
  round.inviteCode = inviteCode;
  round.sync.transport = "invite";
  round.sync.label = "Invite code";
  round.sync.state = "hosting";
  round.sync.lastEventAt = Date.now();
  round.sync.note = HOSTED_ROUND_NOTE;
}

export function ensureHostedGroupForRound(draft, round) {
  const existing = draft.groups.find((group) => group.roundId === round.id);
  if (existing) {
    round.groupId = existing.id;
    applyHostedRoundState(round, existing.inviteCode);
    return {
      group: existing,
      created: false,
    };
  }

  const hosted = hostRoundGroup({ state: draft, round });
  round.groupId = hosted.group.id;
  applyHostedRoundState(round, hosted.inviteCode);
  draft.groups.unshift(hosted.group);

  return {
    group: hosted.group,
    created: true,
  };
}

export function applyJoinedRoundConnectionState(round, source) {
  round.sync.lastEventAt = Date.now();
  round.sync.state = "connected";
  round.sync.transport = source === "local" ? "invite" : "cloud";
  round.sync.label = source === "local" ? "Invite code" : "Live cloud sync";
  round.sync.note = JOINED_ROUND_NOTE;
}
