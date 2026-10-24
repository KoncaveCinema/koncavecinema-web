import { cn } from "@/lib/utils";

/*
 * INTERIM LOGO. A faithful-as-possible SVG redraw of the Koncave Cinema mark (film-strip K)
 * and wordmark, made from the brand sheet JPEGs. Replace the contents of this file with the
 * designer's official SVGs when they arrive; every usage goes through these components.
 */

interface MarkProps {
  className?: string;
  /** Solid white mark for use on red backgrounds */
  monochrome?: boolean;
}

/** The film-strip K monogram */
export function LogoMark({ className, monochrome = false }: MarkProps) {
  const id = monochrome ? "kc-mark-mono" : "kc-mark";
  const red = monochrome ? "#ffffff" : `url(#${id}-red)`;
  const fold = monochrome ? "#e6e6e6" : "#970001";

  return (
    <svg viewBox="0 0 110 124" className={cn("h-10 w-auto", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-red`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff1a26" />
          <stop offset="0.55" stopColor="#d60211" />
          <stop offset="1" stopColor="#a80008" />
        </linearGradient>
        <mask id={`${id}-holes`}>
          <rect width="110" height="124" fill="#fff" />
          {[30, 45, 60, 75, 90, 105].map((y) => (
            <rect key={y} x="16" y={y - 6} width="9" height="9.5" rx="2.5" fill="#000" />
          ))}
        </mask>
      </defs>
      {/* Film strip: the K's stem, in slight perspective */}
      <path
        d="M10 24 L38 8 V112 Q38 117 33.5 118.5 L15 123 Q10 124 10 119 Z"
        fill={red}
        mask={`url(#${id}-holes)`}
      />
      {/* Upper arm, folding over the lower one */}
      <path d="M42 62 L86 16 H108 L62 64 Z" fill={red} />
      <path d="M42 62 L62 64 L56 70 Z" fill={fold} />
      {/* Lower arm */}
      <path d="M50 68 L66 62 L108 120 H85 Z" fill={red} />
    </svg>
  );
}

/** The A without a crossbar, holding a red triangle, as drawn in the wordmark */
function WordmarkA() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="inline-block h-[0.74em] w-[0.86em] align-baseline"
      aria-hidden="true"
    >
      <path d="M0 100 L42 0 H58 L100 100 H77 L50 34 L23 100 Z" fill="currentColor" />
      <path d="M50 60 L64 94 H36 Z" fill="#d60211" />
    </svg>
  );
}

interface WordmarkProps {
  className?: string;
  /** Hide the "CINEMA" line (very small sizes) */
  compact?: boolean;
}

export function LogoWordmark({ className, compact = false }: WordmarkProps) {
  return (
    <span className={cn("inline-flex flex-col items-center leading-none", className)}>
      <span className="font-display text-[1em] font-black tracking-[-0.01em] font-stretch-125%">
        KONC
        <WordmarkA />
        VE
      </span>
      {!compact && (
        <span className="mt-[0.28em] flex w-full items-center gap-[0.5em] text-[0.32em] font-semibold tracking-[0.62em] text-brand">
          <span className="h-px flex-1 bg-brand" />
          <span className="mr-[-0.62em]">CINEMA</span>
          <span className="h-px flex-1 bg-brand" />
        </span>
      )}
    </span>
  );
}

interface LogoProps {
  className?: string;
  variant?: "stacked" | "inline";
}

/** Full lockup. `stacked` matches the brand sheet; `inline` suits tight horizontal bars. */
export function Logo({ className, variant = "stacked" }: LogoProps) {
  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-2.5", className)}>
        <LogoMark className="h-9" />
        <LogoWordmark className="text-[1.15rem]" />
        <span className="sr-only">Koncave Cinema</span>
      </span>
    );
  }
  return (
    <span className={cn("inline-flex flex-col items-center gap-1", className)}>
      <LogoMark className="h-8" />
      <LogoWordmark className="text-[0.95rem]" />
      <span className="sr-only">Koncave Cinema</span>
    </span>
  );
}
