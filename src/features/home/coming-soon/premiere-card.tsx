import { Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AddToCalendar } from "@/components/cinema/add-to-calendar";
import { RatingBadge } from "@/components/cinema/badges";
import { Button } from "@/components/ui/button";
import { sortedShowtimes } from "@/features/catalog/screening";
import type { CatalogFilm } from "@/features/catalog/types";
import { formatShortDate } from "@/lib/format";

/** An upcoming premiere: portrait art, premiere date, pre-book and add-to-calendar. */
export function PremiereCard({ film }: { film: CatalogFilm }) {
  const first = sortedShowtimes(film)[0]!;
  const ribbon = `Premieres ${formatShortDate(first.startTime)}`;

  return (
    <article className="group relative isolate flex aspect-[2/3] w-[16rem] reveal flex-col justify-end overflow-hidden rounded-3xl border border-white/8 bg-black sm:w-auto">
      <Image
        src={film.posterPortrait}
        alt={`${film.title} key art`}
        fill
        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 16rem"
        className="-z-20 mask-[linear-gradient(to_bottom,#000_50%,transparent_88%)] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(0_0_0/0.4)_0%,transparent_25%,transparent_45%,rgb(0_0_0/0.95)_100%)]"
      />
      <div className="absolute top-4 right-4">
        <RatingBadge rating={film.ageRating} />
      </div>

      <div className="p-5">
        <p className="inline-flex rounded-full bg-brand px-3 py-1 text-[0.62rem] font-bold tracking-[0.2em] text-white uppercase shadow-[0_8px_24px_-8px_rgb(214_2_17/0.8)]">
          {ribbon}
        </p>
        <h3 className="mt-2 font-display text-2xl leading-tight font-extrabold">
          <Link href={`/movies/${film.slug}`} className="after:absolute after:inset-0">
            {film.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-white/70">{film.producerName}</p>
        {/* Revealed on hover where hovering exists; always visible on touch screens */}
        <div className="relative z-10 mt-4 flex gap-2 transition-all duration-300 [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:translate-y-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100">
          <Button asChild size="sm" className="flex-1">
            <Link href={`/movies/${film.slug}/showtimes/${first.id}`}>
              <Ticket data-icon="inline-start" />
              Pre-book
            </Link>
          </Button>
          <AddToCalendar
            showtimeId={first.id}
            title={film.title}
            startTime={first.startTime}
            endTime={first.endTime}
            filmSlug={film.slug}
            className="size-7"
          />
        </div>
      </div>
    </article>
  );
}
