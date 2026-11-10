import "server-only";

import { cacheTag } from "next/cache";
import { z } from "zod";

import { cachedRead } from "../cached-read";
import { isApiError } from "../errors";
import { httpServer } from "../http-server";
import { pageSchema } from "../page-schema";
import {
  featuredFilmSchema,
  movieDetailSchema,
  movieListItemSchema,
  type FeaturedFilm,
  type MovieDetail,
  type MovieListItem,
} from "./movies-schemas";

/*
 * The public film reads, cached for every visitor (see cached-read.ts). Each reply is parsed
 * before anything reads it. Null means the API couldn't be read.
 */

const FILMS_PAGE_SIZE = 50;
const moviePage = pageSchema(movieListItemSchema);

/** GET /movies?upcoming=true&sort=soonest: published films with a screening still to come */
export async function readNowShowing(): Promise<MovieListItem[] | null> {
  "use cache";
  cacheTag("catalog");
  return cachedRead("Films", async () => {
    const page = moviePage.parse(
      await httpServer({
        url: "/movies",
        params: { upcoming: true, sort: "soonest", page: 1, pageSize: FILMS_PAGE_SIZE },
      }),
    );
    return page.items;
  });
}

/** GET /movies?comingSoon=true: films announced but not yet bookable, newest first */
export async function readComingSoon(): Promise<MovieListItem[] | null> {
  "use cache";
  cacheTag("catalog");
  return cachedRead("Coming soon", async () => {
    const page = moviePage.parse(
      await httpServer({
        url: "/movies",
        params: { comingSoon: true, page: 1, pageSize: FILMS_PAGE_SIZE },
      }),
    );
    return page.items;
  });
}

const featuredList = z.array(featuredFilmSchema);

/** GET /movies/featured?limit=: the films leading the home page, in the API's order (not paged) */
export async function readFeatured(limit: number): Promise<FeaturedFilm[] | null> {
  "use cache";
  cacheTag("catalog");
  return cachedRead("Featured films", async () =>
    featuredList.parse(await httpServer({ url: "/movies/featured", params: { limit } })),
  );
}

/**
 * GET /movies/:slug. "missing" when the film doesn't exist (or is a draft): the API's 404, which
 * is an answer, not an outage, so it is cached normally.
 */
export async function readMovie(slug: string): Promise<MovieDetail | "missing" | null> {
  "use cache";
  cacheTag("catalog");
  return cachedRead("Film", async () => {
    try {
      return movieDetailSchema.parse(
        await httpServer({ url: `/movies/${encodeURIComponent(slug)}` }),
      );
    } catch (error) {
      if (isApiError(error) && error.status === 404) return "missing";
      throw error;
    }
  });
}
