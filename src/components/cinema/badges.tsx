import { formatMoney, ratingDescription, ratingLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AgeRating } from "@/types/domain";

/* Small labels used on cards and the billboard: the NFVCB rating and the starting price. */

/** NFVCB classification pill; adults-only films get the gold treatment from the brand mock. */
export function RatingBadge({ rating, className }: { rating: AgeRating; className?: string }) {
  const adult = rating === "EIGHTEEN_PLUS";
  return (
    <span
      title={`NFVCB ${ratingLabel(rating)}: ${ratingDescription(rating)}`}
      className={cn(
        "inline-flex h-6 min-w-9 items-center justify-center rounded-full border px-2.5 text-xs font-bold tabular-nums",
        adult
          ? "border-gold/70 bg-gold/10 text-gold"
          : "border-white/25 bg-black/30 text-white/90 backdrop-blur-sm",
        className,
      )}
    >
      {ratingLabel(rating)}
      {rating !== "G" && rating !== "PG" && "+"}
      <span className="sr-only">, {ratingDescription(rating)}</span>
    </span>
  );
}

/** "From ₦5,000", with the amount in tabular figures. */
export function PriceFrom({
  price,
  className,
  suffix,
}: {
  price: { amount: number; currency: string } | null;
  className?: string;
  suffix?: string;
}) {
  if (!price) return null;
  return (
    <span className={cn("tabular-nums", className)}>
      From{" "}
      <span className="font-semibold text-foreground">
        {formatMoney(price.amount, price.currency)}
      </span>
      {suffix && <span className="text-muted-foreground"> {suffix}</span>}
    </span>
  );
}
