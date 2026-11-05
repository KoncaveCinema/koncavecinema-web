"use client";

import { RouteError } from "@/components/states/route-error";

/** A console page that broke while rendering: the sidebar stays, the page offers a retry */
export default function AdminError(props: { error: unknown; retry: () => void }) {
  return <RouteError {...props} />;
}
