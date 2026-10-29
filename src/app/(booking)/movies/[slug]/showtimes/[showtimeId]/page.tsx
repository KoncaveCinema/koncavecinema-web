import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { RoomPicker } from "@/features/booking/room-picker";
import { getCatalog } from "@/features/catalog/get-catalog";
import { getShowtime, getShowtimeCapacity } from "@/features/catalog/queries";

type Props = PageProps<"/movies/[slug]/showtimes/[showtimeId]">;

// Every known showtime is prerendered whole, and an unknown one must answer a real 404
export const instant = false;

export async function generateStaticParams() {
  const { films } = await getCatalog();
  const params = films.flatMap((film) =>
    film.showtimes.map((showtime) => ({ slug: film.slug, showtimeId: showtime.id })),
  );
  // Cache Components needs at least one param; an empty catalog renders the not-found page
  return params.length ? params : [{ slug: "none", showtimeId: "none" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, showtimeId } = await params;
  const match = await getShowtime(slug, showtimeId);
  return { title: match ? `Book ${match.film.title}` : "Showtime not found" };
}

/** Booking step 1: choose a room for this showtime. */
export default async function ShowtimePage({ params }: Props) {
  const { slug, showtimeId } = await params;
  const match = await getShowtime(slug, showtimeId);
  if (!match) notFound();
  const capacity = await getShowtimeCapacity(match);
  const { film } = match;

  if (!capacity) {
    return (
      <p className="mx-auto max-w-lg rounded-2xl border border-dashed border-white/12 p-8 text-center text-muted-foreground">
        Rooms for this showtime couldn&rsquo;t be loaded. Please refresh in a moment.
      </p>
    );
  }

  return (
    // The chosen room lives in the link (?room=), so it survives signing in
    <Suspense>
      <RoomPicker
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
