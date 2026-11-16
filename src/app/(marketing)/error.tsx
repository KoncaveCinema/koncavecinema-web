"use client";

import { RouteError } from "@/components/states/route-error";

/** A public page that broke while rendering: the site header and footer stay, the page retries */
export default function MarketingError(props: { error: unknown; retry: () => void }) {
  return (
    // Clear of the fixed header
    <div className="mx-auto w-full max-w-2xl px-5 pt-32 pb-24">
      <RouteError {...props} />
    </div>
  );
}
