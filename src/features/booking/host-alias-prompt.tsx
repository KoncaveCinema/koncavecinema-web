"use client";

import { UserRound } from "lucide-react";
import { toast } from "sonner";

import { ScreenAliasForm } from "@/features/auth/screen-alias-form";
import { useSession } from "@/features/auth/session";

/**
 * A suite host without a screen alias: their guests' invite page would say "Your host", so the
 * host is asked for a name beside their invite links. Shows nothing once they have one.
 */
export function HostAliasPrompt() {
  const hasAlias = useSession((state) => Boolean(state.user?.publicScreenAlias));
  if (hasAlias) return null;

  return (
    <section
      aria-labelledby="host-alias-title"
      className="rounded-3xl border border-white/10 bg-surface-1 p-6 sm:p-8"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/6 text-white/70">
          <UserRound className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="host-alias-title" className="font-display text-xl font-extrabold">
            Add your name so your guests know it&rsquo;s you
          </h2>
          <p className="mt-1 text-sm text-white/60">
            Your invite shows &ldquo;Your host&rdquo; until you choose a screen alias.
          </p>
        </div>
      </div>
      <div className="mt-5">
        <ScreenAliasForm
          id="host-alias"
          submitLabel="Save my name"
          help="Shown on your invite and to everyone in your suite."
          onSaved={() => toast.success("Your guests will see your name")}
        />
      </div>
    </section>
  );
}
