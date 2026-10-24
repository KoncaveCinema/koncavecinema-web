/*
 * Display formatting: money, NFVCB ratings and showtimes. Plain functions, no React, safe on
 * the server and the client.
 */

/* Money */

const formatters = new Map<string, Intl.NumberFormat>();

/**
 * Formats a price for display: `₦5,000`, `$12`. Whole units only; the API's amounts for
 * tickets are whole naira. Amounts arrive as numbers or numeric strings (Prisma decimals).
 */
export function formatMoney(amount: number | string, currency = "NGN"): string {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    });
    formatters.set(currency, formatter);
  }
  return formatter.format(typeof amount === "string" ? Number(amount) : amount);
}

/* NFVCB ratings */

/**
 * National Film and Video Censors Board classifications (NFVCB Act No. 85), as stored by the
 * API. Nigerian releases never carry US ratings such as PG-13.
 */
export type AgeRating = "G" | "PG" | "TWELVE_PLUS" | "FIFTEEN_PLUS" | "EIGHTEEN_PLUS";

const RATINGS: Record<AgeRating, { label: string; description: string }> = {
  G: { label: "G", description: "General exhibition" },
  PG: { label: "PG", description: "Parental guidance" },
  TWELVE_PLUS: { label: "12", description: "Not for children under 12" },
  FIFTEEN_PLUS: { label: "15", description: "Not for children under 15" },
  EIGHTEEN_PLUS: { label: "18", description: "Adults only, 18 and over" },
};

export function ratingLabel(rating: AgeRating): string {
  return RATINGS[rating]?.label ?? rating;
}

export function ratingDescription(rating: AgeRating): string {
  return RATINGS[rating]?.description ?? "Classified by the NFVCB";
}

/* Showtimes */

/**
 * Showtime and countdown text. Times render in the viewer's timezone once the page is running in
 * the browser; before that (server render, first paint) they render in Lagos time, the
 * platform's home timezone, so server and client markup always match.
 */
export const HOME_TIME_ZONE = "Africa/Lagos";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function zone(timeZone: string | undefined): string | undefined {
  return timeZone ?? HOME_TIME_ZONE;
}

/** "8:00 PM" */
export function formatClock(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: zone(timeZone),
  }).format(new Date(iso));
}

/** "Sat 25 Oct" */
export function formatDay(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: zone(timeZone),
  }).format(new Date(iso));
}

/** "Oct 28" for premiere ribbons */
export function formatShortDate(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: zone(timeZone),
  })
    .format(new Date(iso))
    .toUpperCase();
}

function dayKey(time: number, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone(timeZone) }).format(new Date(time));
}

/**
 * "Today", "Tomorrow" or "Sat 25 Oct". Relative words need the current time, so without it
 * (server render) the calendar date is used.
 */
export function formatRelativeDay(iso: string, now: number | null, timeZone?: string): string {
  if (now === null) return formatDay(iso, timeZone);
  const target = dayKey(new Date(iso).getTime(), timeZone);
  if (target === dayKey(now, timeZone)) return "Today";
  if (target === dayKey(now + DAY, timeZone)) return "Tomorrow";
  return formatDay(iso, timeZone);
}

/** "Today, 8:00 PM" */
export function formatShowtime(iso: string, now: number | null, timeZone?: string): string {
  return `${formatRelativeDay(iso, now, timeZone)}, ${formatClock(iso, timeZone)}`;
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Time until a start: "08:42" under an hour (a ticking marquee), "3h 10m" under a day,
 * "2 days" beyond that.
 */
export function formatCountdown(ms: number): string {
  const safe = Math.max(0, ms);
  if (safe < HOUR) {
    const totalSeconds = Math.floor(safe / 1000);
    return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`;
  }
  if (safe < DAY) {
    const hours = Math.floor(safe / HOUR);
    const minutes = Math.floor((safe % HOUR) / MINUTE);
    return minutes ? `${hours}h ${pad(minutes)}m` : `${hours}h`;
  }
  const days = Math.floor(safe / DAY);
  return `${days} ${days === 1 ? "day" : "days"}`;
}

/** Time since a start: "22m", "1h 05m" */
export function formatElapsed(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / MINUTE));
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`;
}

/** "1h 58m" for runtimes */
export function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${pad(rest)}m` : `${hours}h`;
}
