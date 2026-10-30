"use client";

import { Ticket } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { screeningPhase } from "@/lib/screening-window";
import { formatMoney } from "@/lib/format";
import { useNow } from "@/hooks/use-now";

/**
 * The card's main action follows the screening: reserve ahead, "Join the lobby" once the doors
 * open, "Join now" while it plays. (Pass holders get "Enter the lobby" when accounts arrive.)
 */
export function ScreeningCta({
  href,
  startTime,
  endTime,
  price,
}: {
  href: string;
  startTime: string;
  endTime: string;
  price: { amount: number; currency: string } | null;
}) {
  const now = useNow();
  const phase = now === null ? "upcoming" : screeningPhase({ startTime, endTime }, now);
  const urgent = phase === "lobby" || phase === "live";
  const amount = price ? formatMoney(price.amount, price.currency) : null;

  const label = phase === "live" ? "Join now" : phase === "lobby" ? "Join the lobby" : "Reserve";

  return (
    <Button asChild size="lg" variant={urgent ? "default" : "secondary"} className="w-full">
      <Link href={href}>
        <Ticket data-icon="inline-start" />
        {label}
        {amount && <span className="font-normal tabular-nums opacity-80">· from {amount}</span>}
      </Link>
    </Button>
  );
}
