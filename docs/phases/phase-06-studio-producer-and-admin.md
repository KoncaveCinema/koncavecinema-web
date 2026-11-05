# Phase F6: Admin Console (producer studio later)

## As built (November 2026, sample data)

Built against the API's Phase 5.5 admin module, for `ADMIN` and `SUPER_ADMIN`. Producers have no
console yet. Code in `src/features/admin/`, one folder per area; one demo store
(`demo-store.ts`) stands in for the database, seeded from the sample catalogue.

| Route                           | Screen                                                          | Access                      |
| :------------------------------ | :-------------------------------------------------------------- | :-------------------------- |
| `/admin/login`                  | Staff sign-in                                                   | public                      |
| `/admin`                        | Overview: screenings, refunds waiting, sales, drafts to finish  | staff                       |
| `/admin/films`, `/new`, `/[id]` | Films; a film's readiness, details, certificate, posters, media | staff                       |
| `/admin/showtimes`, `/[id]`     | Schedule, rooms, suites, revenue; change or cancel              | staff                       |
| `/admin/sales`                  | Sales report with CSV export                                    | staff                       |
| `/admin/refunds`                | Refunds queue; recording a refund                               | super admin records         |
| `/admin/payments`               | Payments search with the settlement split                       | staff                       |
| `/admin/members`, `/[id]`       | Member search; passes, resend, cancel, legal name reveal        | staff (reveal: super admin) |
| `/admin/staff`                  | Staff accounts: invite, change role, remove                     | super admin                 |
| `/admin/audit`                  | Audit log with cursor paging                                    | super admin                 |

- **Lists:** `DataTable` (`src/components/data-table/`, on shadcn's table) shows a table from
  `md` up and cards on phones. Rows per page is 10, 20, 50 or 100 (`?pageSize=`, the API's 20 by
  default) and the page is in `?page=` (`usePagination`). The audit log pages on the API's cursor
  instead (`useCursorPagination`, 50 by default): newest, previous and next, with no total, since
  the log is never counted. Its entries open beneath their row to show what was recorded.
- **States:** skeleton rows in the real columns; an error with a retry; an empty list told
  apart from nothing matching the filters (with "Clear filters"); a record's page through
  `QueryView` (loading, not found, error, content); `error.tsx` keeps the sidebar if a page
  breaks.
- **Staff:** the role is a badge; changing it or removing access is in the row's "⋯" menu, behind
  a confirmation. Nobody changes their own access.
- **Account menu:** in the console it holds the person's details and role, Account settings, My
  tickets and Sign out; the sidebar reaches every section, and the logo goes home.
- **States from the API:** a showtime's `state` (on `/admin/showtimes` and on a film's showtimes)
  and a pass's `accessEndsAt` are read, never worked out from `endTime`.

The original plan below is kept for the producer studio, which comes later.

## Objective

Everything a producer needs to take a film from draft to premiere, enforcing the same gates as the
API (NFVCB certificate, uploaded master, price range).

## API Endpoints

| Method  | Endpoint                           | Use                                            |
| :------ | :--------------------------------- | :--------------------------------------------- |
| `POST`  | `/api/admin/movies`                | Create draft                                   |
| `PATCH` | `/api/admin/movies/:id`            | Edit draft (metadata, artwork, watermark mode) |
| `PATCH` | `/api/admin/movies/:id/compliance` | Bind NFVCB certificate number and document URL |
| `PATCH` | `/api/admin/movies/:id/publish`    | Publish                                        |
| `POST`  | `/api/admin/videos/direct-upload`  | Get a Mux upload URL                           |
| `GET`   | `/api/admin/videos/:id`            | Poll upload / encoding status                  |
| `POST`  | `/api/admin/movies/:id/video`      | Attach the READY master                        |
| `POST`  | `/api/admin/showtimes`             | Schedule (base price ₦2,500–₦10,000)           |
| `PATCH` | `/api/admin/showtimes/:id`         | Edit (price locked after first sale)           |
| `GET`   | `/api/admin/calculator/payout`     | Payout preview per tier                        |

## Deliverables

- Studio layout with role gate (`PRODUCER_ADMIN`, `SUPER_ADMIN`), excluded from indexing.
- Film wizard: details, artwork, compliance (`NFVCB/…` format), master upload, publish checklist
  that mirrors the API's publish errors (`MOVIE_NOT_CERTIFIED`, `MOVIE_MISSING_MASTER_ASSET`,
  `MOVIE_MISSING_TRAILER`).
- Resumable master upload with `@mux/upchunk` (pause, resume, progress, survives a flaky
  connection), then status polling `UPLOADING → PROCESSING → READY | ERRORED`.
- Showtime scheduler with timezone-aware date-time picker, price input with range validation,
  live payout calculator.
- Later (when the API adds them): box-office telemetry, producer payouts (backlog item 5),
  flagged payment refunds (backlog item 9).

## Acceptance Criteria

- [ ] A 5 GB upload survives a network drop and resumes. Needs a real Mux upload.
- [x] A film cannot be published from the UI unless every API gate is satisfied, and the reason
      is shown when it is not. On sample data (`e2e/admin.spec.ts`); check again against the
      API.
