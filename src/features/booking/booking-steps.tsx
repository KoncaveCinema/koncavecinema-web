"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type BookingStepId = "room" | "identity" | "snacks" | "review";

export const STEP_LABELS: Record<BookingStepId, string> = {
  room: "Room",
  identity: "Verify identity",
  snacks: "Snacks",
  review: "Review & pay",
};

/**
 * The booking progress, one entry per real step (mapped 1:1 to the flow, as checkout research
 * recommends). Completed steps can be clicked to go back.
 */
export function BookingSteps({
  steps,
  current,
  done,
  onSelect,
}: {
  steps: BookingStepId[];
  current: BookingStepId;
  done: (step: BookingStepId) => boolean;
  onSelect?: (step: BookingStepId) => void;
}) {
  return (
    <ol
      aria-label="Booking progress"
      className="scrollbar-none flex items-center gap-2 overflow-x-auto"
    >
      {steps.map((step, index) => {
        const isCurrent = step === current;
        const isDone = !isCurrent && done(step);
        const clickable = isDone && onSelect;
        const content = (
          <>
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold tabular-nums transition-colors",
                isCurrent
                  ? "bg-brand text-brand-foreground"
                  : isDone
                    ? "bg-lobby/15 text-lobby"
                    : "bg-white/6 text-white/40",
              )}
            >
              {isDone ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span
              className={cn(
                "text-xs font-semibold whitespace-nowrap",
                isCurrent ? "text-foreground" : isDone ? "text-white/65" : "text-white/35",
              )}
            >
              {STEP_LABELS[step]}
            </span>
          </>
        );
        return (
          <li
            key={step}
            aria-current={isCurrent ? "step" : undefined}
            className="flex items-center gap-2"
          >
            {index > 0 && (
              <span aria-hidden="true" className="h-px w-5 shrink-0 bg-white/12 sm:w-8" />
            )}
            {clickable ? (
              <button
                type="button"
                onClick={() => onSelect(step)}
                className="flex items-center gap-2 rounded-full py-1 pr-2 transition-colors hover:bg-white/5"
              >
                {content}
              </button>
            ) : (
              <span className="flex items-center gap-2 py-1 pr-2">{content}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
