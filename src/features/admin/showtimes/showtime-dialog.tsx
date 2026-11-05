"use client";

import { cn } from "cn";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormAlert, fieldClass } from "@/features/auth/form-parts";
import { ErrorCode, toApiError } from "@/lib/api";
import { formatLagosDateTime, fromLagosInputs, lagosInputs } from "@/lib/format";

import { useFilm, useFilms } from "../films/queries";
import type { AdminShowtime } from "./api-types";
import { useCreateShowtime, useUpdateShowtime } from "./queries";

const CURRENCIES = ["NGN", "USD", "GBP", "EUR"];
const MINUTE = 60_000;

function refusal(code: string | undefined): string {
  switch (code) {
    case ErrorCode.MOVIE_NOT_PUBLISHED:
      return "Only published films can be scheduled. Publish the film first.";
    case ErrorCode.SHOWTIME_START_IN_PAST:
      return "Choose a start time in the future.";
    case ErrorCode.PRICE_OUT_OF_RANGE:
      return "In naira, the base price is between ₦2,500 and ₦10,000.";
    case ErrorCode.PRICE_LOCKED_AFTER_SALES:
      return "Passes have sold at this price, so it can't change now. The time still can.";
    case ErrorCode.SHOWTIME_COMPLETED:
      return "This screening has finished and can't be changed.";
    default:
      return "The showtime couldn't be saved. Try again.";
  }
}

const labelClass = "text-xs font-semibold tracking-wide text-white/80";

interface ShowtimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Schedules for this film (the film page); without it, the film is chosen here */
  filmId?: string;
  /** Edits this showtime instead of adding one */
  showtime?: AdminShowtime;
}

/**
 * Schedules a screening, or changes one that hasn't started. Staff type Lagos time; the API takes
 * the moment and works out the end from the film's runtime, which the dialog shows beforehand.
 */
export function ShowtimeDialog({ open, onOpenChange, filmId, showtime }: ShowtimeDialogProps) {
  const [pending, setPending] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="border border-white/10 bg-surface-1 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {showtime ? "Change showtime" : "Add showtime"}
          </DialogTitle>
          <DialogDescription className="text-white/55">
            Lagos time. The end is set from the film&rsquo;s runtime.
          </DialogDescription>
        </DialogHeader>
        {/* Inside the content, so the fields start afresh each time the dialog opens */}
        <ShowtimeForm
          filmId={filmId}
          showtime={showtime}
          onPendingChange={setPending}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function ShowtimeForm({
  filmId,
  showtime,
  onPendingChange,
  onDone,
}: Pick<ShowtimeDialogProps, "filmId" | "showtime"> & {
  onPendingChange: (pending: boolean) => void;
  onDone: () => void;
}) {
  const films = useFilms({ status: "published" });
  const create = useCreateShowtime();
  const update = useUpdateShowtime();
  const start = showtime ? lagosInputs(showtime.startTime) : { date: "", time: "20:00" };
  const [movieId, setMovieId] = useState(showtime?.movie.id ?? filmId ?? "");
  const [date, setDate] = useState(start.date);
  const [time, setTime] = useState(start.time);
  const [price, setPrice] = useState(String(showtime?.basePrice ?? 5000));
  const [currency, setCurrency] = useState(showtime?.currency ?? "NGN");
  const [failure, setFailure] = useState<string | null>(null);

  const pending = create.isPending || update.isPending;
  const chosen = useFilm(showtime ? "" : movieId);
  const startsAt = date && time ? fromLagosInputs(date, time) : null;
  const runtime = showtime
    ? (Date.parse(showtime.endTime) - Date.parse(showtime.startTime)) / MINUTE
    : chosen.data?.durationMinutes;
  const amount = Number(price);
  const complete = Boolean(movieId && startsAt && amount > 0);

  async function save() {
    if (!complete || !startsAt) return;
    setFailure(null);
    onPendingChange(true);
    try {
      if (showtime) {
        await update.mutateAsync({
          id: showtime.id,
          input: { startTime: startsAt, basePrice: amount, currency },
        });
        toast.success("Showtime updated");
      } else {
        await create.mutateAsync({ movieId, startTime: startsAt, basePrice: amount, currency });
        toast.success("Showtime added");
      }
      onDone();
    } catch (error) {
      setFailure(refusal(toApiError(error).code));
    } finally {
      onPendingChange(false);
    }
  }

  return (
    <>
      <form
        id="showtime-form"
        noValidate
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        {!showtime && !filmId && (
          <div>
            <label htmlFor="st-film" className={labelClass}>
              Film
            </label>
            <select
              id="st-film"
              value={movieId}
              onChange={(event) => setMovieId(event.target.value)}
              className={cn(fieldClass, "mt-2 appearance-none bg-surface-1")}
            >
              <option value="">Choose a published film</option>
              {films.data?.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="st-date" className={labelClass}>
              Date
            </label>
            <input
              id="st-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={cn(fieldClass, "mt-2 [color-scheme:dark]")}
            />
          </div>
          <div>
            <label htmlFor="st-time" className={labelClass}>
              Starts (WAT)
            </label>
            <input
              id="st-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className={cn(fieldClass, "mt-2 [color-scheme:dark]")}
            />
          </div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-4">
          <div>
            <label htmlFor="st-price" className={labelClass}>
              Base price
            </label>
            <input
              id="st-price"
              type="number"
              inputMode="decimal"
              min={1}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className={cn(fieldClass, "mt-2")}
            />
            <p className="mt-1.5 text-xs text-white/45">
              Per seat, before fees. ₦2,500 to ₦10,000.
            </p>
          </div>
          <div>
            <label htmlFor="st-currency" className={labelClass}>
              Currency
            </label>
            <select
              id="st-currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className={cn(fieldClass, "mt-2 appearance-none bg-surface-1")}
            >
              {CURRENCIES.map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
          </div>
        </div>
        {startsAt && runtime && (
          <p className="rounded-lg bg-white/4 px-3 py-2 text-xs text-white/60">
            Ends{" "}
            {formatLagosDateTime(new Date(Date.parse(startsAt) + runtime * MINUTE).toISOString())}
          </p>
        )}
        {failure && <FormAlert>{failure}</FormAlert>}
      </form>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" form="showtime-form" disabled={!complete || pending}>
          {pending ? "Saving…" : showtime ? "Save changes" : "Add showtime"}
        </Button>
      </DialogFooter>
    </>
  );
}
