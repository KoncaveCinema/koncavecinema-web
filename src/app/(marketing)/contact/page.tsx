import { ArrowRight, Clapperboard, LifeBuoy, Mail, Scale } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageHero } from "@/components/layout/page-hero";
import { ContactForm } from "@/features/support/contact-form";
import { SUPPORT_EMAIL } from "@/features/support/content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Get in touch with Koncave Cinema: ticket and playback support, filmmakers and producers, partnerships and press.",
  alternates: { canonical: "/contact" },
};

const ELSEWHERE = [
  {
    href: "/help",
    icon: LifeBuoy,
    tone: "bg-sky-400/12 text-sky-400",
    title: "Help centre",
    body: "Quick answers about tickets, watching and private suites.",
  },
  {
    href: "/producers",
    icon: Clapperboard,
    tone: "bg-gold/12 text-gold",
    title: "For filmmakers",
    body: "How premiering your film on Koncave works.",
  },
  {
    href: "/privacy",
    icon: Scale,
    tone: "bg-lobby/12 text-lobby",
    title: "Policies",
    body: "Terms, privacy, refunds and cookies.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        image="/placeholder/scene-aisle.jpg"
        imageClassName="opacity-100 brightness-125"
        eyebrow="Contact"
        title={
          <>
            Talk to <span className="text-outline">us</span>
          </>
        }
        description={
          <p>
            A question about a ticket, a film you&rsquo;d like to premiere, or a private screening
            for your team: tell us and we&rsquo;ll get back to you.
          </p>
        }
      >
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-white/30"
        >
          <Mail className="size-4 text-brand" />
          {SUPPORT_EMAIL}
        </a>
      </PageHero>

      <section
        aria-labelledby="message-title"
        className="relative isolate pt-12 pb-24 sm:pt-16 sm:pb-32 lg:pt-20"
      >
        <div className="mx-auto grid max-w-360 gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14 lg:px-16 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-3xl border border-white/10 bg-surface-1/90 p-6 sm:p-10">
            <h2 id="message-title" className="font-display text-2xl font-extrabold">
              Send a message
            </h2>
            <p className="mt-2 mb-8 text-sm text-muted-foreground">
              All fields except the subject are needed.
            </p>
            {/* Suspense: the form reads ?topic= on the client, so the page itself stays static */}
            <Suspense fallback={<div className="min-h-168" />}>
              <ContactForm />
            </Suspense>
          </div>

          <aside aria-label="Other ways to find answers" className="lg:pt-2">
            <p className="flex items-center gap-3 text-[0.7rem] font-bold tracking-[0.32em] text-white/40 uppercase">
              <span aria-hidden="true" className="h-px w-6 bg-white/30" />
              Looking for something else?
            </p>
            <ul className="mt-5 space-y-3">
              {ELSEWHERE.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex gap-4 rounded-2xl border border-white/8 p-5 transition-colors hover:border-white/20 hover:bg-white/3"
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        item.tone,
                      )}
                    >
                      <item.icon className="size-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                        {item.title}
                        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        {item.body}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
