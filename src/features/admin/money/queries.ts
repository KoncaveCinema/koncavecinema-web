"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import type { PaginationQuery } from "@/api";

import { useStaffSignedIn } from "../require-staff";
import { useRefreshAdmin } from "../use-refresh-admin";
import {
  getSalesReport,
  listPayments,
  listRefunds,
  markRefunded,
  type PaymentsQuery,
  type SalesQuery,
} from "./service";

export const moneyKeys = {
  sales: (query: SalesQuery) => ["admin", "sales", query] as const,
  payments: (query: PaymentsQuery) => ["admin", "payments", query] as const,
  refunds: (state: "pending" | "done", page: PaginationQuery) =>
    ["admin", "refunds", state, page] as const,
};

export function useSalesReport(query: SalesQuery | null) {
  const staff = useStaffSignedIn();
  return useQuery({
    queryKey: moneyKeys.sales(query ?? { from: "", to: "" }),
    queryFn: () => getSalesReport(query!),
    enabled: staff && query !== null,
    placeholderData: (previous) => previous,
  });
}

export function usePayments(query: PaymentsQuery) {
  const staff = useStaffSignedIn();
  return useQuery({
    queryKey: moneyKeys.payments(query),
    queryFn: () => listPayments(query),
    enabled: staff,
    placeholderData: (previous) => previous,
  });
}

export function useRefunds(state: "pending" | "done", page: PaginationQuery) {
  const staff = useStaffSignedIn();
  return useQuery({
    queryKey: moneyKeys.refunds(state, page),
    queryFn: () => listRefunds({ state, ...page }),
    enabled: staff,
  });
}

export function useMarkRefunded() {
  const refresh = useRefreshAdmin();
  return useMutation({
    mutationFn: ({ paymentId, note }: { paymentId: string; note: string }) =>
      markRefunded(paymentId, note),
    onSuccess: refresh,
  });
}
