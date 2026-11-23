import { cn } from "cn";
import { encode } from "uqr";

/**
 * A QR code drawn as one SVG path from the encoded grid (no canvas, no network, no injected
 * markup). Dark on white, as scanners and authenticator apps expect.
 */
export function QrCode({
  payload,
  label,
  className,
}: {
  payload: string;
  label: string;
  className?: string;
}) {
  const { data, size } = encode(payload, { border: 2, ecc: "M" });
  let path = "";
  data.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) path += `M${x} ${y}h1v1h-1z`;
    }),
  );
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={cn("size-full rounded-lg bg-white", className)}
    >
      <path d={path} fill="#000" />
    </svg>
  );
}
