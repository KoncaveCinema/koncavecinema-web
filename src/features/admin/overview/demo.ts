import { demoDelay } from "@/lib/demo";
import { dayKey } from "@/lib/format";

import { keptPayment, readStore, type DemoPayment } from "../demo-store";
import type { AdminOverview, AdminSalesWindow } from "./api-types";

/* The admin overview demo (NEXT_PUBLIC_DATA_SOURCE=fixtures), counted from the admin demo store
   exactly as the API counts its database. */

const DAY = 24 * 60 * 60_000;
const round2 = (value: number) => Math.round(value * 100) / 100;

export async function getOverview(): Promise<AdminOverview> {
  await demoDelay();
  const store = readStore();
  const now = Date.now();
  const live = store.showtimes.filter((showtime) => !showtime.cancelledAt);
  const starts = live.map((showtime) => Date.parse(showtime.startTime));

  const windowOf = (days: number): AdminSalesWindow => {
    const kept = store.payments.filter(
      (payment) => keptPayment(payment) && Date.parse(payment.createdAt) >= now - days * DAY,
    );
    const sum = (pick: (settlement: NonNullable<DemoPayment["settlement"]>) => number) =>
      round2(kept.reduce((total, payment) => total + pick(payment.settlement!), 0));
    return {
      passesSold: kept.length,
      gross: sum((settlement) => settlement.gross),
      platformShare: sum((settlement) => settlement.platform),
      producerShare: sum((settlement) => settlement.producer),
    };
  };

  const owed = store.payments.filter((payment) => payment.refundRequiredAt && !payment.refundedAt);

  return {
    screeningsToday: starts.filter((start) => dayKey(start) === dayKey(now)).length,
    screeningsThisWeek: starts.filter((start) => start >= now && start < now + 7 * DAY).length,
    sales: { today: windowOf(1), last7Days: windowOf(7), last30Days: windowOf(30) },
    refundsWaiting: {
      count: owed.length,
      amount: round2(owed.reduce((total, payment) => total + payment.amount, 0)),
    },
    videosProcessing: store.videos.filter(
      (video) => video.status === "UPLOADING" || video.status === "PROCESSING",
    ).length,
    filmsNeedingAttention: store.films
      .filter((film) => !film.isPublished && (!film.nfvcbCertNumber || !film.masterVideoAssetId))
      .map((film) => ({
        id: film.id,
        title: film.title,
        missing: [
          ...(!film.nfvcbCertNumber ? (["certificate"] as const) : []),
          ...(!film.masterVideoAssetId ? (["master video"] as const) : []),
        ],
      })),
  };
}
