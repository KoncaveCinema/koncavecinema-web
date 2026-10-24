"use client";

import { useEffect, useState, type ReactNode } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const SLIDE_MS = 9000;

/**
 * Rotating premiere billboard. The first slide is server-rendered (it holds the LCP image); the
 * others mount once the browser is idle, so they never compete with it. Advancing is driven by
 * the CSS progress animation (no JavaScript timers), pauses on hover, focus and off-screen tabs,
 * and is disabled for people who prefer reduced motion.
 */
export function HeroCarousel({ slides, labels }: { slides: ReactNode[]; labels: string[] }) {
  const [active, setActive] = useState(0);
  const [restMounted, setRestMounted] = useState(false);
  const [paused, setPaused] = useState(false);
  const autoplay = !usePrefersReducedMotion();

  useEffect(() => {
    const idle =
      window.requestIdleCallback ?? ((callback: () => void) => setTimeout(callback, 1200));
    const handle = idle(() => setRestMounted(true));
    return () => {
      if (typeof handle === "number" && window.cancelIdleCallback)
        window.cancelIdleCallback(handle);
    };
  }, []);

  const count = slides.length;
  const go = (index: number) => setActive(((index % count) + count) % count);

  return (
    <div
      className="relative"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(active + 1);
        if (event.key === "ArrowLeft") go(active - 1);
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured premieres"
    >
      {slides.map((slide, index) => {
        if (index > 0 && !restMounted) return null;
        const isActive = index === active;
        return (
          <div
            key={labels[index]}
            data-slide
            data-active={isActive}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}: ${labels[index]}`}
            inert={!isActive}
            className={cn(
              "transition-opacity duration-1000 ease-out",
              index === 0 ? "relative" : "absolute inset-0",
              isActive ? "z-10 opacity-100" : "z-0 opacity-0",
            )}
          >
            {slide}
          </div>
        );
      })}

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-16 z-20 mx-auto flex max-w-360 justify-end gap-2 px-5 sm:bottom-20 sm:px-8 lg:px-16">
          {labels.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => go(index)}
              aria-label={`Show ${label}`}
              aria-current={index === active ? "true" : undefined}
              className="group py-3"
            >
              <span className="block h-0.75 w-10 overflow-hidden rounded-full bg-white/25 transition-colors group-hover:bg-white/40 sm:w-14">
                <span
                  className={cn(
                    "block h-full origin-left rounded-full bg-brand",
                    index === active ? "" : "scale-x-0",
                  )}
                  style={
                    index === active && autoplay
                      ? {
                          animation: `progress-fill ${SLIDE_MS}ms linear forwards`,
                          animationPlayState: paused ? "paused" : "running",
                        }
                      : undefined
                  }
                  onAnimationEnd={() => go(active + 1)}
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
