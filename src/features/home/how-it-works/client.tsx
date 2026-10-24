"use client";

import { useEffect } from "react";

import { useNow } from "@/hooks/use-now";

/* The two interactive pieces of How it works: the step tracker and the ticking preview clock. */

/**
 * Marks the step crossing the middle of the screen as current. It writes data attributes
 * straight onto the server-rendered section (no re-render), and CSS does the rest: the
 * current step lights up, the others dim, and the index on the left follows along. Without
 * JavaScript every step simply stays fully lit.
 */
export function StepSpy({ sectionId }: { sectionId: string }) {
  useEffect(() => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const steps = Array.from(section.querySelectorAll<HTMLElement>("[data-step]"));
    const markers = Array.from(section.querySelectorAll<HTMLElement>("[data-step-marker]"));

    const select = (index: number) => {
      steps.forEach((step, i) => step.toggleAttribute("data-current", i === index));
      markers.forEach((marker, i) => marker.toggleAttribute("data-current", i === index));
      section.style.setProperty("--step-progress", String((index + 1) / steps.length));
    };

    section.setAttribute("data-spy", "");
    select(0);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) select(steps.indexOf(entry.target as HTMLElement));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    steps.forEach((step) => observer.observe(step));
    return () => {
      observer.disconnect();
      section.removeAttribute("data-spy");
    };
  }, [sectionId]);

  return null;
}

const HALF_HOUR = 1800;

/** Illustrative lobby countdown for the "how it works" preview; loops every half hour. */
export function LobbyCountdown() {
  const now = useNow();
  const left = now === null ? HALF_HOUR : HALF_HOUR - (Math.floor(now / 1000) % HALF_HOUR);
  const minutes = String(Math.floor(left / 60)).padStart(2, "0");
  const seconds = String(left % 60).padStart(2, "0");
  return (
    <span suppressHydrationWarning>
      {minutes}:{seconds}
    </span>
  );
}
