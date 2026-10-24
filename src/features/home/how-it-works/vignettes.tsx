import {
  Check,
  Crown,
  CupSoda,
  IceCreamCone,
  Popcorn,
  ShoppingBag,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import type { CSSProperties } from "react";

import { LiveDot } from "@/components/cinema/live-dot";
import { cn } from "@/lib/utils";

import { LobbyCountdown } from "./client";

/** Pieces of a preview arrive one after another as the step scrolls in. */
const arrive = (index: number, animation?: "drop-in"): CSSProperties => ({
  animationRangeStart: `entry ${10 + index * 12}%`,
  animationRangeEnd: `cover ${36 + index * 6}%`,
  ...(animation && ({ "--vignette-animation": animation } as CSSProperties)),
});

/* Small interface previews: each step shows a piece of the product rather than an icon. */

export function ShowtimeVignette() {
  const times = [
    { day: "Fri", time: "8:00 PM", active: true },
    { day: "Sat", time: "7:30 PM" },
    { day: "Sun", time: "6:00 PM" },
  ];
  return (
    <div className="flex flex-wrap gap-2.5">
      {times.map((slot, index) => (
        <span
          key={slot.day}
          style={arrive(index)}
          className={cn(
            "flex vignette-item flex-col rounded-xl border px-6 py-3 text-center ticket-stub",
            slot.active
              ? "border-brand bg-brand/15 shadow-[0_10px_30px_-12px_rgb(214_2_17/0.7)]"
              : "border-white/10 bg-white/3",
          )}
        >
          <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-white/50 uppercase">
            {slot.day}
          </span>
          <span className="text-base font-bold tabular-nums">{slot.time}</span>
        </span>
      ))}
    </div>
  );
}

export function AuditoriumVignette() {
  const halls = [
    { icon: User, label: "Solo", seats: "Just you" },
    { icon: Users, label: "Public hall", seats: "With the fans", active: true },
    { icon: Sparkles, label: "Suite", seats: "Up to 5" },
    { icon: Crown, label: "Suite", seats: "Up to 10" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {halls.map((hall, index) => (
        <span
          key={hall.seats}
          style={arrive(index)}
          className={cn(
            "relative flex vignette-item flex-col gap-3 rounded-2xl border p-3.5",
            hall.active
              ? "border-brand bg-brand/12 shadow-[0_10px_30px_-12px_rgb(214_2_17/0.7)]"
              : "border-white/10 bg-white/3 text-white/70",
          )}
        >
          <hall.icon className="size-4.5" aria-hidden="true" />
          <span>
            <span className="block text-sm font-semibold">{hall.label}</span>
            <span className="block text-xs text-white/50">{hall.seats}</span>
          </span>
          {hall.active && (
            <Check
              aria-hidden="true"
              className="absolute top-3 right-3 size-5 rounded-full bg-brand p-1 text-white"
            />
          )}
        </span>
      ))}
    </div>
  );
}

export function SnackVignette() {
  const items = [
    { icon: Popcorn, label: "Popcorn" },
    { icon: CupSoda, label: "Drink" },
    { icon: IceCreamCone, label: "Ice cream" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/3 p-4">
      <span className="grid size-12 place-items-center rounded-full border border-gold/30 bg-gold/10 text-gold">
        <ShoppingBag className="size-5" aria-hidden="true" />
      </span>
      <ul className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <li
            key={item.label}
            style={arrive(index, "drop-in")}
            className="inline-flex vignette-item items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold"
          >
            <item.icon className="size-3.5 text-gold" aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
      <span className="ml-auto rounded-full border border-gold/40 px-2.5 py-0.5 text-[0.65rem] font-bold tracking-[0.16em] text-gold uppercase">
        Coming soon
      </span>
    </div>
  );
}

export function LobbyVignette() {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/3 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-lobby/40 bg-lobby/10 px-3 py-1 text-xs font-semibold">
          <LiveDot tone="lobby" pulse />
          Lobby open
        </span>
        <span className="font-display text-3xl font-black tabular-nums">
          <LobbyCountdown />
        </span>
        <span className="text-xs text-muted-foreground">until the film starts</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-2/3 rounded-full bg-linear-to-r from-lobby to-lobby/60" />
      </div>
    </div>
  );
}
