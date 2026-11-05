/** koncavecinema-api admin overview shapes, field for field (src/admin/money.service.ts). */

/** Kept revenue over a period: settled payments not owed back, one per paid pass */
export interface AdminSalesWindow {
  passesSold: number;
  gross: number;
  platformShare: number;
  producerShare: number;
}

/** GET /admin/overview. Amounts are NGN. */
export interface AdminOverview {
  /** Screenings starting today, Lagos time, not cancelled */
  screeningsToday: number;
  /** Screenings starting in the next seven days */
  screeningsThisWeek: number;
  /** Rolling windows back from now: 24 hours, 7 days and 30 days */
  sales: { today: AdminSalesWindow; last7Days: AdminSalesWindow; last30Days: AdminSalesWindow };
  refundsWaiting: { count: number; amount: number };
  /** Uploads still UPLOADING or PROCESSING at Mux */
  videosProcessing: number;
  /** Unpublished films (draft or coming soon) missing anything publishing needs, newest first, at most 20 */
  filmsNeedingAttention: {
    id: string;
    title: string;
    missing: PublishRequirement[];
  }[];
}

export type PublishRequirement = "certificate" | "master video" | "trailer" | "posters";
