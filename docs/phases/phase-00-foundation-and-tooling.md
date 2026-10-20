# Phase F0: Foundation & Tooling

## Objective

A clean, typed, enforced codebase that every later phase builds on.

## Deliverables

- Next.js 16 App Router with TypeScript strict, `src/` layout, `@/*` alias, Turbopack.
- Tailwind CSS v4 and shadcn/ui initialised (`components.json`, `src/components/ui`, `cn()`).
- Validated environment (`src/env.ts`) and `.env.example`.
- axios API client (`src/lib/api/`): envelope unwrapping, in-memory access token, single-flight
  refresh, `ApiError`, request ids, idempotency keys. `npm run api:types` generates API types
  from `/api/docs-json`.
- App providers: TanStack Query (with devtools in development), nuqs adapter, Motion
  `LazyMotion`, Sonner toaster.
- Security headers in `next.config.ts`; dev server on port 3001.
- Performance baseline (see `docs/architecture/performance.md`): Cache Components, Partial
  Prefetching, React Compiler, lazily loaded Motion, no unnecessary root providers, API
  preconnect, AVIF images.
- Quality gates identical in spirit to the API: Prettier (+ Tailwind class sorting), ESLint flat
  config with Prettier compatibility, Husky (`pre-commit`: lint-staged + typecheck; `commit-msg`:
  Commitlint; `pre-push`: unit tests + production audit), Commitlint with 100-character lines.
- Vitest + Testing Library and Playwright configured; CI workflow running typecheck, lint, format
  check, unit tests, audit and build.
- Agent rules duplicated from the API (`.cursorrules`, `.agents/`, `CLAUDE.md`,
  `.github/copilot-instructions.md`) and VS Code workspace settings.

## Acceptance Criteria

- [x] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass.
- [x] A non-conventional commit message or a line over 100 characters is rejected.
- [x] Staged files are formatted and linted on commit.
- [x] A missing required environment variable fails the build with a clear message.
