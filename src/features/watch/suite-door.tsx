// Client code without its own "use client": only the watch room (already a client component)
// imports it.

import { DoorClosed, DoorOpen, Loader, UserX } from "lucide-react";
import type { ReactNode } from "react";

import { ErrorCode } from "@/api";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";

import { useRoom } from "./room-store";
import { RoomMessage } from "./screens";

/** Knock again, once the host's "not now" has run its course */
function KnockAgain() {
  const knockAfter = useRoom((state) => state.knockAfter);
  const connection = useRoom((state) => state.connection);
  const now = useNow() ?? 0;
  const wait = Math.ceil((knockAfter - now) / 1000);
  return (
    <Button size="lg" disabled={wait > 0} onClick={() => connection?.knock()}>
      {wait > 0 ? `Knock again in ${wait} s` : "Knock again"}
    </Button>
  );
}

/**
 * The suite's door, for everyone not yet inside: joining, a guest waiting for the host, turned
 * away for now (still listening, as the host may let them in during the wait), or removed.
 */
export function SuiteDoor({ backToPass }: { backToPass: ReactNode }) {
  const admission = useRoom((state) => state.admission);
  const status = useRoom((state) => state.status);
  const refusal = useRoom((state) => state.refusal);
  const connection = useRoom((state) => state.connection);

  if (admission === "waiting") {
    return (
      <RoomMessage icon={DoorClosed} tone="lobby" title="Waiting for the host to let you in">
        <p>Your host can see you&apos;re here. The film opens the moment they let you in.</p>
      </RoomMessage>
    );
  }
  if (admission === "denied") {
    return (
      <RoomMessage
        icon={DoorClosed}
        tone="attention"
        title="The host didn't let you in"
        actions={
          <>
            <KnockAgain />
            {backToPass}
          </>
        }
      >
        <p>They may still let you in, so stay on this page. You can knock again shortly.</p>
      </RoomMessage>
    );
  }
  if (admission === "kicked") {
    return (
      <RoomMessage
        icon={UserX}
        tone="attention"
        title="The host removed you from the suite"
        actions={
          <>
            <Button size="lg" onClick={() => connection?.knock()}>
              Knock again
            </Button>
            {backToPass}
          </>
        }
      >
        <p>If it was a mistake, knock again and the host can let you back in.</p>
      </RoomMessage>
    );
  }
  if (status === "refused") {
    return (
      <RoomMessage
        icon={DoorClosed}
        tone="attention"
        title={
          refusal === ErrorCode.SUITE_NOT_ACTIVE
            ? "This suite isn't open yet"
            : "The suite couldn't open"
        }
        actions={
          <>
            <Button size="lg" onClick={() => connection?.rejoin()}>
              Try again
            </Button>
            {backToPass}
          </>
        }
      >
        <p>
          {refusal === ErrorCode.SUITE_NOT_ACTIVE
            ? "It opens once the host's booking is paid for."
            : "Check your connection, then try again."}
        </p>
      </RoomMessage>
    );
  }
  return (
    <RoomMessage
      icon={status === "reconnecting" ? Loader : DoorOpen}
      tone="lobby"
      title={status === "reconnecting" ? "Reconnecting to the suite…" : "Opening the suite…"}
    />
  );
}
