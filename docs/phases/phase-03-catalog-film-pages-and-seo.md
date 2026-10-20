# Phase F3: Catalog, Film Pages & SEO

## Objective

Fast, indexable pages that sell premieres and land social-media traffic straight on a showtime.

## API Endpoints

| Method | Endpoint                      | Use                                                 |
| :----- | :---------------------------- | :-------------------------------------------------- |
| `GET`  | `/api/movies`                 | Catalog, paginated (`page`, `pageSize`, `meta`)     |
| `GET`  | `/api/movies/:slug`           | Film page: synopsis, age rating, trailer, showtimes |
| `GET`  | `/api/showtimes/:id`          | Showtime detail and timing                          |
| `GET`  | `/api/showtimes/:id/capacity` | Tier prices, breakdown and live availability        |

## Deliverables

- Home: billboard of the next premiere, upcoming showtimes, catalog rail.
- Catalog with URL-driven pagination (nuqs) and skeleton loading.
- Film page `/movies/[slug]`: poster, billboard, synopsis, NFVCB rating badge, trailer (lazy,
  click-to-play), showtime list in the viewer's timezone with countdowns.
- Deep link `/movies/[slug]/showtimes/[id]` (the API's marketing link) opening tier selection.
- Server rendering with ISR; `generateMetadata`, Open Graph image per film, JSON-LD (`Movie`,
  `ScreeningEvent` with `offers`), `sitemap.ts`, `robots.ts`.
- 404 and error boundaries for unknown slugs and API outages (`SERVICE_UNAVAILABLE`).

## Acceptance Criteria

- [ ] Film pages render fully with JavaScript disabled (except trailer playback).
- [ ] Lighthouse SEO 100 and performance above 90 on a throttled mobile profile.
- [ ] Capacity and prices refresh without a full page reload.
