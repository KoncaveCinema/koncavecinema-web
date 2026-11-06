// Client code without its own "use client": only the watch room (already a client component)
// imports it, so it never needs to be an entry point the server renders.

import { DoorOpen, MailCheck, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { LocalTime } from "@/components/cinema/live-time";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { FormAlert } from "@/features/auth/form-parts";
import { useServerNow } from "@/hooks/use-now";
import { ErrorCode, toApiError } from "@/api";
import { formatCountdown } from "@/lib/format";

import { confirmLocation, sendLocationCode } from "./service";

/* The room's full-frame screens: everything the stage shows when it isn't playing the film. */

/** One state of the room: an icon, what happened, and the way on. */
export function RoomMessage({
  icon: Icon,
  tone = "neutral",
  title,
  children,
  actions,
}: {
  icon: LucideIcon;
  tone?: "neutral" | "lobby" | "attention";
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const ring = {
    neutral: "bg-white/6 text-white/70 ring-white/12",
    lobby: "bg-lobby/12 text-lobby ring-lobby/30",
    attention: "bg-gold/12 text-gold ring-gold/30",
  }[tone];
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center text-pretty">
      <span className={`grid size-14 place-items-center rounded-2xl ring-1 ${ring}`}>
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-black text-balance sm:text-4xl">{title}</h1>
      {children && <div className="mt-3 space-y-2 text-[0.95rem] text-white/65">{children}</div>}
      {actions && <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}

/** Before the lobby: when the doors open, counted on the server's clock. */
export function LobbyCountdown({
  startTime,
  lobbyOpensAt,
  actions,
}: {
  startTime: string;
  lobbyOpensAt: string;
  actions: ReactNode;
}) {
  const now = useServerNow();
  return (
    <RoomMessage icon={DoorOpen} title="The doors aren't open yet" actions={actions}>
      <p>
        Starts <LocalTime iso={startTime} />. We&rsquo;ll open the doors 30 minutes before.
      </p>
      <p className="pt-4 font-display text-5xl font-black text-foreground tabular-nums">
        {now === null ? "…" : formatCountdown(Date.parse(lobbyOpensAt) - now)}
      </p>
      <p className="text-xs tracking-[0.24em] text-white/45 uppercase">until the lobby opens</p>
    </RoomMessage>
  );
}

/**
 * LOCATION_VERIFICATION_REQUIRED: the pass is being opened from somewhere unusual. A code is
 * emailed to the member; confirming it lets playback be authorised again.
 */
export function LocationCheck({ onConfirmed }: { onConfirmed: () => void }) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const run = async (action: () => Promise<void>, after: () => void) => {
    setPending(true);
    setFailure(null);
    try {
      await action();
      after();
    } catch (error) {
      const apiError = toApiError(error);
      setFailure(
        apiError.is(ErrorCode.OTP_INVALID)
          ? "That code isn't right. Check the email and try again."
          : apiError.is(ErrorCode.OTP_EXPIRED)
            ? "That code has expired. Send a new one."
            : apiError.is(ErrorCode.RATE_LIMITED) || apiError.is(ErrorCode.OTP_RATE_LIMITED)
              ? "Too many codes requested. Please wait a few minutes."
              : "That didn't work. Please try again.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <RoomMessage icon={MailCheck} tone="attention" title="Confirm it's you">
      <p>
        This pass is being opened from a place we haven&rsquo;t seen before. We&rsquo;ll email you a
        6-digit code to confirm it&rsquo;s you.
      </p>
      <div className="flex flex-col items-center gap-4 pt-5">
        {!sent ? (
          <Button
            size="lg"
            disabled={pending}
            onClick={() => void run(sendLocationCode, () => setSent(true))}
          >
            {pending ? "Sending…" : "Email me a code"}
          </Button>
        ) : (
          <>
            <label htmlFor="location-code" className="text-xs font-semibold text-white/70">
              Code from your email (valid 5 minutes)
            </label>
            <InputOTP
              id="location-code"
              autoFocus
              maxLength={6}
              inputMode="numeric"
              value={code}
              onChange={setCode}
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, index) => (
                  <InputOTPSlot key={index} index={index} className="size-12 text-lg" />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <div className="flex gap-3">
              <Button
                size="lg"
                disabled={pending || code.length !== 6}
                onClick={() => void run(() => confirmLocation(code), onConfirmed)}
              >
                {pending ? "Checking…" : "Confirm and watch"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                disabled={pending}
                onClick={() => void run(sendLocationCode, () => setCode(""))}
              >
                Send a new code
              </Button>
            </div>
          </>
        )}
        {failure && <FormAlert>{failure}</FormAlert>}
      </div>
    </RoomMessage>
  );
}
