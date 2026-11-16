"use client";

import { CheckCircle2, Hourglass, Info, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { ErrorCode } from "@/api";
import { ConfirmDialog } from "@/components/console/confirm-dialog";
import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { UrlTabs, useTabParam } from "@/components/console/url-controls";
import { DataTable, type Column } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { isSuperAdmin } from "@/features/auth/roles";
import { useSession } from "@/features/auth/session";
import { usePagination } from "@/hooks/use-pagination";
import { formatLagosDate, formatLagosDateTime, formatMoney } from "@/lib/format";

import { useMarkRefunded, useRefunds, useSendRefund } from "@/api/admin/money-api";
import type { AdminPayment } from "@/api/admin/money-schemas";
import { useStaffSignedIn } from "../require-staff";
import { refundReasonLabel } from "./sales";

const TABS = [
  { value: "pending", label: "Owed" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Refunded" },
] as const;

/**
 * /admin/refunds: payments owed a refund, oldest first; the ones sent through Paystack and
 * waiting for its answer; and the ones refunded.
 */
export function RefundsPage() {
  const [state] = useTabParam("state", ["pending", "in_progress", "done"] as const, "pending");
  const pagination = usePagination();
  const refunds = useRefunds({ state, ...pagination.query }, useStaffSignedIn());
  const send = useSendRefund();
  const mark = useMarkRefunded();
  const role = useSession((session) => session.user?.role);
  const canRecord = isSuperAdmin(role);
  const [sending, setSending] = useState<AdminPayment | null>(null);
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
      cell: (payment) => formatMoney(payment.amount, payment.currency),
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
          cell: (payment) => (
            <span>
              {payment.refund && formatLagosDate(payment.refund.requiredAt)}
              {/* The last attempt through Paystack failed: owed again, with Paystack's reason */}
              {payment.refund?.failedAt && (
                <span className="block max-w-64 text-xs text-[#ff8a90]">
                  Paystack refused it {formatLagosDateTime(payment.refund.failedAt)}
                  {payment.refund.failureReason && `: ${payment.refund.failureReason}`}
                </span>
              )}
            </span>
          ),
        }
      : state === "in_progress"
        ? {
            id: "sent",
            header: "Sent to Paystack",
            cell: (payment) => (
              <span>
                {payment.refund?.sentAt && formatLagosDateTime(payment.refund.sentAt)}
                <span className="block text-xs text-white/45">
                  Waiting for Paystack&apos;s answer
                </span>
              </span>
            ),
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
              <span className="flex justify-end gap-2">
                <Button size="sm" onClick={() => setSending(payment)}>
                  Refund
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRecording(payment)}>
                  Mark refunded
                </Button>
              </span>
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
        description="Payments that require a refund. Send each through Paystack, or record one already made by hand."
      />
      {!canRecord && (
        <p className="mb-6 flex items-start gap-2.5 rounded-xl border border-sky-400/25 bg-sky-400/5 px-4 py-3 text-sm text-sky-100/80">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sky-300" />
          You can see the queue. Only the super admin sends or records refunds, because each one
          emails the member.
        </p>
      )}
      <Panel flush>
        <UrlTabs param="state" tabs={TABS} fallback="pending" label="Refund state" />
        <DataTable
          rows={refunds.data?.items}
          columns={columns}
          rowKey={(payment) => payment.id}
          isLoading={refunds.isPending || refunds.isPlaceholderData}
          error={refunds.error}
          onRetry={() => void refunds.refetch()}
          caption="Refunds"
          empty={
            state === "pending"
              ? {
                  icon: CheckCircle2,
                  title: "No refunds required",
                  hint: "Cancelled screenings and passes add their payments here.",
                }
              : state === "in_progress"
                ? {
                    icon: Hourglass,
                    title: "Nothing waiting on Paystack",
                    hint: "A refund sent through Paystack shows here until Paystack settles it.",
                  }
                : { icon: Undo2, title: "No refunds recorded yet" }
          }
          pagination={{ meta: refunds.data?.meta, state: pagination }}
        />
      </Panel>

      <ConfirmDialog
        open={sending !== null}
        onOpenChange={(open) => !open && setSending(null)}
        title={
          sending ? `Refund ${formatMoney(sending.amount, sending.currency)} through Paystack?` : ""
        }
        description={sending ? `${sending.member.email}, payment ${sending.reference}` : undefined}
        consequences={[
          "Paystack returns the full amount to the card or account it was paid with.",
          "It shows under In progress until Paystack confirms it; the member is emailed then.",
          "This can't be undone.",
        ]}
        confirmLabel="Refund through Paystack"
        pendingLabel="Sending…"
        onConfirm={async () => {
          if (!sending) return;
          const payment = await send.mutateAsync(sending.id);
          toast.success(payment.refund?.state === "DONE" ? "Refunded" : "Refund sent to Paystack");
        }}
        explainError={(error) => {
          if (error.is(ErrorCode.REFUND_IN_PROGRESS, ErrorCode.REFUND_NOT_REQUIRED)) {
            void refunds.refetch();
            return error.is(ErrorCode.REFUND_IN_PROGRESS)
              ? "This refund is already with Paystack. It shows under In progress until Paystack answers."
              : "This payment isn't waiting for a refund.";
          }
          if (error.is(ErrorCode.PAYMENT_GATEWAY_UNAVAILABLE)) {
            void refunds.refetch();
            return "Paystack didn't answer. The refund is now in progress and is checked against Paystack within the hour, so don't send it again.";
          }
          if (error.is(ErrorCode.PAYMENT_GATEWAY_ERROR)) {
            return "Paystack refused this refund, and it is still owed. Try again later, or refund it in the Paystack dashboard and mark it refunded.";
          }
          return undefined;
        }}
      />
      <ConfirmDialog
        open={recording !== null}
        onOpenChange={(open) => !open && setRecording(null)}
        title={
          recording
            ? `Record a refund of ${formatMoney(recording.amount, recording.currency)}?`
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
          if (error.is(ErrorCode.REFUND_IN_PROGRESS)) {
            void refunds.refetch();
            return "This refund was sent through Paystack and is waiting for its answer. It can't be recorded by hand until then.";
          }
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
