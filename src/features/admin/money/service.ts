import { api, type Paginated } from "@/lib/api";
import { isDemo } from "@/lib/demo";

import type { AdminPayment, SalesReport } from "./api-types";
import * as demo from "./demo";

/* The money calls, one function per endpoint. With NEXT_PUBLIC_DATA_SOURCE=fixtures a demo
   plays the API's part. */

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
  if (isDemo) return demo.getSalesReport(query);
  return api.get<SalesReport>("/admin/reports/sales", { params: query });
}

export function listPayments(query: PaymentsQuery): Promise<Paginated<AdminPayment>> {
  if (isDemo) return demo.listPayments(query);
  return api.getPage<AdminPayment>("/admin/payments", { params: query });
}

export function listRefunds(query: {
  state: "pending" | "done";
  page?: number;
  /** 20 when absent (the API's default), at most 100 */
  pageSize?: number;
}): Promise<Paginated<AdminPayment>> {
  if (isDemo) return demo.listRefunds(query);
  return api.getPage<AdminPayment>("/admin/refunds", { params: query });
}

/** Records a refund already made in the Paystack dashboard (super admin only) */
export function markRefunded(paymentId: string, note: string): Promise<AdminPayment> {
  if (isDemo) return demo.markRefunded(paymentId, note);
  return api.post<AdminPayment>(`/admin/refunds/${paymentId}/mark-refunded`, { note });
}
