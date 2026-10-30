import type { TicketTier } from "@/types/domain";
import type { ApiPricingBreakdown } from "./api-types";

/*
 * Sample data only (NEXT_PUBLIC_DATA_SOURCE=fixtures). A copy of the API's single price formula
 * (koncavecinema-api `src/common/money/pricing.ts`), so sample breakdowns match what the API
 * will return. With the API connected, every price comes from the API and this file is unused.
 */

const SEATS: Record<TicketTier, number> = {
  INDIVIDUAL: 1,
  PUBLIC: 1,
  PRIVATE_5: 5,
  PRIVATE_10: 10,
};
const SUITE_MARKUP_PERCENT = 20;
// Paystack NGN: 1.5% + NGN 100 (waived under NGN 2,500), capped at NGN 2,000. In kobo.
const FEE_RATE_PER_MILLE = 15;
const FLAT_FEE_MINOR = 100_00;
const FLAT_FEE_THRESHOLD_MINOR = 2_500_00;
const FEE_CAP_MINOR = 2_000_00;
// The platform is below the VAT threshold, so the API's VAT rate is currently 0
const VAT_PERCENT = 0;

const grossUp = (net: number) => Math.ceil((net * 1000) / (1000 - FEE_RATE_PER_MILLE));

function processingFeeMinor(netMinor: number): number {
  if (netMinor <= 0) return 0;
  let total = grossUp(netMinor + FLAT_FEE_MINOR);
  if (total < FLAT_FEE_THRESHOLD_MINOR) total = grossUp(netMinor);
  return Math.min(total - netMinor, FEE_CAP_MINOR);
}

export function fixturePricing(basePrice: number, tier: TicketTier): ApiPricingBreakdown {
  const seatCount = SEATS[tier];
  const baseMinor = Math.round(basePrice * 100) * seatCount;
  const markupMinor = seatCount > 1 ? Math.round((baseMinor * SUITE_MARKUP_PERCENT) / 100) : 0;
  const subtotalMinor = baseMinor + markupMinor;
  const vatMinor = Math.round((subtotalMinor * VAT_PERCENT) / 100);
  const feeMinor = processingFeeMinor(subtotalMinor + vatMinor);
  return {
    currency: "NGN",
    basePrice,
    seatCount,
    baseAmount: baseMinor / 100,
    infrastructureMarkup: markupMinor / 100,
    subtotal: subtotalMinor / 100,
    vatPercent: VAT_PERCENT,
    vatAmount: vatMinor / 100,
    processingFee: feeMinor / 100,
    totalPayable: (subtotalMinor + vatMinor + feeMinor) / 100,
  };
}

/** The four tiers as the capacity endpoint describes them */
export const FIXTURE_TIERS: {
  tier: TicketTier;
  tierName: string;
  requiresKyc: boolean;
  description: string;
}[] = [
  {
    tier: "INDIVIDUAL",
    tierName: "Individual Watch",
    requiresKyc: false,
    description: "Solo, distraction-free viewing.",
  },
  {
    tier: "PUBLIC",
    tierName: "Public Hall",
    requiresKyc: true,
    description: "Watch with fellow fans, with live chat and reactions.",
  },
  {
    tier: "PRIVATE_5",
    tierName: "Private Suite (5)",
    requiresKyc: false,
    description: "A private room for up to 5 guests, with a voice lounge.",
  },
  {
    tier: "PRIVATE_10",
    tierName: "Private Suite (10)",
    requiresKyc: false,
    description: "A private room for up to 10 guests, with a voice lounge.",
  },
];
