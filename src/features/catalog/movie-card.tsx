import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";

import { RatingBadge } from "@/components/cinema/badges";
import { ScreeningStatus } from "@/components/cinema/live-time";
import { formatMoney, formatRuntime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { filmArtTransition, lowestPrice, sortedShowtimes } from "./screening";
import { ShowtimeChip } from "./showtime-chip";
import type { CatalogFilm } from "./types";

/**
 * A film in the catalogue: the wide still with the title set on it, then its next showtimes as
 * chips, so a time can be picked straight from the grid (no click to find out when it plays).
 */
export function MovieCard({
  film,
  priority = false,
  className,
}: {
  film: CatalogFilm;
  priority?: boolean;
  className?: string;
}) {
  const showtimes = sortedShowtimes(film);
  const next = showtimes[0];
  const price = lowestPrice(film.showtimes);

  return (
    <article className={cn("group flex reveal flex-col", className)}>
      <Link
        href={`/movies/${film.slug}`}
        className="relative block aspect-16/10 overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-white/8 transition-shadow duration-300 group-hover:ring-white/25"
      >
        <ViewTransition name={filmArtTransition(film.slug)}>
          <Image
            src={film.posterLandscape}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 92vw"
            className="object-cover transition-transform duration-700 ease-cinema group-hover:scale-[1.04]"
            style={film.posterFocus ? { objectPosition: film.posterFocus } : undefined}
          />
        </ViewTransition>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.45)_0%,transparent_30%,transparent_45%,rgb(0_0_0/0.9)_100%)]"
        />
        <div className="absolute inset-x-3.5 top-3.5 flex items-start justify-between gap-2">
          {next ? (
            <ScreeningStatus startTime={next.startTime} endTime={next.endTime} relativeOnly />
          ) : (
            <span />
          )}
          <RatingBadge rating={film.ageRating} />
        </div>
        <div className="absolute inset-x-5 bottom-4">
          <h3 className="font-display text-xl leading-tight font-extrabold text-balance sm:text-2xl">
            {film.title}
          </h3>
          <p className="mt-1 text-xs text-white/65">
            {formatRuntime(film.durationMinutes)} · {film.producerName}
            {price && (
              <span className="tabular-nums">
                {" "}
                · from {formatMoney(price.amount, price.currency)}
              </span>
            )}
          </p>
        </div>
      </Link>
      {showtimes.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={`Showtimes for ${film.title}`}>
          {showtimes.slice(0, 3).map((showtime) => (
            <li key={showtime.id}>
              <ShowtimeChip
                size="sm"
                href={`/movies/${film.slug}/showtimes/${showtime.id}`}
                startTime={showtime.startTime}
                endTime={showtime.endTime}
                price={lowestPrice([showtime])}
                withDay
              />
            </li>
          ))}
          {showtimes.length > 3 && (
            <li>
              <Link
                href={`/movies/${film.slug}#tickets`}
                className="flex min-h-11 items-center rounded-xl px-3 text-xs font-semibold text-white/55 transition-colors hover:text-foreground"
              >
                +{showtimes.length - 3} more
              </Link>
            </li>
          )}
        </ul>
      )}
    </article>
  );
}
