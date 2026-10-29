/*
 * Concessions shapes. The API's phase 7 plans these endpoints but has not built them yet:
 * GET /concessions/catalog, POST /concessions/validate-address and POST /concessions/orders
 * (request: { showtimeId, deliveryAddress, recipientPhone, items: [{ menuItemId, quantity }] }).
 * Response fields follow the API's ConcessionOrder and ConcessionOrderItem models; the quote is a
 * request to the backend (docs/roadmap/02-sprint-2-catalog-and-booking.md, backend gaps).
 */

export type ConcessionCategory = "POPCORN" | "DRINKS" | "FOOD" | "SWEETS";

/** GET /concessions/catalog */
export interface ConcessionMenuItem {
  /** Sent back as `menuItemId` when ordering */
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ConcessionCategory;
  unitPrice: number;
  currency: string;
  imageUrl: string;
  isAvailable: boolean;
}

/** POST /concessions/validate-address: is the address in a delivery zone, and the fee to it */
export interface AddressValidation {
  isServiceable: boolean;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  deliveryFee: number;
  currency: string;
  /** Why an address can't be served, when it can't */
  reason: string | null;
}

export interface ConcessionLine {
  menuItemId: string;
  quantity: number;
}

/** The priced order: the browser shows these amounts and never adds them up itself */
export interface ConcessionQuote {
  items: {
    menuItemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  itemsSubtotal: number;
  deliveryFee: number;
  totalAmount: number;
  currency: string;
  /** Showtime minus 50 minutes: when the order leaves the kitchen */
  scheduledDispatchAt: string;
}
