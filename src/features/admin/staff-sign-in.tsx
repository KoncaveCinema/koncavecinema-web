"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, LayoutDashboard, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useForm } from "react-hook-form";

import { toast } from "sonner";
import { signIn } from "@/api/auth/auth-api";
import type { UserProfile } from "@/api/auth/auth-schemas";
import { Button } from "@/components/ui/button";
import {
  FieldError,
  FieldLabel,
  FormAlert,
  PasswordInput,
  fieldClass,
  safeNext,
  signInFailure,
} from "@/features/auth/form-parts";
import { isStaff } from "@/features/auth/roles";
import { signInSchema, type SignInValues } from "@/features/auth/schemas";
import { useSession } from "@/features/auth/session";
import { TwoFactorStep, useCodeStep } from "@/features/auth/two-factor-step";
import { useClearOnLeave } from "@/hooks/use-clear-on-leave";
import { cn } from "@/lib/utils";

/**
 * /admin/login: the members' sign-in, for staff. Staff go on to the page they asked for (or the
 * overview). A member account stays signed in, since it's a real account, and is shown the way
 * to its own dashboard instead.
 */
export function StaffSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"), "/admin");
  const afterReset = searchParams.get("reset") === "1";
  const { status, user, setUser } = useSession();
  const [failure, setFailure] = useState<ReactNode>(null);
  // Staff sign in with password and authenticator code: the code step comes second
  const codeStep = useCodeStep();
  const {
    register: field,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    // Checked on press, with the button enabled: see the member sign-in form
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const staff = status === "signed-in" && isStaff(user?.role);
  const signedIn = (profile: UserProfile) => {
    // Said at once, while the console loads; a member account is told otherwise below
    if (isStaff(profile.role)) toast.success("Signed in");
    setUser(profile);
  };
  // What was typed stays on screen while signing in, and is gone by the next visit
  useClearOnLeave(() => {
    reset();
    setFailure(null);
  });
  // The console loads while they type, so it opens at once after the code
  useEffect(() => {
    router.prefetch(next);
  }, [next, router]);
  // Signed in as staff: the screen stays as it is, its button working, until the console is up
  const [, startLeaving] = useTransition();
  useEffect(() => {
    if (staff) startLeaving(() => router.replace(next));
  }, [staff, next, router]);

  const onSubmit = async (values: SignInValues) => {
    setFailure(null);
    try {
      const outcome = await signIn(values.email, values.password);
      if (outcome.signedIn) signedIn(outcome.user);
      else codeStep.ask(outcome.challenge);
    } catch (error) {
      setFailure(signInFailure(error));
    }
  };

  if (status === "signed-in" && !staff) return <NotStaff email={user?.email} />;

  // Kept on screen after the code is accepted, until the console has loaded
  if (codeStep.challenge) {
    return (
      <TwoFactorStep
        challenge={codeStep.challenge}
        onSignedIn={signedIn}
        onRestart={(reason) => {
          codeStep.back();
          setFailure(reason ?? null);
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-black">Staff sign-in</h1>
        <p className="mt-2 text-sm text-white/55">
          For the Koncave team. Members sign in on the{" "}
          <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
            main site
          </Link>
          .
        </p>
      </div>
      {afterReset && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-lobby/30 bg-lobby/8 p-4 text-sm"
        >
          <Check className="size-4 shrink-0 text-lobby" />
          Password saved. Sign in to continue.
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div>
          <FieldLabel htmlFor="email">Work email</FieldLabel>
          <input
            id="email"
            type="email"
            autoComplete="username"
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
        <Button
          type="submit"
          size="xl"
          disabled={isSubmitting || staff || status === "loading"}
          className="w-full"
        >
          {isSubmitting || staff ? "Signing in…" : "Sign in"}
          {!isSubmitting && !staff && <ArrowRight data-icon="inline-end" />}
        </Button>
      </form>
    </div>
  );
}

/** A member account at the staff door: the way to their own dashboard instead */
function NotStaff({ email }: { email: string | undefined }) {
  return (
    <div role="alert" className="space-y-6 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-gold/12 text-gold ring-1 ring-gold/30">
        <ShieldAlert aria-hidden="true" className="size-5" />
      </span>
      <div>
        <h1 className="font-display text-2xl font-black">This isn&rsquo;t a staff account</h1>
        <p className="mt-2 text-sm text-white/55">
          {email} is a member account. Your tickets and settings are in your dashboard.
        </p>
      </div>
      <Button asChild size="lg" className="w-full">
        <Link href="/dashboard">
          <LayoutDashboard data-icon="inline-start" />
          Go to your dashboard
        </Link>
      </Button>
    </div>
  );
}
