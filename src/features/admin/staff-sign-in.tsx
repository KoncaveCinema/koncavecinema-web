"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, LayoutDashboard, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";

import { signIn } from "@/api/auth/auth-api";
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
  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });

  const staff = status === "signed-in" && isStaff(user?.role);
  useEffect(() => {
    if (staff) router.replace(next);
  }, [staff, next, router]);

  const onSubmit = async (values: SignInValues) => {
    setFailure(null);
    try {
      setUser(await signIn(values.email, values.password));
    } catch (error) {
      setFailure(signInFailure(error));
    }
  };

  if (status === "signed-in" && !staff) {
    return (
      <div role="alert" className="space-y-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-gold/12 text-gold ring-1 ring-gold/30">
          <ShieldAlert aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-black">This isn&rsquo;t a staff account</h1>
          <p className="mt-2 text-sm text-white/55">
            {user?.email} is a member account. Your tickets and settings are in your dashboard.
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-black">Staff sign-in</h1>
        <p className="mt-2 text-sm text-white/55">
          For the Koncave team. Members sign in on the{" "}
          <Link href="/sign-in" className="underline underline-offset-4 hover:text-foreground">
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
