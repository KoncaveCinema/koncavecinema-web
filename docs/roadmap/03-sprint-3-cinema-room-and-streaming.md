# Sprint 3: Virtual Cinema Auditorium, Mux DRM, Watermark & LiveKit WebRTC Voice

## Objective

Build the flagship core of Koncave Cinema: the synchronized virtual screening auditorium. Deliver the pre-show countdown lobby, in-memory DRM pre-buffering, dynamic forensic Brownian motion canvas watermarking, LiveKit WebRTC voice lounge for Private Suites, high-speed communal chat for Public Theatres, the 4-zone catch-up drift engine, and single-device concurrency locks.

---

## Actionable Execution Checklist

### 1. Pre-Show Countdown Lobby (T-30m to T-0)

- [ ] Implement `src/features/screening/components/screening-lobby.tsx`:
  - [ ] Opens exactly 30 minutes before showtime.
  - [ ] Synchronized countdown clock ticking down to T-0.
  - [ ] Ambient theatre lighting with curtain-closed backdrop.
  - [ ] Cinema etiquette reel & sponsor trailer carousel.
  - [ ] Audio/video hardware test module (speaker check, network latency meter).
  - [ ] Pre-show chatter (Public chat opens for verified attendees, voice lounge warms up in Private Suites).

### 2. High-Performance DRM Video Player

- [ ] Implement `src/features/player/components/mux-drm-player.tsx`:
  - [ ] Integration with Mux Video SDK supporting encrypted HLS / FairPlay / Widevine / PlayReady.
  - [ ] Custom minimal cinema controls: volume slider, subtitle selector, fullscreen toggle (scrubbing disabled during live premiere).
  - [ ] **Memory Pre-Buffering Engine**:
    - [ ] Triggers at **T-90s** before showtime.
    - [ ] Fetches DRM playback license token from backend.
    - [ ] Pre-loads 3 encrypted video segments (12 seconds) strictly into client RAM.
    - [ ] Triggers instantaneous, synchronized zero-latency playout at **T-0**.

### 3. Dynamic Forensic Brownian Motion Canvas Watermark

- [ ] Implement `src/features/player/components/forensic-watermark.tsx`:
  - [ ] High-frequency HTML5 Canvas element overlaying the decrypted video viewport.
  - [ ] Data rendered: Viewer `User ID`, masked `IP Address`, and synchronized `UTC Epoch Timestamp`.
  - [ ] **Brownian Motion Jitter Algorithm**:
    - [ ] Smooth, pseudo-random coordinates shifting every 3 to 7 seconds across all 4 screen quadrants.
    - [ ] Defeats automated cropping, algorithmic blurring, and static mask overlays used by video pirates.
    - [ ] Semi-transparent opacity (30-40%) calibrated to remain forensic without distracting viewer immersion.
  - [ ] Anti-tampering defense: `MutationObserver` detects any DOM attribute alteration, removal, or hiding of the canvas, instantly freezing video playback.

### 4. Single-Device Concurrency & Leased Session Guard

- [ ] Implement `src/features/player/hooks/use-concurrency-heartbeat.ts`:
  - [ ] Periodically sends cryptographic session heartbeat ping (`POST /api/screenings/:id/heartbeat`) every 45 seconds.
  - [ ] Backend updates Redis TTL key `session:lease:{userId}:{ticketId}`.
  - [ ] **Secure Session Termination**:
    - [ ] Listens to `beforeunload`, `pagehide`, and `visibilitychange` events.
    - [ ] Dispatches immediate release payload via `navigator.sendBeacon` to free the seat lease without delay.
  - [ ] Concurrency conflict modal: If a second device logs into the same ticket, the older tab is terminated with a `409 Conflict: Stream Active Elsewhere` alert.

### 5. Social Cinema Layers: Communal Chat vs. WebRTC Voice Lounge

- [ ] **Public Theatre Communal Chat** (`src/features/chat/components/theatre-chat.tsx`):
  - [ ] High-throughput SSE / WebSocket connection.
  - [ ] Displays verified public alias and badge.
  - [ ] Quick-tap emoji reactions floating dynamically over the side panel.
  - [ ] **"Mute Spoilers" Shield**:
    - [ ] Detects if user is in Catch-Up Zone 3 (lagging behind the live edge).
    - [ ] Automatically blurs or silences chat until user catches up to prevent spoilers.
- [ ] **Private Suite WebRTC Spatial Voice Lounge** (`src/features/voice/components/suite-voice-lounge.tsx`):
  - [ ] Powered by LiveKit WebRTC SFU.
  - [ ] Active speaker detection with glowing visualizer avatars.
  - [ ] Individual volume sliders per participant.
  - [ ] Global host controls: Mute All, Lock Room, Push-to-Talk mode.

### 6. Four-Zone Catch-Up Drift Engine

- [ ] Implement `src/features/player/hooks/use-catchup-engine.ts`:
  - [ ] Continuously calculates delta: `timeLag = serverEpochTime - currentPlayheadTime`.
  - [ ] **Zone 1 (0-3s lag)**: Real-time live edge, normal 1.0x playback.
  - [ ] **Zone 2 (4-30s lag)**: Smooth 1.05x micro-acceleration without pitch distortion to invisibly bring viewer back to live edge.
  - [ ] **Zone 3 (31s-10m lag)**: Buffering pause recovery; plays at normal speed, auto-engages chat spoiler shield.
  - [ ] **Zone 4 (Post-Credits Buffer)**: Keeps auditorium room alive for 15 minutes post-credits so viewers with network stalls can finish the film.
