import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ChooseRoomPage } from "@/features/booking/choose-room-page";
import { getSchedule, getShowtime, getShowtimeCapacity } from "@/features/catalog/queries";

type Props = PageProps<"/movies/[slug]/showtimes/[showtimeId]">;

// Every showtime in the schedule is prerendered whole (later ones render on first visit), and
// an unknown one must answer a real 404
export const instant = false;

export async function generateStaticParams() {
  const params = (await getSchedule()).map((showtime) => ({
    slug: showtime.movie.slug,
    showtimeId: showtime.id,
  }));
  // Cache Components needs at least one param; an empty catalog renders the not-found page
  return params.length ? params : [{ slug: "none", showtimeId: "none" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, showtimeId } = await params;
  const match = await getShowtime(slug, showtimeId);
  if (match === "unavailable") return {};
  return { title: match === "missing" ? "Showtime not found" : `Book ${match.film.title}` };
}

/** Booking step 1: choose a room for this showtime. */
export default async function Page({ params }: Props) {
  const { slug, showtimeId } = await params;
  const match = await getShowtime(slug, showtimeId);
  if (match === "missing") notFound();
  const capacity = match === "unavailable" ? null : await getShowtimeCapacity(match);

  // The API couldn't be read: the film, or its rooms
  if (match === "unavailable" || !capacity) {
    return (
      <p className="mx-auto max-w-lg rounded-2xl border border-dashed border-white/12 p-8 text-center text-muted-foreground">
        Rooms for this showtime couldn&rsquo;t be loaded. Please refresh in a moment.
      </p>
    );
  }
  const { film } = match;

  return (
    // The chosen room lives in the link (?room=), so it survives signing in
    <Suspense>
      <ChooseRoomPage
        capacity={capacity}
        film={{
          slug: film.slug,
          title: film.title,
          posterLandscape: film.posterLandscape,
          posterPortrait: film.posterPortrait,
          durationMinutes: film.durationMinutes,
        }}
      />
    </Suspense>
  );
}
