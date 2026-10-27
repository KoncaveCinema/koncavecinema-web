import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { FilmGrain, ScreenGlow } from "@/components/brand/atmosphere";
import { cn } from "@/lib/utils";

import { LEGAL_DOCS, type LegalPath, type TocItem } from "./documents";
import { TocSpy } from "./toc-spy";

const ARTICLE_ID = "legal-document";
const TOC_ID = "legal-contents";

const eyebrow =
  "flex items-center gap-3 text-[0.7rem] font-bold tracking-[0.32em] text-brand uppercase";

function Contents({ toc, id }: { toc: TocItem[]; id?: string }) {
  return (
    <ol id={id} className="relative space-y-0.5 border-l border-white/8">
      {/* Fills down the rule to the bottom of the entry being read */}
      <span
        aria-hidden="true"
        className="absolute top-0 -left-px w-px bg-brand transition-[height] duration-300 ease-out"
        style={{ height: "var(--toc-fill, 0px)" }}
      />
      {toc.map((item, index) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            className="flex gap-3 py-1.5 pl-4 text-[0.8rem] leading-snug text-muted-foreground transition-colors hover:text-foreground data-current:text-foreground"
          >
            <span className="font-display text-[0.7rem] text-white/30 tabular-nums in-data-current:text-brand">
              {String(index + 1).padStart(2, "0")}
            </span>
            {item.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * The frame every policy page shares: header, contents (sticky on desktop, collapsible on
 * mobile), the document itself in long-form type, and links to the other policies.
 */
export function LegalPageShell({
  title,
  subtitle,
  effectiveDate,
  lastUpdated,
  toc,
  activePath,
  children,
}: {
  title: string;
  subtitle: string;
  effectiveDate: string;
  lastUpdated: string;
  toc: TocItem[];
  activePath: LegalPath;
  children: ReactNode;
}) {
  const others = LEGAL_DOCS.filter((doc) => doc.href !== activePath);

  return (
    <div className="relative isolate">
      <ScreenGlow className="-z-10" />
      <FilmGrain className="-z-10" />

      <div className="mx-auto max-w-360 px-5 pt-32 pb-24 sm:px-8 lg:px-16 lg:pt-40">
        <header className="max-w-3xl">
          <p className={eyebrow}>
            <span aria-hidden="true" className="h-px w-6 bg-brand" />
            Legal
          </p>
          <h1 className="mt-5 font-display text-[clamp(2.1rem,5vw,3.75rem)] leading-[1.02] font-black text-balance">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-white/70 sm:text-lg">
            {subtitle}
          </p>
          <p className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-xs tracking-wide text-muted-foreground">
            <span>
              Effective <span className="text-foreground">{effectiveDate}</span>
            </span>
            <span>
              Last updated <span className="text-foreground">{lastUpdated}</span>
            </span>
          </p>
        </header>

        {/* Mobile and tablet: contents fold away above the document */}
        <details className="group mt-10 rounded-xl border border-white/8 bg-white/2 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            On this page
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-5">
            <Contents toc={toc} />
          </div>
        </details>

        <div className="mt-12 grid gap-16 lg:mt-16 lg:grid-cols-[15rem_minmax(0,1fr)] xl:gap-24">
          <aside className="hidden lg:block">
            <div
              data-toc-scroller
              className="sticky top-28 scrollbar-none max-h-[calc(100svh-8rem)] space-y-10 overflow-y-auto pb-6"
            >
              <nav aria-label="On this page">
                <p className={cn(eyebrow, "mb-4 text-white/40")}>On this page</p>
                <Contents toc={toc} id={TOC_ID} />
              </nav>
              <nav aria-label="Other policies">
                <p className={cn(eyebrow, "mb-3 text-white/40")}>Other policies</p>
                <ul className="space-y-1">
                  {others.map((doc) => (
                    <li key={doc.href}>
                      <Link
                        href={doc.href}
                        className="text-[0.8rem] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {doc.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          <div className="min-w-0">
            <p className={cn(eyebrow, "mb-5 text-white/40")}>In short</p>
            <article id={ARTICLE_ID} className="legal-prose">
              {children}
            </article>

            <footer className="mt-20 max-w-[70ch] border-t border-white/8 pt-10">
              <p className="font-display text-xl font-extrabold">Questions about this policy?</p>
              <p className="mt-2 text-sm text-muted-foreground">
                If anything here is unclear, write to us and we will explain it.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
              >
                Contact us
                <ArrowRight className="size-4" />
              </Link>

              <ul className="mt-10 grid gap-3 sm:grid-cols-3">
                {others.map((doc) => (
                  <li key={doc.href}>
                    <Link
                      href={doc.href}
                      className="group flex h-full items-center justify-between gap-3 rounded-xl border border-white/8 px-4 py-3.5 text-sm transition-colors hover:border-white/20 hover:bg-white/3"
                    >
                      {doc.label}
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                    </Link>
                  </li>
                ))}
              </ul>
            </footer>
          </div>
        </div>
      </div>
      {/* Keyed by page, so moving between policies starts a fresh tracker */}
      <TocSpy key={activePath} articleId={ARTICLE_ID} navId={TOC_ID} />
    </div>
  );
}
