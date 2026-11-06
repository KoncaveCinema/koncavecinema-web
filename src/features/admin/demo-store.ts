import type { UserProfile, UserRole } from "@/api/auth/auth-schemas";
import type { PaymentStatus, TicketCancellation, TicketStatus } from "@/features/booking/api-types";
import { buildFixtureCatalog } from "@/features/catalog/fixture-films";
import { fixturePricing } from "@/features/catalog/fixture-pricing";
import { readDemoStore, writeDemoStore } from "@/lib/demo";
import { seededRandom } from "@/lib/random";
import type { AgeRating, FilmStatus, TicketTier } from "@/types/domain";

import type { VideoKind, VideoStatus, WatermarkMode } from "./films/api-types";
import type { RefundReason } from "./money/api-types";
import { showtimeStateAt } from "./showtimes/state";

/*
 * The admin console's demo (NEXT_PUBLIC_DATA_SOURCE=fixtures): one store standing in for the
 * API's database, kept in this browser tab. Seeded once from the fixture catalogue (its films and
 * showtimes, two drafts, past screenings, members with passes and payments split by the API's
 * settlement rule, refunds, staff and an audit trail), so every admin screen has real-looking
 * data and every figure adds up. Writes change the store and record an audit entry, as the API
 * does.
 */

const STORE_KEY = "kc-demo-admin";
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const PAID: TicketStatus[] = ["CONFIRMED", "CHECKED_IN"];

export interface DemoFilm {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: AgeRating;
  producerName: string;
  producerRevenueSplit: number;
  watermarkMode: WatermarkMode;
  nfvcbCertNumber: string | null;
  nfvcbCertUrl: string | null;
  posterLandscape: string;
  posterPortrait: string;
  trailerStreamUrl: string;
  masterVideoAssetId: string | null;
  isPublished: boolean;
  /** Set when announced as coming soon; cleared when unpublished back to draft */
  announcedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** What announcing (artwork) and publishing (everything) still need, as the API reports it */
export function filmReadiness(film: DemoFilm) {
  const certified = Boolean(film.nfvcbCertNumber);
  const masterAttached = Boolean(film.masterVideoAssetId);
  const trailer = Boolean(film.trailerStreamUrl);
  const posters = Boolean(film.posterPortrait && film.posterLandscape);
  return {
    certified,
    masterAttached,
    trailer,
    posters,
    canAnnounce: trailer && posters,
    canPublish: certified && masterAttached && trailer && posters,
  };
}

/** The API's film status: published, announced (coming soon) or draft */
export function filmStatus(film: Pick<DemoFilm, "isPublished" | "announcedAt">): FilmStatus {
  if (film.isPublished) return "PUBLISHED";
  return film.announcedAt ? "COMING_SOON" : "DRAFT";
}

export interface DemoVideo {
  id: string;
  movieId: string;
  kind: VideoKind;
  status: VideoStatus;
  playbackId: string | null;
  isDrmProtected: boolean;
  durationSeconds: number | null;
  maxResolution: string | null;
  errorMessage: string | null;
  /** While processing: when Mux finishes, and how */
  finishesAt?: number;
  fails?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DemoShowtime {
  id: string;
  movieId: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  currency: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
}

export interface DemoMember {
  id: string;
  email: string;
  publicScreenAlias: string | null;
  role: UserRole;
  isPhoneVerified: boolean;
  legalFullName: string | null;
  termsVersion: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  /** Staff invited but not yet signed in */
  invited?: boolean;
}

export interface DemoPass {
  id: string;
  userId: string;
  showtimeId: string;
  tier: TicketTier;
  seatIdentifier: string;
  status: TicketStatus;
  purchasePrice: number;
  currency: string;
  createdAt: string;
  /** A suite host's invite code */
  roomInviteCode: string | null;
  /** A suite guest's host pass */
  hostPassId: string | null;
  /** Why it was cancelled, as the API records it; null unless `status` is CANCELLED */
  cancellation: TicketCancellation | null;
}

export interface DemoPayment {
  id: string;
  ticketId: string;
  reference: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  createdAt: string;
  refundRequiredAt: string | null;
  refundRequiredReason: RefundReason | null;
  refundedAt: string | null;
  refundNote: string | null;
  /** Written when the payment settles, by the API's settlement rule */
  settlement: {
    gross: number;
    gatewayFee: number;
    vat: number;
    producer: number;
    platform: number;
  } | null;
}

export interface DemoAudit {
  id: string;
  action: string;
  timestamp: string;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AdminStore {
  films: DemoFilm[];
  videos: DemoVideo[];
  showtimes: DemoShowtime[];
  members: DemoMember[];
  passes: DemoPass[];
  payments: DemoPayment[];
  audit: DemoAudit[];
}

/* ------------------------------------------------------------------------------------------ */
/* Rules shared by the demo endpoints (the API's, in miniature)                               */
/* ------------------------------------------------------------------------------------------ */

const round2 = (value: number) => Math.round(value * 100) / 100;
const iso = (time: number) => new Date(time).toISOString();

/** The API's settlement rule: the producer's share of the base box office; the rest, less fees */
export function settle(basePrice: number, tier: TicketTier, split: number) {
  const pricing = fixturePricing(basePrice, tier);
  const producer = round2((pricing.baseAmount * split) / 100);
  return {
    amount: pricing.totalPayable,
    settlement: {
      gross: pricing.totalPayable,
      gatewayFee: pricing.processingFee,
      vat: pricing.vatAmount,
      producer,
      platform: round2(pricing.totalPayable - pricing.processingFee - pricing.vatAmount - producer),
    },
  };
}

export const showtimeState = showtimeStateAt;

export const isPaid = (pass: DemoPass) => PAID.includes(pass.status);

/** Kept revenue: settled payments that aren't owed back */
export const keptPayment = (payment: DemoPayment) =>
  payment.settlement !== null && payment.refundRequiredAt === null;

/** A processing upload finishes on its own after a few seconds, as Mux's webhook would say */
function settleVideo(video: DemoVideo, now: number): DemoVideo {
  if (video.finishesAt === undefined || now < video.finishesAt) return video;
  const { finishesAt: _done, fails, ...rest } = video;
  void _done;
  return fails
    ? { ...rest, status: "ERRORED", errorMessage: "The file could not be decoded as video." }
    : {
        ...rest,
        status: "READY",
        playbackId: `demo${video.id.replaceAll("-", "").slice(0, 20)}`,
        durationSeconds: video.kind === "TRAILER" ? 97.4 : 6840,
        maxResolution: "1080p",
      };
}

/* ------------------------------------------------------------------------------------------ */
/* Reading and writing                                                                        */
/* ------------------------------------------------------------------------------------------ */

let memory: AdminStore | null = null;

export function readStore(): AdminStore {
  const store = memory ?? readDemoStore<AdminStore | null>(STORE_KEY, null) ?? seedStore();
  const now = Date.now();
  store.videos = store.videos.map((video) => settleVideo(video, now));
  memory = store;
  return store;
}

export function writeStore(store: AdminStore) {
  memory = store;
  writeDemoStore(STORE_KEY, store);
}

/** Who is acting: the signed-in demo account, as the API's audit records the actor */
export function currentActor(): { id: string; email: string; role: UserRole } {
  const user = readDemoStore<UserProfile | null>("kc-demo-user", null);
  return {
    id: user?.id ?? "demo-user",
    email: user?.email ?? "admin@demo",
    role: user?.role ?? "SUPER_ADMIN",
  };
}

/** Records an admin action, as the API's adminAudit does */
export function recordAudit(store: AdminStore, action: string, metadata: Record<string, unknown>) {
  store.audit.unshift({
    id: crypto.randomUUID(),
    action,
    timestamp: iso(Date.now()),
    userId: currentActor().id,
    ipAddress: "102.89.34.17",
    userAgent: DEMO_BROWSER,
    metadata,
  });
}

const DEMO_BROWSER =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15";

/** A paginated slice, with the API's meta */
export function paginate<T>(items: T[], page = 1, pageSize = 20) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((current - 1) * pageSize, current * pageSize),
    meta: {
      page: current,
      pageSize,
      total: items.length,
      totalPages,
      hasNextPage: current < totalPages,
      hasPreviousPage: current > 1,
      nextPage: current < totalPages ? current + 1 : null,
      previousPage: current > 1 ? current - 1 : null,
    },
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Seeding                                                                                    */
/* ------------------------------------------------------------------------------------------ */

const FIRST_NAMES = [
  "Adaeze",
  "Tunde",
  "Chioma",
  "Emeka",
  "Zainab",
  "Ifeoma",
  "Segun",
  "Halima",
  "Obinna",
  "Funke",
  "Kelechi",
  "Amina",
  "Babajide",
  "Ngozi",
  "Yusuf",
  "Temi",
  "Chidi",
  "Bisola",
  "Musa",
  "Uche",
  "Folake",
  "Ikenna",
  "Hauwa",
  "Damilola",
  "Nnamdi",
  "Kemi",
  "Abubakar",
  "Ronke",
  "Ebuka",
  "Sade",
  "Gbenga",
  "Ada",
  "Ibrahim",
  "Yemisi",
  "Chuka",
  "Lola",
  "Aliyu",
  "Nkechi",
  "Wale",
  "Efe",
];
const LAST_NAMES = [
  "Okafor",
  "Adeyemi",
  "Bello",
  "Eze",
  "Musa",
  "Okonkwo",
  "Balogun",
  "Ibrahim",
  "Nwosu",
  "Adebayo",
];
const ALIAS_ENDINGS = ["Watches", "Cinema", "_Lagos", "Reels", "OnScreen", "Abuja", "Films", ""];
const BROWSERS = [
  DEMO_BROWSER,
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 15; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
];

/** The two drafts: one short of its certificate, one only just started */
const DRAFTS = [
  {
    id: "demo-draft-1",
    title: "The Tailor of Onitsha",
    slug: "the-tailor-of-onitsha",
    synopsis:
      "A master tailor with failing eyesight has one season to train the apprentice who " +
      "keeps sewing the wrong measurements, before the biggest wedding Onitsha has seen.",
    durationMinutes: 104,
    ageRating: "PG" as AgeRating,
    producerName: "Niger Bridge Films",
    posters: "/placeholder/film-ember-and-ash.jpg",
    complete: true,
  },
  {
    id: "demo-draft-2",
    title: "Rain Season in Calabar",
    slug: "rain-season-in-calabar",
    synopsis:
      "Three sisters return to their late mother's house in Calabar and find the roof, the " +
      "family and the secrets all leaking at once.",
    durationMinutes: 112,
    ageRating: "TWELVE_PLUS" as AgeRating,
    producerName: "Cross River Stories",
    posters: "",
    complete: false,
  },
];

function seedStore(): AdminStore {
  const random = seededRandom(20261104);
  const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)]!;
  const now = Date.now();
  const hour = Math.floor(now / HOUR) * HOUR;
  const store: AdminStore = {
    films: [],
    videos: [],
    showtimes: [],
    members: [],
    passes: [],
    payments: [],
    audit: [],
  };

  /* Staff: the client (super admin), two staff and one still invited */
  const staff: [string, UserRole, number, boolean?][] = [
    ["amaka.okafor@koncavecinema.com", "SUPER_ADMIN", 210],
    ["tunde.bello@koncavecinema.com", "ADMIN", 160],
    ["zainab.musa@koncavecinema.com", "ADMIN", 75],
    ["kelechi.eze@koncavecinema.com", "ADMIN", 2, true],
  ];
  for (const [email, role, age, invited] of staff) {
    store.members.push({
      id: crypto.randomUUID(),
      email,
      publicScreenAlias: null,
      role,
      isPhoneVerified: false,
      legalFullName: null,
      termsVersion: invited ? null : "2026-09-01",
      createdAt: iso(now - age * DAY),
      lastSignInAt: invited ? null : iso(now - Math.floor(random() * 30) * HOUR),
      invited,
    });
  }

  /* Forty members, some verified for the Public Hall, one producer partner */
  for (let index = 0; index < 40; index++) {
    const first = FIRST_NAMES[index]!;
    const last = pick(LAST_NAMES);
    const verified = random() < 0.6;
    store.members.push({
      id: crypto.randomUUID(),
      email: `${first.toLowerCase()}.${last.toLowerCase()}${index % 3 ? "" : index}@example.com`,
      publicScreenAlias: verified ? `${first}${pick(ALIAS_ENDINGS)}` : null,
      role: index === 7 ? "PRODUCER" : "VIEWER",
      isPhoneVerified: verified,
      legalFullName: verified
        ? `${first} ${pick(["Chiamaka", "Oluwaseun", "Aisha", "Ifeanyi", "Bolanle"])} ${last}`
        : null,
      termsVersion: "2026-09-01",
      createdAt: iso(now - (5 + Math.floor(random() * 120)) * DAY),
      lastSignInAt: iso(now - Math.floor(random() * 20 * 24) * HOUR),
    });
  }
  const viewers = store.members.filter((member) => member.role === "VIEWER");

  /* Films: the fixture catalogue with its uploads. Published films have a master and (most) a
     trailer; announced ones a trailer and posters only */
  const catalog = buildFixtureCatalog(now);
  const addVideo = (
    movieId: string,
    kind: VideoKind,
    createdAt: number,
    extra: Partial<DemoVideo> = {},
  ) => {
    const video: DemoVideo = {
      id: crypto.randomUUID(),
      movieId,
      kind,
      status: "READY",
      playbackId: `demo${Math.floor(random() * 1e12).toString(36)}`,
      isDrmProtected: false,
      durationSeconds: kind === "TRAILER" ? 97.4 : null,
      maxResolution: "1080p",
      errorMessage: null,
      createdAt: iso(createdAt),
      updatedAt: iso(createdAt + 40 * MINUTE),
      ...extra,
    };
    store.videos.push(video);
    return video;
  };

  catalog.forEach((film, index) => {
    const created = now - (40 + index * 6) * DAY;
    const published = film.status === "PUBLISHED";
    const master = published
      ? addVideo(film.id, "MASTER", created + DAY, { durationSeconds: film.durationMinutes * 60 })
      : null;
    const trailer = film.trailerUrl ? addVideo(film.id, "TRAILER", created + 2 * DAY) : null;
    store.films.push({
      id: film.id,
      title: film.title,
      slug: film.slug,
      synopsis: film.synopsis,
      durationMinutes: film.durationMinutes,
      ageRating: film.ageRating,
      producerName: film.producerName,
      producerRevenueSplit: 85,
      watermarkMode: index % 4 === 0 ? "STRONG" : "SUBTLE",
      nfvcbCertNumber: film.nfvcbCertNumber,
      nfvcbCertUrl: film.nfvcbCertNumber ? `https://compliance.example.com/${film.slug}.pdf` : null,
      posterLandscape: film.posterLandscape,
      posterPortrait: film.posterPortrait,
      trailerStreamUrl: trailer ? (film.trailerUrl ?? "") : "",
      masterVideoAssetId: master?.id ?? null,
      isPublished: published,
      announcedAt: film.announcedAt,
      createdAt: iso(created),
      updatedAt: iso(created + 3 * DAY),
    });

    // The catalogue's showtimes, as scheduled
    for (const showtime of film.showtimes) {
      store.showtimes.push({
        id: showtime.id,
        movieId: film.id,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        basePrice: showtime.basePrice,
        currency: showtime.currency,
        cancelledAt: null,
        cancellationReason: null,
      });
    }
    // And the screenings it has already had, at 8 pm Lagos time (an announced film has none)
    const past = published ? 1 + (index % 3) : 0;
    for (let screening = 0; screening < past; screening++) {
      const daysAgo = 1 + screening * 9 + index;
      const start = Math.floor((now - daysAgo * DAY) / DAY) * DAY + 19 * HOUR;
      store.showtimes.push({
        id: `demo-past-${film.slug}-${screening + 1}`,
        movieId: film.id,
        startTime: iso(start),
        endTime: iso(start + film.durationMinutes * MINUTE),
        basePrice: film.showtimes[0]?.basePrice ?? 4000,
        currency: "NGN",
        cancelledAt: null,
        cancellationReason: null,
      });
    }
  });

  /* The drafts */
  for (const draft of DRAFTS) {
    const created = now - (draft.complete ? 9 : 1) * DAY;
    const master = draft.complete
      ? addVideo(draft.id, "MASTER", created + HOUR, {
          durationSeconds: draft.durationMinutes * 60,
        })
      : null;
    const trailer = draft.complete ? addVideo(draft.id, "TRAILER", created + 2 * HOUR) : null;
    if (!draft.complete) {
      addVideo(draft.id, "MASTER", now - 20 * HOUR, {
        status: "ERRORED",
        playbackId: null,
        maxResolution: null,
        errorMessage: "The file could not be decoded as video.",
      });
      // Still processing at Mux: it finishes a few minutes into the review
      addVideo(draft.id, "MASTER", now - 10 * MINUTE, {
        status: "PROCESSING",
        playbackId: null,
        maxResolution: null,
        finishesAt: now + 4 * MINUTE,
      });
    }
    store.films.push({
      id: draft.id,
      title: draft.title,
      slug: draft.slug,
      synopsis: draft.synopsis,
      durationMinutes: draft.durationMinutes,
      ageRating: draft.ageRating,
      producerName: draft.producerName,
      producerRevenueSplit: 80,
      watermarkMode: "SUBTLE",
      nfvcbCertNumber: null,
      nfvcbCertUrl: null,
      posterLandscape: draft.posters,
      posterPortrait: draft.posters,
      trailerStreamUrl: trailer ? `https://stream.mux.com/${trailer.playbackId}.m3u8` : "",
      masterVideoAssetId: master?.id ?? null,
      isPublished: false,
      announcedAt: null,
      createdAt: iso(created),
      updatedAt: iso(created + 3 * HOUR),
    });
  }

  /* One screening cancelled two days ago, so the refunds queue has its passes */
  const amina = store.films.find((film) => film.slug === "house-of-amina")!;
  const cancelledStart = hour + 3 * DAY + 2 * HOUR;
  store.showtimes.push({
    id: "demo-cancelled-house-of-amina",
    movieId: amina.id,
    startTime: iso(cancelledStart),
    endTime: iso(cancelledStart + amina.durationMinutes * MINUTE),
    basePrice: 4500,
    currency: "NGN",
    cancelledAt: iso(now - 2 * DAY),
    cancellationReason: "The producer has moved the premiere to a later date.",
  });

  /* Passes and payments for every screening */
  let passNumber = 1000;
  let referenceNumber = 0;
  const tierBag: TicketTier[] = [
    "INDIVIDUAL",
    "INDIVIDUAL",
    "PUBLIC",
    "PUBLIC",
    "PUBLIC",
    "PRIVATE_5",
    "PRIVATE_10",
  ];
  const filmOf = new Map(store.films.map((film) => [film.id, film]));

  const addPass = (seed: {
    showtime: DemoShowtime;
    member: DemoMember;
    tier: TicketTier;
    status: TicketStatus;
    boughtAt: number;
    payment?: PaymentStatus;
    hostPassId?: string;
  }) => {
    const film = filmOf.get(seed.showtime.movieId)!;
    const guest = Boolean(seed.hostPassId);
    const { amount, settlement } = settle(
      seed.showtime.basePrice,
      seed.tier,
      film.producerRevenueSplit,
    );
    const pass: DemoPass = {
      id: crypto.randomUUID(),
      userId: seed.member.id,
      showtimeId: seed.showtime.id,
      tier: seed.tier,
      seatIdentifier: `KNV-${String(++passNumber).padStart(6, "0")}`,
      status: seed.status,
      purchasePrice: guest ? 0 : amount,
      currency: seed.showtime.currency,
      createdAt: iso(seed.boughtAt),
      roomInviteCode:
        !guest && seed.tier.startsWith("PRIVATE")
          ? Math.floor(random() * 36 ** 6)
              .toString(36)
              .toUpperCase()
              .padStart(6, "0")
          : null,
      hostPassId: seed.hostPassId ?? null,
      // A cancelled screening's passes carry its reason and the staff message
      cancellation:
        seed.status === "CANCELLED" && seed.showtime.cancelledAt
          ? {
              reason: "SHOWTIME_CANCELLED",
              message: seed.showtime.cancellationReason,
              cancelledAt: seed.showtime.cancelledAt,
            }
          : null,
    };
    store.passes.push(pass);
    if (seed.payment && !guest) {
      store.payments.push({
        id: crypto.randomUUID(),
        ticketId: pass.id,
        reference: `KNV-${pass.id.slice(0, 8).toUpperCase()}-${1762000000 + ++referenceNumber * 7919}`,
        status: seed.payment,
        amount,
        currency: seed.showtime.currency,
        createdAt: iso(seed.boughtAt + 2 * MINUTE),
        refundRequiredAt: null,
        refundRequiredReason: null,
        refundedAt: null,
        refundNote: null,
        settlement: seed.payment === "SUCCESS" ? settlement : null,
      });
    }
    return pass;
  };

  for (const showtime of store.showtimes) {
    const state = showtimeState(showtime, now);
    const start = Date.parse(showtime.startTime);
    const count = state === "PAST" ? 4 + Math.floor(random() * 6) : 2 + Math.floor(random() * 5);
    for (let index = 0; index < count; index++) {
      const tier = pick(tierBag);
      const member = pick(viewers);
      const boughtAt = Math.min(
        // A cancelled screening's passes were all bought before it was cancelled
        showtime.cancelledAt ? Date.parse(showtime.cancelledAt) - 3 * HOUR : now - HOUR,
        start - (1 + Math.floor(random() * 6)) * DAY + Math.floor(random() * 20) * HOUR,
      );
      const status: TicketStatus =
        state === "CANCELLED"
          ? "CANCELLED"
          : state === "UPCOMING"
            ? "CONFIRMED"
            : random() < 0.85
              ? "CHECKED_IN"
              : "CONFIRMED";
      const host = addPass({ showtime, member, tier, status, boughtAt, payment: "SUCCESS" });
      // Suite hosts bring a guest or two, seated free from the invite
      if (host.roomInviteCode) {
        for (let guest = 0; guest < 1 + Math.floor(random() * 3); guest++) {
          addPass({
            showtime,
            member: pick(viewers),
            tier,
            status,
            boughtAt: boughtAt + (guest + 1) * HOUR,
            hostPassId: host.id,
          });
        }
      }
    }
    // An unpaid hold on the next screenings, and an abandoned checkout on a past one
    if (state === "UPCOMING" && random() < 0.5) {
      addPass({
        showtime,
        member: pick(viewers),
        tier: "INDIVIDUAL",
        status: "RESERVED",
        boughtAt: now - 3 * MINUTE,
        payment: "PENDING",
      });
    }
    if (state === "PAST" && random() < 0.3) {
      // The hold ran out unpaid: the API cancels it as HOLD_EXPIRED (it never sets EXPIRED)
      const abandoned = addPass({
        showtime,
        member: pick(viewers),
        tier: "PUBLIC",
        status: "CANCELLED",
        boughtAt: start - 2 * DAY,
        payment: "FAILED",
      });
      abandoned.cancellation = {
        reason: "HOLD_EXPIRED",
        message: null,
        cancelledAt: iso(start - 2 * DAY + 10 * MINUTE),
      };
    }
  }

  /* Refunds: the cancelled screening's payments are owed back; two more were settled earlier */
  // Owed back at `at`, but never before the payment itself arrived
  const owe = (payment: DemoPayment, reason: RefundReason, at: number) => {
    payment.refundRequiredAt = iso(Math.max(at, Date.parse(payment.createdAt) + 10 * MINUTE));
    payment.refundRequiredReason = reason;
  };
  const paymentOf = (pass: DemoPass) =>
    store.payments.find((payment) => payment.ticketId === pass.id);
  for (const pass of store.passes.filter((p) => p.showtimeId === "demo-cancelled-house-of-amina")) {
    const payment = paymentOf(pass);
    if (payment) owe(payment, "SHOWTIME_CANCELLED", now - 2 * DAY);
  }
  const upcomingPaid = store.passes.filter((pass) => {
    const showtime = store.showtimes.find((item) => item.id === pass.showtimeId)!;
    return (
      showtimeState(showtime, now) === "UPCOMING" &&
      pass.status === "CONFIRMED" &&
      pass.tier === "INDIVIDUAL" &&
      paymentOf(pass)
    );
  });
  const supportCancelled = upcomingPaid[0];
  if (supportCancelled) {
    supportCancelled.status = "CANCELLED";
    supportCancelled.cancellation = {
      reason: "CANCELLED_BY_SUPPORT",
      message: "Booked the wrong night, cancelled at the member's request.",
      cancelledAt: iso(now - 20 * HOUR),
    };
    owe(paymentOf(supportCancelled)!, "CANCELLED_BY_SUPPORT", now - 20 * HOUR);
  }
  const refundedPasses = store.passes
    .filter((pass) => pass.status === "CHECKED_IN" && paymentOf(pass))
    .slice(0, 2);
  refundedPasses.forEach((pass, index) => {
    const payment = paymentOf(pass)!;
    owe(
      payment,
      index === 0 ? "DUPLICATE_PAYMENT_FOR_CONFIRMED_PASS" : "AMOUNT_MISMATCH",
      now - (8 + index * 5) * DAY,
    );
    payment.status = "REFUNDED";
    payment.refundedAt = iso(
      Math.min(now - HOUR, Date.parse(payment.refundRequiredAt!) + (1 + index) * DAY),
    );
    payment.refundNote = `Refunded in the Paystack dashboard, refund ID ${4815162 + index * 342}.`;
  });

  /* The audit trail: sign-ins, payments and the team's work */
  const superAdmin = store.members[0]!;
  const addAudit = (
    action: string,
    at: number,
    userId: string | null,
    metadata: Record<string, unknown> | null,
  ) =>
    store.audit.push({
      id: crypto.randomUUID(),
      action,
      timestamp: iso(at),
      userId,
      ipAddress: `102.89.${Math.floor(random() * 250)}.${Math.floor(random() * 250)}`,
      userAgent: pick(BROWSERS),
      metadata,
    });
  for (let index = 0; index < 70; index++) {
    const member = pick(store.members.filter((m) => !m.invited));
    const failed = random() < 0.12;
    addAudit(
      failed ? "USER_LOGIN_FAILED" : "USER_LOGIN_SUCCESS",
      now - random() * 20 * DAY,
      member.id,
      failed ? { reason: "INVALID_CREDENTIALS" } : null,
    );
  }
  for (const payment of store.payments.filter((p) => p.status !== "PENDING").slice(0, 30)) {
    const pass = store.passes.find((p) => p.id === payment.ticketId)!;
    addAudit(
      payment.status === "FAILED" ? "PAYMENT_FAILED" : "PAYMENT_SUCCESS",
      Date.parse(payment.createdAt),
      pass.userId,
      { reference: payment.reference, amount: payment.amount },
    );
  }
  for (const film of store.films.filter((f) => f.isPublished)) {
    addAudit("ADMIN_POSTER_UPLOADED", Date.parse(film.createdAt) + DAY, superAdmin.id, {
      movieId: film.id,
      kind: "POSTER_LANDSCAPE",
    });
  }
  addAudit("ADMIN_SHOWTIME_CANCELLED", now - 2 * DAY, superAdmin.id, {
    showtimeId: "demo-cancelled-house-of-amina",
    reason: "The producer has moved the premiere to a later date.",
  });
  addAudit("ADMIN_STAFF_INVITED", now - 2 * DAY, superAdmin.id, {
    staffUserId: store.members[3]!.id,
    role: "ADMIN",
    existingAccount: false,
  });
  for (const pass of refundedPasses) {
    addAudit("ADMIN_REFUND_RECORDED", Date.parse(paymentOf(pass)!.refundedAt!), superAdmin.id, {
      paymentId: paymentOf(pass)!.id,
    });
  }
  store.audit.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  writeStore(store);
  return store;
}
