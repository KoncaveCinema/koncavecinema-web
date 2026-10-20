# Phase F5: Lobby & Secure Playback

## Objective

The screening experience from API Phase 5: waiting lobby, synchronized protected playback,
one device per pass, watermark overlay and the unusual-location check.

## API Endpoints

| Method | Endpoint                                               | Use                                                     |
| :----- | :----------------------------------------------------- | :------------------------------------------------------ |
| `POST` | `/api/tickets/verify-access`                           | Lobby state, countdown, `playbackOpen`                  |
| `POST` | `/api/stream-security/authorize-playback`              | Tokens, schedule, `serverTime`, watermark metadata      |
| `POST` | `/api/stream-security/heartbeat`                       | Every 45 s; stop on `STREAM_SESSION_INVALID` / `CLOSED` |
| `POST` | `/api/stream-security/refresh-drm-token`               | Before the 5-minute DRM token expires                   |
| `POST` | `/api/stream-security/secure-stop`                     | `navigator.sendBeacon` on page hide                     |
| `POST` | `/api/stream-security/location-verification/send-code` | Unusual location                                        |
| `POST` | `/api/stream-security/location-verification/confirm`   | Confirm code, then authorize again                      |

## Deliverables

- `/watch/[ticketId]`: lobby (backdrop, countdown, room info) that turns into the player at T-0
  without reload. Authorization requested at a random moment inside the lobby window (staggered,
  integration doc section 5); first segments preloaded and held on frame zero.
- Mux Player (`@mux/mux-player-react`, dynamically imported) with `playback-id`,
  `playback-token`, `drm-token`; DRM token refreshed before expiry.
- Clock skew from `serverTime` minus half the round trip; target position and the 4-zone
  catch-up engine (≤1.5 s normal; ≤8 s at 1.06× with pitch preserved; ≤15 min normal speed with
  spoiler shield flag; past `hardCutoff` the session ends). Seeking ahead disabled.
- Heartbeat loop; `sessionId` persisted per ticket in `sessionStorage` to resume after reload;
  Secure Stop beacon on `visibilitychange` / `pagehide`.
- Watermark canvas overlay from `watermark` (mode, user ref, alias, session id, seed), drifting
  with the seeded motion; player pauses if the overlay is removed or hidden.
- Error screens: `STREAM_NOT_OPEN` (back to lobby), `STREAM_CLOSED`, `STREAM_NOT_READY`,
  `STREAM_IN_USE_ON_ANOTHER_DEVICE` (explain, retry after ~90 s), `PASS_NOT_CONFIRMED`,
  `LOCATION_VERIFICATION_REQUIRED` (code flow), EME / DRM unsupported browser modal.
- Footer attribution "IP Geolocation by DB-IP" linking to [db-ip.com](https://db-ip.com).
- Strict Content Security Policy for the watch route (Mux stream, license and image hosts).

## Acceptance Criteria

- [ ] Two devices: the second is refused while the first plays; after closing the first tab the
      second succeeds without waiting for the lease to lapse.
- [ ] Two viewers' playheads stay within 1.5 s of each other on a stable connection.
- [ ] A throttled viewer catches up at 1.06× and then returns to 1.0×.
