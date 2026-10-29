import type { ApiPricingBreakdown } from "@/features/catalog/api-types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The API's price breakdown as a receipt. Every figure is a field from the API; nothing is added
 * up here.
 */
export function PriceBreakdown({
  pricing,
  className,
  showTotal = true,
}: {
  pricing: ApiPricingBreakdown;
  className?: string;
  showTotal?: boolean;
}) {
  const money = (amount: number) => formatMoney(amount, pricing.currency);
  const rows = [
    {
      label:
        pricing.seatCount > 1
          ? `Admission (${money(pricing.basePrice)} × ${pricing.seatCount})`
          : "Admission",
      value: pricing.baseAmount,
    },
    ...(pricing.infrastructureMarkup > 0
      ? [{ label: "Private suite service", value: pricing.infrastructureMarkup }]
      : []),
    ...(pricing.vatAmount > 0
      ? [{ label: `VAT (${pricing.vatPercent}%)`, value: pricing.vatAmount }]
      : []),
    { label: "Payment processing", value: pricing.processingFee },
  ];

  return (
    <dl className={cn("space-y-2 text-sm", className)}>
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4 text-muted-foreground">
          <dt>{row.label}</dt>
          <dd className="tabular-nums">{money(row.value)}</dd>
        </div>
      ))}
      {showTotal && (
        <div className="flex justify-between gap-4 border-t border-white/10 pt-2 font-semibold text-foreground">
          <dt>Total</dt>
          <dd className="tabular-nums">{money(pricing.totalPayable)}</dd>
        </div>
      )}
    </dl>
  );
}
