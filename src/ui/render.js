import { renderAppTemplate } from "./templates.js";

function getActiveRound(state) {
  return state.rounds.find((round) => round.id === state.session.activeRoundId) || null;
}

function getActiveGroup(state, round) {
  if (!round) {
    return null;
  }

  return state.groups.find((group) =>
    group.roundId === round.id
    || group.id === round.groupId
    || (round.inviteCode && group.inviteCode === round.inviteCode)
  ) || null;
}

function getLiveSessionFromState(state) {
  const activeRound = getActiveRound(state);
  if (!activeRound) {
    return null;
  }

  const activeGroup = getActiveGroup(state, activeRound);
  const players = activeGroup?.members?.length
    ? activeGroup.members.map((member) => member.displayName).filter(Boolean)
    : activeRound.players.map((player) => player.name).filter(Boolean);
  const code = activeGroup?.inviteCode || activeRound.inviteCode || "---";

  return {
    code,
    players,
  };
}

function updateLiveSession(root, session) {
  const strip = root.querySelector("#liveStrip");
  if (!strip) {
    return;
  }

  if (!session) {
    strip.classList.add("hidden");
    return;
  }

  strip.classList.remove("hidden");

  const codeElement = root.querySelector("#liveCode");
  const playersElement = root.querySelector("#livePlayers");

  if (codeElement) {
    codeElement.textContent = session.code;
  }

  if (playersElement) {
    playersElement.textContent = `Players: ${session.players.join(", ")}`;
  }
}

export function createRenderer(root) {
  return function render(state) {
    root.innerHTML = renderAppTemplate(state);
    updateLiveSession(root, getLiveSessionFromState(state));
  };
}
