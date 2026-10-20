# Claude Code Operating Guidelines: Koncave Cinema Web

## 1. Project Overview & Architecture

- **Repository**: `koncavecinema-web`: the customer, producer and admin web client for Koncave Cinema.
- **Framework**: Next.js 16 (App Router, React 19, TypeScript strict), Turbopack for dev and build,
  Cache Components on. Next 16 differs from older versions (for example `middleware.ts` is now
  `proxy.ts`); check the bundled guides in `node_modules/next/dist/docs/` before using a Next API.
- **Styling**: Tailwind CSS v4 (CSS-first config, tokens in `src/app/globals.css`) and shadcn/ui
  primitives in `src/components/ui` (Radix based, owned by this repo). Icons: `lucide-react`.
- **Backend**: `koncavecinema-api` (NestJS v11 on Fastify). Its `docs/` folder is the source of
  truth for API contracts, error codes and business rules. Read the relevant API doc before
  building a screen that uses it.
- **HTTP**: one axios instance in `src/lib/api/client.ts`. It unwraps the API's response envelope
  (`{ statusCode, success, data, meta?, timestamp }`), attaches the in-memory access token,
  refreshes once on `401` through the HttpOnly refresh cookie, and turns error bodies into
  `ApiError` (branch on `code`, never on `message`). Types for the API come from its OpenAPI
  document: `npm run api:types` writes `src/lib/api/schema.d.ts`.
- **State**: TanStack Query for server state; Zustand for client state (player, room); nuqs for
  URL state (filters, tabs). Forms use React Hook Form with Zod schemas.
- **Performance**: read `docs/architecture/performance.md` before adding a dependency, a provider,
  a client component or an animation. Route transitions use React `<ViewTransition>`; Motion is
  imported only from `@/components/motion` (`m.*`, loaded lazily); the React Compiler memoises,
  so no manual `useMemo` / `useCallback`.
- **Environment**: validated with `@t3-oss/env-nextjs` in `src/env.ts`. Never read
  `process.env` elsewhere.
- **Tests**: `npm test` (Vitest + Testing Library, seconds). `npm run test:e2e` (Playwright).
- **Roadmap**: `docs/phases/README.md`; architecture decisions: `docs/architecture/`.

---

## 2. STRICT APPROVAL WORKFLOW (MANDATORY)

### Phase 1: Absolute Read-Only Investigation (Default State)

- The initial phase of any request is strictly read-only.
- Use read-only tools (`view_file`, `list_dir`, `grep_search`, `git status`, `git diff`) to inspect the codebase.
- **CRITICAL**: You are ABSOLUTELY FORBIDDEN from creating new files, deleting files, editing existing code, running installation commands, or executing modifying scripts of any kind until approval is granted.

### Phase 2: Scope-Based Proposal Formats

- **Small/Minor Changes** (minor styling tweaks, simple fixes, few lines of code):
  - Skip creating formal artifact files.
  - Write a concise inline text proposal directly in the chat response listing target files and exact lines changing.
- **Medium to Large Changes** (structural refactoring, multiple file additions/deletions, complex logic):
  - You MUST create or update the formal `implementation_plan.md` artifact document.
  - Detail the architecture, proposed edits, and verification steps.
  - Present the link or path to the user for review.

### Phase 3: Strict Halt for User Approval

- Immediately after presenting your proposal (inline summary or `implementation_plan.md`), **you must halt all tool calls and end your turn**.
- You are ABSOLUTELY FORBIDDEN from performing any file write/replace operations or modifying terminal commands until the user explicitly responds with verbal approval (e.g., "proceed", "approve", "go ahead").

---

## 3. Windows Terminal Execution Safeguards

- **Environment**: Windows.
- **Mandatory Rule**: CRITICAL — For all shell commands, PREPEND `cmd /c` to the command string.
- **Reason**: Prevents ConPTY pipe leaks, process hangs, and ghost tasks on Windows shells.
- **Example**: Run `cmd /c npm install` instead of `npm install`.

---

## 4. Git & Version Control Rules

### 4.1 Git Commits

- **Format**: Conventional Commits structure (e.g., `feat(scope):`, `fix(scope):`, `refactor(scope):`, `chore(scope):`, `docs(scope):`).
- **Strict Line Limit**: Every single line in the commit message (title, blank lines, bullets) must be strictly **under 100 characters**.
- **No Implementation Details**: Describe _what_ changed functionally from a user or system perspective, not _how_ it was implemented.
  - Do NOT include JSX/HTML tags (e.g., `<div>`, `<form>`).
  - Do NOT include CSS classes or Tailwind utility names.
  - Do NOT include code-level variables, hook handles, or state handlers (e.g., `useState`, `userType`).
- **Workflow**: Run `cmd /c git status` and `cmd /c git diff` to inspect exact functional changes.
- **Granular Flat Bullets**: Include detailed individual bullet points proportional to the changes. No nested bullets.
- **On-Demand Generation Only**: Do NOT generate git commits automatically unless the user explicitly requests one.
- **No Co-Author or AI Attribution**: Never add `Co-Authored-By` trailers, "Generated with" lines, or any other AI attribution to commit messages or pull requests.
- **Shell-Safe Output**: Quoted and escaped cleanly for safe copy-pasting across Bash and Windows terminals.

### 4.2 Pull Requests (PRs)

- Concise, conventional format with only a high-level **Summary** and a flat list of **Key Changes** (no nested bullets).
- Key changes must represent discrete functional capabilities introduced.

---

## 5. Frontend Code Practices & Standards

- Server Components by default. Add `"use client"` only for state, effects, browser APIs or
  event handlers, and push it as far down the tree as possible.
- Route groups: `(marketing)` public and indexable, `(auth)` sign-in flows, `(account)` signed-in
  customer area, `(studio)` producer and admin console, `watch/` the screening room.
- Feature code lives in `src/features/<feature>/` (api hooks, components, schemas); shared UI in
  `src/components/`; framework-free helpers in `src/lib/`.
- File names are `kebab-case`; components are named exports in PascalCase.
- Never store tokens in `localStorage`, `sessionStorage` or a readable cookie.
- Money is shown from the API's breakdown fields; never recompute prices on the client.
- Heavy client libraries (Mux Player, LiveKit, UpChunk, Socket.IO) are loaded with
  `next/dynamic` or dynamic `import()` only on the routes that need them.
