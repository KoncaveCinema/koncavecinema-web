"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useConcessionDraft } from "./cart";
import { quoteOrder } from "./service";

/**
 * The priced snack order for a held ticket, refetched whenever the basket or the delivery fee
 * changes. Null when there is nothing in the basket or snacks were skipped.
 */
export function useConcessionQuote(ticketId: string, showtimeStartTime: string) {
  const draft = useConcessionDraft(ticketId);
  const active = !draft.skipped && draft.lines.length > 0;
  const deliveryFee = draft.validation?.isServiceable ? draft.validation.deliveryFee : 0;
  const lines = [...draft.lines].sort((a, b) => a.menuItemId.localeCompare(b.menuItemId));

  const query = useQuery({
    queryKey: ["concessions", "quote", ticketId, showtimeStartTime, lines, deliveryFee],
    queryFn: () => quoteOrder({ showtimeStartTime, lines, deliveryFee }),
    enabled: active,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  return { quote: active ? (query.data ?? null) : null, pending: active && query.isFetching };
}
