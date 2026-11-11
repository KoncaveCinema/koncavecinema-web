import { describe, expect, it } from "vitest";

import { pageSchema } from "../page-schema";
import {
  heldTicketSchema,
  invitePreviewSchema,
  reservationReceiptSchema,
  suiteGuestSchema,
  ticketDetailSchema,
} from "./tickets-schemas";

// Shapes from openapi.json on dev (2791071), envelope removed
const pricing = {
  currency: "NGN",
  basePrice: 3000,
  seatCount: 5,
  baseAmount: 15000,
  infrastructureMarkup: 3000,
  subtotal: 18000,
  vatPercent: 7.5,
  vatAmount: 1350,
  processingFee: 400,
  totalPayable: 19750,
};

const hold = {
  id: "5e8f0c1a-3b7d-4c2e-9f60-1a2b3c4d5e6f",
  showtimeId: "c9bf9e57-1685-4c89-bafb-ff5af830be8a",
  tier: "PRIVATE_5",
  seatIdentifier: "PASS-000042",
  purchasePrice: 19750,
  currency: "NGN",
  status: "RESERVED",
  movieTitle: "Ember & Ash",
  movieSlug: "ember-and-ash",
  posterPortrait: "https://res.cloudinary.com/koncave/portrait.jpg",
  posterLandscape: "https://res.cloudinary.com/koncave/landscape.jpg",
  startTime: "2026-12-04T18:00:00.000Z",
  endTime: "2026-12-04T19:52:00.000Z",
  qrAdmissionPayload: "kc1.eyJ0Ijoi",
  createdAt: "2026-11-10T09:00:00.000Z",
  lobbyOpensAt: "2026-12-04T17:30:00.000Z",
  accessEndsAt: "2026-12-04T20:07:00.000Z",
  pricing,
  lockExpiresAt: "2026-11-10T09:10:00.000Z",
  isSuiteHost: true,
  roomInviteCode: "VIP-3F9A0C71BE",
  suiteSeats: 5,
  suiteSeatsTaken: 1,
  cancellation: null,
  refund: null,
};

describe("tickets schemas", () => {
  it("accept a hold's receipt", () => {
    const receipt = {
      ticketId: hold.id,
      showtimeId: hold.showtimeId,
      tier: "PRIVATE_5",
      seatIdentifier: "PASS-000042",
      status: "RESERVED",
      expiresInSeconds: 600,
      lockExpiresAt: "2026-11-10T09:10:00.000Z",
      pricing,
      roomInviteCode: "VIP-3F9A0C71BE",
    };
    expect(reservationReceiptSchema.parse(receipt).ticketId).toBe(hold.id);
  });

  it("accept a suite host's hold, a guest's free pass and a cancelled pass with its refund", () => {
    const guest = {
      ...hold,
      status: "CONFIRMED",
      purchasePrice: 0,
      pricing: { ...pricing, basePrice: 0, baseAmount: 0, subtotal: 0, totalPayable: 0 },
      lockExpiresAt: null,
      isSuiteHost: false,
      roomInviteCode: null,
      suiteSeats: null,
      suiteSeatsTaken: null,
    };
    const cancelled = {
      ...hold,
      status: "CANCELLED",
      lockExpiresAt: null,
      cancellation: {
        reason: "SHOWTIME_CANCELLED",
        message: "The producer withdrew the film.",
        cancelledAt: "2026-11-20T10:15:00.000Z",
      },
      refund: { state: "PENDING", amount: 19750, currency: "NGN", refundedAt: null },
    };
    const page = pageSchema(ticketDetailSchema).parse({
      items: [hold, guest, cancelled],
      meta: {
        page: 1,
        pageSize: 20,
        total: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPage: null,
        previousPage: null,
      },
    });
    expect(page.items.map((ticket) => ticket.status)).toEqual([
      "RESERVED",
      "CONFIRMED",
      "CANCELLED",
    ]);
    expect(page.items[2]?.cancellation?.reason).toBe("SHOWTIME_CANCELLED");
  });

  it("read the existing hold from a RESERVATION_ALREADY_HELD error", () => {
    expect(heldTicketSchema.parse({ ticketId: hold.id, status: "CONFIRMED" }).status).toBe(
      "CONFIRMED",
    );
    expect(heldTicketSchema.safeParse({}).success).toBe(false);
  });

  it("accept an invite preview and a suite's guests", () => {
    const preview = {
      movieTitle: "Ember & Ash",
      movieSlug: "ember-and-ash",
      posterLandscape: hold.posterLandscape,
      startTime: hold.startTime,
      endTime: hold.endTime,
      hostAlias: "Your host",
      seatsLeft: 4,
      isActive: true,
    };
    expect(invitePreviewSchema.parse(preview).seatsLeft).toBe(4);
    const guest = {
      publicScreenAlias: null,
      seatIdentifier: "PASS-000043",
      joinedAt: hold.createdAt,
    };
    expect(suiteGuestSchema.parse(guest).publicScreenAlias).toBeNull();
  });

  it("refuse a ticket the pages couldn't render", () => {
    expect(ticketDetailSchema.safeParse({ ...hold, status: "PAID" }).success).toBe(false);
    const { pricing: _missing, ...unpriced } = hold;
    expect(ticketDetailSchema.safeParse(unpriced).success).toBe(false);
  });
});
