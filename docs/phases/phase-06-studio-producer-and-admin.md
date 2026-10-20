# Phase F6: Studio (Producer & Admin Console)

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

- [ ] A 5 GB upload survives a network drop and resumes.
- [ ] A film cannot be published from the UI unless every API gate is satisfied, and the reason
      is shown when it is not.
