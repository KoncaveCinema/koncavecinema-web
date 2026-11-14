"use client";

import { Check, Clapperboard, FilePlus2, Minus } from "lucide-react";
import Link from "next/link";

import { DataTable, type Column } from "@/components/data-table/data-table";
import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { StatusBadge } from "@/components/console/status-badge";
import { UrlSearch, UrlTabs, useSearchParam, useTabParam } from "@/components/console/url-controls";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/use-pagination";
import { formatLagosDateTime } from "@/lib/format";

import type { AdminFilmListItem } from "./api-types";
import { PosterThumb } from "./poster-thumb";
import { useFilms } from "./queries";

const STATUS_TABS = [
  { value: "all", label: "All films" },
  { value: "draft", label: "Drafts" },
  { value: "published", label: "Published" },
] as const;

const COLUMNS: Column<AdminFilmListItem>[] = [
  {
    id: "film",
    header: "Film",
    cell: (film) => (
      <span className="flex items-center gap-3">
        <PosterThumb src={film.posterPortrait} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{film.title}</span>
          <span className="block truncate text-xs font-normal text-white/45">
            {film.producerName}
          </span>
        </span>
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (film) => <StatusBadge kind="film" status={film.status} />,
  },
  {
    id: "certificate",
    header: "Certificate",
    cell: (film) =>
      film.certified ? (
        <span className="inline-flex items-center gap-1.5 text-lobby">
          <Check aria-hidden="true" className="size-4" /> Certified
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-gold">
          <Minus aria-hidden="true" className="size-4" /> Missing
        </span>
      ),
  },
  {
    id: "master",
    header: "Master",
    cell: (film) =>
      film.master ? (
        <StatusBadge
          kind="video"
          status={film.master.status}
          label={film.master.drmProtected ? "DRM · Ready" : undefined}
        />
      ) : (
        <StatusBadge kind="video" status="NONE" />
      ),
  },
  {
    id: "trailer",
    header: "Trailer",
    cell: (film) => <StatusBadge kind="video" status={film.trailer} />,
    hideOnMobile: true,
    // The film page shows it too; the table keeps room for sales on laptop screens
    className: "hidden 2xl:table-cell",
  },
  {
    id: "next",
    header: "Next showtime",
    cell: (film) =>
      film.nextShowtimeAt ? (
        <span className="whitespace-nowrap text-white/75">
          {formatLagosDateTime(film.nextShowtimeAt)}
        </span>
      ) : (
        <span className="text-white/35">None scheduled</span>
      ),
    hideOnMobile: true,
  },
  {
    id: "sold",
    header: "Passes sold",
    align: "end",
    cell: (film) => film.ticketsSold.toLocaleString("en-NG"),
  },
];

/** /admin/films: every film, drafts included, with what each still needs. */
export function FilmsPage() {
  const [status] = useTabParam("status", ["all", "draft", "published"] as const, "all");
  const [q, setQ] = useSearchParam();
  const pagination = usePagination();
  const films = useFilms({
    status: status === "all" ? undefined : status,
    q: q || undefined,
    ...pagination.query,
  });

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Films"
        description="Every film on Koncave, drafts included: its certificate, uploads and sales."
        actions={
          <Button asChild>
            <Link href="/admin/films/new">
              <FilePlus2 data-icon="inline-start" />
              New film
            </Link>
          </Button>
        }
      />
      <Panel flush>
        <div className="flex flex-col gap-3 border-b border-white/8 p-4 sm:flex-row sm:items-center sm:justify-between">
          <UrlTabs
            param="status"
            tabs={STATUS_TABS}
            fallback="all"
            label="Film status"
            className="border-0 px-0"
          />
          <UrlSearch label="Search films" placeholder="Title or producer" className="sm:w-72" />
        </div>
        <DataTable
          rows={films.data?.items}
          columns={COLUMNS}
          rowKey={(film) => film.id}
          rowHref={(film) => `/admin/films/${film.id}`}
          isLoading={films.isPending || films.isPlaceholderData}
          error={films.error}
          onRetry={() => void films.refetch()}
          caption="Films"
          empty={{
            icon: Clapperboard,
            title: "No films here yet",
            hint: "Start a draft to add a film.",
          }}
          filtered={
            q
              ? {
                  title: "No films match that search",
                  hint: "Try part of the title or the producer's name.",
                  onClear: () => void setQ(null),
                }
              : undefined
          }
          pagination={{ meta: films.data?.meta, state: pagination }}
        />
      </Panel>
    </>
  );
}
