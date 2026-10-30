import { cn } from "cn";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

const TONES = {
  brand: "bg-brand/12 text-[#ff5a63] ring-brand/25",
  gold: "bg-gold/12 text-gold ring-gold/25",
  lobby: "bg-lobby/12 text-lobby ring-lobby/25",
  neutral: "bg-white/6 text-white/70 ring-white/10",
} as const;

/**
 * One number that matters: its label, the figure in display type, and a line of context. With
 * `href` the whole tile opens the list behind the number.
 */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  href,
  emphasis = false,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  /** The icon's colour: brand (the cinema), gold (money, attention), lobby (good news) */
  tone?: keyof typeof TONES;
  href?: string;
  /** Draws the eye: a number that needs action, e.g. refunds waiting */
  emphasis?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.68rem] font-bold tracking-[0.2em] text-white/50 uppercase">{label}</p>
        {Icon && (
          <span
            className={cn("grid size-9 shrink-0 place-items-center rounded-xl ring-1", TONES[tone])}
          >
            <Icon aria-hidden="true" className="size-[1.1rem]" />
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-3xl leading-none font-black tracking-tight tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-2.5 text-xs text-white/50">{hint}</p>}
      {href && (
        <ArrowUpRight
          aria-hidden="true"
          className="absolute right-5 bottom-5 size-4 text-white/25 transition-colors group-hover:text-foreground"
        />
      )}
    </>
  );

  const frame = cn(
    "group relative overflow-hidden rounded-2xl border bg-[linear-gradient(150deg,var(--color-surface-2),var(--color-surface-1)_70%)] p-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]",
    emphasis ? "border-gold/35" : "border-white/10",
    href && "transition-colors hover:border-white/25",
    className,
  );

  return href ? (
    <Link href={href} className={frame}>
      {body}
    </Link>
  ) : (
    <div className={frame}>{body}</div>
  );
}

export function StatTileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-surface-1 p-5", className)}>
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="mt-5 h-7 w-16" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}
