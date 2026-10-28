import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";

import { RatingBadge } from "@/components/cinema/badges";
import { LocalTime, ScreeningStatus } from "@/components/cinema/live-time";
import { formatRuntime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { filmArtTransition, sortedShowtimes } from "./screening";
import type { CatalogFilm } from "./types";

/**
 * A film as a 16:9 tile: the still, its live state, the title and when it next plays. Opening it
 * morphs the still into the film page's backdrop.
 */
export function FilmTile({ film, className }: { film: CatalogFilm; className?: string }) {
  const next = sortedShowtimes(film)[0];
  return (
    <article className={cn("group relative", className)}>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/8 transition-[box-shadow] duration-300 group-hover:ring-white/25">
        <ViewTransition name={filmArtTransition(film.slug)}>
          <Image
            src={film.posterLandscape}
            alt=""
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 75vw"
            className="object-cover transition-transform duration-700 ease-cinema group-hover:scale-[1.04]"
          />
        </ViewTransition>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.45)_0%,transparent_35%)]"
        />
        <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          {next ? (
            <ScreeningStatus startTime={next.startTime} endTime={next.endTime} relativeOnly />
          ) : (
            <span />
          )}
          <RatingBadge rating={film.ageRating} />
        </div>
      </div>
      <h3 className="mt-3 font-semibold">
        <Link href={`/movies/${film.slug}`} className="after:absolute after:inset-0">
          {film.title}
        </Link>
      </h3>
      <p className="mt-0.5 text-sm text-white/50">
        {formatRuntime(film.durationMinutes)}
        {next && (
          <>
            {" · "}
            <LocalTime iso={next.startTime} />
          </>
        )}
      </p>
    </article>
  );
}
