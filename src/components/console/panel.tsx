import { cn } from "cn";
import type { ReactNode } from "react";

/**
 * A titled section of a console page. Lists inside it sit edge to edge (`flush`), forms and
 * text get the padding.
 */
export function Panel({
  title,
  description,
  actions,
  footer,
  flush = false,
  tone = "default",
  id,
  className,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  /** No inner padding, for tables and lists */
  flush?: boolean;
  /** `danger` for irreversible actions such as deleting an account */
  tone?: "default" | "danger";
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={title && id ? `${id}-title` : undefined}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-2xl border bg-[linear-gradient(160deg,var(--color-surface-2),var(--color-surface-1)_55%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]",
        tone === "danger" ? "border-brand/35" : "border-white/10",
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 px-6 py-5">
          <div className="min-w-0">
            {title && (
              <h2
                id={id ? `${id}-title` : undefined}
                className={cn(
                  "font-display text-base font-bold",
                  tone === "danger" && "text-[#ff6a72]",
                )}
              >
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-xs text-white/50">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(!flush && "p-6")}>{children}</div>
      {footer && (
        <footer className="border-t border-white/8 bg-white/2 px-5 py-3 text-xs text-white/50">
          {footer}
        </footer>
      )}
    </section>
  );
}
