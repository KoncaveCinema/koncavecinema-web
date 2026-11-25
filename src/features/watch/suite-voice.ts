// Client code without its own "use client": only the watch room (already a client component)
// imports it.

import type { Room } from "livekit-client";
import { useEffect } from "react";
import { create } from "zustand";

import { requestVoiceToken } from "@/api/rooms/voice-api";

/*
 * A suite's voice: LiveKit, audio only, loaded only once the host is in or a guest has been let
 * in. The microphone stays off until its owner taps it, and the camera is never asked for (the
 * token can't publish video anyway).
 */

export type VoiceStatus = "idle" | "connecting" | "connected" | "unavailable" | "failed";

interface VoiceStore {
  status: VoiceStatus;
  micOn: boolean;
  /** The host turned this member's microphone off; it stays off until they turn it back */
  micLocked: boolean;
  /** The browser refused the microphone */
  micBlocked: boolean;
  /** The browser holds the suite's sound back until a tap */
  needsTap: boolean;
  /** Who is talking now, by ticket id (LiveKit's identity) */
  speaking: string[];
  /** Each member's screen alias, by ticket id, as voice knows them (it names the host too) */
  names: Record<string, string>;
  /** Bumped by a retry, so the connection starts again */
  attempt: number;
}

const EMPTY = {
  status: "idle",
  micOn: false,
  micLocked: false,
  micBlocked: false,
  needsTap: false,
  speaking: [],
  names: {},
} satisfies Omit<VoiceStore, "attempt">;

export const useVoice = create<VoiceStore>(() => ({ ...EMPTY, attempt: 0 }));

let room: Room | null = null;

/** Connects to the suite's voice while `enabled`, and leaves when it stops being */
export function useSuiteVoice(ticketId: string, enabled: boolean) {
  const attempt = useVoice((state) => state.attempt);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let current: Room | undefined;
    const audio: HTMLMediaElement[] = [];
    useVoice.setState({ ...EMPTY, status: "connecting" });

    void (async () => {
      try {
        const grant = await requestVoiceToken(ticketId);
        if (cancelled) return;
        // No LiveKit where this API runs (local, tests): a quiet line, not an error
        if (grant.simulated) return useVoice.setState({ status: "unavailable" });

        const { Room, RoomEvent, Track } = await import("livekit-client");
        if (cancelled) return;
        const voice = new Room({
          audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true },
        });
        current = voice;
        voice.on(RoomEvent.ActiveSpeakersChanged, (speakers) =>
          useVoice.setState({ speaking: speakers.map((speaker) => speaker.identity) }),
        );
        voice.on(RoomEvent.ParticipantConnected, (participant) =>
          useVoice.setState((state) => ({
            names: { ...state.names, [participant.identity]: participant.name ?? "" },
          })),
        );
        voice.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind !== Track.Kind.Audio) return;
          const element = track.attach();
          audio.push(element);
          document.body.append(element);
        });
        voice.on(RoomEvent.TrackUnsubscribed, (track) => {
          for (const element of track.detach()) element.remove();
        });
        // The host revoked or restored this member's microphone in LiveKit itself. The one signal
        // for the lock: the API's guest_muted can arrive out of order with it
        voice.on(RoomEvent.ParticipantPermissionsChanged, (_previous, participant) => {
          if (participant !== voice.localParticipant) return;
          setMicLocked(participant.permissions?.canPublish === false);
        });
        voice.on(RoomEvent.AudioPlaybackStatusChanged, () =>
          useVoice.setState({ needsTap: !voice.canPlaybackAudio }),
        );
        voice.on(RoomEvent.Disconnected, () => {
          if (!cancelled) useVoice.setState({ status: "failed", micOn: false, speaking: [] });
        });

        await voice.connect(grant.url, grant.token);
        if (cancelled) return void voice.disconnect();
        room = voice;
        const names = Object.fromEntries(
          [...voice.remoteParticipants.values()].map((other) => [other.identity, other.name ?? ""]),
        );
        useVoice.setState({ status: "connected", needsTap: !voice.canPlaybackAudio, names });
        // Muted before this page loaded: still muted
        if (voice.localParticipant.permissions?.canPublish === false) setMicLocked(true);
      } catch {
        // VOICE_NOT_AVAILABLE, too many tries, or LiveKit itself: the panel offers a retry
        if (!cancelled) useVoice.setState({ status: "failed" });
      }
    })();

    return () => {
      cancelled = true;
      void current?.disconnect();
      for (const element of audio) element.remove();
      room = null;
      useVoice.setState(EMPTY);
    };
  }, [ticketId, enabled, attempt]);
}

/** Turns this member's microphone on or off; the tap also lets the suite's sound play */
export async function toggleMic() {
  const { micOn, micLocked } = useVoice.getState();
  if (!room || micLocked) return;
  void room.startAudio();
  try {
    await room.localParticipant.setMicrophoneEnabled(!micOn);
    useVoice.setState({ micOn: !micOn, micBlocked: false, needsTap: false });
  } catch {
    useVoice.setState({ micOn: false, micBlocked: true });
  }
}

/** The host muted (or unmuted) this member: off and locked, or free to turn on again */
export function setMicLocked(locked: boolean) {
  useVoice.setState({ micLocked: locked });
  if (locked && room) {
    void room.localParticipant.setMicrophoneEnabled(false);
    useVoice.setState({ micOn: false });
  }
}

/** Lets the suite's sound play, for a browser that wants a tap first */
export function startSuiteAudio() {
  void room?.startAudio().then(() => useVoice.setState({ needsTap: false }));
}

export function retryVoice() {
  useVoice.setState((state) => ({ attempt: state.attempt + 1 }));
}

/** LiveKit saw a member leave voice: no speaking ring for them */
export function voiceLeft(ticketId: string) {
  useVoice.setState((state) => ({ speaking: state.speaking.filter((id) => id !== ticketId) }));
}
