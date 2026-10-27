"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import type { ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import { FAQ_CATEGORIES, FAQS, type FaqCategory } from "./content";

/*
 * The help centre's search (in the hero) and its filterable questions (below it) share state
 * through the URL (?q= and ?topic=), so a search can be linked to. Both read the URL on the
 * client, so the page wraps each in Suspense with the plain, unfiltered version as fallback
 * (FaqSearchFallback, FaqListFallback): the static HTML still carries every question.
 */

type Filter = FaqCategory | "all";

const FILTERS = ["all", ...FAQ_CATEGORIES.map((category) => category.id)] as const;

/** Each topic's accent: gold for money, blue for watching, green for privacy. */
const TONES: Record<FaqCategory, string> = {
  tickets: "bg-gold",
  watching: "bg-sky-400",
  privacy: "bg-lobby",
  suites: "bg-brand",
  concessions: "bg-orange-400",
};

const queryParser = parseAsString.withDefault("");
const filterParser = parseAsStringLiteral(FILTERS).withDefault("all");

function matches(query: string, filter: Filter) {
  const needle = query.trim().toLowerCase();
  return FAQS.filter(
    (faq) =>
      (filter === "all" || faq.category === filter) &&
      (!needle ||
        faq.question.toLowerCase().includes(needle) ||
        faq.answer.toLowerCase().includes(needle)),
  );
}

function FaqSearchField({
  value,
  onChange,
  hint,
}: {
  value?: string;
  onChange?: (value: string) => void;
  /** Result count under the field; the line keeps its height when empty, so nothing shifts */
  hint?: ReactNode;
}) {
  return (
    <>
      <label className="relative mx-auto block max-w-xl">
        <span className="sr-only">Search the help centre</span>
        <Search className="pointer-events-none absolute top-1/2 left-5 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={value}
          onChange={onChange && ((event) => onChange(event.target.value))}
          placeholder="Search: refunds, private suites, buffering…"
          className="h-14 w-full rounded-full border border-white/15 bg-black/50 pr-5 pl-12 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground/70 focus-visible:border-brand focus-visible:bg-black/70"
        />
      </label>
      <p aria-live="polite" className="mt-3 h-5 text-xs text-white/60">
        {hint}
      </p>
    </>
  );
}

/** The search bar as it renders before the URL is read: same size, so nothing shifts. */
export function FaqSearchFallback() {
  return <FaqSearchField />;
}

/** The search bar in the hero; results update in the list below. */
export function FaqSearch() {
  const [query, setQuery] = useQueryState("q", queryParser);
  const [filter] = useQueryState("topic", filterParser);
  const count = matches(query, filter).length;
  return (
    <FaqSearchField
      value={query}
      onChange={(value) => void setQuery(value || null)}
      hint={
        query.trim() && (
          <a href="#questions" className="hover:text-foreground">
            {count === 1 ? "1 answer" : `${count} answers`} below ↓
          </a>
        )
      }
    />
  );
}

function FaqList({
  query = "",
  filter = "all",
  onFilter,
}: {
  query?: string;
  filter?: Filter;
  onFilter?: (filter: Filter) => void;
}) {
  const faqs = matches(query, filter);
  const chips = [{ id: "all", label: "All" } as const, ...FAQ_CATEGORIES];

  return (
    <div>
      <div role="group" aria-label="Filter by topic" className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = filter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={active}
              onClick={() => onFilter?.(chip.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                active
                  ? "border-white bg-white text-black"
                  : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground",
              )}
            >
              {chip.id !== "all" && (
                <span aria-hidden="true" className={cn("size-2 rounded-full", TONES[chip.id])} />
              )}
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 border-t border-white/10">
        {faqs.length === 0 ? (
          <div className="py-14">
            <p className="font-display text-xl font-extrabold">No answers match that search.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try another word, or{" "}
              <Link href="/contact" className="text-foreground underline decoration-brand">
                ask us directly
              </Link>
              .
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible>
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="last:border-b">
                <AccordionTrigger className="gap-4 py-6 text-base font-semibold hover:text-foreground data-[state=open]:text-foreground sm:text-lg">
                  <span className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className={cn("mt-2.5 size-2 shrink-0 rounded-full", TONES[faq.category])}
                    />
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="max-w-2xl pb-7 pl-6 text-[0.95rem] leading-relaxed text-white/68">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}

/** Every question, unfiltered: the static HTML until the URL is read. */
export function FaqListFallback() {
  return <FaqList />;
}

/** The topic chips and questions, filtered by the URL's search and topic. */
export function FaqBrowser() {
  const [query] = useQueryState("q", queryParser);
  const [filter, setFilter] = useQueryState("topic", filterParser);
  return (
    <FaqList
      query={query}
      filter={filter}
      onFilter={(next) => void setFilter(next === "all" ? null : next)}
    />
  );
}
