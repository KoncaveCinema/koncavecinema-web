# Performance Rules

The API is built for premiere-night load; the web app must match it on a mid-range Android phone
over a Nigerian 4G connection. These rules are enforced by configuration and lint where possible
and by review otherwise. Each one is grounded in the Next.js 16 documentation bundled in
`node_modules/next/dist/docs/` or in measurements of this codebase.

## 1. Budgets

| Metric                                   | Budget                   | Measured (F0, home page) |
| :--------------------------------------- | :----------------------- | :----------------------- |
| Largest Contentful Paint (mobile, 4G)    | < 2.5 s                  | to measure in F1         |
| Interaction to Next Paint                | < 200 ms                 | to measure in F1         |
| Cumulative Layout Shift                  | < 0.1                    | 0 (no images yet)        |
| First-load JS, framework (React + Next)  | fixed, about 140 KB gzip | 143 KB                   |
| First-load JS, our code, marketing pages | ≤ 40 KB gzip             | 16 KB                    |
| First-load CSS                           | ≤ 20 KB gzip             | 11 KB                    |

Legacy polyfills (38 KB) are served with `noModule`; modern browsers never download them.

How to measure: `npm run build`, then `npm run analyze` (Next's built-in Turbopack analyzer)
for what is inside each chunk. Web Vitals are logged in the console during development
(`src/components/providers/web-vitals.tsx`) and reported to monitoring from Phase F9.

## 2. What is already configured (Phase F0)

- **Cache Components + Partial Prefetching** (`next.config.ts`): pages are served as prerendered
  static shells with dynamic parts streamed into `<Suspense>` boundaries; links prefetch the
  static parts of their destination, which is what Next calls instant navigation. In
  development, every page is validated and anything that would block a navigation is reported
  in the dev overlay. Treat those reports as errors.
- **React Compiler** (`reactCompiler`, native Rust port in Turbopack): components and hooks are
  memoised automatically. Do not add `useMemo`, `useCallback` or `memo` by hand unless a
  profile shows the compiler skipped a component.
- **Motion loaded lazily**: `LazyMotion` fetches the animation features after hydration and runs
  in `strict` mode, so only the small `m.*` components can be used (`src/components/motion`).
- **No root providers that are not needed everywhere**: no theme provider (dark-only for now),
  tooltip providers per tooltip, the toaster loaded after hydration, React Query devtools only in
  development.
- **API preconnect**: the root layout preconnects to the API origin; React sends it as an HTTP
  `Link` header, so the session refresh skips DNS, TCP and TLS set-up.
- **Fonts** via `next/font`: self-hosted, preloaded (main font only), `display: swap`.
- **Images**: AVIF then WebP, 31-day optimiser cache, remote hosts allow-listed.
- **Production bundles** drop `console.log` / `console.info` (warnings and errors are kept).

## 3. Animation rules (Next.js + Motion)

Most slow Next.js + Motion apps come from route-level `AnimatePresence`, the full `motion.*`
components shipped in the first bundle, and animating layout properties. This codebase avoids
all three:

1. **Route changes and shared elements use React's `<ViewTransition>`** (React 19.3,
   `import { ViewTransition } from "react"`), not Motion. It drives the browser's View
   Transitions API on the compositor, needs no JavaScript library, keeps the old page
   interactive until the new one is ready, and falls back to an instant swap where unsupported.
   Reduced motion is honoured globally in `globals.css`.
2. **Simple enter and exit effects use CSS** (`tw-animate-css` classes that shadcn already
   uses for dialogs, sheets, menus and tooltips). Zero JavaScript.
3. **Motion is for what CSS cannot do**: gestures, springs, scroll-linked effects, orchestrated
   sequences inside one page. Import from `@/components/motion` and use `m.div`, never
   `motion.div` (ESLint blocks it). For one-off imperative effects use `useMiniAnimate`
   (Web Animations API only, about 2 KB).
4. **Animate only `transform`, `opacity`, `filter` and `clip-path`.** Motion hands these to the
   browser's compositor (hardware accelerated, unaffected by a busy main thread). Never animate
   `width`, `height`, `top`, `left`, `margin` or `box-shadow` (use a pseudo-element's opacity).
5. **No layout animations on lists** (`layout` prop) beyond a handful of items; they measure the
   DOM every frame. The catalog grid and chat list never use them.
6. **Respect reduced motion**: `MotionConfig reducedMotion="user"` is global; durations stay at or
   under 300 ms for UI feedback.
7. **Nothing animates while the film plays** except the watermark overlay, which uses a single
   `requestAnimationFrame` loop on a canvas.

## 4. Rendering rules

- Server Components by default. `"use client"` goes on the smallest leaf that needs state,
  effects or browser APIs; pass server-rendered children through client components instead of
  converting a whole layout.
- Never read request-time APIs (`cookies()`, `headers()`, `searchParams`) in a layout; it makes
  every page below it dynamic. Read them in the page, inside `<Suspense>`.
- Public data (catalog, film pages, showtimes) is fetched in Server Components with
  `serverApi` inside `"use cache"` functions with an explicit `cacheLife`; never with the browser
  client.
- Fetch in parallel (`Promise.all`) and stream slow parts behind `<Suspense>` with skeletons that
  match the final layout (no layout shift).
- Prefetch on intent: TanStack Query `prefetchQuery` on hover or focus for client data; links
  rely on Next's automatic prefetch.

## 5. Loading rules

- Heavy libraries load only on the routes that need them, through `next/dynamic` or `import()`:
  Mux Player (watch), LiveKit and Socket.IO (watch), UpChunk (studio), Paystack (checkout).
- The LCP image of a page (billboard, poster) is a `next/image` with `priority` and explicit
  `sizes`; every other image is lazy.
- Third-party scripts go through `next/script` with `strategy="lazyOnload"` unless needed for the
  first interaction.
- Adding a dependency to a shared layout requires an `npm run analyze` check against section 1.

## 6. Network rules

- One request per screen where possible; the API already returns aggregated payloads
  (film with showtimes, capacity with prices).
- TanStack Query `staleTime` of 60 s by default; never refetch on window focus for catalog data.
- Polling only where the API contract requires it (payment verification, upload status,
  playback heartbeat), and it stops as soon as the state is final.
