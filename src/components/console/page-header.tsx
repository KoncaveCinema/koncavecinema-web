import { cn } from "cn";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The public site's section label (a red rule and spaced capitals, as on the film page's
 * "Tickets" and "About the film"), so the console reads in the same voice.
 */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[0.7rem] font-bold tracking-[0.32em] text-brand uppercase",
        className,
      )}
    >
      <span aria-hidden="true" className="h-px w-6 bg-brand" />
      {children}
    </p>
  );
}

export interface Crumb {
  href: string;
  label: string;
}

/**
 * The top of every console page, in the site's voice: a section label, a display title, one
 * line on what this is, and the actions (the primary one last, at the edge). A record page
 * shows the way back to its list instead of the label.
 */
export function PageHeader({
  title,
  eyebrow,
  description,
  crumbs,
  actions,
  meta,
  className,
}: {
  title: ReactNode;
  /** The section label above the title, e.g. "Your account" */
  eyebrow?: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  /** Badges or facts beside the title, e.g. a status */
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 pb-8 sm:pb-10", className)}>
      {crumbs && crumbs.length > 0 ? (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-white/45">
            {crumbs.map((crumb) => (
              <li key={crumb.href} className="flex items-center gap-1.5">
                <Link href={crumb.href} className="transition-colors hover:text-foreground">
                  {crumb.label}
                </Link>
                <ChevronRight aria-hidden="true" className="size-3" />
              </li>
            ))}
          </ol>
        </nav>
      ) : (
        eyebrow && <SectionLabel>{eyebrow}</SectionLabel>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl leading-[1.05] font-black tracking-tight text-balance sm:text-[2.6rem]">
              {title}
            </h1>
            {meta}
          </div>
          {description && (
            <p className="mt-3 max-w-2xl text-[0.95rem] text-pretty text-white/60">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </header>
  );
}
