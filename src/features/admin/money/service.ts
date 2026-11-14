import { api, type Paginated } from "@/api";

import type { AdminPayment, SalesReport } from "./api-types";

/* The money calls, one function per endpoint. */

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

export function getSalesReport(query: SalesQuery): Promise<SalesReport> {
  return api.get<SalesReport>("/admin/reports/sales", { params: query });
}

export function listPayments(query: PaymentsQuery): Promise<Paginated<AdminPayment>> {
  return api.getPage<AdminPayment>("/admin/payments", { params: query });
}

export function listRefunds(query: {
  state: "pending" | "done";
  page?: number;
  /** 20 when absent (the API's default), at most 100 */
  pageSize?: number;
}): Promise<Paginated<AdminPayment>> {
  return api.getPage<AdminPayment>("/admin/refunds", { params: query });
}

/** Records a refund already made in the Paystack dashboard (super admin only) */
export function markRefunded(paymentId: string, note: string): Promise<AdminPayment> {
  return api.post<AdminPayment>(`/admin/refunds/${paymentId}/mark-refunded`, { note });
}
