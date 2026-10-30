import { cn } from "cn";
import { AlertTriangle, CircleCheck, CircleDot, Clock, Info, XCircle } from "lucide-react";

/*
 * Every status the console shows, in one place: its words and its tone. Status is never told by
 * colour alone, so each one has a label (and the badge adds an icon for its tone).
 */

export type StatusTone = "neutral" | "positive" | "attention" | "critical" | "live" | "info";

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

const STATUSES = {
  ticket: {
    RESERVED: { label: "On hold", tone: "attention" },
    CONFIRMED: { label: "Confirmed", tone: "positive" },
    CHECKED_IN: { label: "Watched", tone: "neutral" },
    EXPIRED: { label: "Hold expired", tone: "neutral" },
    CANCELLED: { label: "Cancelled", tone: "critical" },
  },
  payment: {
    PENDING: { label: "Pending", tone: "attention" },
    SUCCESS: { label: "Paid", tone: "positive" },
    FAILED: { label: "Failed", tone: "critical" },
    REFUNDED: { label: "Refunded", tone: "neutral" },
  },
  refund: {
    PENDING: { label: "Refund due", tone: "attention" },
    REFUNDED: { label: "Refunded", tone: "neutral" },
  },
  showtime: {
    UPCOMING: { label: "Upcoming", tone: "info" },
    LIVE: { label: "Live", tone: "live" },
    PAST: { label: "Ended", tone: "neutral" },
    CANCELLED: { label: "Cancelled", tone: "critical" },
  },
  film: {
    DRAFT: { label: "Draft", tone: "attention" },
    PUBLISHED: { label: "Published", tone: "positive" },
  },
  video: {
    UPLOADING: { label: "Uploading", tone: "info" },
    PROCESSING: { label: "Processing", tone: "info" },
    READY: { label: "Ready", tone: "positive" },
    ERRORED: { label: "Failed", tone: "critical" },
    CANCELLED: { label: "Cancelled", tone: "neutral" },
    ATTACHED: { label: "Attached", tone: "positive" },
    NONE: { label: "None", tone: "neutral" },
  },
  staff: {
    INVITED: { label: "Invited", tone: "attention" },
    ACTIVE: { label: "Active", tone: "positive" },
  },
  role: {
    VIEWER: { label: "Member", tone: "neutral" },
    HOST: { label: "Member", tone: "neutral" },
    PRODUCER: { label: "Producer", tone: "info" },
    ADMIN: { label: "Staff", tone: "info" },
    SUPER_ADMIN: { label: "Super admin", tone: "live" },
  },
} as const satisfies Record<string, Record<string, StatusMeta>>;

export type StatusKind = keyof typeof STATUSES;

/**
 * The words and tone for a status. A status the API adds later still shows, as its own name in
 * sentence case with a neutral tone, rather than breaking the page.
 */
export function statusMeta(kind: StatusKind, status: string): StatusMeta {
  const known = (STATUSES[kind] as Record<string, StatusMeta>)[status];
  if (known) return known;
  const words = status.toLowerCase().replaceAll("_", " ");
  return { label: words.charAt(0).toUpperCase() + words.slice(1), tone: "neutral" };
}

const TONES: Record<StatusTone, { className: string; icon: typeof Info }> = {
  neutral: { className: "bg-white/6 text-white/70 ring-white/10", icon: CircleDot },
  positive: { className: "bg-lobby/10 text-lobby ring-lobby/25", icon: CircleCheck },
  attention: { className: "bg-gold/10 text-gold ring-gold/25", icon: Clock },
  critical: { className: "bg-brand/12 text-[#ff5a63] ring-brand/30", icon: XCircle },
  live: { className: "bg-brand text-white ring-brand", icon: CircleDot },
  info: { className: "bg-sky-400/10 text-sky-300 ring-sky-400/25", icon: Info },
};

/**
 * A status as a small pill: icon, words and tone together. `label` overrides the words when the
 * screen knows more, e.g. "On hold · 6:12".
 */
export function StatusBadge({
  kind,
  status,
  label,
  className,
}: {
  kind: StatusKind;
  status: string;
  label?: string;
  className?: string;
}) {
  const meta = statusMeta(kind, status);
  const tone = TONES[meta.tone];
  const Icon = meta.tone === "critical" && kind === "video" ? AlertTriangle : tone.icon;
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        tone.className,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label ?? meta.label}
    </span>
  );
}
