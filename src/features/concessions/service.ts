import { env } from "@/env";
import { api } from "@/lib/api";

import type {
  AddressValidation,
  ConcessionLine,
  ConcessionMenuItem,
  ConcessionQuote,
} from "./api-types";

/*
 * Concessions calls. With NEXT_PUBLIC_DATA_SOURCE=fixtures a sample menu and a demo delivery
 * check stand in for the API; the amounts are worked out here, playing the API's part, so the
 * interface only ever displays them.
 */

const demo = env.NEXT_PUBLIC_DATA_SOURCE === "fixtures";

/** Orders close 50 minutes before the start, when the kitchen dispatches (API phase 7) */
export const DISPATCH_LEAD_MS = 50 * 60_000;

const MENU: ConcessionMenuItem[] = [
  {
    id: "menu-popcorn-caramel",
    sku: "POPCORN-LG-CARAMEL",
    name: "Caramel popcorn",
    description: "A large bucket, glazed and still warm.",
    category: "POPCORN",
    unitPrice: 2500,
    currency: "NGN",
    imageUrl: "/placeholder/snack-popcorn.jpg",
    isAvailable: true,
  },
  {
    id: "menu-popcorn-salted",
    sku: "POPCORN-LG-SALTED",
    name: "Salted popcorn",
    description: "The cinema classic, lightly salted.",
    category: "POPCORN",
    unitPrice: 2000,
    currency: "NGN",
    imageUrl: "/placeholder/snack-popcorn.jpg",
    isAvailable: true,
  },
  {
    id: "menu-chicken-chips",
    sku: "FOOD-CHICKEN-CHIPS",
    name: "Chicken & chips",
    description: "Crispy chicken with hot chips.",
    category: "FOOD",
    unitPrice: 6500,
    currency: "NGN",
    imageUrl: "/placeholder/snack-chicken.jpg",
    isAvailable: true,
  },
  {
    id: "menu-soft-drink",
    sku: "DRINK-SOFT-50CL",
    name: "Chilled soft drink",
    description: "Ice-cold, 50 cl.",
    category: "DRINKS",
    unitPrice: 1000,
    currency: "NGN",
    imageUrl: "/placeholder/snack-drinks.jpg",
    isAvailable: true,
  },
  {
    id: "menu-juice",
    sku: "DRINK-JUICE-1L",
    name: "Fruit juice",
    description: "A litre to share.",
    category: "DRINKS",
    unitPrice: 2200,
    currency: "NGN",
    imageUrl: "/placeholder/snack-drinks.jpg",
    isAvailable: true,
  },
  {
    id: "menu-ice-cream",
    sku: "SWEET-ICE-CREAM",
    name: "Ice cream tub",
    description: "Vanilla or chocolate, for the second half.",
    category: "SWEETS",
    unitPrice: 2000,
    currency: "NGN",
    imageUrl: "/placeholder/snack-ice-cream.jpg",
    isAvailable: true,
  },
];

// Demo delivery zones and fees (Lagos, Abuja and Port Harcourt at launch)
const DEMO_ZONES = [
  { match: /lekki|ajah|victoria island|\bvi\b|ikoyi/i, city: "Lagos", fee: 1500 },
  { match: /ikeja|yaba|surulere|lagos/i, city: "Lagos", fee: 1200 },
  { match: /abuja|wuse|garki|maitama/i, city: "Abuja", fee: 1500 },
  { match: /port harcourt|rumuola|gra/i, city: "Port Harcourt", fee: 1400 },
];

const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getMenu(): Promise<ConcessionMenuItem[]> {
  if (demo) return MENU;
  return api.get<ConcessionMenuItem[]>("/concessions/catalog");
}

export async function validateAddress(address: string): Promise<AddressValidation> {
  if (!demo) {
    return api.post<AddressValidation>("/concessions/validate-address", { address });
  }
  await wait(600);
  const zone = DEMO_ZONES.find((candidate) => candidate.match.test(address));
  return {
    isServiceable: Boolean(zone),
    formattedAddress: address.trim(),
    latitude: 6.45,
    longitude: 3.4,
    deliveryFee: zone?.fee ?? 0,
    currency: "NGN",
    reason: zone
      ? null
      : "We don't deliver there yet. Delivery covers Lagos, Abuja and Port Harcourt.",
  };
}

/** Prices the order. The API returns this; in demo mode it is calculated here in its place. */
export async function quoteOrder(params: {
  showtimeStartTime: string;
  lines: ConcessionLine[];
  deliveryFee: number;
}): Promise<ConcessionQuote> {
  if (!demo) return api.post<ConcessionQuote>("/concessions/quote", params);
  await wait(150);
  const items = params.lines.flatMap((line) => {
    const item = MENU.find((candidate) => candidate.id === line.menuItemId);
    if (!item || line.quantity < 1) return [];
    return [
      {
        menuItemId: item.id,
        itemName: item.name,
        quantity: line.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.unitPrice * line.quantity,
      },
    ];
  });
  const itemsSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = items.length ? params.deliveryFee : 0;
  return {
    items,
    itemsSubtotal,
    deliveryFee,
    totalAmount: itemsSubtotal + deliveryFee,
    currency: "NGN",
    scheduledDispatchAt: new Date(
      Date.parse(params.showtimeStartTime) - DISPATCH_LEAD_MS,
    ).toISOString(),
  };
}
