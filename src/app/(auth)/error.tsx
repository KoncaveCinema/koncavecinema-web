"use client";

import { RouteError } from "@/components/states/route-error";

/** A sign-in or account form that broke while rendering: the still and the logo stay */
export default function AuthError(props: { error: unknown; retry: () => void }) {
  return <RouteError {...props} />;
}
