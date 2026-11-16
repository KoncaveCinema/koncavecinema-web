import { ErrorCode, toApiError } from "@/api";
import type { FeaturedPlacement } from "@/api/admin/featured-schemas";
import { formatLagosDateTime } from "@/lib/format";

/* The featured films screen's rules, kept apart from the page so they are unit-tested. */

/** The home page shows at most five */
export const FEATURED_MAX = 5;

/** Why a placement isn't on the home page right now, in words; null when it is */
export function hiddenText(placement: FeaturedPlacement): string | null {
  switch (placement.hiddenReason) {
    case null:
      return null;
    case "ENDED":
      return "Ended";
    case "NOT_STARTED":
      return `Starts ${formatLagosDateTime(placement.startsAt)}`;
    case "FILM_NOT_PUBLIC":
      return "Hidden: the film is back to draft";
    case "NO_OPEN_SCREENING":
      return "Hidden: no screening open for booking";
    case "DATED_PLACEMENT_RUNNING":
      return "Hidden: a dated placement holds this position";
    case "FILM_SHOWN_HIGHER":
      return "Hidden: the film already shows higher up";
  }
}

/** The everyday lineup's films with one moved a place up (-1) or down (+1) */
export function moveInLineup(ids: readonly string[], id: string, by: -1 | 1): string[] {
  const from = ids.indexOf(id);
  const to = from + by;
  if (from < 0 || to < 0 || to >= ids.length) return [...ids];
  const next = [...ids];
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

/** The API's refusal of a featured change, in words */
export function featuredRefusal(error: unknown): string {
  const apiError = toApiError(error);
  if (apiError.is(ErrorCode.FEATURED_POSITION_TAKEN)) {
    return "Another dated placement holds that position for some of that time. Choose another position or other dates.";
  }
  if (apiError.is(ErrorCode.FEATURED_FILM_ALREADY_PLACED)) {
    return "That film is already featured for some of that time.";
  }
  if (apiError.is(ErrorCode.FEATURED_FILM_NOT_PUBLIC)) {
    return "Only an announced or published film can be featured.";
  }
  if (apiError.is(ErrorCode.VALIDATION_FAILED)) return apiError.messages.join(" ");
  return "The change couldn't be saved. Try again.";
}
