"use client";

import { CheckCircle2, Info, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/console/confirm-dialog";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { UrlTabs, useTabParam } from "@/components/console/url-controls";
import { usePagination } from "@/hooks/use-pagination";
import { Button } from "@/components/ui/button";
import { isSuperAdmin } from "@/features/auth/roles";
import { useSession } from "@/features/auth/session";
import { ErrorCode } from "@/lib/api";
import { formatLagosDate, formatLagosDateTime, formatMoneyExact } from "@/lib/format";

import type { AdminPayment } from "./api-types";
import { useMarkRefunded, useRefunds } from "./queries";
import { refundReasonLabel } from "./sales";

const TABS = [
  { value: "pending", label: "Waiting" },
  { value: "done", label: "Refunded" },
] as const;

/** /admin/refunds: payments owed back, oldest first, and the ones already returned. */
export function RefundsQueue() {
  const [state] = useTabParam("state", ["pending", "done"] as const, "pending");
  const pagination = usePagination();
  const refunds = useRefunds(state, pagination.query);
  const mark = useMarkRefunded();
  const role = useSession((session) => session.user?.role);
  const canRecord = isSuperAdmin(role);
  const [recording, setRecording] = useState<AdminPayment | null>(null);

  const columns: Column<AdminPayment>[] = [
    {
      id: "member",
      header: "Member",
      cell: (payment) => (
        <span className="min-w-0">
          <Link
            href={`/admin/members/${payment.member.id}`}
            className="block truncate hover:underline"
          >
            {payment.member.email}
          </Link>
          <span className="block truncate font-mono text-xs font-normal text-white/40">
            {payment.reference}
          </span>
        </span>
      ),
    },
    {
      id: "film",
      header: "Screening",
      cell: (payment) => (
        <span>
          {payment.showtime.movie.title}
          <span className="block text-xs text-white/45">
            {formatLagosDateTime(payment.showtime.startTime)}
          </span>
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      align: "end",
      cell: (payment) => formatMoneyExact(payment.amount, payment.currency),
    },
    {
      id: "reason",
      header: "Why",
      cell: (payment) => refundReasonLabel(payment.refund?.reason ?? null),
    },
    state === "pending"
      ? {
          id: "flagged",
          header: "Owed since",
          hideOnMobile: true,
          cell: (payment) => payment.refund && formatLagosDate(payment.refund.requiredAt),
        }
      : {
          id: "refunded",
          header: "Refunded",
          cell: (payment) => (
            <span>
              {payment.refund?.refundedAt && formatLagosDate(payment.refund.refundedAt)}
              {payment.refund?.note && (
                <span
                  className="block max-w-56 truncate text-xs text-white/45"
                  title={payment.refund.note}
                >
                  {payment.refund.note}
                </span>
              )}
            </span>
          ),
        },
    ...(state === "pending" && canRecord
      ? [
          {
            id: "action",
            header: "",
            align: "end" as const,
            cell: (payment: AdminPayment) => (
              <Button size="sm" variant="outline" onClick={() => setRecording(payment)}>
                Mark refunded
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Refunds"
        description="Payments owed back to members. Refunds are made in the Paystack dashboard, then recorded here."
      />
      {!canRecord && (
        <p className="mb-6 flex items-start gap-2.5 rounded-xl border border-sky-400/25 bg-sky-400/5 px-4 py-3 text-sm text-sky-100/80">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sky-300" />
          You can see the queue. Only the super admin records refunds, because recording one emails
          the member.
        </p>
      )}
      <Panel flush>
        <UrlTabs param="state" tabs={TABS} fallback="pending" label="Refund state" />
        <DataTable
          rows={refunds.data?.items}
          columns={columns}
          rowKey={(payment) => payment.id}
          isLoading={refunds.isPending}
          error={refunds.error}
          onRetry={() => void refunds.refetch()}
          caption="Refunds"
          empty={
            state === "pending"
              ? {
                  icon: CheckCircle2,
                  title: "Nothing owed back",
                  hint: "Cancelled screenings and passes add their payments here.",
                }
              : { icon: Undo2, title: "No refunds recorded yet" }
          }
          pagination={{ meta: refunds.data?.meta, state: pagination }}
        />
      </Panel>

      <ConfirmDialog
        open={recording !== null}
        onOpenChange={(open) => !open && setRecording(null)}
        title={
          recording
            ? `Record a refund of ${formatMoneyExact(recording.amount, recording.currency)}?`
            : ""
        }
        description="Refund in the Paystack dashboard first. This only records it and emails the member."
        consequences={
          recording
            ? [
                `${recording.member.email} is emailed that their money is on its way back.`,
                `The payment ${recording.reference} is marked refunded.`,
              ]
            : []
        }
        reason={{
          label: "Note for the record",
          placeholder: "Refund ID from the Paystack dashboard…",
          min: 1,
          max: 500,
        }}
        confirmLabel="Mark refunded"
        pendingLabel="Recording…"
        onConfirm={async (note) => {
          if (!recording) return;
          await mark.mutateAsync({ paymentId: recording.id, note });
          toast.success("Refund recorded");
        }}
        explainError={(error) => {
          if (!error.is(ErrorCode.REFUND_NOT_REQUIRED)) return undefined;
          void refunds.refetch();
          return error.messages[0]?.includes("already")
            ? "Already refunded."
            : "This payment isn't waiting for a refund.";
        }}
      />
    </>
  );
}
