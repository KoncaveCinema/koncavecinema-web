"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { forwardRef, useState, type ComponentProps, type ReactNode } from "react";

import { ErrorCode, toApiError } from "@/api";
import { cn } from "@/lib/utils";

import { PASSWORD_RULES } from "./schemas";

/* Form pieces shared by the sign-in, registration, password and identity-check forms. */

export const fieldClass =
  "h-12 w-full rounded-xl border border-white/12 bg-white/3 px-4 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground/60 focus-visible:border-brand focus-visible:bg-white/5 aria-invalid:border-destructive";

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold tracking-wide text-white/80">
      {children}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-destructive">{message}</p>;
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
    >
      {children}
    </p>
  );
}

/**
 * Why a sign-in was refused, for the members' and the staff forms. The email lock (10 failed
 * sign-ins in 15 minutes, from any device) is lifted by a password reset; the per-address limit
 * (RATE_LIMITED) only passes with time.
 */
export function signInFailure(error: unknown): ReactNode {
  const apiError = toApiError(error);
  if (apiError.is(ErrorCode.LOGIN_TEMPORARILY_LOCKED)) {
    const minutes = Math.max(1, Math.ceil(Number(apiError.details.retryAfterSeconds) / 60)) || 15;
    return (
      <>
        Too many failed attempts. Try again in {minutes} {minutes === 1 ? "minute" : "minutes"}, or{" "}
        <Link href="/forgot-password" className="font-semibold underline underline-offset-4">
          reset your password
        </Link>
        .
      </>
    );
  }
  if (apiError.is(ErrorCode.INVALID_CREDENTIALS)) {
    return "That email and password don't match an account.";
  }
  if (apiError.is(ErrorCode.RATE_LIMITED)) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (apiError.is(ErrorCode.NETWORK_ERROR)) {
    return "We couldn't reach Koncave Cinema. Check your connection and try again.";
  }
  return "We couldn't sign you in just now. Please try again.";
}

/** A password field with a show/hide toggle */
export const PasswordInput = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  function PasswordInput({ className, ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(fieldClass, "pr-12", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);

/** The password rules as a live checklist under a new-password field */
export function PasswordChecklist({ id, password }: { id: string; password: string }) {
  return (
    <ul id={id} className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-xs min-[380px]:grid-cols-2">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-1.5",
              met ? "text-lobby" : "text-muted-foreground",
            )}
          >
            <Check className={cn("size-3.5", !met && "opacity-30")} />
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

/** Only same-site paths are followed after signing in, never another origin */
export function safeNext(value: string | null, fallback = "/movies"): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function AuthHeading({ title, description }: { title: string; description: ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-3xl leading-tight font-black sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
