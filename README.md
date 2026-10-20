# Koncave Cinema Web (`koncavecinema-web`)

> Customer, producer and admin web client for **Koncave Cinema**: scheduled premiere streaming,
> communal halls, private suites, protected playback and pre-show snack delivery.

Backend: [koncavecinema-api](https://github.com/KoncaveCinema/koncavecinema-api) (NestJS v11 on
Fastify). Its `docs/` folder owns every API contract and business rule.

## Stack

Next.js 16 (App Router, React 19, Turbopack, Cache Components, React Compiler) · TypeScript ·
Tailwind CSS v4 · shadcn/ui (Radix) · axios · TanStack Query · Zustand · nuqs · React Hook Form +
Zod · Motion · Vitest · Playwright.

Why each was chosen: [docs/architecture/frontend-architecture.md](./docs/architecture/frontend-architecture.md).
How the app stays fast: [docs/architecture/performance.md](./docs/architecture/performance.md).

## Getting started

Prerequisites: Node.js 24 (see `.nvmrc`), and the API running locally on port 3000 (or a
deployed API URL).

```bash
npm install
cp .env.example .env.local      # point NEXT_PUBLIC_API_URL at the API
npm run dev                      # http://localhost:3001
```

Add `http://localhost:3001` to the API's `CORS_ORIGIN` so the browser may call it with
credentials (the refresh cookie).

## Scripts

| Script                      | What it does                                                       |
| :-------------------------- | :----------------------------------------------------------------- |
| `npm run dev`               | Dev server on port 3001 (Turbopack)                                |
| `npm run build` / `start`   | Production build / server                                          |
| `npm run analyze`           | Bundle analysis (Next's built-in Turbopack analyzer)               |
| `npm run typecheck`         | Route type generation + `tsc --noEmit`                             |
| `npm run lint` / `:check`   | ESLint with fixes / zero-warning check                             |
| `npm run format` / `:check` | Prettier (with Tailwind class sorting)                             |
| `npm test`                  | Unit tests (Vitest)                                                |
| `npm run test:e2e`          | End-to-end tests (Playwright; run `npm run test:e2e:install` once) |
| `npm run api:types`         | Generate API types from the running API's OpenAPI document         |
| `npm run audit`             | Audit production dependencies                                      |

## Git hooks and commits

Husky runs lint-staged and the typecheck on commit, Commitlint on the message (Conventional
Commits, every line under 100 characters), and unit tests plus the production audit on push.
Same conventions as the API repository.

## Roadmap

[docs/phases/README.md](./docs/phases/README.md): ten frontend phases mapped to the API phases.
