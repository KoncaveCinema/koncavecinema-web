"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import {
  CalendarPlus,
  Check,
  Circle,
  ExternalLink,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/console/confirm-dialog";
import { DataTable } from "@/components/data-table/data-table";
import { OnThisPage } from "@/components/console/on-this-page";
import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { QueryView } from "@/components/states/query-view";
import { StatusBadge } from "@/components/console/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldError, FormAlert, fieldClass } from "@/features/auth/form-parts";
import { ErrorCode, toApiError } from "@/api";
import {
  formatLagosDateTime,
  formatMoney,
  formatRuntime,
  ratingDescription,
  ratingLabel,
} from "@/lib/format";

import { ShowtimeDialog } from "../showtimes/showtime-dialog";
import type { AdminFilm } from "@/api/admin/films-schemas";
import { FilmForm } from "./film-form";
import { MediaPanel } from "./media-panel";
import { PostersPanel } from "./posters-panel";
import {
  useAnnounceFilm,
  useDeleteFilm,
  useFilm,
  usePublishFilm,
  useSetCertificate,
  useUnpublishFilm,
  useUpdateFilm,
} from "@/api/admin/films-api";
import { certificateSchema, type CertificateValues } from "./schemas";
import { useStaffSignedIn } from "../require-staff";

const CRUMBS = [{ href: "/admin/films", label: "Films" }];

const SECTIONS = [
  { id: "readiness", label: "Readiness" },
  { id: "details", label: "Details" },
  { id: "certificate", label: "Certificate" },
  { id: "posters", label: "Posters" },
  { id: "media", label: "Media" },
  { id: "showtimes", label: "Showtimes" },
  { id: "revenue", label: "Revenue" },
];

/**
 * What the API checks, in two steps: announcing (coming soon) needs the trailer and both posters;
 * publishing needs those and the certificate and master. The buttons follow the API's own
 * canAnnounce and canPublish; these only say what is missing.
 */
export function readinessGroups(film: Pick<AdminFilm, "readiness">) {
  const { readiness } = film;
  return [
    {
      title: "To announce",
      hint: "Coming soon: a public page and trailer, no screenings yet.",
      items: [
        { done: readiness.trailer, label: "Trailer attached", href: "#media" },
        { done: readiness.posters, label: "Landscape and portrait posters", href: "#posters" },
      ],
    },
    {
      title: "Also to publish",
      hint: "On sale: screenings can be added and booked.",
      items: [
        { done: readiness.certified, label: "NFVCB certificate", href: "#certificate" },
        { done: readiness.masterAttached, label: "Master video attached", href: "#media" },
      ],
    },
  ];
}

/** Where the film stands, in one line under the checklist's title */
export function readinessSummary(film: Pick<AdminFilm, "status" | "readiness">): string {
  const left = (index: number) =>
    readinessGroups(film)
      .slice(0, index + 1)
      .flatMap((group) => group.items)
      .filter((item) => !item.done).length;
  const things = (count: number) => `${count} ${count === 1 ? "thing" : "things"}`;
  if (film.status === "PUBLISHED") return "Published and on sale.";
  if (film.readiness.canPublish) {
    return film.status === "COMING_SOON"
      ? "Announced, and everything's in place to publish."
      : "Everything's in place. Announce it or publish it when you're ready.";
  }
  if (film.status === "COMING_SOON")
    return `Announced as coming soon. ${things(left(1))} to do before publishing.`;
  if (film.readiness.canAnnounce) return `Ready to announce. ${things(left(1))} more to publish.`;
  return `${things(left(0))} to do before announcing.`;
}

/** The API's refusal of an announce or a publish, in words */
function releaseRefusal(code: string | undefined, action: "announced" | "published") {
  switch (code) {
    case ErrorCode.MOVIE_NOT_CERTIFIED:
      return "Add the NFVCB certificate first.";
    case ErrorCode.MOVIE_MISSING_MASTER_ASSET:
      return "Attach a processed master video first.";
    case ErrorCode.MOVIE_MISSING_TRAILER:
      return "Attach a trailer first.";
    case ErrorCode.MOVIE_MISSING_POSTERS:
      return "Upload both posters first.";
    default:
      return `The film couldn't be ${action}. Try again.`;
  }
}

function Readiness({ film }: { film: AdminFilm }) {
  return (
    <Panel id="readiness" title="Readiness" description={readinessSummary(film)}>
      <div className="space-y-5">
        {readinessGroups(film).map((group) => (
          <section key={group.title} aria-label={group.title}>
            <p className="text-xs font-semibold tracking-wide text-white/70">{group.title}</p>
            <p className="mt-0.5 text-xs text-white/45">{group.hint}</p>
            <ReadinessList items={group.items} />
          </section>
        ))}
      </div>
    </Panel>
  );
}

function ReadinessList({ items }: { items: { done: boolean; label: string; href: string }[] }) {
  return (
    <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.label}>
          <a
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
              item.done
                ? "border-lobby/20 bg-lobby/5 text-white/80"
                : "border-gold/25 bg-gold/5 hover:border-gold/45",
            )}
          >
            {item.done ? (
              <Check aria-hidden="true" className="size-4 shrink-0 text-lobby" />
            ) : (
              <Circle aria-hidden="true" className="size-4 shrink-0 text-gold" />
            )}
            <span className="flex-1">{item.label}</span>
            <span className="sr-only">{item.done ? "done" : "to do"}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Details({ film }: { film: AdminFilm }) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateFilm();
  const rows = [
    { label: "Synopsis", value: film.synopsis, wide: true },
    { label: "Runtime", value: formatRuntime(film.durationMinutes) },
    {
      label: "Rating",
      value: `${ratingLabel(film.ageRating)} · ${ratingDescription(film.ageRating)}`,
    },
    { label: "Producer", value: film.producerName },
    {
      label: "Producer's share",
      value: `${Number(film.producerRevenueSplit)}% of the base box office`,
    },
    {
      label: "Watermark",
      value: film.watermarkMode.charAt(0) + film.watermarkMode.slice(1).toLowerCase(),
    },
    { label: "Link", value: `/movies/${film.slug}` },
  ];
  return (
    <Panel
      id="details"
      title="Details"
      actions={
        !editing && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil data-icon="inline-start" />
            Edit
          </Button>
        )
      }
    >
      {editing ? (
        <FilmForm
          initial={{
            title: film.title,
            synopsis: film.synopsis,
            durationMinutes: film.durationMinutes,
            ageRating: film.ageRating,
            producerName: film.producerName,
            producerRevenueSplit: Number(film.producerRevenueSplit),
            watermarkMode: film.watermarkMode,
          }}
          splitLocked={film.producerSplitLocked}
          submitLabel="Save details"
          pendingLabel="Saving…"
          onCancel={() => setEditing(false)}
          onSubmit={async (input) => {
            await update.mutateAsync({ id: film.id, input });
            setEditing(false);
            toast.success("Details saved");
          }}
        />
      ) : (
        <dl className="grid gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className={row.wide ? "sm:col-span-2" : undefined}>
              <dt className="text-xs text-white/45">{row.label}</dt>
              <dd className="mt-1 text-pretty text-white/85">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Panel>
  );
}

function Certificate({ film }: { film: AdminFilm }) {
  const save = useSetCertificate();
  const [failure, setFailure] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CertificateValues>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      nfvcbCertNumber: film.nfvcbCertNumber ?? "",
      nfvcbCertUrl: film.nfvcbCertUrl ?? "",
    },
  });

  return (
    <Panel
      id="certificate"
      title="NFVCB certificate"
      description="Nigerian law requires a classification certificate before a film is exhibited."
    >
      <form
        noValidate
        className="grid gap-5 sm:grid-cols-2"
        onSubmit={handleSubmit(async (values) => {
          setFailure(null);
          try {
            await save.mutateAsync({ id: film.id, input: values });
            toast.success("Certificate saved");
          } catch (error) {
            setFailure(
              toApiError(error).is(ErrorCode.CERTIFICATE_ALREADY_BOUND, ErrorCode.CONFLICT)
                ? "Another film already has this certificate number. Check it against the document."
                : "The certificate couldn't be saved. Try again.",
            );
          }
        })}
      >
        <div>
          <label
            htmlFor="cert-number"
            className="text-xs font-semibold tracking-wide text-white/80"
          >
            Certificate number
          </label>
          <input
            id="cert-number"
            placeholder="NFVCB/2026/CAT-A/09841"
            {...register("nfvcbCertNumber")}
            aria-invalid={Boolean(errors.nfvcbCertNumber)}
            className={cn(fieldClass, "mt-2 font-mono uppercase")}
          />
          <FieldError message={errors.nfvcbCertNumber?.message} />
        </div>
        <div>
          <label htmlFor="cert-url" className="text-xs font-semibold tracking-wide text-white/80">
            Link to the certificate
          </label>
          <input
            id="cert-url"
            type="url"
            placeholder="https://…"
            {...register("nfvcbCertUrl")}
            aria-invalid={Boolean(errors.nfvcbCertUrl)}
            className={cn(fieldClass, "mt-2")}
          />
          <FieldError message={errors.nfvcbCertUrl?.message} />
        </div>
        {failure && (
          <div className="sm:col-span-2">
            <FormAlert>{failure}</FormAlert>
          </div>
        )}
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting
              ? "Saving…"
              : film.nfvcbCertNumber
                ? "Update certificate"
                : "Save certificate"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function Showtimes({ film }: { film: AdminFilm }) {
  const [adding, setAdding] = useState(false);
  return (
    <Panel
      id="showtimes"
      flush
      title="Showtimes"
      actions={
        film.status === "PUBLISHED" && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <CalendarPlus data-icon="inline-start" />
            Add showtime
          </Button>
        )
      }
    >
      <DataTable
        rows={film.showtimes}
        rowKey={(showtime) => showtime.id}
        rowHref={(showtime) => `/admin/showtimes/${showtime.id}`}
        caption="Showtimes"
        empty={{
          icon: CalendarPlus,
          title: "Not scheduled yet",
          hint:
            film.status === "PUBLISHED"
              ? "Add the first showtime to put this film on sale."
              : "Showtimes are added once the film is published.",
        }}
        columns={[
          {
            id: "start",
            header: "Starts",
            cell: (showtime) => (
              <span className="whitespace-nowrap">{formatLagosDateTime(showtime.startTime)}</span>
            ),
          },
          {
            id: "state",
            header: "State",
            cell: (showtime) => <StatusBadge kind="showtime" status={showtime.state} />,
          },
          {
            id: "price",
            header: "Base price",
            align: "end",
            cell: (showtime) => formatMoney(showtime.basePrice, showtime.currency),
          },
          { id: "sold", header: "Sold", align: "end", cell: (showtime) => showtime.ticketsSold },
        ]}
      />
      <ShowtimeDialog open={adding} onOpenChange={setAdding} filmId={film.id} />
    </Panel>
  );
}

function Revenue({ film }: { film: AdminFilm }) {
  const figures = [
    { label: "Gross collected", value: film.revenue.gross },
    { label: "Gateway fees", value: film.revenue.gatewayFees },
    { label: "Producer's share", value: film.revenue.producerShare },
    { label: "Platform's share", value: film.revenue.platformShare },
  ];
  return (
    <Panel
      id="revenue"
      title="Revenue"
      description="Kept revenue to date; payments that require a refund are left out."
    >
      <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {figures.map((figure) => (
          <div key={figure.label}>
            <dt className="text-xs text-white/45">{figure.label}</dt>
            <dd className="mt-1.5 font-display text-xl font-black tabular-nums">
              {formatMoney(figure.value)}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function FilmSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-2/3 max-w-md" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

/** /admin/films/[id]: one film, from readiness to revenue, edited where it's shown. */
export function FilmDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const film = useFilm(id, useStaffSignedIn());
  return (
    <QueryView
      query={film}
      loading={<FilmSkeleton />}
      errorTitle="The film couldn't load"
      notFound={{
        title: "We can't find that film",
        hint: "It may have been deleted.",
        action: (
          <Button asChild>
            <Link href="/admin/films">All films</Link>
          </Button>
        ),
      }}
      frame={(state) => (
        <>
          <PageHeader title="Film" crumbs={CRUMBS} />
          <Panel>{state}</Panel>
        </>
      )}
    >
      {(data) => <FilmDetail data={data} />}
    </QueryView>
  );
}

function FilmDetail({ data }: { data: AdminFilm }) {
  const router = useRouter();
  const announce = useAnnounceFilm();
  const publish = usePublishFilm();
  const unpublish = useUnpublishFilm();
  const remove = useDeleteFilm();
  const [confirm, setConfirm] = useState<"unpublish" | "delete" | null>(null);

  const released = data.status !== "DRAFT";
  const deletable = !released && data.showtimes.length === 0;
  const { canAnnounce, canPublish } = data.readiness;

  return (
    <>
      <PageHeader
        title={data.title}
        crumbs={CRUMBS}
        meta={<StatusBadge kind="film" status={data.status} />}
        description={`${data.producerName} · ${formatRuntime(data.durationMinutes)} · ${ratingLabel(data.ageRating)}`}
        actions={
          <>
            {released && (
              <Button asChild variant="outline">
                <Link href={`/movies/${data.slug}`} target="_blank">
                  <ExternalLink data-icon="inline-start" />
                  View on site
                </Link>
              </Button>
            )}
            {data.status === "DRAFT" && (
              <Button
                variant="outline"
                disabled={!canAnnounce || announce.isPending}
                title={canAnnounce ? undefined : "Attach the trailer and both posters first"}
                onClick={() =>
                  announce.mutate(data.id, {
                    onSuccess: () => toast.success(`${data.title} is announced as coming soon`),
                    onError: (error) =>
                      toast.error(releaseRefusal(toApiError(error).code, "announced")),
                  })
                }
              >
                <Megaphone data-icon="inline-start" />
                {announce.isPending ? "Announcing…" : "Announce"}
              </Button>
            )}
            {data.status !== "PUBLISHED" && (
              <Button
                disabled={!canPublish || publish.isPending}
                title={canPublish ? undefined : "Finish the readiness checklist first"}
                onClick={() =>
                  publish.mutate(data.id, {
                    onSuccess: () => toast.success(`${data.title} is published`),
                    onError: (error) =>
                      toast.error(releaseRefusal(toApiError(error).code, "published")),
                  })
                }
              >
                <Rocket data-icon="inline-start" />
                {publish.isPending ? "Publishing…" : "Publish"}
              </Button>
            )}
            {(released || deletable) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="More actions">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {released ? (
                    <DropdownMenuItem onSelect={() => setConfirm("unpublish")}>
                      Take down
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("delete")}>
                      Delete draft
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        }
      />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_11rem] lg:gap-10">
        <div className="space-y-8">
          <Readiness film={data} />
          <Details film={data} />
          <Certificate film={data} />
          <PostersPanel film={data} />
          <MediaPanel film={data} />
          <Showtimes film={data} />
          <Revenue film={data} />
        </div>
        <OnThisPage sections={SECTIONS} />
      </div>

      <ConfirmDialog
        open={confirm === "unpublish"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Take ${data.title} down?`}
        description={
          data.status === "PUBLISHED"
            ? "It leaves the catalogue and goes back to draft: nobody can find or book it."
            : "Its coming-soon page goes, and it goes back to draft."
        }
        consequences={[
          "Past screenings and their sales are kept.",
          "You can announce or publish it again at any time.",
        ]}
        confirmLabel="Take down"
        pendingLabel="Taking down…"
        onConfirm={async () => {
          await unpublish.mutateAsync(data.id);
          toast.success(`${data.title} is back to draft`);
        }}
        explainError={(error) =>
          error.is(ErrorCode.MOVIE_HAS_ACTIVE_SALES) ? (
            <>
              Members hold {String(error.details?.paidPasses ?? "some")} paid passes for screenings
              still to come. Cancel those showtimes first.{" "}
              <a
                href="#showtimes"
                onClick={() => setConfirm(null)}
                className="underline underline-offset-4"
              >
                See its showtimes
              </a>
            </>
          ) : undefined
        }
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Delete ${data.title}?`}
        description="This draft was never scheduled, so it can be removed completely."
        consequences={[
          "Its uploads are deleted at Mux.",
          "Its posters are deleted from the image host.",
          "This can't be undone.",
        ]}
        confirmLabel="Delete draft"
        pendingLabel="Deleting…"
        tone="danger"
        onConfirm={async () => {
          await remove.mutateAsync(data.id);
          toast.success("Draft deleted");
          router.push("/admin/films");
        }}
      />
    </>
  );
}
