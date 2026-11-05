import "server-only";

import { env } from "@/env";

import { toCatalogFilm } from "./catalog-view";
import { readAnnounced, readNowShowing, readSchedule } from "./sources";
import type { Catalog } from "./types";

/**
 * The catalogue for public lists: the films now showing (GET /movies), the announced ones
 * (GET /movies?comingSoon=true) and the schedule (GET /showtimes) that gives each film its
 * screenings for the next two weeks. Three requests, whatever the size of the catalogue; a
 * film's full detail is loaded only on its own page.
 *
 * An unreachable API never breaks a page or the build: sections show their empty states until
 * the API answers again.
 */
export async function getCatalog(): Promise<Catalog> {
  const [films, announced, schedule] = await Promise.all([
    readNowShowing(),
    readAnnounced(),
    readSchedule(),
  ]);
  return {
    films: (films ?? []).map((movie) => toCatalogFilm(movie, schedule ?? [])),
    announced: (announced ?? []).map((movie) => toCatalogFilm(movie, [])),
    source: env.NEXT_PUBLIC_DATA_SOURCE === "fixtures" ? "fixtures" : "api",
    unavailable: films === null,
  };
}
