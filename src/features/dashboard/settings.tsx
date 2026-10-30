"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ConfirmDialog } from "@/components/console/confirm-dialog";
import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { Button } from "@/components/ui/button";
import {
  DemoHint,
  FieldError,
  FieldLabel,
  FormAlert,
  PasswordChecklist,
  PasswordInput,
  fieldClass,
} from "@/features/auth/form-parts";
import { PageSkeleton } from "@/features/auth/require-session";
import { newPasswordSchema, verifyIdentitySchema } from "@/features/auth/schemas";
import {
  DEMO_HINTS,
  changePassword,
  deleteAccount,
  updateScreenAlias,
} from "@/features/auth/service";
import { useSession } from "@/features/auth/session";
import { SUPPORT_EMAIL } from "@/features/support/content";
import { ErrorCode, toApiError, type ApiError } from "@/lib/api";
import { formatLagosDate } from "@/lib/format";

/* ------------------------------------------------------------------------------------------ */
/* Screen alias                                                                               */
/* ------------------------------------------------------------------------------------------ */

const aliasSchema = z.object({ publicScreenAlias: verifyIdentitySchema.shape.publicScreenAlias });

function AliasForm() {
  const user = useSession((state) => state.user);
  const setUser = useSession((state) => state.setUser);
  const [problem, setProblem] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(aliasSchema),
    values: { publicScreenAlias: user?.publicScreenAlias ?? "" },
  });

  if (!user?.isPhoneVerified) {
    return (
      <p className="text-sm text-white/60">
        Your screen alias is the name other viewers see in Public Hall chat. You choose it when you
        verify your identity, the first time you book a Public Hall seat.{" "}
        <Link href="/movies" className="text-foreground underline underline-offset-4">
          Find a screening
        </Link>
      </p>
    );
  }

  async function onSubmit(values: z.infer<typeof aliasSchema>) {
    setProblem(null);
    try {
      const updated = await updateScreenAlias(values.publicScreenAlias);
      setUser(updated);
      reset({ publicScreenAlias: updated.publicScreenAlias ?? "" });
      toast.success("Screen alias changed", {
        description: "You can change it again in 30 days.",
      });
    } catch (caught) {
      const error = toApiError(caught);
      if (error.is(ErrorCode.ALIAS_TAKEN)) {
        setError("publicScreenAlias", { message: "Someone already uses that alias. Try another." });
      } else if (error.is(ErrorCode.ALIAS_CHANGE_TOO_SOON)) {
        const next = error.details.nextChangeAt;
        setProblem(
          typeof next === "string"
            ? `Your alias can change once every 30 days. You can change it again on ${formatLagosDate(next)}.`
            : "Your alias can change once every 30 days.",
        );
      } else {
        setProblem("We couldn't change your alias just now. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <FieldLabel htmlFor="alias">Screen alias</FieldLabel>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="alias"
            autoComplete="nickname"
            aria-invalid={errors.publicScreenAlias ? true : undefined}
            aria-describedby="alias-help"
            className={fieldClass}
            {...register("publicScreenAlias")}
          />
          <Button type="submit" size="lg" className="h-12" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Saving…" : "Save alias"}
          </Button>
        </div>
        <FieldError message={errors.publicScreenAlias?.message} />
        <p id="alias-help" className="mt-2 text-xs text-white/45">
          Shown in Public Hall chat. 3 to 25 letters, numbers, underscores or hyphens. You can
          change it once every 30 days.
        </p>
      </div>
      {problem && <FormAlert>{problem}</FormAlert>}
      <DemoHint>{DEMO_HINTS.aliasChange}</DemoHint>
    </form>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Password                                                                                   */
/* ------------------------------------------------------------------------------------------ */

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "The passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: "Choose a password you don't use now",
    path: ["newPassword"],
  });

function PasswordForm() {
  const [problem, setProblem] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "newPassword" });

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    setProblem(null);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      reset();
      toast.success("Password changed", {
        description: "You've been signed out on your other devices.",
      });
    } catch (caught) {
      const error = toApiError(caught);
      if (error.is(ErrorCode.INVALID_CREDENTIALS)) {
        setError("currentPassword", { message: "That isn't your current password." });
      } else if (error.is(ErrorCode.RATE_LIMITED)) {
        setProblem("Too many attempts. Wait a few minutes, then try again.");
      } else {
        setProblem("We couldn't change your password just now. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-5">
      <div>
        <FieldLabel htmlFor="current-password">Current password</FieldLabel>
        <div className="mt-2">
          <PasswordInput
            id="current-password"
            autoComplete="current-password"
            aria-invalid={errors.currentPassword ? true : undefined}
            {...register("currentPassword")}
          />
        </div>
        <FieldError message={errors.currentPassword?.message} />
      </div>
      <div>
        <FieldLabel htmlFor="new-password">New password</FieldLabel>
        <div className="mt-2">
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            aria-invalid={errors.newPassword ? true : undefined}
            aria-describedby="new-password-rules"
            {...register("newPassword")}
          />
        </div>
        <FieldError message={errors.newPassword?.message} />
        <PasswordChecklist id="new-password-rules" password={password} />
      </div>
      <div>
        <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
        <div className="mt-2">
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            aria-invalid={errors.confirmPassword ? true : undefined}
            {...register("confirmPassword")}
          />
        </div>
        <FieldError message={errors.confirmPassword?.message} />
      </div>
      {problem && <FormAlert>{problem}</FormAlert>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Changing…" : "Change password"}
        </Button>
        <p className="text-xs text-white/45">Your other devices will be signed out.</p>
      </div>
      <DemoHint>{DEMO_HINTS.password}</DemoHint>
    </form>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Delete account                                                                             */
/* ------------------------------------------------------------------------------------------ */

function explainDeleteError(error: ApiError) {
  if (error.is(ErrorCode.INVALID_CREDENTIALS)) return "That password isn't right.";
  if (error.is(ErrorCode.ACCOUNT_HAS_UPCOMING_PASSES)) {
    const count = Number(error.details.upcomingPasses) || 0;
    return (
      <>
        You have {count > 1 ? `${count} paid passes` : "a paid pass"} for screenings that
        haven&rsquo;t ended. You can delete your account after them, or ask {SUPPORT_EMAIL} to
        cancel them first.
      </>
    );
  }
  return "We couldn't delete your account just now. Please try again.";
}

function DeleteAccount() {
  const router = useRouter();
  const setUser = useSession((state) => state.setUser);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-xl text-sm text-white/60">
          Deletes your sign-in and personal details. You can&rsquo;t undo it. While you hold a paid
          pass for a screening that hasn&rsquo;t ended, your account can&rsquo;t be deleted.
        </p>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete my account
        </Button>
      </div>

      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setPassword("");
        }}
        tone="danger"
        title="Delete your account?"
        description="This can't be undone."
        consequences={[
          "Removed: your email, password, legal name, phone verification and screen alias. You can't sign in again.",
          "Released: any seat you're holding but haven't paid for.",
          "Kept: your passes and payments, tied to an anonymous account, because tax and accounting law require transaction records.",
        ]}
        confirmLabel="Delete my account"
        pendingLabel="Deleting…"
        typedConfirmation="DELETE"
        canConfirm={password.length > 0}
        explainError={explainDeleteError}
        onConfirm={async () => {
          await deleteAccount(password);
          setUser(null);
          router.push("/");
          toast.success("Your account has been deleted");
        }}
      >
        <div className="space-y-1.5">
          <label htmlFor="delete-password" className="text-sm font-medium">
            Your password
          </label>
          <PasswordInput
            id="delete-password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10 rounded-lg"
          />
        </div>
        <DemoHint>{DEMO_HINTS.deleteAccount}</DemoHint>
      </ConfirmDialog>
    </>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Page                                                                                       */
/* ------------------------------------------------------------------------------------------ */

/** /dashboard/settings: who you are here, how you sign in, and leaving. */
export function Settings() {
  const user = useSession((state) => state.user);
  if (!user) return <PageSkeleton />;
  const member = user.role === "VIEWER" || user.role === "HOST";

  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title="Settings"
        description="Your profile, password and account."
      />

      <div className="space-y-6">
        <Panel id="profile" title="Profile">
          <div className="space-y-6">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-white/45">Email</dt>
                <dd className="mt-1 font-medium break-all">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/45">Identity</dt>
                <dd className="mt-1 flex items-center gap-1.5 font-medium">
                  {user.isPhoneVerified ? (
                    <>
                      <BadgeCheck aria-hidden="true" className="size-4 text-lobby" />
                      Verified for Public Halls
                    </>
                  ) : (
                    <span className="text-white/60">Not verified yet</span>
                  )}
                </dd>
              </div>
            </dl>
            <div className="border-t border-white/8 pt-6">
              <AliasForm />
            </div>
          </div>
        </Panel>

        <Panel id="password" title="Password">
          <PasswordForm />
        </Panel>

        <Panel id="delete" title="Delete account" tone="danger">
          {member ? (
            <DeleteAccount />
          ) : (
            <p className="flex gap-2.5 text-sm text-white/60">
              <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-gold" />
              Staff and producer accounts are closed through support, not here. Email{" "}
              {SUPPORT_EMAIL}.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
