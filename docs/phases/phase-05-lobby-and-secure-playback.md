# Phase F5: Lobby & Secure Playback

## As built (November 2026, sample data)

- Route `/watch/[ticketId]` (`src/app/(watch)`), signed in, never indexed. Code in
  `src/features/watch/`; Mux Player loads on this route only.
- The room counts down to the lobby on the server's clock, authorizes playback once the doors
  open and holds Mux Player on the first frame until the start. What happens next depends on the
  room (see "Pace by room" below).
- Public Hall and suites join everyone at the room's moment. Catch-up zones (`sync.ts`): within
  1.5 s normal speed, up to 8 s at 1.06×, further behind a "Jump to live" chip; seeking ahead
  snaps back.
- Individual Watch plays from the beginning (a late starter too), or from where this device left
  off (kept in `sessionStorage`). Pause and seek are free. "Access ends at …" shows in the
  header before the film, then in the player with its controls; once the rest of the film runs
  past it, "You may not finish before access ends at …" stays on screen (a warning, never a
  block).
- Heartbeat on the API's interval, DRM token renewal every 4 minutes, Secure Stop by beacon on
  page hide and on leaving the room. The playback session id is kept per tab so a reload reuses it.
- Watermark: alias and viewer reference, drifting from the session's seed, inside the player's
  box in fullscreen.
- Every refusal has its own screen: another device, unusual location (emailed code), film not
  ready, unpaid pass, ended, cancelled. DB-IP attribution under the player.
- Demo: the client's public teaser stands in for the film; a demo-only switcher triggers each
  refusal and falling behind. `/tickets/verify-access` is not used: the pass's own times decide
  the countdown, and authorize-playback is the real check.
- The stage fits the window (16:9 under the header); the Koncave mark sits faint in the corner,
  and the settings menus are black. The speed button is hidden: the sync check sets the rate.

### Pace by room (agreed with the backend, November 2026)

A cinema keeps each auditorium together, not every auditorium, so the clock is per room:

| Room           | Clock                                      | Pause / rewind | Access ends          |
| :------------- | :----------------------------------------- | :------------- | :------------------- |
| Individual     | The viewer's own, from the scheduled start | Yes            | Scheduled end + 60 m |
| Public Hall    | The hall's, from the schedule              | No             | Scheduled end + 15 m |
| Private suites | The schedule's for now; host's in Phase 6  | Not yet        | Scheduled end + 15 m |

- No last-entry rule: a late Individual starter is let in and starts from the beginning; the one
  fixed cutoff bounds everything.
- The cutoff is the API's, per pass, and the web never works it out from `endTime`: the pass's
  `accessEndsAt` (my-tickets, `GET /tickets/:id`) drives "Watch now", "Ended" and the room's
  door; the player reads `schedule.hardCutoff` (authorize-playback) and the heartbeat's
  `hardCutoff`, which equal it. The tabs come from `when=upcoming|past`. Sample data serves the
  same fields from the rule in `src/lib/screening-window.ts` and `admin/showtimes/state.ts`.
- Open with the backend: the admin film page's showtimes (`GET /admin/movies/:id`) carry no
  `state`, so that column still works it out from `endTime` until they do.
- Suites move to a host-controlled clock (pause for everyone, a pause allowance added to the
  cutoff) with the realtime layer in Phase 6.
- Still to confirm with the client (a producer): that pausing outside the hall, and the extra
  hour, fit how films are licensed. The hour is one setting on the API.

### Open: picture-in-picture (decide later)

Next 16 keeps a page you leave mounted but hidden, and stops its effects. Leaving the room while
the film is in picture-in-picture therefore keeps the video playing, but the player reloads from
the start, the room sync stops, Secure Stop is sent and the heartbeats end. The browser's
picture-in-picture window also shows the bare video, without the alias watermark or the mark. The
options:

1. **Pause and close picture-in-picture on leaving the room.** Small; coming back rejoins at the
   room's moment, and the lease rules stay as the API expects.
2. **A mini-player that follows the member round the site (as Google Meet does).** The player moves
   into a component that stays mounted across pages, keeping the lease and heartbeats, and uses
   Document Picture-in-Picture so the watermark goes into the window too (Chrome and Edge only
   today). Needs the backend to agree that watching while browsing is allowed.
3. **Turn picture-in-picture off.**

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

These need the real API and Mux, so they stay open until the room is connected. On sample data,
`e2e/watch.spec.ts` covers the lobby, every refusal screen and Individual Watch's access time.

- [ ] Two devices: the second is refused while the first plays; after closing the first tab the
      second succeeds without waiting for the lease to lapse.
- [ ] Two viewers' playheads in the same hall stay within 1.5 s of each other on a stable
      connection.
- [ ] A throttled hall viewer catches up at 1.06× and then returns to 1.0×.
- [ ] An Individual viewer can pause and rewind, resumes after a reload, and is cut off at the
      pass's own `hardCutoff` (scheduled end + 60 minutes).
