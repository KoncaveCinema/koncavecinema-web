"use client";

import { Clapperboard, FileText, Lock, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { FilmGrain } from "@/components/brand/atmosphere";
import { Badge } from "@/components/ui/badge";
import { LEGAL_DOCS } from "@/lib/data";

export interface TocItem {
  id: string;
  title: string;
}

export interface LegalPageShellProps {
  title: string;
  subtitle: string;
  effectiveDate: string;
  lastUpdated: string;
  version: string;
  toc: TocItem[];
  children: ReactNode;
  activePath?: string;
}

export function LegalPageShell({
  title,
  subtitle,
  effectiveDate,
  lastUpdated,
  version,
  toc,
  children,
  activePath,
}: LegalPageShellProps) {
  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      {/* Pure ambient cinema atmosphere - completely free of image placeholders or grey boxes */}
      <div className="pointer-events-none absolute inset-0 -z-30 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-140 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgb(151_0_1/0.18),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(7_7_7/0.5)_0%,#070707_350px,#070707_100%)]"
        />
        <FilmGrain />
      </div>

      {/* Main Container with generous fixed header offset */}
      <div className="relative mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-36 lg:pb-24">
        {/* Document Header */}
        <header className="mb-12 border-b border-white/8 pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-brand/40 bg-brand/10 text-brand">
              <Sparkles className="mr-1.5 size-3" />
              Policy Document
            </Badge>
            <Badge variant="secondary" className="border-white/10 bg-surface-2 text-xs">
              v{version}
            </Badge>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {subtitle}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/6 pt-4 text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground">Effective Date:</strong> {effectiveDate}
            </span>
            <span>
              <strong className="text-foreground">Last Revised:</strong> {lastUpdated}
            </span>
          </div>

          {/* Compliance Assurance Badges */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-1 px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-brand" />
              Privacy Conscious Architecture
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-1 px-3 py-1 text-xs text-muted-foreground">
              <Clapperboard className="size-3.5 text-brand" />
              NFVCB Classified Exhibitions
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-1 px-3 py-1 text-xs text-muted-foreground">
              <Lock className="size-3.5 text-brand" />
              Encrypted Multi-DRM Playback
            </span>
          </div>
        </header>

        {/* Content Body Grid: Two columns with sticky static sidebar */}
        <div className="grid gap-12 lg:grid-cols-[280px_1fr] lg:gap-14">
          {/* Static Left Aside: Sticks cleanly while the right content scrolls */}
          <aside className="sticky top-28 hidden max-h-[calc(100vh-8.5rem)] scrollbar-thin space-y-6 self-start overflow-y-auto pr-2 lg:block">
            {/* Table of Contents */}
            <div className="rounded-xl border border-white/8 bg-surface-1/40 p-4 backdrop-blur-sm">
              <h2 className="mb-3 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                Table of Contents
              </h2>
              <nav aria-label="Table of contents" className="space-y-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-white/6 hover:text-foreground"
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>

            {/* Related Policies Nav */}
            <div className="rounded-xl border border-white/8 bg-surface-1/40 p-4 backdrop-blur-sm">
              <h2 className="mb-3 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                Legal Documents
              </h2>
              <nav aria-label="Legal documents" className="space-y-1">
                {LEGAL_DOCS.map((doc) => {
                  const isCurrent = activePath === doc.href;
                  return (
                    <Link
                      key={doc.href}
                      href={doc.href}
                      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                        isCurrent
                          ? "bg-brand/10 font-semibold text-brand"
                          : "text-muted-foreground hover:bg-white/4 hover:text-foreground"
                      }`}
                    >
                      <FileText className="size-3 shrink-0" />
                      {doc.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Simple Contact Box */}
            <div className="rounded-xl border border-white/10 bg-surface-1/80 p-4 text-xs text-muted-foreground shadow-xl backdrop-blur-md">
              <p className="font-semibold text-foreground">Need Clarification?</p>
              <p className="mt-1 leading-relaxed">
                Our support team is available for all inquiries and policy questions.
              </p>
              <Link
                href="/contact"
                className="mt-3 inline-block font-medium text-brand hover:underline"
              >
                Contact Support →
              </Link>
            </div>
          </aside>

          {/* Main Article Content */}
          <article className="prose prose-invert prose-headings:scroll-mt-28 prose-headings:tracking-tight prose-headings:font-bold prose-h2:border-b prose-h2:border-white/8 prose-h2:pb-3 prose-h2:text-2xl prose-h3:text-lg prose-p:leading-relaxed prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-brand prose-a:no-underline hover:prose-a:underline max-w-none">
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
