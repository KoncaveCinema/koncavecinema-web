// Client component: import it from client modules only (they are the client boundary, so
// its function props never cross from the server).

import { useState } from "react";
import { toast } from "sonner";

import { DatePicker, OptionSelect, SearchSelect, TimeSelect } from "@/components/console/pickers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreatePlacement, useUpdatePlacement } from "@/api/admin/featured-api";
import type { FeaturedPlacement } from "@/api/admin/featured-schemas";
import { FormAlert } from "@/features/auth/form-parts";
import { fromLagosInputs, lagosInputs } from "@/lib/format";

import { FEATURED_MAX, featuredRefusal } from "./featured";

const labelClass = "text-xs font-semibold tracking-wide text-white/80";
const POSITIONS = Array.from({ length: FEATURED_MAX }, (_, index) => ({
  value: String(index + 1),
  label: index === 0 ? "1 (first)" : String(index + 1),
}));

interface PlacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Changes this placement instead of adding one */
  placement?: FeaturedPlacement;
  films: { value: string; label: string }[];
}

/** A dated placement: a film in a position from one Lagos time to another */
export function PlacementDialog({ open, onOpenChange, placement, films }: PlacementDialogProps) {
  const [pending, setPending] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="border border-white/10 bg-surface-1 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {placement ? "Change the placement" : "Add a dated placement"}
          </DialogTitle>
          <DialogDescription className="text-white/55">
            Lagos time. It takes its position over from the lineup while it runs.
          </DialogDescription>
        </DialogHeader>
        {/* Inside the content, so the fields start afresh each time the dialog opens */}
        <PlacementForm
          placement={placement}
          films={films}
          onPendingChange={setPending}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function PlacementForm({
  placement,
  films,
  onPendingChange,
  onDone,
}: Pick<PlacementDialogProps, "placement" | "films"> & {
  onPendingChange: (pending: boolean) => void;
  onDone: () => void;
}) {
  const create = useCreatePlacement();
  const update = useUpdatePlacement();
  const starts = placement ? lagosInputs(placement.startsAt) : { date: "", time: "00:00" };
  const ends = placement?.endsAt ? lagosInputs(placement.endsAt) : { date: "", time: "00:00" };
  const [movieId, setMovieId] = useState(placement?.film.id ?? "");
  const [position, setPosition] = useState(String(placement?.position ?? 1));
  const [startDate, setStartDate] = useState(starts.date);
  const [startTime, setStartTime] = useState(starts.time);
  const [endDate, setEndDate] = useState(ends.date);
  const [endTime, setEndTime] = useState(ends.time);
  const [failure, setFailure] = useState<string | null>(null);

  const startsAt = startDate && startTime ? fromLagosInputs(startDate, startTime) : null;
  const endsAt = endDate && endTime ? fromLagosInputs(endDate, endTime) : null;
  const backwards = startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt);
  const complete = Boolean(movieId && startsAt && endsAt && !backwards);
  const pending = create.isPending || update.isPending;

  async function save() {
    if (!complete || !startsAt || !endsAt) return;
    setFailure(null);
    onPendingChange(true);
    const input = { position: Number(position), startsAt, endsAt };
    try {
      if (placement) {
        await update.mutateAsync({ id: placement.id, input });
        toast.success("Placement changed");
      } else {
        await create.mutateAsync({ movieId, ...input });
        toast.success("Placement added");
      }
      onDone();
    } catch (error) {
      setFailure(featuredRefusal(error));
    } finally {
      onPendingChange(false);
    }
  }

  return (
    <>
      <form
        id="placement-form"
        noValidate
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        {!placement && (
          <div>
            <label htmlFor="fp-film" className={labelClass}>
              Film
            </label>
            <SearchSelect
              id="fp-film"
              value={movieId}
              onChange={setMovieId}
              options={films}
              placeholder="Choose an announced or published film"
              searchPlaceholder="Search films"
              emptyText="No announced or published film by that name."
              className="mt-2"
            />
          </div>
        )}
        <div>
          <label htmlFor="fp-position" className={labelClass}>
            Position
          </label>
          <OptionSelect
            id="fp-position"
            value={position}
            onChange={setPosition}
            options={POSITIONS}
            className="mt-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fp-start-date" className={labelClass}>
              Starts
            </label>
            <DatePicker
              id="fp-start-date"
              value={startDate}
              onChange={setStartDate}
              className="mt-2"
            />
          </div>
          <div>
            <label htmlFor="fp-start-time" className={labelClass}>
              At (WAT)
            </label>
            <TimeSelect
              id="fp-start-time"
              value={startTime}
              onChange={setStartTime}
              className="mt-2"
            />
          </div>
          <div>
            <label htmlFor="fp-end-date" className={labelClass}>
              Ends
            </label>
            <DatePicker
              id="fp-end-date"
              value={endDate}
              onChange={setEndDate}
              disabled={startDate ? { before: new Date(`${startDate}T00:00`) } : undefined}
              className="mt-2"
            />
          </div>
          <div>
            <label htmlFor="fp-end-time" className={labelClass}>
              At (WAT)
            </label>
            <TimeSelect id="fp-end-time" value={endTime} onChange={setEndTime} className="mt-2" />
          </div>
        </div>
        {backwards && <FormAlert>The end has to come after the start.</FormAlert>}
        {failure && <FormAlert>{failure}</FormAlert>}
      </form>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" form="placement-form" disabled={!complete || pending}>
          {pending ? "Saving…" : placement ? "Save changes" : "Add placement"}
        </Button>
      </DialogFooter>
    </>
  );
}
