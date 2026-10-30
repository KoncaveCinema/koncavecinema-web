"use client";

import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { env } from "@/env";
import { downloadIcs } from "@/lib/ics";
import { cn } from "@/lib/utils";

interface AddToCalendarProps {
  showtimeId: string;
  title: string;
  startTime: string;
  endTime: string;
  filmSlug: string;
  /** `icon` is a round icon button; `label` shows the text */
  appearance?: "icon" | "label";
  className?: string;
}

/**
 * Saves the showtime to the viewer's calendar with a reminder when the lobby opens, generated in
 * the browser. Stands in for showtime reminders until the API offers them.
 */
export function AddToCalendar({
  showtimeId,
  title,
  startTime,
  endTime,
  filmSlug,
  appearance = "icon",
  className,
}: AddToCalendarProps) {
  function download() {
    const url = `${env.NEXT_PUBLIC_APP_URL}/movies/${filmSlug}`;
    downloadIcs(
      {
        uid: `showtime-${showtimeId}`,
        title: `${title} · Koncave Cinema premiere`,
        start: startTime,
        end: endTime,
        description: `The lobby opens 30 minutes before the start. Your pass: ${url}`,
        url,
        location: "Koncave Cinema (online)",
        reminderMinutes: 30,
      },
      filmSlug,
    );
    toast.success("Added to your calendar", {
      description: "We'll remind you when the lobby opens.",
    });
  }

  if (appearance === "label") {
    return (
      <Button variant="glass" size="lg" onClick={download} className={className}>
        <CalendarPlus data-icon="inline-start" />
        Add to calendar
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="glass"
          size="icon-xl"
          onClick={download}
          className={cn("shrink-0", className)}
          aria-label={`Add ${title} to your calendar`}
        >
          <CalendarPlus />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Add to calendar</TooltipContent>
    </Tooltip>
  );
}
