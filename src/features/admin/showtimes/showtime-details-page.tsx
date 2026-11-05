"use client";

import { Ban, CalendarClock, Pencil } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";

import { ConfirmDialog } from "@/components/console/confirm-dialog";
import { DataTable } from "@/components/data-table/data-table";
import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { QueryView } from "@/components/states/query-view";
import { StatusBadge } from "@/components/console/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { roomLabel } from "@/features/admin/rooms";
import { ErrorCode } from "@/lib/api";
import { formatLagosDateTime, formatMoneyExact } from "@/lib/format";

import type { AdminShowtime, ShowtimeCancellation } from "./api-types";
import { useCancelShowtime, useShowtime } from "./queries";
import { ShowtimeDialog } from "./showtime-dialog";

const CRUMBS = [{ href: "/admin/showtimes", label: "Showtimes" }];

/** /admin/showtimes/[id]: one screening's rooms, suites and money; change or cancel it. */
export function ShowtimeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const showtime = useShowtime(id);
  return (
    <QueryView
      query={showtime}
      loading={
        <div className="space-y-6">
          <Skeleton className="h-10 w-2/3 max-w-md" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      }
      errorTitle="The showtime couldn't load"
      notFound={{ title: "We can't find that showtime" }}
      frame={(state) => (
        <>
          <PageHeader title="Showtime" crumbs={CRUMBS} />
          <Panel>{state}</Panel>
        </>
      )}
    >
      {(data) => <ShowtimeDetail data={data} onStale={() => void showtime.refetch()} />}
    </QueryView>
  );
}

function ShowtimeDetail({
  data,
  onStale,
}: {
  data: AdminShowtime;
  /** Someone else changed the screening meanwhile: load it again */
  onStale: () => void;
}) {
  const cancel = useCancelShowtime();
  const [editing, setEditing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [result, setResult] = useState<ShowtimeCancellation | null>(null);

  // The API says where the screening is; once it has started it can't change
  const started = data.state !== "UPCOMING";
  const cancelled = data.state === "CANCELLED";
  const revenue = [
    { label: "Payments", value: String(data.revenue.payments) },
    { label: "Gross", value: formatMoneyExact(data.revenue.gross, data.currency) },
    { label: "Gateway fees", value: formatMoneyExact(data.revenue.gatewayFees, data.currency) },
    {
      label: "Producer's share",
      value: formatMoneyExact(data.revenue.producerShare, data.currency),
    },
    {
      label: "Platform's share",
      value: formatMoneyExact(data.revenue.platformShare, data.currency),
    },
  ];

  return (
    <>
      <PageHeader
        title={data.movie.title}
        crumbs={CRUMBS}
        meta={<StatusBadge kind="showtime" status={data.state} />}
        description={
          <>
            {formatLagosDateTime(data.startTime, { year: true })} ·{" "}
            {formatMoneyExact(data.basePrice, data.currency)} base ·{" "}
            <Link href={`/admin/films/${data.movie.id}`} className="underline underline-offset-4">
              Film page
            </Link>
          </>
        }
        actions={
          !cancelled && (
            <>
              <Button
                variant="outline"
                disabled={started}
                title={started ? "It has started, so it can't change" : undefined}
                onClick={() => setEditing(true)}
              >
                <Pencil data-icon="inline-start" />
                Change
              </Button>
              <Button
                variant="destructive"
                disabled={started}
                title={started ? "It has started, so it can't be cancelled" : undefined}
                onClick={() => setCancelling(true)}
              >
                <Ban data-icon="inline-start" />
                Cancel screening
              </Button>
            </>
          )
        }
      />

      <div className="space-y-8">
        {cancelled && (
          <div role="status" className="rounded-2xl border border-brand/30 bg-brand/8 p-5 text-sm">
            <p className="font-semibold">
              Cancelled {data.cancelledAt && formatLagosDateTime(data.cancelledAt)}
            </p>
            {data.cancellationReason && (
              <p className="mt-1 text-white/70">
                Reason sent to buyers: “{data.cancellationReason}”
              </p>
            )}
            {result && (
              <p className="mt-3 text-white/80">
                {result.passesCancelled} {result.passesCancelled === 1 ? "pass" : "passes"}{" "}
                cancelled · {result.refundsQueued} refunds queued (
                {formatMoneyExact(result.refundTotal, result.currency)}) ·{" "}
                <Link href="/admin/refunds" className="font-semibold underline underline-offset-4">
                  Open the refunds queue
                </Link>
              </p>
            )}
          </div>
        )}

        <Panel flush title="Rooms" description="Paid passes and holds still running, by room.">
          <DataTable
            rows={data.tiers}
            rowKey={(row) => row.tier}
            caption="Sales by room"
            empty={{ title: "No rooms" }}
            columns={[
              { id: "room", header: "Room", cell: (row) => roomLabel(row.tier) },
              { id: "sold", header: "Sold", align: "end", cell: (row) => row.sold },
              { id: "holds", header: "On hold", align: "end", cell: (row) => row.holds },
            ]}
          />
        </Panel>

        <Panel flush title="Private suites" description="Each host's invite and who has joined.">
          <DataTable
            rows={data.suites}
            rowKey={(suite) => suite.id}
            caption="Private suites"
            empty={{ icon: CalendarClock, title: "No suites booked for this screening" }}
            columns={[
              {
                id: "code",
                header: "Invite code",
                cell: (suite) => (
                  <span className="font-mono tracking-wider">{suite.inviteCode}</span>
                ),
              },
              {
                id: "host",
                header: "Host",
                cell: (suite) => (
                  <Link href={`/admin/members/${suite.host.id}`} className="hover:underline">
                    {suite.host.publicScreenAlias ?? suite.host.email}
                    {suite.host.publicScreenAlias && (
                      <span className="block text-xs text-white/45">{suite.host.email}</span>
                    )}
                  </Link>
                ),
              },
              {
                id: "room",
                header: "Room",
                cell: (suite) => roomLabel(suite.tier),
                hideOnMobile: true,
              },
              {
                id: "seats",
                header: "Seats taken",
                align: "end",
                cell: (suite) => `${suite.seatsTaken} of ${suite.seats}`,
              },
            ]}
          />
        </Panel>

        <Panel title="Revenue" description="Kept revenue; payments owed back are left out.">
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {revenue.map((figure) => (
              <div key={figure.label}>
                <dt className="text-xs text-white/45">{figure.label}</dt>
                <dd className="mt-1.5 font-display text-lg font-black tabular-nums">
                  {figure.value}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <ShowtimeDialog open={editing} onOpenChange={setEditing} showtime={data} />
      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        title={`Cancel ${data.movie.title}, ${formatLagosDateTime(data.startTime)}?`}
        consequences={[
          "Every pass and hold is cancelled.",
          "Each buyer is emailed your reason, and their payment goes on the refunds queue.",
          "This can't be undone.",
        ]}
        reason={{
          label: "Reason (sent to buyers)",
          placeholder: "The producer has moved the premiere to a later date.",
          min: 5,
          max: 500,
        }}
        confirmLabel="Cancel screening"
        pendingLabel="Cancelling…"
        tone="danger"
        onConfirm={async (reason) => {
          setResult(await cancel.mutateAsync({ id: data.id, reason }));
        }}
        explainError={(error) => {
          if (error.is(ErrorCode.SHOWTIME_ALREADY_STARTED)) {
            return "This screening has started and can no longer be cancelled.";
          }
          if (error.is(ErrorCode.SHOWTIME_CANCELLED)) {
            onStale();
            return "It's already cancelled.";
          }
          return undefined;
        }}
      />
    </>
  );
}
