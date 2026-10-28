import { ArrowDown, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RatingBadge } from "@/components/cinema/badges";
import { ScreeningStatus } from "@/components/cinema/live-time";
import { ShareButton } from "@/components/cinema/share-button";
import { TrailerButton } from "@/components/cinema/trailer-button";
import { Button } from "@/components/ui/button";
import { FilmBackdrop } from "@/features/catalog/film-backdrop";
import { FilmShowtimes } from "@/features/catalog/film-showtimes";
import { FilmTile } from "@/features/catalog/film-tile";
import { getCatalog } from "@/features/catalog/get-catalog";
import { getFilm } from "@/features/catalog/queries";
import { creditLine, lowestPrice, sortedShowtimes } from "@/features/catalog/screening";
import { AUDITORIUMS } from "@/features/home/auditoriums/halls";
import { formatMoney, formatRuntime, ratingDescription, ratingLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function generateStaticParams() {
  const { films } = await getCatalog();
  // Cache Components needs at least one param; an empty catalog renders the not-found page
  return films.length ? films.map((film) => ({ slug: film.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/movies/[slug]">): Promise<Metadata> {
  const film = await getFilm((await params).slug);
  if (!film) return { title: "Film not found" };
  return {
    title: film.title,
    description: film.synopsis,
    alternates: { canonical: `/movies/${film.slug}` },
    openGraph: { images: [{ url: film.posterLandscape, alt: `${film.title} still` }] },
  };
}

/** The first sentence of the synopsis, as the logline under the title */
function logline(synopsis: string): string {
  return synopsis.split(/(?<=[.!?])\s+/)[0] ?? synopsis;
}

const eyebrow =
  "flex items-center gap-3 text-[0.7rem] font-bold tracking-[0.32em] text-brand uppercase";

export default async function FilmPage({ params }: PageProps<"/movies/[slug]">) {
  const film = await getFilm((await params).slug);
  if (!film) notFound();

  const { films } = await getCatalog();
  const next = sortedShowtimes(film)[0];
  const price = lowestPrice(film.showtimes);
  const short = logline(film.synopsis);
  // The story section only when the synopsis says more than the logline above
  const moreStory = film.synopsis.trim() !== short.trim();
  const others = films.filter((item) => item.id !== film.id).slice(0, 8);

  const information = [
    { term: "Runtime", detail: formatRuntime(film.durationMinutes) },
    {
      term: "Classification",
      detail: `${ratingLabel(film.ageRating)} · ${ratingDescription(film.ageRating)}`,
    },
    { term: "NFVCB certificate", detail: film.nfvcbCertNumber ?? "Awaiting certificate" },
    { term: "Produced by", detail: film.producerName },
    {
      term: "Showtimes",
      detail: `${film.showtimes.length} scheduled`,
    },
    { term: "Exhibition", detail: "Online premiere, at scheduled times" },
  ];

  return (
    <>
      <FilmBackdrop
        slug={film.slug}
        image={film.posterLandscape}
        title={film.title}
        focus={film.posterFocus}
      >
        <div className="max-w-2xl">
          <div className="flex animate-rise items-center gap-2.5">
            {next && <ScreeningStatus startTime={next.startTime} endTime={next.endTime} />}
            <RatingBadge rating={film.ageRating} />
          </div>
          <h1
            className={cn(
              "mt-5 animate-rise font-display font-black text-balance uppercase [animation-delay:80ms]",
              film.title.length > 16
                ? "text-[clamp(2.25rem,4.6vw,4rem)]/[0.95]"
                : "text-[clamp(2.75rem,6vw,5.25rem)]/[0.92]",
            )}
          >
            {film.title}
          </h1>
          <p className="mt-4 flex animate-rise flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-white/60 [animation-delay:140ms]">
            <span>{formatRuntime(film.durationMinutes)}</span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <span>NFVCB {ratingLabel(film.ageRating)}</span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <span>{film.producerName}</span>
          </p>
          <p className="mt-5 max-w-xl animate-rise text-lg leading-relaxed text-pretty text-white/85 [animation-delay:200ms]">
            {short}
          </p>
          <div className="mt-8 flex animate-rise flex-wrap items-center gap-3 [animation-delay:260ms]">
            <Button asChild size="xl">
              <a href="#tickets">
                Get tickets
                {price && (
                  <span className="font-medium tabular-nums opacity-85">
                    · from {formatMoney(price.amount, price.currency)}
                  </span>
                )}
                <ArrowDown data-icon="inline-end" />
              </a>
            </Button>
            {film.trailerUrl && <TrailerButton src={film.trailerUrl} title={film.title} />}
            <ShareButton title={film.title} path={`/movies/${film.slug}`} />
          </div>
        </div>
      </FilmBackdrop>

      <div className="mx-auto max-w-360 space-y-24 px-5 pt-10 pb-24 sm:space-y-28 sm:px-8 sm:pt-14 sm:pb-32 lg:px-16">
        {/* Tickets: times visible without a click */}
        <section
          id="tickets"
          aria-labelledby="tickets-title"
          className="grid scroll-mt-24 gap-12 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-16"
        >
          <div className="min-w-0">
            <p className={eyebrow}>
              <span aria-hidden="true" className="h-px w-6 bg-brand" />
              Tickets
            </p>
            <h2
              id="tickets-title"
              className="mt-4 mb-8 font-display text-3xl leading-tight font-extrabold sm:text-4xl"
            >
              Pick a showtime
            </h2>
            <FilmShowtimes slug={film.slug} showtimes={film.showtimes} />
          </div>

          <aside aria-labelledby="rooms-title" className="lg:pt-16">
            <h3
              id="rooms-title"
              className="text-[0.7rem] font-bold tracking-[0.28em] text-white/45 uppercase"
            >
              Ways to watch this film
            </h3>
            <ul className="mt-4 divide-y divide-white/8 border-y border-white/8">
              {AUDITORIUMS.map((hall) => {
                const from = lowestPrice(film.showtimes, hall.tier);
                return (
                  <li key={hall.tier} className="flex items-center gap-4 py-3.5">
                    <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg">
                      <Image src={hall.image} alt="" fill sizes="5rem" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{hall.kind}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/50">
                        <Users className="size-3" />
                        {hall.seats}
                      </p>
                    </div>
                    {from && (
                      <p className="text-right text-xs text-white/50 tabular-nums">
                        from
                        <span className="block text-sm font-semibold text-foreground">
                          {formatMoney(from.amount, from.currency)}
                        </span>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-white/45">
              Choose your room after picking a time. Prices include all fees.
            </p>
          </aside>
        </section>

        {/* About */}
        <section
          aria-labelledby="about-title"
          className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-16"
        >
          <div className="max-w-2xl">
            <p className={eyebrow}>
              <span aria-hidden="true" className="h-px w-6 bg-brand" />
              About the film
            </p>
            <h2
              id="about-title"
              className="mt-4 font-display text-3xl leading-tight font-extrabold sm:text-4xl"
            >
              {moreStory ? "The story" : "Behind the premiere"}
            </h2>
            {moreStory ? (
              <p className="mt-6 text-lg leading-relaxed text-pretty text-white/75">
                {film.synopsis}
              </p>
            ) : (
              <p className="mt-6 text-lg leading-relaxed text-pretty text-white/75">
                {creditLine(film)}, premiering on Koncave at scheduled showtimes in public halls and
                private suites.
              </p>
            )}
            <p className="mt-8 flex items-start gap-3 text-sm text-white/55">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-lobby" />
              Officially licensed. Every ticket supports the people who made this film.
            </p>
          </div>
          <div>
            <h3 className="text-[0.7rem] font-bold tracking-[0.28em] text-white/45 uppercase">
              Information
            </h3>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/8 pt-5">
              {information.map((item) => (
                <div key={item.term}>
                  <dt className="text-xs text-white/45">{item.term}</dt>
                  <dd className="mt-1 text-sm leading-snug wrap-anywhere">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* More premieres */}
        {others.length > 0 && (
          <section aria-labelledby="more-title">
            <div className="flex items-end justify-between gap-6">
              <h2
                id="more-title"
                className="font-display text-2xl leading-tight font-extrabold sm:text-3xl"
              >
                More premieres
              </h2>
              <Link
                href="/movies"
                className="text-sm text-white/55 transition-colors hover:text-foreground"
              >
                All films
              </Link>
            </div>
            <ul className="-mx-5 mt-6 snap-rail gap-4 px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {others.slice(0, 4).map((item) => (
                <li key={item.id} className="w-72 sm:w-auto">
                  <FilmTile film={item} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
