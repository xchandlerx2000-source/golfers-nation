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

const PROFILE_SETTINGS_SECTION_IDS = new Set(["profile-identity", "golf-profile", "social"]);
const APP_SETTINGS_SECTION_IDS = new Set(["account", "appearance", "integrations", "spotify", "app-support"]);

export function getSettingsDestinationForSection(sectionId = "", requestedDestination = "") {
  if (requestedDestination === "profile" || requestedDestination === "app" || requestedDestination === "landing") {
    return requestedDestination;
  }

  if (PROFILE_SETTINGS_SECTION_IDS.has(sectionId)) {
    return "profile";
  }

  if (APP_SETTINGS_SECTION_IDS.has(sectionId)) {
    return "app";
  }

  return "landing";
}

export function getDefaultSettingsSectionForDestination(destination = "landing") {
  if (destination === "profile") {
    return "profile-identity";
  }

  if (destination === "app") {
    return "account";
  }

  return "account";
}

export function setActiveView(draft, nextView, transitionKind = "tab") {
  if (!draft?.session) {
    return;
  }

  const previousView = draft.session.activeView || "home";
  const previousIndex = getViewIndex(previousView);
  const nextIndex = getViewIndex(nextView);

  draft.session.previousView = previousView;
  draft.session.activeView = nextView;
  draft.session.appMenuOpen = false;

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
  if (!draft?.session) {
    return;
  }

  const currentView = draft.session.activeView || "home";
  draft.session.helpReturnView = draft.auth?.status === "authenticated"
    ? (currentView === "help" ? draft.session.helpReturnView || "home" : currentView)
    : "auth";
  draft.session.helpSection = sectionId || draft.session.helpSection || "getting-started";
  draft.session.appMenuOpen = false;
  setActiveView(draft, "help", "focus");
}

export function closeHelpView(draft) {
  if (!draft?.session) {
    return;
  }

  const returnView = draft.session.helpReturnView || "home";
  setActiveView(draft, returnView === "auth" ? "home" : returnView, "return");
}

export function openSettingsView(draft, sectionId = "account", destination = null) {
  if (!draft?.session) {
    return;
  }

  const currentView = draft.session.activeView || "home";
  draft.session.settingsReturnView = currentView === "settings"
    ? (draft.session.settingsReturnView || "home")
    : currentView;
  const resolvedDestination = getSettingsDestinationForSection(sectionId, destination);
  draft.session.settingsDestination = resolvedDestination;
  draft.session.settingsSection = resolvedDestination === "landing"
    ? (draft.session.settingsSection || getDefaultSettingsSectionForDestination("app"))
    : (sectionId || draft.session.settingsSection || getDefaultSettingsSectionForDestination(resolvedDestination));
  draft.session.appMenuOpen = false;
  setActiveView(draft, "settings", "focus");
}

export function closeSettingsView(draft) {
  if (!draft?.session) {
    return;
  }

  const returnView = draft.session.settingsReturnView || "home";
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
