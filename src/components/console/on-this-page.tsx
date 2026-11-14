"use client";

import { cn } from "cn";
import { useEffect, useState } from "react";

export interface PageSection {
  id: string;
  label: string;
}

/** The section being read: the first one crossing the band under the console's header */
function useSectionInView(ids: readonly string[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(ids[0]);
  const key = ids.join(" ");

  useEffect(() => {
    const sections = key
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (sections.length === 0) return;

    const visible = new Set<string>();
    const pick = () => {
      // At the very bottom a short last section never reaches the band: it is the one read
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const current = atBottom
        ? sections.at(-1)?.id
        : sections.find((section) => visible.has(section.id))?.id;
      if (current) setActive(current);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        pick();
      },
      // A band from just under the sticky header to 40% down the screen
      { rootMargin: "-96px 0px -60% 0px" },
    );
    for (const section of sections) observer.observe(section);
    window.addEventListener("scroll", pick, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", pick);
    };
  }, [key]);

  return active;
}

/** A page's sections beside it, the one in view marked as the reader scrolls */
export function OnThisPage({ sections }: { sections: readonly PageSection[] }) {
  const active = useSectionInView(sections.map((section) => section.id));
  return (
    <nav aria-label="On this page" className="hidden lg:block">
      <ul className="sticky top-24 space-y-1 border-l border-white/10 text-sm">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={section.id === active ? "location" : undefined}
              className={cn(
                "-ml-px block border-l py-1 pl-4 transition-colors",
                section.id === active
                  ? "border-brand text-foreground"
                  : "border-transparent text-white/50 hover:border-white/40 hover:text-foreground",
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
