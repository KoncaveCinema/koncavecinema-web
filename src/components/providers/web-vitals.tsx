"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Core Web Vitals (LCP, INP, CLS, FCP, TTFB) from real page loads. Logged in development for
 * now; Phase F9 sends them to the monitoring service. Budgets: docs/architecture/performance.md.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === "development") {
      // CLS is a unitless score (good under 0.1), so it keeps its decimals
      const value = metric.name === "CLS" ? metric.value.toFixed(3) : Math.round(metric.value);
      console.info(`[web-vitals] ${metric.name}`, value, metric.rating);
    }
  });
  return null;
}
