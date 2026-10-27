import { ArrowRight, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CrimsonHalo } from "@/components/brand/atmosphere";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL } from "@/features/support/content";
import {
  FaqBrowser,
  FaqListFallback,
  FaqSearch,
  FaqSearchFallback,
} from "@/features/support/faq-browser";

export const metadata: Metadata = {
  title: "Help centre",
  description:
    "Answers about Koncave premieres: tickets and payment, watching and devices, private suites, privacy and concessions.",
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  return (
    <>
      <PageHero
        image="/placeholder/hall-communal.jpg"
        imagePosition="center 30%"
        eyebrow="Help centre"
        title={
          <>
            How can we <span className="text-outline">help?</span>
          </>
        }
        description={<p>Quick answers about tickets, watching, private suites and your privacy.</p>}
      >
        <Suspense fallback={<FaqSearchFallback />}>
          <FaqSearch />
        </Suspense>
      </PageHero>

      <section
        id="questions"
        aria-label="Questions and answers"
        className="relative isolate scroll-mt-24 pt-10 pb-24 sm:pt-14 sm:pb-32 lg:pt-16"
      >
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <Suspense fallback={<FaqListFallback />}>
            <FaqBrowser />
          </Suspense>

          {/* Closing panel: the last stop for anyone the answers above didn't help */}
          <div className="relative isolate mt-12 overflow-hidden rounded-3xl border border-white/10 bg-surface-1 p-8 sm:flex sm:items-center sm:justify-between sm:gap-10 sm:p-10">
            <CrimsonHalo className="-z-10 opacity-60" />
            <div>
              <p className="font-display text-2xl leading-tight font-extrabold sm:text-3xl">
                Still need a hand?
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                Send us a message and a real person from the Koncave team will get back to you.
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="size-4" />
                {SUPPORT_EMAIL}
              </a>
            </div>
            <Button asChild size="xl" className="mt-6 shrink-0 sm:mt-0">
              <Link href="/contact">
                Contact us
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
