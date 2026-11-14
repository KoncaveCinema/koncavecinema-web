"use client";

import { cn } from "cn";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

/** A month grid (react-day-picker), drawn in the app's own colours; no library stylesheet */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();
  return (
    <DayPicker
      data-slot="calendar"
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        root: cn("w-fit", defaults.root),
        months: "relative flex flex-col gap-4",
        month: "flex w-full flex-col gap-3",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous:
          "grid size-8 place-items-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30",
        button_next:
          "grid size-8 place-items-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-30",
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-sm font-semibold",
        weekdays: "flex",
        weekday: "w-9 text-[0.7rem] font-medium text-white/45",
        week: "mt-1 flex w-full",
        day: "relative size-9 p-0 text-center text-sm",
        day_button:
          "grid size-9 place-items-center rounded-md transition-colors outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-ring/50",
        selected:
          "[&>button]:bg-brand [&>button]:font-semibold [&>button]:text-white [&>button]:hover:bg-brand",
        today: "[&>button]:ring-1 [&>button]:ring-white/30",
        outside: "text-white/30",
        disabled: "pointer-events-none text-white/20",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className={cn("size-4", chevronClass)} />
          ) : (
            <ChevronRightIcon className={cn("size-4", chevronClass)} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
