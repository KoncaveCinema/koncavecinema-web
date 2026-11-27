import Image from "next/image";

import { cn } from "@/lib/utils";

interface MarkProps {
  className?: string;
  /** Solid dark mark for light backgrounds */
  monochrome?: boolean;
}

/** The official Koncave Cinema icon / monogram */
export function LogoMark({ className, monochrome = false }: MarkProps) {
  return (
    <span className={cn("relative inline-block shrink-0", className)}>
      <Image
        src={monochrome ? "/koncave-icon-black.png" : "/koncave-icon.png"}
        alt=""
        // The largest it's drawn (48 px), so the browser fetches a small copy, not the full 1254 px
        width={48}
        height={48}
        className={cn("size-full object-contain", className)}
      />
    </span>
  );
}

interface WordmarkProps {
  className?: string;
  compact?: boolean;
}

export function LogoWordmark({ className }: WordmarkProps) {
  return <span className={cn("sr-only", className)}>Koncave Cinema</span>;
}

interface LogoProps {
  className?: string;
  variant?: "stacked" | "inline";
  /** Preload the image: only for the copy in the header, which is above the fold */
  priority?: boolean;
}

/** Official full brand logo from public/koncave-logo.png */
export function Logo({ className, variant = "stacked", priority = false }: LogoProps) {
  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <Image
        src="/koncave-logo.png"
        alt="Koncave Cinema"
        // The size it's drawn at (48 px high at most), so the browser fetches a small copy, not
        // the 3840-wide one
        width={83}
        height={48}
        priority={priority}
        className={cn(
          "w-auto object-contain transition-transform duration-300",
          variant === "inline" ? "h-9 sm:h-10" : "h-10 sm:h-12",
        )}
      />
    </span>
  );
}
