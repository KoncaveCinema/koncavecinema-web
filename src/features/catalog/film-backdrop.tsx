import Image from "next/image";
import { ViewTransition, type ReactNode } from "react";

import { filmArtTransition } from "./screening";

/**
 * The film page's opening: the wide still across the whole hero, with the title block set inside
 * it so the facts and actions are all in the first screen. The shade behind the text is a light,
 * translucent tint (the art stays visible) and the text carries a soft shadow for legibility.
 * The still is a shared element: a film card's image morphs into it on navigation.
 */
export function FilmBackdrop({
  slug,
  image,
  title,
  focus,
  children,
}: {
  slug: string;
  image: string;
  title: string;
  /** CSS object-position for the crop */
  focus?: string;
  children: ReactNode;
}) {
  return (
    <section className="relative isolate flex flex-col justify-end overflow-hidden pt-[42svh] pb-10 sm:min-h-[80svh] sm:pt-28 sm:pb-12 lg:min-h-[78svh] lg:pb-16">
      <div className="absolute inset-x-0 top-0 -z-20 h-[54svh] sm:h-full">
        <ViewTransition name={filmArtTransition(slug)}>
          <Image
            src={image}
            alt={`${title} still`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: focus ?? "center 25%" }}
          />
        </ViewTransition>
        {/* A flat dim over the whole still, so bright art still contrasts with white text */}
        <div aria-hidden="true" className="absolute inset-0 bg-black/30" />
      </div>
      {/* Shade: light under the header, a translucent tint behind the text, black only at the
          very bottom where the page continues */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(0_0_0/0.45)_0%,transparent_16%,transparent_32%,rgb(0_0_0/0.7)_46%,#000_56%)] sm:bg-[linear-gradient(180deg,rgb(0_0_0/0.45)_0%,transparent_22%,transparent_50%,rgb(0_0_0/0.7)_85%,#000_100%)] lg:bg-[linear-gradient(90deg,rgb(0_0_0/0.55)_0%,rgb(0_0_0/0.3)_35%,transparent_60%),linear-gradient(180deg,rgb(0_0_0/0.4)_0%,transparent_18%,transparent_62%,#000_100%)]"
      />
      <div className="relative mx-auto w-full max-w-360 px-5 [text-shadow:0_1px_2px_rgb(0_0_0/0.45),0_4px_28px_rgb(0_0_0/0.55)] sm:px-8 lg:px-16">
        {children}
      </div>
    </section>
  );
}
