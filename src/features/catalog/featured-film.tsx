import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";

import { RatingBadge } from "@/components/cinema/badges";
import { ScreeningStatus } from "@/components/cinema/live-time";
import { formatRuntime } from "@/lib/format";

import { filmArtTransition, lowestPrice, sortedShowtimes } from "./screening";
import { ShowtimeChip } from "./showtime-chip";
import type { CatalogFilm } from "./types";

/**
 * The catalogue's lead: the film playing next as a wide billboard, with its next times bookable
 * right on it.
 */
export function FeaturedFilm({ film }: { film: CatalogFilm }) {
  const showtimes = sortedShowtimes(film);
  const next = showtimes[0];
  const logline = film.synopsis.split(/(?<=[.!?])\s+/)[0] ?? film.synopsis;

  return (
    <article className="relative isolate overflow-hidden rounded-3xl bg-surface-1 ring-1 ring-white/8">
      <div className="relative aspect-4/3 sm:aspect-video lg:absolute lg:inset-0 lg:aspect-auto">
        <ViewTransition name={filmArtTransition(film.slug)}>
          <Image
            src={film.posterLandscape}
            alt=""
            fill
            priority
            sizes="(min-width: 1440px) 1312px, 100vw"
            className="-z-10 object-cover"
            style={film.posterFocus ? { objectPosition: film.posterFocus } : undefined}
          />
        </ViewTransition>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,var(--color-surface-1)_100%)] lg:bg-[linear-gradient(90deg,var(--color-surface-1)_0%,rgb(10_10_11/0.85)_35%,transparent_70%)]"
        />
      </div>
      <div className="relative px-6 pb-7 sm:px-10 sm:pb-10 lg:flex lg:min-h-136 lg:max-w-xl lg:flex-col lg:justify-center lg:py-14 lg:pl-14">
        <div className="flex items-center gap-2.5">
          <span className="text-[0.7rem] font-bold tracking-[0.28em] text-brand uppercase">
            Playing next
          </span>
          {next && (
            <ScreeningStatus startTime={next.startTime} endTime={next.endTime} relativeOnly />
          )}
          <RatingBadge rating={film.ageRating} />
        </div>
        <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.5rem)]/[0.95] font-black text-balance uppercase">
          {film.title}
        </h2>
        <p className="mt-3 text-sm text-white/55">
          {formatRuntime(film.durationMinutes)} · {film.producerName}
        </p>
        <p className="mt-4 line-clamp-3 max-w-lg leading-relaxed text-white/80">{logline}</p>
        {showtimes.length > 0 && (
          <ul className="mt-7 flex flex-wrap gap-2.5" aria-label={`Showtimes for ${film.title}`}>
            {showtimes.slice(0, 4).map((showtime) => (
              <li key={showtime.id}>
                <ShowtimeChip
                  href={`/movies/${film.slug}/showtimes/${showtime.id}`}
                  startTime={showtime.startTime}
                  endTime={showtime.endTime}
                  price={lowestPrice([showtime])}
                  withDay
                />
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/movies/${film.slug}`}
          className="mt-6 inline-flex items-center gap-2 self-start text-sm font-semibold text-white/80 transition-colors hover:text-foreground"
        >
          Film details
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
