"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AddressValidation, ConcessionLine } from "./api-types";

/*
 * The snack order being built during checkout, per held ticket. Kept for this browser tab only,
 * so a reload mid-checkout keeps the basket. Quantities and address only: no prices (those come
 * from the quote) and nothing sensitive.
 */

export interface ConcessionDraft {
  lines: ConcessionLine[];
  address: string;
  recipientPhone: string;
  /** The delivery check for `address`, once run */
  validation: AddressValidation | null;
  /** The viewer chose to skip snacks for this booking */
  skipped: boolean;
}

const EMPTY: ConcessionDraft = {
  lines: [],
  address: "",
  recipientPhone: "",
  validation: null,
  skipped: false,
};

interface CartState {
  drafts: Record<string, ConcessionDraft>;
  update: (ticketId: string, patch: Partial<ConcessionDraft>) => void;
  setQuantity: (ticketId: string, menuItemId: string, quantity: number) => void;
}

export const useConcessionCart = create<CartState>()(
  persist(
    (set) => ({
      drafts: {},
      update: (ticketId, patch) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [ticketId]: { ...EMPTY, ...state.drafts[ticketId], ...patch },
          },
        })),
      setQuantity: (ticketId, menuItemId, quantity) =>
        set((state) => {
          const draft = { ...EMPTY, ...state.drafts[ticketId] };
          const others = draft.lines.filter((line) => line.menuItemId !== menuItemId);
          const lines = quantity > 0 ? [...others, { menuItemId, quantity }] : others;
          return { drafts: { ...state.drafts, [ticketId]: { ...draft, lines, skipped: false } } };
        }),
    }),
    { name: "kc-concessions", storage: createJSONStorage(() => sessionStorage) },
  ),
);

export function useConcessionDraft(ticketId: string): ConcessionDraft {
  return useConcessionCart((state) => state.drafts[ticketId] ?? EMPTY);
}
