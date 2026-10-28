import Image from "next/image";
import { ViewTransition, type ReactNode } from "react";

import { filmArtTransition } from "./screening";

/**
 * The film page's opening: the wide still under graded light, with the title block set inside it
 * so the facts and actions are all in the first screen. The still is a shared element: a film
 * card's image morphs into it on navigation.
 */
export function FilmBackdrop({
  slug,
  image,
  title,
  children,
}: {
  slug: string;
  image: string;
  title: string;
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
            className="object-cover object-[center_25%]"
          />
        </ViewTransition>
      </div>
      {/* Grade: dark under the header, black behind the text (below it on phones, left of it on
          wide screens) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(0_0_0/0.5)_0%,transparent_16%,transparent_32%,rgb(0_0_0/0.75)_46%,#000_56%)] sm:bg-[linear-gradient(180deg,rgb(0_0_0/0.55)_0%,transparent_22%,transparent_45%,rgb(0_0_0/0.9)_85%,#000_100%)] lg:bg-[linear-gradient(90deg,#000_0%,rgb(0_0_0/0.82)_32%,rgb(0_0_0/0.25)_62%,transparent_80%),linear-gradient(180deg,rgb(0_0_0/0.5)_0%,transparent_22%,transparent_70%,#000_100%)]"
      />
      <div className="relative mx-auto w-full max-w-360 px-5 sm:px-8 lg:px-16">{children}</div>
    </section>
  );
}
