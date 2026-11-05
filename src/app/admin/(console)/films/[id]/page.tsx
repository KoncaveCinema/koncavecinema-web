import type { Metadata } from "next";
import { Suspense } from "react";

import { FilmDetailsPage } from "@/features/admin/films/film-details-page";
import { PageSkeleton } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Film" };

/** One film. The id comes from the address, so the page streams in behind its skeleton. */
export default function Page({ params }: PageProps<"/admin/films/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <FilmDetailsPage params={params} />
    </Suspense>
  );
}
