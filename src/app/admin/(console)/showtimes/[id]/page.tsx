import type { Metadata } from "next";
import { Suspense } from "react";

import { ShowtimePage } from "@/features/admin/showtimes/showtime-page";
import { PageSkeleton } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Showtime" };

/** One showtime. The id comes from the address, so the page streams in behind its skeleton. */
export default function AdminShowtimePage({ params }: PageProps<"/admin/showtimes/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ShowtimePage params={params} />
    </Suspense>
  );
}
