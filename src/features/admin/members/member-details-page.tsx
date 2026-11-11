"use client";

import { Eye, MailCheck, ScrollText, Ticket, XCircle } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/console/confirm-dialog";
import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { StatusBadge } from "@/components/console/status-badge";
import { QueryView } from "@/components/states/query-view";
import { EmptyState } from "@/components/states/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { roomLabel } from "@/features/admin/rooms";
import { isSuperAdmin } from "@/features/auth/roles";
import { useSession } from "@/features/auth/session";
import { ErrorCode, toApiError } from "@/api";
import { formatLagosDate, formatLagosDateTime, formatMoney } from "@/lib/format";
import { browserSummary } from "@/lib/user-agent";

import { refundReasonLabel } from "../money/sales";
import type { AdminMember, AdminMemberPass } from "./api-types";
import { useCancelPass, useMember, useResendConfirmation, useRevealLegalName } from "./queries";

const CRUMBS = [{ href: "/admin/members", label: "Members" }];
const PAID = ["CONFIRMED", "CHECKED_IN"];

function Profile({ member }: { member: AdminMember }) {
  const role = useSession((session) => session.user?.role);
  const reveal = useRevealLegalName();
  const [asking, setAsking] = useState(false);
  const [legalName, setLegalName] = useState<string | null | undefined>(undefined);

  const rows = [
    { label: "Email", value: member.email },
    { label: "Screen alias", value: member.publicScreenAlias ?? "Not chosen yet" },
    {
      label: "Identity",
      value: member.isPhoneVerified ? "Verified for the Public Hall" : "Not verified",
    },
    { label: "Phone number", value: "Never stored in readable form" },
    { label: "Terms accepted", value: member.termsVersion ?? "Not yet" },
    { label: "Joined", value: formatLagosDate(member.createdAt) },
    {
      label: "Last sign-in",
      value: member.lastSignInAt ? formatLagosDateTime(member.lastSignInAt) : "Never",
    },
  ];

  return (
    <Panel
      title="Profile"
      actions={
        <Button asChild size="sm" variant="ghost">
          <Link href={`/admin/audit?userId=${member.id}`}>
            <ScrollText data-icon="inline-start" />
            View activity
          </Link>
        </Button>
      }
    >
      <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs text-white/45">{row.label}</dt>
            <dd className="mt-1 wrap-break-word">{row.value}</dd>
          </div>
        ))}
        <div>
          <dt className="text-xs text-white/45">Legal name</dt>
          <dd className="mt-1">
            {legalName !== undefined ? (
              (legalName ?? "Not given (identity not verified)")
            ) : isSuperAdmin(role) ? (
              <Button size="sm" variant="outline" onClick={() => setAsking(true)}>
                <Eye data-icon="inline-start" />
                Reveal legal name
              </Button>
            ) : (
              <span className="text-white/45">Only the super admin can see it</span>
            )}
          </dd>
        </div>
      </dl>
      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        title="Reveal this member's legal name?"
        description="This is recorded in the audit log with your name and the time."
        consequences={["The name shows on this page only, until you leave it."]}
        confirmLabel="Reveal"
        pendingLabel="Revealing…"
        onConfirm={async () => setLegalName(await reveal.mutateAsync(member.id))}
      />
    </Panel>
  );
}

function PassRow({
  pass,
  onCancel,
}: {
  pass: AdminMemberPass;
  onCancel: (pass: AdminMemberPass) => void;
}) {
  const resend = useResendConfirmation();
  const paid = PAID.includes(pass.status);
  const open = paid || pass.status === "RESERVED";
  return (
    <li className="space-y-3 px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{pass.movie.title}</p>
          <p className="mt-0.5 text-sm text-white/55">
            {formatLagosDateTime(pass.startTime)} · {roomLabel(pass.tier)} ·{" "}
            <span className="font-mono">{pass.seatIdentifier}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge kind="ticket" status={pass.status} />
          <span className="text-sm tabular-nums">
            {pass.purchasePrice ? formatMoney(pass.purchasePrice, pass.currency) : "Guest seat"}
          </span>
        </div>
      </div>
      {pass.payments.length > 0 && (
        <ul className="space-y-1.5 rounded-lg bg-white/3 p-3 text-xs">
          {pass.payments.map((payment) => (
            <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-white/60">{payment.reference}</span>
              <span className="flex flex-wrap items-center gap-2">
                <StatusBadge kind="payment" status={payment.status} />
                {payment.refundReason && (
                  <span className="text-white/55">
                    {refundReasonLabel(payment.refundReason)}
                    {payment.refundedAt
                      ? `, refunded ${formatLagosDate(payment.refundedAt)}`
                      : ", refund due"}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <div className="flex flex-wrap gap-2">
          {paid && (
            <Button
              size="sm"
              variant="outline"
              disabled={resend.isPending}
              onClick={() =>
                resend.mutate(pass.id, {
                  onSuccess: () => toast.success("Booking email sent again"),
                  onError: (error) =>
                    toast.error(
                      toApiError(error).is(ErrorCode.PASS_NOT_CONFIRMED)
                        ? "Only confirmed passes have a booking email."
                        : "The email couldn't be sent. Try again.",
                    ),
                })
              }
            >
              <MailCheck data-icon="inline-start" />
              {resend.isPending ? "Sending…" : "Resend booking email"}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onCancel(pass)}>
            <XCircle data-icon="inline-start" />
            Cancel pass
          </Button>
        </div>
      )}
    </li>
  );
}

/** /admin/members/[id]: one member's account, passes and payments, and fixing a booking. */
export function MemberDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const member = useMember(id);
  return (
    <QueryView
      query={member}
      loading={
        <div className="space-y-6">
          <Skeleton className="h-10 w-2/3 max-w-md" />
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      }
      errorTitle="The member couldn't load"
      notFound={{ title: "We can't find that member" }}
      frame={(state) => (
        <>
          <PageHeader title="Member" crumbs={CRUMBS} />
          <Panel>{state}</Panel>
        </>
      )}
    >
      {(data) => <MemberDetail data={data} />}
    </QueryView>
  );
}

function MemberDetail({ data }: { data: AdminMember }) {
  const cancel = useCancelPass();
  const [cancelling, setCancelling] = useState<AdminMemberPass | null>(null);
  const paidPass = cancelling && PAID.includes(cancelling.status);

  return (
    <>
      <PageHeader
        title={data.publicScreenAlias ?? data.email}
        crumbs={CRUMBS}
        meta={<StatusBadge kind="role" status={data.role} />}
        description={data.publicScreenAlias ? data.email : undefined}
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="space-y-8">
          <Profile member={data} />
          <Panel flush title="Passes" description="The latest 50, newest first.">
            {data.passes.length === 0 ? (
              <EmptyState icon={Ticket} title="No passes yet" />
            ) : (
              <ul className="divide-y divide-white/8">
                {data.passes.map((pass) => (
                  <PassRow key={pass.id} pass={pass} onCancel={setCancelling} />
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <Panel flush title="Recent sign-ins">
          {data.recentSignIns.length === 0 ? (
            <EmptyState title="No sign-ins recorded" />
          ) : (
            <ul className="divide-y divide-white/8 text-sm">
              {data.recentSignIns.map((entry) => (
                <li
                  key={entry.timestamp}
                  className="flex items-start justify-between gap-3 px-5 py-3"
                >
                  <span className="min-w-0">
                    <span className="block">{browserSummary(entry.userAgent)}</span>
                    <span className="block text-xs text-white/45">
                      {entry.ipAddress ?? "Unknown address"} ·{" "}
                      {formatLagosDateTime(entry.timestamp)}
                    </span>
                  </span>
                  {entry.action === "USER_LOGIN_SUCCESS" ? (
                    <StatusBadge kind="payment" status="SUCCESS" label="Signed in" />
                  ) : (
                    <StatusBadge kind="payment" status="FAILED" label="Failed" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(open) => !open && setCancelling(null)}
        title={cancelling ? `Cancel pass ${cancelling.seatIdentifier}?` : ""}
        description={
          cancelling
            ? `${cancelling.movie.title}, ${formatLagosDateTime(cancelling.startTime)}`
            : undefined
        }
        consequences={[
          paidPass
            ? "Its payment goes on the refunds queue."
            : "It was never paid for, so nothing is owed back.",
          "The member is emailed your reason.",
          "This can't be undone.",
        ]}
        reason={{ label: "Reason (sent to the member)", min: 5, max: 500 }}
        confirmLabel="Cancel pass"
        pendingLabel="Cancelling…"
        tone="danger"
        onConfirm={async (reason) => {
          if (!cancelling) return;
          const result = await cancel.mutateAsync({ ticketId: cancelling.id, reason });
          toast.success(
            result.refundQueued > 0
              ? `Cancelled; ${formatMoney(result.refundQueued, cancelling.currency)} queued for refund`
              : "Cancelled",
          );
        }}
        explainError={(error) => {
          if (!error.is(ErrorCode.TICKET_NOT_CANCELLABLE)) return undefined;
          const guests = Number(error.details?.seatedGuests ?? 0);
          return guests > 0
            ? `${guests} ${guests === 1 ? "guest is" : "guests are"} seated in this suite: cancel their passes first, or cancel the showtime.`
            : "Only an active pass for a screening that hasn't ended can be cancelled.";
        }}
      />
    </>
  );
}
