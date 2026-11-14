import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";

import { ErrorCode, toApiError } from "@/api";
import { OptionSelect } from "@/components/console/pickers";
import { Button } from "@/components/ui/button";
import { FieldError, FormAlert, fieldClass } from "@/features/auth/form-parts";
import { ratingDescription, ratingLabel } from "@/lib/format";

import type { FilmInput } from "./api-types";
import {
  AGE_RATINGS,
  WATERMARK_MODES,
  filmSchema,
  type FilmFormInput,
  type FilmValues,
} from "./schemas";

const WATERMARK_LABEL = {
  OFF: "Off",
  SUBTLE: "Subtle: a faint viewer reference that drifts slowly",
  STRONG: "Strong: larger and more frequent, for high-value premieres",
};

export const FILM_DEFAULTS: FilmValues = {
  title: "",
  synopsis: "",
  durationMinutes: 100,
  ageRating: "PG",
  producerName: "",
  producerRevenueSplit: 85,
  watermarkMode: "SUBTLE",
};

function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-xs font-semibold tracking-wide text-white/80">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error ? (
        <FieldError message={error} />
      ) : (
        hint && <p className="mt-1.5 text-xs text-white/45">{hint}</p>
      )}
    </div>
  );
}

/**
 * A film's details, as the API's CreateMovieDto takes them. Used to start a draft and to edit
 * one; the API's own field messages show under the fields when it refuses.
 */
export function FilmForm({
  initial = FILM_DEFAULTS,
  submitLabel,
  pendingLabel,
  onSubmit,
  onCancel,
}: {
  initial?: FilmValues;
  submitLabel: string;
  pendingLabel: string;
  onSubmit: (input: FilmInput) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const [failure, setFailure] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FilmFormInput, unknown, FilmValues>({
    resolver: zodResolver(filmSchema),
    defaultValues: initial,
  });

  const submit = async (values: FilmValues) => {
    setFailure(null);
    try {
      await onSubmit(values);
    } catch (error) {
      const apiError = toApiError(error);
      setFailure(
        apiError.is(ErrorCode.VALIDATION_FAILED)
          ? apiError.messages.join(" ")
          : "The film couldn't be saved. Please try again.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="title" label="Title" error={errors.title?.message} className="sm:col-span-2">
          <input
            id="title"
            {...register("title")}
            aria-invalid={Boolean(errors.title)}
            className={fieldClass}
          />
        </Field>
        <Field
          id="synopsis"
          label="Synopsis"
          hint="Shown on the film's page. A paragraph or two, no spoilers."
          error={errors.synopsis?.message}
          className="sm:col-span-2"
        >
          <textarea
            id="synopsis"
            rows={4}
            {...register("synopsis")}
            aria-invalid={Boolean(errors.synopsis)}
            className={cn(fieldClass, "h-auto resize-y py-3")}
          />
        </Field>
        <Field
          id="durationMinutes"
          label="Runtime (minutes)"
          hint="Replaced by the master video's own length once it's attached."
          error={errors.durationMinutes?.message}
        >
          <input
            id="durationMinutes"
            type="number"
            inputMode="numeric"
            min={1}
            max={360}
            {...register("durationMinutes")}
            aria-invalid={Boolean(errors.durationMinutes)}
            className={fieldClass}
          />
        </Field>
        <Field id="ageRating" label="NFVCB rating" error={errors.ageRating?.message}>
          <Controller
            control={control}
            name="ageRating"
            render={({ field }) => (
              <OptionSelect
                id="ageRating"
                value={field.value}
                onChange={field.onChange}
                options={AGE_RATINGS.map((rating) => ({
                  value: rating,
                  label: `${ratingLabel(rating)}: ${ratingDescription(rating)}`,
                }))}
              />
            )}
          />
        </Field>
        <Field id="producerName" label="Producer" error={errors.producerName?.message}>
          <input
            id="producerName"
            {...register("producerName")}
            aria-invalid={Boolean(errors.producerName)}
            className={fieldClass}
          />
        </Field>
        <Field
          id="producerRevenueSplit"
          label="Producer's share (%)"
          hint="Of the base box office, before fees. 50 to 95; 85 is the standard agreement."
          error={errors.producerRevenueSplit?.message}
        >
          <input
            id="producerRevenueSplit"
            type="number"
            inputMode="decimal"
            min={50}
            max={95}
            step={0.5}
            {...register("producerRevenueSplit")}
            aria-invalid={Boolean(errors.producerRevenueSplit)}
            className={fieldClass}
          />
        </Field>
        <Field id="watermarkMode" label="Viewer watermark" className="sm:col-span-2">
          <Controller
            control={control}
            name="watermarkMode"
            render={({ field }) => (
              <OptionSelect
                id="watermarkMode"
                value={field.value}
                onChange={field.onChange}
                options={WATERMARK_MODES.map((mode) => ({
                  value: mode,
                  label: WATERMARK_LABEL[mode],
                }))}
              />
            )}
          />
        </Field>
      </div>
      {failure && <FormAlert>{failure}</FormAlert>}
      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
