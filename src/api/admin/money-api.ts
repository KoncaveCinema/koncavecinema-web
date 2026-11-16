import { useMutation, useQuery } from "@tanstack/react-query";

import { http } from "../http";
import {
  adminOverviewSchema,
  adminPaymentPageSchema,
  adminPaymentSchema,
  salesReportSchema,
  type AdminPayment,
} from "./money-schemas";

/*
 * The admin money calls (koncavecinema-api docs/phases: phase-05b, §2.6): the overview, the
 * sales report, payments and the refunds queue, each parsing its reply, and their hooks.
 */

export interface SalesQuery {
  /** Lagos days, YYYY-MM-DD, at most 366 apart */
  from: string;
  to: string;
  movieId?: string;
}

export interface PaymentsQuery {
  status?: AdminPayment["status"];
  reference?: string;
  email?: string;
  page?: number;
  /** 20 when absent (the API's default), at most 100 */
  pageSize?: number;
}

export interface RefundsQuery {
  state: "pending" | "in_progress" | "done";
  page?: number;
  /** 20 when absent (the API's default), at most 100 */
  pageSize?: number;
}

/** GET /admin/overview */
export async function getOverview() {
  return adminOverviewSchema.parse(await http({ url: "/admin/overview" }));
}

/** GET /admin/reports/sales */
export async function getSalesReport(query: SalesQuery) {
  return salesReportSchema.parse(await http({ url: "/admin/reports/sales", params: query }));
}

/** GET /admin/payments */
export async function listPayments(query: PaymentsQuery) {
  return adminPaymentPageSchema.parse(await http({ url: "/admin/payments", params: query }));
}

/** GET /admin/refunds */
export async function listRefunds(query: RefundsQuery) {
  return adminPaymentPageSchema.parse(await http({ url: "/admin/refunds", params: query }));
}

/**
 * POST /admin/refunds/:paymentId/refund: sends a full refund through Paystack (super admin). The
 * payment is IN_PROGRESS until Paystack's webhook settles it.
 */
export async function sendRefund(paymentId: string) {
  return adminPaymentSchema.parse(
    await http({ url: `/admin/refunds/${encodeURIComponent(paymentId)}/refund`, method: "POST" }),
  );
}

/** POST /admin/refunds/:paymentId/mark-refunded: a refund already made in Paystack (super admin) */
export async function markRefunded({ paymentId, note }: { paymentId: string; note: string }) {
  return adminPaymentSchema.parse(
    await http({
      url: `/admin/refunds/${encodeURIComponent(paymentId)}/mark-refunded`,
      method: "POST",
      data: { note },
    }),
  );
}

/* Hooks. Each query waits for `enabled` (a member of staff signed in). */

/** In the sidebar on every page (the refunds badge), so a write never waits for it */
export function useOverview(enabled: boolean) {
  return useQuery({
    queryKey: ["/admin/overview"],
    queryFn: getOverview,
    enabled,
    meta: { background: true },
  });
}

/** Null while the chosen range can't be asked for */
export function useSalesReport(query: SalesQuery | null, enabled: boolean) {
  return useQuery({
    queryKey: ["/admin/reports/sales", query],
    queryFn: () => getSalesReport(query!),
    enabled: enabled && query !== null,
    placeholderData: (previous) => previous,
  });
}

export function usePayments(query: PaymentsQuery, enabled: boolean) {
  return useQuery({
    queryKey: ["/admin/payments", query],
    queryFn: () => listPayments(query),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useRefunds(query: RefundsQuery, enabled: boolean) {
  return useQuery({
    queryKey: ["/admin/refunds", query],
    queryFn: () => listRefunds(query),
    enabled,
    placeholderData: (previous) => previous,
  });
}

export function useSendRefund() {
  return useMutation({ mutationKey: ["sendRefund"], mutationFn: sendRefund });
}

export function useMarkRefunded() {
  return useMutation({ mutationKey: ["markRefunded"], mutationFn: markRefunded });
}
