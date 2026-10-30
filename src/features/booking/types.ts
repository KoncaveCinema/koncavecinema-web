/* The booking pages' own view of a ticket, built from the API's shapes in api-types.ts. */

import type { ReservationReceipt } from "./api-types";

/** Film details the checkout shows next to a hold */
export interface ShowtimeSummary {
  showtimeId: string;
  movieTitle: string;
  movieSlug: string;
  posterPortrait: string;
  posterLandscape: string;
  startTime: string;
  endTime: string;
}

/** Everything the checkout page needs for one held ticket, derived from the ticket detail */
export interface Checkout {
  receipt: ReservationReceipt;
  showtime: ShowtimeSummary;
}

/** The ticket and the snacks as one order, priced by the API */
export interface CheckoutQuote {
  /** Snacks can be paid together with the ticket */
  concessionsIncluded: boolean;
  totalPayable: number;
  currency: string;
}
