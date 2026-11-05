import type { Metadata } from "next";
import { Suspense } from "react";

import { ShowtimeDetailsPage } from "@/features/admin/showtimes/showtime-details-page";
import { PageSkeleton } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Showtime" };

/** One showtime. The id comes from the address, so the page streams in behind its skeleton. */
export default function Page({ params }: PageProps<"/admin/showtimes/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ShowtimeDetailsPage params={params} />
    </Suspense>
  );
}
