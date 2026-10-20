# Phase F7: Communal Chat & Private Suite Voice

Blocked on API Phase 6 (Socket.IO gateway, LiveKit tokens). Contracts below are from
[API Phase 6](https://github.com/KoncaveCinema/koncavecinema-api/blob/main/docs/phases/phase-06-realtime-chat-and-webrtc-voice.md)
and may change while it is built.

## Deliverables

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
