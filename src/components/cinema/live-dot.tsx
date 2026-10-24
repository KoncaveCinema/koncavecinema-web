import { cn } from "@/lib/utils";

/** A status light with a soft pulse (transform and opacity only). */
export function LiveDot({
  tone = "live",
  pulse = true,
  className,
}: {
  tone?: "live" | "lobby" | "gold" | "muted";
  pulse?: boolean;
  className?: string;
}) {
  const colour = {
    live: "bg-live",
    lobby: "bg-lobby",
    gold: "bg-gold",
    muted: "bg-white/50",
  }[tone];

  return (
    <span aria-hidden="true" className={cn("relative inline-flex size-2 shrink-0", className)}>
      {pulse && <span className={cn("absolute inset-0 animate-live-pulse rounded-full", colour)} />}
      <span className={cn("relative inline-flex size-2 rounded-full", colour)} />
    </span>
  );
}
