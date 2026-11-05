"use client";

import { cn } from "cn";
import { Copy, CreditCard } from "lucide-react";
import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/data-table/data-table";
import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { StatusBadge } from "@/components/console/status-badge";
import { UrlSearch, useSearchParam } from "@/components/console/url-controls";
import { usePagination } from "@/hooks/use-pagination";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fieldClass } from "@/features/auth/form-parts";
import { roomLabel } from "@/features/admin/rooms";
import { formatLagosDateTime, formatMoneyExact } from "@/lib/format";

import type { AdminPayment } from "./api-types";
import { usePayments } from "./queries";
import { refundReasonLabel } from "./sales";

const STATUSES = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"] as const;
const STATUS_LABEL = {
  PENDING: "Pending",
  SUCCESS: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

function copy(text: string) {
  void navigator.clipboard.writeText(text).then(() => toast.success("Reference copied"));
}

/** One payment in full: the split, the pass and the way to its member and screening */
function PaymentSheet({ payment, onClose }: { payment: AdminPayment | null; onClose: () => void }) {
  const rows = payment
    ? [
        { label: "Amount", value: formatMoneyExact(payment.amount, payment.currency) },
        ...(payment.settlement
          ? [
              {
                label: "Gateway fee",
                value: formatMoneyExact(payment.settlement.gatewayFee, payment.currency),
              },
              {
                label: "Producer share",
                value: formatMoneyExact(payment.settlement.producerShare, payment.currency),
              },
              {
                label: "Platform share",
                value: formatMoneyExact(payment.settlement.platformShare, payment.currency),
              },
            ]
          : []),
        {
          label: "Pass",
          value: `${payment.ticket.seatIdentifier} · ${roomLabel(payment.ticket.tier)}`,
        },
        { label: "Paid", value: formatLagosDateTime(payment.createdAt, { year: true }) },
      ]
    : [];
  return (
    <Sheet open={payment !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full border-white/10 bg-surface-1 sm:max-w-md">
        {payment && (
          <>
            <SheetHeader className="px-6 pt-6">
              <SheetTitle className="font-mono text-sm">{payment.reference}</SheetTitle>
              <SheetDescription>
                {payment.showtime.movie.title}, {formatLagosDateTime(payment.showtime.startTime)}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 overflow-y-auto px-6 pb-8">
              <div className="flex flex-wrap gap-2">
                <StatusBadge kind="payment" status={payment.status} />
                <StatusBadge kind="ticket" status={payment.ticket.status} />
              </div>
              <dl className="divide-y divide-white/8 rounded-xl border border-white/8 text-sm">
                {rows.map((row) => (
                  <div key={row.label} className="flex justify-between gap-4 px-4 py-3">
                    <dt className="text-white/50">{row.label}</dt>
                    <dd className="text-right tabular-nums">{row.value}</dd>
                  </div>
                ))}
              </dl>
              {payment.refund && (
                <div className="rounded-xl border border-gold/25 bg-gold/5 p-4 text-sm">
                  <p className="font-semibold">{refundReasonLabel(payment.refund.reason)}</p>
                  <p className="mt-1 text-white/60">
                    Owed since {formatLagosDateTime(payment.refund.requiredAt)}
                    {payment.refund.refundedAt &&
                      `; refunded ${formatLagosDateTime(payment.refund.refundedAt)}`}
                  </p>
                  {payment.refund.note && (
                    <p className="mt-2 text-white/70">“{payment.refund.note}”</p>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-2 text-sm">
                <Link
                  href={`/admin/members/${payment.member.id}`}
                  className="underline underline-offset-4"
                >
                  {payment.member.email}
                </Link>
                <Link
                  href={`/admin/showtimes/${payment.showtime.id}`}
                  className="underline underline-offset-4"
                >
                  The screening
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** /admin/payments: every payment, found by status, Paystack reference or member email. */
export function PaymentsPage() {
  const [status, setStatus] = useQueryState("status", parseAsStringLiteral(STATUSES));
  const [reference, setReference] = useSearchParam("reference");
  const [email, setEmail] = useSearchParam("email");
  const pagination = usePagination();
  const [open, setOpen] = useState<AdminPayment | null>(null);
  const payments = usePayments({
    status: status ?? undefined,
    reference: reference || undefined,
    email: email || undefined,
    ...pagination.query,
  });
  const filtered = Boolean(status || reference || email);

  const columns: Column<AdminPayment>[] = [
    {
      id: "reference",
      header: "Reference",
      cell: (payment) => (
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOpen(payment)}
            className="truncate font-mono text-xs hover:underline"
          >
            {payment.reference}
          </button>
          <button
            type="button"
            aria-label="Copy reference"
            onClick={() => copy(payment.reference)}
            className="grid size-7 shrink-0 place-items-center rounded-md text-white/40 hover:bg-white/8 hover:text-foreground"
          >
            <Copy className="size-3.5" />
          </button>
        </span>
      ),
    },
    {
      id: "member",
      header: "Member",
      cell: (payment) => <span className="truncate">{payment.member.email}</span>,
    },
    {
      id: "film",
      header: "Film",
      cell: (payment) => payment.showtime.movie.title,
      hideOnMobile: true,
    },
    {
      id: "amount",
      header: "Amount",
      align: "end",
      cell: (payment) => formatMoneyExact(payment.amount, payment.currency),
    },
    {
      id: "status",
      header: "Status",
      cell: (payment) => (
        <span className="flex flex-wrap gap-1.5">
          <StatusBadge kind="payment" status={payment.status} />
          {payment.refund && !payment.refund.refundedAt && (
            <StatusBadge kind="refund" status="PENDING" />
          )}
        </span>
      ),
    },
    {
      id: "date",
      header: "Date",
      hideOnMobile: true,
      cell: (payment) => (
        <span className="whitespace-nowrap text-white/60">
          {formatLagosDateTime(payment.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Payments"
        description="Every Paystack payment, with its split and its pass."
      />
      <Panel flush>
        <div className="grid gap-3 border-b border-white/8 p-4 sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)]">
          <label>
            <span className="sr-only">Status</span>
            <select
              value={status ?? ""}
              onChange={(event) => {
                void setStatus((event.target.value || null) as (typeof STATUSES)[number] | null);
                pagination.resetPage();
              }}
              className={cn(fieldClass, "h-10 appearance-none rounded-full bg-surface-1")}
            >
              <option value="">Any status</option>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABEL[value]}
                </option>
              ))}
            </select>
          </label>
          <UrlSearch
            param="reference"
            label="Search by reference"
            placeholder="Paystack reference"
          />
          <UrlSearch param="email" label="Search by member email" placeholder="Member email" />
        </div>
        <DataTable
          rows={payments.data?.items}
          columns={columns}
          rowKey={(payment) => payment.id}
          isLoading={payments.isPending}
          error={payments.error}
          onRetry={() => void payments.refetch()}
          caption="Payments"
          empty={{
            icon: CreditCard,
            title: "No payments yet",
            hint: "Payments appear here as members check out.",
          }}
          filtered={
            filtered
              ? {
                  title: "No payments match",
                  hint: "Try part of the reference or the email, or another status.",
                  onClear: () => {
                    void setStatus(null);
                    void setReference(null);
                    void setEmail(null);
                  },
                }
              : undefined
          }
          pagination={{ meta: payments.data?.meta, state: pagination }}
        />
      </Panel>
      <PaymentSheet payment={open} onClose={() => setOpen(null)} />
    </>
  );
}
