import { cn } from "@/lib/utils";

/*
 * Theatre atmosphere layers, drawn entirely in CSS (no images, no JavaScript). Place inside a
 * `relative` container; every layer ignores pointer events and is hidden from assistive tech.
 */

/**
 * One cone of light hanging from its apex at the top (drawn by the `spotlight-cone` utility in
 * globals.css) and swung slowly by a transform-only animation. `spread` and `intensity` are
 * defaults: a parent can override every cone inside it with the `--cone-spread` and
 * `--cone-intensity` variables, e.g. `className="[--cone-spread:14deg]"`.
 */
function Cone({
  left,
  top = "-10%",
  height,
  spread,
  from,
  to,
  delay = "0s",
  duration,
  intensity,
  fade,
  cut,
}: {
  left: string;
  top?: string;
  height: string;
  /** Default half-angle of the beam in degrees: the larger it is, the wider the far end */
  spread: number;
  from: string;
  to: string;
  delay?: string;
  duration?: string;
  /** Default opacity of the light at the core of the beam */
  intensity: number;
  /** How far below the apex the beam reaches full strength (default 24%; small = visible source) */
  fade?: string;
  /** Trims the pointed tip: the beam starts this far below the apex (e.g. "30px") */
  cut?: string;
}) {
  return (
    <div
      className="absolute spotlight-cone animate-cone-sway will-change-transform"
      style={
        {
          left,
          top,
          height,
          animationDelay: delay,
          ...(duration && { animationDuration: duration }),
          "--cone-from": from,
          "--cone-to": to,
          "--cone-default-spread": `${spread}deg`,
          "--cone-default-intensity": intensity,
          ...(fade && { "--cone-fade": fade }),
          ...(cut && { "--cone-cut": cut }),
        } as React.CSSProperties
      }
    />
  );
}

/**
 * Two spotlight cones sweeping slowly from above, as in a premiere hall. The layer blends in
 * screen mode, so whatever the light passes over (art, type, cards) is genuinely lit. Place it
 * after the content it should light. Widen or brighten with `[--cone-spread:12deg]` or
 * `[--cone-intensity:0.3]` in `className`.
 */
export function Spotlights({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen",
        className,
      )}
    >
      <Cone
        left="58%"
        top="-20%"
        height="145%"
        spread={9}
        from="-7deg"
        to="3deg"
        intensity={0.28}
      />
      <Cone
        left="78%"
        top="-20%"
        height="135%"
        spread={8}
        from="6deg"
        to="-4deg"
        delay="-6s"
        intensity={0.22}
      />
    </div>
  );
}

/** A single spotlight trained on the centre of its container (holding pages, the 404). */
export function Spotlight({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen",
        className,
      )}
    >
      <Cone
        left="50%"
        top="-15%"
        height="125%"
        spread={14}
        from="-3deg"
        to="3deg"
        intensity={0.2}
      />
    </div>
  );
}

/** Crimson stage glow (#970001) pooling behind the key art. */
export function CrimsonHalo({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        background:
          "radial-gradient(60% 70% at 72% 45%, rgb(151 0 1 / 0.55), transparent 70%)," +
          "radial-gradient(40% 40% at 85% 100%, rgb(214 2 17 / 0.25), transparent 70%)",
      }}
    />
  );
}

/** Very fine film grain over dark imagery; a 1 KB SVG tile, static. */
export function FilmGrain({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

/** A row of film sprocket holes, used as a divider and on the "how it works" strip. */
export function Sprockets({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-3 w-full", className)}
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, transparent 0 10px, currentColor 10px 24px, transparent 24px 34px)",
        mask: "linear-gradient(to bottom, transparent 0 2px, #000 2px calc(100% - 2px), transparent calc(100% - 2px))",
        borderRadius: 3,
      }}
    />
  );
}

/* Dust motes along the beam's path */
const DUST = [
  { left: "14%", top: "24%", delay: "0s", duration: "9s", x: "14px" },
  { left: "19%", top: "38%", delay: "-3s", duration: "11s", x: "-10px" },
  { left: "24%", top: "52%", delay: "-6s", duration: "10s", x: "8px" },
  { left: "17%", top: "46%", delay: "-1.5s", duration: "12s", x: "-14px" },
  { left: "29%", top: "64%", delay: "-8s", duration: "9.5s", x: "10px" },
  { left: "33%", top: "76%", delay: "-4.5s", duration: "13s", x: "-6px" },
];

/**
 * A projector beam slanting across a whole section, swaying slowly, with dust drifting through
 * it. It stays in view while its section scrolls past and, like the spotlights, lights what it
 * crosses. Place it after the section's content. Widen it with `[--cone-spread:16deg]`.
 */
export function ProjectorBeam({
  className,
  side = "left",
}: {
  className?: string;
  side?: "left" | "right";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-clip mix-blend-screen",
        side === "right" && "-scale-x-100",
        className,
      )}
    >
      <div className="sticky top-0 h-svh max-h-full">
        <Cone
          left="4%"
          top="12%"
          height="150%"
          spread={13}
          from="-36deg"
          to="-24deg"
          duration="18s"
          intensity={0.13}
          fade="0%"
          cut="50px"
        />
        {DUST.map((mote) => (
          <span
            key={mote.left + mote.top}
            className="absolute size-0.5 rounded-full bg-white/50"
            style={
              {
                left: mote.left,
                top: mote.top,
                animation: `dust ${mote.duration} linear ${mote.delay} infinite`,
                "--dust-x": mote.x,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

/** Light spilling down from the top edge, as if from a cinema screen above the section. */
export function ScreenGlow({
  className,
  showLine = false,
}: {
  className?: string;
  showLine?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-x-0 top-0 h-96", className)}
    >
      {showLine && (
        <div className="mx-auto h-px w-2/3 max-w-4xl bg-linear-to-r from-transparent via-white/45 to-transparent" />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(45% 100% at 50% 0%, rgb(255 255 255 / 0.07), transparent 70%)," +
            "radial-gradient(30% 60% at 50% 0%, rgb(214 2 17 / 0.12), transparent 70%)",
        }}
      />
    </div>
  );
}

/**
 * Three rows of auditorium seat backs in silhouette against a crimson stage glow, rising from
 * the bottom edge. Each row is one SVG pattern, so it stays tiny at any width.
 */
export function SeatRows({ className }: { className?: string }) {
  // Back to front: each row is larger and covers the lower half of the row behind it
  const rows = [
    { y: 150, w: 42, h: 46, shift: 0, rim: 0.28 },
    { y: 178, w: 54, h: 58, shift: 21, rim: 0.4 },
    { y: 214, w: 70, h: 80, shift: 8, rim: 0.55 },
  ];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 290"
      preserveAspectRatio="xMidYMax slice"
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 h-64 w-full sm:h-72",
        className,
      )}
      // Vignette as a mask, not a dark overlay: the sides, top and bottom fade to transparent, so
      // the rows melt into whatever is behind them with no visible edge
      style={{
        maskImage:
          "radial-gradient(ellipse 62% 95% at 50% 78%, #000 35%, transparent 100%)," +
          "linear-gradient(to bottom, transparent, #000 25%, #000 70%, transparent)",
        maskComposite: "intersect",
      }}
    >
      <defs>
        {/* Even across the width and transparent at the top edge, so it melts into the page */}
        <linearGradient id="seat-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(151 0 1)" stopOpacity="0" />
          <stop offset="0.5" stopColor="rgb(151 0 1)" stopOpacity="0.22" />
          <stop offset="0.75" stopColor="rgb(214 2 17)" stopOpacity="0.16" />
          <stop offset="1" stopColor="rgb(0 0 0)" stopOpacity="0" />
        </linearGradient>
        {rows.map((row, index) => (
          <pattern
            key={row.y}
            id={`seat-row-${index}`}
            x={row.shift}
            y={row.y}
            width={row.w}
            height={row.h}
            patternUnits="userSpaceOnUse"
          >
            <rect
              x={row.w * 0.07}
              y="0.5"
              width={row.w * 0.86}
              height={row.h}
              rx={row.w * 0.3}
              fill="#070707"
              stroke={`rgb(214 2 17 / ${row.rim})`}
            />
          </pattern>
        ))}
      </defs>
      <rect width="1440" height="290" fill="url(#seat-glow)" />
      {rows.map((row, index) => (
        <rect
          key={row.y}
          y={row.y}
          width="1440"
          height={290 - row.y}
          fill={`url(#seat-row-${index})`}
        />
      ))}
    </svg>
  );
}

/** A slowly turning circular seal of text around the brand mark. */
export function RotatingSeal({
  text,
  className,
  children,
}: {
  text: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative grid size-36 place-items-center", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="absolute inset-0 size-full animate-[spin-slow_36s_linear_infinite]"
      >
        <defs>
          <path id="seal-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <circle cx="100" cy="100" r="96" fill="none" stroke="rgb(255 255 255 / 0.12)" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="rgb(214 2 17 / 0.45)" />
        <text
          fill="rgb(255 255 255 / 0.75)"
          fontSize="13.5"
          fontWeight="700"
          letterSpacing="4.2"
          style={{ textTransform: "uppercase" }}
        >
          <textPath href="#seal-path">{text}</textPath>
        </text>
      </svg>
      {children}
    </div>
  );
}
