"use client";

import { useSyncExternalStore } from "react";

/**
 * One clock for the whole page. Every countdown subscribes to the same one-second tick, so
 * twenty showtime cards cost one timer, and the tick stops while the tab is hidden.
 *
 * Returns null during server rendering and the first client render (hydration), so markup
 * always matches; components show their calendar-time fallback until the clock starts.
 */

let now: number | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function emit() {
  now = Date.now();
  for (const listener of listeners) listener();
}

function start() {
  if (timer !== undefined || document.visibilityState === "hidden") return;
  emit();
  // Align ticks to the second so every countdown on screen changes together
  timer = setTimeout(
    () => {
      emit();
      timer = setInterval(emit, 1000);
    },
    1000 - (Date.now() % 1000),
  );
}

function stop() {
  clearTimeout(timer);
  clearInterval(timer);
  timer = undefined;
}

function onVisibilityChange() {
  if (document.visibilityState === "hidden") stop();
  else start();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    start();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stop();
    }
  };
}

const getSnapshot = () => now;
const getServerSnapshot = () => null;

/** Current time in milliseconds, updated every second; null until the page is interactive. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** The viewer's timezone once running in the browser; undefined (Lagos time) before that. */
export function useViewerTimeZone(): string | undefined {
  const current = useNow();
  return current === null ? undefined : Intl.DateTimeFormat().resolvedOptions().timeZone;
}
