import { VIEW_ORDER } from "../config.js";
import { refreshProfileSnapshots } from "../services/player-service.js";
import {
  applyJoinedRoundConnectionState,
  focusRoundView,
  upsertJoinedRoundIntoState,
} from "../services/round-flow-service.js";
import { appendActivity, setFeedback } from "../state/session-state.js";

function getViewIndex(viewId) {
  return VIEW_ORDER.findIndex((view) => view.id === viewId);
}

export function setActiveView(draft, nextView, transitionKind = "tab") {
  const previousView = draft.session.activeView || "home";
  const previousIndex = getViewIndex(previousView);
  const nextIndex = getViewIndex(nextView);

  draft.session.previousView = previousView;
  draft.session.activeView = nextView;

  if (transitionKind === "focus-round") {
    draft.session.transitionDirection = "focus";
    return;
  }

  if (transitionKind === "return") {
    draft.session.transitionDirection = "return";
    return;
  }

  if (previousIndex !== -1 && nextIndex !== -1) {
    draft.session.transitionDirection = nextIndex >= previousIndex ? "forward" : "backward";
    return;
  }

  draft.session.transitionDirection = "steady";
}

export function openHelpView(draft, sectionId = "getting-started") {
  const currentView = draft.session.activeView || "home";
  draft.session.helpReturnView = draft.auth?.status === "authenticated"
    ? (currentView === "help" ? draft.session.helpReturnView || "home" : currentView)
    : "auth";
  draft.session.helpSection = sectionId || draft.session.helpSection || "getting-started";
  setActiveView(draft, "help", "focus");
}

export function closeHelpView(draft) {
  const returnView = draft.session.helpReturnView || "home";
  setActiveView(draft, returnView === "auth" ? "home" : returnView, "return");
}

export function openSettingsView(draft, sectionId = "account") {
  const currentView = draft.session.activeView || "stats";
  draft.session.settingsReturnView = currentView === "settings"
    ? (draft.session.settingsReturnView || "stats")
    : currentView;
  draft.session.settingsSection = sectionId || draft.session.settingsSection || "account";
  setActiveView(draft, "settings", "focus");
}

export function closeSettingsView(draft) {
  const returnView = draft.session.settingsReturnView || "stats";
  setActiveView(draft, returnView, "return");
}

export function applyJoinedRoundState(draft, joined, successTitle, successMessage) {
  upsertJoinedRoundIntoState(draft, joined);
  applyJoinedRoundConnectionState(joined.round, joined.source);
  focusRoundView(draft, joined.round.id, draft.currentUser.profileId, setActiveView);
  refreshProfileSnapshots(draft);
  appendActivity(draft, joined.notice, "sync");
  setFeedback(draft, "success", successTitle, successMessage);
}
