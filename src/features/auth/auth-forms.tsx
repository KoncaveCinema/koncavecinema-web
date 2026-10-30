"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { TERMS_VERSION } from "@/features/legal/documents";
import { ErrorCode, toApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

import {
  AuthHeading,
  DemoHint,
  FieldError,
  FieldLabel,
  FormAlert,
  PasswordChecklist,
  PasswordInput,
  fieldClass,
  safeNext,
} from "./form-parts";
import {
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  signInSchema,
  type ForgotPasswordValues,
  type RegisterValues,
  type ResetPasswordValues,
  type SignInValues,
} from "./schemas";
import { DEMO_HINTS, register, requestPasswordReset, resetPassword, signIn } from "./service";
import { useSession } from "./session";

/* The four auth forms. Each sends the API's request shape and branches on its error codes. */

function withNext(path: string, next: string | null) {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const afterReset = searchParams.get("reset") === "1";
  const setUser = useSession((state) => state.setUser);
  const [failure, setFailure] = useState<string | null>(null);
  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async (values: SignInValues) => {
    setFailure(null);
    try {
      setUser(await signIn(values.email, values.password));
      router.replace(safeNext(next));
    } catch (error) {
      const apiError = toApiError(error);
      setFailure(
        apiError.is(ErrorCode.INVALID_CREDENTIALS)
          ? "That email and password don't match an account."
          : apiError.is(ErrorCode.RATE_LIMITED)
            ? "Too many attempts. Please wait a few minutes and try again."
            : "We couldn't sign you in just now. Please try again.",
      );
    }
  };

  return (
    <div className="space-y-8">
      <AuthHeading
        title="Welcome back"
        description={
          next
            ? "Sign in to hold your seat. You'll come straight back to your booking."
            : "Sign in to book your next premiere."
        }
      />
      {afterReset && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-lobby/30 bg-lobby/8 p-4 text-sm"
        >
          <Check className="size-4 shrink-0 text-lobby" />
          Password updated. Sign in with your new password.
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            {...field("email")}
            className={cn(fieldClass, "mt-2")}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <div className="mt-2">
            <PasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              {...field("password")}
            />
          </div>
          <FieldError message={errors.password?.message} />
        </div>
        {failure && <FormAlert>{failure}</FormAlert>}
        <Button type="submit" size="xl" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Signing in…" : "Sign in"}
          {!isSubmitting && <ArrowRight data-icon="inline-end" />}
        </Button>
        <DemoHint>{DEMO_HINTS.signIn}</DemoHint>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        New to Koncave?{" "}
        <Link
          href={withNext("/register", next)}
          className="font-semibold text-foreground underline decoration-brand underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const setUser = useSession((state) => state.setUser);
  const [failure, setFailure] = useState<string | null>(null);
  const {
    register: field,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  const password = useWatch({ control, name: "password" }) ?? "";

  const onSubmit = async (values: RegisterValues) => {
    setFailure(null);
    try {
      setUser(await register(values.email, values.password, TERMS_VERSION));
      router.replace(safeNext(next));
    } catch (error) {
      const apiError = toApiError(error);
      setFailure(
        apiError.is(ErrorCode.EMAIL_ALREADY_REGISTERED)
          ? "An account already uses that email. Sign in instead."
          : apiError.is(ErrorCode.VALIDATION_FAILED)
            ? apiError.messages.join(" ")
            : "We couldn't create your account just now. Please try again.",
      );
    }
  };

  return (
    <div className="space-y-8">
      <AuthHeading
        title="Create your account"
        description="One account for every premiere and private suite you book."
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            {...field("email")}
            className={cn(fieldClass, "mt-2")}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="mt-2">
            <PasswordInput
              id="password"
              autoComplete="new-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby="password-rules"
              {...field("password")}
            />
          </div>
          <PasswordChecklist id="password-rules" password={password} />
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/2 p-4 text-sm text-muted-foreground transition-colors has-checked:border-white/25">
          <input
            type="checkbox"
            {...field("acceptTerms")}
            className="mt-0.5 size-5 shrink-0 accent-brand"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-foreground underline">
              Terms of use
            </Link>{" "}
            and have read the{" "}
            <Link href="/privacy" className="text-foreground underline">
              Privacy policy
            </Link>
            .
          </span>
        </label>
        <FieldError message={errors.acceptTerms?.message} />
        {failure && <FormAlert>{failure}</FormAlert>}
        <Button type="submit" size="xl" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating your account…" : "Create account"}
          {!isSubmitting && <ArrowRight data-icon="inline-end" />}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={withNext("/sign-in", next)}
          className="font-semibold text-foreground underline decoration-brand underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setFailure(null);
    try {
      await requestPasswordReset(values.email);
      setSentTo(values.email);
    } catch (error) {
      setFailure(
        toApiError(error).is(ErrorCode.RATE_LIMITED)
          ? "Too many requests. Try again in a few minutes."
          : "We couldn't send the link just now. Please try again.",
      );
    }
  };

  if (sentTo) {
    return (
      <div className="space-y-6 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-lobby/12 text-lobby">
          <MailCheck className="size-6" />
        </span>
        <AuthHeading
          title="Check your email"
          description={
            <>
              If an account uses <span className="text-foreground">{sentTo}</span>, we&rsquo;ve sent
              a link to reset its password. The link works for 30 minutes.
            </>
          }
        />
        <Link
          href="/sign-in"
          className="inline-flex text-sm font-semibold underline decoration-brand underline-offset-4"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AuthHeading
        title="Reset your password"
        description="Enter the email you signed up with and we'll send you a link to choose a new password."
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            {...field("email")}
            className={cn(fieldClass, "mt-2")}
          />
          <FieldError message={errors.email?.message} />
        </div>
        {failure && <FormAlert>{failure}</FormAlert>}
        <Button type="submit" size="xl" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/sign-in"
          className="font-semibold text-foreground underline decoration-brand underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const setUser = useSession((state) => state.setUser);
  const [expired, setExpired] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const {
    register: field,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });
  const password = useWatch({ control, name: "newPassword" }) ?? "";

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) return;
    setFailure(null);
    try {
      await resetPassword(token, values.newPassword);
      // The reset ended every session, this one included
      setUser(null);
      router.replace("/sign-in?reset=1");
    } catch (error) {
      const apiError = toApiError(error);
      // A truncated or malformed link fails validation on the token: treat it as expired. The
      // password itself was already checked against the same rules before sending.
      if (apiError.is(ErrorCode.PASSWORD_RESET_TOKEN_INVALID, ErrorCode.VALIDATION_FAILED)) {
        setExpired(true);
      } else {
        setFailure("We couldn't change your password just now. Please try again.");
      }
    }
  };

  if (!token || expired) {
    return (
      <div className="space-y-6">
        <AuthHeading
          title="This link has expired or is incomplete"
          description="Reset links work once, for 30 minutes. Request a new one and open it straight from the email."
        />
        <Button asChild size="xl" className="w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AuthHeading
        title="Choose a new password"
        description="Make it one you don't use anywhere else."
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div>
          <FieldLabel htmlFor="new-password">New password</FieldLabel>
          <div className="mt-2">
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              aria-invalid={errors.newPassword ? true : undefined}
              aria-describedby="new-password-rules"
              {...field("newPassword")}
            />
          </div>
          <PasswordChecklist id="new-password-rules" password={password} />
        </div>
        <div>
          <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
          <div className="mt-2">
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              aria-invalid={errors.confirmPassword ? true : undefined}
              {...field("confirmPassword")}
            />
          </div>
          <FieldError message={errors.confirmPassword?.message} />
        </div>
        {failure && <FormAlert>{failure}</FormAlert>}
        <Button type="submit" size="xl" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Saving…" : "Save new password"}
        </Button>
        <DemoHint>{DEMO_HINTS.reset}</DemoHint>
      </form>
    </div>
  );
}
