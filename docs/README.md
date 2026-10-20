# Koncave Cinema Web Documentation (`docs/`)

Frontend documentation for `koncavecinema-web`. Business rules, API contracts and error codes are
owned by the backend and documented in
[`koncavecinema-api/docs`](https://github.com/KoncaveCinema/koncavecinema-api/tree/main/docs);
this folder only covers how the web client is built.

```txt
docs/
├── README.md                              # This index
├── architecture/
│   ├── frontend-architecture.md           # Stack, auth/session model, API client, rendering
│   └── performance.md                     # Budgets, measurements, rendering/loading/animation rules
└── phases/
    ├── README.md                          # Frontend roadmap and its dependency on API phases
    ├── phase-00-foundation-and-tooling.md
    ├── phase-01-design-system-and-app-shell.md
    ├── phase-02-accounts-sessions-and-kyc.md
    ├── phase-03-catalog-film-pages-and-seo.md
    ├── phase-04-ticketing-and-checkout.md
    ├── phase-05-lobby-and-secure-playback.md
    ├── phase-06-studio-producer-and-admin.md
    ├── phase-07-chat-and-voice-rooms.md
    ├── phase-08-concessions-and-delivery.md
    └── phase-09-hardening-and-launch.md
```

## Most-used backend references

- [Errors, pagination, idempotency, request ids](https://github.com/KoncaveCinema/koncavecinema-api/blob/main/docs/api/error-codes.md)
- [PRD](https://github.com/KoncaveCinema/koncavecinema-api/blob/main/docs/specifications/prd.md): checkout flow, state machines, edge cases
- [Phase 5: stream security](https://github.com/KoncaveCinema/koncavecinema-api/blob/main/docs/phases/phase-05-stream-security-drm-watermarking.md): player contract
- [Streaming & DRM](https://github.com/KoncaveCinema/koncavecinema-api/blob/main/docs/integrations/streaming-and-drm.md): 4-zone catch-up engine
