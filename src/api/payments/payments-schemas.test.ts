import { describe, expect, it } from "vitest";

import { checkoutSessionSchema, paymentVerificationSchema } from "./payments-schemas";

// Shapes from openapi.json on dev (2791071), envelope removed
const verification = {
  reference: "KC-7G2K9Q4M1X",
  status: "SUCCESS",
  ticketId: "5e8f0c1a-3b7d-4c2e-9f60-1a2b3c4d5e6f",
  amountPaid: 19750,
  currency: "NGN",
  outcome: "CONFIRMED",
  ticketStatus: "CONFIRMED",
};

describe("payments schemas", () => {
  it("accept a checkout session", () => {
    const session = {
      authorizationUrl: "https://checkout.paystack.com/0peioxfhpn",
      accessCode: "0peioxfhpn",
      reference: "KC-7G2K9Q4M1X",
      ticketId: verification.ticketId,
      amount: 19750,
      currency: "NGN",
    };
    expect(checkoutSessionSchema.parse(session).authorizationUrl).toContain("paystack.com");
  });

  it("accept every outcome, with or without the ticket's status", () => {
    const outcomes = ["CONFIRMED", "PENDING", "FAILED", "REFUND_PENDING", "REFUNDED"];
    for (const outcome of outcomes) {
      expect(paymentVerificationSchema.parse({ ...verification, outcome }).outcome).toBe(outcome);
    }
    const { ticketStatus: _absent, ...withoutStatus } = verification;
    expect(paymentVerificationSchema.safeParse(withoutStatus).success).toBe(true);
  });

  it("refuse an outcome the confirmation page doesn't know", () => {
    expect(paymentVerificationSchema.safeParse({ ...verification, outcome: "OK" }).success).toBe(
      false,
    );
  });
});
