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
| API types          | `openapi-typescript` from the API's `/api/docs-json`    | Request and response types follow the backend automatically; no hand-written duplicates.                                                                                   |
| Server state       | TanStack Query v5                                       | Caching, retries, polling (payment verification, upload status), optimistic updates, SSR hydration.                                                                        |
| Client state       | Zustand                                                 | Small, selector-based stores for the player and room; no provider tree.                                                                                                    |
| URL state          | nuqs                                                    | Type-safe search params for filters, tabs and pagination; shareable links.                                                                                                 |
| Forms & validation | React Hook Form + Zod 4                                 | Uncontrolled inputs (fast on low-end phones); Zod schemas mirror the API DTO rules.                                                                                        |
| Animation          | React `<ViewTransition>`, CSS, Motion `m.*` (lazy)      | Native view transitions for routes; CSS for simple effects; Motion only for gestures and springs. See [performance.md](./performance.md#3-animation-rules-nextjs--motion). |
| Rendering speed    | Cache Components, Partial Prefetching, React Compiler   | Static shells with streamed data, instant navigations, automatic memoisation.                                                                                              |
| Toasts             | Sonner                                                  | The shadcn standard; accessible, stackable.                                                                                                                                |
| Dates & countdowns | date-fns v4                                             | Tree-shakable; showtime and countdown formatting in the viewer's timezone.                                                                                                 |
| Environment        | `@t3-oss/env-nextjs` + Zod                              | Build fails on a missing or malformed variable, mirroring the API's validated environment.                                                                                 |
| Unit tests         | Vitest + Testing Library                                | Fast, ESM-native, Vite-compatible.                                                                                                                                         |
| End-to-end tests   | Playwright                                              | Real browsers, including WebKit for Safari / FairPlay behaviour.                                                                                                           |
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
  the API returns a fresh access token. A `401` on any request triggers one shared refresh (all
  concurrent requests wait on the same promise) and a single retry; a failed refresh signs the
  user out.
- Route protection: signed-in areas render a client guard that waits for the bootstrap refresh.
  Server-side gating (Next.js `proxy.ts`) cannot read the API's cookie, so a non-sensitive
  `kc_signed_in=1` hint cookie set by the web app is used only to choose a redirect early, never
  as proof of identity.
- Social login is out of scope for the MVP ([PRD 2.2](https://github.com/KoncaveCinema/koncavecinema-api/blob/main/docs/specifications/prd.md)).

## 3. Talking to the API

- **Topology**: the browser calls the API directly at `NEXT_PUBLIC_API_URL` with
  `withCredentials: true`. In production the API lives on `api.koncavecinema.com`, the same site
  as `koncavecinema.com`, so the `SameSite=Strict` refresh cookie is sent. Locally the web app runs
  on `http://localhost:3001` and the API on `http://localhost:3000`; add
  `http://localhost:3001` to the API's `CORS_ORIGIN`.
- Calling the API directly (instead of proxying through Next.js) keeps the viewer's real IP
  address visible to the API, which the geo-velocity check in Phase 5 depends on, and keeps
  heartbeats one hop.
- Server Components fetch public data (catalog, film pages) with the same client on the server,
  without credentials, and cache with `revalidate`.
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
