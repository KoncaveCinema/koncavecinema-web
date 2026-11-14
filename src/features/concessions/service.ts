import { api } from "@/api";

import type {
  AddressValidation,
  ConcessionLine,
  ConcessionMenuItem,
  ConcessionQuote,
} from "./api-types";

/*
 * Concessions calls (API phase 7). The API prices every order; the interface only displays the
 * amounts. Not shown anywhere yet: snacks stay hidden until the API serves them.
 */

/** Orders close 50 minutes before the start, when the kitchen dispatches (API phase 7) */
export const DISPATCH_LEAD_MS = 50 * 60_000;

export function getMenu(): Promise<ConcessionMenuItem[]> {
  return api.get<ConcessionMenuItem[]>("/concessions/catalog");
}

export function validateAddress(address: string): Promise<AddressValidation> {
  return api.post<AddressValidation>("/concessions/validate-address", { address });
}

/** Prices the order */
export function quoteOrder(params: {
  showtimeStartTime: string;
  lines: ConcessionLine[];
  deliveryFee: number;
}): Promise<ConcessionQuote> {
  return api.post<ConcessionQuote>("/concessions/quote", params);
}
