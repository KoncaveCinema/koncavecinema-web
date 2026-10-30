import type { Metadata } from "next";
import { Suspense } from "react";

import { PassSkeleton, PassView } from "@/features/dashboard/pass-view";

export const metadata: Metadata = { title: "Your pass" };

/**
 * One pass. Booking emails link here, so it must always open (after sign-in if needed). The id
 * comes from the address, so the pass streams in behind its own skeleton and moving between
 * passes stays instant.
 */
export default function PassPage({ params }: PageProps<"/dashboard/tickets/[ticketId]">) {
  return (
    <Suspense fallback={<PassSkeleton />}>
      <PassView params={params} />
    </Suspense>
  );
}
