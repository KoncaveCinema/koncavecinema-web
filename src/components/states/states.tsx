import { cn } from "cn";
import { AlertCircle, RotateCw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

/** Nothing to show yet: what this place is for, and the way to fill it. */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center text-pretty", className)}>
      {Icon && (
        <span className="grid size-11 place-items-center rounded-full bg-white/5 text-white/45 ring-1 ring-white/8">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      )}
      <p className="mt-4 font-semibold">{title}</p>
      {hint && <p className="mt-1.5 max-w-sm text-sm text-white/50">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Loading failed: say so plainly and offer the retry. */
export function ErrorState({
  title = "This couldn't load",
  message = "Check your connection, then try again.",
  onRetry,
  className,
}: {
  title?: string;
  message?: ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center px-6 py-14 text-center text-pretty", className)}
    >
      <span className="grid size-11 place-items-center rounded-full bg-brand/10 text-[#ff5a63] ring-1 ring-brand/25">
        <AlertCircle aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm text-white/50">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <RotateCw data-icon="inline-start" />
          Try again
        </Button>
      )}
    </div>
  );
}
