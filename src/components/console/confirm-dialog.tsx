// Client component: import it from client modules only (they are the client boundary, so
// its function props never cross from the server).

import { cn } from "cn";
import { AlertTriangle } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toApiError, type ApiError } from "@/lib/api";

/** What a confirmation dialog asks for before an action that can't be undone. */
export interface ReasonRule {
  label: string;
  placeholder?: string;
  hint?: string;
  /** The API's limits, e.g. 5 to 500 for a cancellation reason */
  min: number;
  max: number;
}

/** The problem with a reason as typed, or null when it is acceptable. */
export function reasonProblem(value: string, rule: ReasonRule): string | null {
  const length = value.trim().length;
  if (length < rule.min) {
    return rule.min === 1 ? "This can't be empty." : `Write at least ${rule.min} characters.`;
  }
  if (length > rule.max) return `Keep it under ${rule.max} characters.`;
  return null;
}

/** Whether the typed confirmation matches (case and surrounding spaces don't matter). */
export function typedConfirmationMatches(value: string, expected: string): boolean {
  return value.trim().toUpperCase() === expected.trim().toUpperCase();
}

/**
 * The one way the console asks "are you sure?" before something consequential. It states the
 * consequences before anyone types, can ask for a reason (sent to members, so it says so) or a
 * typed word for the irreversible, and shows the API's answer inside the dialog: a refusal is
 * explained where the decision was made, and the dialog stays open to correct it.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  consequences,
  confirmLabel,
  pendingLabel = "Working…",
  tone = "default",
  reason,
  typedConfirmation,
  children,
  canConfirm = true,
  onConfirm,
  explainError,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** What will happen, in plain words, listed before the button */
  consequences?: ReactNode[];
  confirmLabel: string;
  pendingLabel?: string;
  tone?: "default" | "danger";
  reason?: ReasonRule;
  /** A word to type before the button works, e.g. DELETE */
  typedConfirmation?: string;
  /** Extra fields, e.g. a password */
  children?: ReactNode;
  /** False while the extra fields are incomplete */
  canConfirm?: boolean;
  onConfirm: (reason: string) => Promise<void>;
  /** Turns the API's refusal into words for this action; falls back to the API's message */
  explainError?: (error: ApiError) => ReactNode;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const [typed, setTyped] = useState("");
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const problem = reason ? reasonProblem(text, reason) : null;
  const typedOk = !typedConfirmation || typedConfirmationMatches(typed, typedConfirmation);
  const ready = !problem && typedOk && canConfirm && !pending;

  function reset() {
    setText("");
    setTyped("");
    setTouched(false);
    setError(null);
  }

  async function confirm() {
    setTouched(true);
    if (!ready) return;
    setPending(true);
    setError(null);
    try {
      await onConfirm(text.trim());
      reset();
      onOpenChange(false);
    } catch (caught) {
      setError(toApiError(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <AlertDialogContent className="gap-0 border border-white/10 bg-surface-1 p-0 data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-md">
        <AlertDialogHeader className="gap-2 px-6 pt-6">
          <div className="flex items-start gap-3">
            {tone === "danger" && (
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-brand/12 text-[#ff5a63]">
                <AlertTriangle aria-hidden="true" className="size-4" />
              </span>
            )}
            <div className="min-w-0">
              <AlertDialogTitle className="font-display text-lg leading-snug font-bold">
                {title}
              </AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="mt-1.5 text-sm leading-relaxed text-white/60">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 px-6 py-5">
          {consequences && consequences.length > 0 && (
            <ul className="space-y-2 rounded-xl border border-white/8 bg-white/2 p-4 text-sm text-white/75">
              {consequences.map((item, index) => (
                <li key={index} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1 shrink-0 rounded-full bg-white/40"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          {reason && (
            <div className="space-y-1.5">
              <label htmlFor={`${id}-reason`} className="text-sm font-medium">
                {reason.label}
              </label>
              <textarea
                id={`${id}-reason`}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onBlur={() => setTouched(true)}
                placeholder={reason.placeholder}
                rows={3}
                maxLength={reason.max + 50}
                aria-invalid={touched && Boolean(problem)}
                aria-describedby={`${id}-reason-help`}
                className="w-full resize-y rounded-lg border border-white/10 bg-white/4 px-3 py-2 text-sm outline-none placeholder:text-white/35 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 aria-invalid:border-destructive"
              />
              <p
                id={`${id}-reason-help`}
                className={cn(
                  "flex justify-between gap-3 text-xs",
                  touched && problem ? "text-destructive" : "text-white/45",
                )}
              >
                <span>{touched && problem ? problem : reason.hint}</span>
                <span className="tabular-nums">
                  {text.trim().length}/{reason.max}
                </span>
              </p>
            </div>
          )}

          {children}

          {typedConfirmation && (
            <div className="space-y-1.5">
              <label htmlFor={`${id}-typed`} className="text-sm">
                Type <strong className="font-mono">{typedConfirmation}</strong> to confirm
              </label>
              <input
                id={`${id}-typed`}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="h-9 w-full rounded-lg border border-white/10 bg-white/4 px-3 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              />
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-brand/25 bg-brand/8 px-3 py-2.5 text-sm text-[#ff8a90]"
            >
              {explainError?.(error) ?? error.message}
            </p>
          )}
        </div>

        <AlertDialogFooter className="mx-0 mb-0 rounded-b-xl border-white/8 bg-white/2 px-6 py-4">
          <AlertDialogCancel variant="ghost" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant={tone === "danger" ? "destructive" : "default"}
            disabled={pending || !typedOk || !canConfirm || (touched && Boolean(problem))}
            onClick={() => void confirm()}
            className={cn(tone === "danger" && "bg-brand text-white hover:bg-[#e8101f]")}
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
