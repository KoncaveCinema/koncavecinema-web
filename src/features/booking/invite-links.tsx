"use client";

import { Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { env } from "@/env";

/**
 * A suite host's invite: the link to copy or send on WhatsApp, and the seats still free. Used on
 * the confirmation page and on the pass.
 */
export function InviteLinks({ code, seatsLeft }: { code: string; seatsLeft: number }) {
  const link = `${env.NEXT_PUBLIC_APP_URL}/invite/${code}`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6">
      <p className="font-display text-lg font-extrabold">Invite your guests</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Your suite has room for {seatsLeft} more. Share this link; each guest signs in and takes a
        seat.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <code className="flex-1 truncate rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm">
          {link}
        </code>
        <Button
          variant="glass"
          size="lg"
          className="h-12"
          onClick={() => {
            void navigator.clipboard.writeText(link).then(() => {
              setCopied(true);
              toast.success("Invite link copied");
            });
          }}
        >
          <Copy data-icon="inline-start" />
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button asChild variant="glass" size="lg" className="h-12">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Join my private screening on Koncave Cinema: ${link}`)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Share2 data-icon="inline-start" />
            WhatsApp
          </a>
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Invite code <span className="font-mono text-foreground">{code}</span>
      </p>
    </div>
  );
}
