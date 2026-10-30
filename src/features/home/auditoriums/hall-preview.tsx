import { Mic, MicOff, Pause, ShieldCheck, UserPlus, Volume2 } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import type { TicketTier } from "@/types/domain";

/*
 * Faithful previews of each hall's interface, in plain HTML and CSS, for the "Peek inside"
 * dialog. Sample names only; the real screening room arrives in Phases F5 and F7.
 */

function Screen({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-black", className)}>
      <Image
        src="/placeholder/film-ember-and-ash.jpg"
        alt=""
        fill
        sizes="(min-width: 768px) 40rem, 90vw"
        className="object-cover opacity-90"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-linear-to-t from-black/90 to-transparent px-4 pt-10 pb-3 text-[0.65rem] text-white/80">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-live px-2 py-0.5 font-bold text-white">
          LIVE
        </span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-[38%] bg-brand" />
        </div>
        <span className="tabular-nums">0:44:12</span>
        <Volume2 className="size-3.5" />
        <span className="rounded border border-white/30 px-1">HD</span>
      </div>
    </div>
  );
}

const CHAT = [
  { alias: "LagosLens", text: "This score is giving goosebumps 🔥" },
  { alias: "AmakaWatches", text: "No way she's going back in there 😭" },
  { alias: "TundeInToronto", text: "Watching from Toronto, the whole family is here!" },
  { alias: "CinemaKing_99", text: "Plot twist loading… 👀" },
];

function PublicHall() {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_15rem]">
      <div className="relative">
        <Screen className="aspect-video" />
        {/* Emoji applause floating up the screen */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-6 bottom-12 flex flex-col gap-1 text-xl"
        >
          {["👏", "🔥", "😂"].map((emoji, index) => (
            <span
              key={emoji}
              className="animate-rise opacity-0"
              style={{
                animationDelay: `${index * 450}ms`,
                animationIterationCount: "infinite",
                animationDuration: "2.4s",
              }}
            >
              {emoji}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col rounded-xl border border-white/10 bg-surface-2 text-xs">
        <p className="flex items-center justify-between border-b border-white/8 px-3 py-2.5 font-semibold">
          Hall 3 chat <span className="font-normal text-muted-foreground">842 here</span>
        </p>
        <ul className="flex-1 space-y-2.5 p-3">
          {CHAT.map((message) => (
            <li key={message.alias}>
              <span className="inline-flex items-center gap-1 font-semibold text-white">
                {message.alias}
                <ShieldCheck className="size-3 text-lobby" aria-label="Verified attendee" />
              </span>
              <p className="text-white/70">{message.text}</p>
            </li>
          ))}
        </ul>
        <p className="m-3 mt-0 rounded-full border border-white/10 px-3 py-2 text-white/40">
          Say something to the hall…
        </p>
      </div>
    </div>
  );
}

const GUESTS = [
  { initials: "AO", name: "Ada (host)", speaking: true, muted: false },
  { initials: "KB", name: "Kunle", speaking: false, muted: false },
  { initials: "ZE", name: "Zee", speaking: true, muted: false },
  { initials: "FM", name: "Femi", speaking: false, muted: true },
  { initials: "NO", name: "Ngozi", speaking: false, muted: false },
];

const MORE_GUESTS = [
  { initials: "TB", name: "Tobi", speaking: false, muted: false },
  { initials: "CH", name: "Chi", speaking: false, muted: false },
  { initials: "SM", name: "Seun", speaking: true, muted: false },
  { initials: "HY", name: "Halima", speaking: false, muted: false },
  { initials: "IB", name: "Ibrahim", speaking: false, muted: true },
];

function PrivateSuite({ seats }: { seats: 5 | 10 }) {
  const guests = seats === 10 ? [...GUESTS, ...MORE_GUESTS] : GUESTS;
  return (
    <div className="space-y-3">
      <Screen className="aspect-video" />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-surface-2 p-3">
        <ul className="flex flex-wrap gap-2" aria-label="Guests in the suite">
          {guests.map((guest, index) => (
            <li key={`${guest.initials}-${index}`} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "relative grid size-10 place-items-center rounded-full bg-surface-3 text-xs font-bold",
                  guest.speaking && "ring-2 ring-lobby ring-offset-2 ring-offset-surface-2",
                )}
              >
                {guest.initials}
                {guest.muted && (
                  <MicOff
                    className="absolute -right-1 -bottom-1 size-4 rounded-full bg-brand p-0.5"
                    aria-label="Muted"
                  />
                )}
              </span>
              <span className="text-[0.6rem] text-muted-foreground">{guest.name}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-2">
            <Mic className="size-3.5" /> Mute all
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-2">
            <Pause className="size-3.5" /> Pause for everyone
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-2 font-semibold">
            <UserPlus className="size-3.5" /> Invite
          </span>
        </div>
      </div>
    </div>
  );
}

export function HallPreview({ tier }: { tier: TicketTier }) {
  switch (tier) {
    case "PUBLIC":
      return <PublicHall />;
    case "PRIVATE_5":
      return <PrivateSuite seats={5} />;
    case "PRIVATE_10":
      return <PrivateSuite seats={10} />;
    default:
      return (
        <div className="space-y-3">
          <Screen className="aspect-video" />
          <p className="text-center text-sm text-muted-foreground">
            Just you and the film: no chat, no pop-ups, nothing between you and the story.
          </p>
        </div>
      );
  }
}
