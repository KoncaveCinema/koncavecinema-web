/**
 * Builds an iCalendar (RFC 5545) event that Google Calendar, Apple Calendar and Outlook all
 * import. Used for "Add to calendar" on showtimes, with no backend involved.
 */
export interface CalendarEvent {
  uid: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  url?: string;
  location?: string;
  /** Minutes before the start for the reminder alarm */
  reminderMinutes?: number;
}

function toIcsDate(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** Escapes text values (RFC 5545 section 3.3.11). */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Folds lines longer than 75 octets (RFC 5545 section 3.1). */
function fold(line: string): string {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = ` ${rest.slice(75)}`;
  }
  parts.push(rest);
  return parts.join("\r\n");
}

export function buildIcs(event: CalendarEvent, stamp: string = new Date().toISOString()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Koncave Cinema//Showtimes//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}@koncavecinema.com`,
    `DTSTAMP:${toIcsDate(stamp)}`,
    `DTSTART:${toIcsDate(event.start)}`,
    `DTEND:${toIcsDate(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    event.description && `DESCRIPTION:${escapeText(event.description)}`,
    event.location && `LOCATION:${escapeText(event.location)}`,
    event.url && `URL:${event.url}`,
    ...(event.reminderMinutes
      ? [
          "BEGIN:VALARM",
          "ACTION:DISPLAY",
          `DESCRIPTION:${escapeText(event.title)}`,
          `TRIGGER:-PT${event.reminderMinutes}M`,
          "END:VALARM",
        ]
      : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => Boolean(line));

  return lines.map(fold).join("\r\n") + "\r\n";
}
