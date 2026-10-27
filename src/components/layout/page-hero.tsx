import Image from "next/image";
import type { ReactNode } from "react";

import { CrimsonHalo, FilmGrain, Spotlights } from "@/components/brand/atmosphere";
import { cn } from "@/lib/utils";

/**
 * The opening band of an inner page (Help, Contact): darkened scene art under the house-lights
 * scrim, the crimson glow and the swaying spotlights, with centred copy. The image is the page's
 * largest paint, so it is preloaded.
 */
export function PageHero({
  image,
  imagePosition = "center",
  imageClassName = "opacity-60",
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  image: string;
  /** CSS object-position for the art */
  imagePosition?: string;
  /** How strongly the art shows through (dark scenes need more) */
  imageClassName?: string;
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  /** Extra content under the description: a search bar, a row of links */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative isolate flex min-h-[62svh] flex-col justify-center overflow-hidden px-5 pt-32 pb-24 sm:px-8 lg:min-h-[68svh] lg:px-16 lg:pt-40 lg:pb-28",
        className,
      )}
    >
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="100vw"
        className={cn("pointer-events-none -z-30 animate-ken-burns object-cover", imageClassName)}
        style={{ objectPosition: imagePosition }}
      />
      {/* Scrim: dark under the header, open in the middle, black into the page below */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(0deg,#000_0%,rgb(0_0_0/0.78)_35%,rgb(0_0_0/0.62)_65%,rgb(0_0_0/0.9)_100%)]"
      />
      <CrimsonHalo className="-z-10 opacity-60 mix-blend-screen" />
      <FilmGrain className="-z-10" />

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        <p className="flex items-center justify-center gap-3 text-[0.7rem] font-bold tracking-[0.32em] text-brand uppercase">
          <span aria-hidden="true" className="h-px w-6 bg-brand" />
          {eyebrow}
          <span aria-hidden="true" className="h-px w-6 bg-brand" />
        </p>
        <h1 className="mt-5 animate-rise font-display text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.9] font-black uppercase">
          {title}
        </h1>
        <div className="mx-auto mt-6 max-w-xl animate-rise text-base leading-relaxed text-pretty text-white/75 [animation-delay:120ms] sm:text-lg">
          {description}
        </div>
        {children && <div className="mt-9 animate-rise [animation-delay:220ms]">{children}</div>}
      </div>
      {/* Above the copy and art, so the beams light what they pass over */}
      <Spotlights />
      {/* Dissolves the art, glow and beams into the page below instead of ending on a hard edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-black sm:h-40"
      />
    </section>
  );
}
