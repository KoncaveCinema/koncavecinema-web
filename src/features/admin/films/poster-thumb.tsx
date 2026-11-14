import { Clapperboard } from "lucide-react";
import Image from "next/image";

import { isAllowedImage } from "@/lib/image-hosts";

/** A small poster beside the title: the list is scanned by eye as much as by name */
export function PosterThumb({ src, className }: { src: string | null; className?: string }) {
  return (
    <span
      className={`relative grid aspect-2/3 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-white/5 ring-1 ring-white/10 ${className ?? ""}`}
    >
      {/* A poster from a host we don't serve would break the whole list: the placeholder then */}
      {src && isAllowedImage(src) ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="36px"
          className="object-cover"
          unoptimized={src.startsWith("data:")}
        />
      ) : (
        <Clapperboard aria-hidden="true" className="size-3.5 text-white/30" />
      )}
    </span>
  );
}
