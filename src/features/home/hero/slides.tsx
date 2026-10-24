import { ArrowRight, Ticket } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { CrimsonHalo, Spotlights } from "@/components/brand/atmosphere";
import { RatingBadge } from "@/components/cinema/badges";
import { LocalTime, ScreeningStatus } from "@/components/cinema/live-time";
import { Button } from "@/components/ui/button";
import { lowestPrice, sortedShowtimes, splitTitle } from "@/features/catalog/screening";
import type { CatalogFilm } from "@/features/catalog/types";
import { formatMoney, formatRuntime } from "@/lib/format";

import { TrailerButton } from "./trailer-button";

/* The billboard's pieces: the stage (art, light and scrim), a featured film and the empty state. */

/** Staggered entrance: each line of copy rises in shortly after the one before it. */
const stagger = (step: number): CSSProperties => ({ animationDelay: `${150 + step * 90}ms` });

export function HeroStage({
  children,
  image,
  priority,
}: {
  children: ReactNode;
  image?: string;
  priority: boolean;
}) {
  return (
    <div className="relative isolate flex min-h-svh items-center overflow-hidden pt-28 pb-32 lg:h-[88svh] lg:max-h-250 lg:min-h-180 lg:pt-44 lg:pb-28">
      {image && (
        <Image
          src={image}
          alt=""
          fill
          priority={priority}
          fetchPriority={priority ? "high" : "low"}
          sizes="100vw"
          quality={75}
          className="-z-30 animate-ken-burns object-cover object-[65%_25%] lg:object-[75%_35%]"
        />
      )}
      <CrimsonHalo className="-z-20 mix-blend-screen" />
      {/* As the house lights dim: an even scrim behind centred copy (mobile), black from the
          left (desktop) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 animate-lights-dim bg-[linear-gradient(0deg,#000_0%,rgb(0_0_0/0.72)_30%,rgb(0_0_0/0.6)_65%,rgb(0_0_0/0.7)_100%)] lg:bg-[linear-gradient(90deg,#000_0%,rgb(0_0_0/0.9)_28%,rgb(0_0_0/0.4)_55%,transparent_80%),linear-gradient(0deg,#000_0%,transparent_22%)]"
      />
      <div className="mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-16">{children}</div>
      {/* Above the copy and art, so the beams light what they pass over */}
      <Spotlights />
    </div>
  );
}

export function FeaturedSlide({ film, priority }: { film: CatalogFilm; priority: boolean }) {
  const next = sortedShowtimes(film)[0];
  const price = lowestPrice(film.showtimes);
  const { lead, accent } = splitTitle(film.title);

  return (
    <HeroStage image={film.posterLandscape} priority={priority}>
      <div className="max-w-3xl">
        <div className="flex animate-rise items-center gap-2.5" style={stagger(0)}>
          {next && <ScreeningStatus startTime={next.startTime} endTime={next.endTime} />}
          <RatingBadge rating={film.ageRating} />
        </div>

        <h1
          className="mt-7 animate-rise font-display text-[clamp(3rem,7.5vw,6.5rem)] leading-[0.86] font-black uppercase"
          style={stagger(1)}
        >
          {lead && <span className="block">{lead}</span>}
          <span className="block text-outline">{accent}</span>
        </h1>

        <p
          className="mt-7 line-clamp-3 max-w-xl animate-rise text-base leading-relaxed text-pretty text-white/75 sm:text-lg"
          style={stagger(2)}
        >
          {film.synopsis}
        </p>

        {next && (
          <p
            className="mt-6 flex animate-rise flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60"
            style={stagger(3)}
          >
            <span className="font-medium text-white">
              Next screening <LocalTime iso={next.startTime} />
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatRuntime(film.durationMinutes)}</span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span className="hidden sm:inline">{film.producerName}</span>
          </p>
        )}

        <div className="mt-9 flex animate-rise flex-wrap items-center gap-3" style={stagger(4)}>
          {next && (
            <Button asChild size="xl">
              <Link href={`/movies/${film.slug}/showtimes/${next.id}`}>
                <Ticket data-icon="inline-start" />
                Reserve your seat
                {price && (
                  <span className="font-medium tabular-nums opacity-85">
                    · from {formatMoney(price.amount, price.currency)}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {/* Teaser: the API returns trailerStreamUrl; switched off until the experience is agreed. */}
          {film.trailerUrl && <TrailerButton src={film.trailerUrl} title={film.title} />}

          <Button asChild size="xl" variant="glass">
            <Link href="/#how-it-works">
              How it works
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
    </HeroStage>
  );
}

/** Shown when no premieres are scheduled yet (or the catalog is unreachable). */
export function EmptyHero() {
  return (
    <HeroStage image="/placeholder/scene-aisle.jpg" priority>
      <div className="max-w-xl">
        <p className="animate-rise text-[0.7rem] font-bold tracking-[0.36em] text-brand uppercase">
          Koncave Cinema
        </p>
        <h1
          className="mt-5 animate-rise font-display text-[clamp(3rem,7.5vw,6rem)] leading-[0.88] font-black uppercase"
          style={stagger(1)}
        >
          The premiere <span className="block text-outline">comes home</span>
        </h1>
        <p className="mt-7 animate-rise text-lg leading-relaxed text-white/75" style={stagger(2)}>
          Scheduled showtimes, communal halls and private suites for African film. New premieres are
          being scheduled; check back soon.
        </p>
        <div className="mt-9 flex animate-rise flex-wrap gap-3" style={stagger(3)}>
          <Button asChild size="xl">
            <Link href="/#how-it-works">How Koncave works</Link>
          </Button>
          <Button asChild size="xl" variant="glass">
            <Link href="/#auditoriums">See the auditoriums</Link>
          </Button>
        </div>
      </div>
    </HeroStage>
  );
}
