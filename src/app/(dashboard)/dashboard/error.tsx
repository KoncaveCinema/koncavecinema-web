"use client";

import { RouteError } from "@/components/states/route-error";

/** A dashboard page that broke while rendering: the sidebar stays, the page offers a retry */
export default function DashboardError(props: { error: unknown; retry: () => void }) {
  return <RouteError {...props} />;
}
