"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, MailCheck, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ErrorCode, toApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

import { DemoHint, FieldError, FieldLabel, FormAlert, fieldClass } from "./form-parts";
import { phoneSchema, verifyIdentitySchema, type VerifyIdentityValues } from "./schemas";
import { DEMO_HINTS, sendIdentityCode, verifyIdentity } from "./service";
import { useSession } from "./session";

function codeError(code: string): string {
  switch (code) {
    case ErrorCode.OTP_INVALID:
      return "That code isn't right. Check the email and try again.";
    case ErrorCode.OTP_EXPIRED:
      return "That code has expired. Send a new one.";
    case ErrorCode.OTP_RATE_LIMITED:
      return "Too many codes requested. Please wait 15 minutes and try again.";
    case ErrorCode.ALIAS_TAKEN:
      return "Someone already uses that screen alias. Try another.";
    case ErrorCode.PHONE_ALREADY_LINKED:
      return "That phone number is already linked to another account.";
    case ErrorCode.KYC_ALREADY_VERIFIED:
      return "Your identity is already verified.";
    default:
      return "We couldn't verify you just now. Please try again.";
  }
}

/**
 * The one-time check Public halls need: a phone number, then the code emailed to the account
 * with the legal name and the alias shown in hall chat. No NIN or BVN.
 */
export function IdentityCheck({ onVerified }: { onVerified: () => void }) {
  const { user, setUser } = useSession();
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [expiresInMinutes, setExpiresInMinutes] = useState(5);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyIdentityValues>({
    resolver: zodResolver(verifyIdentitySchema),
    defaultValues: { otp: "", legalFullName: "", publicScreenAlias: "" },
  });

  async function sendCode() {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setPhoneError(parsed.error.issues[0]?.message ?? "Enter a valid number");
      return;
    }
    setPhoneError(null);
    setFailure(null);
    setSending(true);
    try {
      const response = await sendIdentityCode(parsed.data);
      setExpiresInMinutes(Math.max(1, Math.round(response.expiresInSeconds / 60)));
      setSentTo(parsed.data);
    } catch (error) {
      setFailure(codeError(toApiError(error).code));
    } finally {
      setSending(false);
    }
  }

  const onSubmit = async (values: VerifyIdentityValues) => {
    setFailure(null);
    try {
      setUser(await verifyIdentity(values));
      onVerified();
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.is(ErrorCode.KYC_ALREADY_VERIFIED)) onVerified();
      else setFailure(codeError(apiError.code));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-4 rounded-2xl border border-lobby/25 bg-lobby/5 p-5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-lobby" />
        <div className="text-sm leading-relaxed text-white/75">
          <p className="font-semibold text-foreground">Why we ask, and what we keep</p>
          <p className="mt-1.5">
            Public halls are open chat rooms, so each attendee is verified once. We never ask for
            your NIN or BVN. Your phone number is stored only as a scrambled code, your legal name
            is encrypted, and only your screen alias is shown in the hall.
          </p>
        </div>
      </div>

      {/* Stage 1: phone. Collapses to one line once the code is sent */}
      <section className="rounded-2xl border border-white/10 bg-surface-1 p-5 sm:p-6">
        <p className="flex items-center gap-3 text-sm font-semibold">
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full text-[0.7rem] font-bold",
              sentTo ? "bg-lobby/15 text-lobby" : "bg-brand text-brand-foreground",
            )}
          >
            {sentTo ? <Check className="size-3.5" /> : 1}
          </span>
          Your mobile number
        </p>
        {sentTo ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pl-9">
            <p className="flex items-center gap-2 text-sm text-white/70">
              <MailCheck className="size-4 text-lobby" />
              Code sent to {user?.email ?? "your email"} for {sentTo}. It expires in{" "}
              {expiresInMinutes} minutes.
            </p>
            <div className="flex gap-4 text-sm">
              <button
                type="button"
                disabled={sending}
                onClick={() => void sendCode()}
                className="font-semibold text-white/70 underline underline-offset-4 hover:text-foreground"
              >
                {sending ? "Sending…" : "Resend code"}
              </button>
              <button
                type="button"
                onClick={() => setSentTo(null)}
                className="font-semibold text-white/70 underline underline-offset-4 hover:text-foreground"
              >
                Change number
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 sm:pl-9">
            <FieldLabel htmlFor="kyc-phone">Nigerian mobile number</FieldLabel>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="kyc-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0803 123 4567"
                aria-invalid={phoneError ? true : undefined}
                className={cn(fieldClass, "sm:flex-1")}
              />
              <Button
                type="button"
                size="lg"
                disabled={sending}
                onClick={() => void sendCode()}
                className="h-12"
              >
                {sending ? "Sending…" : "Email me a code"}
              </Button>
            </div>
            <FieldError message={phoneError ?? undefined} />
            <p className="mt-2 text-xs text-white/45">
              We email the code to your account address. Your number is never shown to anyone.
            </p>
          </div>
        )}
      </section>

      {/* Stage 2: code, name and alias, opened once the code is on its way */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className={cn(
          "space-y-6 rounded-2xl border border-white/10 bg-surface-1 p-5 transition-opacity sm:p-6",
          !sentTo && "pointer-events-none opacity-40",
        )}
      >
        <p className="flex items-center gap-3 text-sm font-semibold">
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full text-[0.7rem] font-bold",
              sentTo ? "bg-brand text-brand-foreground" : "bg-white/6 text-white/40",
            )}
          >
            2
          </span>
          Code, name and screen alias
        </p>
        <div>
          <FieldLabel htmlFor="kyc-otp">6-digit code from your email</FieldLabel>
          <div className="mt-2">
            <Controller
              control={control}
              name="otp"
              render={({ field }) => (
                <InputOTP
                  id="kyc-otp"
                  maxLength={6}
                  inputMode="numeric"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!sentTo}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot key={index} index={index} className="size-12 text-lg" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              )}
            />
          </div>
          <FieldError message={errors.otp?.message} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="kyc-name">Legal full name</FieldLabel>
            <input
              id="kyc-name"
              autoComplete="name"
              disabled={!sentTo}
              aria-invalid={errors.legalFullName ? true : undefined}
              {...register("legalFullName")}
              className={cn(fieldClass, "mt-2")}
            />
            <FieldError message={errors.legalFullName?.message} />
          </div>
          <div>
            <FieldLabel htmlFor="kyc-alias">Screen alias</FieldLabel>
            <input
              id="kyc-alias"
              autoComplete="nickname"
              disabled={!sentTo}
              placeholder="LagosLens"
              aria-invalid={errors.publicScreenAlias ? true : undefined}
              {...register("publicScreenAlias")}
              className={cn(fieldClass, "mt-2")}
            />
            <FieldError message={errors.publicScreenAlias?.message} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Shown in hall chat. 3–25 characters.
            </p>
          </div>
        </div>
        {failure && <FormAlert>{failure}</FormAlert>}
        <Button type="submit" size="xl" disabled={!sentTo || isSubmitting}>
          {isSubmitting ? "Verifying…" : "Verify and continue"}
          {!isSubmitting && <ArrowRight data-icon="inline-end" />}
        </Button>
        <DemoHint>
          {DEMO_HINTS.otp} {DEMO_HINTS.alias}
        </DemoHint>
      </form>
    </div>
  );
}
