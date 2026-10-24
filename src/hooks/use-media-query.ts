"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query. `serverValue` is used for the server render and hydration,
 * so markup always matches; the real value applies right after.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** True when the operating system asks for reduced motion (assumed true until known). */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", true);
}
