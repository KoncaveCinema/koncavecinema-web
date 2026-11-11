"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ErrorCode, toApiError, type ApiError } from "@/api";
import { changePassword, deleteAccount } from "@/api/auth/auth-api";
import { ConfirmDialog } from "@/components/console/confirm-dialog";
import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { Button } from "@/components/ui/button";
import {
  FieldError,
  FieldLabel,
  FormAlert,
  PasswordChecklist,
  PasswordInput,
} from "@/features/auth/form-parts";
import { PageSkeleton } from "@/features/auth/require-session";
import { newPasswordSchema } from "@/features/auth/schemas";
import { ScreenAliasForm } from "@/features/auth/screen-alias-form";
import { useSession } from "@/features/auth/session";
import { SUPPORT_EMAIL } from "@/features/support/content";
import { formatLagosDate } from "@/lib/format";

/* ------------------------------------------------------------------------------------------ */
/* Screen alias                                                                               */
/* ------------------------------------------------------------------------------------------ */

function AliasForm() {
  return (
    <ScreenAliasForm
      id="alias"
      submitLabel="Save alias"
      help="Shown to the people in your private suites and in Public Hall chat."
      onSaved={(profile) =>
        toast.success("Screen alias saved", {
          description: profile.aliasChangeableAt
            ? `You can change it again on ${formatLagosDate(profile.aliasChangeableAt)}.`
            : undefined,
        })
      }
    />
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
      </ConfirmDialog>
    </>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Page                                                                                       */
/* ------------------------------------------------------------------------------------------ */

/** /dashboard/settings: who you are here, how you sign in, and leaving. */
export function SettingsPage() {
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
