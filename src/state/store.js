import { cloneData } from "../utils/formatters.js";

export function createStore(initialState) {
  let state = cloneData(initialState);
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(updater, meta = {}) {
    const draft = cloneData(state);
    const nextState = typeof updater === "function" ? updater(draft) || draft : updater;
    state = nextState;
    listeners.forEach((listener) => listener(state, meta));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    getState,
    setState,
    subscribe,
  };
}
