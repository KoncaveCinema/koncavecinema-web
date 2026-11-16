"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { RouteError } from "@/components/states/route-error";
import { Button } from "@/components/ui/button";

/** The screening room broke while rendering: the dark theatre stays, with a retry and a way out */
export default function WatchError(props: { error: unknown; retry: () => void }) {
  return (
    <main id="main" className="grid min-h-svh place-items-center bg-black px-5">
      <div className="w-full max-w-lg">
        <RouteError {...props} />
        <div className="mt-6 flex justify-center">
          <Button asChild variant="ghost">
            <Link href="/dashboard/tickets">
              <ArrowLeft data-icon="inline-start" />
              My tickets
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
