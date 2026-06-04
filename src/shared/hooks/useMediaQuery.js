import { useSyncExternalStore } from "react";

function subscribe(callback) {
  const mql = window.matchMedia("(max-width: 1180px)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia("(max-width: 1180px)").matches;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}