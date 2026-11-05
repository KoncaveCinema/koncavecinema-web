import type { Metadata } from "next";
import { Suspense } from "react";

import { WatchRoom } from "@/features/watch/watch-room";

export const metadata: Metadata = { title: "Screening room" };

/** The pass's screening. The id comes from the address, so the room streams in behind black. */
export default function WatchPage({ params }: PageProps<"/watch/[ticketId]">) {
  return (
    <Suspense fallback={<div className="min-h-svh bg-black" />}>
      <WatchRoom params={params} />
    </Suspense>
  );
}
