import { ArrowRight, Ticket } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

import { RatingBadge } from "@/components/cinema/badges";
import { LocalTime, ScreeningStatus } from "@/components/cinema/live-time";
import { HeroStage } from "@/components/cinema/hero-stage";
import { TrailerButton } from "@/components/cinema/trailer-button";
import { Button } from "@/components/ui/button";
import { lowestPrice, sortedShowtimes, splitTitle } from "@/features/catalog/screening";
import type { CatalogFilm } from "@/features/catalog/types";
import { formatMoney, formatRuntime } from "@/lib/format";

/* The billboard's pieces: a featured film and the empty state, on the shared hero stage. */

/** Staggered entrance: each line of copy rises in shortly after the one before it. */
const stagger = (step: number): CSSProperties => ({ animationDelay: `${150 + step * 90}ms` });

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
          className="mt-4 animate-rise font-display text-[clamp(2.25rem,6vw,4rem)] leading-[0.88] font-black uppercase sm:mt-7 lg:text-[clamp(3rem,7.5vw,6.5rem)] lg:leading-[0.86]"
          style={stagger(1)}
        >
          {lead && <span className="block">{lead}</span>}
          <span className="block text-outline">{accent}</span>
        </h1>

        <p
          className="mt-3.5 line-clamp-2 max-w-xl animate-rise text-sm leading-relaxed text-pretty text-white/75 sm:mt-7 sm:line-clamp-3 sm:text-base lg:text-lg"
          style={stagger(2)}
        >
          {film.synopsis}
        </p>

        {next && (
          <p
            className="mt-4 flex animate-rise flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60 sm:mt-6"
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

        <div
          className="mt-6 flex animate-rise flex-wrap items-center gap-3 sm:mt-9"
          style={stagger(4)}
        >
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

          {/* Teaser: Streamable links embed, HLS streams play in our own player */}
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
