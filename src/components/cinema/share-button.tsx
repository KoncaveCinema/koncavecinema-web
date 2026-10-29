"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/** Shares a page with the system share sheet where there is one, otherwise copies its link. */
export function ShareButton({ title, path }: { title: string; path: string }) {
  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  return (
    <Button
      type="button"
      size="icon-xl"
      variant="glass"
      aria-label={`Share ${title}`}
      onClick={() => void share()}
    >
      <Share2 />
    </Button>
  );
}
