"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { use } from "react";

import { LocalTime } from "@/components/cinema/live-time";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/features/auth/require-session";
import { useSession } from "@/features/auth/session";
import { ErrorCode, toApiError } from "@/lib/api";

import type { InvitePreview } from "./api-types";
import { claimInvite, getInvitePreview } from "./service";

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

function PreviewCard({ preview, code }: { preview: InvitePreview; code: string }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-surface-1 text-left">
      <div className="relative aspect-video">
        <Image
          src={preview.posterLandscape}
          alt=""
          fill
          sizes="(min-width: 640px) 32rem, 100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,var(--color-surface-1)_100%)]"
        />
      </div>
      <div className="px-6 pb-6">
        <p className="text-[0.7rem] font-bold tracking-[0.28em] text-brand uppercase">
          Private suite · invite {code.toUpperCase()}
        </p>
        <p className="mt-2 font-display text-2xl leading-tight font-extrabold">
          {preview.movieTitle}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-white/45">Starts</dt>
            <dd className="mt-1 font-medium">
              <LocalTime iso={preview.startTime} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-white/45">Hosted by</dt>
            <dd className="mt-1 font-medium">{preview.hostAlias}</dd>
          </div>
          <div>
            <dt className="text-xs text-white/45">Seats left</dt>
            <dd className="mt-1 flex items-center gap-1.5 font-medium">
              <Users className="size-4 text-gold" />
              {preview.seatsLeft}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

/**
 * /invite/[code]: a private suite guest sees what they are joining first (no sign-in), then takes
 * their seat. Claiming needs an account, so a signed-out guest goes through sign-in or
 * registration and comes straight back here.
 */
export function InviteClaim({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const pathname = usePathname();
  const status = useSession((state) => state.status);
  const preview = useQuery({
    queryKey: ["invite", code],
    queryFn: () => getInvitePreview(code),
    retry: false,
  });
  const claim = useMutation({ mutationFn: () => claimInvite(code) });
  const next = encodeURIComponent(pathname);

  if (preview.isPending || status === "loading") return <PageSkeleton />;

  if (preview.isError) {
    const error = toApiError(preview.error);
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="font-display text-3xl font-black">
          {error.is(ErrorCode.RATE_LIMITED) ? "Too many tries" : "This invite doesn't exist"}
        </p>
        <p className="mt-3 text-white/60">
          {error.is(ErrorCode.RATE_LIMITED)
            ? "Please wait a minute and open the link again."
            : "Check the link with your host. Invite links look like koncavecinema.com/invite/VIP-AB12CD."}
        </p>
        <Button asChild size="xl" className="mt-8">
          <Link href="/showtimes">See showtimes</Link>
        </Button>
      </div>
    );
  }

  if (claim.isSuccess) {
    const ticket = claim.data;
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <CheckCircle2 className="mx-auto size-12 text-lobby" />
        <h1 className="mt-6 font-display text-4xl font-black">You&rsquo;re on the list</h1>
        <p className="mt-3 text-white/60">
          {ticket.movieTitle} · <LocalTime iso={ticket.startTime} />
        </p>
        <p className="mt-1 font-mono text-sm">{ticket.seatIdentifier}</p>
        <Button asChild size="xl" className="mt-8">
          <Link href={`/account/tickets/${ticket.id}`}>View your pass</Link>
        </Button>
      </div>
    );
  }

  const invite = preview.data;
  const closed = !invite.isActive;
  const full = invite.isActive && invite.seatsLeft === 0;

  return (
    <div className="mx-auto max-w-lg py-6 text-center">
      <h1 className="font-display text-3xl leading-tight font-black sm:text-4xl">
        {closed
          ? "This suite isn't open yet"
          : full
            ? "This suite is full"
            : "You've been invited to a private screening"}
      </h1>
      <p className="mt-3 text-white/60">
        {closed
          ? "Your host hasn't completed payment yet, or the screening is over. Check with them and try the link again."
          : full
            ? "Every seat in this suite has been taken. Ask your host whether there's another way in."
            : `${invite.hostAlias === "Your host" ? "Your host" : invite.hostAlias} saved you a seat. Take it to get your own pass, then join them when the lobby opens.`}
      </p>

      <div className="mt-8">
        <PreviewCard preview={invite} code={code} />
      </div>

      {!closed && !full && (
        <div className="mt-8">
          {status === "signed-in" ? (
            <>
              <Button size="xl" disabled={claim.isPending} onClick={() => claim.mutate()}>
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
            <div className="flex flex-col items-center gap-3">
              <Button asChild size="xl">
                <Link href={`/register?next=${next}`}>Create an account to join</Link>
              </Button>
              <Link
                href={`/sign-in?next=${next}`}
                className="text-sm text-white/60 underline underline-offset-4 hover:text-foreground"
              >
                I already have an account
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
