// Client code without its own "use client": only the areas' error.tsx files (already client
// components) import it, so its `retry` prop never crosses from the server.

import { useEffect } from "react";

import { ErrorState } from "./states";

/**
 * A page that broke while rendering, for an area's `error.tsx`: the area's frame (sidebar, top
 * bar) stays, the page says so plainly and offers to try again. A failed request never lands
 * here; lists and records show their own error with a retry.
 */
export function RouteError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // Reported to monitoring from Phase F9; the console is enough until then
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-3xl border border-dashed border-white/12">
      <ErrorState
        title="This page ran into a problem"
        message="Nothing you did was lost. Try again, or come back in a moment."
        onRetry={retry}
      />
    </div>
  );
}
