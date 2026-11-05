/*
 * Enums from koncavecinema-api that several features share. A feature's own API shapes stay in
 * its api-types.ts; only what crosses features lives here.
 */

/** The four ways to watch (the API's TicketTier) */
export type TicketTier = "INDIVIDUAL" | "PUBLIC" | "PRIVATE_5" | "PRIVATE_10";

/**
 * National Film and Video Censors Board classifications (NFVCB Act No. 85), as the API stores
 * them. Nigerian releases never carry US ratings such as PG-13.
 */
export type AgeRating = "G" | "PG" | "TWELVE_PLUS" | "FIFTEEN_PLUS" | "EIGHTEEN_PLUS";

/**
 * DRAFT: staff only. COMING_SOON: announced, its page and trailer public, not bookable.
 * PUBLISHED: in the catalogue, scheduled and booked.
 */
export type FilmStatus = "DRAFT" | "COMING_SOON" | "PUBLISHED";
