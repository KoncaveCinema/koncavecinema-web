"use client";

import { Eye } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** "Peek inside": opens the hall preview (rendered on the server and passed in as children). */
export function PeekInside({
  name,
  description,
  children,
}: {
  name: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="glass" size="sm" className="relative z-10">
          <Eye data-icon="inline-start" />
          Peek inside
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[min(94vw,52rem)] border-white/10 bg-surface-1 sm:max-w-[min(94vw,52rem)]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">{name}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
