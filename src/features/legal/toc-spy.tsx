"use client";

import { useEffect } from "react";

/**
 * Highlights the contents entry for the section being read. Like the home page's StepSpy it
 * writes data attributes straight onto server-rendered markup (no re-render); CSS does the rest.
 *
 * The current section comes from the scroll position on every frame that scrolls (the last
 * section whose top has passed a third of the way down the screen), not from intersection
 * events, so jumps from the contents links and page changes can't leave it stuck. The red rule
 * fills to the bottom of the highlighted entry. Mount it with a `key` per page.
 */
export function TocSpy({ articleId, navId }: { articleId: string; navId: string }) {
  useEffect(() => {
    const article = document.getElementById(articleId);
    const nav = document.getElementById(navId);
    if (!article || !nav) return;
    const sections = Array.from(article.querySelectorAll<HTMLElement>(":scope > section[id]"));
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a[href^='#']"));
    const scroller = nav.closest<HTMLElement>("[data-toc-scroller]");
    if (sections.length === 0) return;

    let current = -1;
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = window.innerHeight / 3;
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let index = 0;
      if (atBottom) index = sections.length - 1;
      else {
        sections.forEach((section, i) => {
          if (section.getBoundingClientRect().top <= line) index = i;
        });
      }
      if (index === current) return;
      current = index;

      links.forEach((link, i) => link.toggleAttribute("data-current", i === index));
      const link = links[index];
      if (!link) return;
      nav.style.setProperty("--toc-fill", `${link.offsetTop + link.offsetHeight}px`);
      // Keep the highlighted entry visible when the contents list is taller than its box
      if (scroller) {
        const top = nav.offsetTop + link.offsetTop - scroller.clientHeight / 2;
        scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [articleId, navId]);

  return null;
}
