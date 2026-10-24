import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Infinite scrolling band. The list is rendered twice and the track slides by one copy, so it
 * loops seamlessly; the copy is hidden from assistive tech. CSS transform only.
 */
export function Ticker({
  items,
  label,
  separator,
  duration = 40,
  reverse = false,
  className,
  itemClassName,
}: {
  items: ReactNode[];
  label: string;
  separator: ReactNode;
  /** Seconds for one full loop */
  duration?: number;
  reverse?: boolean;
  className?: string;
  itemClassName?: string;
}) {
  // Short lists are repeated so a single copy is wider than any screen
  const filled = items.length < 8 ? [...items, ...items, ...items] : items;

  const list = (hidden: boolean) => (
    <ul
      aria-label={hidden ? undefined : label}
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center"
    >
      {filled.map((item, index) => (
        <li key={index} className={cn("flex items-center whitespace-nowrap", itemClassName)}>
          {item}
          <span aria-hidden="true" className="flex items-center">
            {separator}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div data-marquee className={cn("overflow-hidden", className)}>
      <div
        className="marquee-track"
        style={
          {
            "--marquee-duration": `${duration}s`,
            "--marquee-direction": reverse ? "reverse" : "normal",
          } as CSSProperties
        }
      >
        {list(false)}
        {list(true)}
      </div>
    </div>
  );
}
