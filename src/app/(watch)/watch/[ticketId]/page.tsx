import type { Metadata } from "next";
import { Suspense } from "react";

import { WatchPage } from "@/features/watch/watch-page";

export const metadata: Metadata = { title: "Screening room" };

/** The pass's screening. The id comes from the address, so the room streams in behind black. */
export default function Page({ params }: PageProps<"/watch/[ticketId]">) {
  return (
    <Suspense fallback={<div className="min-h-svh bg-black" />}>
      <WatchPage params={params} />
    </Suspense>
  );
}
