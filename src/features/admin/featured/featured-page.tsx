"use client";

import {
  ArrowDown,
  ArrowUp,
  CalendarPlus,
  LoaderCircle,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { useFeatured, useRemovePlacement, useSetFeaturedLineup } from "@/api/admin/featured-api";
import type { FeaturedPlacement } from "@/api/admin/featured-schemas";
import { ALL_FILMS, useFilms } from "@/api/admin/films-api";
import type { AdminFilmListItem } from "@/api/admin/films-schemas";
import { ConfirmDialog } from "@/components/console/confirm-dialog";
import { PageHeader } from "@/components/console/page-header";
import { Panel } from "@/components/console/panel";
import { SearchSelect } from "@/components/console/pickers";
import { DataTable } from "@/components/data-table/data-table";
import { EmptyState, ErrorState } from "@/components/states/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLagosDateTime } from "@/lib/format";

import { PosterThumb } from "../films/poster-thumb";
import { useStaffSignedIn } from "../require-staff";
import { FEATURED_MAX, featuredRefusal, hiddenText, moveInLineup } from "./featured";
import { PlacementDialog } from "./placement-dialog";

/** Live, or why not, beside each placement */
function Visibility({ placement }: { placement: FeaturedPlacement }) {
  const hidden = hiddenText(placement);
  return hidden ? (
    <span className="text-xs text-gold">{hidden}</span>
  ) : (
    <span className="text-xs text-lobby">On the home page</span>
  );
}

/** Films that can be featured: announced or published */
function publicFilms(films: AdminFilmListItem[] | undefined) {
  return (films ?? [])
    .filter((film) => film.status !== "DRAFT")
    .map((film) => ({ value: film.id, label: film.title }));
}

/** The standing lineup, in order, reordered and edited in place; each change saves at once */
function Lineup({
  filmsLoading,
  placements,
  films,
}: {
  placements: FeaturedPlacement[];
  films: { value: string; label: string }[];
  filmsLoading: boolean;
}) {
  const setLineup = useSetFeaturedLineup();
  const [adding, setAdding] = useState("");
  const [removing, setRemoving] = useState<FeaturedPlacement | null>(null);
  // The button pressed, which spins while the others wait
  const [pressed, setPressed] = useState<string | null>(null);
  const ids = placements.map((placement) => placement.film.id);
  const save = (next: string[], done: string, button: string) => {
    setPressed(button);
    setLineup.mutate(next, {
      onSuccess: () => toast.success(done),
      onError: (error) => toast.error(featuredRefusal(error)),
      onSettled: () => setPressed(null),
    });
  };
  const icon = (button: string, idle: ReactNode) =>
    pressed === button ? <LoaderCircle className="animate-spin" /> : idle;
  const addable = films.filter((film) => !ids.includes(film.value));

  return (
    <Panel
      title="Everyday lineup"
      description="The standing order on the home page. Films without a screening open are skipped until one is."
      flush
    >
      {placements.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No everyday lineup"
          hint="Without one, the home page shows the published films screening soonest."
        />
      ) : (
        <ol className="divide-y divide-white/8">
          {placements.map((placement, index) => (
            <li key={placement.id} className="flex items-center gap-4 px-6 py-3.5">
              <span className="w-5 shrink-0 text-center font-display text-lg font-black text-white/40 tabular-nums">
                {index + 1}
              </span>
              <PosterThumb src={placement.film.posterPortrait} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{placement.film.title}</span>
                <Visibility placement={placement} />
              </span>
              <span className="flex shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Move ${placement.film.title} up`}
                  disabled={index === 0 || setLineup.isPending}
                  onClick={() =>
                    save(
                      moveInLineup(ids, placement.film.id, -1),
                      "Lineup reordered",
                      `up:${placement.id}`,
                    )
                  }
                >
                  {icon(`up:${placement.id}`, <ArrowUp />)}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Move ${placement.film.title} down`}
                  disabled={index === placements.length - 1 || setLineup.isPending}
                  onClick={() =>
                    save(
                      moveInLineup(ids, placement.film.id, 1),
                      "Lineup reordered",
                      `down:${placement.id}`,
                    )
                  }
                >
                  {icon(`down:${placement.id}`, <ArrowDown />)}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${placement.film.title} from the lineup`}
                  disabled={setLineup.isPending}
                  onClick={() => setRemoving(placement)}
                >
                  <Trash2 />
                </Button>
              </span>
            </li>
          ))}
        </ol>
      )}

      {placements.length < FEATURED_MAX && (
        <div className="flex flex-col gap-3 border-t border-white/8 p-4 sm:flex-row">
          <SearchSelect
            label="Film to add"
            value={adding}
            onChange={setAdding}
            options={addable}
            loading={filmsLoading}
            placeholder="Choose a film to add"
            searchPlaceholder="Search announced and published films"
            emptyText="No other announced or published film by that name."
            className="h-10 flex-1"
          />
          <Button
            disabled={!adding || setLineup.isPending}
            onClick={() => {
              save([...ids, adding], "Added to the lineup", "add");
              setAdding("");
            }}
          >
            {pressed === "add" && (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            )}
            {pressed === "add" ? "Adding…" : "Add to the lineup"}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Take ${removing?.film.title ?? "this film"} out of the lineup?`}
        description="The films below it move up a place."
        confirmLabel="Remove"
        pendingLabel="Removing…"
        onConfirm={async () => {
          if (!removing) return;
          await setLineup.mutateAsync(ids.filter((id) => id !== removing.film.id));
          toast.success("Removed from the lineup");
        }}
        explainError={(error) => featuredRefusal(error)}
      />
    </Panel>
  );
}

/** Placements with an end: each takes its position over while it runs (a premiere, a sponsor) */
function Dated({
  filmsLoading,
  placements,
  films,
}: {
  placements: FeaturedPlacement[];
  films: { value: string; label: string }[];
  filmsLoading: boolean;
}) {
  const remove = useRemovePlacement();
  const [editing, setEditing] = useState<FeaturedPlacement | "new" | null>(null);
  const [removing, setRemoving] = useState<FeaturedPlacement | null>(null);

  return (
    <Panel
      title="Dated placements"
      description="Each takes its position over from the lineup while it runs, then hands it back."
      flush
      actions={
        <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
          <CalendarPlus data-icon="inline-start" />
          Add a dated placement
        </Button>
      }
    >
      <DataTable
        rows={placements}
        rowKey={(placement) => placement.id}
        caption="Dated placements"
        empty={{
          icon: CalendarPlus,
          title: "Nothing dated",
          hint: "Add one to put a film in a position for a set time, such as a premiere week.",
        }}
        columns={[
          {
            id: "film",
            header: "Film",
            cell: (placement) => (
              <span className="flex items-center gap-3">
                <PosterThumb src={placement.film.posterPortrait} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{placement.film.title}</span>
                  <Visibility placement={placement} />
                </span>
              </span>
            ),
          },
          {
            id: "position",
            header: "Position",
            align: "end",
            cell: (placement) => placement.position,
          },
          {
            id: "runs",
            header: "Runs",
            cell: (placement) => (
              <span className="text-xs whitespace-nowrap text-white/70">
                {formatLagosDateTime(placement.startsAt)}
                <br />
                to {placement.endsAt ? formatLagosDateTime(placement.endsAt) : "no end"}
              </span>
            ),
          },
          {
            id: "actions",
            header: "Actions",
            align: "end",
            cell: (placement) => (
              <span className="flex justify-end gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Change ${placement.film.title}'s placement`}
                  onClick={() => setEditing(placement)}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${placement.film.title}'s placement`}
                  onClick={() => setRemoving(placement)}
                >
                  <Trash2 />
                </Button>
              </span>
            ),
          },
        ]}
      />

      <PlacementDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        placement={editing === "new" ? undefined : (editing ?? undefined)}
        films={films}
        filmsLoading={filmsLoading}
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.film.title ?? "this film"}'s placement?`}
        description="Its position goes back to the everyday lineup."
        confirmLabel="Remove"
        pendingLabel="Removing…"
        tone="danger"
        onConfirm={async () => {
          if (!removing) return;
          await remove.mutateAsync(removing.id);
          toast.success("Placement removed");
        }}
        explainError={(error) => featuredRefusal(error)}
      />
    </Panel>
  );
}

/** /admin/featured: the films at the top of the home page, standing and dated */
export function FeaturedPage() {
  const signedIn = useStaffSignedIn();
  const featured = useFeatured(signedIn);
  const filmList = useFilms(ALL_FILMS, signedIn);
  const films = publicFilms(filmList.data?.items);
  const placements = featured.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Featured films"
        description="The hero at the top of the home page: up to five films, in order."
      />
      {featured.isPending ? (
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : featured.isError ? (
        <ErrorState
          title="The featured films couldn't load"
          onRetry={() => void featured.refetch()}
        />
      ) : (
        <div className="space-y-8">
          <Lineup
            placements={placements.filter((placement) => placement.kind === "EVERYDAY")}
            films={films}
            filmsLoading={filmList.isPending}
          />
          <Dated
            placements={placements.filter((placement) => placement.kind === "DATED")}
            films={films}
            filmsLoading={filmList.isPending}
          />
        </div>
      )}
    </>
  );
}
