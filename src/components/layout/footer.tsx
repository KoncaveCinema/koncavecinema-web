import { Clapperboard, ShieldCheck } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";

import { FOOTER_NAV } from "./navigation";

export function Footer() {
  return (
    <footer className="relative border-t border-white/8 bg-surface-1">
      <div className="mx-auto max-w-360 px-5 pt-16 pb-10 sm:px-8 lg:px-16">
        <div className="grid gap-12 sm:grid-cols-3 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div className="max-w-xs space-y-5 sm:col-span-3 lg:col-span-1">
            <Logo className="items-start" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              African stories, screened together. Scheduled premieres, synchronized for audiences at
              home and across the diaspora.
            </p>
            <ul className="flex flex-wrap gap-2" aria-label="Compliance">
              <li className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1 text-xs font-medium">
                <Clapperboard className="size-3.5 text-brand" />
                NFVCB classified films
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1 text-xs font-medium">
                <ShieldCheck className="size-3.5 text-brand" />
                NDPA privacy
              </li>
            </ul>
          </div>

          {FOOTER_NAV.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="mb-4 text-[0.7rem] font-bold tracking-[0.28em] uppercase">
                {group.title}
              </h2>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/8 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CurrentYear /> Koncave Cinema. Films classified by the NFVCB. Your data is protected
            under the Nigeria Data Protection Act.
          </p>
        </div>
      </div>
    </footer>
  );
}

/** The current year, cached for a day so footers stay part of the static shell. */
async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
