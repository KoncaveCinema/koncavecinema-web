# Frontend Architecture & Technology Decisions

This document records how `koncavecinema-web` is built and why each library was chosen. Where a
decision depends on the backend, the API document that drives it is linked.

## 1. Stack at a Glance

| Concern            | Choice                                                  | Why                                                                                                                                                                        |
| :----------------- | :------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Next.js 16 App Router, React 19, TypeScript strict      | Server Components for indexable catalog pages, streaming SSR, route-level code splitting, Turbopack.                                                                       |
| Styling            | Tailwind CSS v4                                         | CSS-first tokens, zero runtime cost, tiny production CSS.                                                                                                                  |
| Components         | shadcn/ui (Radix primitives), `lucide-react`            | Accessible primitives we own as source, so the Figma design can be applied without fighting a library.                                                                     |
| HTTP               | axios                                                   | Interceptors for the token, single-flight refresh, request ids, idempotency keys and error normalisation in one place.                                                     |
| API types          | Zod schemas per module, types from `z.infer`            | Every response is parsed before a screen uses it; only the fields the screens need are described.                                                                          |
| Server state       | TanStack Query v5                                       | Caching, retries, polling (payment verification, upload status), optimistic updates, SSR hydration.                                                                        |
| Client state       | Zustand                                                 | Small, selector-based stores for the player and room; no provider tree.                                                                                                    |
| URL state          | nuqs                                                    | Type-safe search params for filters, tabs and pagination; shareable links.                                                                                                 |
| Forms & validation | React Hook Form + Zod 4                                 | Uncontrolled inputs (fast on low-end phones); Zod schemas mirror the API DTO rules.                                                                                        |
| Animation          | React `<ViewTransition>`, CSS, Motion `m.*` (lazy)      | Native view transitions for routes; CSS for simple effects; Motion only for gestures and springs. See [performance.md](./performance.md#3-animation-rules-nextjs--motion). |
| Rendering speed    | Cache Components, Partial Prefetching, React Compiler   | Static shells with streamed data, instant navigations, automatic memoisation.                                                                                              |
| Toasts             | Sonner                                                  | The shadcn standard; accessible, stackable.                                                                                                                                |
| Dates & countdowns | date-fns v4                                             | Tree-shakable; showtime and countdown formatting in the viewer's timezone.                                                                                                 |
| Environment        | `@t3-oss/env-nextjs` + Zod                              | Build fails on a missing or malformed variable, mirroring the API's validated environment.                                                                                 |
| Unit tests         | Vitest + Testing Library                                | Our own logic, and each schema checked against a reply recorded from staging. No MSW, no faker, no generated client.                                                       |
| End-to-end tests   | Playwright                                              | A few journeys against staging, run on demand (see section 8).                                                                                                             |
| Quality gates      | ESLint (flat), Prettier, Husky, lint-staged, Commitlint | Same rules and commit conventions as the API repository.                                                                                                                   |

Libraries added only in the phase that needs them (and loaded only on those routes):
`@mux/mux-player-react` (Phase 5), `@mux/upchunk` (Phase 6), `socket.io-client`,
`livekit-client` and `@livekit/components-react` (Phase 7), Paystack Inline (Phase 4),
Sentry (Phase 9).

## 2. Authentication: No Third-Party Auth Library

The API already owns identity: Argon2id passwords, RS256 access tokens (15 minutes) and a rotating
refresh token in an `HttpOnly; SameSite=Strict; Path=/api/auth` cookie
([API Phase 1](https://github.com/KoncaveCinema/koncavecinema-api/blob/main/docs/phases/phase-01-core-scaffolding-auth-kyc.md)).
Auth.js, Clerk or Better Auth would introduce a second session system next to the API's and
duplicate user storage. The web app therefore uses a thin session layer of its own:

- The access token is held **in memory only** (inside the API client module). It is never written
  to `localStorage`, `sessionStorage` or a readable cookie, so injected scripts cannot lift it from
  storage.
- On load, the app calls `POST /api/auth/refresh` once; the browser sends the refresh cookie and
  the API returns a fresh access token. A dropped connection or a server error retries the
  restore (after 2, 5 and 10 seconds); only a `401` signs the member out. A `401` on any
  request triggers one shared refresh (all concurrent requests wait on the same promise) and a
  single retry.
- Route protection: signed-in areas render a client guard that waits for the session restore,
  and the sign-in pages send a signed-in member on. The server can't read the API's cookie, so
  nothing is gated there; `proxy.ts` only runs staging's password gate.
- Social login is out of scope for the MVP ([PRD 2.2](https://github.com/KoncaveCinema/koncavecinema-api/blob/main/docs/specifications/prd.md)).

## 3. Talking to the API

- **Topology**: the browser calls the API directly at `NEXT_PUBLIC_API_URL` with
  `withCredentials: true`. In production the API lives on `api.koncavecinema.com`, the same site
  as `koncavecinema.com`, so the `SameSite=Strict` refresh cookie is sent. Calling the API
  directly keeps the viewer's real IP address visible to the API, which its location check
  depends on, and keeps heartbeats one hop.
- **Local development** runs on `http://localhost:8000`. Against a local API, add that origin to
  the API's `CORS_ORIGIN`. Against staging, the refresh cookie wouldn't cross from localhost, so
  `NEXT_PUBLIC_API_URL` is `http://localhost:8000/api` and a dev-only rewrite forwards it to
  `API_DEV_PROXY_URL` (refused on any Vercel environment).
- **The layer lives in `src/api/`**, written by hand after the API's `openapi.json` (read as the
  reference; nothing is generated from it):
  - the core: `client.ts` (the axios instance, token and refresh), `http.ts` (every browser
    request), `http-server.ts` (anonymous, server-only, public reads), the envelope, `ApiError`,
    the server clock and idempotency keys;
  - one folder per API area (`auth/`, `movies/`, `showtimes/`, `tickets/`, `payments/`,
    `stream-security/`, `admin/`), each with `*-schemas.ts` (Zod, only the fields its screens
    use) and `*-api.ts` (requests that parse every reply, and their TanStack Query hooks);
  - query keys start with the API path (`["/admin/movies", query]`); mutation keys are the API's
    operation names (`["publishMovie"]`).
- **After a write**, `refetch.ts` lists what each operation changes. A save waits only for the
  changed queries on screen, so its toast and the new data land together; the rest refresh in the
  background (a query marked `meta.background`, like the sidebar's refunds badge, never holds a
  save). If the screen can't refresh, a toast says so with a Refresh action.
- **Public pages** read through `http-server.ts` inside `"use cache"` loaders tagged
  `catalog`, shared between visitors and refreshed about every minute. A staff change that
  shows on the site (`refreshesCatalog` in `refetch.ts`) calls the `refreshCatalog` server
  action, which expires the tag so the next visitor sees it.
- **Envelope**: successful responses are `{ statusCode, success, data, meta?, timestamp }`; the
  client returns `data` (and `meta` for paginated lists).
- **Errors**: `{ statusCode, code, message, error, timestamp, path }`; the client throws
  `ApiError` carrying `code`, `status`, `messages` and the `X-Request-Id`. UI copy is keyed by
  `code` ([error codes](https://github.com/KoncaveCinema/koncavecinema-api/blob/main/docs/api/error-codes.md)).
- **Idempotency**: `POST /tickets/reserve` and `POST /payments/checkout/initialize` are sent with an
  `Idempotency-Key` generated once per intended operation and reused on retry.
- **Request ids**: every request carries an `X-Request-Id`; support screens show it.

## 4. Rendering Strategy

| Area                              | Rendering                                       | Notes                                                       |
| :-------------------------------- | :---------------------------------------------- | :---------------------------------------------------------- |
| Home, catalog, film and showtime  | Server Components, ISR (`revalidate`)           | SEO, Open Graph images, JSON-LD `Movie` / `ScreeningEvent`. |
| Sign-in, register, verify         | Server shell + client forms                     | No indexing.                                                |
| Account, tickets, checkout        | Client islands under a server layout            | Data from TanStack Query.                                   |
| Studio (producer / admin console) | Client-heavy, code-split per route              | Excluded from indexing.                                     |
| Screening room (`/watch/...`)     | Client only, dynamically loaded player and SDKs | No SSR of player; strict CSP.                               |

## 5. Performance Budgets

Budgets, measurements and the rules that keep the app fast (rendering, loading, animation,
network) are in [performance.md](./performance.md).

## 6. Security Baseline

- Strict security headers from `next.config.ts` (HSTS, frame denial, no sniffing, referrer policy,
  permissions policy); a Content Security Policy with nonces arrives with the player in Phase 5.
- No secrets in `NEXT_PUBLIC_*` variables. Server-only modules import `server-only`.
- Legal names and phone numbers are never displayed back after KYC; only the public alias.
- The playback page shows "IP Geolocation by DB-IP" linking to [db-ip.com](https://db-ip.com) (licence
  condition of the API's location check).

## 7. Code Layout and Naming

- **Routes stay thin.** A route's `page.tsx` (default export `Page`) sets its metadata and
  renders one component from its feature. The code lives outside `app/`, one of the layouts the
  Next.js project-organisation guide describes.
- **Feature code** lives in `src/features/<feature>/`: the screens, their components and their
  own logic (form schemas, view mapping, the room's clock). They import their data hooks from
  `src/api/<area>`; nothing in `features/` calls the API itself.
- **Page components end in `-page.tsx`.** The component a route renders is
  `<name>-page.tsx`, exporting `<Name>Page`, for example `films-page.tsx` (`FilmsPage`) for
  `/admin/films` and `film-details-page.tsx` (`FilmDetailsPage`) for `/admin/films/[id]`. A file
  that doesn't end in `-page` is a part of a page: a panel, a dialog, a form or a helper. A
  page file exports its page (and its loading skeleton), nothing another page imports.
- **Two kinds of route stay as they are.**
  - **Auth routes** frame a form (`SignInForm` and others), and a form is a part of a page.
  - **Marketing and legal pages** (home, films, showtimes, help, producers, the legal documents)
    are Server Components that compose their sections in the route file itself, with their
    metadata and static params.
- **No `index.tsx` files.** Every page would open as an "index.tsx" tab, and index files read as
  barrels, which slow builds and defeat tree-shaking.
- **Shared code:** `src/components/ui/` (shadcn primitives, owned here),
  `src/components/data-table/` (every list: `DataTable`, its pagination footers),
  `src/components/states/` (empty, error, `QueryView`, the route error), `src/components/console/`
  (the dashboard and admin frame), `src/hooks/` (`usePagination`, `useCursorPagination`, the
  server clock), and `src/lib/` (helpers with no React).
- **Lists** page by number (`?page=`, `?pageSize=` of 10, 20, 50 or 100, the API's 20 by
  default), or by the API's cursor for a list too large to count (the audit log).

## 8. End-to-End Journeys

A few Playwright journeys (`npm run test:e2e`) run against staging through the dev server, on
demand rather than on every commit: guards, sign-in, booking up to Paystack's checkout, the
screening room, and one admin flow that deletes what it creates. They read staging as it stands
(the next pass, the first open screening) instead of expecting fixed data.

- **Accounts** come from `.env.e2e.local` (ignored by git): `E2E_MEMBER_EMAIL`,
  `E2E_MEMBER_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`. A journey whose account is
  missing is skipped.
- **One worker.** Each journey signs in afresh. Refresh tokens are single-use, so parallel
  journeys sharing a session would trip the API's reuse check and end every session.
- **Left to manual checks:** paying (each run would leave a paid pass and a refund), uploads to
  Mux, and playback to the end of a screening.
