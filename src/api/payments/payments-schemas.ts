import { z } from "zod";

/*
 * The payment replies the web app reads, checked against koncavecinema-api's openapi.json (dev,
 * 2791071): only the fields the screens use.
 */

export const paymentStatusSchema = z.enum(["PENDING", "SUCCESS", "FAILED", "REFUNDED"]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

/** POST /payments/checkout/initialize: where to send the buyer to pay */
export const checkoutSessionSchema = z.object({
  authorizationUrl: z.url(),
  reference: z.string(),
  ticketId: z.string(),
});
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>;

/**
 * GET /payments/verify/:reference. Pages follow `outcome`. REFUND_PENDING: money arrived but no
 * pass was confirmed (a duplicate payment, or a lapsed hold since replaced); the buyer is emailed
 * that a refund is coming.
 */
export const paymentVerificationSchema = z.object({
  reference: z.string(),
  amountPaid: z.number(),
  currency: z.string(),
  outcome: z.enum(["CONFIRMED", "PENDING", "FAILED", "REFUND_PENDING", "REFUNDED"]),
});
export type PaymentVerification = z.infer<typeof paymentVerificationSchema>;
