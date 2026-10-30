import { FIXTURE_TIERS, fixturePricing } from "./fixture-pricing";
import type { CatalogFilm, CatalogShowtime, TicketTier } from "./types";

/**
 * Sample catalog for development, design review and screenshots (NEXT_PUBLIC_DATA_SOURCE=fixtures).
 * Shared by the server (public pages) and the browser demos (a member's
 * passes, the admin console), so both describe the same films.
 * Every title, person and production company here is fictional; the artwork is free-licence
 * placeholder photography (sources in docs/assets/placeholder-credits.md). Showtimes are placed relative to
 * `anchor` so each screening state is visible: live, lobby open, starting soon, later premieres.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// What the buyer pays per tier, from the same formula the API uses
function tierPrices(base: number): Partial<Record<TicketTier, number>> {
  return Object.fromEntries(
    FIXTURE_TIERS.map(({ tier }) => [tier, fixturePricing(base, tier).totalPayable]),
  );
}

interface FixtureFilm extends Omit<
  CatalogFilm,
  "showtimes" | "id" | "nfvcbCertNumber" | "nfvcbCertUrl"
> {
  basePrice: number;
  /** Start times as offsets from the anchor */
  screenings: number[];
}

// The client's teaser, hosted on Mux (public playback ID); plays in our own HLS player
const CLIENT_TRAILER = "https://stream.mux.com/tgzz2gfKV6uz00p8qW7iJFdirInYmn1dbkd3Yug6hiE00.m3u8";

const FILMS: FixtureFilm[] = [
  {
    slug: "ember-and-ash",
    title: "Ember & Ash",
    synopsis:
      "When her brother vanishes owing the wrong men, a Lagos fashion buyer follows his trail " +
      "through the city's night markets and boardrooms, and learns how far she will go to bring " +
      "him home.",
    durationMinutes: 118,
    ageRating: "EIGHTEEN_PLUS",
    producerName: "Harmattan Pictures",
    trailerUrl: CLIENT_TRAILER,
    posterLandscape: "/placeholder/film-ember-and-ash.jpg",
    posterFocus: "60% 35%",
    posterPortrait: "/placeholder/film-ember-and-ash.jpg",
    basePrice: 5000,
    screenings: [-22 * MINUTE, 3 * HOUR, DAY + 2 * HOUR],
  },
  {
    slug: "lagos-after-dark",
    title: "Lagos After Dark",
    synopsis:
      "A night-shift ride-hailing driver picks up a passenger who will not say where she is " +
      "going, only that they must not stop before dawn.",
    durationMinutes: 104,
    ageRating: "FIFTEEN_PLUS",
    producerName: "Third Mainland Films",
    trailerUrl: CLIENT_TRAILER,
    posterLandscape: "/placeholder/film-lagos-after-dark.jpg",
    posterPortrait: "/placeholder/film-lagos-after-dark.jpg",
    basePrice: 4500,
    screenings: [14 * MINUTE, 2 * HOUR + 40 * MINUTE],
  },
  {
    slug: "sade",
    title: "Sade",
    synopsis:
      "In a secluded coastal town cloaked in silence, the mysterious disappearance of a loved " +
      "one forces a courageous young woman to confront dangerous village secrets and an " +
      "escalating vengeance where nobody can be trusted.",
    durationMinutes: 108,
    ageRating: "EIGHTEEN_PLUS",
    producerName: "Koncave Premieres",
    trailerUrl: null,
    posterLandscape: "/movies/sade-movie-poster.jpg",
    posterFocus: "45% 30%",
    posterPortrait: "/movies/sade-movie-poster-2.jpg",
    basePrice: 5000,
    screenings: [15 * MINUTE, 4 * HOUR],
  },
  {
    slug: "love-in-seclusion",
    title: "Love in Seclusion",
    synopsis:
      "Stranded in a lakeside guesthouse during a week of storms, two strangers trade the " +
      "stories they have never told anyone.",
    durationMinutes: 97,
    ageRating: "PG",
    producerName: "Blue Hour Studios",
    trailerUrl: null,
    posterLandscape: "/placeholder/film-love-in-seclusion.jpg",
    posterPortrait: "/placeholder/film-love-in-seclusion.jpg",
    basePrice: 3500,
    screenings: [48 * MINUTE, DAY + 4 * HOUR],
  },
  {
    slug: "city-of-dust",
    title: "City of Dust",
    synopsis:
      "A retired rally driver takes one last job: carry a sealed case across the Sahel " +
      "before the people who want it catch up.",
    durationMinutes: 126,
    ageRating: "TWELVE_PLUS",
    producerName: "Sahel Road Productions",
    trailerUrl: null,
    posterLandscape: "/placeholder/film-city-of-dust.jpg",
    posterPortrait: "/placeholder/poster-city-of-dust.jpg",
    basePrice: 6000,
    screenings: [DAY + 6 * HOUR, 2 * DAY + 5 * HOUR],
  },
  {
    slug: "red-soil",
    title: "Red Soil",
    synopsis:
      "Three sisters return to their late father's farm to divide it, and uncover the bargain " +
      "he made to keep it.",
    durationMinutes: 112,
    ageRating: "FIFTEEN_PLUS",
    producerName: "Laterite Films",
    trailerUrl: null,
    posterLandscape: "/placeholder/film-red-soil.jpg",
    posterPortrait: "/placeholder/poster-red-soil.jpg",
    basePrice: 7500,
    screenings: [6 * DAY + 3 * HOUR],
  },
  {
    slug: "house-of-amina",
    title: "House of Amina",
    synopsis:
      "A widowed architect restores the Kano family home she swore never to enter again, " +
      "one locked room at a time.",
    durationMinutes: 109,
    ageRating: "TWELVE_PLUS",
    producerName: "Sahara Lane Pictures",
    trailerUrl: null,
    posterLandscape: "/placeholder/poster-house-of-amina.jpg",
    posterPortrait: "/placeholder/poster-house-of-amina.jpg",
    basePrice: 5000,
    screenings: [9 * DAY + 2 * HOUR],
  },
  {
    slug: "the-family-meeting",
    title: "The Family Meeting",
    synopsis:
      "A patriarch's surprise announcement at his seventieth birthday dinner turns one evening " +
      "into the longest night the Adebayo family has ever had.",
    durationMinutes: 101,
    ageRating: "PG",
    producerName: "Owambe Originals",
    trailerUrl: null,
    posterLandscape: "/placeholder/poster-the-family-meeting.jpg",
    posterPortrait: "/placeholder/poster-the-family-meeting.jpg",
    basePrice: 4000,
    screenings: [12 * DAY + 4 * HOUR],
  },
  {
    slug: "starlight-over-kaduna",
    title: "Starlight Over Kaduna",
    synopsis:
      "A schoolgirl builds a telescope from scrap to win a national science prize, and " +
      "brings her whole town along for the ride.",
    durationMinutes: 94,
    ageRating: "G",
    producerName: "Northern Light Collective",
    trailerUrl: null,
    posterLandscape: "/placeholder/poster-starlight-over-kaduna.jpg",
    posterPortrait: "/placeholder/poster-starlight-over-kaduna.jpg",
    basePrice: 3000,
    screenings: [15 * DAY + 2 * HOUR],
  },
];

export function buildFixtureCatalog(anchor: number): CatalogFilm[] {
  // Whole minutes, so countdowns line up with the clock
  const base = Math.floor(anchor / MINUTE) * MINUTE;

  return FILMS.map(({ basePrice, screenings, ...film }, filmIndex) => ({
    ...film,
    id: `fixture-film-${filmIndex + 1}`,
    // Fictional certificate numbers in the NFVCB style; no certificate document to link to
    nfvcbCertNumber: `NFVCB/SAMPLE/2026/${String(filmIndex + 101).padStart(4, "0")}`,
    nfvcbCertUrl: null,
    showtimes: screenings.map((at, index): CatalogShowtime => {
      const start = base + at;
      return {
        id: `fixture-showtime-${filmIndex + 1}-${index + 1}`,
        startTime: new Date(start).toISOString(),
        endTime: new Date(start + film.durationMinutes * MINUTE).toISOString(),
        currency: "NGN",
        basePrice,
        tierPrices: tierPrices(basePrice),
      };
    }),
  }));
}
