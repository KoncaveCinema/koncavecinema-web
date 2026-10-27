"use client";

import {
  Film,
  HelpCircle,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Tv,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { FilmGrain, ScreenGlow } from "@/components/brand/atmosphere";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FAQS } from "@/lib/data";

const CATEGORIES = [
  { id: "all", label: "All Questions", icon: Sparkles },
  { id: "ticketing", label: "Ticketing & Passes", icon: Film },
  { id: "streaming", label: "Streaming & DRM", icon: Tv },
  { id: "kyc", label: "Privacy & Identity", icon: ShieldCheck },
  { id: "suites", label: "Private VIP Suites", icon: MessageSquare },
  { id: "concessions", label: "Chowdeck Concessions", icon: Utensils },
];

export default function HelpCenterPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background Atmosphere */}
      <Image
        src="/placeholder/hall-communal.jpg"
        alt="Cinema auditorium crowd"
        fill
        priority
        sizes="100vw"
        quality={75}
        className="pointer-events-none -z-30 object-cover object-top opacity-20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgb(7_7_7/0.75)_0%,rgb(7_7_7/0.92)_450px,#070707_800px,#070707_100%)]"
      />
      <ScreenGlow className="-z-10" showLine={false} />
      <FilmGrain className="-z-10" />

      {/* Main Container with generous header clearance */}
      <div className="relative mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8 lg:pt-36 lg:pb-28">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-4 border-brand/50 bg-black/60 px-3.5 py-1 text-brand backdrop-blur-md"
          >
            Knowledge Base &amp; FAQ
          </Badge>
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            How can we help you?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Everything you need to know about synchronized showtimes, cinema tiers, Chowdeck
            concessions, and our privacy architecture.
          </p>

          {/* Search Bar - Glassmorphism */}
          <div className="relative mx-auto mt-10 max-w-xl">
            <Search className="absolute top-4 left-5 size-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword (e.g., KYC, refund, DRM, Chowdeck)..."
              className="w-full rounded-full border border-white/14 bg-surface-1/90 py-3.5 pr-6 pl-14 text-sm text-foreground shadow-2xl backdrop-blur-2xl placeholder:text-muted-foreground/60 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold shadow-md transition-all duration-300 ${
                  isActive
                    ? "scale-105 bg-brand text-brand-foreground shadow-brand/20"
                    : "border border-white/10 bg-surface-1/80 text-muted-foreground backdrop-blur-md hover:border-white/20 hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* FAQ List - Powered by Shadcn/Radix Accordion */}
        <div className="mx-auto mt-12 max-w-3xl">
          {filteredFaqs.length === 0 ? (
            <div className="rounded-3xl border border-white/12 bg-surface-1/85 p-12 text-center shadow-xl backdrop-blur-xl">
              <HelpCircle className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-base font-semibold">
                No questions found matching your search.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try searching for a different keyword or reach out directly to our support team.
              </p>
              <Link
                href="/contact"
                className="mt-4 inline-block text-xs font-semibold text-brand hover:underline"
              >
                Contact Support Concierge →
              </Link>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFaqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="rounded-2xl border border-white/10 bg-surface-1/80 px-6 py-2 shadow-lg backdrop-blur-xl transition-all duration-300 data-[state=open]:border-brand/50 data-[state=open]:bg-surface-1/95"
                >
                  <AccordionTrigger className="text-base font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="border-t border-white/8 pt-4 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Still Have Questions CTA */}
        <div className="relative mx-auto mt-20 max-w-2xl overflow-hidden rounded-3xl border border-white/12 bg-surface-1/90 p-8 text-center shadow-2xl backdrop-blur-2xl sm:p-12">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <MessageSquare className="size-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Still have questions?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Our concierge team is available every day from 08:00 to 00:00 WAT.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              className="rounded-full bg-brand px-6 text-brand-foreground hover:bg-brand/90"
              asChild
            >
              <Link href="/contact">Send Direct Message</Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-white/20 bg-transparent px-6 hover:bg-white/10"
              asChild
            >
              <a
                href="https://wa.me/2348000000000?text=Hello%20Koncave%20Cinema%20Support"
                target="_blank"
                rel="noreferrer"
              >
                Chat on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
