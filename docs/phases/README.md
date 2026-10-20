# Koncave Cinema Web: Phased Development Roadmap

The web client is built in ten phases. Each phase lists the API endpoints it consumes, so its
start depends on the matching backend phase being delivered
([API roadmap](https://github.com/KoncaveCinema/koncavecinema-api/blob/main/docs/phases/README.md)).

Backend status (October 2026): API Phases 1–4 delivered; Phase 5 (Mux video and stream security)
built, end-to-end specs pending; Phases 6–8 not started.

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
        │                [F5 Lobby & Secure Playback]        (API 5, built)
        │
        ├──────────────► [F6 Studio: Producer & Admin]       (API 2, 5)
        │
        ├──────────────► [F7 Chat & Voice Rooms]             (API 6, pending)
        ├──────────────► [F8 Concessions & Delivery]         (API 7, pending)
        ▼
[F9 Hardening, Observability & Launch]                       (API 8)
```

| Phase                                           | Title                               | Depends on API | Status  |
| :---------------------------------------------- | :---------------------------------- | :------------- | :------ |
| [F0](./phase-00-foundation-and-tooling.md)      | Foundation & Tooling                | none           | Done    |
| [F1](./phase-01-design-system-and-app-shell.md) | Design System & App Shell           | none           | Next    |
| [F2](./phase-02-accounts-sessions-and-kyc.md)   | Accounts, Sessions & KYC            | Phase 1        | Ready   |
| [F3](./phase-03-catalog-film-pages-and-seo.md)  | Catalog, Film Pages & SEO           | Phase 2        | Ready   |
| [F4](./phase-04-ticketing-and-checkout.md)      | Ticketing & Checkout                | Phases 3, 4    | Ready   |
| [F5](./phase-05-lobby-and-secure-playback.md)   | Lobby & Secure Playback             | Phase 5        | Ready   |
| [F6](./phase-06-studio-producer-and-admin.md)   | Studio: Producer & Admin Console    | Phases 2, 5    | Ready   |
| [F7](./phase-07-chat-and-voice-rooms.md)        | Communal Chat & Private Suite Voice | Phase 6        | Blocked |
| [F8](./phase-08-concessions-and-delivery.md)    | Concessions & Delivery Tracking     | Phase 7        | Blocked |
| [F9](./phase-09-hardening-and-launch.md)        | Hardening, Observability & Launch   | Phase 8        | Later   |

Every phase ends with: typecheck, lint and unit tests green; Playwright journeys for the phase's
happy path and its main error codes; an accessibility pass (keyboard, focus, contrast); and a
bundle check against the budgets in
[frontend-architecture.md](../architecture/frontend-architecture.md#5-performance-budgets).
