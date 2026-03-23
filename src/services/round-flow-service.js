import { FEATURED_COURSE_ID } from "../config.js";
import { findCourseById, getDefaultTeeBox } from "./course-library.js";
import { hostRoundGroup } from "./mock-api.js";

const HOSTED_ROUND_NOTE = "Invite code is live. The original host can leave and every joined golfer still keeps a safe local card.";
const JOINED_ROUND_NOTE = "This device now carries its own safe copy of the live round, even if the original host leaves.";

export function parsePlayers(value, currentUserName) {
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

  if (!seen.has(currentUserName.toLowerCase())) {
    deduped.unshift(currentUserName);
    seen.add(currentUserName.toLowerCase());
  } else {
    const currentIndex = deduped.findIndex((name) => name.toLowerCase() === currentUserName.toLowerCase());
    if (currentIndex > 0) {
      const [currentName] = deduped.splice(currentIndex, 1);
      deduped.unshift(currentName);
    }
  }

  const adjustments = [];
  if (deduped.length < 2) {
    deduped.push("Maya Chen");
    adjustments.push("A second golfer was added so the round is ready for a real scorecard.");
  }

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
  const featuredCourse = findCourseById(FEATURED_COURSE_ID);
  const featuredTeeBox = featuredCourse ? getDefaultTeeBox(featuredCourse) : null;

  return {
    courseQuery: "",
    selectedCourseId: featuredCourse?.id || "",
    selectedTeeBoxId: featuredTeeBox?.id || "",
  };
}

export function getRoundSetupState(state) {
  return {
    ...getDefaultRoundSetup(),
    ...(state.session?.roundSetup || {}),
  };
}

export function resetRoundSetup(draft) {
  draft.session.roundSetup = getDefaultRoundSetup();
}

export function setSelectedCourse(draft, courseId, teeBoxId = "") {
  const course = findCourseById(courseId);
  if (!course) {
    draft.session.roundSetup = {
      ...getRoundSetupState(draft),
      selectedCourseId: "",
      selectedTeeBoxId: "",
    };
    return;
  }

  const defaultTee = getDefaultTeeBox(course);
  draft.session.roundSetup = {
    ...getRoundSetupState(draft),
    selectedCourseId: course.id,
    selectedTeeBoxId: teeBoxId || defaultTee?.id || "",
  };
}

export function focusRoundView(draft, roundId, profileId, setActiveView) {
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
