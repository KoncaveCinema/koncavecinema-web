"use client";

import { ChevronUp } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/**
 * On phones the order summary lives in a bar fixed to the bottom: the total is always visible,
 * and tapping it opens the full summary. An optional action (the step's main button) sits beside
 * the total, within thumb reach.
 */
export function SummaryBar({
  label,
  total,
  action,
  children,
}: {
  label: string;
  total: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/90 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-w-0 items-center gap-2 text-left"
            aria-label="Show booking summary"
          >
            <span className="min-w-0">
              <span className="block truncate text-[0.7rem] text-white/50">{label}</span>
              <span className="block font-display text-xl font-extrabold tabular-nums">
                {total}
              </span>
            </span>
            <ChevronUp className="size-4 shrink-0 text-white/50" />
          </button>
          {action}
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85svh] overflow-y-auto rounded-t-3xl border-white/10 bg-surface-1 p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-0">
            <SheetTitle className="font-display text-lg font-extrabold">Your booking</SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-8">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
