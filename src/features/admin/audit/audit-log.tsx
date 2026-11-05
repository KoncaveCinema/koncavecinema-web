"use client";

import { cn } from "cn";
import { ChevronRight, ScrollText, X } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";

import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { EmptyState, ErrorState } from "@/components/states/states";
import { StatusBadge } from "@/components/console/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fieldClass } from "@/features/auth/form-parts";
import { formatLagosDateTime } from "@/lib/format";
import { browserSummary } from "@/lib/user-agent";

import type { AuditEntry } from "./api-types";
import { useAudit } from "./queries";

const PRESETS = [
  { value: "ADMIN_", label: "Staff actions" },
  { value: "PAYMENT_", label: "Payments" },
  { value: "STREAM_", label: "Playback" },
  { value: "USER_", label: "Accounts" },
];

/** Plain words for the actions people look for; anything else shows its code */
const ACTIONS: Record<string, string> = {
  USER_LOGIN_SUCCESS: "Signed in",
  USER_LOGIN_FAILED: "Failed sign-in",
  PAYMENT_SUCCESS: "Payment received",
  PAYMENT_FAILED: "Payment failed",
  PAYMENT_REQUIRES_REFUND: "Payment owed back",
  ADMIN_MOVIE_UNPUBLISHED: "Film unpublished",
  ADMIN_MOVIE_DELETED: "Draft deleted",
  ADMIN_POSTER_UPLOADED: "Poster uploaded",
  ADMIN_SHOWTIME_CANCELLED: "Screening cancelled",
  ADMIN_REFUND_RECORDED: "Refund recorded",
  ADMIN_PASS_CANCELLED: "Pass cancelled",
  ADMIN_CONFIRMATION_RESENT: "Booking email resent",
  ADMIN_LEGAL_NAME_REVEALED: "Legal name revealed",
  ADMIN_STAFF_INVITED: "Staff invited",
  ADMIN_STAFF_ROLE_CHANGED: "Staff role changed",
};

function Entry({ entry }: { entry: AuditEntry }) {
  const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0;
  const summary = (
    <>
      <span className="min-w-0">
        <span className="block font-medium">{ACTIONS[entry.action] ?? entry.action}</span>
        <span className="block truncate text-xs text-white/45">
          {entry.user ? entry.user.email : "No account"} · {entry.ipAddress ?? "Unknown address"} ·{" "}
          {browserSummary(entry.userAgent)}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        {entry.user && <StatusBadge kind="role" status={entry.user.role} />}
        <span className="text-xs whitespace-nowrap text-white/55">
          {formatLagosDateTime(entry.timestamp)}
        </span>
      </span>
    </>
  );

  if (!hasMetadata) {
    return (
      <div className="flex items-start justify-between gap-4 py-3.5 pr-5 pl-11">{summary}</div>
    );
  }
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-3.5 pr-5 pl-4 transition-colors hover:bg-white/3 [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-white/40 transition-transform group-open:rotate-90"
        />
        <span className="flex min-w-0 flex-1 items-start justify-between gap-4">{summary}</span>
      </summary>
      <pre className="mx-5 mb-4 overflow-x-auto rounded-lg bg-black/40 p-4 font-mono text-xs leading-relaxed text-white/70">
        {JSON.stringify(entry.metadata, null, 2)}
      </pre>
    </details>
  );
}

/** /admin/audit: everything that happened, newest first, by member and by kind of action. */
export function AuditLog() {
  const [filters, setFilters] = useQueryStates({
    userId: parseAsString.withDefault(""),
    action: parseAsString.withDefault(""),
  });
  // The API takes capital letters and underscores only; anything else isn't asked for
  const actionValid = !filters.action || /^[A-Z_]+$/.test(filters.action);
  const audit = useAudit({
    userId: filters.userId || undefined,
    action: actionValid ? filters.action || undefined : undefined,
  });
  const entries = audit.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Super admin"
        title="Audit log"
        description="Sign-ins, payments, playback and every staff action, newest first. Times are Lagos time."
      />
      <Panel flush>
        <div className="space-y-3 border-b border-white/8 p-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Kinds of action">
            {PRESETS.map((preset) => {
              const active = filters.action === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => void setFilters({ action: active ? null : preset.value })}
                  className={cn(
                    "h-9 rounded-full border px-3.5 text-sm transition-colors",
                    active
                      ? "border-brand/50 bg-brand/15"
                      : "border-white/10 text-white/60 hover:border-white/25 hover:text-foreground",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="sr-only">Action code or prefix</span>
              <input
                value={filters.action}
                onChange={(event) =>
                  void setFilters({ action: event.target.value.toUpperCase() || null })
                }
                placeholder="Action, e.g. ADMIN_STAFF"
                aria-invalid={!actionValid}
                className={cn(fieldClass, "h-10 rounded-full font-mono text-xs uppercase")}
              />
            </label>
            <label className="relative">
              <span className="sr-only">Member id</span>
              <input
                value={filters.userId}
                onChange={(event) => void setFilters({ userId: event.target.value.trim() || null })}
                placeholder="Member id (from a member's page)"
                className={cn(fieldClass, "h-10 rounded-full pr-10 font-mono text-xs")}
              />
              {filters.userId && (
                <button
                  type="button"
                  aria-label="Show everyone"
                  onClick={() => void setFilters({ userId: null })}
                  className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-white/50 hover:bg-white/8 hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </label>
          </div>
          {!actionValid && (
            <p role="alert" className="text-xs text-destructive">
              Actions are capital letters and underscores, e.g. PAYMENT_.
            </p>
          )}
        </div>

        {audit.isPending ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-10" />
            ))}
          </div>
        ) : audit.isError ? (
          <ErrorState onRetry={() => void audit.refetch()} />
        ) : entries.length === 0 ? (
          <EmptyState icon={ScrollText} title="Nothing recorded for these filters" />
        ) : (
          <ul className="divide-y divide-white/6 text-sm">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Entry entry={entry} />
              </li>
            ))}
          </ul>
        )}

        {audit.hasNextPage && (
          <div className="border-t border-white/8 p-4 text-center">
            <Button
              variant="outline"
              disabled={audit.isFetchingNextPage}
              onClick={() => void audit.fetchNextPage()}
            >
              {audit.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </Panel>
    </>
  );
}
