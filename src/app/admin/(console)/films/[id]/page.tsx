import type { Metadata } from "next";
import { Suspense } from "react";

import { FilmPage } from "@/features/admin/films/film-page";
import { PageSkeleton } from "@/features/auth/require-session";

export const metadata: Metadata = { title: "Film" };

/** One film. The id comes from the address, so the page streams in behind its skeleton. */
export default function AdminFilmPage({ params }: PageProps<"/admin/films/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <FilmPage params={params} />
    </Suspense>
  );
}
