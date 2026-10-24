import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { RatingBadge } from "@/components/cinema/badges";
import { LocalTime, ScreeningStatus } from "@/components/cinema/live-time";
import { lowestPrice } from "@/features/catalog/screening";
import type { Screening } from "@/features/catalog/types";
import { formatRuntime } from "@/lib/format";

import { ScreeningCta } from "./screening-cta";

/** A film playing in the current window: art, live status, rating and its booking button. */
export function FilmCard({ screening }: { screening: Screening }) {
  const { film, showtime } = screening;
  return (
    <article className="group relative flex w-76 reveal flex-col overflow-hidden rounded-3xl border border-white/8 bg-surface-2 transition-[transform,border-color] duration-500 ease-cinema hover:-translate-y-1.5 hover:border-brand/40 sm:w-auto">
      <div className="relative aspect-16/10 overflow-hidden">
        <Image
          src={film.posterLandscape}
          alt={`${film.title} key art`}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 19rem"
          className="mask-[linear-gradient(to_bottom,#000_50%,transparent_88%)] object-cover transition-transform duration-700 ease-cinema group-hover:scale-[1.05]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.5)_0%,transparent_35%,transparent_55%,#111113_100%)]"
        />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <ScreeningStatus startTime={showtime.startTime} endTime={showtime.endTime} />
          <RatingBadge rating={film.ageRating} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-xl font-extrabold">
              <Link href={`/movies/${film.slug}`} className="after:absolute after:inset-0">
                {film.title}
              </Link>
            </h3>
            <p className="mt-1.5 truncate text-sm text-muted-foreground">
              <LocalTime iso={showtime.startTime} /> · {formatRuntime(film.durationMinutes)}
            </p>
          </div>
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/12 transition-colors duration-300 group-hover:border-brand group-hover:bg-brand"
          >
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
          </span>
        </div>
        {/* Above the card-wide link so it stays its own action */}
        <div className="relative z-10 mt-auto">
          <ScreeningCta
            href={`/movies/${film.slug}/showtimes/${showtime.id}`}
            startTime={showtime.startTime}
            endTime={showtime.endTime}
            price={lowestPrice([showtime])}
          />
        </div>
      </div>
    </article>
  );
}
