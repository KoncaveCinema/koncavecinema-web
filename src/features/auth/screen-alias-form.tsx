import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { useForm, useFormState, useWatch } from "react-hook-form";
import { z } from "zod";

import { ErrorCode, toApiError } from "@/api";
import { updateScreenAlias } from "@/api/auth/auth-api";
import type { UserProfile } from "@/api/auth/auth-schemas";
import { Button } from "@/components/ui/button";
import { useServerNow } from "@/hooks/use-now";
import { formatLagosDate } from "@/lib/format";

import { FieldError, FieldLabel, FormAlert, fieldClass } from "./form-parts";
import { screenAliasSchema } from "./schemas";
import { useSession } from "./session";

const aliasForm = z.object({ publicScreenAlias: screenAliasSchema });

/**
 * The screen alias field and its button (PATCH /auth/me), for any member: in Settings, on an
 * invite before taking a seat, and for a suite host. The first alias is free; after that it
 * changes once every 30 days, by the API's date. Every refusal is explained beside the field.
 */
export function ScreenAliasForm({
  id,
  submitLabel,
  pendingLabel = "Saving…",
  help,
  onSaved,
}: {
  id: string;
  submitLabel: ReactNode;
  pendingLabel?: string;
  /** Where the alias is shown, under the field */
  help: string;
  onSaved?: (profile: UserProfile) => void;
}) {
  const user = useSession((state) => state.user);
  const setUser = useSession((state) => state.setUser);
  const now = useServerNow();
  const [problem, setProblem] = useState<string | null>(null);
  const saved = user?.publicScreenAlias ?? "";
  const { register, handleSubmit, setError, control } = useForm({
    resolver: zodResolver(aliasForm),
    defaultValues: { publicScreenAlias: saved },
  });
  // Explicit subscriptions rather than the form's "dirty" flag, which went stale after a save
  // (the form could not be sent again until a reload): the button compares the typed alias
  // with the saved one, so it wakes as soon as the member edits it
  const { errors, isSubmitting } = useFormState({ control });
  const typed = useWatch({ control, name: "publicScreenAlias" });
  const unchanged = typed.trim() === saved;

  // Until the clock starts, a future date is treated as not yet
  const changeableAt = user?.aliasChangeableAt ?? null;
  const locked = changeableAt !== null && (now === null || Date.parse(changeableAt) > now);

  async function onSubmit(values: z.infer<typeof aliasForm>) {
    setProblem(null);
    try {
      const updated = await updateScreenAlias(values.publicScreenAlias);
      setUser(updated);
      onSaved?.(updated);
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
      } else if (error.is(ErrorCode.VALIDATION_FAILED)) {
        setError("publicScreenAlias", {
          message: "Use 3 to 25 letters, numbers, underscores or hyphens.",
        });
      } else {
        setProblem("We couldn't save your alias just now. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 text-left">
      <div>
        <FieldLabel htmlFor={id}>Screen alias</FieldLabel>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id={id}
            autoComplete="nickname"
            placeholder="LagosLens"
            aria-invalid={errors.publicScreenAlias ? true : undefined}
            aria-describedby={`${id}-help`}
            className={fieldClass}
            disabled={locked}
            {...register("publicScreenAlias")}
          />
          <Button
            type="submit"
            size="lg"
            className="h-12 shrink-0"
            disabled={locked || isSubmitting || unchanged}
          >
            {isSubmitting ? pendingLabel : submitLabel}
          </Button>
        </div>
        <FieldError message={errors.publicScreenAlias?.message} />
        <p id={`${id}-help`} className="mt-2 text-xs text-white/45">
          {help} 3 to 25 letters, numbers, underscores or hyphens.{" "}
          {locked && changeableAt
            ? `You can change it again on ${formatLagosDate(changeableAt)}.`
            : user?.publicScreenAlias
              ? "You can change it once every 30 days."
              : "You can correct your first choice once straight away."}
        </p>
      </div>
      {problem && <FormAlert>{problem}</FormAlert>}
    </form>
  );
}
