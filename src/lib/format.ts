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

const exactFormatters = new Map<string, Intl.NumberFormat>();

/**
 * Money to the kobo where there is any: `₦5,000`, `₦1,234.50`. For reports and settlements,
 * whose shares and fees are not whole naira.
 */
export function formatMoneyExact(amount: number | string, currency = "NGN"): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  // Whole naira, or exactly two decimals: never "₦1,234.5"
  const digits = Number.isInteger(value) ? 0 : 2;
  const key = `${currency}:${digits}`;
  let formatter = exactFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    exactFormatters.set(key, formatter);
  }
  return formatter.format(value);
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

/** "2026-10-28": the calendar day of a moment in a timezone, for grouping by day */
export function dayKey(time: number, timeZone?: string): string {
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

/* Console times: staff and support work from anywhere, so the console always shows Lagos time
   and names it. Lagos is UTC+1 all year (no daylight saving), so the WAT label is always right. */

/** "Fri 7 Nov, 7:00 pm WAT", or with the year: "Fri 7 Nov 2026, 7:00 pm WAT" */
export function formatLagosDateTime(iso: string, options: { year?: boolean } = {}): string {
  // Assembled from parts: en-GB adds a comma after the weekday only when the year is shown
  const parts = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: HOME_TIME_ZONE,
  }).formatToParts(new Date(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const date = [part("weekday"), part("day"), part("month"), options.year ? part("year") : ""]
    .filter(Boolean)
    .join(" ");
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: HOME_TIME_ZONE,
  }).format(new Date(iso));
  return `${date}, ${time} WAT`;
}

/** "7 Nov 2026" */
export function formatLagosDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: HOME_TIME_ZONE,
  }).format(new Date(iso));
}

/** "1h 58m" for runtimes */
export function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${pad(rest)}m` : `${hours}h`;
}
