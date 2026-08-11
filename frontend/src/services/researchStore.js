import { useSyncExternalStore } from "react";

let currentResearch = null;
const listeners = new Set();

export function publishResearch(value) {
  currentResearch = value;
  listeners.forEach((listener) => listener());
}

export function useResearchEvidence() {
  return useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => currentResearch,
    () => null,
  );
}
