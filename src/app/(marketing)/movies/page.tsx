import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";

import { FilmGrain, ScreenGlow } from "@/components/brand/atmosphere";
import { RatingBadge } from "@/components/cinema/badges";
import { FeaturedFilm } from "@/features/catalog/featured-film";
import { getCatalog } from "@/features/catalog/get-catalog";
import { MovieCard } from "@/features/catalog/movie-card";
import { filmArtTransition, groupNowShowing, sortedShowtimes } from "@/features/catalog/screening";
import type { CatalogFilm } from "@/features/catalog/types";
import { formatRuntime, formatShortDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Now showing",
  description:
    "Every film premiering on Koncave Cinema: scheduled showtimes, public halls and private suites for African film.",
  alternates: { canonical: "/movies" },
};

const eyebrow =
  "flex items-center gap-3 text-[0.7rem] font-bold tracking-[0.32em] text-brand uppercase";

/** A premiere further out: the still with its opening date as a ribbon. */
function LaterCard({ film }: { film: CatalogFilm }) {
  const first = sortedShowtimes(film)[0];
  return (
    <article className="group relative reveal">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-white/8 transition-[box-shadow] duration-300 group-hover:ring-white/25">
        <ViewTransition name={filmArtTransition(film.slug)}>
          <Image
            src={film.posterLandscape}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 80vw"
            className="object-cover transition-transform duration-700 ease-cinema group-hover:scale-[1.04]"
          />
        </ViewTransition>
        {first && (
          <span
            suppressHydrationWarning
            className="absolute top-3.5 left-3.5 rounded-lg bg-black/70 px-2.5 py-1.5 font-display text-sm font-extrabold tracking-wide backdrop-blur-md"
          >
            {formatShortDate(first.startTime)}
          </span>
        )}
        <RatingBadge rating={film.ageRating} className="absolute top-3.5 right-3.5" />
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">
            <Link href={`/movies/${film.slug}`} className="after:absolute after:inset-0">
              {film.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-white/50">
            {formatRuntime(film.durationMinutes)} · Tickets on sale
          </p>
        </div>
      </div>
    </article>
  );
}

export default async function NowShowingPage() {
  const { films, unavailable } = await getCatalog();
  const { thisWeek, later } = groupNowShowing(films);
  const [featured, ...rest] = thisWeek;

  return (
    <div className="relative isolate">
      <ScreenGlow className="-z-10" />
      <FilmGrain className="-z-10" />

      <div className="mx-auto max-w-360 px-5 pt-28 pb-24 sm:px-8 sm:pb-32 lg:px-16 lg:pt-32">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={eyebrow}>
              <span aria-hidden="true" className="h-px w-6 bg-brand" />
              Koncave Cinema
            </p>
            <h1 className="mt-3 font-display text-4xl font-black uppercase sm:text-5xl">
              Now <span className="text-outline">showing</span>
            </h1>
          </div>
          <Link
            href="/showtimes"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm font-semibold transition-colors hover:border-white/30"
          >
            Full schedule
            <ArrowRight className="size-4" />
          </Link>
        </header>

        {films.length === 0 ? (
          <p className="mt-12 rounded-3xl border border-dashed border-white/12 p-10 text-center text-muted-foreground">
            {unavailable
              ? "We couldn't load the films. Please refresh in a moment."
              : "New premieres are announced every week. Check back soon."}
          </p>
        ) : (
          <div className="mt-10 space-y-20 sm:space-y-24">
            {featured && <FeaturedFilm film={featured} />}

            {rest.length > 0 && (
              <section aria-labelledby="this-week-title">
                <h2
                  id="this-week-title"
                  className="font-display text-2xl leading-tight font-extrabold sm:text-3xl"
                >
                  Also playing this week
                </h2>
                <ul className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                  {rest.map((film, index) => (
                    <li key={film.id}>
                      <MovieCard film={film} priority={index < 2} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {later.length > 0 && (
              <section aria-labelledby="later-title">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className={eyebrow}>
                      <span aria-hidden="true" className="h-px w-6 bg-brand" />
                      Premiering later
                    </p>
                    <h2
                      id="later-title"
                      className="mt-3 font-display text-2xl leading-tight font-extrabold sm:text-3xl"
                    >
                      Mark your calendar
                    </h2>
                  </div>
                </div>
                <ul className="-mx-5 mt-8 snap-rail gap-5 px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
                  {later.map((film) => (
                    <li key={film.id} className="w-76 sm:w-auto">
                      <LaterCard film={film} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
