import Image from "next/image";
import type { ReactNode } from "react";

import { CrimsonHalo, Spotlights } from "@/components/brand/atmosphere";

/**
 * The billboard stage: key art under the house-lights scrim, the crimson glow and the swaying
 * spotlights. Used by the home hero and the film pages.
 */
export function HeroStage({
  children,
  image,
  priority,
}: {
  children: ReactNode;
  image?: string;
  priority: boolean;
}) {
  return (
    <div className="relative isolate flex min-h-svh flex-col justify-end overflow-hidden pt-20 pb-28 sm:pb-28 lg:h-[88svh] lg:max-h-250 lg:min-h-180 lg:flex-row lg:items-center lg:pt-44 lg:pb-28">
      {image && (
        <div className="absolute inset-x-0 top-0 -z-30 h-[66svh] overflow-hidden sm:h-[72svh] lg:inset-0 lg:h-full">
          <Image
            src={image}
            alt=""
            fill
            priority={priority}
            fetchPriority={priority ? "high" : "low"}
            sizes="100vw"
            quality={75}
            className="animate-ken-burns object-cover object-[center_top] lg:object-[75%_35%]"
          />
          {/* Mobile bottom fade: dissolves the artwork smoothly into the dark bottom content area */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_50%,rgb(0_0_0/0.75)_80%,#000_100%)] lg:hidden"
          />
        </div>
      )}
      <CrimsonHalo className="-z-20 mix-blend-screen" />
      {/* House lights scrim: subtle top vignette for navbar, deep dark gradient at bottom for text contrast */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 animate-lights-dim bg-[linear-gradient(180deg,rgb(0_0_0/0.5)_0%,transparent_18%,rgb(0_0_0/0.15)_38%,rgb(0_0_0/0.88)_65%,#000_85%)] lg:bg-[linear-gradient(90deg,#000_0%,rgb(0_0_0/0.9)_28%,rgb(0_0_0/0.4)_55%,transparent_80%),linear-gradient(0deg,#000_0%,transparent_12%)]"
      />
      <div className="relative z-20 mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-16">{children}</div>
      {/* Above the copy and art, so the beams light what they pass over */}
      <Spotlights />
    </div>
  );
}
