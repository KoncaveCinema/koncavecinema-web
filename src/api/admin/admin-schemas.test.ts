import { describe, expect, it } from "vitest";

import { featuredPlacementsSchema } from "./featured-schemas";
import { adminFilmPageSchema, adminFilmSchema } from "./films-schemas";
import { adminMemberSchema } from "./members-schemas";
import { adminOverviewSchema, adminPaymentPageSchema } from "./money-schemas";
import { adminShowtimePageSchema } from "./showtimes-schemas";
import { auditEntriesPageSchema, staffMemberSchema } from "./staff-schemas";

const meta = {
  page: 1,
  pageSize: 20,
  total: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
};
const at = "2026-11-14T18:47:01.761Z";

describe("admin schemas", () => {
  it("accept staging's film list, drafts without a poster or master included", () => {
    // From staging, 14 Nov (envelope removed)
    const items = [
      {
        id: "e1849182-ed6a-4c35-a7d1-fce6802f1766",
        title: "Rain Season in Calabar",
        slug: "rain-season-in-calabar",
        producerName: "Cross River Stories",
        status: "DRAFT",
        posterPortrait: null,
        certified: false,
        master: null,
        trailer: "NONE",
        nextShowtimeAt: null,
        ticketsSold: 0,
        createdAt: "2026-09-21T18:47:01.761Z",
      },
      {
        id: "c6f6e42a-6daa-49b1-8b35-7abdaf065566",
        title: "House of Amina",
        slug: "house-of-amina",
        producerName: "Sahara Lane Pictures",
        status: "PUBLISHED",
        posterPortrait: "https://res.cloudinary.com/x/image/upload/seed/poster-house-of-amina",
        certified: true,
        master: { status: "READY", drmProtected: false },
        trailer: "ATTACHED",
        nextShowtimeAt: at,
        ticketsSold: 1,
        createdAt: "2026-09-21T18:47:01.761Z",
      },
    ];
    const page = adminFilmPageSchema.parse({ items, meta: { ...meta, total: 2 } });
    expect(page.items.map((film) => film.status)).toEqual(["DRAFT", "PUBLISHED"]);
  });

  it("accept a film page, reading the producer's share as a number either way", () => {
    const film = {
      id: "f1",
      title: "Ember & Ash",
      slug: "ember-and-ash",
      synopsis: "A fashion buyer follows her brother's trail.",
      durationMinutes: 118,
      ageRating: "EIGHTEEN_PLUS",
      producerName: "Harmattan Pictures",
      producerRevenueSplit: "85.00",
      masterVideoAssetId: "v1",
      watermarkMode: "STRONG",
      trailerStreamUrl: "https://stream.mux.com/t.m3u8",
      posterLandscape: "https://res.cloudinary.com/x/l.jpg",
      posterPortrait: "https://res.cloudinary.com/x/p.jpg",
      nfvcbCertNumber: "NFVCB/SAMPLE/2026/0101",
      nfvcbCertUrl: "https://compliance.example.com/ember.pdf",
      isPublished: false,
      announcedAt: at,
      createdAt: at,
      updatedAt: at,
      status: "COMING_SOON",
      readiness: {
        certified: true,
        masterAttached: true,
        trailer: true,
        posters: true,
        canAnnounce: true,
        canPublish: true,
      },
      producerSplitLocked: true,
      videos: [
        {
          id: "v1",
          kind: "MASTER",
          status: "READY",
          isDrmProtected: false,
          durationSeconds: 7080,
          maxResolution: "1080p",
          errorMessage: null,
          isAttached: true,
          createdAt: at,
        },
      ],
      showtimes: [
        {
          id: "s1",
          startTime: at,
          endTime: at,
          basePrice: 5000,
          currency: "NGN",
          cancelledAt: null,
          ticketsSold: 3,
          state: "UPCOMING",
        },
      ],
      revenue: { gross: 40913.72, gatewayFees: 913.72, producerShare: 29750, platformShare: 10250 },
    };
    expect(adminFilmSchema.parse(film).producerRevenueSplit).toBe(85);
    expect(adminFilmSchema.parse({ ...film, producerRevenueSplit: 85 }).producerRevenueSplit).toBe(
      85,
    );
  });

  it("accept staging's overview", () => {
    const overview = {
      screeningsToday: 1,
      screeningsThisWeek: 6,
      sales: {
        today: { passesSold: 0, gross: 0, platformShare: 0, producerShare: 0 },
        last7Days: { passesSold: 2, gross: 35736.05, platformShare: 9500, producerShare: 25500 },
        last30Days: { passesSold: 7, gross: 92588.87, platformShare: 22925, producerShare: 67575 },
      },
      refundsWaiting: { count: 2, amount: 10355.34 },
      videosProcessing: 0,
      filmsNeedingAttention: [
        {
          id: "e1849182-ed6a-4c35-a7d1-fce6802f1766",
          title: "Rain Season in Calabar",
          missing: ["certificate", "master video", "trailer", "posters"],
        },
      ],
    };
    expect(adminOverviewSchema.parse(overview).refundsWaiting.count).toBe(2);
  });

  it("accept a showtime row, owed and failed refunds, a member and a staff account", () => {
    adminShowtimePageSchema.parse({
      items: [
        {
          id: "s1",
          movie: { id: "f1", title: "Sade", slug: "sade", posterPortrait: "https://x/p.jpg" },
          startTime: at,
          endTime: at,
          basePrice: 5000,
          currency: "NGN",
          state: "CANCELLED",
          cancelledAt: at,
          cancellationReason: "The producer withdrew the film.",
          ticketsSold: 0,
          activeHolds: 0,
        },
      ],
      meta,
    });
    const owed = {
      id: "p1",
      reference: "KNV-4E099A5C-1793904609359",
      status: "SUCCESS",
      amount: 5177.67,
      currency: "NGN",
      createdAt: at,
      refund: {
        reason: "DUPLICATE_PAYMENT_FOR_CONFIRMED_PASS",
        state: "PENDING",
        requiredAt: at,
        sentAt: null,
        refundedAt: null,
        failedAt: null,
        failureReason: null,
        note: null,
      },
      settlement: null,
      member: { id: "u1", email: "member@koncavecinema.com" },
      ticket: {
        id: "t1",
        tier: "INDIVIDUAL",
        seatIdentifier: "PASS-000007",
        status: "CONFIRMED",
      },
      showtime: { id: "s1", startTime: at, movie: { id: "f1", title: "House of Amina" } },
    };
    // Owed again after Paystack refused an attempt, with its reason
    const failed = {
      ...owed,
      refund: { ...owed.refund, sentAt: at, failedAt: at, failureReason: "Insufficient balance" },
    };
    const page = adminPaymentPageSchema.parse({ items: [owed, failed], meta });
    expect(page.items[1]?.refund?.failureReason).toBe("Insufficient balance");
    const member = adminMemberSchema.parse({
      id: "u1",
      email: "member@koncavecinema.com",
      publicScreenAlias: "Ada_Watches",
      role: "VIEWER",
      isPhoneVerified: true,
      termsVersion: "2026-10-28",
      createdAt: at,
      lastSignInAt: null,
      passes: [
        {
          id: "t1",
          tier: "INDIVIDUAL",
          seatIdentifier: "PASS-000001",
          status: "CANCELLED",
          purchasePrice: 5177.67,
          currency: "NGN",
          movie: { title: "Ember & Ash", slug: "ember-and-ash" },
          startTime: at,
          endTime: at,
          cancellable: false,
          createdAt: at,
          payments: [
            {
              id: "p1",
              reference: "KNV-7D606088-1794389459681",
              status: "SUCCESS",
              amount: 5177.67,
              currency: "NGN",
              refundReason: "SHOWTIME_CANCELLED",
              refundState: "IN_PROGRESS",
              refundedAt: null,
              createdAt: at,
            },
          ],
        },
      ],
      recentSignIns: [
        { action: "USER_LOGIN_SUCCESS", ipAddress: "100.64.0.12", userAgent: null, timestamp: at },
      ],
    });
    expect(member.passes[0]?.payments[0]?.refundState).toBe("IN_PROGRESS");
    expect(
      staffMemberSchema.parse({
        id: "a1",
        email: "admin@koncavecinema.com",
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        lastSignInAt: at,
        createdAt: at,
      }).role,
    ).toBe("SUPER_ADMIN");
  });

  it("accept an audit page and the featured placements", () => {
    const audit = auditEntriesPageSchema.parse({
      items: [
        {
          id: "l1",
          action: "TOKEN_REFRESHED",
          timestamp: at,
          userId: "a1",
          user: { email: "admin@koncavecinema.com", role: "SUPER_ADMIN" },
          ipAddress: "100.64.0.21",
          userAgent: "Mozilla/5.0",
          metadata: null,
        },
      ],
      nextCursor: null,
    });
    expect(audit.items).toHaveLength(1);

    const featured = featuredPlacementsSchema.parse([
      {
        id: "fp1",
        position: 1,
        kind: "DATED",
        startsAt: at,
        endsAt: "2026-11-21T23:00:00.000Z",
        live: false,
        hiddenReason: "NO_OPEN_SCREENING",
        film: {
          id: "f1",
          title: "Sade",
          slug: "sade",
          status: "PUBLISHED",
          posterLandscape: "https://x/l.jpg",
          posterPortrait: "https://x/p.jpg",
          openScreenings: 0,
        },
        createdAt: at,
      },
    ]);
    expect(featured[0]?.hiddenReason).toBe("NO_OPEN_SCREENING");
  });
});
