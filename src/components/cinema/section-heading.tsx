import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Red eyebrow, display title and an optional "see all" link, as in the mock's sections. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  id,
  className,
  align = "start",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  id?: string;
  className?: string;
  align?: "start" | "center";
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-8 gap-y-4",
        align === "center" && "flex-col items-center text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl reveal space-y-3", align === "center" && "mx-auto")}>
        <p className="flex items-center gap-3 text-[0.7rem] font-bold tracking-[0.32em] text-brand uppercase">
          <span aria-hidden="true" className="h-px w-6 bg-brand" />
          {eyebrow}
        </p>
        <h2
          id={id}
          className="font-display text-3xl leading-[1.05] font-extrabold text-balance sm:text-4xl"
        >
          {title}
        </h2>
        {description && (
          <p className="text-base leading-relaxed text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {action.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
