import type {
  ApiMovieDetail,
  ApiMovieListItem,
  ApiScheduleShowtime,
  ApiShowtimeCapacity,
  ApiTierPrices,
} from "./api-types";
import { buildFixtureCatalog, type FixtureFilmRecord, type FixtureShowtime } from "./fixture-films";
import { FIXTURE_TIERS, fixturePricing } from "./fixture-pricing";

/*
 * Sample data only (NEXT_PUBLIC_DATA_SOURCE=fixtures): the public catalogue endpoints answered
 * from the sample films, each in the API's own shape and by the API's own rules (which films are
 * listed, which screenings, and every price). The pages then read both sources the same way.
 */

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
// Lagos is UTC+1 all year
const LAGOS_OFFSET = 60 * MINUTE;
const SCHEDULE_DAYS = 14;

const tierPrices = (basePrice: number) =>
  Object.fromEntries(
    FIXTURE_TIERS.map(({ tier }) => [tier, fixturePricing(basePrice, tier).totalPayable]),
  ) as ApiTierPrices;

const individual = (basePrice: number) => fixturePricing(basePrice, "INDIVIDUAL").totalPayable;

/** Screenings not yet over, soonest first (the API leaves out ended ones) */
function openShowtimes(film: FixtureFilmRecord, now: number): FixtureShowtime[] {
  return film.showtimes
    .filter((showtime) => Date.parse(showtime.endTime) > now)
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}

function listItem(film: FixtureFilmRecord, now: number): ApiMovieListItem {
  const open = openShowtimes(film, now);
  const next = open[0];
  // The from-price is in the currency of the next screening, at its lowest base price
  const sameCurrency = open.filter((showtime) => showtime.currency === next?.currency);
  return {
    id: film.id,
    slug: film.slug,
    title: film.title,
    synopsis: film.synopsis,
    durationMinutes: film.durationMinutes,
    ageRating: film.ageRating,
    producerName: film.producerName,
    trailerStreamUrl: film.trailerUrl ?? "",
    posterLandscape: film.posterLandscape,
    posterPortrait: film.posterPortrait,
    createdAt: film.createdAt,
    nextShowtimeAt: next?.startTime ?? null,
    _count: { showtimes: open.length },
    status: film.status,
    priceFrom: next
      ? {
          amount: individual(Math.min(...sameCurrency.map((showtime) => showtime.basePrice))),
          currency: next.currency,
        }
      : null,
  };
}

/** GET /movies?upcoming=true&sort=soonest: published films with a screening not yet over */
export function fixtureNowShowing(now: number): ApiMovieListItem[] {
  return buildFixtureCatalog(now)
    .filter((film) => film.status === "PUBLISHED")
    .map((film) => listItem(film, now))
    .filter((item) => item.nextShowtimeAt !== null)
    .sort((a, b) => Date.parse(a.nextShowtimeAt!) - Date.parse(b.nextShowtimeAt!));
}

/** GET /movies?comingSoon=true: announced films, most recently announced first */
export function fixtureAnnounced(now: number): ApiMovieListItem[] {
  return buildFixtureCatalog(now)
    .filter((film) => film.status === "COMING_SOON")
    .sort((a, b) => Date.parse(b.announcedAt!) - Date.parse(a.announcedAt!))
    .map((film) => ({
      ...listItem(film, now),
      nextShowtimeAt: null,
      _count: { showtimes: 0 },
      priceFrom: null,
    }));
}

/** GET /movies/:slug: published or coming soon; null for anything else (the API's 404) */
export function fixtureMovieDetail(now: number, slug: string): ApiMovieDetail | null {
  const film = buildFixtureCatalog(now).find((item) => item.slug === slug);
  if (!film) return null;
  return {
    id: film.id,
    title: film.title,
    slug: film.slug,
    synopsis: film.synopsis,
    durationMinutes: film.durationMinutes,
    ageRating: film.ageRating,
    producerName: film.producerName,
    trailerStreamUrl: film.trailerUrl ?? "",
    posterLandscape: film.posterLandscape,
    posterPortrait: film.posterPortrait,
    nfvcbCertNumber: film.nfvcbCertNumber,
    nfvcbCertUrl: film.nfvcbCertUrl,
    isPublished: film.status === "PUBLISHED",
    status: film.status,
    createdAt: film.createdAt,
    updatedAt: film.createdAt,
    showtimes: openShowtimes(film, now).map((showtime) => ({
      id: showtime.id,
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      basePrice: showtime.basePrice.toFixed(2),
      currency: showtime.currency,
      isLive: Date.parse(showtime.startTime) <= now,
      isCompleted: false,
      priceFrom: individual(showtime.basePrice),
      tierPrices: tierPrices(showtime.basePrice),
    })),
  };
}

/** GET /showtimes: screenings starting today and the 13 Lagos days after, not yet over */
export function fixtureSchedule(now: number): ApiScheduleShowtime[] {
  const today = Math.floor((now + LAGOS_OFFSET) / DAY) * DAY - LAGOS_OFFSET;
  const windowEnd = today + SCHEDULE_DAYS * DAY;
  return buildFixtureCatalog(now)
    .filter((film) => film.status === "PUBLISHED")
    .flatMap((film) =>
      openShowtimes(film, now)
        .filter((showtime) => Date.parse(showtime.startTime) < windowEnd)
        .filter((showtime) => Date.parse(showtime.startTime) >= today)
        .map((showtime): ApiScheduleShowtime => ({
          id: showtime.id,
          startTime: showtime.startTime,
          endTime: showtime.endTime,
          isLive: Date.parse(showtime.startTime) <= now,
          currency: showtime.currency,
          priceFrom: individual(showtime.basePrice),
          tierPrices: tierPrices(showtime.basePrice),
          movie: {
            slug: film.slug,
            title: film.title,
            ageRating: film.ageRating,
            durationMinutes: film.durationMinutes,
            posterPortrait: film.posterPortrait,
            posterLandscape: film.posterLandscape,
          },
        })),
    )
    .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
}

/** GET /showtimes/:id/capacity: the four rooms with their price breakdowns */
export function fixtureCapacity(now: number, showtimeId: string): ApiShowtimeCapacity | null {
  for (const film of buildFixtureCatalog(now)) {
    const showtime = film.showtimes.find((item) => item.id === showtimeId);
    if (!showtime) continue;
    return {
      showtimeId: showtime.id,
      movieTitle: film.title,
      movieSlug: film.slug,
      startTime: showtime.startTime,
      endTime: showtime.endTime,
      confirmedTicketsCount: 0,
      activeHoldsCount: 0,
      tiers: FIXTURE_TIERS.map((tier) => {
        const pricing = fixturePricing(showtime.basePrice, tier.tier);
        return { ...tier, seatCount: pricing.seatCount, pricing };
      }),
    };
  }
  return null;
}
