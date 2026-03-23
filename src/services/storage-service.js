import { loadPersistedState, persistAppState } from "../state/persistence.js";

// Backward-compatible wrapper: the canonical persistence path now lives in
// src/state/persistence.js, but tests and older callers still import here.
export function loadStoredState(createDefaultState) {
  return loadPersistedState(createDefaultState);
}

export function persistState(state) {
  return persistAppState(state);
}
