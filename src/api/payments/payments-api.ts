import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { ErrorCode, isApiError } from "../errors";
import { http } from "../http";
import { sendIdempotent } from "../idempotent";
import { matchesPrefixes } from "../refetch";
import {
  checkoutSessionSchema,
  paymentVerificationSchema,
  type CheckoutSession,
  type PaymentVerification,
} from "./payments-schemas";

/*
 * Payment calls (koncavecinema-api docs/api: payments), each parsing its reply, and their hooks.
 * Paystack takes the payment; the API confirms it from Paystack's webhook and from verify.
 */

// Paystack's webhook can lag the redirect: check every 2 seconds for up to a minute
const VERIFY_POLL_MS = 2000;
const VERIFY_POLL_LIMIT = 30;
/** How long the confirmation page waits before saying the payment isn't confirmed yet */
export const VERIFY_WAIT_MS = VERIFY_POLL_MS * VERIFY_POLL_LIMIT;

export interface CheckoutInput {
  ticketId: string;
  /** One per intended payment: kept for a retry of the same press of Pay */
  idempotencyKey: string;
}

/**
 * POST /payments/checkout/initialize. No callback URL is sent: Paystack then returns the buyer to
 * the API's `{WEB_APP_URL}/checkout/{ticketId}/confirmation?reference=…` (a callback on any
 * other origin is refused with CALLBACK_URL_NOT_ALLOWED).
 */
export async function initializeCheckout({
  ticketId,
  idempotencyKey,
}: CheckoutInput): Promise<CheckoutSession> {
  return checkoutSessionSchema.parse(
    await sendIdempotent("/payments/checkout/initialize", { ticketId }, idempotencyKey),
  );
}

/** GET /payments/verify/:reference: what the payment achieved */
export async function verifyPayment(reference: string): Promise<PaymentVerification> {
  return paymentVerificationSchema.parse(
    await http({ url: `/payments/verify/${encodeURIComponent(reference)}` }),
  );
}

/* Hooks */

export function useInitializeCheckout() {
  return useMutation({ mutationKey: ["initializeCheckout"], mutationFn: initializeCheckout });
}

/**
 * Polled while the outcome is PENDING (for up to a minute) and while the network is down. Once
 * the outcome is settled the member's cached passes are read again: the hold is now a pass.
 */
export function useVerifyPayment(reference: string) {
  const queryClient = useQueryClient();
  const verification = useQuery({
    queryKey: [`/payments/verify/${reference}`],
    queryFn: () => verifyPayment(reference),
    refetchInterval: (query) => {
      const { data, dataUpdateCount, error } = query.state;
      const pending = data?.outcome === "PENDING" && dataUpdateCount < VERIFY_POLL_LIMIT;
      const offline = isApiError(error) && error.is(ErrorCode.NETWORK_ERROR);
      return pending || offline ? VERIFY_POLL_MS : false;
    },
    retry: false,
  });

  const outcome = verification.data?.outcome;
  const settled = outcome !== undefined && outcome !== "PENDING";
  useEffect(() => {
    if (!settled) return;
    void queryClient.invalidateQueries({
      predicate: (query) => matchesPrefixes(query.queryKey, ["/tickets"]),
    });
  }, [settled, queryClient]);

  return verification;
}
