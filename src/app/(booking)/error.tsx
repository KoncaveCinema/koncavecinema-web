"use client";

import { RouteError } from "@/components/states/route-error";

/** A booking page that broke while rendering: the booking header and help link stay */
export default function BookingError(props: { error: unknown; retry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-16">
      <RouteError {...props} />
    </div>
  );
}
