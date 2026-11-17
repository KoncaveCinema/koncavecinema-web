# Phase F7: Communal Chat & Private Suite Voice

## As built (November 2026)

API Phase 6 is built: room chat in PR #31 (`1654026`), suites, voice and the shared clock in
PR #32 (`5f0ce91`). The original deliverables below predate it; where they differ (event names,
the spoiler shield), this section is right.

### Part one: room chat

- **Connection** (`src/api/rooms/`):
  - Socket.IO on the API's own origin, namespace `/rooms`, websocket only.
  - `socket.io-client` loads with a dynamic `import()` once a Public or suite pass opens its
    doors; Individual Watch never connects.
  - The access token is read from memory at each attempt. A refused handshake (`UNAUTHORIZED`)
    refreshes it once and reconnects; a second refusal, or `TOKEN_REVOKED`, ends the chat.
  - Every connect sends `join_room { ticketId }` again, so a reload or a deploy lands back in the
    same hall.
  - Every event is parsed with a Zod schema (`rooms-schemas.ts`); one that doesn't match is
    ignored.
- **State:** a Zustand store (`src/features/watch/room-store.ts`).
  - At most 200 messages are kept, each once by `id`, since a reconnect resends the recent 50.
  - It also holds the composer's draft, the outbox of messages on their way, and the reactions
    floating over the film.
- **Panel** (`room-chat.tsx`):
  - It sits beside the film on wide screens and under it on phones, behind a Hide chat toggle
    remembered on the device.
  - The header reads "Hall 2 · 812 watching" in a hall, or "Your suite · 4 here" in a suite.
    Once the film has ended it adds "Chat closes at 9:52 pm".
  - Each name has its own colour, worked out from the alias (never red, which is "You").
  - The list follows new messages unless the viewer has scrolled up; then a "New messages"
    button brings them back.
  - **Send** is disabled only while the message is empty or over 280 characters; nobody is made
    to wait. Messages go one after another, each as soon as the last comes back, shown as
    "Sending…" until then. The API allows 3 in a row, then one every 3 s (token buckets, dev);
    a refused message goes again by itself after the exact `retryAfterMs`. A message that was
    nothing but removed content returns to the box, with a line explaining it.
  - **Hall reactions** float for the presser the moment they press, and each press is sent.
    The API takes 5 at once, refilling at 5 a second; the rest are let go. They float inside the
    player's frame, so full screen keeps them, and don't animate under reduced motion.
- **The room plays like a cinema:** halls hide pause, the seek bar and the ±10 s buttons, turn
  off the keyboard shortcuts and the tap on the picture, and resume at the room's moment after
  a pause from outside the controls. Picture-in-picture is off in every room, like casting,
  because its window shows the film without the watermark. "Live" goes when the film ends.
- **Performance:** the room and the player re-render when the screening's phase changes
  (`useServerClock`), not every second; only the countdowns tick. The chat's messages
  re-render only when they change. On wide screens the chat column is held while the pass
  loads, and the room is exactly one screen high.
  - A refusal is one line: `KYC_REQUIRED`, `SUITE_NOT_ACTIVE`, `STREAM_NOT_OPEN` (asked again
    after 15 s), `STREAM_CLOSED`, or anything else, with a retry. Chat never stops the film.
- **Console:**
  - The member page sets and lifts the chat shadow-ban (`shadowBan`, `liftShadowBan`), behind a
    confirmation.
  - The audit log reads `CHAT_MODERATION_SUMMARY` as "4 filtered messages from 2 members".
- **Local development:** `next.config.ts` forwards `/socket.io/` to the staging API, as it
  forwards `/api`. Next forwards the websocket upgrade too, and the trailing-slash redirect is
  off only when the dev proxy is set. The security policy allows the API's `wss://` origin.
- **Left out:**
  - The spoiler shield: hall viewers are held on one moment by the room clock, so chat can't run
    meaningfully ahead.
  - A virtualised list: 200 messages at most stay light without one.

### Part two: suites, the shared clock and voice

Built against the API's PR #32 (`5f0ce91`, with `6df4769` and `00a535f`).

- **Admission** (`suite-door.tsx`):
  - A suite guest joins over the same socket and gets `waiting`.
  - The film doesn't load until the host lets them in: playback is asked for only once inside.
  - `denied` shows **Knock again** after the wait and keeps listening, since `admitted` can still
    arrive during it.
  - `kicked` keeps the socket down (no automatic reconnect) until the guest knocks again.
- **The host's controls** (`suite-panel.tsx`):
  - Each knock gets a toast with **Let in** and **Not now**, and the waiting list in
    `suite_state` is the source of truth.
  - Guests can be muted, unmuted or removed (behind a confirmation), or all muted at once.
  - Refusals show as a toast.
  - `suite_state` carries no muted flag, so the mute icons follow `guest_muted` events since the
    page opened.
- **The shared clock** (`suite-clock.ts`):
  - The player follows the API's clock instead of the schedule: running, `position` plus the
    time since `serverTime`; paused, held on `position`.
  - A pause that runs out of allowance resumes locally at that moment, as the API does without
    an event.
  - **Host:** Pause for everyone; while paused, Resume and ±10 s (seek works only while
    paused). The allowance counts down and pause is disabled at zero.
  - **Everyone:** sees "Paused by the host" over the film, in full screen too.
  - After each resume the pass is read again, because pausing moves its end of access. The
    player leaves a suite's end to the API's heartbeat, since the authorization's cutoff
    doesn't move.
- **Voice** (`suite-voice.ts`, `livekit-client` 2.23.0, about 140 KB gzipped, loaded only inside
  a suite):
  - Joins with `POST /rooms/voice-token` as a listener; `simulated` shows "Voice isn't
    available".
  - The microphone turns on only on its owner's tap; the camera is never asked for.
  - Speaking rings come from LiveKit's active speakers, matched by `identity` (the ticket id).
  - A muted guest's button is locked, by `guest_muted` or LiveKit's own permission change.
  - Voice leaves on a kick, a dropped connection or leaving the page.
- **Security policy:** `connect-src` allows `wss://*.livekit.cloud` and `https://*.livekit.cloud`.

## Deliverables (original plan)

- **Public Hall chat** (`socket.io-client`, loaded only in the watch route): join with
  `join_cinema_room`, send `send_public_message` (max 280 characters), render
  `new_public_message`; client-side cooldown matching the 1 message per 3 seconds limit and
  `rate_limit_exceeded`; virtualised message list for 1,000+ viewers; hall number badge.
- **Spoiler shield**: hide messages whose timestamp is ahead of the local playhead while the
  catch-up engine reports Zone 3; manual toggle.
- **Private suite voice** (`livekit-client`, `@livekit/components-react`): audio only,
  push-to-talk and mute, speaking indicators, device picker, echo cancellation on.
- **Host controls**: knock-to-enter admit / deny prompts (`host:admission_request`), mute one,
  mute all, remove guest, revoke invite, synchronized pause (`host_sync_pause`,
  `room_playback_synced`).
- Reconnection with back-off and a visible connection state.

## Acceptance Criteria

- [ ] Chat stays smooth at 20 messages per second on a mid-range phone.
- [ ] Voice uses no camera permission prompt at any time.
