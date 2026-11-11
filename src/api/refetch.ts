/*
 * What each write refreshes: the API's tags. After a mutation succeeds, every cached query whose
 * path starts with one of its prefixes is refetched (query-client.ts applies it), so screens
 * never refresh by hand.
 *
 * The convention every module's hooks follow:
 * - a query's key starts with its API path: ["/admin/movies/1"], ["/admin/movies", { page: 2 }];
 * - a mutation's key is its operation name in the API (its Swagger): ["publishMovie"].
 *
 * Every write the web app sends is listed by that name; an empty list refreshes nothing.
 *
 * Signing in and out clears the whole cache instead (a person's data never outlives them).
 * Public pages rendered on the server are refreshed separately, with revalidateTag("catalog").
 */

const ADMIN_FILM = ["/admin/movies", "/admin/overview", "/admin/audit-logs"];
const CATALOGUE = ["/movies", "/showtimes"];
const MEMBER_PASSES = ["/tickets", "/showtimes"];
const ADMIN_MONEY = ["/admin/payments", "/admin/refunds", "/admin/overview", "/admin/users"];

export const refetchAfter: Record<string, readonly string[]> = {
  // Authentication
  register: [],
  login: [],
  refresh: [],
  forgotPassword: [],
  resetPassword: [],
  logout: [],
  updateProfile: ["/auth/me"],
  deleteAccount: [],
  changePassword: [],
  sendKycOtp: [],
  verifyKycOtp: ["/auth/me"],

  // Ticketing and payments
  reserveTicket: MEMBER_PASSES,
  claimInvite: MEMBER_PASSES,
  releaseTicket: MEMBER_PASSES,
  verifyAccess: [],
  cancelTicket: MEMBER_PASSES,
  initializeCheckout: [],

  // The screening room: sessions, not cached data
  authorizePlayback: [],
  heartbeat: [],
  refreshDrmToken: [],
  secureStop: [],
  sendLocationCode: [],
  confirmLocation: [],

  // Admin: films and their media
  createMovie: ADMIN_FILM,
  updateMovie: [...ADMIN_FILM, ...CATALOGUE],
  deleteMovie: ADMIN_FILM,
  bindCompliance: ADMIN_FILM,
  announceMovie: [...ADMIN_FILM, ...CATALOGUE],
  publishMovie: [...ADMIN_FILM, ...CATALOGUE],
  unpublishMovie: [...ADMIN_FILM, ...CATALOGUE, "/admin/showtimes"],
  createDirectUpload: [],
  deleteVideo: [...ADMIN_FILM, "/admin/videos"],
  attachMasterVideo: [...ADMIN_FILM, "/admin/videos"],
  attachTrailer: [...ADMIN_FILM, "/admin/videos", ...CATALOGUE],
  signImageUpload: [],
  completeImageUpload: [...ADMIN_FILM, ...CATALOGUE],

  // Admin: showtimes
  createShowtime: ["/admin/showtimes", ...ADMIN_FILM, ...CATALOGUE],
  updateShowtime: ["/admin/showtimes", ...ADMIN_FILM, ...CATALOGUE, "/tickets"],
  cancelShowtime: ["/admin/showtimes", ...ADMIN_FILM, ...CATALOGUE, "/tickets", ...ADMIN_MONEY],

  // Admin: money, members and staff
  markRefunded: [...ADMIN_MONEY, "/admin/audit-logs"],
  resendConfirmation: ["/admin/audit-logs"],
  cancelPass: [...ADMIN_MONEY, "/admin/showtimes", "/admin/audit-logs", "/tickets"],
  inviteStaff: ["/admin/staff", "/admin/audit-logs"],
  changeStaffRole: ["/admin/staff", "/admin/audit-logs"],
  removeStaff: ["/admin/staff", "/admin/audit-logs"],
};

/** True when a cached query's key belongs under one of the prefixes */
export function matchesPrefixes(
  queryKey: readonly unknown[],
  prefixes: readonly string[],
): boolean {
  const [path] = queryKey;
  return typeof path === "string" && prefixes.some((prefix) => path.startsWith(prefix));
}
