import { describe, expect, it } from "vitest";

import type { TicketDetail } from "@/features/booking/api-types";

import { buildIcs, googleCalendarUrl } from "@/lib/ics";

import { passEvent } from "./pass-view";
import { ticketView } from "./ticket-state";

const MINUTE = 60_000;
const start = Date.parse("2026-11-06T18:00:00.000Z");

function ticket(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    id: "t1",
    showtimeId: "s1",
    tier: "INDIVIDUAL",
    seatIdentifier: "PASS-000007",
    purchasePrice: 5178,
    currency: "NGN",
    status: "CONFIRMED",
    movieTitle: "Ember & Ash",
    posterPortrait: "/p.jpg",
    startTime: new Date(start).toISOString(),
    endTime: new Date(start + 118 * MINUTE).toISOString(),
    qrAdmissionPayload: "demo:PASS-000007",
    createdAt: new Date(start - 3 * 24 * 60 * MINUTE).toISOString(),
    pricing: {} as TicketDetail["pricing"],
    lockExpiresAt: null,
    movieSlug: "ember-and-ash",
    posterLandscape: "/l.jpg",
    lobbyOpensAt: new Date(start - 30 * MINUTE).toISOString(),
    isSuiteHost: false,
    roomInviteCode: null,
    suiteSeats: null,
    suiteSeatsTaken: null,
    ...overrides,
  };
}

describe("ticketView", () => {
  it("walks a paid pass from confirmed to lobby, live and ended", () => {
    const pass = ticket();
    expect(ticketView(pass, start - 2 * 60 * MINUTE).phase).toBe("upcoming");
    expect(ticketView(pass, start - 10 * MINUTE)).toMatchObject({
      phase: "lobby",
      action: { label: "Enter lobby", href: "/watch/t1" },
      watchable: true,
    });
    expect(ticketView(pass, start + 5 * MINUTE).action?.label).toBe("Watch now");
    // Still watchable until 15 minutes after the end, then over
    expect(ticketView(pass, start + 130 * MINUTE).phase).toBe("live");
    expect(ticketView(pass, start + 134 * MINUTE)).toMatchObject({
      phase: "ended",
      badge: { label: "Ended" },
    });
    expect(ticketView(ticket({ status: "CHECKED_IN" }), start + 200 * MINUTE).badge.label).toBe(
      "Watched",
    );
  });

  it("sends a live hold back to checkout, and a lapsed one to book again", () => {
    const now = start - 60 * MINUTE;
    const live = ticket({
      status: "RESERVED",
      lockExpiresAt: new Date(now + 5 * MINUTE).toISOString(),
    });
    expect(ticketView(live, now).action).toEqual({
      label: "Continue booking",
      href: "/checkout/t1",
    });
    // RESERVED past its lock counts as expired, whatever the status says
    const lapsed = ticket({
      status: "RESERVED",
      lockExpiresAt: new Date(now - MINUTE).toISOString(),
    });
    expect(ticketView(lapsed, now)).toMatchObject({
      phase: "hold-expired",
      action: { label: "Book again", href: "/movies/ember-and-ash/showtimes/s1" },
    });
    // Nothing to book once the screening has started
    expect(ticketView(ticket({ status: "EXPIRED" }), start + MINUTE).action).toBeNull();
  });

  it("says what happened to a cancelled pass's money", () => {
    const refund = { amount: 5178, currency: "NGN", refundedAt: null };
    const pending = ticketView(
      ticket({ status: "CANCELLED", refund: { ...refund, state: "PENDING" } }),
      start,
    );
    expect(pending.badge.label).toBe("Cancelled");
    expect(pending.note).toBe("Refund on its way");
    expect(
      ticketView(ticket({ status: "CANCELLED", refund: { ...refund, state: "REFUNDED" } }), start)
        .note,
    ).toBe("Refunded");
    expect(ticketView(ticket({ status: "CANCELLED" }), start).note).toBeUndefined();
  });
});

describe("calendar", () => {
  const appUrl = "https://www.koncavecinema.com";

  it("writes a standard event with the times in UTC and a reminder as the lobby opens", () => {
    const ics = buildIcs(passEvent(ticket(), appUrl), new Date(start - 86_400_000).toISOString());
    expect(ics).toContain("DTSTART:20261106T180000Z");
    expect(ics).toContain("DTEND:20261106T195800Z");
    expect(ics).toContain("SUMMARY:Ember & Ash on Koncave Cinema");
    expect(ics).toContain("URL:https://www.koncavecinema.com/watch/t1");
    expect(ics).toContain("TRIGGER:-PT30M");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });

  it("escapes punctuation iCalendar reserves", () => {
    const ics = buildIcs(passEvent(ticket({ movieTitle: "Love, Again; Part 2" }), appUrl));
    expect(ics).toContain("SUMMARY:Love\\, Again\\; Part 2 on Koncave Cinema");
  });

  it("links to Google Calendar with the same times", () => {
    const url = new URL(googleCalendarUrl(passEvent(ticket(), appUrl)));
    expect(url.searchParams.get("dates")).toBe("20261106T180000Z/20261106T195800Z");
    expect(url.searchParams.get("text")).toBe("Ember & Ash on Koncave Cinema");
  });
});
