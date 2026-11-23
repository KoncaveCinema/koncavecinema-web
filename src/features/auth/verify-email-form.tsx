"use client";

import { ArrowRight, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";

import { toast } from "sonner";
import { ErrorCode, toApiError } from "@/api";
import type { TwoFactorChallenge, UserProfile } from "@/api/auth/auth-schemas";
import { resendEmailCode, verifyEmail } from "@/api/auth/auth-api";
import { Button } from "@/components/ui/button";
import { useClearOnLeave } from "@/hooks/use-clear-on-leave";
import { useNow } from "@/hooks/use-now";

import { useSignOut } from "./account-menu";
import { CodeField, isSixDigits } from "./code-field";
import { verifyEmailHref } from "./links";
import { AuthHeading, FieldLabel, FormAlert, safeNext } from "./form-parts";
import { isStaff } from "./roles";
import { useSession } from "./session";
import { TwoFactorStep } from "./two-factor-step";

/** Why a code was refused, in the member's words */
function codeFailure(error: unknown): ReactNode {
  const apiError = toApiError(error);
  if (apiError.is(ErrorCode.OTP_INVALID))
    return "That code isn't right. Check the email and try again.";
  if (apiError.is(ErrorCode.OTP_EXPIRED)) {
    return (
      <>
        This code has expired. Send a new one below. Already confirmed?{" "}
        <Link href="/login" className="font-semibold underline underline-offset-4">
          Sign in
        </Link>
        .
      </>
    );
  }
  if (apiError.is(ErrorCode.RATE_LIMITED)) return "Too many tries. Wait a minute, then try again.";
  if (apiError.is(ErrorCode.VALIDATION_FAILED)) return "Enter the 6 digits from the email.";
  if (apiError.is(ErrorCode.NETWORK_ERROR)) {
    return "We couldn't reach Koncave Cinema. Check your connection and try again.";
  }
  return "We couldn't check the code just now. Please try again.";
}

/** "Send a new code", then a countdown until another may go */
function ResendCode({
  email,
  sendOnArrival,
  onArrivalSent,
}: {
  email: string;
  /** Sent here from sign-in or a page needing an account: no code is on its way yet */
  sendOnArrival: boolean;
  /** The arrival's code went: the link stops asking, so a reload doesn't send another */
  onArrivalSent: () => void;
}) {
  const now = useNow() ?? 0;
  const [sentUntil, setSentUntil] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const wait = Math.ceil((sentUntil - now) / 1000);

  const resend = async () => {
    setSending(true);
    try {
      // The same answer for any address, so it never says whether an account exists
      const sent = await resendEmailCode(email);
      setNote(sent.message);
      setSentUntil(Date.now() + sent.retryAfterSeconds * 1000);
    } catch (error) {
      setNote(
        toApiError(error).is(ErrorCode.RATE_LIMITED)
          ? "Too many new codes asked for. Try again in 15 minutes."
          : "We couldn't send a new code just now. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  // Once per arrival: React's development double mount and a re-render never send a second
  // Once per arrival: React's development double run never sends a second. Ready again once the
  // link has stopped asking, for the next time a page sends someone here
  const arrived = useRef(false);
  const onArrival = useEffectEvent(() => {
    void resend();
    onArrivalSent();
  });
  useEffect(() => {
    if (!sendOnArrival) {
      arrived.current = false;
      return;
    }
    if (arrived.current) return;
    arrived.current = true;
    onArrival();
  }, [sendOnArrival]);
  useClearOnLeave(() => setNote(null));

  return (
    <div className="space-y-2 text-center text-sm">
      <Button variant="ghost" disabled={sending || wait > 0} onClick={() => void resend()}>
        {wait > 0 ? `Send a new code in ${wait} s` : sending ? "Sending…" : "Send a new code"}
      </Button>
      {note && (
        <p role="status" className="text-muted-foreground">
          {note}
        </p>
      )}
    </div>
  );
}

/**
 * /verify-email: the last step of registration, and where a member who didn't finish it comes
 * back to. The right code confirms the address and signs them in, then they go on to `next`.
 */
export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const user = useSession((state) => state.user);
  const setUser = useSession((state) => state.setUser);
  const signOut = useSignOut();
  // From the link, or the signed-in member's own address (the banner's way in)
  const email = searchParams.get("email") ?? user?.email ?? "";
  const [code, setCode] = useState("");
  const [failure, setFailure] = useState<ReactNode>(null);
  const [sending, setSending] = useState(false);
  // Only when two-factor sign-in was turned on before the address was confirmed
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);

  // Confirmed: this screen stays as it is, its button working, until the next page has loaded
  const [, startLeaving] = useTransition();
  const signedIn = (profile: UserProfile) => {
    toast.success("Email confirmed");
    setUser(profile);
    startLeaving(() =>
      router.replace(safeNext(next, isStaff(profile.role) ? "/admin" : "/movies")),
    );
  };
  // Gone by the next visit: the code, a refusal, a "Checking…" button
  useClearOnLeave(() => {
    setCode("");
    setFailure(null);
    setSending(false);
    setChallenge(null);
  });

  const submit = async (value: string) => {
    if (sending || !email) return;
    setSending(true);
    setFailure(null);
    try {
      const outcome = await verifyEmail(email, value);
      if (outcome.signedIn) signedIn(outcome.user);
      else setChallenge(outcome.challenge);
    } catch (error) {
      setFailure(codeFailure(error));
      setCode("");
      setSending(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isSixDigits(code)) void submit(code);
  };

  if (challenge) {
    return (
      <TwoFactorStep
        challenge={challenge}
        onSignedIn={signedIn}
        onRestart={() => router.replace("/login")}
      />
    );
  }

  if (!email) {
    return (
      <div className="space-y-6">
        <AuthHeading
          title="Confirm your email"
          description="Sign in, and we'll take you to the code step for your address."
        />
        <Button asChild size="xl" className="w-full">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <span className="grid size-12 place-items-center rounded-2xl bg-lobby/12 text-lobby ring-1 ring-lobby/30">
          <MailCheck aria-hidden="true" className="size-5" />
        </span>
        <div className="mt-5">
          <AuthHeading
            title="Confirm your email"
            description={
              <>
                Enter the 6-digit code we sent to{" "}
                <span className="font-semibold text-foreground">{email}</span>. It expires in 10
                minutes.
              </>
            }
          />
        </div>
      </div>
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <div>
          <FieldLabel htmlFor="email-code">Code from the email</FieldLabel>
          <div className="mt-2">
            <CodeField
              id="email-code"
              value={code}
              onChange={setCode}
              onComplete={(value) => void submit(value)}
              disabled={sending}
              invalid={failure !== null}
            />
          </div>
        </div>
        {failure && <FormAlert>{failure}</FormAlert>}
        <Button type="submit" size="xl" disabled={!isSixDigits(code) || sending} className="w-full">
          {sending ? "Checking…" : "Confirm"}
          {!sending && <ArrowRight data-icon="inline-end" />}
        </Button>
      </form>
      <ResendCode
        email={email}
        sendOnArrival={searchParams.get("send") === "1"}
        onArrivalSent={() => router.replace(verifyEmailHref(email, next))}
      />
      {user && (
        <p className="text-center text-sm text-muted-foreground">
          Not {user.email}?{" "}
          <button
            type="button"
            onClick={() => void signOut().then(() => router.replace("/login"))}
            className="font-semibold text-foreground underline decoration-brand underline-offset-4"
          >
            Sign out
          </button>
        </p>
      )}
    </div>
  );
}
