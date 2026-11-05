"use client";

import { cn } from "cn";
import { ScrollText, X } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";

import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { StatusBadge } from "@/components/console/status-badge";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { fieldClass } from "@/features/auth/form-parts";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
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

const COLUMNS: Column<AuditEntry>[] = [
  {
    id: "action",
    header: "What happened",
    cell: (entry) => (
      <span className="block min-w-0">
        <span className="block">{ACTIONS[entry.action] ?? entry.action}</span>
        <span className="block truncate text-xs font-normal text-white/45">
          {entry.user ? entry.user.email : "No account"} · {entry.ipAddress ?? "Unknown address"} ·{" "}
          {browserSummary(entry.userAgent)}
        </span>
      </span>
    ),
  },
  {
    id: "role",
    header: "Role",
    cell: (entry) =>
      entry.user ? (
        <StatusBadge kind="role" status={entry.user.role} />
      ) : (
        <span className="text-white/35">None</span>
      ),
  },
  {
    id: "when",
    header: "When",
    align: "end",
    cell: (entry) => (
      <span className="whitespace-nowrap text-white/55">
        {formatLagosDateTime(entry.timestamp)}
      </span>
    ),
  },
];

/** What the API recorded with the entry, opened beneath its row; nothing when it kept none */
function metadataOf(entry: AuditEntry) {
  if (!entry.metadata || Object.keys(entry.metadata).length === 0) return null;
  return <pre className="font-mono leading-relaxed">{JSON.stringify(entry.metadata, null, 2)}</pre>;
}

/** /admin/audit: everything that happened, newest first, by member and by kind of action. */
export function AuditLog() {
  const [filters, setFilters] = useQueryStates({
    userId: parseAsString.withDefault(""),
    action: parseAsString.withDefault(""),
  });
  // The API's own page size for the log; a new filter starts again from the newest
  const pagination = useCursorPagination(50);
  const setFilter = (next: Partial<Record<"userId" | "action", string | null>>) => {
    void setFilters(next);
    pagination.first();
  };
  // The API takes capital letters and underscores only; anything else isn't asked for
  const actionValid = !filters.action || /^[A-Z_]+$/.test(filters.action);
  const audit = useAudit({
    userId: filters.userId || undefined,
    action: actionValid ? filters.action || undefined : undefined,
    ...pagination.query,
  });

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
                  onClick={() => setFilter({ action: active ? null : preset.value })}
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
                  setFilter({ action: event.target.value.toUpperCase() || null })
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
                onChange={(event) => setFilter({ userId: event.target.value.trim() || null })}
                placeholder="Member id (from a member's page)"
                className={cn(fieldClass, "h-10 rounded-full pr-10 font-mono text-xs")}
              />
              {filters.userId && (
                <button
                  type="button"
                  aria-label="Show everyone"
                  onClick={() => setFilter({ userId: null })}
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

        <DataTable
          rows={audit.data?.items}
          columns={COLUMNS}
          rowKey={(entry) => entry.id}
          expanded={metadataOf}
          isLoading={audit.isPending}
          error={audit.error}
          onRetry={() => void audit.refetch()}
          caption="Audit log"
          loadingRows={8}
          empty={{ icon: ScrollText, title: "Nothing recorded yet" }}
          filtered={
            filters.action || filters.userId
              ? {
                  title: "Nothing recorded for these filters",
                  hint: "Try another kind of action or another member, or clear the filters.",
                  onClear: () => setFilter({ action: null, userId: null }),
                }
              : undefined
          }
          pagination={{
            cursor: audit.data && {
              count: audit.data.items.length,
              nextCursor: audit.data.nextCursor,
            },
            state: pagination,
          }}
        />
      </Panel>
    </>
  );
}
