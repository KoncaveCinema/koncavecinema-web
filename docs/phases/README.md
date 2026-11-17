# Koncave Cinema Web: Phased Development Roadmap

The web client is built in ten phases. Each phase lists the API endpoints it consumes, so its
start depends on the matching backend phase being delivered
([API roadmap](https://github.com/KoncaveCinema/koncavecinema-api/blob/main/docs/phases/README.md)).

Backend status (November 2026): API Phases 1–5 and the Phase 5.5 admin module delivered, and
staging is hosted at `staging-api.koncavecinema.com`; Phase 6 (chat and voice) built, 7–8 not
started.

Web status (16 November 2026): every screen through F6 reads and writes the live API, with no
sample data left. Each reply is checked against a schema in `src/api/`, and the whole path from
preparing a film to watching it was tested on staging. F7 (room chat, suites and voice) is built.

```txt
[F0 Foundation & Tooling]
        │
        ▼
[F1 Design System & App Shell]  ◄── Figma
        │
        ├──────────────► [F2 Accounts, Sessions & KYC]       (API 1 ✓)
        │                        │
        ├──────────────► [F3 Catalog, Film Pages & SEO]      (API 2 ✓)
        │                        │
        │                        ▼
        │                [F4 Ticketing & Checkout]           (API 3, 4 ✓)
        │                        │
        │                        ▼
        │                [F5 Lobby & Secure Playback]        (API 5 ✓)
        │
        ├──────────────► [F6 Admin Console]                 (API 5.5 ✓)
        │
        ├──────────────► [F7 Chat & Voice Rooms]             (API 6 ✓)
        ├──────────────► [F8 Concessions & Delivery]         (API 7, pending)
        ▼
[F9 Hardening, Observability & Launch]                       (API 8)
```

| Phase                                           | Title                               | Depends on API | Status  |
| :---------------------------------------------- | :---------------------------------- | :------------- | :------ |
| [F0](./phase-00-foundation-and-tooling.md)      | Foundation & Tooling                | none           | Done    |
| [F1](./phase-01-design-system-and-app-shell.md) | Design System & App Shell           | none           | Done    |
| [F2](./phase-02-accounts-sessions-and-kyc.md)   | Accounts, Sessions & KYC            | Phase 1        | Done    |
| [F3](./phase-03-catalog-film-pages-and-seo.md)  | Catalog, Film Pages & SEO           | Phase 2        | Done    |
| [F4](./phase-04-ticketing-and-checkout.md)      | Ticketing, Checkout & Dashboard     | Phases 3, 4    | Done    |
| [F5](./phase-05-lobby-and-secure-playback.md)   | Lobby & Secure Playback             | Phase 5        | Done    |
| [F6](./phase-06-studio-producer-and-admin.md)   | Admin Console (producers later)     | Phases 2, 5.5  | Done    |
| [F7](./phase-07-chat-and-voice-rooms.md)        | Communal Chat & Private Suite Voice | Phase 6        | Built   |
| [F8](./phase-08-concessions-and-delivery.md)    | Concessions & Delivery Tracking     | Phase 7        | Blocked |
| [F9](./phase-09-hardening-and-launch.md)        | Hardening, Observability & Launch   | Phase 8        | Later   |

Every phase ends with: typecheck, lint and unit tests green; Playwright journeys for the phase's
happy path and its main error codes; an accessibility pass (keyboard, focus, contrast); and a
bundle check against the budgets in
[frontend-architecture.md](../architecture/frontend-architecture.md#5-performance-budgets).
