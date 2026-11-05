# Sprint 3: The Screening Room

## Objective

The screening itself, from the lobby to the credits:

- A lobby that opens 30 minutes before the start and counts down on the server's clock.
- Protected playback with Mux, one device per pass, and a viewer watermark.
- Each room on its own clock: the Public Hall together, Individual Watch at the viewer's pace.

Built on sample data (`NEXT_PUBLIC_DATA_SOURCE=fixtures`): the client's public teaser stands in
for the film, and a demo-only switcher reaches every refusal. The phase doc is
[F5](../phases/phase-05-lobby-and-secure-playback.md); the API contract is its Phase 5.

---

## Routes

| Route               | Access              | Page                                                             | API                                                                      |
| :------------------ | :------------------ | :--------------------------------------------------------------- | :----------------------------------------------------------------------- |
| `/watch/[ticketId]` | Signed in, the pass | Lobby, then the film; every refusal on its own screen; noindexed | `POST /stream-security/authorize-playback`, `/heartbeat`, `/secure-stop` |

Code in `src/features/watch/`: `watch-room.tsx` (the room's states), `player.tsx` (Mux Player,
sync, heartbeat, DRM renewal), `sync.ts` (the clock and the watermark's drift), `screens.tsx`
(lobby countdown and refusals). Mux Player loads on this route only.

---

## Checklist

### 1. Lobby

- [x] Opens 30 minutes before the start; counts down to the doors, then to the film, on the
      server's clock (`serverTime` minus half the round trip).
- [x] The player loads in the lobby and holds the first frame, so the film starts at once.
- [x] A pass for a screening further out shows when the doors open.
- [ ] Ambient lobby (curtain, sponsor reel), and a speaker and network check. Not started.
- [ ] Pre-show chat and the suite's voice lounge: moved to [F7](../phases/phase-07-chat-and-voice-rooms.md).

### 2. Protected player

- [x] Mux Player (`@mux/mux-player-react`) with the playback token and the DRM token, which is
      renewed every 4 minutes while the device holds the lease.
- [x] The player fits the screen under the header; full screen keeps the watermark.
- [x] The speed control is hidden in every room for now.
- [ ] Subtitles: waits for the API to carry subtitle tracks.
- [ ] A notice for browsers without DRM support (EME). Not started.

**Changed:** the original plan pre-loaded "3 segments into RAM at T-90s". Mux Player's own
`preload` in the lobby does the same job with no custom buffering code.

### 3. Watermark

- [x] The viewer's alias and reference, drifting across the picture from the session's seed
      (`sync.ts`), at the film's watermark strength (subtle or strong).
- [x] The Koncave mark faint in the corner, above the controls.
- [ ] Pause the film if the watermark is removed or hidden (`MutationObserver`). Not started.

**Changed:** a text layer instead of a canvas, with no IP address or clock on screen. The API
signs the alias and reference into the session, which is what traces a leak.

### 4. One device per pass

- [x] A heartbeat on the API's interval (45 s); a refusal ends playback, a network blip doesn't.
- [x] Secure Stop by beacon on page hide and on leaving the room, so the lease frees at once.
- [x] Another device playing the pass gets its own screen, with "Watch here instead".
- [x] An unusual location asks for a code from the member's email before playing.
- [x] The playback session id is kept per tab, so a reload resumes the same session.

### 5. Each room's clock

Agreed with the backend in November 2026 (see F5, "Pace by room"):

| Room           | Clock                                     | Access ends          |
| :------------- | :---------------------------------------- | :------------------- |
| Individual     | The viewer's own: pause, rewind and seek  | Scheduled end + 60 m |
| Public Hall    | The hall's, from the schedule             | Scheduled end + 15 m |
| Private suites | The schedule's now; the host's in Phase 6 | Scheduled end + 15 m |

- [x] Public Hall and suites: within 1.5 s plays at normal speed, up to 8 s behind plays at
      1.06×, further behind shows "Jump to live"; seeking ahead snaps back.
- [x] Individual Watch: starts from the beginning (a late starter too), resumes after a reload,
      shows when access ends and warns when the film runs past it.
- [x] The cutoff is the API's per pass (`accessEndsAt`, `hardCutoff`), never worked out here.
- [ ] The suite host's pause for everyone: with the realtime layer in F7.
- [ ] The spoiler shield in hall chat: with the chat in F7.

**Changed:** the plan had one clock for every viewer of a screening, with a 1.05× catch-up from 4
to 30 s. The rooms now keep their own clocks, and the catch-up is gentler and shorter.

### 6. Chat and voice

Moved to [F7](../phases/phase-07-chat-and-voice-rooms.md): it waits for the API's realtime layer
(its Phase 6).

### 7. Still open

- [ ] Picture-in-picture when leaving the room: three options in F5, decision parked.
- [ ] A strict Content Security Policy for the watch route.
- [ ] Connect the room to the API (the sample data stands in today).
