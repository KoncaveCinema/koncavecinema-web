// Client code without its own "use client": only client components import it, so its
// callbacks never cross from the server.

import { ArrowLeft, ArrowRight, KeyRound } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { ErrorCode, toApiError } from "@/api";
import type { TwoFactorChallenge, UserProfile } from "@/api/auth/auth-schemas";
import { signInWithCode } from "@/api/auth/auth-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { CodeField, isSixDigits } from "./code-field";
import { FieldLabel, FormAlert, fieldClass, signInFailure } from "./form-parts";

/**
 * The sign-in's steps: the password, then (two-factor sign-in on) the code, shown as
 * `?step=code` so the browser's Back returns to the password. The challenge lives in memory
 * only, and shows only while the address says `?step=code`: a reload or a link landing there
 * starts again from the password, and a sign-in page the router kept alive, opened again later
 * (no `?step`), shows the password form rather than a spent code step.
 */
export function useCodeStep() {
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const [step, setStep] = useQueryState(
    "step",
    parseAsStringLiteral(["code"]).withOptions({ history: "push" }),
  );
  // A reload (or a shared link) lands on ?step=code with no challenge in memory: the page shows
  // the password, so the address says so too, without adding a history entry
  const stale = step === "code" && challenge === null;
  useEffect(() => {
    if (stale) void setStep(null, { history: "replace" });
  }, [stale, setStep]);

  return {
    challenge: step === "code" ? challenge : null,
    ask: (next: TwoFactorChallenge) => {
      setChallenge(next);
      void setStep("code");
    },
    /** Back to the password */
    back: () => {
      setChallenge(null);
      void setStep(null);
    },
  };
}

/** A recovery code: ten letters and digits, in two groups of five (`k7m2p-x9q4r`) */
const isRecoveryCode = (value: string) => value.replace(/[^a-z0-9]/gi, "").length === 10;

/**
 * Sign-in's second step on an account with two-factor sign-in: the 6 digits from the
 * authenticator app, or a recovery code. The challenge lives in memory only and works once,
 * for 5 minutes; when it has run out, the person starts again from the password.
 */
export function TwoFactorStep({
  challenge,
  onSignedIn,
  onRestart,
}: {
  challenge: TwoFactorChallenge;
  onSignedIn: (user: UserProfile) => void;
  /** Back to the email and password, with a reason when there is one */
  onRestart: (reason?: string) => void;
}) {
  const [recovery, setRecovery] = useState(false);
  const [code, setCode] = useState("");
  const [failure, setFailure] = useState<ReactNode>(null);
  const [sending, setSending] = useState(false);
  const ready = recovery ? isRecoveryCode(code) : isSixDigits(code);

  const submit = async (value: string) => {
    if (sending) return;
    setSending(true);
    setFailure(null);
    try {
      const user = await signInWithCode(challenge.challengeToken, value.trim());
      if (recovery) toast.info("You have used a recovery code. Each one works once.");
      onSignedIn(user);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.is(ErrorCode.TWO_FACTOR_CHALLENGE_INVALID)) {
        onRestart("That took more than 5 minutes. Sign in again.");
      } else if (apiError.is(ErrorCode.TWO_FACTOR_CODE_INVALID)) {
        setFailure(
          recovery
            ? "That recovery code isn't right, or it has been used."
            : "That code isn't right. Codes change every 30 seconds, and each works once.",
        );
        setCode("");
      } else {
        setFailure(signInFailure(error));
      }
      setSending(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (ready) void submit(code);
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="grid size-12 place-items-center rounded-2xl bg-white/6 text-white/75 ring-1 ring-white/12">
          <KeyRound aria-hidden="true" className="size-5" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-black">One more step</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {recovery
            ? "Enter one of the recovery codes you saved when you turned on two-factor sign-in."
            : "Enter the 6-digit code from your authenticator app."}
        </p>
      </div>
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <div>
          <FieldLabel htmlFor="two-factor-code">
            {recovery ? "Recovery code" : "Authenticator code"}
          </FieldLabel>
          <div className="mt-2">
            {recovery ? (
              <input
                id="two-factor-code"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="xxxxx-xxxxx"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={cn(fieldClass, "font-mono tracking-wider")}
              />
            ) : (
              <CodeField
                id="two-factor-code"
                value={code}
                onChange={setCode}
                onComplete={(value) => void submit(value)}
                disabled={sending}
                invalid={failure !== null}
              />
            )}
          </div>
        </div>
        {failure && <FormAlert>{failure}</FormAlert>}
        <Button type="submit" size="xl" disabled={!ready || sending} className="w-full">
          {sending ? "Checking…" : "Sign in"}
          {!sending && <ArrowRight data-icon="inline-end" />}
        </Button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={() => onRestart()}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back
        </button>
        <button
          type="button"
          onClick={() => {
            setRecovery(!recovery);
            setCode("");
            setFailure(null);
          }}
          className="font-semibold underline decoration-brand underline-offset-4"
        >
          {recovery ? "Use the authenticator app instead" : "Use a recovery code instead"}
        </button>
      </div>
    </div>
  );
}
