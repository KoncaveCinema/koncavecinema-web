"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";

import { LocalTime } from "@/components/cinema/live-time";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/features/auth/require-session";
import { useSession } from "@/features/auth/session";
import { ErrorCode, toApiError } from "@/lib/api";

import { claimInvite } from "./service";

function claimError(code: string): string {
  switch (code) {
    case ErrorCode.SUITE_FULL:
      return "This suite is full. Ask your host whether there's another way in.";
    case ErrorCode.SUITE_NOT_ACTIVE:
      return "This invite isn't active. The suite may not be paid for yet, or the screening has ended.";
    case ErrorCode.SUITE_CLAIM_IN_PROGRESS:
      return "We're already adding you to this suite. One moment, then try again.";
    default:
      return "We couldn't add you to the suite. Please try again.";
  }
}

/**
 * /invite/[code]: a private suite guest takes their seat. Claiming needs an account, so a
 * signed-out guest goes through sign-in or registration and comes straight back here.
 */
export function InviteClaim({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const pathname = usePathname();
  const status = useSession((state) => state.status);
  const claim = useMutation({ mutationFn: () => claimInvite(code) });
  const next = encodeURIComponent(pathname);

  if (status === "loading") return <PageSkeleton />;

  if (claim.isSuccess) {
    const ticket = claim.data;
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <CheckCircle2 className="mx-auto size-12 text-lobby" />
        <h1 className="mt-6 font-display text-4xl font-black">You&rsquo;re on the list</h1>
        <p className="mt-3 text-muted-foreground">
          {ticket.movieTitle} · <LocalTime iso={ticket.startTime} />
        </p>
        <p className="mt-1 font-mono text-sm">{ticket.seatIdentifier}</p>
        <Button asChild size="xl" className="mt-8">
          <Link href="/showtimes">See showtimes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-gold/12 text-gold">
        <Users className="size-7" />
      </span>
      <p className="mt-6 text-[0.7rem] font-bold tracking-[0.32em] text-brand uppercase">
        Private suite
      </p>
      <h1 className="mt-3 font-display text-4xl leading-tight font-black">
        You&rsquo;ve been invited to a private screening
      </h1>
      <p className="mt-4 text-muted-foreground">
        Your host has a suite and saved you a seat. Take it to get your own pass, then join them in
        the room when the lobby opens.
      </p>
      <p className="mt-4 font-mono text-sm text-white/60">Invite {code.toUpperCase()}</p>

      {status === "signed-in" ? (
        <>
          <Button
            size="xl"
            className="mt-8"
            disabled={claim.isPending}
            onClick={() => claim.mutate()}
          >
            {claim.isPending ? "Taking your seat…" : "Take my seat"}
            {!claim.isPending && <ArrowRight data-icon="inline-end" />}
          </Button>
          {claim.isError && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {claimError(toApiError(claim.error).code)}
            </p>
          )}
        </>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button asChild size="xl">
            <Link href={`/register?next=${next}`}>Create an account to join</Link>
          </Button>
          <Link
            href={`/sign-in?next=${next}`}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            I already have an account
          </Link>
        </div>
      )}
    </div>
  );
}
