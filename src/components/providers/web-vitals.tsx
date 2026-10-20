"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Core Web Vitals (LCP, INP, CLS, FCP, TTFB) from real page loads. Logged in development for
 * now; Phase F9 sends them to the monitoring service. Budgets: docs/architecture/performance.md.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === "development") {
      console.info(`[web-vitals] ${metric.name}`, Math.round(metric.value), metric.rating);
    }
  });
  return null;
}
